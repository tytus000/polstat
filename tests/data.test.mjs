import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const snapshot = JSON.parse(
  readFileSync(new URL("../src/data/snapshot.json", import.meta.url), "utf8"),
);
const csv = (name) =>
  readFileSync(new URL("../public/data/" + name, import.meta.url), "utf8")
    .trim()
    .split("\n");

test("published snapshot contains only central-budget spending", () => {
  assert.deepEqual(Object.keys(snapshot).sort(), [
    "breakdowns", "generatedAt", "spending", "unit",
  ]);
  assert.equal(snapshot.unit, "PLN million");
  assert.equal(snapshot.spending[0].period, "2018-01");
  assert.ok(snapshot.spending.at(-1).period >= "2026-07");
});

test("monthly cumulative spending is continuous and reconciles by economic type", () => {
  const periods = snapshot.spending.map((row) => row.period);
  assert.equal(periods.length, new Set(periods).size);
  for (const row of snapshot.spending) {
    assert.equal(row.unit, "PLN million");
    assert.equal(row.status, "reported_actual");
    assert.match(row.sourceUrl, /^https:\/\/www\.gov\.pl\/attachment\//);
    assert.equal(row.publishedAt, null);
    if (row.sourceFileDate !== null) {
      assert.match(row.sourceFileDate, /^20\d{2}-\d{2}-\d{2}$/);
    }
    const sum = Object.values(row.categories).reduce((total, value) => total + value, 0);
    assert.ok(Math.abs(sum - row.total) < 0.003, row.period);
  }
  for (let index = 1; index < periods.length; index++) {
    const [year, month] = periods[index - 1].split("-").map(Number);
    const expected = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);
    assert.equal(periods[index], expected);
  }
});

test("function classifications reconcile to independently parsed totals", () => {
  assert.ok(snapshot.breakdowns.length >= 9);
  for (const group of snapshot.breakdowns) {
    const row = snapshot.spending.find((item) => item.period === group.period);
    assert.ok(row);
    assert.equal(group.total, row.total);
    assert.ok(group.originalPlan > 0);
    assert.ok(group.amendedPlan > 0);
    assert.equal(group.functions.length, new Set(group.functions.map((item) => item.code)).size);
    const total = group.functions.reduce((sum, item) => sum + item.actual, 0);
    assert.ok(Math.abs(total + (group.sourceDifference ?? 0) - group.total) < 0.01, group.period);
    assert.ok(group.functions.every((item) => item.actual >= 0));
  }
  assert.ok(snapshot.breakdowns.find((group) => group.period === "2019-12").sourceDifference > 1);
  assert.equal(snapshot.breakdowns.at(-1).period, snapshot.spending.at(-1).period);
});

test("monthly CSV resets at year boundaries and agrees with cumulative data", () => {
  const rows = csv("wydatki-miesiecznie.csv").slice(1);
  assert.equal(rows.length, snapshot.spending.length);
  for (let index = 0; index < rows.length; index++) {
    const [period, monthly] = rows[index].split(",");
    const current = snapshot.spending[index];
    const prior = snapshot.spending[index - 1];
    const expected = current.total - (prior?.period.slice(0, 4) === period.slice(0, 4) ? prior.total : 0);
    assert.equal(period, current.period);
    assert.ok(Math.abs(Number(monthly) - expected) < 0.000001, period);
  }
  assert.equal(csv("wydatki-dzialy.csv").length - 1,
    snapshot.breakdowns.reduce((sum, group) => sum + group.functions.length, 0));
});
