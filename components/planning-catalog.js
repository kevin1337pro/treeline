(function (root) {
  "use strict";
  const SOURCE = "public-demo-v1";
  const origin = { source: "Beispielplanung", sourceId: SOURCE };
  const users = ["Malin", "Mats", "Jonna", "Edda", "Silas", "Merle", "Tomke", "Ari", "Kim", "Marlo"].map((name, i) => ({
    id: `staff-demo-${i + 1}`, name, role: "team", team: "Außendienst",
    initials: name.slice(0, 2).toUpperCase(), email: "", licenses: [], ...origin,
  }));
  const vehicles = ["Arbeitsbühne Nord", "Pritsche Süd", "Pflegewagen West", "Materialwagen Ost"].map((name, i) => ({
    id: `veh-demo-${i + 1}`, name, plate: "", weightKg: null, requiredLicense: "", status: "ungeprüft", ...origin,
  }));
  const tools = [
    { id: "eq-demo-1", name: "Kippanhänger", attachedTo: "veh-demo-2", ...origin },
    { id: "eq-demo-2", name: "Stubbenfräse", attachedTo: "", ...origin },
  ];
  function sampleOrder(number, title, crewIds, vehicleIds, equipmentIds = [], startTime = "") {
    return {
      id: `PLAN-DEMO-${number}`, title, city: "", street: "", client: "", description: "",
      status: "geplant", priority: "normal", scheduledDate: "", startTime, estimatedHours: null,
      crewIds, vehicleIds, equipmentIds, treeIds: [], measureIds: [], safety: [], workflow: [], access: "",
      ...origin,
    };
  }
  const orders = [
    { ...sampleOrder("01", "Baumkontrolle am Lesegarten", ["staff-demo-2"], ["veh-demo-3"], [], "08:00"), city: "Dortmund", street: "Westfalenpark" },
    sampleOrder("02", "Pflege am Musterforum", ["staff-demo-4", "staff-demo-7", "staff-demo-9"], ["veh-demo-1"]),
    sampleOrder("03", "Jungbaumpflege am Brunnenplatz", ["user-007", "staff-demo-6"], ["veh-demo-4"]),
    sampleOrder("04", "Lichtung Nord", ["staff-demo-3", "staff-demo-5"], ["veh-demo-2"]),
    sampleOrder("05", "Kontrolle am Beispielkai", ["staff-demo-8", "staff-demo-10"], ["veh-002"], ["eq-demo-2"]),
  ];
  const catalog = { users, vehicles, equipment: tools, orders };

  // Import once by stable ID, without resetting local edits, deleted records or releases.
  function merge(data) {
    if (data.catalogImports?.includes(SOURCE)) return data;
    const next = { ...data, catalogImports: [...(data.catalogImports || []), SOURCE] };
    for (const [key, records] of Object.entries(catalog)) {
      const existing = data[key] || [];
      const ids = new Set(existing.map(item => item.id));
      next[key] = [...existing, ...JSON.parse(JSON.stringify(records.filter(item => !ids.has(item.id))))];
    }
    return next;
  }
  const api = { SOURCE, catalog, merge };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.TREELINE_CATALOG = api;
    try {
      const previous = root.MOCK_DATA;
      const next = merge(previous);
      if (next !== previous) {
        const saved = JSON.parse(root.localStorage.getItem("treeline_public_database"));
        root.localStorage.setItem("treeline_public_database", JSON.stringify({ ...saved, data: next }));
        root.MOCK_DATA = next;
      }
    } catch (_) {
      root.TREELINE_CATALOG_ERROR = "Beispieldaten konnten nicht gespeichert werden. Lokalen Speicher prüfen und neu laden.";
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
