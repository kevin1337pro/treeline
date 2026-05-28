function PflanzungView() {
  const [plants, setPlants] = React.useState([
    { id:"NEU-001", species:"Traubeneiche", latinName:"Quercus petraea", standort:"Parkanlage Scholven, Gelsenkirchen",
      plannedDate:"2025-11-15", status:"geplant", count:3, size:"16/18 cm StU",
      reason:"Ersatzpflanzung nach Fällung Silberpappel", soil:"Lehmboden, pH 6.5",
      sunlight:"Vollsonne", waterReq:"mittel", notes:"Abstimmung mit Stadtverwaltung erforderlich",
      assignedTo:"user-002", lat:51.5986, lng:6.9968, tags:["Ersatzpflanzung","Stadtbaum"] },
    { id:"NEU-002", species:"Feldahorn", latinName:"Acer campestre", standort:"Schwedenstraße 12, Gelsenkirchen",
      plannedDate:"2025-10-20", status:"in_vorbereitung", count:2, size:"12/14 cm StU",
      reason:"Straßenbaum-Ergänzung", soil:"Sandboden", sunlight:"Halbschatten", waterReq:"niedrig",
      notes:"Bodenvorbereitung läuft", assignedTo:"user-002", lat:51.5965, lng:6.9924, tags:["Straßenbaum"] },
    { id:"NEU-003", species:"Hainbuche", latinName:"Carpinus betulus", standort:"Waldrand Scholven West",
      plannedDate:"2025-03-01", status:"abgeschlossen", count:8, size:"8/10 cm StU",
      reason:"Waldrandaufwertung", soil:"Lehmboden", sunlight:"Schatten", waterReq:"mittel",
      notes:"Gepflanzt am 28.02.2025", assignedTo:"user-003", lat:51.6004, lng:6.9932, tags:["Forstpflanzung"] },
  ]);
  const [showForm, setShowForm] = React.useState(false);
  const [selected, setSelected] = React.useState(plants[0]);
  const [newPlant, setNewPlant] = React.useState(createPlantForm());

  const statusLabel = { geplant:"Geplant", in_vorbereitung:"In Vorbereitung", abgeschlossen:"Gepflanzt" };
  const statusColor = { geplant:"#1D7A56", in_vorbereitung:"#E6A817", abgeschlossen:"#aaa" };
  const users = MOCK_DATA.users;

  const totalPlanned = plants.filter(p=>p.status!=="abgeschlossen").reduce((s,p)=>s+p.count,0);
  const totalDone    = plants.filter(p=>p.status==="abgeschlossen").reduce((s,p)=>s+p.count,0);
  function createPlantForm() {
    return {
      species:"",
      latinName:"",
      standort:"",
      plannedDate:new Date().toISOString().slice(0,10),
      status:"geplant",
      count:1,
      size:"12/14 cm StU",
      reason:"",
      soil:"",
      sunlight:"Vollsonne",
      waterReq:"mittel",
      notes:"",
      assignedTo:MOCK_DATA.users.find(u => u.role !== "client")?.id || "",
      tags:"",
    };
  }
  function nextPlantId() {
    const max = plants.reduce((n, p) => Math.max(n, Number((p.id || "").match(/\d+$/)?.[0] || 0)), 0);
    return `NEU-${String(max + 1).padStart(3,"0")}`;
  }
  function createPlanting() {
    if (!newPlant.species.trim() || !newPlant.standort.trim()) return;
    const plant = {
      ...newPlant,
      id: nextPlantId(),
      species: newPlant.species.trim(),
      latinName: newPlant.latinName.trim(),
      standort: newPlant.standort.trim(),
      count: Number(newPlant.count) || 1,
      lat: 51.59683,
      lng: 6.99559,
      tags: newPlant.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    setPlants(prev => [plant, ...prev]);
    setSelected(plant);
    setNewPlant(createPlantForm());
    setShowForm(false);
  }
  function completePlanting() {
    if (!selected) return;
    const updated = { ...selected, status:"abgeschlossen" };
    setPlants(prev => prev.map(p => p.id === selected.id ? updated : p));
    setSelected(updated);
  }

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      {/* List */}
      <div style={pfStyles.list}>
        <div style={pfStyles.listHeader}>
          <div>
            <div style={pfStyles.listTitle}>Neupflanzungen</div>
            <div style={pfStyles.listSub}>{totalPlanned} geplant · {totalDone} gepflanzt</div>
          </div>
          <button style={pfStyles.addBtn} onClick={()=>setShowForm(true)}>+ Neu</button>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {plants.map(p => (
            <div key={p.id} onClick={()=>setSelected(p)}
              style={{ ...pfStyles.plantRow, ...(selected?.id===p.id ? pfStyles.plantRowActive : {}) }}>
              <div style={{ ...pfStyles.statusLine, background: statusColor[p.status] }} />
              <div style={{ flex:1 }}>
                <div style={pfStyles.plantName}>{p.species}</div>
                <div style={pfStyles.plantLatin}>{p.latinName}</div>
                <div style={pfStyles.plantMeta}>{p.id} · {p.count}× · {p.plannedDate}</div>
              </div>
              <span style={{ ...pfStyles.sBadge, background: statusColor[p.status]+"20", color: statusColor[p.status] }}>
                {statusLabel[p.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div style={pfStyles.detail}>
          {/* Banner */}
          <div style={pfStyles.detailBanner}>
            <div style={pfStyles.bannerIcon}>🌱</div>
            <div>
              <div style={pfStyles.detailId}>{selected.id}</div>
              <div style={pfStyles.detailName}>{selected.species}</div>
              <div style={pfStyles.detailLatin}>{selected.latinName}</div>
            </div>
            <span style={{ ...pfStyles.bigBadge, background: statusColor[selected.status]+"20",
              color: statusColor[selected.status], marginLeft:"auto" }}>
              {statusLabel[selected.status]}
            </span>
          </div>

          <div style={pfStyles.content}>
            {/* Stats row */}
            <div style={pfStyles.statRow}>
              {[["Anzahl", selected.count+"×"],["Größe", selected.size],
                ["Pflanztermin", selected.plannedDate],["Licht", selected.sunlight]].map(([k,v])=>(
                <div key={k} style={pfStyles.statCell}>
                  <div style={pfStyles.statK}>{k}</div>
                  <div style={pfStyles.statV}>{v}</div>
                </div>
              ))}
            </div>

            <div style={pfStyles.section}>Standort & Boden</div>
            <div style={pfStyles.infoRow}><span style={pfStyles.infoK}>Standort</span><span style={pfStyles.infoV}>{selected.standort}</span></div>
            <div style={pfStyles.infoRow}><span style={pfStyles.infoK}>Bodentyp</span><span style={pfStyles.infoV}>{selected.soil}</span></div>
            <div style={pfStyles.infoRow}><span style={pfStyles.infoK}>Wasserbedarf</span><span style={pfStyles.infoV}>{selected.waterReq}</span></div>
            <div style={pfStyles.infoRow}><span style={pfStyles.infoK}>GPS</span><span style={pfStyles.infoV}>{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</span></div>

            <div style={pfStyles.section}>Begründung</div>
            <div style={pfStyles.notesBox}>{selected.reason}</div>

            {selected.notes && <>
              <div style={pfStyles.section}>Notizen</div>
              <div style={pfStyles.notesBox}>{selected.notes}</div>
            </>}

            <div style={pfStyles.section}>Tags</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {selected.tags.map(t=><span key={t} style={pfStyles.tag}>{t}</span>)}
            </div>

            <div style={pfStyles.section}>Zuständig</div>
            {(() => { const u=users.find(u=>u.id===selected.assignedTo); return u ? (
              <div style={pfStyles.userRow}>
                <div style={pfStyles.userAv}>{u.initials}</div>
                <div><div style={pfStyles.uName}>{u.name}</div><div style={pfStyles.uTeam}>{u.team}</div></div>
              </div>
            ) : null; })()}

            {/* Pflegehinweise */}
            <div style={pfStyles.section}>Pflegehinweise</div>
            <div style={pfStyles.careGrid}>
              {[
                { icon:"💧", label:"Bewässerung", val: selected.waterReq==="niedrig" ? "1× pro Woche" : selected.waterReq==="mittel" ? "2-3× pro Woche" : "Täglich in Trockenperioden" },
                { icon:"✂️", label:"Erster Schnitt", val:"2 Jahre nach Pflanzung" },
                { icon:"🌿", label:"Düngung", val:"Frühjahr, Langzeitdünger" },
                { icon:"🔍", label:"Kontrolle", val:"Halbjährlich, Jahr 1-3" },
              ].map(c=>(
                <div key={c.label} style={pfStyles.careCard}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
                  <div style={pfStyles.careLabel}>{c.label}</div>
                  <div style={pfStyles.careVal}>{c.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              {selected.status !== "abgeschlossen" && (
                <button style={pfStyles.primaryBtn}
                  onClick={completePlanting}>
                  ✓ Als gepflanzt markieren
                </button>
              )}
              <button style={pfStyles.secBtn}>📄 Pflanzprotokoll</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showForm && (
        <div style={pfStyles.overlay} onClick={()=>setShowForm(false)}>
          <div style={pfStyles.modal} onClick={e=>e.stopPropagation()}>
            <div style={pfStyles.modalTitle}>Neue Pflanzung planen</div>
            {[["Baumart (Deutsch)","text","z.B. Stieleiche"],
              ["Art (Lateinisch)","text","z.B. Quercus robur"],
              ["Standort","text","Adresse oder Gebiet"]].map(([l,t,ph])=>(
              <div key={l} style={{marginBottom:10}}>
                <div style={pfStyles.fLabel}>{l}</div>
                <input type={t} style={pfStyles.fInput} placeholder={ph}
                  value={l.startsWith("Baumart") ? newPlant.species : l.startsWith("Art") ? newPlant.latinName : newPlant.standort}
                  onChange={e=>setNewPlant({...newPlant,[l.startsWith("Baumart") ? "species" : l.startsWith("Art") ? "latinName" : "standort"]: e.target.value})} />
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={pfStyles.fLabel}>Anzahl</div>
                <input type="number" style={pfStyles.fInput} value={newPlant.count} min={1}
                  onChange={e=>setNewPlant({...newPlant,count:e.target.value})} />
              </div>
              <div>
                <div style={pfStyles.fLabel}>Pflanztermin</div>
                <input type="date" style={pfStyles.fInput} value={newPlant.plannedDate}
                  onChange={e=>setNewPlant({...newPlant,plannedDate:e.target.value})} />
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={pfStyles.fLabel}>Größe</div>
                <input style={pfStyles.fInput} value={newPlant.size}
                  onChange={e=>setNewPlant({...newPlant,size:e.target.value})} />
              </div>
              <div>
                <div style={pfStyles.fLabel}>Zuständig</div>
                <select style={pfStyles.fInput} value={newPlant.assignedTo}
                  onChange={e=>setNewPlant({...newPlant,assignedTo:e.target.value})}>
                  {MOCK_DATA.users.filter(u=>u.role!=="client").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={pfStyles.fLabel}>Licht</div>
                <select style={pfStyles.fInput} value={newPlant.sunlight}
                  onChange={e=>setNewPlant({...newPlant,sunlight:e.target.value})}>
                  <option>Vollsonne</option><option>Halbschatten</option><option>Schatten</option>
                </select>
              </div>
              <div>
                <div style={pfStyles.fLabel}>Wasserbedarf</div>
                <select style={pfStyles.fInput} value={newPlant.waterReq}
                  onChange={e=>setNewPlant({...newPlant,waterReq:e.target.value})}>
                  <option>niedrig</option><option>mittel</option><option>hoch</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={pfStyles.fLabel}>Boden</div>
              <input style={pfStyles.fInput} value={newPlant.soil}
                onChange={e=>setNewPlant({...newPlant,soil:e.target.value})} placeholder="Bodentyp, pH, Vorbereitung" />
            </div>
            <div style={{marginBottom:14}}>
              <div style={pfStyles.fLabel}>Begründung</div>
              <textarea style={{...pfStyles.fInput,minHeight:60,resize:"vertical"}} placeholder="Ersatzpflanzung, Neubegrünung…"
                value={newPlant.reason} onChange={e=>setNewPlant({...newPlant,reason:e.target.value})} />
            </div>
            <div style={{marginBottom:14}}>
              <div style={pfStyles.fLabel}>Tags</div>
              <input style={pfStyles.fInput} value={newPlant.tags}
                onChange={e=>setNewPlant({...newPlant,tags:e.target.value})} placeholder="Kommagetrennt" />
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={pfStyles.cancelBtn} onClick={()=>setShowForm(false)}>Abbrechen</button>
              <button style={pfStyles.primaryBtn} onClick={createPlanting}
                disabled={!newPlant.species.trim() || !newPlant.standort.trim()}>Pflanzung anlegen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pfStyles = {
  list:         { width:300,minWidth:300,background:"#fff",borderRight:"1px solid #e5e5e0",
                  display:"flex",flexDirection:"column",height:"100vh" },
  listHeader:   { display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"20px 16px 12px" },
  listTitle:    { fontSize:18,fontWeight:700,color:"#1a1a18" },
  listSub:      { fontSize:11,color:"#aaa",marginTop:2 },
  addBtn:       { padding:"6px 14px",background:"#1D7A56",color:"#fff",border:"none",
                  borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer" },
  plantRow:     { display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",
                  borderBottom:"1px solid #f5f5f2",cursor:"pointer",transition:"background 0.1s" },
  plantRowActive:{ background:"oklch(0.95 0.04 158)" },
  statusLine:   { width:3,borderRadius:2,alignSelf:"stretch",flexShrink:0,minHeight:40 },
  plantName:    { fontSize:13,fontWeight:600,color:"#1a1a18" },
  plantLatin:   { fontSize:11,color:"#aaa",fontStyle:"italic",marginTop:1 },
  plantMeta:    { fontSize:11,color:"#888",marginTop:2 },
  sBadge:       { padding:"3px 9px",borderRadius:100,fontSize:10,fontWeight:700,whiteSpace:"nowrap",marginTop:3 },
  detail:       { flex:1,overflowY:"auto",background:"#f8f7f4" },
  detailBanner: { background:"#fff",padding:"24px 28px",borderBottom:"1px solid #e5e5e0",
                  display:"flex",alignItems:"center",gap:16 },
  bannerIcon:   { fontSize:36,flexShrink:0 },
  detailId:     { fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:"0.3px" },
  detailName:   { fontSize:22,fontWeight:700,color:"#1a1a18",letterSpacing:"-0.3px" },
  detailLatin:  { fontSize:13,color:"#888",fontStyle:"italic",marginTop:2 },
  bigBadge:     { padding:"5px 13px",borderRadius:100,fontSize:12,fontWeight:700 },
  content:      { padding:"24px 28px" },
  statRow:      { display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:8 },
  statCell:     { background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,padding:"10px 12px" },
  statK:        { fontSize:10,color:"#aaa",fontWeight:600,textTransform:"uppercase" },
  statV:        { fontSize:15,fontWeight:700,color:"#1a1a18",marginTop:4 },
  section:      { fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.8px",
                  textTransform:"uppercase",marginTop:20,marginBottom:8 },
  infoRow:      { display:"flex",justifyContent:"space-between",padding:"7px 0",
                  borderBottom:"1px solid #f0f0ee" },
  infoK:        { fontSize:13,color:"#888" },
  infoV:        { fontSize:13,fontWeight:500,color:"#1a1a18" },
  notesBox:     { fontSize:13,color:"#555",lineHeight:1.7,background:"#fff",padding:"12px",
                  borderRadius:8,border:"1px solid #e5e5e0" },
  tag:          { fontSize:11,background:"#efefed",color:"#555",padding:"4px 10px",borderRadius:100 },
  userRow:      { display:"flex",alignItems:"center",gap:10 },
  userAv:       { width:32,height:32,borderRadius:"50%",background:"#1D7A56",color:"#fff",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 },
  uName:        { fontSize:13,fontWeight:600,color:"#1a1a18" },
  uTeam:        { fontSize:11,color:"#aaa" },
  careGrid:     { display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginTop:4 },
  careCard:     { background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,padding:"12px" },
  careLabel:    { fontSize:12,fontWeight:600,color:"#333",marginBottom:3 },
  careVal:      { fontSize:11,color:"#888",lineHeight:1.4 },
  primaryBtn:   { padding:"10px 18px",background:"#1D7A56",color:"#fff",border:"none",
                  borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" },
  secBtn:       { padding:"10px 18px",background:"#EDF7F1",color:"#1D7A56",border:"none",
                  borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" },
  overlay:      { position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,
                  display:"flex",alignItems:"center",justifyContent:"center" },
  modal:        { background:"#fff",borderRadius:12,padding:"28px",width:440,
                  boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto" },
  modalTitle:   { fontSize:18,fontWeight:700,color:"#1a1a18",marginBottom:20 },
  fLabel:       { fontSize:12,fontWeight:600,color:"#555",marginBottom:4 },
  fInput:       { width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:7,
                  fontSize:13,outline:"none",boxSizing:"border-box" },
  cancelBtn:    { padding:"10px 18px",background:"#f5f5f3",color:"#555",border:"none",
                  borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" },
};

Object.assign(window, { PflanzungView });
