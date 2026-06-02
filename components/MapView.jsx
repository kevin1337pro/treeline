function MapView({ onSelectTree }) {
  const mapRef = React.useRef(null);
  const mapboxMap = React.useRef(null);
  const popupRef = React.useRef(null);
  const addModeRef = React.useRef(false);
  const listenersAttached = React.useRef(false);
  const [selectedTree, setSelectedTree] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [placeQuery, setPlaceQuery] = React.useState("Gahlener Straße Dorsten AUF-2026-001");
  const [placeStatus, setPlaceStatus] = React.useState("");
  const [mapStyle, setMapStyle] = React.useState("mapbox://styles/mapbox/satellite-streets-v12");
  const [addMode, setAddMode] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [clickCoords, setClickCoords] = React.useState(null);
  const emptyTreeData = {
    name:"", species:"", status:"gut", standort:"",
    owner:"", assignedTo:"", height:0, trunkDiam:0, crownDiam:0, age:0,
    vta:"Ausstehend", tags:"", notes:"",
  };
  const [newTreeData, setNewTreeData] = React.useState(emptyTreeData);

  const { trees, statusColors, orders = [] } = MOCK_DATA;
  const mapboxToken = window.TREELINE_MAPBOX_TOKEN
    || localStorage.getItem("treeline_mapbox_token")
    || window.TREELINE_APPWRITE_CONFIG?.mapboxToken;
  const statusLabel = { gut:"Gut", mittel:"Mittel", schlecht:"Schlecht", kritisch:"Kritisch" };
  const statusOpts = [["all","Alle"],["gut","Gut"],["mittel","Mittel"],["schlecht","Schlecht"],["kritisch","Kritisch"]];
  const styleOpts = [
    ["mapbox://styles/mapbox/satellite-streets-v12", "Satellit"],
    ["mapbox://styles/mapbox/streets-v12", "Straße"],
    ["mapbox://styles/mapbox/outdoors-v12", "Outdoor"],
    ["mapbox://styles/mapbox/light-v11", "Büro"],
  ];

  const selectedOrder = orders.find(o => o.id === "AUF-2026-001") || orders[0];

  React.useEffect(() => {
    if (mapboxMap.current || !mapRef.current) return;
    if (!mapboxToken) {
      setPlaceStatus("Mapbox Token fehlt.");
      return;
    }
    if (!window.mapboxgl) {
      setPlaceStatus("Mapbox GL konnte nicht geladen werden.");
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const orderCenter = getOrderCoordinates()[0] || [6.96559, 51.59683];
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: orderCenter,
      zoom: selectedOrder ? 16.5 : 15,
      pitch: 42,
      bearing: -18,
      attributionControl: true,
    });
    mapboxMap.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }), "top-right");

    map.on("load", () => {
      addMapSourcesAndLayers();
      attachMapListeners();
      fitOrderBounds();
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapboxMap.current = null;
      listenersAttached.current = false;
    };
  }, []);

  React.useEffect(() => {
    addModeRef.current = addMode;
    if (mapboxMap.current) {
      mapboxMap.current.getCanvas().style.cursor = addMode ? "crosshair" : "";
    }
  }, [addMode]);

  React.useEffect(() => {
    const map = mapboxMap.current;
    if (!map) return;
    map.setStyle(mapStyle);
    map.once("style.load", () => {
      addMapSourcesAndLayers();
      updateMapData();
      if (selectedTree) showTreePopup(selectedTree);
    });
  }, [mapStyle]);

  React.useEffect(() => {
    updateMapData();
  }, [filter, selectedTree?.id, clickCoords?.lat, clickCoords?.lng, trees.length]);

  function treeFeatures() {
    const visibleTrees = filter === "all" ? trees : trees.filter(t => t.status === filter);
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
          routeLabel: tree.routeIndex ? String(tree.routeIndex) : "",
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

  function getOrderTrees(side) {
    if (!selectedOrder) return [];
    return selectedOrder.treeIds
      .map(id => trees.find(t => t.id === id))
      .filter(t => t && (!side || t.routeSide === side))
      .sort((a, b) => (a.routeIndex || 0) - (b.routeIndex || 0));
  }

  function getOrderCoordinates() {
    return getOrderTrees().map(t => [t.lng, t.lat]);
  }

  function addMapSourcesAndLayers() {
    const map = mapboxMap.current;
    if (!map || !map.isStyleLoaded()) return;

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
          "circle-radius":["case", ["==", ["get", "id"], selectedTree?.id || ""], 10, 7],
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
          "text-size":11,
          "text-font":["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset":[0, 0.05],
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
    if (!map || !map.isStyleLoaded()) return;
    map.getSource("treeline-trees")?.setData(treeFeatures());
    map.getSource("treeline-temp-point")?.setData(tempFeature());
    map.getSource("treeline-left-route")?.setData(routeFeature("links"));
    map.getSource("treeline-right-route")?.setData(routeFeature("rechts"));
    if (map.getLayer("treeline-tree-circle")) {
      map.setPaintProperty("treeline-tree-circle", "circle-radius", ["case", ["==", ["get", "id"], selectedTree?.id || ""], 10, 7]);
      map.setPaintProperty("treeline-tree-halo", "circle-radius", ["case", ["==", ["get", "id"], selectedTree?.id || ""], 18, 13]);
    }
  }

  function attachMapListeners() {
    const map = mapboxMap.current;
    if (!map || listenersAttached.current) return;
    listenersAttached.current = true;

    map.on("click", "treeline-tree-circle", e => {
      const id = e.features?.[0]?.properties?.id;
      const tree = trees.find(t => t.id === id);
      if (tree) selectTree(tree);
    });
    map.on("mouseenter", "treeline-tree-circle", () => {
      if (!addModeRef.current) map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "treeline-tree-circle", () => {
      map.getCanvas().style.cursor = addModeRef.current ? "crosshair" : "";
    });
    map.on("click", e => {
      if (!addModeRef.current) return;
      const features = map.queryRenderedFeatures(e.point, { layers:["treeline-tree-circle"] });
      if (features.length) return;
      setClickCoords({ lat:e.lngLat.lat, lng:e.lngLat.lng });
      setNewTreeData(prev => ({ ...prev, standort:`${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}` }));
      setShowAddForm(true);
    });
  }

  function fitOrderBounds() {
    const map = mapboxMap.current;
    const coords = getOrderCoordinates();
    if (!map || !coords.length) return;
    const bounds = coords.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(coords[0], coords[0]));
    map.fitBounds(bounds, { padding:80, maxZoom:17.4, duration:700 });
  }

  function selectTree(tree) {
    setSelectedTree(tree);
    showTreePopup(tree);
    mapboxMap.current?.flyTo({ center:[tree.lng, tree.lat], zoom:18, duration:650 });
  }

  function showTreePopup(tree) {
    const map = mapboxMap.current;
    if (!map || !window.mapboxgl) return;
    popupRef.current?.remove();
    popupRef.current = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:18 })
      .setLngLat([tree.lng, tree.lat])
      .setHTML(`<strong>${tree.name}</strong><br>${tree.id}<br>${tree.standort || ""}`)
      .addTo(map);
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
      setPlaceStatus("Auftrag gefunden.");
      fitOrderBounds();
      return;
    }

    if (!mapboxToken) {
      setPlaceStatus("Mapbox Token fehlt.");
      return;
    }

    setPlaceStatus("Suche läuft...");
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=de&limit=1&language=de&access_token=${encodeURIComponent(mapboxToken)}`;
      const res = await fetch(url, { headers:{ Accept:"application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) {
        setPlaceStatus("Kein Ort gefunden.");
        return;
      }
      mapboxMap.current?.flyTo({ center:feature.center, zoom:17, duration:800 });
      setPlaceStatus("Ort gefunden.");
    } catch (err) {
      console.warn("Mapbox search failed.", err);
      setPlaceStatus("Suche fehlgeschlagen.");
    }
  }

  async function confirmAddTree() {
    if (!clickCoords || !newTreeData.name.trim()) return;
    const newId = `TRE-${new Date().getFullYear()}-${String(trees.length + 1).padStart(3, "0")}`;
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
      createdAt:new Date().toISOString().slice(0, 10),
    };
    MOCK_DATA.trees.push(tree);
    window.TREELINE_DB?.save();
    window.TREELINE_DB?.saveTree?.(tree).catch(err => {
      console.warn("Appwrite save failed; tree is stored locally.", err);
      setPlaceStatus("Baum lokal gespeichert, Appwrite nicht erreichbar.");
    });
    setShowAddForm(false);
    setAddMode(false);
    setClickCoords(null);
    setNewTreeData(emptyTreeData);
    selectTree(tree);
  }

  function cancelAdd() {
    setShowAddForm(false);
    setAddMode(false);
    setClickCoords(null);
    setNewTreeData(emptyTreeData);
  }

  return (
    <div style={{display:"flex",height:"100vh",flexDirection:"column"}}>
      <div style={mvStyles.toolbar}>
        <span style={mvStyles.toolbarTitle}>Karte</span>
        <form style={mvStyles.placeSearch} onSubmit={handlePlaceSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={mvStyles.placeInput} value={placeQuery}
            onChange={e => setPlaceQuery(e.target.value)}
            placeholder="Baum, Auftrag, Stadt oder Adresse suchen"
            aria-label="Baum, Auftrag, Stadt oder Adresse suchen" />
          <button type="submit" style={mvStyles.placeBtn}>Suchen</button>
          {placeStatus && <span style={mvStyles.placeStatus}>{placeStatus}</span>}
        </form>
        <div style={mvStyles.filters}>
          {statusOpts.map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{...mvStyles.filterBtn,...(filter===val?mvStyles.filterBtnActive:{})}}>
              {val !== "all" && <span style={{...mvStyles.filterDot,background:statusColors[val]}}/>}
              {label}
            </button>
          ))}
        </div>
        <div style={mvStyles.styleSwitch}>
          {styleOpts.map(([style,label]) => (
            <button key={style} onClick={() => setMapStyle(style)}
              style={{...mvStyles.styleBtn,...(mapStyle===style?mvStyles.styleBtnActive:{})}}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => { addMode ? cancelAdd() : setAddMode(true); }}
          style={{...mvStyles.addModeBtn, ...(addMode?mvStyles.addModeBtnActive:{})}}>
          {addMode ? "Abbrechen" : "+ Baum setzen"}
        </button>
        <button style={mvStyles.orderBtn} onClick={fitOrderBounds}>Auftrag fokussieren</button>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div ref={mapRef} style={{flex:1,background:"#eef1ef",position:"relative"}}>
          {!mapboxToken && <div style={mvStyles.mapFallback}>Mapbox Token fehlt.</div>}
        </div>

        {showAddForm && (
          <div style={mvStyles.addPanel}>
            <div style={mvStyles.addPanelTitle}>Neuer Baum</div>
            <div style={mvStyles.addCoords}>{clickCoords?.lat.toFixed(5)}, {clickCoords?.lng.toFixed(5)}</div>
            <div style={mvStyles.fLabel}>Bezeichnung</div>
            <input style={mvStyles.fInput} placeholder="z.B. Stieleiche" value={newTreeData.name}
              onChange={e=>setNewTreeData({...newTreeData,name:e.target.value})} />
            <div style={mvStyles.fLabel}>Art (lateinisch)</div>
            <input style={mvStyles.fInput} placeholder="z.B. Quercus robur" value={newTreeData.species}
              onChange={e=>setNewTreeData({...newTreeData,species:e.target.value})} />
            <div style={mvStyles.fLabel}>Standortbeschreibung</div>
            <input style={mvStyles.fInput} value={newTreeData.standort}
              onChange={e=>setNewTreeData({...newTreeData,standort:e.target.value})} />
            <div style={mvStyles.fLabel}>Eigentümer / Auftraggeber</div>
            <input style={mvStyles.fInput} value={newTreeData.owner}
              onChange={e=>setNewTreeData({...newTreeData,owner:e.target.value})} />
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
          <div style={mvStyles.panel}>
            <div style={mvStyles.panelHeader}>
              <div>
                <div style={mvStyles.panelId}>{selectedTree.id}</div>
                <div style={mvStyles.panelName}>{selectedTree.name}</div>
                <div style={mvStyles.panelSpecies}>{selectedTree.species}</div>
              </div>
              <button style={mvStyles.closeBtn} onClick={() => { setSelectedTree(null); popupRef.current?.remove(); }}>×</button>
            </div>
            <div style={{...mvStyles.statusBadge, background:statusColors[selectedTree.status]+"20", color:statusColors[selectedTree.status]}}>
              {statusLabel[selectedTree.status]}
            </div>
            {selectedTree.orderId && <div style={mvStyles.orderChip}>{selectedTree.orderId} · {selectedTree.routeSide} #{selectedTree.routeIndex}</div>}
            <div style={mvStyles.section}>Standort</div>
            <div style={mvStyles.detail}>{selectedTree.standort}</div>
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
            <button style={mvStyles.detailBtn} onClick={()=>onSelectTree(selectedTree.id)}>
              Vollständiges Profil →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const mvStyles = {
  toolbar:        {display:"flex",alignItems:"center",gap:10,padding:"10px 16px",
                   background:"#fff",borderBottom:"1px solid #e5e5e0",flexWrap:"wrap"},
  toolbarTitle:   {fontSize:15,fontWeight:700,color:"#1a1a18",marginRight:4},
  placeSearch:    {display:"flex",alignItems:"center",gap:8,background:"#f5f5f3",
                   border:"1px solid #e2e2dc",borderRadius:8,padding:"5px 7px 5px 10px",
                   minWidth:320,flex:"1 1 340px"},
  placeInput:     {border:"none",background:"transparent",outline:"none",fontSize:12,
                   color:"#333",minWidth:180,flex:1},
  placeBtn:       {padding:"5px 10px",border:"none",borderRadius:6,background:"#1565A0",
                   color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"},
  placeStatus:    {fontSize:11,color:"#777",whiteSpace:"nowrap"},
  filters:        {display:"flex",gap:6,flex:"1 1 300px",flexWrap:"wrap"},
  filterBtn:      {padding:"5px 10px",borderRadius:100,border:"1px solid #e0e0dc",background:"#fff",
                   fontSize:12,fontWeight:500,cursor:"pointer",color:"#555",
                   display:"flex",alignItems:"center",gap:5},
  filterBtnActive:{background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  filterDot:      {width:8,height:8,borderRadius:"50%",flexShrink:0},
  styleSwitch:    {display:"flex",gap:4,background:"#f5f5f3",borderRadius:8,padding:3},
  styleBtn:       {padding:"5px 8px",border:"none",borderRadius:6,background:"transparent",
                   fontSize:11,fontWeight:700,cursor:"pointer",color:"#666"},
  styleBtnActive: {background:"#fff",color:"#1565A0",boxShadow:"0 1px 2px rgba(0,0,0,0.08)"},
  addModeBtn:     {padding:"7px 12px",border:"1px solid #e0e0dc",borderRadius:8,background:"#fff",
                   fontSize:12,fontWeight:700,cursor:"pointer",color:"#1D7A56"},
  addModeBtnActive:{background:"#FFEBEE",borderColor:"#B71C1C",color:"#B71C1C"},
  orderBtn:       {padding:"7px 12px",border:"none",borderRadius:8,background:"#EDF7F1",
                   color:"#1D7A56",fontSize:12,fontWeight:700,cursor:"pointer"},
  mapFallback:    {position:"absolute",inset:0,display:"flex",alignItems:"center",
                   justifyContent:"center",fontSize:14,color:"#777"},
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
  panelId:        {fontSize:11,color:"#aaa",letterSpacing:"0.3px",fontWeight:600},
  panelName:      {fontSize:17,fontWeight:700,color:"#1a1a18",letterSpacing:"-0.2px"},
  panelSpecies:   {fontSize:12,color:"#888",fontStyle:"italic",marginTop:2},
  closeBtn:       {background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:18,padding:4},
  statusBadge:    {display:"inline-block",padding:"4px 12px",borderRadius:100,fontSize:12,fontWeight:700,marginBottom:8},
  orderChip:      {fontSize:11,fontWeight:700,color:"#1565A0",background:"#EEF4FB",padding:"5px 9px",borderRadius:7,marginBottom:8},
  section:        {fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.8px",
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
