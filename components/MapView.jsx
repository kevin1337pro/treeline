function MapView({ currentUser, selectedOrderId, onSelectOrder, onSelectTree }) {
  const mapRef = React.useRef(null);
  const mapboxMap = React.useRef(null);
  const latest = React.useRef({});
  const focusRequest = React.useRef(0);
  const shellRef = React.useRef(null);
  const appliedStyle = React.useRef(null);
  const styleReady = React.useRef(false);
  const addModeRef = React.useRef(false);
  const toolModeRef = React.useRef("select");
  const routeDraftRef = React.useRef([]);
  const selectedOrderRef = React.useRef(null);
  const routeStorageKeyRef = React.useRef("treeline_public_route_draft_default");
  const listenersAttached = React.useRef(false);
  const [selectedTree, setSelectedTree] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [placeQuery, setPlaceQuery] = React.useState("");
  const [placeStatus, setPlaceStatus] = React.useState("");
  const [mapStyle, setMapStyle] = React.useState("mapbox://styles/mapbox/satellite-streets-v12");
  const [toolMode, setToolMode] = React.useState("select");
  const [openPanel, setOpenPanel] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);
  const [mapReady, setMapReady] = React.useState(false);
  const [mapError, setMapError] = React.useState("");
  const [mapAttempt, setMapAttempt] = React.useState(0);
  const [orderOnly, setOrderOnly] = React.useState(false);
  const [threeDEnabled, setThreeDEnabled] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [clickCoords, setClickCoords] = React.useState(null);
  const emptyTreeData = {
    name:"", species:"", status:"gut", standort:"",
    owner:"", assignedTo:"", height:0, trunkDiam:0, crownDiam:0, age:0,
    vta:"Ausstehend", tags:"", notes:"", orderId:"", routeSide:"links", routeIndex:"",
  };
  const [newTreeData, setNewTreeData] = React.useState(emptyTreeData);

  const { trees, statusColors, orders = [] } = MOCK_DATA;
  const mapboxToken = window.TREELINE_MAPBOX_TOKEN
    || localStorage.getItem("treeline_public_mapbox_token")
    || window.TREELINE_APPWRITE_CONFIG?.mapboxToken;
  const statusLabel = { gut:"Gut", mittel:"Mittel", schlecht:"Schlecht", kritisch:"Kritisch" };
  const statusOpts = [["all","Alle"],["gut","Gut"],["mittel","Mittel"],["schlecht","Schlecht"],["kritisch","Kritisch"]];
  const styleOpts = [
    ["mapbox://styles/mapbox/satellite-streets-v12", "Satellit"],
    ["mapbox://styles/mapbox/streets-v12", "Straße"],
    ["mapbox://styles/mapbox/outdoors-v12", "Outdoor"],
    ["mapbox://styles/mapbox/light-v11", "Büro"],
  ];

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
  const routeStorageKey = `treeline_public_route_draft_${selectedOrder?.id || "default"}`;
  const [routeDraft, setRouteDraft] = React.useState(() => {
    try {
      const initialOrderId = selectedOrderId || orders[0]?.id || "default";
      const saved = JSON.parse(localStorage.getItem(`treeline_public_route_draft_${initialOrderId}`));
      if (Array.isArray(saved) && saved.length) return validMapCoordinates(saved);
    } catch (e) {}
    return [];
  });
  const planningRoute = routeDraft.length ? routeDraft : getOrderPlanningCoordinates(selectedOrder);
  const activeToolLabel = { select:"Auswählen", tree:"Baum setzen", route:"Route zeichnen" }[toolMode];

  React.useEffect(() => {
    routeDraftRef.current = routeDraft;
  }, [routeDraft]);

  React.useEffect(() => {
    function escape(event) {
      if (event.key !== "Escape") return;
      if (openPanel) {
        setOpenPanel(null);
        shellRef.current?.querySelector(`[data-panel="${openPanel}"]`)?.focus();
      } else if (showAddForm) cancelAdd();
      else if (selectedTree) setSelectedTree(null);
      else if (toolMode !== "select") setToolMode("select");
      else setExpanded(false);
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [openPanel, showAddForm, selectedTree, toolMode]);

  React.useEffect(() => {
    if (!placeStatus) return;
    const timer = window.setTimeout(() => setPlaceStatus(""), 6000);
    return () => window.clearTimeout(timer);
  }, [placeStatus]);

  React.useEffect(() => {
    selectedOrderRef.current = selectedOrder;
    routeStorageKeyRef.current = routeStorageKey;
  }, [selectedOrder?.id, routeStorageKey]);

  React.useEffect(() => {
    if (!selectedOrder) return;
    focusRequest.current += 1;
    setPlaceQuery("");
    setSelectedTree(null);
    setShowAddForm(false);
    setToolMode("select");
    setClickCoords(null);
    let restoredDraft = [];
    try {
      const saved = JSON.parse(localStorage.getItem(routeStorageKey));
      const next = validMapCoordinates(saved);
      restoredDraft = next;
      routeDraftRef.current = next;
      setRouteDraft(next);
    } catch (e) {
      routeDraftRef.current = [];
      setRouteDraft([]);
    }
    const timer = window.setTimeout(() => {
      if (restoredDraft.length) {
        fitOrderBounds(selectedOrder, restoredDraft);
        setPlaceStatus(`${selectedOrder.id} fokussiert.`);
        return;
      }
      focusOrder(selectedOrder, { silent:false });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [selectedOrder?.id]);

  React.useEffect(() => {
    if (mapboxMap.current || !mapRef.current) return;
    setMapReady(false);
    styleReady.current = false;
    setMapError("");
    if (!mapboxToken) {
      setMapError("Mapbox-Token fehlt. Bitte die Kartenkonfiguration prüfen.");
      return;
    }
    if (!window.mapboxgl) {
      setMapError("Kartenbibliothek nicht geladen. Bitte die Seite neu laden.");
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const orderCenter = getOrderCoordinates(null, selectedOrder)[0] || [7.47912, 51.49162];
    let map;
    try { map = new mapboxgl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: orderCenter,
      zoom: selectedOrder ? 16.5 : 15,
      pitch: 0,
      bearing: 0,
      attributionControl: true,
    }); } catch (error) {
      setMapError("Karte konnte nicht gestartet werden. Bitte WebGL und die Verbindung prüfen.");
      return;
    }
    mapboxMap.current = map;
    appliedStyle.current = mapStyle;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }), "top-right");

    map.on("style.load", () => {
      styleReady.current = true;
      latest.current.addMapSourcesAndLayers();
      latest.current.apply3DMode();
      latest.current.updateMapData();
      latest.current.attachMapListeners();
      setMapReady(true);
      setMapError("");
    });
    map.on("load", () => {
      if (toolModeRef.current === "select") latest.current.focusOrder(selectedOrderRef.current, { silent:true });
    });
    map.on("error", event => {
      const status = event.error?.status;
      setMapError(status === 401 || status === 403
        ? "Mapbox-Zugriff abgelehnt. Token und erlaubte Domains prüfen."
        : "Kartendaten konnten nicht vollständig geladen werden. Verbindung prüfen oder erneut laden.");
    });
    // Mapbox only observes window resizing, not sidebar/panel layout changes.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      focusRequest.current += 1;
      map.remove();
      mapboxMap.current = null;
      listenersAttached.current = false;
    };
  }, [mapAttempt]);

  React.useEffect(() => {
    toolModeRef.current = toolMode;
    addModeRef.current = toolMode === "tree";
    if (mapboxMap.current) {
      mapboxMap.current.getCanvas().style.cursor = toolMode === "select" ? "" : "crosshair";
      if (toolMode === "route") mapboxMap.current.doubleClickZoom.disable();
      else mapboxMap.current.doubleClickZoom.enable();
    }
  }, [toolMode, mapAttempt]);

  React.useEffect(() => {
    const map = mapboxMap.current;
    if (!map) return;
    if (appliedStyle.current === mapStyle) return;
    appliedStyle.current = mapStyle;
    styleReady.current = false;
    setMapReady(false);
    // A full style load reliably restores our sources, including during route edits.
    map.setStyle(mapStyle, { diff:false });
  }, [mapStyle]);

  React.useEffect(() => {
    updateMapData();
  }, [filter, orderOnly, toolMode, selectedOrder?.id, selectedTree?.id, clickCoords?.lat, clickCoords?.lng, trees.length, routeDraft]);

  React.useEffect(() => {
    apply3DMode();
  }, [threeDEnabled]);

  function treeFeatures() {
    const visibleTrees = trees.filter(t => (filter === "all" || t.status === filter)
      && (!orderOnly || t.orderId === selectedOrder?.id || selectedOrder?.treeIds?.includes(t.id))
      && Number.isFinite(t.lng) && Number.isFinite(t.lat));
    return {
      type: "FeatureCollection",
      features: visibleTrees.map(tree => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [tree.lng, tree.lat] },
        properties: {
          id: tree.id,
          name: tree.name,
          species: tree.species || "",
          status: tree.status,
          color: statusColors[tree.status] || "#888",
          routeSide: tree.routeSide || "",
          routeIndex: tree.routeIndex || "",
          routeLabel: tree.routeIndex ? `${tree.routeSide === "links" ? "L" : tree.routeSide === "rechts" ? "R" : ""}${tree.routeIndex}` : "",
          orderId: tree.orderId || "",
        },
      })),
    };
  }

  function tempFeature() {
    return {
      type: "FeatureCollection",
      features: clickCoords ? [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [clickCoords.lng, clickCoords.lat] },
        properties: { label: "+" },
      }] : [],
    };
  }

  function routeFeature(side) {
    const coords = getOrderTrees(side).map(t => [t.lng, t.lat]);
    return {
      type: "FeatureCollection",
      features: coords.length > 1 ? [{
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: { side },
      }] : [],
    };
  }

  function planningRouteFeature() {
    return {
      type: "FeatureCollection",
      features: planningRoute.length > 1 ? [{
        type: "Feature",
        geometry: { type: "LineString", coordinates: planningRoute },
        properties: { type:"planning-route" },
      }] : [],
    };
  }

  function planningRoutePointsFeature() {
    return {
      type: "FeatureCollection",
      features: planningRoute.map((coord, index) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: coord },
        properties: { index:index + 1, label:String(index + 1), draft:routeDraft.length > 0 },
      })),
    };
  }

  function getOrderTrees(side, order = selectedOrder) {
    if (!order) return [];
    return (order.treeIds || [])
      .map(id => trees.find(t => t.id === id))
      .filter(t => t && Number.isFinite(t.lat) && Number.isFinite(t.lng) && (!side || t.routeSide === side))
      .sort((a, b) => (a.routeIndex || 0) - (b.routeIndex || 0));
  }

  function getOrderCoordinates(side, order = selectedOrder) {
    return getOrderTrees(side, order).map(t => [t.lng, t.lat]);
  }

  function getOrderPlanningCoordinates(order = selectedOrder) {
    if (!order) return [];
    const saved = validMapCoordinates(order.planningRoute);
    if (saved.length) return saved;
    return [];
  }

  function addMapSourcesAndLayers() {
    const map = mapboxMap.current;
    if (!map || !styleReady.current) return;

    add3DBuildingsLayer();

    if (!map.getSource("treeline-left-route")) {
      map.addSource("treeline-left-route", { type:"geojson", data: routeFeature("links") });
      map.addLayer({
        id:"treeline-left-route-line",
        type:"line",
        source:"treeline-left-route",
        layout:{ "line-cap":"round", "line-join":"round" },
        paint:{ "line-color":"#1565A0", "line-width":5, "line-opacity":0.78 },
      });
    }

    if (!map.getSource("treeline-right-route")) {
      map.addSource("treeline-right-route", { type:"geojson", data: routeFeature("rechts") });
      map.addLayer({
        id:"treeline-right-route-line",
        type:"line",
        source:"treeline-right-route",
        layout:{ "line-cap":"round", "line-join":"round" },
        paint:{ "line-color":"#E65100", "line-width":5, "line-opacity":0.78 },
      });
    }

    if (!map.getSource("treeline-trees")) {
      map.addSource("treeline-trees", { type:"geojson", data: treeFeatures() });
      map.addLayer({
        id:"treeline-tree-halo",
        type:"circle",
        source:"treeline-trees",
        paint:{
          "circle-radius":["case", ["==", ["get", "id"], selectedTree?.id || ""], 18, 13],
          "circle-color":["get", "color"],
          "circle-opacity":0.18,
        },
      });
      map.addLayer({
        id:"treeline-tree-circle",
        type:"circle",
        source:"treeline-trees",
        paint:{
          "circle-radius":["case", ["==", ["get", "id"], selectedTree?.id || ""], 12, 10],
          "circle-color":["get", "color"],
          "circle-stroke-color":"#fff",
          "circle-stroke-width":2,
        },
      });
      map.addLayer({
        id:"treeline-tree-label",
        type:"symbol",
        source:"treeline-trees",
        layout:{
          "text-field":["coalesce", ["get", "routeLabel"], ""],
          "text-size":10,
          "text-font":["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset":[0, 0.05],
          "text-allow-overlap":true,
        },
        paint:{ "text-color":"#fff" },
      });
    }

    if (!map.getSource("treeline-planning-route")) {
      map.addSource("treeline-planning-route", { type:"geojson", data: planningRouteFeature() });
      map.addLayer({
        id:"treeline-planning-route-line",
        type:"line",
        source:"treeline-planning-route",
        layout:{ "line-cap":"round", "line-join":"round" },
        paint:{
          "line-color":"#111827",
          "line-width":4,
          "line-opacity":0.84,
          "line-dasharray":[1.2, 1.2],
        },
      });
    }

    if (!map.getSource("treeline-planning-route-points")) {
      map.addSource("treeline-planning-route-points", { type:"geojson", data: planningRoutePointsFeature() });
      map.addLayer({
        id:"treeline-planning-route-point-circle",
        type:"circle",
        source:"treeline-planning-route-points",
        layout:{ visibility:toolMode === "route" ? "visible" : "none" },
        paint:{
          "circle-radius":10,
          "circle-color":"#111827",
          "circle-stroke-color":"#fff",
          "circle-stroke-width":2,
        },
      });
      map.addLayer({
        id:"treeline-planning-route-point-label",
        type:"symbol",
        source:"treeline-planning-route-points",
        layout:{
          visibility:toolMode === "route" ? "visible" : "none",
          "text-field":["get", "label"],
          "text-size":11,
          "text-font":["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap":true,
        },
        paint:{ "text-color":"#fff" },
      });
    }

    if (!map.getSource("treeline-temp-point")) {
      map.addSource("treeline-temp-point", { type:"geojson", data: tempFeature() });
      map.addLayer({
        id:"treeline-temp-circle",
        type:"circle",
        source:"treeline-temp-point",
        paint:{
          "circle-radius":12,
          "circle-color":"#E6A817",
          "circle-stroke-color":"#fff",
          "circle-stroke-width":3,
        },
      });
      map.addLayer({
        id:"treeline-temp-label",
        type:"symbol",
        source:"treeline-temp-point",
        layout:{
          "text-field":"+",
          "text-size":18,
          "text-font":["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap":true,
        },
        paint:{ "text-color":"#fff" },
      });
    }
  }

  function updateMapData() {
    const map = mapboxMap.current;
    if (!map || !styleReady.current) return;
    map.getSource("treeline-trees")?.setData(treeFeatures());
    map.getSource("treeline-temp-point")?.setData(tempFeature());
    map.getSource("treeline-left-route")?.setData(routeFeature("links"));
    map.getSource("treeline-right-route")?.setData(routeFeature("rechts"));
    map.getSource("treeline-planning-route")?.setData(planningRouteFeature());
    map.getSource("treeline-planning-route-points")?.setData(planningRoutePointsFeature());
    if (map.getLayer("treeline-tree-circle")) {
      map.setPaintProperty("treeline-tree-circle", "circle-radius", ["case", ["==", ["get", "id"], selectedTree?.id || ""], 12, 10]);
      map.setPaintProperty("treeline-tree-halo", "circle-radius", ["case", ["==", ["get", "id"], selectedTree?.id || ""], 18, 13]);
    }
    for (const layer of ["treeline-planning-route-point-circle", "treeline-planning-route-point-label"]) {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, "visibility", toolMode === "route" ? "visible" : "none");
    }
  }

  function attachMapListeners() {
    const map = mapboxMap.current;
    if (!map || listenersAttached.current) return;
    listenersAttached.current = true;

    map.on("click", "treeline-tree-circle", e => {
      const id = e.features?.[0]?.properties?.id;
      const tree = trees.find(t => t.id === id);
      if (tree && toolModeRef.current === "select") latest.current.selectTree(tree);
    });
    map.on("mouseenter", "treeline-tree-circle", () => {
      if (toolModeRef.current === "select") map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "treeline-tree-circle", () => {
      map.getCanvas().style.cursor = toolModeRef.current === "select" ? "" : "crosshair";
    });
    map.on("click", e => {
      setOpenPanel(null);
      if (!styleReady.current) return;
      if (toolModeRef.current === "route") {
        const next = [...routeDraftRef.current, [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))]];
        routeDraftRef.current = next;
        setRouteDraft(next);
        if (latest.current.persistRouteDraft(next)) setPlaceStatus(`Routenpunkt ${next.length} gesetzt.`);
        return;
      }
      if (!addModeRef.current) return;
      const features = map.queryRenderedFeatures(e.point, { layers:["treeline-tree-circle"] });
      if (features.length) return;
      setClickCoords({ lat:e.lngLat.lat, lng:e.lngLat.lng });
      setSelectedTree(null);
      const activeOrder = selectedOrderRef.current;
      setNewTreeData(prev => ({
        ...prev,
        orderId: activeOrder?.id || "",
        routeIndex: nextRouteIndex(prev.routeSide || "links", activeOrder?.id),
        tags: prev.tags || (activeOrder ? `Auftrag ${activeOrder.id}, Straßenbaum` : ""),
        owner: prev.owner || activeOrder?.client || "",
        standort:`${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`,
      }));
      setShowAddForm(true);
    });
  }

  function add3DBuildingsLayer() {
    const map = mapboxMap.current;
    if (!map || map.getLayer("treeline-3d-buildings")) return;
    const layers = map.getStyle().layers || [];
    const labelLayer = layers.find(layer => layer.type === "symbol" && layer.layout?.["text-field"]);
    if (!map.getSource("composite")) return;
    map.addLayer({
      id:"treeline-3d-buildings",
      source:"composite",
      "source-layer":"building",
      filter:["==", "extrude", "true"],
      type:"fill-extrusion",
      minzoom:15,
      paint:{
        "fill-extrusion-color":"#9ca3af",
        "fill-extrusion-height":["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
        "fill-extrusion-base":["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
        "fill-extrusion-opacity": threeDEnabled ? 0.42 : 0,
      },
    }, labelLayer?.id);
  }

  function apply3DMode() {
    const map = mapboxMap.current;
    if (!map || !styleReady.current) return;
    if (threeDEnabled && !map.getSource("treeline-dem")) {
      map.addSource("treeline-dem", {
        type:"raster-dem",
        url:"mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize:512,
        maxzoom:14,
      });
    }
    if (threeDEnabled) {
      map.setTerrain({ source:"treeline-dem", exaggeration:1.35 });
      map.setPitch(Math.max(map.getPitch(), 58));
      map.setBearing(map.getBearing() || -18);
      map.setFog({ color:"#f8f7f4", "high-color":"#dce9f8", "horizon-blend":0.08 });
    } else {
      map.setTerrain(null);
      map.setFog(null);
      map.setPitch(0);
      map.setBearing(0);
    }
    if (map.getLayer("treeline-3d-buildings")) {
      map.setPaintProperty("treeline-3d-buildings", "fill-extrusion-opacity", threeDEnabled ? 0.42 : 0);
    }
  }

  function fitOrderBounds(order = selectedOrder, coordsOverride = null) {
    const map = mapboxMap.current;
    const route = order?.id === selectedOrder?.id ? planningRoute : getOrderPlanningCoordinates(order);
    const coords = coordsOverride || (route.length ? route : getOrderCoordinates(null, order));
    if (!map || !coords.length) return;
    const bounds = coords.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(coords[0], coords[0]));
    const narrow = map.getContainer().clientWidth < 500;
    map.fitBounds(bounds, { padding:narrow ? 55 : 80, maxZoom:17.4, duration:700 });
  }

  async function focusOrder(order = selectedOrder, options = {}) {
    if (!order) return;
    const map = mapboxMap.current;
    if (!map) return;
    const request = ++focusRequest.current;
    const route = order.id === selectedOrder?.id ? planningRoute : getOrderPlanningCoordinates(order);
    const coords = route.length ? route : getOrderCoordinates(null, order);
    if (coords.length) {
      fitOrderBounds(order, coords);
      if (!options.silent) setPlaceStatus(`${order.id} fokussiert.`);
      return;
    }

    const query = [order.street, order.city].filter(Boolean).join(", ");
    if (!query || !mapboxToken) {
      if (!options.silent) setPlaceStatus("Auftrag hat noch keine Baumpositionen oder Adresse.");
      return;
    }

    if (!options.silent) setPlaceStatus("Auftragsadresse wird gesucht...");
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=de&limit=1&language=de&access_token=${encodeURIComponent(mapboxToken)}`;
      const res = await fetch(url, { headers:{ Accept:"application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (request !== focusRequest.current || map !== mapboxMap.current) return;
      const feature = data.features?.[0];
      if (!feature) {
        if (!options.silent) setPlaceStatus("Auftragsadresse nicht gefunden.");
        return;
      }
      map.flyTo({ center:feature.center, zoom:16.5, duration:800 });
      if (!options.silent) setPlaceStatus(`${order.id} fokussiert.`);
    } catch (err) {
      if (request !== focusRequest.current || map !== mapboxMap.current) return;
      if (!options.silent) setPlaceStatus("Auftragsadresse konnte nicht fokussiert werden.");
    }
  }

  function selectTree(tree) {
    setSelectedTree(tree);
    setFilter("all");
    setOrderOnly(false);
    setOpenPanel(null);
    setShowAddForm(false);
    setToolMode("select");
    mapboxMap.current?.flyTo({ center:[tree.lng, tree.lat], zoom:18, duration:650 });
  }

  function chooseTool(mode) {
    setToolMode(mode);
    toolModeRef.current = mode;
    setOpenPanel(null);
    setSelectedTree(null);
    setShowAddForm(false);
    setClickCoords(null);
    setNewTreeData(emptyTreeData);
    shellRef.current?.querySelector('[data-panel="tools"]')?.focus();
    if (mode === "route") mapboxMap.current?.doubleClickZoom.disable();
    else mapboxMap.current?.doubleClickZoom.enable();
  }

  function persistRouteDraft(next) {
    try {
      if (next.length) localStorage.setItem(routeStorageKeyRef.current, JSON.stringify(next));
      else localStorage.removeItem(routeStorageKeyRef.current);
      return true;
    } catch (error) {
      setPlaceStatus("Routenentwurf konnte nicht lokal gesichert werden.");
      return false;
    }
  }

  async function handlePlaceSearch(e) {
    e?.preventDefault();
    const q = placeQuery.trim();
    if (!q) return;

    const localTree = trees.find(t => {
      const haystack = `${t.id} ${t.name} ${t.species} ${t.standort} ${t.orderId || ""} ${(t.tags || []).join(" ")} ${t.routeSide || ""}`.toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
    if (localTree) {
      selectTree(localTree);
      setPlaceStatus("Lokaler Baumstandort gefunden.");
      return;
    }

    const localOrder = orders.find(o => {
      const haystack = `${o.id} ${o.title} ${o.client} ${o.street} ${o.city}`.toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
    if (localOrder) {
      setOpenPanel(null);
      onSelectOrder?.(localOrder.id);
      if (localOrder.id === selectedOrder?.id) await focusOrder(localOrder);
      return;
    }

    if (!mapboxToken) {
      setPlaceStatus("Mapbox Token fehlt.");
      return;
    }

    setPlaceStatus("Suche läuft...");
    const request = ++focusRequest.current;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=de&limit=1&language=de&access_token=${encodeURIComponent(mapboxToken)}`;
      const res = await fetch(url, { headers:{ Accept:"application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (request !== focusRequest.current || !mapboxMap.current) return;
      const feature = data.features?.[0];
      if (!feature) {
        setPlaceStatus("Kein Ort gefunden.");
        return;
      }
      mapboxMap.current?.flyTo({ center:feature.center, zoom:17, duration:800 });
      setOpenPanel(null);
      setPlaceStatus("Ort gefunden.");
    } catch (err) {
      if (request !== focusRequest.current || !mapboxMap.current) return;
      setPlaceStatus("Suche fehlgeschlagen.");
    }
  }

  async function confirmAddTree() {
    if (!clickCoords || !newTreeData.name.trim()) return;
    const prefix = `TRE-${new Date().getFullYear()}-`;
    let index = trees.length + 1;
    while (trees.some(tree => tree.id === prefix + String(index).padStart(3, "0"))) index += 1;
    const newId = prefix + String(index).padStart(3, "0");
    const tree = {
      ...newTreeData,
      id:newId,
      lat:clickCoords.lat,
      lng:clickCoords.lng,
      height:Number(newTreeData.height) || 0,
      trunkDiam:Number(newTreeData.trunkDiam) || 0,
      crownDiam:Number(newTreeData.crownDiam) || 0,
      age:Number(newTreeData.age) || 0,
      certified:false,
      certDate:null,
      certifier:null,
      assignedTo:newTreeData.assignedTo || null,
      tags:newTreeData.tags.split(",").map(t => t.trim()).filter(Boolean),
      measuresIds:[],
      images:[],
      ...treeStamp(currentUser,true),
      orderId:newTreeData.orderId || null,
      routeSide:newTreeData.orderId ? newTreeData.routeSide : null,
      routeIndex:newTreeData.orderId ? Number(newTreeData.routeIndex) || nextRouteIndex(newTreeData.routeSide, newTreeData.orderId) : null,
    };
    MOCK_DATA.trees.push(tree);
    if (tree.orderId) {
      const order = orders.find(o => o.id === tree.orderId);
      if (order) order.treeIds = [...new Set([...(order.treeIds || []), tree.id])];
      if (order) window.TREELINE_DB?.saveOrder?.(order).catch(err => console.warn("Appwrite order update failed; tree assignment is stored locally.", err));
    }
    window.TREELINE_DB?.save();
    window.TREELINE_DB?.saveTree?.(tree).catch(err => {
      console.warn("Appwrite save failed; tree is stored locally.", err);
      setPlaceStatus("Baum lokal gespeichert, Appwrite nicht erreichbar.");
    });
    setShowAddForm(false);
    setToolMode("select");
    setClickCoords(null);
    setNewTreeData(emptyTreeData);
    selectTree(tree);
  }

  function cancelAdd() {
    setShowAddForm(false);
    setToolMode("select");
    setClickCoords(null);
    setNewTreeData(emptyTreeData);
  }

  function nextRouteIndex(side, orderId = selectedOrder?.id) {
    const indexes = trees
      .filter(t => t.orderId === orderId && t.routeSide === side)
      .map(t => Number(t.routeIndex) || 0);
    return Math.max(0, ...indexes) + 1;
  }

  function undoRoutePoint() {
    const next = routeDraft.slice(0, -1);
    routeDraftRef.current = next;
    setRouteDraft(next);
    if (persistRouteDraft(next)) setPlaceStatus(next.length ? `Routenpunkt entfernt. ${next.length} Punkte bleiben.` : "Route geleert.");
  }

  function clearRouteDraft() {
    routeDraftRef.current = [];
    setRouteDraft([]);
    if (persistRouteDraft([])) setPlaceStatus("Gezeichnete Route gelöscht. Auftragsroute wird wieder angezeigt.");
  }

  function saveRouteDraft() {
    if (!selectedOrder || routeDraft.length < 2) return;
    const now = new Date().toISOString();
    const route = {
      id: `ROUTE-${selectedOrder.id}`,
      orderId: selectedOrder.id,
      title: `Arbeitsroute ${selectedOrder.title}`,
      status: "geplant",
      type: "work_route",
      coordinates: routeDraft,
      pointCount: routeDraft.length,
      updatedAt: now,
    };
    selectedOrder.planningRoute = routeDraft;
    selectedOrder.routeId = route.id;
    selectedOrder.updatedAt = now;
    window.TREELINE_DB?.save();
    window.TREELINE_DB?.saveOrder?.(selectedOrder).catch(err => {
      console.warn("Appwrite order save failed; route is stored locally.", err);
      setPlaceStatus("Route lokal gespeichert, Appwrite nicht erreichbar.");
    });
    window.TREELINE_APPWRITE?.saveRoute?.(route).catch(err => {
      console.warn("Appwrite route save failed; route is stored locally.", err);
    });
    setPlaceStatus(`Route mit ${routeDraft.length} Punkten gespeichert.`);
    routeDraftRef.current = [];
    setRouteDraft([]);
    persistRouteDraft([]);
    chooseTool("select");
  }

  function applySpeciesName(value) {
    const latin = window.TREELINE_SPECIES?.getLatinName(value) || "";
    setNewTreeData(prev => ({
      ...prev,
      name:value,
      species: latin && (!prev.species || prev.species === window.TREELINE_SPECIES?.getLatinName(prev.name)) ? latin : prev.species,
    }));
  }

  latest.current = { addMapSourcesAndLayers, apply3DMode, updateMapData, attachMapListeners, focusOrder, selectTree, persistRouteDraft };

  return (
    <section ref={shellRef} className={`map-workspace${expanded ? " map-expanded" : ""}`} aria-label="Kartenarbeitsplatz">
      <header className="map-order-bar">
        <DispatchIcon name="ClipboardList"/>
        <select value={selectedOrder?.id || ""} title={selectedOrder?.title || "Auftrag auswählen"}
          aria-label="Auftrag auf Karte auswählen"
          onChange={e => onSelectOrder?.(e.target.value)}>
          {!orders.length && <option value="">Keine Aufträge</option>}
          {orders.map(order => <option key={order.id} value={order.id}>{order.id} · {order.title}</option>)}
        </select>
        <MapIconButton icon="LocateFixed" label="Auftrag fokussieren" disabled={!mapReady || !selectedOrder} onClick={() => focusOrder(selectedOrder)}/>
        <MapIconButton icon={expanded ? "Minimize" : "Maximize"} label={expanded ? "Kartenansicht verkleinern" : "Kartenansicht vergrößern"} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}/>
      </header>

      <div className="map-work-area">
        <div className="map-stage">
          <div className="map-surface" ref={mapRef}/>
          <nav className="map-rail" aria-label="Kartenaktionen">
            {[["search", "Search", "Suche"], ["layers", "Layers", "Kartenansicht"], ["tools", "Pencil", "Werkzeug"]].map(([panel, icon, label]) =>
              <MapIconButton key={panel} icon={icon} label={`${label} ${openPanel === panel ? "schließen" : "öffnen"}`}
                data-panel={panel} aria-controls="map-options" aria-expanded={openPanel === panel}
                className={openPanel === panel ? "is-active" : ""}
                onClick={() => setOpenPanel(value => value === panel ? null : panel)}/>
            )}
          </nav>
          {openPanel && <div id="map-options" className="map-options" role="region" aria-label={{search:"Kartensuche",layers:"Kartenansicht",tools:"Werkzeug"}[openPanel]}>
            <div className="map-options-heading">
              <h2>{{search:"Suchen",layers:"Kartenansicht",tools:"Werkzeug"}[openPanel]}</h2>
              <MapIconButton icon="X" label="Menü schließen" onClick={() => { const panel = openPanel; setOpenPanel(null); shellRef.current?.querySelector(`[data-panel="${panel}"]`)?.focus(); }}/>
            </div>
            {openPanel === "search" && <form className="map-search-form" onSubmit={handlePlaceSearch}>
              <label htmlFor="map-search">Baum, Auftrag oder Adresse</label>
              <div><input id="map-search" autoFocus value={placeQuery} onChange={e => setPlaceQuery(e.target.value)} placeholder="Name, Nummer oder Ort"/>
                <MapIconButton icon="Search" label="Suchen" type="submit" disabled={!placeQuery.trim()}/></div>
            </form>}
            {openPanel === "layers" && <div className="map-layer-options">
              <fieldset><legend>Kartenstil</legend><div className="map-style-options">
                {styleOpts.map(([style, label]) => <label key={style}><input type="radio" name="map-style" checked={mapStyle === style} onChange={() => setMapStyle(style)}/>{label}</label>)}
              </div></fieldset>
              <label className="map-check"><input type="checkbox" checked={threeDEnabled} onChange={e => setThreeDEnabled(e.target.checked)}/>3D-Ansicht</label>
              <label className="map-check"><input type="checkbox" checked={orderOnly} onChange={e => setOrderOnly(e.target.checked)} disabled={!selectedOrder}/>Nur Bäume dieses Auftrags</label>
              <label className="map-filter-label">Baumzustand<select aria-label="Baumzustand" value={filter} onChange={e => setFilter(e.target.value)}>{statusOpts.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            </div>}
            {openPanel === "tools" && <div className="map-tool-options">
              {[["select","MousePointer2","Auswählen"],["tree","TreePine","Baum setzen"],["route","Route","Route zeichnen"]].map(([mode, icon, label]) =>
                <button key={mode} type="button" aria-pressed={toolMode === mode} disabled={!mapReady} onClick={() => chooseTool(mode)}><DispatchIcon name={icon}/>{label}{toolMode === mode && <DispatchIcon name="Check" size={16}/>}</button>
              )}
            </div>}
          </div>}
          {mapError ? <div className="map-notice map-error" role="alert"><span>{mapError}</span><MapIconButton icon="RotateCw" label="Karte erneut laden" onClick={() => setMapAttempt(value => value + 1)}/></div>
            : !mapReady ? <div className="map-notice" role="status">Karte wird geladen…</div>
            : placeStatus ? <div className="map-notice" role="status">{placeStatus}</div> : null}
          {toolMode !== "select" && !showAddForm && <div className="map-edit-bar" role="toolbar" aria-label="Kartenbearbeitung">
            <div className="map-edit-state"><DispatchIcon name={toolMode === "tree" ? "TreePine" : "Route"}/><span>{toolMode === "route" ? `${routeDraft.length} ${routeDraft.length === 1 ? "Punkt" : "Punkte"}` : activeToolLabel}</span></div>
            {toolMode === "route" && <>
              <MapIconButton icon="Undo2" label="Letzten Routenpunkt zurücknehmen" onClick={undoRoutePoint} disabled={!routeDraft.length}/>
              <MapIconButton icon="Trash2" label="Routenentwurf verwerfen" onClick={clearRouteDraft} disabled={!routeDraft.length}/>
              <MapIconButton icon="Save" label="Route speichern" className="map-save" onClick={saveRouteDraft} disabled={routeDraft.length < 2 || !selectedOrder}/>
            </>}
            <MapIconButton icon="X" label="Bearbeitung beenden" onClick={() => chooseTool("select")}/>
          </div>}
          {(filter !== "all" || orderOnly) && <button className="map-filter-reset" onClick={() => { setFilter("all"); setOrderOnly(false); }} title="Filter zurücksetzen" aria-label="Kartenfilter zurücksetzen"><DispatchIcon name="X" size={14}/>{treeFeatures().features.length} Bäume · {filter === "all" ? "Auftrag" : statusLabel[filter]}</button>}
        </div>

        {showAddForm && (
          <div className="map-detail-pane map-add-pane" style={mvStyles.addPanel} role="region" aria-label="Neuer Baum">
            <div className="map-detail-heading"><h2 style={mvStyles.addPanelTitle}>Neuer Baum</h2><MapIconButton icon="X" label="Baumerfassung abbrechen" onClick={cancelAdd}/></div>
            <div style={mvStyles.addCoords}>{clickCoords?.lat.toFixed(5)}, {clickCoords?.lng.toFixed(5)}</div>
            <div style={mvStyles.fLabel}>Bezeichnung</div>
            <input autoFocus aria-label="Bezeichnung" style={mvStyles.fInput} placeholder="z.B. Stieleiche" value={newTreeData.name}
              list="treeline-map-species" onChange={e=>applySpeciesName(e.target.value)} />
            <datalist id="treeline-map-species">
              {(window.TREELINE_TREE_SPECIES || []).map(item => <option key={item.name} value={item.name} />)}
            </datalist>
            <div style={mvStyles.fLabel}>Art (lateinisch)</div>
            <input aria-label="Art (lateinisch)" style={mvStyles.fInput} placeholder="z.B. Quercus robur" value={newTreeData.species}
              onChange={e=>setNewTreeData({...newTreeData,species:e.target.value})} />
            <div style={mvStyles.fLabel}>Standortbeschreibung</div>
            <input style={mvStyles.fInput} value={newTreeData.standort}
              onChange={e=>setNewTreeData({...newTreeData,standort:e.target.value})} />
            <div style={mvStyles.fLabel}>Eigentümer / Auftraggeber</div>
            <input style={mvStyles.fInput} value={newTreeData.owner}
              onChange={e=>setNewTreeData({...newTreeData,owner:e.target.value})} />
            <div style={mvStyles.compactGrid}>
              <div>
                <div style={mvStyles.fLabel}>Auftrag</div>
                <select style={mvStyles.fInput} value={newTreeData.orderId}
                  onChange={e=>setNewTreeData({...newTreeData,orderId:e.target.value,routeIndex:nextRouteIndex(newTreeData.routeSide, e.target.value)})}>
                  <option value="">Kein Auftrag</option>
                  {orders.map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
              </div>
              <div>
                <div style={mvStyles.fLabel}>Straßenseite</div>
                <select style={mvStyles.fInput} value={newTreeData.routeSide}
                  onChange={e=>setNewTreeData({...newTreeData,routeSide:e.target.value,routeIndex:nextRouteIndex(e.target.value, newTreeData.orderId || selectedOrder?.id)})}>
                  <option value="links">links</option>
                  <option value="rechts">rechts</option>
                </select>
              </div>
            </div>
            <div style={mvStyles.fLabel}>Routenposition</div>
            <input style={mvStyles.fInput} type="number" min="1" step="1" value={newTreeData.routeIndex}
              onChange={e=>setNewTreeData({...newTreeData,routeIndex:e.target.value})} />
            <div style={mvStyles.fLabel}>Zuständig</div>
            <select style={mvStyles.fInput} value={newTreeData.assignedTo}
              onChange={e=>setNewTreeData({...newTreeData,assignedTo:e.target.value})}>
              <option value="">Nicht zugewiesen</option>
              {MOCK_DATA.users.filter(u=>u.role!=="client").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div style={mvStyles.fLabel}>Status</div>
            <select style={mvStyles.fInput} value={newTreeData.status}
              onChange={e=>setNewTreeData({...newTreeData,status:e.target.value})}>
              {Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
            <div style={mvStyles.compactGrid}>
              <div><div style={mvStyles.fLabel}>Höhe (m)</div><input style={mvStyles.fInput} type="number" min="0" step="0.1" value={newTreeData.height} onChange={e=>setNewTreeData({...newTreeData,height:e.target.value})}/></div>
              <div><div style={mvStyles.fLabel}>Stamm-Ø (cm)</div><input style={mvStyles.fInput} type="number" min="0" step="1" value={newTreeData.trunkDiam} onChange={e=>setNewTreeData({...newTreeData,trunkDiam:e.target.value})}/></div>
              <div><div style={mvStyles.fLabel}>Kronen-Ø (m)</div><input style={mvStyles.fInput} type="number" min="0" step="0.1" value={newTreeData.crownDiam} onChange={e=>setNewTreeData({...newTreeData,crownDiam:e.target.value})}/></div>
              <div><div style={mvStyles.fLabel}>Alter</div><input style={mvStyles.fInput} type="number" min="0" step="1" value={newTreeData.age} onChange={e=>setNewTreeData({...newTreeData,age:e.target.value})}/></div>
            </div>
            <div style={mvStyles.fLabel}>VTA / Bewertung</div>
            <input style={mvStyles.fInput} value={newTreeData.vta}
              onChange={e=>setNewTreeData({...newTreeData,vta:e.target.value})} />
            <div style={mvStyles.fLabel}>Tags</div>
            <input style={mvStyles.fInput} placeholder="Kommagetrennt" value={newTreeData.tags}
              onChange={e=>setNewTreeData({...newTreeData,tags:e.target.value})} />
            <div style={mvStyles.fLabel}>Notizen</div>
            <textarea style={{...mvStyles.fInput,minHeight:64,resize:"vertical"}} value={newTreeData.notes}
              onChange={e=>setNewTreeData({...newTreeData,notes:e.target.value})} />
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button style={mvStyles.cancelBtn} onClick={cancelAdd}>Abbrechen</button>
              <button style={mvStyles.confirmBtn} onClick={confirmAddTree} disabled={!newTreeData.name.trim()}>Baum anlegen</button>
            </div>
          </div>
        )}

        {selectedTree && !showAddForm && (
          <div className="map-detail-pane" style={mvStyles.panel} role="region" aria-label="Baumdetails">
            <div style={mvStyles.panelHeader}>
              <div>
                <div style={mvStyles.panelId}>{selectedTree.id}</div>
                <div style={mvStyles.panelName}>{selectedTree.name}</div>
                <div style={mvStyles.panelSpecies}>{selectedTree.species}</div>
              </div>
              <MapIconButton icon="X" label="Baumdetails schließen" onClick={() => setSelectedTree(null)}/>
            </div>
            <div style={{...mvStyles.statusBadge, background:statusColors[selectedTree.status]+"20", color:statusColors[selectedTree.status]}}>
              {statusLabel[selectedTree.status]}
            </div>
            {selectedTree.orderId && <div style={mvStyles.orderChip}>{selectedTree.orderId} · {selectedTree.routeSide} #{selectedTree.routeIndex}</div>}
            <div style={mvStyles.section}>Standort</div>
            <div style={mvStyles.detail}>{selectedTree.standort}</div>
            <TreeAudit tree={selectedTree}/>
            <details className="map-tree-details"><summary>Baumdaten</summary>
            <div style={mvStyles.grid2}>
              {[["Höhe",selectedTree.height+" m"],["Stamm-Ø",selectedTree.trunkDiam+" cm"],
                ["Kronen-Ø",selectedTree.crownDiam+" m"],["Alter",selectedTree.age+" J."]].map(([k,v])=>(
                <div key={k} style={mvStyles.metaCell}>
                  <div style={mvStyles.metaKey}>{k}</div>
                  <div style={mvStyles.metaVal}>{v}</div>
                </div>
              ))}
            </div>
            <div style={mvStyles.section}>Zertifizierung</div>
            <span style={{...mvStyles.certBadge, background:selectedTree.certified?"#EDF7F1":"#FFF3E0",
              color:selectedTree.certified?"#1D7A56":"#E65100"}}>
              {selectedTree.certified?"Zertifiziert":"Ausstehend"}
            </span>
            {selectedTree.tags?.length>0 && <>
              <div style={mvStyles.section}>Tags</div>
              <div style={mvStyles.tags}>{selectedTree.tags.map(t=><span key={t} style={mvStyles.tag}>{t}</span>)}</div>
            </>}
            {selectedTree.notes && <>
              <div style={mvStyles.section}>Notizen</div>
              <div style={mvStyles.notes}>{selectedTree.notes}</div>
            </>}
            </details>
            <button style={mvStyles.detailBtn} onClick={()=>onSelectTree(selectedTree.id)}>
              Vollständiges Profil <DispatchIcon name="ArrowRight" size={16}/>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function MapIconButton({ icon, label, className = "", type = "button", ...props }) {
  return <button type={type} className={`map-icon ${className}`} aria-label={label} title={label} {...props}><DispatchIcon name={icon}/></button>;
}

function validMapCoordinates(value) {
  return Array.isArray(value) ? value.filter(coord => Array.isArray(coord) && coord.length === 2
    && Number.isFinite(coord[0]) && Math.abs(coord[0]) <= 180
    && Number.isFinite(coord[1]) && Math.abs(coord[1]) <= 90) : [];
}

const mvStyles = {
  panel:          {width:300,background:"#fff",borderLeft:"1px solid #e5e5e0",
                   overflowY:"auto",padding:"18px 16px",display:"flex",flexDirection:"column",gap:0},
  addPanel:       {width:300,background:"#fff",borderLeft:"1px solid #e5e5e0",
                   padding:"18px 16px",display:"flex",flexDirection:"column",gap:6,overflowY:"auto"},
  addPanelTitle:  {fontSize:16,fontWeight:700,color:"#1a1a18",marginBottom:4},
  addCoords:      {fontSize:11,color:"#1D7A56",background:"#EDF7F1",padding:"5px 10px",
                   borderRadius:6,marginBottom:8,fontWeight:500},
  fLabel:         {fontSize:11,fontWeight:600,color:"#555",marginTop:4},
  fInput:         {width:"100%",padding:"8px 10px",border:"1px solid #ddd",borderRadius:7,
                   fontSize:12,outline:"none",boxSizing:"border-box",marginTop:3},
  compactGrid:    {display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  cancelBtn:      {flex:1,padding:"9px",background:"#f5f5f3",color:"#555",border:"none",
                   borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"},
  confirmBtn:     {flex:2,padding:"9px",background:"#1D7A56",color:"#fff",border:"none",
                   borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"},
  panelHeader:    {display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10},
  panelId:        {fontSize:11,color:"#aaa",fontWeight:600},
  panelName:      {fontSize:17,fontWeight:700,color:"#1a1a18"},
  panelSpecies:   {fontSize:12,color:"#888",fontStyle:"italic",marginTop:2},
  closeBtn:       {background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:18,padding:4},
  statusBadge:    {display:"inline-block",padding:"4px 12px",borderRadius:100,fontSize:12,fontWeight:700,marginBottom:8},
  orderChip:      {fontSize:11,fontWeight:700,color:"#1565A0",background:"#EEF4FB",padding:"5px 9px",borderRadius:7,marginBottom:8},
  section:        {fontSize:10,fontWeight:700,color:"#aaa",
                   textTransform:"uppercase",marginTop:14,marginBottom:5},
  detail:         {fontSize:13,color:"#444"},
  grid2:          {display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4},
  metaCell:       {background:"#f8f7f4",borderRadius:7,padding:"8px 10px"},
  metaKey:        {fontSize:10,color:"#aaa",fontWeight:600,textTransform:"uppercase"},
  metaVal:        {fontSize:14,fontWeight:700,color:"#1a1a18",marginTop:2},
  certBadge:      {padding:"3px 10px",borderRadius:100,fontSize:12,fontWeight:600},
  tags:           {display:"flex",flexWrap:"wrap",gap:5,marginTop:2},
  tag:            {fontSize:11,background:"#f0f0ee",color:"#555",padding:"3px 9px",borderRadius:100},
  notes:          {fontSize:12,color:"#666",lineHeight:1.6,background:"#f8f7f4",
                   padding:"10px",borderRadius:7,marginTop:4},
  detailBtn:      {marginTop:16,padding:"10px 14px",background:"#1D7A56",color:"#fff",
                   border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",width:"100%"},
};

Object.assign(window, { MapView });
