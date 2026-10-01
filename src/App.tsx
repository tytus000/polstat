import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleHelp,
  Download,
  ExternalLink,
  Landmark,
  Menu,
  MessageCircle,
  Minus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  annualBudget,
  data,
  latestBudget,
  latestDebt,
  latestRate,
  money,
  monthlyBudget,
  periodLabel,
  revenueNames,
  shortMonth,
  spendingNames,
  years,
} from "@/lib/data";
import type { BudgetRecord } from "@/lib/data";
import { Chat } from "@/components/Chat";

const colors = {
  ink: "#17283f",
  teal: "#0f746c",
  coral: "#d85e43",
  gold: "#e6ae49",
  muted: "#9aa6ac",
};
const chartMargin = { top: 12, right: 8, bottom: 0, left: -20 };
const tooltip = {
  background: "#fffdf9",
  border: "1px solid #e3e0d7",
  borderRadius: 12,
  boxShadow: "0 12px 32px #17283f1a",
};

function Source({
  href,
  children = "Zobacz źródło",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      className="source-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  through,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  through: string;
  id?: string;
}) {
  return (
    <div className="section-heading" id={id}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-intro">{description}</p>
      </div>
      <span className="through">
        <CalendarDays size={15} aria-hidden /> Dane do: {through}
      </span>
    </div>
  );
}

function ChartTools({ csv, source }: { csv: string; source: string }) {
  return (
    <div className="chart-tools">
      <a href={csv} download>
        <Download size={15} aria-hidden /> Pobierz CSV
      </a>
      <Source href={source} />
    </div>
  );
}

function DataTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: (string | number)[][];
  caption: string;
}) {
  return (
    <details className="data-table">
      <summary>Pokaż dane w tabeli</summary>
      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((value, column) => (
                  <td key={column}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const methodology = window.location.pathname === "/metodologia";
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a href="/" className="brand" aria-label="Polstat — strona główna">
          <span className="brand-mark">
            p<span>.</span>
          </span>
          <span>polstat</span>
        </a>
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Nawigacja główna"
        >
          <a href="/#budzet" onClick={() => setOpen(false)}>
            Budżet
          </a>
          <a href="/#dlug" onClick={() => setOpen(false)}>
            Dług i stopy
          </a>
          <a href="/#zapytaj" onClick={() => setOpen(false)}>
            Zapytaj o dane
          </a>
          <a className={methodology ? "active" : ""} href="/metodologia">
            Metodologia
          </a>
        </nav>
        <Button
          variant="outline"
          size="icon"
          className="mobile-menu"
          aria-label="Otwórz menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Menu size={20} />
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <div className="brand">
            <span className="brand-mark">
              p<span>.</span>
            </span>
            <span>polstat</span>
          </div>
          <p>
            Publiczny przewodnik po finansach państwa.
            <br />
            Dane pochodzą z Ministerstwa Finansów i NBP.
          </p>
        </div>
        <div className="footer-links">
          <a href="/metodologia">Źródła i metodologia</a>
          <a href="/data/budzet.csv" download>
            Dane budżetowe CSV
          </a>
          <a
            href="https://github.com/tytus000/polstat"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kod źródłowy <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <Badge className="hero-badge" variant="outline">
            <span className="live-dot" /> Oficjalne dane · prosty język
          </Badge>
          <h1>
            Co dzieje się z <em>pieniędzmi państwa?</em>
          </h1>
          <p>
            Dochody, wydatki i deficyt budżetu centralnego w jednym miejscu.
            Zobacz liczby, zrozum ich znaczenie i sprawdź źródła.
          </p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <a href="#budzet">
                Zobacz dane <ArrowRight size={17} />
              </a>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="#jak-czytac">Jak to czytać?</a>
            </Button>
          </div>
          <div className="hero-foot">
            <ShieldCheck size={17} /> Dane raportowane, bez prognoz{" "}
            <span>·</span> Aktualizacja do {periodLabel(latestBudget.period)}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-panel panel-in">
            <span>DOCHODY</span>
            <strong>{money(latestBudget.revenue / 1000, 0)}</strong>
            <small>mld zł od stycznia</small>
            <ArrowDownRight />
          </div>
          <div className="art-panel panel-out">
            <span>WYDATKI</span>
            <strong>{money(latestBudget.spending / 1000, 0)}</strong>
            <small>mld zł od stycznia</small>
            <ArrowUpRight />
          </div>
          <div className="art-coin coin-one">zł</div>
          <div className="art-coin coin-two">zł</div>
          <div className="art-baseline" />
        </div>
      </div>
    </section>
  );
}

function ReadingGuide() {
  return (
    <section className="shell guide" id="jak-czytac">
      <div className="guide-title">
        <p className="eyebrow">01 / Punkt wyjścia</p>
        <h2>
          Trzy liczby,
          <br />
          <em>jedna opowieść.</em>
        </h2>
      </div>
      <div className="guide-grid">
        <div className="guide-item">
          <span className="guide-icon green">
            <Wallet size={21} />
          </span>
          <h3>Dochody</h3>
          <p>
            Podatki i inne środki wpływające do budżetu państwa. To publikowane
            dochody budżetowe, nie saldo rachunku bankowego.
          </p>
        </div>
        <div className="guide-item">
          <span className="guide-icon red">
            <Landmark size={21} />
          </span>
          <h3>Wydatki</h3>
          <p>
            Pieniądze wydane w ramach budżetu centralnego. Nie obejmują całych
            finansów publicznych ani wydatków samorządów.
          </p>
        </div>
        <div className="guide-item">
          <span className="guide-icon gold">
            <Minus size={21} />
          </span>
          <h3>Deficyt</h3>
          <p>
            Różnica między dochodami a wydatkami. Gdy wydatki są wyższe, wynik
            budżetu jest ujemny.
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  note,
  tone,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className={`metric-card ${tone}`}>
      <CardContent>
        <div className="metric-top">
          <span>{title}</span>
          {icon}
        </div>
        <strong>
          {value}
          <small> mld zł</small>
        </strong>
        <p>{note}</p>
      </CardContent>
    </Card>
  );
}

function BudgetSection() {
  const [selectedYear, setSelectedYear] = useState(years.at(-1)!);
  const [view, setView] = useState("monthly");
  const yearRows = data.budget.filter((row) =>
    row.period.startsWith(String(selectedYear)),
  );
  const end = yearRows.at(-1)!;
  const monthRows = monthlyBudget(selectedYear);
  const rows =
    view === "monthly"
      ? monthRows
      : yearRows.map((row) => ({
          period: row.period,
          label: shortMonth(row.period),
          revenue: row.revenue,
          spending: row.spending,
          balance: row.balance,
          sourceUrl: row.sourceUrl,
        }));
  return (
    <section className="section budget-section" id="budzet">
      <div className="shell">
        <SectionHeading
          eyebrow="02 / Budżet państwa"
          title="Skąd pochodzą pieniądze. Dokąd trafiają."
          description="Wybierz rok i zobacz przepływ miesiąc po miesiącu. Kwoty miesięczne wyliczamy z narastających wartości w raportach Ministerstwa Finansów."
          through={periodLabel(latestBudget.period)}
        />
        <div className="metric-grid">
          <MetricCard
            title="Dochody"
            value={money(end.revenue / 1000)}
            note={`Od stycznia do ${periodLabel(end.period)}`}
            tone="income"
            icon={<ArrowDownRight size={23} />}
          />
          <MetricCard
            title="Wydatki"
            value={money(end.spending / 1000)}
            note={`Od stycznia do ${periodLabel(end.period)}`}
            tone="expense"
            icon={<ArrowUpRight size={23} />}
          />
          <MetricCard
            title={end.balance < 0 ? "Deficyt" : "Nadwyżka"}
            value={money(Math.abs(end.balance) / 1000)}
            note="Dochody minus wydatki"
            tone="balance"
            icon={<Minus size={23} />}
          />
        </div>
        <Card className="chart-card">
          <CardContent>
            <div className="chart-head">
              <div>
                <p className="eyebrow">Dochody i wydatki</p>
                <h3>
                  {view === "monthly"
                    ? "W każdym miesiącu"
                    : "Narastająco od stycznia"}
                </h3>
              </div>
              <div className="chart-controls">
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger
                    aria-label="Wybierz rok"
                    className="year-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.toReversed().map((year) => (
                      <SelectItem value={String(year)} key={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tabs value={view} onValueChange={setView}>
                  <TabsList>
                    <TabsTrigger value="monthly">Miesięcznie</TabsTrigger>
                    <TabsTrigger value="cumulative">Narastająco</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="legend">
              <span>
                <i style={{ background: colors.teal }} />
                Dochody
              </span>
              <span>
                <i style={{ background: colors.coral }} />
                Wydatki
              </span>
            </div>
            <div
              className="chart-box"
              role="img"
              aria-label={`Wykres dochodów i wydatków budżetu w ${selectedYear} roku, w miliardach złotych`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={chartMargin} barGap={3}>
                  <CartesianGrid vertical={false} stroke="#e8e5dc" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#657584", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(n) => String(Math.round(n / 1000))}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#657584", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={tooltip}
                    formatter={(value, name) => [
                      `${money(Number(value) / 1000)} mld zł`,
                      name === "revenue" ? "Dochody" : "Wydatki",
                    ]}
                    labelFormatter={(label) => `${label} ${selectedYear}`}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={colors.teal}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="spending"
                    fill={colors.coral}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-bottom">
              <p>
                Wartości w mld zł.{" "}
                {view === "monthly"
                  ? "Miesiąc = zmiana względem poprzedniego raportu."
                  : "Każda kolumna zawiera sumę od początku roku."}
              </p>
              <ChartTools
                csv={
                  view === "monthly"
                    ? "/data/budzet-miesiecznie.csv"
                    : "/data/budzet.csv"
                }
                source={end.sourceUrl}
              />
            </div>
            <DataTable
              caption={`Dochody i wydatki budżetu w ${selectedYear} roku, mln zł`}
              headers={[
                "Miesiąc",
                "Dochody (mln zł)",
                "Wydatki (mln zł)",
                "Wynik (mln zł)",
              ]}
              rows={rows.map((row) => [
                periodLabel(row.period),
                money(row.revenue),
                money(row.spending),
                money(row.balance),
              ])}
            />
          </CardContent>
        </Card>
        <div className="categories-grid">
          <CategoryCard kind="revenue" row={end} />
          <CategoryCard kind="spending" row={end} />
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  kind,
  row,
}: {
  kind: "revenue" | "spending";
  row: BudgetRecord;
}) {
  const items = Object.entries(
    kind === "revenue" ? row.revenueCategories : row.spendingCategories,
  ).filter(([key, value]) => key === "sourceDifference" ? Math.abs(value) > 0.003 : value > 0);
  const total = kind === "revenue" ? row.revenue : row.spending;
  const names = kind === "revenue" ? revenueNames : spendingNames;
  return (
    <Card className="category-card">
      <CardContent>
        <div className="category-head">
          <span className={`mini-icon ${kind === "revenue" ? "green" : "red"}`}>
            {kind === "revenue" ? (
              <ArrowDownRight size={19} />
            ) : (
              <ArrowUpRight size={19} />
            )}
          </span>
          <div>
            <p className="eyebrow">
              {kind === "revenue" ? "Skąd wpływają" : "Na co idą"}
            </p>
            <h3>
              {kind === "revenue" ? "Struktura dochodów" : "Struktura wydatków"}
            </h3>
          </div>
        </div>
        <p className="category-period">
          {periodLabel(row.period)} · narastająco od stycznia
        </p>
        <div className="category-list">
          {items.map(([key, value], index) => (
            <div className="category-row" key={key}>
              <div className="category-label">
                <span>{names[key] ?? key}</span>
                <strong>{key === "sourceDifference" ? `${money(value)} mln zł` : `${money(value / 1000)} mld zł`}</strong>
              </div>
              <div className="category-track">
                <span
                  style={{
                    width: `${Math.max(0.4, (Math.abs(value) / total) * 100)}%`,
                    background:
                      kind === "revenue"
                        ? [colors.teal, "#75b7a6", "#b8d9ce"][index]
                        : [
                            colors.coral,
                            "#e89377",
                            "#efb597",
                            "#efc8a8",
                            colors.gold,
                            "#dbc998",
                            "#c9c5bb",
                            colors.muted,
                          ][index],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="category-source">
          <Source href={row.sourceUrl}>Tabela źródłowa MF</Source>
        </div>
      </CardContent>
    </Card>
  );
}

function DeficitSection() {
  const yearsData = annualBudget.map((row) => ({
    year: row.period.slice(0, 4),
    balance: row.balance / 1000,
    sourceUrl: row.sourceUrl,
  }));
  return (
    <section className="section deficit-section">
      <div className="shell">
        <SectionHeading
          eyebrow="03 / Wynik budżetu"
          title="Deficyt w dłuższej perspektywie."
          description="Porównujemy wyłącznie zakończone lata. Rok bieżący jest niepełny i nie trafia do tego zestawienia."
          through={periodLabel(latestBudget.period)}
        />
        <Card className="chart-card">
          <CardContent>
            <div className="chart-head">
              <div>
                <p className="eyebrow">Lata zakończone</p>
                <h3>Roczny wynik budżetu</h3>
              </div>
              <span className="unit-pill">mld zł</span>
            </div>
            <div
              className="chart-box"
              role="img"
              aria-label="Wykres rocznego wyniku budżetu w miliardach złotych"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearsData} margin={chartMargin}>
                  <CartesianGrid vertical={false} stroke="#e8e5dc" />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#657584", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#657584", fontSize: 12 }}
                  />
                  <ReferenceLine y={0} stroke={colors.ink} />
                  <Tooltip
                    contentStyle={tooltip}
                    formatter={(value) => [
                      `${money(Number(value))} mld zł`,
                      "Wynik",
                    ]}
                  />
                  <Bar dataKey="balance" radius={[4, 4, 4, 4]} maxBarSize={52}>
                    {yearsData.map((row) => (
                      <Cell
                        key={row.year}
                        fill={row.balance < 0 ? colors.coral : colors.teal}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-bottom">
              <p>
                Wynik = dochody minus wydatki. Słupki poniżej zera oznaczają
                deficyt.
              </p>
              <ChartTools
                csv="/data/budzet.csv"
                source={annualBudget.at(-1)!.sourceUrl}
              />
            </div>
            <DataTable
              caption="Roczny wynik budżetu, mln zł"
              headers={["Rok", "Wynik (mln zł)"]}
              rows={annualBudget.map((row) => [
                row.period.slice(0, 4),
                money(row.balance),
              ])}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ContextSection() {
  const debt = data.debt
    .filter((row) => row.period >= "2018-01")
    .map((row) => ({
      ...row,
      label: row.period.slice(0, 4),
      billion: row.value / 1000,
    }));
  const rateBefore2018 = data.rates
    .filter((row) => row.effectiveDate < "2018-01-01")
    .at(-1);
  const rates = [
    ...(rateBefore2018
      ? [{ ...rateBefore2018, effectiveDate: "2018-01-01" }]
      : []),
    ...data.rates.filter((row) => row.effectiveDate >= "2018-01-01"),
  ].map((row) => ({ ...row, label: row.effectiveDate.slice(0, 7) }));
  return (
    <section className="section context-section" id="dlug">
      <div className="shell">
        <SectionHeading
          eyebrow="04 / Szerszy kontekst"
          title="Dług i stopy procentowe."
          description="Dwa osobne wskaźniki pomagają czytać sytuację państwa. Nie są składnikami dochodów ani wydatków budżetu centralnego."
          through={`${periodLabel(latestDebt.period)} (dług), ${latestRate.effectiveDate} (stopa)`}
        />
        <div className="context-grid">
          <Card className="context-card">
            <CardContent>
              <div className="context-head">
                <span className="mini-icon blue">
                  <Landmark size={20} />
                </span>
                <span>DŁUG SKARBU PAŃSTWA</span>
              </div>
              <div className="context-value">
                {money(latestDebt.value / 1000)}
                <small> mld zł</small>
              </div>
              <p>
                Stan na koniec {periodLabel(latestDebt.period)}. To zadłużenie
                Skarbu Państwa, a nie całego sektora finansów publicznych.
              </p>
              <div
                className="small-chart"
                role="img"
                aria-label="Wykres długu Skarbu Państwa od 2018 roku, w miliardach złotych"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={debt}
                    margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="debtGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#46758a"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#46758a"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#657584", fontSize: 11 }}
                      interval={11}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      labelFormatter={(_, payload) =>
                        payload[0]?.payload.period ?? ""
                      }
                      formatter={(value) => [
                        `${money(Number(value))} mld zł`,
                        "Dług",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="billion"
                      stroke="#46758a"
                      strokeWidth={2.5}
                      fill="url(#debtGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <ChartTools
                csv="/data/dlug-skarbu-panstwa.csv"
                source={latestDebt.sourceUrl}
              />
              <DataTable
                caption="Dług Skarbu Państwa, mln zł"
                headers={["Miesiąc", "Dług (mln zł)"]}
                rows={data.debt.map((row) => [
                  periodLabel(row.period),
                  money(row.value),
                ])}
              />
            </CardContent>
          </Card>
          <Card className="context-card">
            <CardContent>
              <div className="context-head">
                <span className="mini-icon gold">
                  <ArrowUpRight size={20} />
                </span>
                <span>STOPA REFERENCYJNA NBP</span>
              </div>
              <div className="context-value">
                {money(latestRate.value, 2)}
                <small> %</small>
              </div>
              <p>
                Obowiązuje od {latestRate.effectiveDate}. To stopa polityki
                pieniężnej NBP, nie oprocentowanie długu państwa.
              </p>
              <div
                className="small-chart"
                role="img"
                aria-label="Wykres zmian stopy referencyjnej NBP od 2018 roku"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={rates}
                    margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                  >
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#657584", fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      labelFormatter={(_, payload) =>
                        payload[0]?.payload.effectiveDate ?? ""
                      }
                      formatter={(value) => [
                        `${money(Number(value), 2)}%`,
                        "Stopa",
                      ]}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="value"
                      stroke={colors.gold}
                      strokeWidth={2.8}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <ChartTools
                csv="/data/stopa-referencyjna-nbp.csv"
                source={latestRate.sourceUrl}
              />
              <DataTable
                caption="Zmiany stopy referencyjnej NBP"
                headers={["Data wejścia w życie", "Stopa (%)"]}
                rows={rates.map((row) => [
                  row.effectiveDate,
                  money(row.value, 2),
                ])}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ChatSection() {
  return (
    <section className="section chat-section" id="zapytaj">
      <div className="shell chat-layout">
        <div>
          <p className="eyebrow">05 / Zapytaj o dane</p>
          <h2>
            Masz pytanie?
            <br />
            <em>Zapytaj prosto.</em>
          </h2>
          <p>
            Asystent odpowiada na podstawie wybranych, opublikowanych danych
            Polstatu i podaje źródła. Nie ma dostępu do innych statystyk.
          </p>
          <div className="chat-note">
            <CircleHelp size={19} />
            <span>
              Model: GLM-4.7-Flash (Cloudflare Workers AI). Dostępność zależy od
              dziennego bezpłatnego limitu.
            </span>
          </div>
        </div>
        <Chat />
      </div>
    </section>
  );
}

function Methodology() {
  return (
    <main className="method-page">
      <div className="shell">
        <div className="method-hero">
          <p className="eyebrow">Źródła i metodologia</p>
          <h1>
            Skąd pochodzą
            <br />
            <em>te liczby?</em>
          </h1>
          <p>
            Każda liczba na Polstacie ma definicję i link do publikacji
            źródłowej. Dane budżetowe do {periodLabel(latestBudget.period)}.
            Ostatni udany import:{" "}
            {new Date(data.generatedAt).toLocaleString("pl-PL", {
              dateStyle: "long",
              timeStyle: "short",
            })}
            .
          </p>
        </div>
        <div className="method-grid">
          <aside className="method-aside">
            <BookOpen size={26} />
            <h2>Zakres ma znaczenie</h2>
            <p>
              Budżet państwa, dług Skarbu Państwa i stopy NBP opisują różne
              rzeczy. Pokazujemy je obok siebie, bez dodawania do wspólnej sumy.
            </p>
          </aside>
          <div className="method-content">
            <article>
              <span>01</span>
              <h2>Budżet centralny</h2>
              <p>
                Dochody, wydatki i wynik pochodzą z miesięcznych sprawozdań
                operatywnych Ministerstwa Finansów od 2018 r. Raporty podają
                wykonanie narastająco od stycznia. Wartość miesięczna to różnica
                dwóch kolejnych okresów w obrębie tego samego roku. Deficyt
                zapisujemy jako ujemny wynik: dochody minus wydatki.
              </p>
              <p>
                Do szeregu trafiają dane z raportów wykonania, bez wstępnych
                szacunków. Kwoty przeliczamy na mln zł. Roczne porównania
                obejmują tylko pełne lata.
              </p>
              <Source href={latestBudget.sourceUrl}>Ostatni raport MF</Source>
            </article>
            <Separator />
            <article>
              <span>02</span>
              <h2>Kategorie dochodów i wydatków</h2>
              <p>
                Dochody grupujemy według trzech nadrzędnych pozycji raportu:
                podatkowe, niepodatkowe i środki UE. Wydatki obejmują siedem
                nadrzędnych kategorii z tabeli Ministerstwa. W raporcie za 2019
                r. opublikowany wynik kategorii nie zawsze sumuje się dokładnie
                do wydatków ogółem. Tę różnicę zapisujemy jawnie jako „Różnica w
                tabeli źródłowej”.
              </p>
              <p>
                Wykresy wyświetlają kwoty w mld zł dla czytelności. Pliki CSV
                zachowują wartości w mln zł.
              </p>
            </article>
            <Separator />
            <article>
              <span>03</span>
              <h2>Dług Skarbu Państwa</h2>
              <p>
                Miesięczny stan zadłużenia według wartości nominalnej pochodzi z
                szeregu czasowego Ministerstwa Finansów. To stan na koniec
                miesiąca. Nie jest sumą wydatków budżetowych ani miarą długu
                całego sektora instytucji rządowych i samorządowych.
              </p>
              <Source href={latestDebt.sourceUrl}>Szereg MF: zadłużenie</Source>
            </article>
            <Separator />
            <article>
              <span>04</span>
              <h2>Stopy procentowe NBP</h2>
              <p>
                Daty zmian i poziomy stopy referencyjnej pochodzą z archiwum
                Narodowego Banku Polskiego. Wykres pokazuje poziom obowiązujący
                od podanej daty, a nie średnią miesięczną.
              </p>
              <Source href={latestRate.sourceUrl}>Archiwum NBP</Source>
            </article>
            <Separator />
            <article>
              <span>05</span>
              <h2>Aktualizacja i jakość</h2>
              <p>
                Import sprawdza ciągłość miesięcy, równanie dochody minus
                wydatki równa się wynik oraz zgodność kategorii z sumami. Nowy
                zestaw trafia na stronę tylko po udanym imporcie i budowie. Gdy
                źródło zmieni układ albo walidacja zawiedzie, poprzednia
                opublikowana wersja zostaje dostępna, a jej data pozostaje
                widoczna.
              </p>
              <p>
                Źródła mogą być później korygowane przez instytucje. Dlatego
                przechowujemy link do użytego pliku, status danych i, jeśli
                dostępna, datę publikacji.
              </p>
            </article>
            <Separator />
            <article>
              <span>06</span>
              <h2>Asystent</h2>
              <p>
                Asystent dostaje tylko ograniczony kontekst z danych
                opublikowanych na tej stronie. Jego odpowiedzi mogą zawierać
                błędy; sprawdź cytowane źródło. Pytania spoza zakresu danych
                powinny otrzymać informację o braku podstaw do odpowiedzi.
                Wiadomości nie są zapisywane przez Polstat.
              </p>
            </article>
          </div>
        </div>
        <div className="download-panel">
          <div>
            <h2>Pobierz dane i sprawdź samodzielnie</h2>
            <p>Otwarte pliki CSV z linkami do oryginalnych publikacji.</p>
          </div>
          <div>
            <Button asChild variant="outline">
              <a href="/data/budzet.csv" download>
                Budżet <Download size={16} />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/data/dlug-skarbu-panstwa.csv" download>
                Dług <Download size={16} />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/data/stopa-referencyjna-nbp.csv" download>
                Stopy <Download size={16} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Home() {
  return (
    <main>
      <Hero />
      <ReadingGuide />
      <BudgetSection />
      <DeficitSection />
      <ContextSection />
      <ChatSection />
      <div className="shell end-note">
        <MessageCircle size={21} />
        <p>
          Dane publiczne najlepiej czytać w kontekście.{" "}
          <a href="/metodologia">
            Sprawdź definicje, ograniczenia i źródła <ArrowRight size={15} />
          </a>
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />
      {window.location.pathname === "/metodologia" ? <Methodology /> : <Home />}
      <Footer />
    </>
  );
}
