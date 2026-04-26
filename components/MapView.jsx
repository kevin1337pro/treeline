function MapView({ onSelectTree }) {
  const mapRef = React.useRef(null);
  const leafletMap = React.useRef(null);
  const markersRef = React.useRef({});
  const searchMarkerRef = React.useRef(null);
  const addModeRef = React.useRef(false);
  const [selectedTree, setSelectedTree] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [placeQuery, setPlaceQuery] = React.useState("Buerelterstraße 27, Gelsenkirchen");
  const [placeStatus, setPlaceStatus] = React.useState("");
  const [addMode, setAddMode] = React.useState(false);
  const [newMarker, setNewMarker] = React.useState(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const emptyTreeData = {
    name:"", species:"", status:"gut", standort:"",
    owner:"", assignedTo:"", height:0, trunkDiam:0, crownDiam:0, age:0,
    vta:"Ausstehend", tags:"", notes:"",
  };
  const [newTreeData, setNewTreeData] = React.useState(emptyTreeData);
  const [clickCoords, setClickCoords] = React.useState(null);
  const { trees, statusColors } = MOCK_DATA;
  const statusLabel = { gut:"Gut", mittel:"Mittel", schlecht:"Schlecht", kritisch:"Kritisch" };

  function makeIcon(color, pulse=false) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      ${pulse ? `<circle cx="16" cy="16" r="20" fill="${color}" opacity="0.15"/>` : ""}
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M16 9 C13 9 10 11 10 14 C10 15.5 10.8 16.7 12 17.5 L11 20 L21 20 L20 17.5 C21.2 16.7 22 15.5 22 14 C22 11 19 9 16 9 Z" fill="white" opacity="0.9"/>
      <rect x="15" y="18" width="2" height="4" fill="white" opacity="0.9"/>
    </svg>`;
    return L.divIcon({ html: svg, iconSize:[32,40], iconAnchor:[16,40], popupAnchor:[0,-40], className:"" });
  }

  function makeNewIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 0C8.1 0 0 8.1 0 18c0 12.4 18 27 18 27s18-14.6 18-27C36 8.1 27.9 0 18 0z" fill="#E6A817" stroke="white" stroke-width="2"/>
      <text x="18" y="23" text-anchor="middle" font-size="16" fill="white" font-weight="bold">+</text>
    </svg>`;
    return L.divIcon({ html: svg, iconSize:[36,44], iconAnchor:[18,44], popupAnchor:[0,-44], className:"" });
  }

  React.useEffect(() => {
    if (leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, { center:[51.59683,6.99559], zoom:17 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:"© OpenStreetMap contributors", maxZoom:19
    }).addTo(leafletMap.current);
    renderMarkers();

    leafletMap.current.on("click", e => {
      if (!addModeRef.current) return;
      setClickCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }, []);

  // Handle add mode toggle
  React.useEffect(() => {
    if (!leafletMap.current) return;
    addModeRef.current = addMode;
    leafletMap.current.getContainer().style.cursor = addMode ? "crosshair" : "";
  }, [addMode]);

  // Place temp marker on click
  React.useEffect(() => {
    if (!clickCoords || !leafletMap.current) return;
    if (newMarker) { leafletMap.current.removeLayer(newMarker); }
    const m = L.marker([clickCoords.lat, clickCoords.lng], { icon: makeNewIcon(), draggable: true })
      .addTo(leafletMap.current);
    m.on("dragend", e => {
      const pos = e.target.getLatLng();
      setClickCoords({ lat: pos.lat, lng: pos.lng });
    });
    setNewMarker(m);
    setNewTreeData(prev => ({ ...prev, standort: `${clickCoords.lat.toFixed(5)}, ${clickCoords.lng.toFixed(5)}` }));
    setShowAddForm(true);
  }, [clickCoords]);

  React.useEffect(() => {
    if (!leafletMap.current) return;
    Object.values(markersRef.current).forEach(m => leafletMap.current.removeLayer(m));
    markersRef.current = {};
    renderMarkers();
  }, [filter]);

  function renderMarkers() {
    const filtered = filter === "all" ? trees : trees.filter(t => t.status === filter);
    filtered.forEach(tree => {
      const m = L.marker([tree.lat, tree.lng], { icon: makeIcon(statusColors[tree.status]||"#888"), draggable: true })
        .addTo(leafletMap.current);
      m.on("click", () => setSelectedTree(tree));
      m.on("dragend", e => {
        const pos = e.target.getLatLng();
        tree.lat = pos.lat; tree.lng = pos.lng;
        window.TREELINE_DB?.save();
        window.TREELINE_DB?.saveTree?.(tree).catch(err => console.warn("Appwrite save failed; tree is stored locally.", err));
      });
      markersRef.current[tree.id] = m;
    });
  }

  function focusLocation(lat, lng, label) {
    if (!leafletMap.current) return;
    leafletMap.current.flyTo([lat, lng], 18, { duration: 0.8 });
    if (searchMarkerRef.current) leafletMap.current.removeLayer(searchMarkerRef.current);
    searchMarkerRef.current = L.circleMarker([lat, lng], {
      radius: 10,
      color: "#1565A0",
      weight: 3,
      fillColor: "#1565A0",
      fillOpacity: 0.18,
    }).addTo(leafletMap.current);
    searchMarkerRef.current.bindPopup(label).openPopup();
  }

  async function handlePlaceSearch(e) {
    e?.preventDefault();
    const q = placeQuery.trim();
    if (!q) return;

    const localTree = trees.find(t => {
      const haystack = `${t.id} ${t.name} ${t.species} ${t.standort}`.toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
    if (localTree) {
      setSelectedTree(localTree);
      markersRef.current[localTree.id]?.openPopup?.();
      focusLocation(localTree.lat, localTree.lng, localTree.standort || localTree.name);
      setPlaceStatus("Lokaler Baumstandort gefunden.");
      return;
    }

    setPlaceStatus("Suche läuft...");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=de&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const results = await res.json();
      if (!results.length) {
        setPlaceStatus("Kein Ort gefunden.");
        return;
      }
      const place = results[0];
      focusLocation(Number(place.lat), Number(place.lon), place.display_name);
      setPlaceStatus("Ort gefunden.");
    } catch (err) {
      console.error(err);
      setPlaceStatus("Suche fehlgeschlagen.");
    }
  }

  async function confirmAddTree() {
    const newId = `TRE-${new Date().getFullYear()}-${String(trees.length+1).padStart(3,"0")}`;
    const t = { ...newTreeData, id: newId, lat: clickCoords.lat, lng: clickCoords.lng,
      height:Number(newTreeData.height)||0, trunkDiam:Number(newTreeData.trunkDiam)||0,
      crownDiam:Number(newTreeData.crownDiam)||0, age:Number(newTreeData.age)||0,
      certified:false, certDate:null, certifier:null, assignedTo:newTreeData.assignedTo || null,
      tags:newTreeData.tags.split(",").map(t=>t.trim()).filter(Boolean),
      measuresIds:[], images:[], createdAt: new Date().toISOString().slice(0,10) };
    MOCK_DATA.trees.push(t);
    window.TREELINE_DB?.save();
    window.TREELINE_DB?.saveTree?.(t).catch(err => {
      console.warn("Appwrite save failed; tree is stored locally.", err);
      setPlaceStatus("Baum lokal gespeichert, Appwrite nicht erreichbar.");
    });
    const m = L.marker([t.lat, t.lng], { icon: makeIcon(statusColors[t.status]||"#888"), draggable: true })
      .addTo(leafletMap.current);
    m.on("click", () => setSelectedTree(t));
    m.on("dragend", e => {
      const pos = e.target.getLatLng();
      t.lat = pos.lat; t.lng = pos.lng;
      window.TREELINE_DB?.save();
      window.TREELINE_DB?.saveTree?.(t).catch(err => console.warn("Appwrite save failed; tree is stored locally.", err));
    });
    markersRef.current[t.id] = m;
    if (newMarker) { leafletMap.current.removeLayer(newMarker); setNewMarker(null); }
    setShowAddForm(false); setAddMode(false); setClickCoords(null);
    setSelectedTree(t);
    setNewTreeData(emptyTreeData);
  }

  function cancelAdd() {
    if (newMarker) { leafletMap.current.removeLayer(newMarker); setNewMarker(null); }
    setShowAddForm(false); setAddMode(false); setClickCoords(null);
  }

  const statusOpts = [["all","Alle"],["gut","Gut"],["mittel","Mittel"],["schlecht","Schlecht"],["kritisch","Kritisch"]];

  return (
    <div style={{display:"flex",height:"100vh",flexDirection:"column"}}>
      {/* Toolbar */}
      <div style={mvStyles.toolbar}>
        <span style={mvStyles.toolbarTitle}>Karte</span>
        <form style={mvStyles.placeSearch} onSubmit={handlePlaceSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={mvStyles.placeInput}
            value={placeQuery}
            onChange={e => setPlaceQuery(e.target.value)}
            placeholder="Stadt, Ort oder Adresse suchen"
            aria-label="Stadt, Ort oder Adresse suchen"
          />
          <button type="submit" style={mvStyles.placeBtn}>Suchen</button>
          {placeStatus && <span style={mvStyles.placeStatus}>{placeStatus}</span>}
        </form>
        <div style={mvStyles.filters}>
          {statusOpts.map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{...mvStyles.filterBtn,...(filter===val?mvStyles.filterBtnActive:{})}}>
              {val!=="all" && <span style={{...mvStyles.filterDot,background:statusColors[val]}}/>}
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => { setAddMode(!addMode); if(addMode) cancelAdd(); }}
          style={{...mvStyles.addModeBtn, ...(addMode?mvStyles.addModeBtnActive:{})}}>
          {addMode ? "✕ Abbrechen" : "+ Baum setzen"}
        </button>
        {addMode && (
          <div style={mvStyles.addHint}>📍 Auf die Karte klicken um Baum zu platzieren</div>
        )}
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div ref={mapRef} style={{flex:1}} />

        {/* Add Form */}
        {showAddForm && (
          <div style={mvStyles.addPanel}>
            <div style={mvStyles.addPanelTitle}>Neuer Baum</div>
            <div style={mvStyles.addCoords}>📍 {clickCoords?.lat.toFixed(5)}, {clickCoords?.lng.toFixed(5)}</div>
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
              <button style={mvStyles.confirmBtn} onClick={confirmAddTree}
                disabled={!newTreeData.name}>Baum anlegen</button>
            </div>
          </div>
        )}

        {/* Tree detail panel */}
        {selectedTree && !showAddForm && (
          <div style={mvStyles.panel}>
            <div style={mvStyles.panelHeader}>
              <div>
                <div style={mvStyles.panelId}>{selectedTree.id}</div>
                <div style={mvStyles.panelName}>{selectedTree.name}</div>
                <div style={mvStyles.panelSpecies}>{selectedTree.species}</div>
              </div>
              <button style={mvStyles.closeBtn} onClick={() => setSelectedTree(null)}>✕</button>
            </div>
            <div style={{...mvStyles.statusBadge, background:statusColors[selectedTree.status]+"20", color:statusColors[selectedTree.status]}}>
              {statusLabel[selectedTree.status]}
            </div>
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
              {selectedTree.certified?"✓ Zertifiziert":"⚠ Ausstehend"}
            </span>
            {selectedTree.tags?.length>0 && <>
              <div style={mvStyles.section}>Tags</div>
              <div style={mvStyles.tags}>{selectedTree.tags.map(t=><span key={t} style={mvStyles.tag}>{t}</span>)}</div>
            </>}
            {selectedTree.notes && <>
              <div style={mvStyles.section}>Notizen</div>
              <div style={mvStyles.notes}>{selectedTree.notes}</div>
            </>}
            <div style={mvStyles.section}>Marker verschieben</div>
            <div style={{fontSize:12,color:"#aaa",lineHeight:1.5}}>Den Marker direkt auf der Karte ziehen um die Position zu korrigieren.</div>
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
  toolbar:        {display:"flex",alignItems:"center",gap:12,padding:"10px 16px",
                   background:"#fff",borderBottom:"1px solid #e5e5e0",flexWrap:"wrap"},
  toolbarTitle:   {fontSize:15,fontWeight:700,color:"#1a1a18",marginRight:4},
  placeSearch:    {display:"flex",alignItems:"center",gap:8,background:"#f5f5f3",
                   border:"1px solid #e2e2dc",borderRadius:8,padding:"5px 7px 5px 10px",
                   minWidth:330,flex:"1 1 360px"},
  placeInput:     {border:"none",background:"transparent",outline:"none",fontSize:12,
                   color:"#333",minWidth:190,flex:1},
  placeBtn:       {padding:"5px 10px",border:"none",borderRadius:6,background:"#1565A0",
                   color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"},
  placeStatus:    {fontSize:11,color:"#777",whiteSpace:"nowrap"},
  filters:        {display:"flex",gap:6,flex:"1 1 320px",flexWrap:"wrap"},
  filterBtn:      {padding:"5px 12px",borderRadius:100,border:"1px solid #e0e0dc",background:"#fff",
                   fontSize:12,fontWeight:500,cursor:"pointer",color:"#555",
                   display:"flex",alignItems:"center",gap:5},
  filterBtnActive:{background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  filterDot:      {width:8,height:8,borderRadius:"50%",flexShrink:0},
  addModeBtn:     {padding:"7px 14px",border:"1px solid #e0e0dc",borderRadius:8,background:"#fff",
                   fontSize:12,fontWeight:600,cursor:"pointer",color:"#1D7A56"},
  addModeBtnActive:{background:"#FFEBEE",borderColor:"#B71C1C",color:"#B71C1C"},
  addHint:        {fontSize:12,color:"#E6A817",fontWeight:500,background:"#FFF8E1",
                   padding:"4px 10px",borderRadius:6},
  panel:          {width:290,background:"#fff",borderLeft:"1px solid #e5e5e0",
                   overflowY:"auto",padding:"18px 16px",display:"flex",flexDirection:"column",gap:0},
  addPanel:       {width:290,background:"#fff",borderLeft:"1px solid #e5e5e0",
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
  closeBtn:       {background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:16,padding:4},
  statusBadge:    {display:"inline-block",padding:"4px 12px",borderRadius:100,fontSize:12,fontWeight:700,marginBottom:12},
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
