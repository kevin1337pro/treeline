function TreesView({ selectedTreeId, onSelectTree }) {
  const { trees, measures, statusColors, measureTypes } = MOCK_DATA;
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState("info");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [dataVersion, setDataVersion] = React.useState(0);
  const [newTree, setNewTree] = React.useState(createTreeForm());
  const [editTree, setEditTree] = React.useState(createTreeForm());

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
    const haystack = `${t.id} ${t.name} ${t.species} ${t.standort} ${t.orderId || ""} ${(t.tags || []).join(" ")} ${t.routeSide || ""}`.toLowerCase();
    return (!q || haystack.includes(q))
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

  function createTreeForm(tree = {}) {
    return {
      name: tree.name || "",
      species: tree.species || "",
      standort: tree.standort || "",
      status: tree.status || "gut",
      lat: tree.lat ?? 51.59683,
      lng: tree.lng ?? 6.99559,
      height: tree.height ?? 0,
      trunkDiam: tree.trunkDiam ?? 0,
      crownDiam: tree.crownDiam ?? 0,
      age: tree.age ?? 0,
      owner: tree.owner || "",
      assignedTo: tree.assignedTo || "",
      certified: Boolean(tree.certified),
      certDate: tree.certDate || "",
      certifier: tree.certifier || "",
      vta: tree.vta || "Ausstehend",
      tags: (tree.tags || []).join(", "),
      notes: tree.notes || "",
    };
  }

  function treeFromForm(form, id) {
    return {
      id,
      name: form.name.trim(),
      species: form.species.trim(),
      standort: form.standort.trim() || "Buerelterstraße 27, 45896 Gelsenkirchen",
      status: form.status,
      lat: Number(form.lat) || 51.59683,
      lng: Number(form.lng) || 6.99559,
      height: Number(form.height) || 0,
      trunkDiam: Number(form.trunkDiam) || 0,
      crownDiam: Number(form.crownDiam) || 0,
      age: Number(form.age) || 0,
      certified: Boolean(form.certified),
      certDate: form.certified ? (form.certDate || null) : null,
      certifier: form.certified ? (form.certifier || null) : null,
      vta: form.vta || "Ausstehend",
      owner: form.owner.trim(),
      assignedTo: form.assignedTo || null,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      notes: form.notes.trim(),
      measuresIds: [],
      images: [],
      createdAt: new Date().toISOString().slice(0,10),
    };
  }

  function persistTree(tree) {
    window.TREELINE_DB?.save();
    window.TREELINE_DB?.saveTree?.(tree).catch(err => {
      console.warn("Appwrite save failed; tree is stored locally.", err);
    });
    setDataVersion(v => v + 1);
  }

  function startEdit() {
    if (!selectedTree) return;
    setEditTree(createTreeForm(selectedTree));
    setEditing(true);
    setActiveTab("info");
  }

  function addSymptom() {
    const sym = { ...newSym, id:`SYM-${String(symptoms.length+1).padStart(3,"0")}`,
      treeId: selectedTree.id, date: new Date().toISOString().slice(0,10), photo: null };
    setSymptoms(prev => [...prev, sym]);
    setShowSymForm(false);
    setNewSym({ category:"Schädling", name:"", severity:"mittel", area:"", notes:"" });
  }

  async function addTree() {
    if (!newTree.name.trim()) return;
    const newId = `TRE-${new Date().getFullYear()}-${String(trees.length+1).padStart(3,"0")}`;
    const tree = treeFromForm(newTree, newId);
    MOCK_DATA.trees.push(tree);
    persistTree(tree);
    setNewTree(createTreeForm());
    setShowAddForm(false);
    onSelectTree(tree.id);
  }

  function saveEdit() {
    if (!selectedTree || !editTree.name.trim()) return;
    const updated = {
      ...selectedTree,
      ...treeFromForm(editTree, selectedTree.id),
      measuresIds: selectedTree.measuresIds || [],
      images: selectedTree.images || [],
      createdAt: selectedTree.createdAt || new Date().toISOString().slice(0,10),
    };
    Object.assign(selectedTree, updated);
    persistTree(selectedTree);
    setEditing(false);
  }

  function TreeForm({ value, onChange }) {
    const set = (key, val) => onChange({ ...value, [key]: val });
    return (
      <div style={tvStyles.formGrid}>
        <Field label="Name / Baumart" required><input style={tvStyles.fInput} value={value.name} onChange={e=>set("name", e.target.value)} placeholder="z.B. Stieleiche"/></Field>
        <Field label="Lateinische Art"><input style={tvStyles.fInput} value={value.species} onChange={e=>set("species", e.target.value)} placeholder="Quercus robur"/></Field>
        <Field label="Standort" wide><input style={tvStyles.fInput} value={value.standort} onChange={e=>set("standort", e.target.value)} placeholder="Adresse oder Standortbeschreibung"/></Field>
        <Field label="Status"><select style={tvStyles.fInput} value={value.status} onChange={e=>set("status", e.target.value)}>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Eigentümer"><input style={tvStyles.fInput} value={value.owner} onChange={e=>set("owner", e.target.value)} placeholder="Eigentümer / Auftraggeber"/></Field>
        <Field label="Zuständig"><select style={tvStyles.fInput} value={value.assignedTo} onChange={e=>set("assignedTo", e.target.value)}><option value="">Nicht zugewiesen</option>{MOCK_DATA.users.filter(u=>u.role!=="client").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Breitengrad"><input style={tvStyles.fInput} type="number" step="0.00001" value={value.lat} onChange={e=>set("lat", e.target.value)}/></Field>
        <Field label="Längengrad"><input style={tvStyles.fInput} type="number" step="0.00001" value={value.lng} onChange={e=>set("lng", e.target.value)}/></Field>
        <Field label="Höhe (m)"><input style={tvStyles.fInput} type="number" min="0" step="0.1" value={value.height} onChange={e=>set("height", e.target.value)}/></Field>
        <Field label="Stamm-Ø (cm)"><input style={tvStyles.fInput} type="number" min="0" step="1" value={value.trunkDiam} onChange={e=>set("trunkDiam", e.target.value)}/></Field>
        <Field label="Kronen-Ø (m)"><input style={tvStyles.fInput} type="number" min="0" step="0.1" value={value.crownDiam} onChange={e=>set("crownDiam", e.target.value)}/></Field>
        <Field label="Alter (Jahre)"><input style={tvStyles.fInput} type="number" min="0" step="1" value={value.age} onChange={e=>set("age", e.target.value)}/></Field>
        <Field label="VTA / Bewertung"><input style={tvStyles.fInput} value={value.vta} onChange={e=>set("vta", e.target.value)} placeholder="Ausstehend, VTA Stufe 1 ..."/></Field>
        <Field label="Zertifiziert"><label style={tvStyles.checkLabel}><input type="checkbox" checked={value.certified} onChange={e=>set("certified", e.target.checked)}/> Zertifizierung vorhanden</label></Field>
        <Field label="Zertifizierungsdatum"><input style={tvStyles.fInput} type="date" value={value.certDate} onChange={e=>set("certDate", e.target.value)} disabled={!value.certified}/></Field>
        <Field label="Gutachter"><input style={tvStyles.fInput} value={value.certifier} onChange={e=>set("certifier", e.target.value)} disabled={!value.certified}/></Field>
        <Field label="Tags" wide><input style={tvStyles.fInput} value={value.tags} onChange={e=>set("tags", e.target.value)} placeholder="Kommagetrennt, z.B. Monitoring, Totholz"/></Field>
        <Field label="Notizen" wide><textarea style={{...tvStyles.fInput,minHeight:84,resize:"vertical"}} value={value.notes} onChange={e=>set("notes", e.target.value)} placeholder="Kontrollhinweise, Schäden, Maßnahmenbedarf"/></Field>
      </div>
    );
  }

  function Field({ label, required, wide, children }) {
    return <div style={wide ? tvStyles.formWide : null}><div style={tvStyles.fLabel}>{label}{required ? " *" : ""}</div>{children}</div>;
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
            <div style={{display:"flex",gap:8,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"flex-end"}}>
              {!editing && <button style={tvStyles.smallBtn} onClick={startEdit}>Bearbeiten</button>}
              {editing && <>
                <button style={tvStyles.cancelBtn} onClick={()=>setEditing(false)}>Abbrechen</button>
                <button style={tvStyles.primaryBtn} onClick={saveEdit} disabled={!editTree.name.trim()}>Speichern</button>
              </>}
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
            {activeTab==="info" && editing && (
              <div>
                <div style={tvStyles.section}>Baumdaten bearbeiten</div>
                <TreeForm value={editTree} onChange={setEditTree} />
              </div>
            )}
            {activeTab==="info" && !editing && (
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
            <TreeForm value={newTree} onChange={setNewTree} />
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={tvStyles.cancelBtn} onClick={()=>setShowAddForm(false)}>Abbrechen</button>
              <button style={tvStyles.primaryBtn} onClick={addTree} disabled={!newTree.name.trim()}>Baum anlegen</button>
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
  modal:        {background:"#fff",borderRadius:12,padding:"28px",width:"min(780px, calc(100vw - 32px))",maxHeight:"calc(100vh - 48px)",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"},
  modalTitle:   {fontSize:18,fontWeight:700,color:"#1a1a18",marginBottom:20},
  formGrid:     {display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:16},
  formWide:     {gridColumn:"1 / -1"},
  fLabel:       {fontSize:12,fontWeight:600,color:"#555",marginBottom:4},
  fInput:       {width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"},
  checkLabel:   {display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#444",height:37},
  symCard:      {background:"#fff",border:"1px solid #e5e5e0",borderRadius:9,padding:"16px",marginBottom:10},
  symForm:      {background:"#fff",border:"1px solid #e5e5e0",borderRadius:9,padding:"16px",marginTop:12},
  severBadge:   {padding:"3px 9px",borderRadius:100,fontSize:11,fontWeight:700},
  emptyState:   {textAlign:"center",padding:"40px 20px",background:"#fff",borderRadius:10,border:"1px solid #e5e5e0",marginTop:8},
};

Object.assign(window, { TreesView });
