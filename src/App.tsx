import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Download, ExternalLink, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  annualSpending, data, latestSpending, money, monthlySpending, percent,
  periodLabel, shortMonth, spendingNames, yearRecords, years,
} from "@/lib/data";
import type { Breakdown, SpendingRecord } from "@/lib/data";

const CATEGORY_COLORS = ["#c66046", "#d88867", "#e9ad8f", "#f0cfaf", "#4e6374", "#8395a1", "#b9c5c9"];
const CHART_BLUE = "#2b4050";
const CHART_ORANGE = "#cb664a";
const sourcePage = "https://www.gov.pl/web/finanse/sprawozdania-operatywne-miesieczne";

function SourceLink({ href, children = "Otwórz raport MF" }: { href: string; children?: React.ReactNode }) {
  return <a className="source-link" href={href} target="_blank" rel="noopener noreferrer">
    {children} <ExternalLink size={14} aria-hidden />
  </a>;
}

function DownloadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="download-link" href={href} download>
    <Download size={15} aria-hidden /> {children}
  </a>;
}

function DataTable({ caption, headers, rows }: {
  caption: string; headers: string[]; rows: (string | number)[][];
}) {
  return <details className="data-table">
    <summary>Zobacz pełną tabelę danych <ArrowDown size={15} aria-hidden /></summary>
    <div className="table-scroll">
      <table>
        <caption>{caption}</caption>
        <thead><tr>{headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>
          {row.map((value, column) => <td key={column}>{value}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </details>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const method = window.location.pathname === "/metodologia";
  return <header className="site-header">
    <div className="shell header-inner">
      <a href="/" className="brand" aria-label="Polstat — strona główna">
        <span className="brand-symbol" aria-hidden>p.</span>
        <span className="brand-word">polstat</span>
        <span className="brand-divider" aria-hidden />
        <span className="brand-caption">Wydatki państwa</span>
      </a>
      <nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Nawigacja główna">
        <a href="/#dzialy" onClick={() => setOpen(false)}>Na co</a>
        <a href="/#rodzaje" onClick={() => setOpen(false)}>Jak</a>
        <a href="/#w-czasie" onClick={() => setOpen(false)}>W czasie</a>
        <a className={method ? "active" : ""} href="/metodologia">Źródła i metoda</a>
      </nav>
      <Button className="mobile-menu" variant="outline" size="icon"
        aria-label={open ? "Zamknij menu" : "Otwórz menu"} aria-expanded={open}
        onClick={() => setOpen(!open)}><Menu size={19} /></Button>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="shell footer-inner">
    <div>
      <a href="/" className="brand footer-brand">
        <span className="brand-symbol" aria-hidden>p.</span><span className="brand-word">polstat</span>
      </a>
      <p>Wydatki budżetu państwa w liczbach.<br />Projekt oparty na publikacjach Ministerstwa Finansów.</p>
    </div>
    <div className="footer-links">
      <a href="/metodologia">Źródła i metoda</a>
      <a href="https://github.com/tytus000/polstat" target="_blank" rel="noopener noreferrer">
        Kod źródłowy <ExternalLink size={13} aria-hidden />
      </a>
    </div>
  </div></footer>;
}

function YearSelect({ year, setYear }: { year: number; setYear: (year: number) => void }) {
  return <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
    <SelectTrigger className="year-select" aria-label="Wybierz rok danych"><SelectValue /></SelectTrigger>
    <SelectContent>{years.toReversed().map((value) =>
      <SelectItem key={value} value={String(value)}>{value}</SelectItem>
    )}</SelectContent>
  </Select>;
}

function SectionHeader({ number, title, description, through }: {
  number: string; title: string; description: string; through: string;
}) {
  return <div className="section-header">
    <div className="section-number">{number}</div>
    <div className="section-title"><h2>{title}</h2><p>{description}</p></div>
    <div className="section-date">Dane do <strong>{through}</strong></div>
  </div>;
}

function Hero({ summary, breakdown, selectedYear, setSelectedYear }: {
  summary: SpendingRecord; breakdown: Breakdown; selectedYear: number;
  setSelectedYear: (year: number) => void;
}) {
  const latestMonth = monthlySpending(selectedYear).at(-1)!;
  const complete = summary.period.endsWith("-12");
  const execution = summary.total / breakdown.amendedPlan;
  const top = [...breakdown.functions].sort((a, b) => b.actual - a.actual).slice(0, 3);
  return <>
    <section className="hero"><div className="shell hero-inner">
      <div className="hero-intro">
        <div className="hero-kicker">
          <span className="eyebrow">Polska / budżet państwa</span>
          <span className="edition">Przegląd wydatków · 2018—{years.at(-1)}</span>
        </div>
        <h1>Na co wydaje<br /><em>państwo?</em></h1>
        <p>Jedno źródło, jasny zakres. Sprawdź, ile wydano z budżetu państwa,
          na jakie zadania i jak te kwoty zmieniały się w czasie.</p>
        <div className="hero-actions">
          <Button asChild className="hero-button"><a href="#dzialy">Przejdź do danych <ArrowRight size={17} aria-hidden /></a></Button>
          <a className="text-link" href="/metodologia">Co obejmują te liczby? <ArrowUpRight size={15} aria-hidden /></a>
        </div>
      </div>
      <div className="hero-data" aria-label={"Wydatki budżetu państwa w " + selectedYear + " roku"}>
        <div className="hero-data-top"><span>WYDATKI BUDŻETU PAŃSTWA</span><YearSelect year={selectedYear} setYear={setSelectedYear} /></div>
        <div className="hero-figure"><strong>{money(summary.total / 1000)}</strong><span>mld zł</span></div>
        <p className="hero-period">{complete ? "cały rok " + selectedYear : "od stycznia do " + periodLabel(summary.period)}</p>
        <div className="plan-progress">
          <div className="plan-progress-head"><span>Wykonanie planu po zmianach</span><strong>{percent(execution)}</strong></div>
          <div className="plan-track"><span style={{ width: String(Math.min(execution * 100, 100)) + "%" }} /></div>
          <span className="plan-total">Plan: {money(breakdown.amendedPlan / 1000)} mld zł</span>
        </div>
        <div className="hero-data-bottom">
          <div><small>OSTATNI MIESIĄC</small><strong>{money(latestMonth.total / 1000)} <span>mld zł</span></strong></div>
          <div><small>OKRESÓW W ROKU</small><strong>{yearRecords(selectedYear).length} <span>mies.</span></strong></div>
        </div>
      </div>
    </div></section>
    <div className="source-strip"><div className="shell source-strip-inner">
      <span><Check size={15} aria-hidden /> Sprawozdanie operatywne Ministerstwa Finansów</span>
      <span>Stan danych: {periodLabel(summary.period)}</span>
      <SourceLink href={summary.sourceUrl}>Plik źródłowy XLSX</SourceLink>
    </div></div>
    <div className="shell three-facts" aria-label="Największe działy wydatków">
      {top.map((item, index) => <div key={item.code} className="fact">
        <span>0{index + 1} / NAJWIĘKSZY DZIAŁ</span>
        <strong>{item.label}</strong>
        <div>{money(item.actual / 1000)} mld zł <small>· {percent(item.actual / breakdown.total)} wydatków</small></div>
      </div>)}
    </div>
  </>;
}

function FunctionsSection({ breakdown }: { breakdown: Breakdown }) {
  const [showAll, setShowAll] = useState(false);
  const items = [...breakdown.functions].sort((a, b) => b.actual - a.actual);
  const max = items[0]?.actual ?? 1;
  const visible = showAll ? items : items.slice(0, 12);
  return <section className="section functions-section" id="dzialy"><div className="shell">
    <SectionHeader number="01 / Na co" title="Wydatki według zadań państwa"
      description="Działy budżetowe pokazują cel wydatku. To oficjalna klasyfikacja, od ubezpieczeń społecznych po obronę i zdrowie."
      through={periodLabel(breakdown.period)} />
    <Card className="data-panel"><CardContent className="panel-content">
      <div className="panel-heading">
        <div><span className="eyebrow">Podział funkcjonalny</span><h3>{breakdown.functions.length} działy budżetowe</h3></div>
        <span className="panel-unit">mld zł · od stycznia</span>
      </div>
      <div className="function-list">{visible.map((item, index) => <div className="function-row" key={item.code}>
        <div className="function-rank">{String(index + 1).padStart(2, "0")}</div>
        <div className="function-main">
          <div className="function-row-top">
            <div><span className="function-code">{item.code}</span><strong>{item.label}</strong></div>
            <div className="function-amount">{money(item.actual / 1000)} <small>mld zł</small></div>
          </div>
          <div className="function-track"><span style={{ width: String((item.actual / max) * 100) + "%" }} /></div>
        </div>
        <span className="function-share">{percent(item.actual / breakdown.total)}</span>
      </div>)}</div>
      <div className="panel-actions">
        <Button variant="outline" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Pokaż 12 największych" : "Pokaż wszystkie " + items.length + " działy"} <ArrowDown size={15} aria-hidden />
        </Button>
        <DownloadLink href="/data/wydatki-dzialy.csv">Pobierz dane CSV</DownloadLink>
      </div>
      {breakdown.sourceDifference && <p className="source-difference">
        W raporcie za {breakdown.period.slice(0, 4)} r. suma działów różni się od podanej kwoty ogółem o {money(breakdown.sourceDifference, 3)} mln zł. Zachowujemy tę różnicę bez korekty źródła.
      </p>}
      <DataTable caption={"Wydatki według działów w " + breakdown.period + ", mln zł"}
        headers={["Kod", "Dział", "Wykonanie (mln zł)", "Plan po zmianach (mln zł)", "Udział"]}
        rows={items.map((item) => [item.code, item.label, money(item.actual, 3),
          money(item.amendedPlan, 3), percent(item.actual / breakdown.total)])} />
      <div className="panel-source"><SourceLink href={breakdown.sourceUrl}>MF · tabela 7 w pliku XLSX</SourceLink></div>
    </CardContent></Card>
    <p className="under-note"><strong>Jak czytać:</strong> „Dział” opisuje rodzaj zadania, a nie instytucję,
      która wykonała przelew. Wydatki przekazane innym podmiotom pozostają tu wydatkiem budżetu państwa.</p>
  </div></section>;
}

function TypesSection({ summary }: { summary: SpendingRecord }) {
  const entries = Object.entries(summary.categories)
    .filter(([key, value]) => key !== "sourceDifference" && value >= 0)
    .sort((a, b) => b[1] - a[1]);
  return <section className="section types-section" id="rodzaje"><div className="shell">
    <SectionHeader number="02 / W jaki sposób" title="Wydatki według rodzaju"
      description="Ta sama kwota ogółem, uporządkowana inaczej: transfery, świadczenia, utrzymanie instytucji, inwestycje i obsługa długu."
      through={periodLabel(summary.period)} />
    <div className="type-layout">
      <div className="type-visual">
        <span className="eyebrow">Struktura / {summary.period.slice(0, 4)}</span>
        <div className="type-big">{money(summary.total / 1000)} <small>mld zł</small></div>
        <div className="type-stack" role="img" aria-label="Udziały siedmiu rodzajów wydatków budżetu państwa">
          {entries.map(([key, value], index) => <span key={key}
            title={spendingNames[key] + ": " + money(value / 1000) + " mld zł"}
            style={{ width: String((value / summary.total) * 100) + "%", backgroundColor: CATEGORY_COLORS[index] }} />)}
        </div>
        <p>Podział ekonomiczny. Kategorie sumują się do wydatków ogółem, z wyjątkiem jawnie opisanej różnicy w raporcie źródłowym.</p>
      </div>
      <div className="type-list">{entries.map(([key, value], index) => <div className="type-row" key={key}>
        <span className="type-swatch" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
        <div><strong>{spendingNames[key]}</strong><small>{percent(value / summary.total)} całych wydatków</small></div>
        <span className="type-value">{money(value / 1000)} <small>mld zł</small></span>
      </div>)}</div>
    </div>
    {summary.categories.sourceDifference && <p className="source-difference">
      Raport za {summary.period.slice(0, 4)} r. zawiera różnicę {money(summary.categories.sourceDifference, 3)} mln zł między sumą kategorii a kwotą ogółem.
    </p>}
    <div className="section-tools">
      <DownloadLink href="/data/wydatki-narastajaco.csv">Pobierz dane CSV</DownloadLink>
      <SourceLink href={summary.sourceUrl}>MF · tabela 6 w pliku XLSX</SourceLink>
    </div>
    <DataTable caption={"Rodzaje wydatków w " + summary.period + ", mln zł"}
      headers={["Rodzaj", "Kwota (mln zł)", "Udział"]}
      rows={entries.map(([key, value]) => [spendingNames[key], money(value, 3), percent(value / summary.total)])} />
  </div></section>;
}

function TimelineSection({ year, summary }: { year: number; summary: SpendingRecord }) {
  const [view, setView] = useState("monthly");
  const records = yearRecords(year);
  const rows = view === "monthly" ? monthlySpending(year)
    : records.map((row) => ({ period: row.period, label: shortMonth(row.period), total: row.total }));
  const maxValue = Math.max(...rows.map((row) => row.total));
  return <section className="section timeline-section" id="w-czasie"><div className="shell">
    <SectionHeader number="03 / W czasie" title="Miesiąc po miesiącu"
      description="Raporty MF podają wartości narastająco od stycznia. Widok miesięczny wyliczamy jako różnicę dwóch kolejnych raportowanych wartości."
      through={periodLabel(summary.period)} />
    <Card className="data-panel chart-panel"><CardContent className="panel-content">
      <div className="panel-heading timeline-heading">
        <div><span className="eyebrow">Budżet państwa / {year}</span>
          <h3>{view === "monthly" ? "Wydatki w miesiącu" : "Wydatki narastająco"}</h3></div>
        <Tabs value={view} onValueChange={setView}><TabsList>
          <TabsTrigger value="monthly">Miesięcznie</TabsTrigger>
          <TabsTrigger value="cumulative">Narastająco</TabsTrigger>
        </TabsList></Tabs>
      </div>
      <div className="chart-annotation"><span className="annotation-line" />
        <span>Każdy słupek to {view === "monthly" ? "jeden miesiąc" : "suma od początku roku"}. Kwoty nominalne, mld zł.</span>
      </div>
      <div className="chart-box" role="img"
        aria-label={(view === "monthly" ? "Miesięczne" : "Narastające") + " wydatki budżetu państwa w " + year + " roku"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 18, right: 12, bottom: 0, left: -24 }} barCategoryGap="26%">
            <CartesianGrid vertical={false} stroke="#e7e5e1" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#68727a", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#68727a", fontSize: 12 }}
              tickFormatter={(value) => String(Math.round(Number(value) / 1000))} />
            <Tooltip cursor={{ fill: "#f3eee8" }}
              contentStyle={{ background: "#fff", border: "1px solid #dcd9d3", borderRadius: 4, boxShadow: "0 14px 35px #162b3922" }}
              formatter={(value) => [money(Number(value) / 1000) + " mld zł", "Wydatki"]}
              labelFormatter={(label) => String(label) + " " + year} />
            <Bar dataKey="total" radius={[2, 2, 0, 0]} maxBarSize={52}>
              {rows.map((row) => <Cell key={row.period} fill={row.total === maxValue ? CHART_ORANGE : CHART_BLUE} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel-actions">
        <span>Źródło: sprawozdania operatywne MF</span>
        <DownloadLink href={view === "monthly" ? "/data/wydatki-miesiecznie.csv" : "/data/wydatki-narastajaco.csv"}>
          Pobierz dane CSV
        </DownloadLink>
      </div>
      <DataTable caption={(view === "monthly" ? "Miesięczne" : "Narastające") + " wydatki w " + year + " roku, mln zł"}
        headers={["Miesiąc", "Kwota (mln zł)"]}
        rows={rows.map((row) => [periodLabel(row.period), money(row.total, 3)])} />
      <div className="panel-source"><SourceLink href={summary.sourceUrl}>MF · raport za {periodLabel(summary.period)}</SourceLink></div>
    </CardContent></Card>
  </div></section>;
}

function AnnualSection() {
  const rows = annualSpending.map((row) => ({ year: row.period.slice(0, 4), value: row.total }));
  const max = Math.max(...rows.map((row) => row.value));
  return <section className="section annual-section"><div className="shell annual-layout">
    <div className="annual-copy">
      <span className="eyebrow">04 / Lata zakończone</span>
      <h2>Dłuższa<br />perspektywa.</h2>
      <p>Roczne wydatki budżetu państwa od 2018 r. Bieżący, niepełny rok nie pojawia się w tym porównaniu. Kwoty są nominalne.</p>
      <DownloadLink href="/data/wydatki-narastajaco.csv">Pobierz serię CSV</DownloadLink>
    </div>
    <div className="annual-bars">
      {rows.map((row) => <div className="annual-row" key={row.year}>
        <span>{row.year}</span>
        <div><span style={{ width: String((row.value / max) * 100) + "%" }} /></div>
        <strong>{money(row.value / 1000)} <small>mld zł</small></strong>
      </div>)}
      <p>Porównanie nominalne. Źródła: grudniowe <a href={sourcePage} target="_blank" rel="noopener noreferrer">
        sprawozdania MF <ExternalLink size={13} aria-hidden /></a>.</p>
      <DataTable caption="Wydatki budżetu państwa w zakończonych latach, mln zł"
        headers={["Rok", "Kwota (mln zł)"]}
        rows={rows.map((row) => [row.year, money(row.value, 3)])} />
    </div>
  </div></section>;
}

function Home() {
  const [selectedYear, setSelectedYear] = useState(years.at(-1)!);
  const summary = yearRecords(selectedYear).at(-1)!;
  const breakdown = data.breakdowns.find((row) => row.period === summary.period)!;
  return <>
    <Header />
    <main>
      <Hero summary={summary} breakdown={breakdown} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
      <FunctionsSection key={selectedYear} breakdown={breakdown} />
      <TypesSection summary={summary} />
      <TimelineSection key={"timeline-" + selectedYear} year={selectedYear} summary={summary} />
      <AnnualSection />
      <div className="shell closing-note">
        <Badge variant="outline">Jeden zakres danych</Badge>
        <p>Pokazujemy wydatki centralnego budżetu państwa. Nie sumujemy tu wydatków samorządów, ZUS, NFZ ani funduszy poza budżetem.</p>
        <a href="/metodologia">Sprawdź zakres i metodę <ArrowRight size={16} aria-hidden /></a>
      </div>
    </main>
    <Footer />
  </>;
}

function Methodology() {
  return <>
    <Header />
    <main className="method-page"><div className="shell">
      <div className="method-hero">
        <span className="eyebrow">Źródła / zakres / obliczenia</span>
        <h1>Liczby, które<br /><em>można sprawdzić.</em></h1>
        <p>Polstat pokazuje wyłącznie wydatki budżetu państwa publikowane przez Ministerstwo Finansów. Każda kwota ma okres, jednostkę i link do pliku źródłowego.</p>
      </div>
      <div className="method-grid">
        <aside className="method-aside">
          <strong>Zakres PoC</strong>
          <p>Budżet państwa · wydatki kasowe · 2018–{years.at(-1)} · mln zł w danych, mld zł na wykresach.</p>
          <span>Ostatni okres: {periodLabel(latestSpending.period)}</span>
        </aside>
        <div className="method-copy">
          <article><span>01 / Źródło</span><h2>Sprawozdania operatywne MF</h2>
            <p>Seria miesięcznych arkuszy Ministerstwa Finansów. Wydatki ogółem sprawdzamy między tabelami 1 i 6. Podział według rodzaju pochodzi z tabeli 6, a podział według działów z tabeli 7. Publikujemy raportowane wykonanie, bez wcześniejszych szacunków. Data w nazwie pliku źródłowego nie jest traktowana jako data publikacji.</p>
            <SourceLink href={sourcePage}>Przejdź do archiwum raportów</SourceLink></article>
          <article><span>02 / Zakres</span><h2>Co obejmuje budżet państwa?</h2>
            <p>To centralny budżet państwa. Transfer do funduszu lub samorządu jest tu wydatkiem centralnym. Wydatki wykonane później przez ten fundusz lub samorząd nie są dodawane ponownie. Ta seria nie obejmuje pełnych wydatków całego sektora publicznego.</p></article>
          <article><span>03 / Czas</span><h2>Miesiąc i rok</h2>
            <p>Arkusze podają wydatki narastająco od stycznia. Kwotę za pojedynczy miesiąc wyliczamy, odejmując poprzedni miesiąc w tym samym roku. Grudniowy raport wyznacza wartość całoroczną; aktualny rok pokazujemy jako niepełny.</p></article>
          <article><span>04 / Kontrola</span><h2>Uzgadnianie danych</h2>
            <p>Import wymaga ciągłości miesięcy oraz zgodności kwoty ogółem z tabelami źródłowymi. Arkusze historyczne różnią się skalą zapisanych komórek; ustalamy ją przez porównanie z kwotą ogółem. W raporcie za 2019 r. suma pozycji jest o około 1,15 mln zł niższa od opublikowanej kwoty ogółem. Różnica pozostaje jawna.</p></article>
          <article><span>05 / Porównania</span><h2>Jak czytać wykresy</h2>
            <p>Kwoty są nominalne, bez korekty o inflację. Działy i rodzaje wydatków są dwiema klasyfikacjami tej samej sumy, nie dwoma zbiorami do dodania. Nazwy działów mogą zmieniać się między latami, dlatego kod działu i nazwa z danego raportu pozostają razem.</p></article>
        </div>
      </div>
      <div className="download-panel">
        <div><span className="eyebrow">Dane do pobrania</span><h2>Sprawdź samodzielnie.</h2>
          <p>CSV zawierają kwoty w mln zł, okres, adres źródła i status danych.</p></div>
        <div>
          <DownloadLink href="/data/wydatki-miesiecznie.csv">Miesięcznie</DownloadLink>
          <DownloadLink href="/data/wydatki-narastajaco.csv">Narastająco</DownloadLink>
          <DownloadLink href="/data/wydatki-dzialy.csv">Według działów</DownloadLink>
        </div>
      </div>
    </div></main>
    <Footer />
  </>;
}

export default function App() {
  return window.location.pathname === "/metodologia" ? <Methodology /> : <Home />;
}
