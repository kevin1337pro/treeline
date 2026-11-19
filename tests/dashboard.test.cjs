const { test } = require("node:test");
const assert = require("node:assert/strict");
const Dashboard = require("../components/dashboard-data.js");

test("monthly measures use actual due dates and include empty months across years", () => {
  const measures = [
    { date: "2025-12-10", status: "geplant" }, { date: "2025-12-11", status: "abgeschlossen" },
    { date: "2026-01-01", status: "in_arbeit" }, { date: "2026-02-30", status: "geplant" },
    { date: "2025-08-01", status: "geplant" }, { date: "", status: "geplant" },
    { date: "2026-04-01", status: "geplant" },
  ];
  const months = Dashboard.monthly(measures, "2026-03-10", 6);
  assert.deepEqual(months.map(month => month.key), ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"]);
  assert.equal(months[2].open, 1);
  assert.equal(months[2].done, 1);
  assert.equal(months[3].total, 1);
  assert.equal(months.reduce((sum, month) => sum + month.total, 0), 3);
  assert.equal(Dashboard.monthly([], "2026-03-10", 12).length, 12);
  assert.equal(Dashboard.monthly([], "2026-03-10", 3).length, 3);
});

test("open measures are sorted by due date with overdue and next-week boundaries", () => {
  const data = { measures: [
    { id: "future", date: "2026-10-28", priority: "hoch" },
    { id: "last", date: "2026-10-27" }, { id: "today", date: "2026-10-21" },
    { id: "old", date: "2026-10-20" }, { id: "invalid", date: "2026-02-30" },
    { id: "done", date: "2026-10-01", status: "abgeschlossen" },
  ] };
  const summary = Dashboard.summarize(data, "2026-10-21");
  assert.deepEqual(summary.openMeasures.map(item => item.id), ["old", "today", "last", "future", "invalid"]);
  assert.deepEqual(summary.overdue.map(item => item.id), ["old"]);
  assert.deepEqual(summary.nextWeek.map(item => item.id), ["today", "last"]);
  assert.equal(data.measures[0].id, "future");
});

test("critical and poor tree states remain separate and unknown states are counted", () => {
  const summary = Dashboard.summarize({ trees: [
    { name: "Poor", status: "schlecht", certified: true },
    { name: "Unknown", status: "unexpected" }, { name: "Critical", status: "kritisch" },
  ] });
  assert.equal(summary.certified, 1);
  assert.equal(summary.statusCounts.kritisch, 1);
  assert.equal(summary.statusCounts.schlecht, 1);
  assert.equal(summary.statusCounts.unbekannt, 1);
  assert.deepEqual(summary.criticalTrees.map(tree => tree.name), ["Critical", "Poor"]);
});

test("workload is an open-task count, not an invented capacity", () => {
  const summary = Dashboard.summarize({ users: [
    { id: "one", name: "One", role: "team" }, { id: "idle", name: "Idle", role: "team" },
    { id: "client", name: "Client", role: "client" },
  ], measures: [
    { id: "1", assignedTo: "one" }, { id: "2", assignedTo: "one", status: "abgeschlossen" },
    { id: "3", assignedTo: "missing" }, { id: "4", assignedTo: "client" },
  ] });
  assert.deepEqual(summary.workload.map(user => [user.id, user.count]), [["one", 1]]);
  assert.equal(summary.unassigned, 2);
});

test("Berlin calendar dates follow midnight and daylight savings without UTC date shifts", () => {
  assert.equal(Dashboard.today(new Date("2026-10-20T22:30:00Z")), "2026-10-21");
  assert.equal(Dashboard.today(new Date("2026-12-31T23:30:00Z")), "2027-01-01");
  assert.equal(Dashboard.addDays("2026-10-25", 1), "2026-10-26");
  assert.equal(Dashboard.addDays("2026-03-29", -1), "2026-03-28");
  assert.equal(Dashboard.validDate("2026-02-30"), false);
  assert.equal(Dashboard.validDate("2024-02-29"), true);
  assert.equal(Dashboard.dateLabel(""), "Ohne Termin");
});

test("empty application data produces real zero states", () => {
  const summary = Dashboard.summarize({});
  assert.equal(summary.openMeasures.length, 0);
  assert.equal(summary.criticalTrees.length, 0);
  assert.equal(summary.openOrders.length, 0);
  assert.equal(summary.unassigned, 0);
  assert.ok(Dashboard.monthly([], "2026-10-21").every(month => month.total === 0));
});
