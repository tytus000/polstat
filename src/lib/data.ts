import snapshot from "../data/snapshot.json";

export type SpendingRecord = {
  period: string;
  total: number;
  categories: Record<string, number>;
  unit: "PLN million";
  sourceUrl: string;
  publishedAt: string | null;
  sourceFileDate: string | null;
  status: "reported_actual";
};

export type FunctionRow = {
  code: string;
  label: string;
  actual: number;
  originalPlan: number;
  amendedPlan: number;
};

export type Breakdown = {
  period: string;
  total: number;
  originalPlan: number;
  amendedPlan: number;
  sourceDifference?: number;
  functions: FunctionRow[];
  unit: "PLN million";
  sourceUrl: string;
  publishedAt: string | null;
  sourceFileDate: string | null;
  status: "reported_actual";
};

export type Snapshot = {
  generatedAt: string;
  unit: "PLN million";
  spending: SpendingRecord[];
  breakdowns: Breakdown[];
};

export const data = snapshot as Snapshot;
export const latestSpending = data.spending.at(-1)!;
export const years = [...new Set(data.spending.map((row) => Number(row.period.slice(0, 4))))];

export const money = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits }).format(value);

export const percent = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits }).format(value);

export const periodLabel = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
};

export const shortMonth = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", { month: "short" }).format(
    new Date(year, month - 1, 1),
  );
};

export const spendingNames: Record<string, string> = {
  grants: "Dotacje i subwencje",
  benefits: "Świadczenia dla osób fizycznych",
  operations: "Bieżące wydatki jednostek",
  capital: "Wydatki majątkowe",
  debtService: "Obsługa długu Skarbu Państwa",
  euContribution: "Środki własne UE",
  euProjects: "Współfinansowanie projektów UE",
  sourceDifference: "Różnica w tabeli źródłowej",
};

export function yearRecords(year: number) {
  return data.spending.filter((row) => Number(row.period.slice(0, 4)) === year);
}

export function monthlySpending(year: number) {
  let previous: SpendingRecord | undefined;
  return yearRecords(year).map((row) => {
    const result = {
      period: row.period,
      label: shortMonth(row.period),
      total: row.total - (previous?.total ?? 0),
      sourceUrl: row.sourceUrl,
    };
    previous = row;
    return result;
  });
}

export const annualSpending = data.spending.filter((row) => row.period.endsWith("-12"));
