function TreesView({ selectedTreeId, onSelectTree }) {
  const { trees, measures, statusColors, measureTypes } = MOCK_DATA;
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState("info");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newTree, setNewTree] = React.useState({ name:"", species:"", standort:"", status:"gut" });

  // Krankheit state
  const [symptoms, setSymptoms] = React.useState([
    { id:"SYM-001", treeId:"TRE-2024-003", date:"2025-03-10", category:"Schädling",
      name:"Eichenprozessionsspinner", severity:"hoch", area:"Gesamtkrone",
      notes:"Nester in der mittleren Kronenzone. Haare nachgewiesen.", photo:null },
    { id:"SYM-002", treeId:"TRE-2024-002", date:"2025-01-20", category:"Pilz",
      name:"Hallimasch", severity:"mittel", area:"Stammfuß",
      notes:"Fruchtkörper im Herbst sichtbar. Weißfäule.", photo:null },
  ]);
  const [showSymForm, setShowSymForm] = React.useState(false);
  const [newSym, setNewSym] = React.useState({ category:"Schädling", name:"", severity:"mittel", area:"", notes:"" });

  const statusLabel = { gut:"Gut", mittel:"Mittel", schlecht:"Schlecht", kritisch:"Kritisch" };
  const selectedTree = trees.find(t => t.id === selectedTreeId) || trees[0];

  const filtered = trees.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.species.toLowerCase().includes(q))
      && (statusFilter==="all" || t.status===statusFilter);
  });

  const treeMeasures = measures.filter(m => m.treeId === selectedTree?.id);
  const treeSymptoms = symptoms.filter(s => s.treeId === selectedTree?.id);
  const assignedUser = MOCK_DATA.users.find(u => u.id === selectedTree?.assignedTo);

  const severityColor = { hoch:"#B71C1C", mittel:"#E6A817", niedrig:"#1D7A56" };
  const categoryIcon  = { Schädling:"🐛", Pilz:"🍄", Krankheit:"🦠", Mechanisch:"⚡", Sonstiges:"📋" };

  function InfoRow({ label, value }) {
    return (
      <div style={tvStyles.infoRow}>
        <span style={tvStyles.infoKey}>{label}</span>
        <span style={tvStyles.infoVal}>{value||"—"}</span>
      </div>
    );
  }

  function addSymptom() {
    const sym = { ...newSym, id:`SYM-${String(symptoms.length+1).padStart(3,"0")}`,
      treeId: selectedTree.id, date: new Date().toISOString().slice(0,10), photo: null };
    setSymptoms(prev => [...prev, sym]);
    setShowSymForm(false);
    setNewSym({ category:"Schädling", name:"", severity:"mittel", area:"", notes:"" });
  }

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      {/* List */}
      <div style={tvStyles.list}>
        <div style={tvStyles.listHeader}>
          <div style={tvStyles.listTitle}>Bäume</div>
          <button style={tvStyles.addBtn} onClick={()=>setShowAddForm(true)}>+ Neu</button>
        </div>
        <div style={tvStyles.searchBar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={tvStyles.searchInput} placeholder="Suche ID, Name, Art…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={tvStyles.filterTabs}>
          {["all","gut","mittel","schlecht","kritisch"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              style={{...tvStyles.filterTab,...(statusFilter===s?{borderBottomColor:"#1D7A56",color:"#1D7A56"}:{})}}>
              {s==="all"?"Alle":statusLabel[s]}
            </button>
          ))}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {filtered.map(t=>(
            <div key={t.id} onClick={()=>onSelectTree(t.id)}
              style={{...tvStyles.treeRow,...(selectedTree?.id===t.id?tvStyles.treeRowActive:{})}}>
              <div style={{...tvStyles.statusDot,background:statusColors[t.status]}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={tvStyles.treeName}>{t.name}</div>
                <div style={tvStyles.treeId}>{t.id} · {t.species}</div>
                <div style={tvStyles.treeAddr}>{t.standort}</div>
              </div>
              {t.certified && <span style={tvStyles.certMini}>✓</span>}
            </div>
          ))}
          {filtered.length===0 && <div style={tvStyles.empty}>Kein Ergebnis</div>}
        </div>
      </div>

      {/* Detail */}
      {selectedTree && (
        <div style={tvStyles.detail}>
          <div style={tvStyles.detailHeader}>
            <div>
              <div style={tvStyles.detailId}>{selectedTree.id}</div>
              <div style={tvStyles.detailName}>{selectedTree.name}</div>
              <div style={tvStyles.detailSpecies}>{selectedTree.species}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{...tvStyles.bigBadge,background:statusColors[selectedTree.status]+"20",color:statusColors[selectedTree.status]}}>
                {statusLabel[selectedTree.status]}
              </span>
              <span style={{...tvStyles.bigBadge,background:selectedTree.certified?"#EDF7F1":"#FFF3E0",color:selectedTree.certified?"#1D7A56":"#E65100"}}>
                {selectedTree.certified?"✓ Zertifiziert":"⚠ Ausstehend"}
              </span>
            </div>
          </div>

          <div style={tvStyles.tabs}>
            {[["info","Stammdaten"],["cert","Zertifizierung"],["krankheit","Diagnose"],["measures","Maßnahmen"],["media","Medien"]].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)}
                style={{...tvStyles.tab,...(activeTab===id?tvStyles.tabActive:{})}}>
                {id==="krankheit" && treeSymptoms.length>0 ? `${label} (${treeSymptoms.length})` : label}
              </button>
            ))}
          </div>

          <div style={tvStyles.tabContent}>
            {/* STAMMDATEN */}
            {activeTab==="info" && (
              <div>
                <div style={tvStyles.section}>Standort & Eigentümer</div>
                <InfoRow label="Standort" value={selectedTree.standort}/>
                <InfoRow label="GPS" value={`${selectedTree.lat?.toFixed(5)}, ${selectedTree.lng?.toFixed(5)}`}/>
                <InfoRow label="Eigentümer" value={selectedTree.owner}/>
                <InfoRow label="Zuständig" value={assignedUser?.name}/>
                <div style={tvStyles.section}>Baumdaten</div>
                <div style={tvStyles.metaGrid}>
                  {[["Höhe",selectedTree.height+" m"],["Stamm-Ø",selectedTree.trunkDiam+" cm"],
                    ["Kronen-Ø",selectedTree.crownDiam+" m"],["Alter",selectedTree.age+" Jahre"]].map(([k,v])=>(
                    <div key={k} style={tvStyles.metaCell}>
                      <div style={tvStyles.metaKey}>{k}</div>
                      <div style={tvStyles.metaVal}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={tvStyles.section}>Tags</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {selectedTree.tags?.length>0?selectedTree.tags.map(tag=>(
                    <span key={tag} style={tvStyles.tag}>{tag}</span>
                  )):<span style={{fontSize:13,color:"#aaa"}}>Keine Tags</span>}
                </div>
                {selectedTree.notes && <>
                  <div style={tvStyles.section}>Notizen</div>
                  <div style={tvStyles.notes}>{selectedTree.notes}</div>
                </>}
              </div>
            )}

            {/* ZERTIFIZIERUNG */}
            {activeTab==="cert" && (
              <div>
                <div style={tvStyles.certBox}>
                  <div style={{fontSize:32,marginBottom:8}}>{selectedTree.certified?"✅":"⏳"}</div>
                  <div style={{fontSize:16,fontWeight:700,color:selectedTree.certified?"#1D7A56":"#E6A817"}}>
                    {selectedTree.certified?"Zertifiziert":"Ausstehend"}
                  </div>
                  {selectedTree.certDate && <div style={{fontSize:13,color:"#888",marginTop:4}}>Datum: {selectedTree.certDate}</div>}
                  {selectedTree.certifier && <div style={{fontSize:13,color:"#888"}}>Gutachter: {selectedTree.certifier}</div>}
                </div>
                <div style={tvStyles.section}>VTA-Bewertung</div>
                <InfoRow label="Stufe" value={selectedTree.vta}/>
                <InfoRow label="Baum-ID" value={selectedTree.id}/>
                {!selectedTree.certified && (
                  <button style={{...tvStyles.primaryBtn,marginTop:20}}>Zertifizierung beantragen</button>
                )}
              </div>
            )}

            {/* KRANKHEIT / DIAGNOSE */}
            {activeTab==="krankheit" && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={tvStyles.section}>Symptome & Diagnosen ({treeSymptoms.length})</div>
                  <button style={tvStyles.smallBtn} onClick={()=>setShowSymForm(true)}>+ Befund erfassen</button>
                </div>

                {treeSymptoms.length===0 && (
                  <div style={tvStyles.emptyState}>
                    <div style={{fontSize:32,marginBottom:8}}>🌿</div>
                    <div style={{fontSize:14,fontWeight:600,color:"#555"}}>Keine Befunde erfasst</div>
                    <div style={{fontSize:12,color:"#aaa",marginTop:4}}>Krankheiten, Schädlinge und Schäden hier dokumentieren</div>
                  </div>
                )}

                {treeSymptoms.map(sym=>(
                  <div key={sym.id} style={tvStyles.symCard}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:20}}>{categoryIcon[sym.category]||"📋"}</span>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"#1a1a18"}}>{sym.name}</div>
                          <div style={{fontSize:11,color:"#aaa"}}>{sym.category} · {sym.date}</div>
                        </div>
                      </div>
                      <span style={{...tvStyles.severBadge,background:severityColor[sym.severity]+"20",color:severityColor[sym.severity]}}>
                        {sym.severity}
                      </span>
                    </div>
                    <InfoRow label="Bereich" value={sym.area}/>
                    {sym.notes && <div style={{...tvStyles.notes,marginTop:8}}>{sym.notes}</div>}
                    <div style={{display:"flex",gap:6,marginTop:10}}>
                      <button style={tvStyles.smallBtn}>📸 Foto hinzufügen</button>
                      <button style={tvStyles.smallBtn}>+ Maßnahme erstellen</button>
                    </div>
                  </div>
                ))}

                {/* Symptom form */}
                {showSymForm && (
                  <div style={tvStyles.symForm}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1a1a18",marginBottom:12}}>Neuen Befund erfassen</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      <div>
                        <div style={tvStyles.fLabel}>Kategorie</div>
                        <select style={tvStyles.fInput} value={newSym.category} onChange={e=>setNewSym({...newSym,category:e.target.value})}>
                          {["Schädling","Pilz","Krankheit","Mechanisch","Sonstiges"].map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={tvStyles.fLabel}>Schweregrad</div>
                        <select style={tvStyles.fInput} value={newSym.severity} onChange={e=>setNewSym({...newSym,severity:e.target.value})}>
                          {["niedrig","mittel","hoch"].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={tvStyles.fLabel}>Befundname</div>
                      <input style={tvStyles.fInput} placeholder="z.B. Eichenprozessionsspinner" value={newSym.name} onChange={e=>setNewSym({...newSym,name:e.target.value})}/>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={tvStyles.fLabel}>Betroffener Bereich</div>
                      <input style={tvStyles.fInput} placeholder="z.B. Stammfuß, Gesamtkrone" value={newSym.area} onChange={e=>setNewSym({...newSym,area:e.target.value})}/>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={tvStyles.fLabel}>Notizen</div>
                      <textarea style={{...tvStyles.fInput,minHeight:60,resize:"vertical"}} value={newSym.notes} onChange={e=>setNewSym({...newSym,notes:e.target.value})} placeholder="Beschreibung des Befundes…"/>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={tvStyles.cancelBtn} onClick={()=>setShowSymForm(false)}>Abbrechen</button>
                      <button style={tvStyles.primaryBtn} onClick={addSymptom} disabled={!newSym.name}>Befund speichern</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MASSNAHMEN */}
            {activeTab==="measures" && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={tvStyles.section}>Maßnahmen ({treeMeasures.length})</div>
                  <button style={tvStyles.smallBtn}>+ Neue Maßnahme</button>
                </div>
                {treeMeasures.length===0 && <div style={tvStyles.empty}>Keine Maßnahmen geplant</div>}
                {treeMeasures.map(m=>{
                  const mt=measureTypes[m.type]||{};
                  const stCol={geplant:"#1D7A56",in_arbeit:"#E6A817",abgeschlossen:"#aaa"}[m.status];
                  return (
                    <div key={m.id} style={tvStyles.measureCard}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#1a1a18"}}>{m.title}</div>
                        <span style={{...tvStyles.badge,background:stCol+"20",color:stCol}}>
                          {{geplant:"Geplant",in_arbeit:"In Arbeit",abgeschlossen:"Abgeschlossen"}[m.status]}
                        </span>
                      </div>
                      <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                        <span style={{...tvStyles.badge,background:(mt.color||"#888")+"15",color:mt.color||"#888"}}>{mt.label||m.type}</span>
                        <span style={{fontSize:12,color:"#aaa"}}>📅 {m.date}</span>
                        {m.cost && <span style={{fontSize:12,color:"#aaa"}}>💶 {m.cost.toLocaleString("de")} €</span>}
                      </div>
                      {m.notes && <div style={{fontSize:12,color:"#666",marginTop:6}}>{m.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* MEDIEN */}
            {activeTab==="media" && (
              <div>
                <div style={tvStyles.section}>Medien</div>
                <div style={tvStyles.uploadZone}>
                  <div style={{fontSize:28,marginBottom:6}}>📎</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#555"}}>Dateien hinzufügen</div>
                  <div style={{fontSize:11,color:"#aaa",marginTop:3}}>JPG, PNG, MP4, Drohnenaufnahmen</div>
                  <button style={{...tvStyles.smallBtn,marginTop:10}}>Datei auswählen</button>
                </div>
                <div style={{fontSize:13,color:"#aaa",marginTop:12}}>Noch keine Medien hochgeladen.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAddForm && (
        <div style={tvStyles.modalOverlay} onClick={()=>setShowAddForm(false)}>
          <div style={tvStyles.modal} onClick={e=>e.stopPropagation()}>
            <div style={tvStyles.modalTitle}>Neuen Baum erfassen</div>
            {[["Name / Baumart","name"],["Lateinische Art","species"],["Standort","standort"]].map(([label,field])=>(
              <div key={field} style={{marginBottom:12}}>
                <div style={tvStyles.fLabel}>{label}</div>
                <input style={tvStyles.fInput} value={newTree[field]} placeholder={label}
                  onChange={e=>setNewTree({...newTree,[field]:e.target.value})}/>
              </div>
            ))}
            <div style={{marginBottom:16}}>
              <div style={tvStyles.fLabel}>Status</div>
              <select style={tvStyles.fInput} value={newTree.status}
                onChange={e=>setNewTree({...newTree,status:e.target.value})}>
                {Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={tvStyles.cancelBtn} onClick={()=>setShowAddForm(false)}>Abbrechen</button>
              <button style={tvStyles.primaryBtn} onClick={()=>setShowAddForm(false)}>Baum anlegen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tvStyles = {
  list:         {width:300,minWidth:300,background:"#fff",borderRight:"1px solid #e5e5e0",display:"flex",flexDirection:"column",height:"100vh",overflowY:"hidden"},
  listHeader:   {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 16px 12px"},
  listTitle:    {fontSize:18,fontWeight:700,color:"#1a1a18"},
  addBtn:       {padding:"6px 14px",background:"#1D7A56",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"},
  searchBar:    {display:"flex",alignItems:"center",gap:8,margin:"0 12px 8px",background:"#f5f5f3",borderRadius:8,padding:"8px 12px"},
  searchInput:  {border:"none",background:"none",outline:"none",fontSize:13,width:"100%",color:"#333"},
  filterTabs:   {display:"flex",borderBottom:"1px solid #e5e5e0",padding:"0 8px"},
  filterTab:    {flex:1,padding:"8px 4px",border:"none",borderBottom:"2px solid transparent",background:"none",fontSize:11,cursor:"pointer",color:"#aaa",fontWeight:500},
  treeRow:      {display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderBottom:"1px solid #f5f5f2",cursor:"pointer",transition:"background 0.1s"},
  treeRowActive:{background:"oklch(0.95 0.04 158)"},
  statusDot:    {width:10,height:10,borderRadius:"50%",marginTop:4,flexShrink:0},
  treeName:     {fontSize:13,fontWeight:600,color:"#1a1a18"},
  treeId:       {fontSize:11,color:"#aaa",marginTop:2},
  treeAddr:     {fontSize:11,color:"#888",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  certMini:     {fontSize:12,color:"#1D7A56",fontWeight:700,marginTop:3},
  empty:        {padding:"24px 16px",fontSize:13,color:"#aaa",textAlign:"center"},
  detail:       {flex:1,overflowY:"auto",background:"#f8f7f4"},
  detailHeader: {background:"#fff",padding:"24px 28px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid #e5e5e0"},
  detailId:     {fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:"0.3px"},
  detailName:   {fontSize:24,fontWeight:700,color:"#1a1a18",letterSpacing:"-0.4px",marginTop:2},
  detailSpecies:{fontSize:13,color:"#888",fontStyle:"italic",marginTop:2},
  bigBadge:     {padding:"5px 13px",borderRadius:100,fontSize:13,fontWeight:700},
  tabs:         {display:"flex",background:"#fff",borderBottom:"1px solid #e5e5e0",padding:"0 20px",overflowX:"auto"},
  tab:          {padding:"12px 14px",border:"none",borderBottom:"2px solid transparent",background:"none",fontSize:13,cursor:"pointer",color:"#aaa",fontWeight:500,transition:"all 0.15s",whiteSpace:"nowrap"},
  tabActive:    {borderBottomColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  tabContent:   {padding:"24px 28px"},
  section:      {fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.8px",textTransform:"uppercase",marginTop:20,marginBottom:10},
  infoRow:      {display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0ee"},
  infoKey:      {fontSize:13,color:"#888"},
  infoVal:      {fontSize:13,fontWeight:500,color:"#1a1a18",textAlign:"right",maxWidth:"60%"},
  metaGrid:     {display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:8},
  metaCell:     {background:"#fff",borderRadius:8,padding:"10px 12px",border:"1px solid #e5e5e0"},
  metaKey:      {fontSize:10,color:"#aaa",fontWeight:600,textTransform:"uppercase"},
  metaVal:      {fontSize:16,fontWeight:700,color:"#1a1a18",marginTop:4},
  tag:          {fontSize:11,background:"#efefed",color:"#555",padding:"4px 10px",borderRadius:100},
  notes:        {fontSize:13,color:"#555",lineHeight:1.7,background:"#fff",padding:"12px",borderRadius:8,border:"1px solid #e5e5e0"},
  certBox:      {background:"#fff",border:"2px solid #e5e5e0",borderRadius:10,padding:"24px",textAlign:"center",marginBottom:8},
  measureCard:  {background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,padding:"14px",marginBottom:10},
  badge:        {display:"inline-block",padding:"3px 9px",borderRadius:100,fontSize:11,fontWeight:600},
  uploadZone:   {border:"2px dashed #ddd",borderRadius:10,padding:"28px",textAlign:"center",background:"#fff",marginTop:8},
  primaryBtn:   {padding:"10px 20px",background:"#1D7A56",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
  smallBtn:     {padding:"6px 12px",background:"#EDF7F1",color:"#1D7A56",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"},
  cancelBtn:    {padding:"10px 16px",background:"#f5f5f3",color:"#555",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
  modalOverlay: {position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"},
  modal:        {background:"#fff",borderRadius:12,padding:"28px",width:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"},
  modalTitle:   {fontSize:18,fontWeight:700,color:"#1a1a18",marginBottom:20},
  fLabel:       {fontSize:12,fontWeight:600,color:"#555",marginBottom:4},
  fInput:       {width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"},
  symCard:      {background:"#fff",border:"1px solid #e5e5e0",borderRadius:9,padding:"16px",marginBottom:10},
  symForm:      {background:"#fff",border:"1px solid #e5e5e0",borderRadius:9,padding:"16px",marginTop:12},
  severBadge:   {padding:"3px 9px",borderRadius:100,fontSize:11,fontWeight:700},
  emptyState:   {textAlign:"center",padding:"40px 20px",background:"#fff",borderRadius:10,border:"1px solid #e5e5e0",marginTop:8},
};

Object.assign(window, { TreesView });
