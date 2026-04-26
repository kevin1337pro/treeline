// Treeline – Mock Data
const TREELINE_SEED_DATA = {
  currentUser: {
    id: "user-001", name: "Markus Enbergs", email: "m.enbergs@enbergs.de",
    role: "admin", initials: "ME",
  },

  trees: [
    { id:"TRE-2024-001", name:"Stieleiche", species:"Quercus robur", lat:51.59683, lng:6.99559,
      status:"gut", height:18.5, trunkDiam:42, crownDiam:12, age:85, certified:true,
      certDate:"2024-03-15", certifier:"Dr. Klaus Weber", vta:"VTA Stufe 2",
      standort:"Buerelterstraße 27, 45896 Gelsenkirchen", tags:["Naturdenkmal","Monitoring"],
      notes:"Leichte Kronenverlichtung im Osten. Vitalitätsstufe 2.", owner:"Stadt Gelsenkirchen",
      assignedTo:"user-002", measuresIds:["MAU-001","MAU-003"], images:[], createdAt:"2024-01-10" },
    { id:"TRE-2024-002", name:"Rotbuche", species:"Fagus sylvatica", lat:51.59802, lng:6.99372,
      status:"mittel", height:22.0, trunkDiam:61, crownDiam:16, age:120, certified:true,
      certDate:"2024-02-20", certifier:"Dr. Klaus Weber", vta:"VTA Stufe 3",
      standort:"Buerelterstraße 34, 45896 Gelsenkirchen", tags:["Schutzbedarf"],
      notes:"Pilzbefall am Stammfuß. Eingehende Kontrolle empfohlen.", owner:"Landesforst Brandenburg",
      assignedTo:"user-003", measuresIds:["MAU-002"], images:[], createdAt:"2024-01-15" },
    { id:"TRE-2024-003", name:"Gemeine Kiefer", species:"Pinus sylvestris", lat:51.59572, lng:6.99821,
      status:"kritisch", height:14.0, trunkDiam:28, crownDiam:6, age:45, certified:false,
      certDate:null, certifier:null, vta:"Ausstehend",
      standort:"Buerelterstraße 21, 45896 Gelsenkirchen", tags:["Fällkandidat","EPS-Befall"],
      notes:"Starker Eichenprozessionsspinner-Befall. Sofortmaßnahme erforderlich.", owner:"Privat",
      assignedTo:"user-002", measuresIds:["MAU-004"], images:[], createdAt:"2024-02-01" },
    { id:"TRE-2024-004", name:"Silberpappel", species:"Populus alba", lat:51.59917, lng:6.99795,
      status:"schlecht", height:25.0, trunkDiam:78, crownDiam:18, age:65, certified:true,
      certDate:"2024-01-08", certifier:"Anna Schneider", vta:"VTA Stufe 4",
      standort:"Buerelterstraße 125, 45896 Gelsenkirchen", tags:["Totholz","Fällkandidat"],
      notes:"Starke Höhlenbildung, Totholzanteil > 30%. Fällung geplant.", owner:"Stadt Gelsenkirchen",
      assignedTo:"user-004", measuresIds:["MAU-005","MAU-006"], images:[], createdAt:"2024-01-20" },
    { id:"TRE-2024-005", name:"Spitzahorn", species:"Acer platanoides", lat:51.59614, lng:6.99283,
      status:"gut", height:11.5, trunkDiam:22, crownDiam:9, age:30, certified:true,
      certDate:"2024-03-20", certifier:"Anna Schneider", vta:"VTA Stufe 1",
      standort:"Schwedenstraße 5, 45896 Gelsenkirchen", tags:["Neupflanzung"],
      notes:"Junger, vitaler Baum. Formschnitt empfohlen.", owner:"Schule Gelsenkirchen",
      assignedTo:"user-002", measuresIds:[], images:[], createdAt:"2024-03-01" },
    { id:"TRE-2024-006", name:"Hainbuche", species:"Carpinus betulus", lat:51.60012, lng:6.99451,
      status:"gut", height:9.0, trunkDiam:18, crownDiam:7, age:25, certified:false,
      certDate:null, certifier:null, vta:"Ausstehend",
      standort:"Oberscholvener Straße 11, 45896 Gelsenkirchen", tags:[],
      notes:"Zertifizierung ausstehend.", owner:"Privat",
      assignedTo:null, measuresIds:[], images:[], createdAt:"2024-03-10" },
    { id:"TRE-2024-007", name:"Traubenkirsche", species:"Prunus padus", lat:51.59459, lng:6.99674,
      status:"mittel", height:8.5, trunkDiam:15, crownDiam:6, age:20, certified:true,
      certDate:"2024-04-01", certifier:"Dr. Klaus Weber", vta:"VTA Stufe 2",
      standort:"Waldrand Scholven, 45896 Gelsenkirchen", tags:["Drohnen-Aufnahme"],
      notes:"Drohnenaufnahme ausstehend für Kronenkontrolle.", owner:"Landesforst Brandenburg",
      assignedTo:"user-003", measuresIds:[], images:[], createdAt:"2024-04-01" },
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
  ],

  users: [
    { id:"user-001", name:"Markus Enbergs", email:"m.enbergs@enbergs.de", role:"admin", initials:"ME", team:"Leitung" },
    { id:"user-002", name:"Jan Becker", email:"j.becker@enbergs.de", role:"team", initials:"JB", team:"Außendienst" },
    { id:"user-003", name:"Anna Schneider", email:"a.schneider@enbergs.de", role:"certifier", initials:"AS", team:"Gutachten" },
    { id:"user-004", name:"Stefan Wolf", email:"s.wolf@enbergs.de", role:"team", initials:"SW", team:"Außendienst" },
    { id:"user-005", name:"Klaus Weber", email:"k.weber@enbergs.de", role:"certifier", initials:"KW", team:"Gutachten" },
    { id:"user-006", name:"Stadt Gelsenkirchen", email:"kontakt@gelsenkirchen.de", role:"client", initials:"GE", team:"Auftraggeber" },
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

const TREELINE_DB_VERSION = 3;

function initializeTreelineDatabase() {
  const storageKey = "treeline_database";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.version === TREELINE_DB_VERSION && saved?.data?.trees?.length) {
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
window.TREELINE_DB = {
  save() {
    localStorage.setItem("treeline_database", JSON.stringify({ version: TREELINE_DB_VERSION, data: window.MOCK_DATA }));
  },
  async saveTree(tree) {
    if (!window.TREELINE_APPWRITE) return null;
    return window.TREELINE_APPWRITE.saveTree(tree);
  },
  reset() {
    localStorage.removeItem("treeline_database");
    window.MOCK_DATA = initializeTreelineDatabase();
    return window.MOCK_DATA;
  },
};
