// Treeline – Mock Data
const TREELINE_TREE_SPECIES = [
  { name:"Stieleiche", aliases:["stileiche","eiche"], latin:"Quercus robur" },
  { name:"Traubeneiche", aliases:["traubeneiche"], latin:"Quercus petraea" },
  { name:"Rotbuche", aliases:["buche"], latin:"Fagus sylvatica" },
  { name:"Gemeine Kiefer", aliases:["kiefer"], latin:"Pinus sylvestris" },
  { name:"Silberpappel", aliases:["pappel"], latin:"Populus alba" },
  { name:"Spitzahorn", aliases:["ahorn"], latin:"Acer platanoides" },
  { name:"Feldahorn", aliases:["feldahorn"], latin:"Acer campestre" },
  { name:"Hainbuche", aliases:["hainbuche"], latin:"Carpinus betulus" },
  { name:"Traubenkirsche", aliases:["traubenkirsche"], latin:"Prunus padus" },
  { name:"Linde", aliases:["winterlinde"], latin:"Tilia cordata" },
  { name:"Platane", aliases:["platane"], latin:"Platanus x hispanica" },
];

function normalizeTreeSpeciesName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");
}

function getLatinSpeciesForTreeName(value) {
  const normalized = normalizeTreeSpeciesName(value);
  if (!normalized) return "";
  let bestLength = 0;
  let latin = "";
  for (const entry of TREELINE_TREE_SPECIES) {
    for (const name of [entry.name, ...entry.aliases]) {
      const alias = normalizeTreeSpeciesName(name);
      if (normalized === alias) return entry.latin;
      if (alias.length > bestLength && normalized.includes(alias)) {
        bestLength = alias.length;
        latin = entry.latin;
      }
    }
  }
  return latin;
}

const TREELINE_SEED_DATA = {
  currentUser: {
    id: "user-001", name: "Mara Esche", email: "office@example.invalid",
    role: "admin", initials: "ME",
  },

  trees: [
    { id:"TRE-2024-001", name:"Stieleiche", species:"Quercus robur", lat:51.49162, lng:7.47912,
      status:"gut", height:18.5, trunkDiam:42, crownDiam:12, age:85, certified:true,
      certDate:"2024-03-15", certifier:"Dr. Keno West", vta:"VTA Stufe 2",
      standort:"Demoring 27, Beispielstadt", tags:["Naturdenkmal","Monitoring"],
      notes:"Leichte Kronenverlichtung im Osten. Vitalitätsstufe 2.", owner:"Stadt Beispielstadt",
      assignedTo:"user-002", measuresIds:["MAU-001","MAU-003"], images:[], createdAt:"2024-01-10" },
    { id:"TRE-2024-002", name:"Rotbuche", species:"Fagus sylvatica", lat:51.49171, lng:7.47905,
      status:"mittel", height:22.0, trunkDiam:61, crownDiam:16, age:120, certified:true,
      certDate:"2024-02-20", certifier:"Dr. Keno West", vta:"VTA Stufe 3",
      standort:"Demoring 34, Beispielstadt", tags:["Schutzbedarf"],
      notes:"Pilzbefall am Stammfuß. Eingehende Kontrolle empfohlen.", owner:"Beispielforst",
      assignedTo:"user-003", measuresIds:["MAU-002"], images:[], createdAt:"2024-01-15" },
    { id:"TRE-2024-003", name:"Gemeine Kiefer", species:"Pinus sylvestris", lat:51.49176, lng:7.47930,
      status:"kritisch", height:14.0, trunkDiam:28, crownDiam:6, age:45, certified:false,
      certDate:null, certifier:null, vta:"Ausstehend",
      standort:"Demoring 21, Beispielstadt", tags:["Fällkandidat","EPS-Befall"],
      notes:"Starker Eichenprozessionsspinner-Befall. Sofortmaßnahme erforderlich.", owner:"Privat",
      assignedTo:"user-002", measuresIds:["MAU-004"], images:[], createdAt:"2024-02-01" },
    { id:"TRE-2024-004", name:"Silberpappel", species:"Populus alba", lat:51.49185, lng:7.47923,
      status:"schlecht", height:25.0, trunkDiam:78, crownDiam:18, age:65, certified:true,
      certDate:"2024-01-08", certifier:"Alva Stein", vta:"VTA Stufe 4",
      standort:"Demoring 125, Beispielstadt", tags:["Totholz","Fällkandidat"],
      notes:"Starke Höhlenbildung, Totholzanteil > 30%. Fällung geplant.", owner:"Stadt Beispielstadt",
      assignedTo:"user-004", measuresIds:["MAU-005","MAU-006"], images:[], createdAt:"2024-01-20" },
    { id:"TRE-2024-005", name:"Spitzahorn", species:"Acer platanoides", lat:51.49190, lng:7.47948,
      status:"gut", height:11.5, trunkDiam:22, crownDiam:9, age:30, certified:true,
      certDate:"2024-03-20", certifier:"Alva Stein", vta:"VTA Stufe 1",
      standort:"Beispielweg 5, Beispielstadt", tags:["Neupflanzung"],
      notes:"Junger, vitaler Baum. Formschnitt empfohlen.", owner:"Schule Beispielstadt",
      assignedTo:"user-002", measuresIds:[], images:[], createdAt:"2024-03-01" },
    { id:"TRE-2024-006", name:"Hainbuche", species:"Carpinus betulus", lat:51.49199, lng:7.47941,
      status:"gut", height:9.0, trunkDiam:18, crownDiam:7, age:25, certified:false,
      certDate:null, certifier:null, vta:"Ausstehend",
      standort:"Westallee 11, Beispielstadt", tags:[],
      notes:"Zertifizierung ausstehend.", owner:"Privat",
      assignedTo:null, measuresIds:[], images:[], createdAt:"2024-03-10" },
    { id:"TRE-2024-007", name:"Traubenkirsche", species:"Prunus padus", lat:51.49204, lng:7.47966,
      status:"mittel", height:8.5, trunkDiam:15, crownDiam:6, age:20, certified:true,
      certDate:"2024-04-01", certifier:"Dr. Keno West", vta:"VTA Stufe 2",
      standort:"Waldrand Nord, Beispielstadt", tags:["Drohnen-Aufnahme"],
      notes:"Drohnenaufnahme ausstehend für Kronenkontrolle.", owner:"Beispielforst",
      assignedTo:"user-003", measuresIds:[], images:[], createdAt:"2024-04-01" },
    { id:"TRE-2026-101", name:"Linde", species:"Tilia cordata", lat:51.49213, lng:7.47959,
      status:"gut", height:13.0, trunkDiam:35, crownDiam:8, age:42, certified:true,
      certDate:"2026-04-18", certifier:"Alva Stein", vta:"VTA Stufe 1",
      standort:"Musterstraße, Musterstadt, Abschnitt West, linke Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","links"],
      notes:"Kronenpflege, Stamm- und Stockaustriebe entfernen. Startbaum Abschnitt links.",
      owner:"Stadt Musterstadt", assignedTo:"user-007", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"links", routeIndex:1 },
    { id:"TRE-2026-102", name:"Ahorn", species:"Acer platanoides", lat:51.49218, lng:7.47984,
      status:"mittel", height:15.5, trunkDiam:44, crownDiam:10, age:50, certified:true,
      certDate:"2026-04-18", certifier:"Alva Stein", vta:"VTA Stufe 2",
      standort:"Musterstraße, Musterstadt, Abschnitt West, linke Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","links"],
      notes:"Lichtraumprofil zur Fahrbahn beachten. Kronenpflege mit Hubsteiger.",
      owner:"Stadt Musterstadt", assignedTo:"user-008", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"links", routeIndex:2 },
    { id:"TRE-2026-103", name:"Platane", species:"Platanus x hispanica", lat:51.49227, lng:7.47977,
      status:"mittel", height:17.0, trunkDiam:52, crownDiam:12, age:58, certified:true,
      certDate:"2026-04-18", certifier:"Alva Stein", vta:"VTA Stufe 2",
      standort:"Musterstraße, Musterstadt, Abschnitt Mitte, linke Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","links"],
      notes:"Totholzanteil gering, Schnittgut direkt hacken.",
      owner:"Stadt Musterstadt", assignedTo:"user-008", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"links", routeIndex:3 },
    { id:"TRE-2026-104", name:"Linde", species:"Tilia cordata", lat:51.49232, lng:7.48002,
      status:"gut", height:12.5, trunkDiam:32, crownDiam:8, age:38, certified:false,
      certDate:null, certifier:null, vta:"Sichtkontrolle ausreichend",
      standort:"Musterstraße, Musterstadt, Abschnitt Mitte, linke Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","links"],
      notes:"Stamm- und Stockaustriebe stark, zuerst vom Boden aus freischneiden.",
      owner:"Stadt Musterstadt", assignedTo:"user-007", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"links", routeIndex:4 },
    { id:"TRE-2026-105", name:"Ahorn", species:"Acer campestre", lat:51.49241, lng:7.47995,
      status:"gut", height:11.0, trunkDiam:29, crownDiam:7, age:35, certified:true,
      certDate:"2026-04-18", certifier:"Alva Stein", vta:"VTA Stufe 1",
      standort:"Musterstraße, Musterstadt, Abschnitt West, rechte Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","rechts"],
      notes:"Auf Verkehrsraum achten, Arbeitsbereich mit Warnbaken sichern.",
      owner:"Stadt Musterstadt", assignedTo:"user-007", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"rechts", routeIndex:1 },
    { id:"TRE-2026-106", name:"Eiche", species:"Quercus robur", lat:51.49246, lng:7.48020,
      status:"mittel", height:18.0, trunkDiam:57, crownDiam:13, age:72, certified:true,
      certDate:"2026-04-18", certifier:"Alva Stein", vta:"VTA Stufe 2",
      standort:"Musterstraße, Musterstadt, Abschnitt West, rechte Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","rechts"],
      notes:"Kronenpflege mit 22m Hubsteiger; Astüberhang Richtung Fahrbahn.",
      owner:"Stadt Musterstadt", assignedTo:"user-008", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"rechts", routeIndex:2 },
    { id:"TRE-2026-107", name:"Linde", species:"Tilia cordata", lat:51.49255, lng:7.48013,
      status:"gut", height:14.0, trunkDiam:37, crownDiam:9, age:44, certified:false,
      certDate:null, certifier:null, vta:"Sichtkontrolle ausreichend",
      standort:"Musterstraße, Musterstadt, Abschnitt Mitte, rechte Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","rechts"],
      notes:"Schnittgut zum TGE ziehen, Hacker an sicherer Bucht positionieren.",
      owner:"Stadt Musterstadt", assignedTo:"user-007", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"rechts", routeIndex:3 },
    { id:"TRE-2026-108", name:"Ahorn", species:"Acer platanoides", lat:51.49260, lng:7.48038,
      status:"mittel", height:16.0, trunkDiam:46, crownDiam:10, age:49, certified:true,
      certDate:"2026-04-18", certifier:"Alva Stein", vta:"VTA Stufe 2",
      standort:"Musterstraße, Musterstadt, Abschnitt Ost, rechte Straßenseite", tags:["Auftrag AUF-2026-001","Straßenbaum","rechts"],
      notes:"Abschlussbaum Abschnitt rechts. Arbeitsstelle reinigen und Fotodoku erstellen.",
      owner:"Stadt Musterstadt", assignedTo:"user-008", measuresIds:["MAU-101"], images:[], createdAt:"2026-05-20", orderId:"AUF-2026-001", routeSide:"rechts", routeIndex:4 },
  ],

  measures: [
    { id:"MAU-001", type:"baumschnitt", label:"Baumpflege & Baumschnitt",
      title:"Kronenpflege Stieleiche TRE-2024-001", treeId:"TRE-2024-001",
      status:"geplant", priority:"mittel", assignedTo:"user-002",
      date:"2025-05-14", notes:"Tote Äste entfernen, Krone auslichten", cost:480 },
    { id:"MAU-002", type:"seilklettern", label:"Seilklettertechnik",
      title:"Pilzbefall-Inspektion Rotbuche TRE-2024-002", treeId:"TRE-2024-002",
      status:"in_arbeit", priority:"hoch", assignedTo:"user-003",
      date:"2025-04-28", notes:"Seilkletterinspektion Stammfuß + obere Krone", cost:720 },
    { id:"MAU-003", type:"baumschnitt", label:"Baumpflege & Baumschnitt",
      title:"Formschnitt Stieleiche TRE-2024-001", treeId:"TRE-2024-001",
      status:"abgeschlossen", priority:"niedrig", assignedTo:"user-002",
      date:"2024-11-10", notes:"Jährlicher Pflegeschnitt durchgeführt", cost:320 },
    { id:"MAU-004", type:"eps", label:"EPS-Bekämpfung",
      title:"Eichenprozessionsspinner Kiefer TRE-2024-003", treeId:"TRE-2024-003",
      status:"geplant", priority:"kritisch", assignedTo:"user-004",
      date:"2025-05-01", notes:"Nester entfernen, Bereich absperren, Schutzausrüstung Stufe 3", cost:1200 },
    { id:"MAU-005", type:"faellung", label:"Baumfällung",
      title:"Fällung Silberpappel TRE-2024-004", treeId:"TRE-2024-004",
      status:"geplant", priority:"hoch", assignedTo:"user-004",
      date:"2025-06-15", notes:"Fällung inkl. Kran wegen Straßenlage", cost:3800 },
    { id:"MAU-006", type:"kran", label:"Fällkraneinsatz",
      title:"Kraneinsatz Silberpappel TRE-2024-004", treeId:"TRE-2024-004",
      status:"geplant", priority:"hoch", assignedTo:"user-004",
      date:"2025-06-15", notes:"50t-Kran, Absperrung Am Fluss erforderlich", cost:2200 },
    { id:"MAU-101", type:"baumschnitt", label:"Baumpflege & Baumschnitt",
      title:"Kronenpflege Musterstraße Musterstadt", treeId:"TRE-2026-101",
      status:"geplant", priority:"hoch", assignedTo:"user-008",
      date:"2026-06-04", notes:"Beidseitige Kronenpflege inklusive Stamm- und Stockaustriebe. Hubsteiger + TGE mit Hacker.", cost:4200,
      orderId:"AUF-2026-001" },
  ],

  users: [
    { id:"user-001", name:"Mara Esche", email:"office@example.invalid", role:"admin", initials:"ME", team:"Leitung" },
    { id:"user-002", name:"Joris Bach", email:"field@example.invalid", role:"team", initials:"JB", team:"Außendienst" },
    { id:"user-003", name:"Alva Stein", email:"inspection@example.invalid", role:"certifier", initials:"AS", team:"Gutachten" },
    { id:"user-004", name:"Sam Winter", email:"crew2@example.invalid", role:"team", initials:"SW", team:"Außendienst" },
    { id:"user-005", name:"Keno West", email:"audit@example.invalid", role:"certifier", initials:"KW", team:"Gutachten" },
    { id:"user-006", name:"Stadt Beispielstadt", email:"client@example.invalid", role:"client", initials:"GE", team:"Auftraggeber" },
    { id:"user-007", name:"Kira Saal", email:"crew3@example.invalid", role:"team", initials:"KS", team:"Außendienst", licenses:["B"], maxVehicleWeightKg:3500 },
    { id:"user-008", name:"Tilo Tal", email:"crew4@example.invalid", role:"team", initials:"TT", team:"Außendienst", licenses:["B","BE","C","CE"], maxVehicleWeightKg:null },
  ],

  vehicles: [
    { id:"veh-001", name:"Mercedes 22m Hubsteiger", type:"hubsteiger", plate:"DEMO-LIFT-01",
      weightKg:3200, requiredLicense:"B", heightM:22, seats:2, status:"verfügbar",
      notes:"Bis 3,5t, von Kira fahrbar. Ideal für Kronenpflege entlang Straße." },
    { id:"veh-002", name:"VW TGE 3", type:"transporter", plate:"DEMO-TRANS-42",
      weightKg:5000, requiredLicense:"C1/C", heightM:null, seats:3, status:"verfügbar",
      notes:"5-Tonner für Material, Schnittgut und Zugfahrzeug für Hacker. Kira darf ihn nicht fahren." },
  ],

  equipment: [
    { id:"eq-001", name:"Schliesing Hacker", type:"hacker", attachedTo:"veh-002",
      requiredLicense:"BE/CE mit Zugkombination", status:"verfügbar",
      notes:"Wird hinten an den TGE gekoppelt. Fahrer mit CE: Tilo." },
  ],

  orders: [
    { id:"AUF-2026-001", title:"Kronenpflege Musterstraße Musterstadt",
      client:"Stadt Musterstadt", street:"Musterstraße", city:"Musterstadt",
      description:"Links und rechts die Straßenbäume schneiden. Kronenpflege inklusive Stamm- und Stockaustriebe.",
      status:"geplant", priority:"hoch", scheduledDate:"2026-06-04", startTime:"07:30", estimatedHours:8,
      crewIds:["user-007","user-008"], vehicleIds:["veh-001","veh-002"], equipmentIds:["eq-001"],
      treeIds:["TRE-2026-101","TRE-2026-102","TRE-2026-103","TRE-2026-104","TRE-2026-105","TRE-2026-106","TRE-2026-107","TRE-2026-108"],
      measureIds:["MAU-101"], access:"Straßenrand beidseitig, abschnittsweise mit Arbeitsstellenabsicherung.",
      safety:["Warnkleidung Klasse 3","Arbeitsbereich mit Baken sichern","Hacker nur in abgesicherter Bucht betreiben","Hubsteiger auf tragfähigem Untergrund abstützen"],
      workflow:[
        { label:"Anfahrt und Absicherung", owner:"user-008", done:false },
        { label:"Linke Straßenseite von West nach Ost schneiden", owner:"user-007", done:false },
        { label:"Rechte Straßenseite von West nach Ost schneiden", owner:"user-008", done:false },
        { label:"Schnittgut hacken und Fahrbahn reinigen", owner:"user-008", done:false },
        { label:"Fotodokumentation je Abschnitt", owner:"user-007", done:false },
      ],
    },
  ],

  roleLabels: {
    admin: "Admin", team: "Team-Mitglied", certifier: "Gutachter / Zertifizierer",
    client: "Auftraggeber", single: "Einzeluser",
  },

  measureTypes: {
    baumschnitt:  { label:"Baumpflege & Baumschnitt", color:"#2E7D52" },
    seilklettern: { label:"Seilklettertechnik",        color:"#1565A0" },
    eps:          { label:"EPS-Bekämpfung",            color:"#B71C1C" },
    rodung:       { label:"Rodungsarbeiten",            color:"#6D4C41" },
    mulcher:      { label:"Forstmulchereinsatz",        color:"#558B2F" },
    wurzel:       { label:"Wurzelbeseitigung",          color:"#E65100" },
    faellung:     { label:"Baumfällung",                color:"#4A148C" },
    kran:         { label:"Fällkraneinsatz",            color:"#37474F" },
    bagger:       { label:"Fällbaggereinsatz",          color:"#263238" },
  },

  statusColors: {
    gut:"#2E7D52", mittel:"#E6A817", schlecht:"#D84315", kritisch:"#B71C1C",
  },
};

const TREELINE_DB_VERSION = 4;

function initializeTreelineDatabase() {
  const storageKey = "treeline_public_database";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.version === TREELINE_DB_VERSION && Array.isArray(saved?.data?.trees)) {
      return saved.data;
    }
  } catch (e) {
    console.warn("Treeline database reset: stored data was invalid.", e);
  }

  const data = JSON.parse(JSON.stringify(TREELINE_SEED_DATA));
  localStorage.setItem(storageKey, JSON.stringify({ version: TREELINE_DB_VERSION, data }));
  return data;
}

window.MOCK_DATA = initializeTreelineDatabase();
window.TREELINE_TREE_SPECIES = TREELINE_TREE_SPECIES;
window.TREELINE_SPECIES = { getLatinName: getLatinSpeciesForTreeName };
window.TREELINE_DB = {
  save() {
    localStorage.setItem("treeline_public_database", JSON.stringify({ version: TREELINE_DB_VERSION, data: window.MOCK_DATA }));
  },
  async saveTree(tree) {
    if (!window.TREELINE_APPWRITE) return null;
    return window.TREELINE_APPWRITE.saveTree(tree);
  },
  async saveOrder(order) {
    if (!window.TREELINE_APPWRITE) return null;
    return window.TREELINE_APPWRITE.saveOrder(order);
  },
  reset() {
    localStorage.removeItem("treeline_public_database");
    window.MOCK_DATA = initializeTreelineDatabase();
    return window.MOCK_DATA;
  },
};
