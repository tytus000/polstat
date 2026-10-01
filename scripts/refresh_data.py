"""Build the public, source-linked snapshot from Polish official publications."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import urllib.error
import urllib.request
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

from openpyxl import load_workbook


FIRST_YEAR = 2018
MINISTRY = "https://www.gov.pl"
BUDGET_PAGE = MINISTRY + "/web/finanse/sprawozdania-miesieczne-{year}"
DEBT_PAGE = MINISTRY + "/web/finanse/szeregiczasowe"
RATE_URL = "https://static.nbp.pl/dane/stopy/stopy_procentowe_archiwum.xml"

REVENUE_LABELS = {
    "tax": re.compile(r"^1\.\s*Dochody podatkowe", re.I),
    "nonTax": re.compile(r"^2\.\s*Dochody niepodatkowe", re.I),
    "eu": re.compile(r"^3\.\s*Środki z Unii Europejskiej", re.I),
}
SPENDING_KEYS = ("grants", "benefits", "operations", "capital", "debtService", "euContribution", "euProjects")
SPENDING_NUMBERS = {key: f"{number}." for number, key in enumerate(SPENDING_KEYS, start=1)}
ROMAN_MONTHS = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12}
MONTH_HEADER = re.compile(r"^I(?:\s*[-–]\s*(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II))?(?:\s*\*.*)?$", re.I)


class Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self.href: str | None = None
        self.label: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            self.href = dict(attrs).get("href")
            self.label = []

    def handle_data(self, data: str) -> None:
        if self.href is not None:
            self.label.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self.href:
            self.links.append((self.href, " ".join(" ".join(self.label).split())))
            self.href = None


def fetch(url: str) -> bytes:
    cache = Path(__file__).resolve().parents[1] / ".context/source-cache"
    cache.mkdir(parents=True, exist_ok=True)
    cache_path = cache / hashlib.sha256(url.encode()).hexdigest()
    immutable_attachment = "/attachment/" in url
    if immutable_attachment and cache_path.exists():
        return cache_path.read_bytes()
    request = urllib.request.Request(url, headers={"User-Agent": "Polstat/1.0 (+public data attribution)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                data = response.read()
            break
        except TimeoutError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    if not data:
        raise ValueError(f"Empty source: {url}")
    if immutable_attachment:
        cache_path.write_bytes(data)
    return data


def source_link(page: str, match: str) -> tuple[str, str | None]:
    parser = Links()
    parser.feed(fetch(page).decode("utf-8"))
    for href, label in parser.links:
        if match.lower() in label.lower() and ".xlsx" in label.lower():
            date_match = re.search(r"(?<!\d)(20\d{6})(?!\d)", label)
            publication = None
            if date_match:
                try:
                    publication = datetime.strptime(date_match.group(1), "%Y%m%d").date().isoformat()
                except ValueError:
                    pass
            return urllib.request.urljoin(MINISTRY, href), publication
    raise ValueError(f"No matching spreadsheet on {page}: {match}")


def sheet(workbook, title: str):
    return workbook[next(name for name in workbook.sheetnames if name.strip() == title)]


def number(value: object, *, scale: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Expected a numeric source cell, got {value!r}")
    return round(float(value) / scale, 6)


def blocks(worksheet) -> dict[int, tuple[list[tuple[object, ...]], int, int]]:
    rows = list(worksheet.iter_rows(values_only=True))
    headers: list[tuple[int, int, int]] = []
    for row_index, row in enumerate(rows):
        for col_index, value in enumerate(row):
            if col_index < 2 or not isinstance(value, str):
                continue
            match = MONTH_HEADER.fullmatch(value.strip())
            if match:
                month = ROMAN_MONTHS[match.group(1).upper()] if match.group(1) else 1
                headers.append((month, row_index, col_index))
    if not headers:
        raise ValueError(f"No monthly columns in {worksheet.title}")
    found = {}
    for month, row_index, col_index in headers:
        next_header = min((r for _, r, _ in headers if r > row_index + 2), default=len(rows))
        found[month] = (rows, row_index + 1, min(next_header, row_index + 50), col_index)
    return found


def cell_for_label(block, predicate, scale: float) -> float:
    rows, start, end, col = block
    for row in rows[start:end]:
        if predicate(row):
            return number(row[col], scale=scale)
    raise ValueError(f"Required metric missing near row {start + 1}")


def parse_budget(data: bytes, year: int, url: str, published_at: str | None) -> list[dict]:
    workbook = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    general = blocks(sheet(workbook, "TABLICA 1"))
    revenue = blocks(sheet(workbook, "TABLICA 3"))
    spending = blocks(sheet(workbook, "TABLICA 6"))
    months = sorted(
        month for month in set(general) & set(revenue) & set(spending)
        if any(
            isinstance(row[0], str) and re.match(r"^I\.\s*DOCHODY", row[0].strip(), re.I)
            and isinstance(row[general[month][3]], (int, float))
            for row in general[month][0][general[month][1]:general[month][2]]
        )
    )
    if months != list(range(1, max(months) + 1)):
        raise ValueError(f"Budget month gap in {year}: {months}")
    result = []
    for month in months:
        g, r, s = general[month], revenue[month], spending[month]
        by_general = lambda label: cell_for_label(
            g, lambda row: isinstance(row[0], str) and re.match(label, row[0].strip(), re.I), 1000
        )
        revenue_total = by_general(r"^I\.\s*DOCHODY")
        spending_total = by_general(r"^II\.\s*WYDATKI")
        balance = by_general(r"^III\.\s*DEFICYT")
        revenue_parts = {
            key: cell_for_label(r, lambda row, pattern=pattern: isinstance(row[0], str) and bool(pattern.match(row[0].strip())), 1000)
            for key, pattern in REVENUE_LABELS.items()
        }
        spending_parts = {}
        for key in SPENDING_KEYS:
            category_number = SPENDING_NUMBERS[key]
            spending_parts[key] = cell_for_label(
                s,
                lambda row, category_number=category_number: row[1] == category_number,
                1_000_000,
            )
        if abs(revenue_total - spending_total - balance) > 0.003:
            raise ValueError(f"Budget identity failed in {year}-{month:02d}")
        if abs(sum(revenue_parts.values()) - revenue_total) > 0.003:
            raise ValueError(f"Revenue categories do not reconcile in {year}-{month:02d}")
        residual = round(spending_total - sum(spending_parts.values()), 6)
        if abs(residual) > 0.003:
            if abs(residual) > spending_total * 0.005:
                raise ValueError(f"Spending categories do not reconcile in {year}-{month:02d}: {residual}")
            # The published 2019 table has a small difference between its total and seven displayed categories.
            spending_parts["sourceDifference"] = residual
        result.append({
            "period": f"{year}-{month:02d}", "revenue": revenue_total, "spending": spending_total,
            "balance": balance, "revenueCategories": revenue_parts, "spendingCategories": spending_parts,
            "unit": "PLN million", "sourceUrl": url, "publishedAt": published_at, "status": "reported_actual",
        })
    workbook.close()
    return result


def parse_debt(data: bytes, url: str, published_at: str | None) -> list[dict]:
    workbook = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    worksheet = workbook["zadłużenie wg instrumentów"]
    if "mln zł" not in str(worksheet["A1"].value) or worksheet["A3"].value != "Zadłużenie Skarbu Państwa":
        raise ValueError("Unexpected State Treasury debt workbook layout")
    dates = next(worksheet.iter_rows(min_row=2, max_row=2, values_only=True))
    values = next(worksheet.iter_rows(min_row=3, max_row=3, values_only=True))
    result = [
        {"period": period.strftime("%Y-%m"), "value": number(value, scale=1), "unit": "PLN million", "sourceUrl": url, "publishedAt": published_at, "status": "reported_actual"}
        for period, value in zip(dates[1:], values[1:])
        if isinstance(period, datetime) and period.year >= FIRST_YEAR and isinstance(value, (int, float))
    ]
    if not result or len({item["period"] for item in result}) != len(result):
        raise ValueError("Missing or duplicate State Treasury debt periods")
    for previous, current in zip(result, result[1:]):
        year, month = map(int, previous["period"].split("-"))
        next_year = year + 1 if month == 12 else year
        next_period = f"{next_year}-{month % 12 + 1:02d}"
        if current["period"] != next_period:
            raise ValueError(f"State Treasury debt month gap after {previous['period']}")
    workbook.close()
    return result


def parse_rates(data: bytes) -> list[dict]:
    root = ET.fromstring(data.decode("utf-8-sig"))
    result = []
    for change in root.findall("pozycje"):
        rate = next((item.get("oprocentowanie") for item in change.findall("pozycja") if item.get("id") == "ref"), None)
        effective = change.get("obowiazuje_od")
        if rate and effective:
            date.fromisoformat(effective)
            result.append({"effectiveDate": effective, "value": float(rate.replace(",", ".")), "unit": "percent", "sourceUrl": RATE_URL, "publishedAt": None, "status": "reported_actual"})
    if not result or result != sorted(result, key=lambda item: item["effectiveDate"]) or len({item["effectiveDate"] for item in result}) != len(result):
        raise ValueError("Invalid NBP reference rate chronology")
    return result


def build_snapshot(today: date | None = None) -> dict:
    today = today or date.today()
    retrieved_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    budget = []
    for year in range(FIRST_YEAR, today.year + 1):
        try:
            url, published_at = source_link(BUDGET_PAGE.format(year=year), "Sprawozdanie operatywne")
        except (ValueError, urllib.error.HTTPError):
            if year == today.year and today.month <= 3 and budget and budget[-1]["period"] == f"{year - 1}-12":
                break
            raise
        records = parse_budget(fetch(url), year, url, published_at)
        if year < today.year and records[-1]["period"] != f"{year}-12":
            raise ValueError(f"Historical year {year} lacks December")
        budget.extend(records)
    debt_url, debt_published_at = source_link(DEBT_PAGE, "Zadłużenie Skarbu Państwa")
    debt = parse_debt(fetch(debt_url), debt_url, debt_published_at)
    rates = parse_rates(fetch(RATE_URL))
    if today.month > 3 and budget[-1]["period"] < f"{today.year}-01":
        raise ValueError("Current year budget data is missing")
    if today.month > 3 and debt[-1]["period"] < f"{today.year}-01":
        raise ValueError("Current year debt data is missing")
    return {"generatedAt": retrieved_at, "unit": "PLN million", "budget": budget, "debt": debt, "rates": rates}


def write_snapshot(snapshot: dict, root: Path) -> None:
    json_path = root / "src/data/snapshot.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    if json_path.exists():
        current = json.loads(json_path.read_text())
        if {key: value for key, value in current.items() if key != "generatedAt"} == {key: value for key, value in snapshot.items() if key != "generatedAt"}:
            return
    json_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    data_dir = root / "public/data"
    data_dir.mkdir(parents=True, exist_ok=True)
    budget_rows = [
        {**row, **{f"revenue_{key}": value for key, value in row["revenueCategories"].items()},
         **{f"spending_{key}": value for key, value in row["spendingCategories"].items()}}
        for row in snapshot["budget"]
    ]
    monthly_rows = []
    previous = None
    for row in snapshot["budget"]:
        if previous is None or previous["period"][:4] != row["period"][:4]:
            previous = None
        monthly_rows.append({
            "period": row["period"],
            "revenue": round(row["revenue"] - (previous["revenue"] if previous else 0), 6),
            "spending": round(row["spending"] - (previous["spending"] if previous else 0), 6),
            "balance": round(row["balance"] - (previous["balance"] if previous else 0), 6),
            "unit": "PLN million", "sourceUrl": row["sourceUrl"],
            "publishedAt": row["publishedAt"], "status": row["status"],
        })
        previous = row
    for name, rows, fields in (
        ("budzet", budget_rows, ["period", "revenue", "spending", "balance", "revenue_tax", "revenue_nonTax", "revenue_eu", "spending_grants", "spending_benefits", "spending_operations", "spending_capital", "spending_debtService", "spending_euContribution", "spending_euProjects", "spending_sourceDifference", "unit", "sourceUrl", "publishedAt", "status"]),
        ("budzet-miesiecznie", monthly_rows, ["period", "revenue", "spending", "balance", "unit", "sourceUrl", "publishedAt", "status"]),
        ("dlug-skarbu-panstwa", snapshot["debt"], ["period", "value", "unit", "sourceUrl", "publishedAt", "status"]),
        ("stopa-referencyjna-nbp", snapshot["rates"], ["effectiveDate", "value", "unit", "sourceUrl", "publishedAt", "status"]),
    ):
        with (data_dir / f"{name}.csv").open("w", newline="", encoding="utf-8") as output:
            writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    snapshot = build_snapshot()
    write_snapshot(snapshot, args.root)
    print(f"Imported {len(snapshot['budget'])} budget months, {len(snapshot['debt'])} debt months, {len(snapshot['rates'])} NBP changes")
    print(f"Latest budget: {snapshot['budget'][-1]['period']}; debt: {snapshot['debt'][-1]['period']}")
