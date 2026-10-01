import snapshot from "../src/data/snapshot.json" with { type: "json" };

type Budget = (typeof snapshot.budget)[number];
type Debt = (typeof snapshot.debt)[number];
type Rate = (typeof snapshot.rates)[number];
export type Citation = { label: string; url: string };

const scope =
  /budżet|budzet|dochod|wydatk|deficyt|nadwyż|nadwyz|dług|dlug|zadłuż|zadluz|stop[ayę]|oprocentowan|nbp|podatk|skarb|finans|pieni[ąa]dz|przychod/i;
const injection =
  /ignore (all |your |previous )?instructions|reveal (your |the )?(system|prompt)|zignoruj .*instrukcj|ujawnij .*instrukcj|system prompt|developer message/i;

export function isSupported(question: string) {
  return scope.test(question) && !injection.test(question);
}

function source(row: Budget | Debt | Rate, label: string): Citation {
  return { label, url: row.sourceUrl };
}

export function buildContext(question: string): {
  facts: string;
  sources: Citation[];
} {
  const latestYear = Number(snapshot.budget.at(-1)!.period.slice(0, 4));
  const years = [...question.matchAll(/\b20\d{2}\b/g)]
    .map((match) => match[0])
    .filter((year) => Number(year) >= 2018 && Number(year) <= latestYear);
  const asksDebt = /dług|dlug|zadłuż|zadluz|skarb/i.test(question);
  const asksRate = /stop[ayę]|oprocentowan|nbp/i.test(question);
  const asksBudget =
    /budżet|budzet|dochod|wydatk|deficyt|nadwyż|nadwyz|podatk|finans|pieni[ąa]dz|przychod/i.test(
      question,
    ) ||
    (!asksDebt && !asksRate);
  const annualRecords = snapshot.budget.filter((row) =>
    row.period.endsWith("-12"),
  );
  const completeYear = Number(annualRecords.at(-1)!.period.slice(0, 4));
  const trend = /od |trend|histori|przez lata|w latach/i.test(question);
  const comparison = /zmian|porówn|wzrost|spad|różnic/i.test(question);
  const includedYears = new Set<number>(
    years.length
      ? years.map(Number)
      : [completeYear - 1, completeYear, latestYear],
  );
  if (trend && years.length)
    for (
      let year = Math.min(...years.map(Number));
      year <= completeYear;
      year++
    )
      includedYears.add(year);
  if (comparison && years.length)
    for (const year of years.map(Number))
      if (year > 2018) includedYears.add(year - 1);
  const budgetYears = new Set([...includedYears].map(String));
  const annualBudget = annualRecords.filter((row) =>
    includedYears.has(Number(row.period.slice(0, 4))),
  );
  const monthlyBudget = snapshot.budget.filter((row) =>
    budgetYears.has(row.period.slice(0, 4)),
  );
  const debtAnnual = snapshot.debt.filter((row) => row.period.endsWith("-12"));
  const debtSelected = snapshot.debt
    .filter((row) => years.some((year) => row.period.startsWith(year)))
    .filter((_, index) => index % 3 === 0);
  const rates = [
    snapshot.rates.filter((row) => row.effectiveDate < "2018-01-01").at(-1),
    ...snapshot.rates.filter((row) => row.effectiveDate >= "2018-01-01"),
  ].filter((row): row is Rate => Boolean(row));
  const latestDebt = snapshot.debt.at(-1)!;
  const latestRate = snapshot.rates.at(-1)!;
  const sources = [
    ...(asksBudget
      ? [...budgetYears].map((year) => {
          const row = snapshot.budget.findLast((item) =>
            item.period.startsWith(year),
          );
          return row && source(row, `Budżet ${year} · MF`);
        })
      : []),
    ...(asksDebt ? [source(latestDebt, `Dług ${latestDebt.period} · MF`)] : []),
    ...(asksRate ? [source(latestRate, "Stopy procentowe · NBP")] : []),
  ].filter((item): item is Citation => Boolean(item));
  const uniqueSources = [
    ...new Map(sources.map((item) => [item.url, item])).values(),
  ];
  const facts = JSON.stringify({
    units: { budget: "mln zł", debt: "mln zł", rate: "%" },
    definitions: {
      budget:
        "wykonanie centralnego budżetu państwa; dochody i wydatki narastająco od stycznia; wynik = dochody - wydatki",
      debt: "nominalne zadłużenie Skarbu Państwa, stan na koniec miesiąca; nie jest częścią sumy budżetu",
      rate: "stopa referencyjna NBP obowiązująca od effectiveDate; nie jest oprocentowaniem długu państwa",
    },
    ...(asksBudget
      ? { annualBudget, selectedMonthlyBudget: monthlyBudget }
      : {}),
    ...(asksDebt
      ? { annualDebt: debtAnnual, selectedDebt: debtSelected, latestDebt }
      : {}),
    ...(asksRate ? { rateChanges: rates, latestRate } : {}),
  });
  return { facts, sources: uniqueSources };
}
