import snapshot from "../data/snapshot.json";

export type BudgetRecord = {
  period: string;
  revenue: number;
  spending: number;
  balance: number;
  revenueCategories: Record<string, number>;
  spendingCategories: Record<string, number>;
  sourceUrl: string;
  publishedAt: string | null;
  status: "reported_actual";
};
export type DebtRecord = {
  period: string;
  value: number;
  sourceUrl: string;
  status: "reported_actual";
};
export type RateRecord = {
  effectiveDate: string;
  value: number;
  sourceUrl: string;
};
export type Snapshot = {
  generatedAt: string;
  unit: string;
  budget: BudgetRecord[];
  debt: DebtRecord[];
  rates: RateRecord[];
};

export const data = snapshot as Snapshot;
export const latestBudget = data.budget.at(-1)!;
export const latestDebt = data.debt.at(-1)!;
export const latestRate = data.rates.at(-1)!;
export const years = [
  ...new Set(data.budget.map((row) => Number(row.period.slice(0, 4)))),
];

export const money = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits }).format(value);

export const periodLabel = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

export const shortMonth = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", { month: "short" }).format(
    new Date(year, month - 1, 1),
  );
};

export function monthlyBudget(year: number) {
  let previous: BudgetRecord | undefined;
  return data.budget
    .filter((row) => row.period.startsWith(String(year)))
    .map((row) => {
      const result = {
        period: row.period,
        label: shortMonth(row.period),
        revenue: row.revenue - (previous?.revenue ?? 0),
        spending: row.spending - (previous?.spending ?? 0),
        balance: row.balance - (previous?.balance ?? 0),
        sourceUrl: row.sourceUrl,
      };
      previous = row;
      return result;
    });
}

export const annualBudget = data.budget.filter((row) =>
  row.period.endsWith("-12"),
);

export const revenueNames: Record<string, string> = {
  tax: "Dochody podatkowe",
  nonTax: "Dochody niepodatkowe",
  eu: "Środki z UE",
};
export const spendingNames: Record<string, string> = {
  grants: "Dotacje i subwencje",
  benefits: "Świadczenia",
  operations: "Bieżące wydatki jednostek",
  capital: "Wydatki majątkowe",
  debtService: "Obsługa długu",
  euContribution: "Składka do UE",
  euProjects: "Współfinansowanie projektów UE",
  sourceDifference: "Różnica w tabeli źródłowej",
};
