import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const endpoint = mustEnv("APPWRITE_ENDPOINT").replace(/\/$/, "");
const projectId = mustEnv("APPWRITE_PROJECT_ID");
const apiKey = mustEnv("APPWRITE_API_KEY");
const databaseId = process.env.APPWRITE_DATABASE_ID || "treeline";
const collectionId = process.env.APPWRITE_TREES_COLLECTION_ID || "trees";
const appCollections = {
  trees: collectionId,
  orders: process.env.APPWRITE_ORDERS_COLLECTION_ID || "orders",
  measures: process.env.APPWRITE_MEASURES_COLLECTION_ID || "measures",
  users: process.env.APPWRITE_USERS_COLLECTION_ID || "users",
  vehicles: process.env.APPWRITE_VEHICLES_COLLECTION_ID || "vehicles",
  equipment: process.env.APPWRITE_EQUIPMENT_COLLECTION_ID || "equipment",
  routes: process.env.APPWRITE_ROUTES_COLLECTION_ID || "routes",
  plantings: process.env.APPWRITE_PLANTINGS_COLLECTION_ID || "plantings",
  media: process.env.APPWRITE_MEDIA_COLLECTION_ID || "media",
};

const headers = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": projectId,
  "X-Appwrite-Key": apiKey,
};

function mustEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
  return value;
}

async function request(pathname, options = {}) {
  const res = await fetch(`${endpoint}${pathname}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function exists(pathname) {
  try {
    return await request(pathname);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function ensureDatabase() {
  const current = await exists(`/databases/${databaseId}`);
  if (current) return current;
  return request("/databases", {
    method: "POST",
    body: JSON.stringify({ databaseId, name: "Treeline", enabled: true }),
  });
}

async function ensureCollection() {
  const pathname = `/databases/${databaseId}/collections/${collectionId}`;
  const current = await exists(pathname);
  if (current) return current;
  return request(`/databases/${databaseId}/collections`, {
    method: "POST",
    body: JSON.stringify({
      collectionId,
      name: "Trees",
      permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
      documentSecurity: true,
      enabled: true,
    }),
  });
}

async function ensureGenericCollection(targetCollectionId, name) {
  const pathname = `/databases/${databaseId}/collections/${targetCollectionId}`;
  const current = await exists(pathname);
  if (current) return current;
  return request(`/databases/${databaseId}/collections`, {
    method: "POST",
    body: JSON.stringify({
      collectionId: targetCollectionId,
      name,
      permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
      documentSecurity: true,
      enabled: true,
    }),
  });
}

async function ensureAttribute(type, body) {
  const attrPath = `/databases/${databaseId}/collections/${collectionId}/attributes/${body.key}`;
  if (await exists(attrPath)) return;
  try {
    await request(`/databases/${databaseId}/collections/${collectionId}/attributes/${type}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
  await waitForAttribute(body.key);
}

async function waitForAttribute(key) {
  const attrPath = `/databases/${databaseId}/collections/${collectionId}/attributes/${key}`;
  for (let i = 0; i < 40; i += 1) {
    const attr = await exists(attrPath);
    if (attr?.status === "available") return;
    if (attr?.status === "failed") throw new Error(`Attribute ${key} failed to build.`);
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  throw new Error(`Attribute ${key} was not available in time.`);
}

async function ensureIndex(key, type, attributes) {
  const indexPath = `/databases/${databaseId}/collections/${collectionId}/indexes/${key}`;
  if (await exists(indexPath)) return;
  try {
    await request(`/databases/${databaseId}/collections/${collectionId}/indexes`, {
      method: "POST",
      body: JSON.stringify({ key, type, attributes }),
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
}

async function ensureCollectionAttribute(targetCollectionId, type, body) {
  const attrPath = `/databases/${databaseId}/collections/${targetCollectionId}/attributes/${body.key}`;
  if (await exists(attrPath)) return;
  try {
    await request(`/databases/${databaseId}/collections/${targetCollectionId}/attributes/${type}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
  await waitForCollectionAttribute(targetCollectionId, body.key);
}

async function waitForCollectionAttribute(targetCollectionId, key) {
  const attrPath = `/databases/${databaseId}/collections/${targetCollectionId}/attributes/${key}`;
  for (let i = 0; i < 40; i += 1) {
    const attr = await exists(attrPath);
    if (attr?.status === "available") return;
    if (attr?.status === "failed") throw new Error(`Attribute ${targetCollectionId}.${key} failed to build.`);
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  throw new Error(`Attribute ${targetCollectionId}.${key} was not available in time.`);
}

async function ensureCollectionIndex(targetCollectionId, key, type, attributes) {
  const indexPath = `/databases/${databaseId}/collections/${targetCollectionId}/indexes/${key}`;
  if (await exists(indexPath)) return;
  try {
    await request(`/databases/${databaseId}/collections/${targetCollectionId}/indexes`, {
      method: "POST",
      body: JSON.stringify({ key, type, attributes }),
    });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
}

function loadSeedData() {
  const dataJs = fs.readFileSync(path.resolve("components/data.js"), "utf8");
  const storage = new Map();
  const context = {
    window: {},
    console,
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
  };
  vm.runInNewContext(dataJs, context, { filename: "components/data.js" });
  return context.window.MOCK_DATA;
}

function toDocument(tree) {
  return {
    treeId: tree.id,
    name: tree.name || "",
    species: tree.species || "",
    standort: tree.standort || "",
    status: tree.status || "gut",
    lat: Number(tree.lat) || 0,
    lng: Number(tree.lng) || 0,
    height: Number(tree.height) || 0,
    trunkDiam: Number(tree.trunkDiam) || 0,
    crownDiam: Number(tree.crownDiam) || 0,
    age: Number(tree.age) || 0,
    certified: Boolean(tree.certified),
    certDate: tree.certDate || "",
    certifier: tree.certifier || "",
    vta: tree.vta || "",
    owner: tree.owner || "",
    tagsJson: JSON.stringify(tree.tags || []),
    notes: tree.notes || "",
    assignedTo: tree.assignedTo || "",
    measuresIdsJson: JSON.stringify(tree.measuresIds || []),
    imagesJson: JSON.stringify(tree.images || []),
    createdAt: tree.createdAt || new Date().toISOString().slice(0, 10),
  };
}

async function upsertDocument(tree) {
  const documentId = tree.id.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 36);
  const pathname = `/databases/${databaseId}/collections/${collectionId}/documents`;
  const payload = {
    documentId,
    data: toDocument(tree),
    permissions: ['read("any")', 'update("any")', 'delete("any")'],
  };
  try {
    await request(pathname, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) {
    if (err.status !== 409) throw err;
    await request(`${pathname}/${documentId}`, {
      method: "PATCH",
      body: JSON.stringify({ data: payload.data, permissions: payload.permissions }),
    });
  }
}

function writeFrontendConfig() {
  const configPath = path.resolve("components/appwrite.config.js");
  const content = `window.TREELINE_APPWRITE_CONFIG = ${JSON.stringify({
    endpoint,
    projectId,
    databaseId,
    treesCollectionId: collectionId,
    collectionIds: appCollections,
  }, null, 2)};\n`;
  fs.writeFileSync(configPath, content);
  return configPath;
}

function documentIdFromId(id) {
  return String(id).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 36);
}

function genericDocument(item, fallbackId, type) {
  const itemId = item.id || fallbackId;
  return {
    itemId,
    title: item.title || item.name || item.label || item.email || itemId,
    status: item.status || "aktiv",
    type: item.type || item.role || type,
    scheduledDate: item.scheduledDate || item.date || item.plannedDate || "",
    rawJson: JSON.stringify(item),
  };
}

async function ensureGenericSchema(targetCollectionId) {
  const strings = [
    ["itemId", 80, true],
    ["title", 255, true],
    ["status", 64, false],
    ["type", 80, false],
    ["scheduledDate", 32, false],
    ["rawJson", 12000, true],
  ];
  for (const [key, size, required] of strings) {
    await ensureCollectionAttribute(targetCollectionId, "string", { key, size, required, default: required ? undefined : "", array: false });
  }
  await ensureCollectionIndex(targetCollectionId, "itemId_unique", "unique", ["itemId"]);
  await ensureCollectionIndex(targetCollectionId, "title_fulltext", "fulltext", ["title"]);
  await ensureCollectionIndex(targetCollectionId, "status_key", "key", ["status"]);
}

async function upsertGenericDocument(targetCollectionId, item, fallbackId, type) {
  const doc = genericDocument(item, fallbackId, type);
  const documentId = documentIdFromId(doc.itemId);
  const pathname = `/databases/${databaseId}/collections/${targetCollectionId}/documents`;
  const payload = {
    documentId,
    data: doc,
    permissions: ['read("any")', 'update("any")', 'delete("any")'],
  };
  try {
    await request(pathname, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) {
    if (err.status !== 409) throw err;
    await request(`${pathname}/${documentId}`, {
      method: "PATCH",
      body: JSON.stringify({ data: payload.data, permissions: payload.permissions }),
    });
  }
}

await ensureDatabase();
await ensureCollection();

const strings = [
  ["treeId", 36, true],
  ["name", 160, true],
  ["species", 160, false],
  ["standort", 255, false],
  ["status", 32, true],
  ["certDate", 32, false],
  ["certifier", 160, false],
  ["vta", 80, false],
  ["owner", 160, false],
  ["tagsJson", 1000, false],
  ["notes", 2000, false],
  ["assignedTo", 80, false],
  ["measuresIdsJson", 1000, false],
  ["imagesJson", 2000, false],
  ["createdAt", 32, false],
];

for (const [key, size, required] of strings) {
  await ensureAttribute("string", { key, size, required, default: required ? undefined : "", array: false });
}

for (const key of ["lat", "lng", "height", "trunkDiam", "crownDiam"]) {
  await ensureAttribute("float", { key, required: false, default: 0, array: false });
}

await ensureAttribute("integer", { key: "age", required: false, min: 0, default: 0, array: false });
await ensureAttribute("boolean", { key: "certified", required: false, default: false, array: false });

await ensureIndex("treeId_unique", "unique", ["treeId"]);
await ensureIndex("status_key", "key", ["status"]);
await ensureIndex("name_fulltext", "fulltext", ["name"]);
await ensureIndex("standort_fulltext", "fulltext", ["standort"]);

const seed = loadSeedData();
for (const tree of seed.trees) {
  await upsertDocument(tree);
}

const genericCollections = [
  ["orders", "Orders", seed.orders || []],
  ["measures", "Measures", seed.measures || []],
  ["users", "Users", seed.users || []],
  ["vehicles", "Vehicles", seed.vehicles || []],
  ["equipment", "Equipment", seed.equipment || []],
  ["routes", "Routes", seed.routes || []],
  ["plantings", "Plantings", seed.plantings || []],
  ["media", "Media", seed.media || []],
];

for (const [key, name, items] of genericCollections) {
  const targetCollectionId = appCollections[key];
  await ensureGenericCollection(targetCollectionId, name);
  await ensureGenericSchema(targetCollectionId);
  for (const [idx, item] of items.entries()) {
    await upsertGenericDocument(targetCollectionId, item, `${key}-${idx + 1}`, key);
  }
}

const configPath = writeFrontendConfig();
console.log(`Appwrite database ready: ${databaseId}`);
console.log(`Collections ready: ${Object.values(appCollections).join(", ")}`);
console.log(`Seeded ${seed.trees.length} trees, ${(seed.orders || []).length} orders, ${(seed.measures || []).length} measures, ${(seed.users || []).length} users.`);
console.log(`Frontend config written: ${configPath}`);
