function MapView({ onSelectTree }) {
  const mapRef = React.useRef(null);
  const leafletMap = React.useRef(null);
  const markersRef = React.useRef({});
  const [selectedTree, setSelectedTree] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [addMode, setAddMode] = React.useState(false);
  const [newMarker, setNewMarker] = React.useState(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newTreeData, setNewTreeData] = React.useState({ name:"", species:"", status:"gut", standort:"" });
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
    leafletMap.current = L.map(mapRef.current, { center:[51.758,14.333], zoom:15 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:"© OpenStreetMap contributors", maxZoom:19
    }).addTo(leafletMap.current);
    renderMarkers();

    leafletMap.current.on("click", e => {
      if (!addMode) return;
      setClickCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }, []);

  // Handle add mode toggle
  React.useEffect(() => {
    if (!leafletMap.current) return;
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
      });
      markersRef.current[tree.id] = m;
    });
  }

  function confirmAddTree() {
    const newId = `TRE-${new Date().getFullYear()}-${String(trees.length+1).padStart(3,"0")}`;
    const t = { ...newTreeData, id: newId, lat: clickCoords.lat, lng: clickCoords.lng,
      height:0, trunkDiam:0, crownDiam:0, age:0, certified:false, certDate:null,
      certifier:null, vta:"Ausstehend", owner:"", tags:[], notes:"", assignedTo:null,
      measuresIds:[], images:[], createdAt: new Date().toISOString().slice(0,10) };
    MOCK_DATA.trees.push(t);
    const m = L.marker([t.lat, t.lng], { icon: makeIcon(statusColors[t.status]||"#888"), draggable: true })
      .addTo(leafletMap.current);
    m.on("click", () => setSelectedTree(t));
    markersRef.current[t.id] = m;
    if (newMarker) { leafletMap.current.removeLayer(newMarker); setNewMarker(null); }
    setShowAddForm(false); setAddMode(false); setClickCoords(null);
    setSelectedTree(t);
    setNewTreeData({ name:"", species:"", status:"gut", standort:"" });
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
            <div style={mvStyles.fLabel}>Status</div>
            <select style={mvStyles.fInput} value={newTreeData.status}
              onChange={e=>setNewTreeData({...newTreeData,status:e.target.value})}>
              {Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
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
  filters:        {display:"flex",gap:6,flex:1,flexWrap:"wrap"},
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
                   padding:"18px 16px",display:"flex",flexDirection:"column",gap:6},
  addPanelTitle:  {fontSize:16,fontWeight:700,color:"#1a1a18",marginBottom:4},
  addCoords:      {fontSize:11,color:"#1D7A56",background:"#EDF7F1",padding:"5px 10px",
                   borderRadius:6,marginBottom:8,fontWeight:500},
  fLabel:         {fontSize:11,fontWeight:600,color:"#555",marginTop:4},
  fInput:         {width:"100%",padding:"8px 10px",border:"1px solid #ddd",borderRadius:7,
                   fontSize:12,outline:"none",boxSizing:"border-box",marginTop:3},
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
