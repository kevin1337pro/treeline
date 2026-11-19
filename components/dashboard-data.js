(function (root) {
  "use strict";
  function today(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = type => parts.find(item => item.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }
  function validDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  }
  function addDays(date, days) {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
  }
  function dateLabel(date, options = { day: "2-digit", month: "2-digit", year: "numeric" }) {
    return validDate(date) ? new Intl.DateTimeFormat("de-DE", { ...options, timeZone: "Europe/Berlin" }).format(new Date(`${date}T12:00:00Z`)) : "Ohne Termin";
  }
  function summarize(data, date = today()) {
    const trees = data.trees || [], measures = data.measures || [], users = data.users || [];
    const statusCounts = { gut: 0, mittel: 0, schlecht: 0, kritisch: 0, unbekannt: 0 };
    for (const tree of trees) statusCounts[Object.hasOwn(statusCounts, tree.status) ? tree.status : "unbekannt"]++;
    const priorities = { kritisch: 0, hoch: 1, mittel: 2, normal: 2, niedrig: 3 };
    const openMeasures = measures.filter(item => item.status !== "abgeschlossen").sort((a, b) => {
      const aDate = validDate(a.date) ? a.date : "9999-12-31", bDate = validDate(b.date) ? b.date : "9999-12-31";
      return aDate.localeCompare(bDate) || (priorities[a.priority] ?? 4) - (priorities[b.priority] ?? 4) || a.id.localeCompare(b.id);
    });
    const overdue = openMeasures.filter(item => validDate(item.date) && item.date < date);
    const nextWeek = openMeasures.filter(item => validDate(item.date) && item.date >= date && item.date <= addDays(date, 6));
    const workload = users.filter(user => user.role !== "client").map(user => ({ ...user, count: openMeasures.filter(item => item.assignedTo === user.id).length }))
      .filter(user => user.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "de"));
    const unassigned = openMeasures.filter(item => !users.some(user => user.id === item.assignedTo && user.role !== "client")).length;
    return {
      statusCounts, openMeasures, overdue, nextWeek, workload, unassigned,
      openOrders: (data.orders || []).filter(order => order.status !== "abgeschlossen"),
      certified: trees.filter(tree => tree.certified).length,
      criticalTrees: trees.filter(tree => ["kritisch", "schlecht"].includes(tree.status)).sort((a, b) => (a.status === "kritisch" ? 0 : 1) - (b.status === "kritisch" ? 0 : 1) || a.name.localeCompare(b.name, "de")),
    };
  }
  function monthly(measures, date = today(), length = 6) {
    const [year, month] = date.split("-").map(Number);
    const count = [3, 6, 12].includes(length) ? length : 6;
    const months = Array.from({ length: count }, (_, index) => {
      const start = new Date(Date.UTC(year, month - count + index, 1, 12));
      return { key: start.toISOString().slice(0, 7), label: new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC" }).format(start).replace(/\.$/, ""), year: start.getUTCFullYear(), open: 0, done: 0, total: 0 };
    });
    for (const measure of measures) {
      if (!validDate(measure.date)) continue;
      const bucket = months.find(item => item.key === measure.date.slice(0, 7));
      if (bucket) { bucket[measure.status === "abgeschlossen" ? "done" : "open"]++; bucket.total++; }
    }
    return months;
  }
  const api = { today, validDate, addDays, dateLabel, summarize, monthly };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DashboardData = api;
})(typeof window !== "undefined" ? window : globalThis);
