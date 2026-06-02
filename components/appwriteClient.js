function getTreelineAppwriteConfig() {
  if (window.TREELINE_APPWRITE_CONFIG) return window.TREELINE_APPWRITE_CONFIG;
  try {
    return JSON.parse(localStorage.getItem("treeline_appwrite_config"));
  } catch (e) {
    return null;
  }
}

function toAppwriteTreeDocument(tree) {
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

function documentIdFromId(id) {
  return String(id || crypto.randomUUID()).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 36);
}

function toGenericDocument(item, type) {
  const itemId = item.id || `${type}-${Date.now()}`;
  return {
    itemId,
    title: item.title || item.name || item.label || item.email || itemId,
    status: item.status || "aktiv",
    type: item.type || item.role || type,
    scheduledDate: item.scheduledDate || item.date || item.plannedDate || "",
    rawJson: JSON.stringify(item),
  };
}

function createTreelineAppwriteClient() {
  const config = getTreelineAppwriteConfig();
  if (!config?.endpoint || !config?.projectId || !config?.databaseId || !config?.treesCollectionId) {
    return null;
  }

  const endpoint = config.endpoint.replace(/\/$/, "");
  const headers = {
    "Content-Type": "application/json",
    "X-Appwrite-Project": config.projectId,
  };

  async function request(path, options = {}) {
    const res = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    if (res.status === 204) return null;
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message = body?.message || `Appwrite request failed with HTTP ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    return body;
  }

  return {
    async saveGeneric(collectionKey, item) {
      const collectionId = config.collectionIds?.[collectionKey];
      if (!collectionId) return null;
      const documentId = documentIdFromId(item.id);
      const path = `/databases/${config.databaseId}/collections/${collectionId}/documents`;
      const data = toGenericDocument(item, collectionKey);
      const payload = { documentId, data, permissions: ['read("any")', 'update("any")', 'delete("any")'] };
      try {
        return await request(path, { method: "POST", body: JSON.stringify(payload) });
      } catch (err) {
        if (err.status !== 409) throw err;
        return request(`${path}/${documentId}`, { method: "PATCH", body: JSON.stringify({ data: payload.data }) });
      }
    },
    async saveOrder(order) {
      return this.saveGeneric("orders", order);
    },
    async saveRoute(route) {
      return this.saveGeneric("routes", route);
    },
    async saveTree(tree) {
      const documentId = documentIdFromId(tree.id);
      const path = `/databases/${config.databaseId}/collections/${config.treesCollectionId}/documents`;
      const payload = { documentId, data: toAppwriteTreeDocument(tree), permissions: ['read("any")', 'update("any")', 'delete("any")'] };
      try {
        return await request(path, { method: "POST", body: JSON.stringify(payload) });
      } catch (err) {
        if (err.status !== 409) throw err;
        return request(`${path}/${documentId}`, { method: "PATCH", body: JSON.stringify({ data: payload.data }) });
      }
    },
  };
}

window.TREELINE_APPWRITE = createTreelineAppwriteClient();
