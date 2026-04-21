function UploadView() {
  const [files, setFiles] = React.useState([
    { id:1,  name:"Eiche_TRE-2024-001_Drohne.jpg",    type:"image", size:"4.2 MB", tree:"TRE-2024-001", date:"2024-11-10", tag:"Drohne",  thumb:"https://images.unsplash.com/photo-1542621334-a254cf47733d?w=400&q=80", drone:{ alt:48, speed:6.2, ndvi:0.72, thermal:false } },
    { id:2,  name:"Rotbuche_TRE-2024-002_Pilz.jpg",   type:"image", size:"2.8 MB", tree:"TRE-2024-002", date:"2025-01-15", tag:"Befund",  thumb:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80", drone:null },
    { id:3,  name:"EPS-Kiefer-2024.mp4",              type:"video", size:"128 MB", tree:"TRE-2024-003", date:"2025-03-01", tag:"Drohne",  thumb:null, drone:{ alt:22, speed:4.0, ndvi:null, thermal:true } },
    { id:4,  name:"Silberpappel_Totholz.jpg",         type:"image", size:"3.1 MB", tree:"TRE-2024-004", date:"2025-02-20", tag:"Befund",  thumb:"https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&q=80", drone:null },
    { id:5,  name:"Drohne_Cottbus_Overview.jpg",      type:"image", size:"7.8 MB", tree:"TRE-2024-001", date:"2025-04-01", tag:"Drohne",  thumb:"https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=400&q=80", drone:{ alt:80, speed:8.5, ndvi:0.65, thermal:false } },
    { id:6,  name:"Hainbuche_Formschnitt.jpg",        type:"image", size:"1.9 MB", tree:"TRE-2024-006", date:"2025-03-15", tag:"Maßnahme",thumb:"https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&q=80", drone:null },
    { id:7,  name:"NDVI_Analyse_April.jpg",           type:"image", size:"5.4 MB", tree:"TRE-2024-007", date:"2025-04-10", tag:"NDVI",    thumb:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80", drone:{ alt:60, speed:5.0, ndvi:0.58, thermal:false } },
    { id:8,  name:"Thermokamera_EPS.jpg",             type:"image", size:"3.7 MB", tree:"TRE-2024-003", date:"2025-03-20", tag:"Thermal", thumb:"https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=400&q=80", drone:{ alt:15, speed:2.0, ndvi:null, thermal:true } },
  ]);

  const [dragging, setDragging]     = React.useState(false);
  const [treeFilter, setTreeFilter] = React.useState("all");
  const [tagFilter, setTagFilter]   = React.useState("all");
  const [viewMode, setViewMode]     = React.useState("grid"); // grid | list
  const [lightbox, setLightbox]     = React.useState(null);  // file object
  const { trees } = MOCK_DATA;

  const allTags = [...new Set(files.map(f => f.tag))];
  const filtered = files.filter(f =>
    (treeFilter === "all" || f.tree === treeFilter) &&
    (tagFilter  === "all" || f.tag  === tagFilter)
  );

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const newFiles = dropped.map((f, i) => ({
      id: files.length + i + 1, name: f.name,
      type: f.type.startsWith("video") ? "video" : "image",
      size: (f.size/1024/1024).toFixed(1)+" MB",
      tree:"—", date: new Date().toISOString().slice(0,10),
      tag:"Neu", thumb:null, drone:null,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }

  const tagColors = { Drohne:"#1565A0", Befund:"#E65100", Maßnahme:"#1D7A56", NDVI:"#558B2F", Thermal:"#B71C1C", Neu:"#888" };

  // Lightbox navigation
  const lightboxIndex = lightbox ? filtered.findIndex(f => f.id === lightbox.id) : -1;
  function lbNext() { if (lightboxIndex < filtered.length-1) setLightbox(filtered[lightboxIndex+1]); }
  function lbPrev() { if (lightboxIndex > 0) setLightbox(filtered[lightboxIndex-1]); }

  React.useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === "ArrowRight") lbNext();
      if (e.key === "ArrowLeft")  lbPrev();
      if (e.key === "Escape")     setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, lightboxIndex]);

  function NdviBar({ value }) {
    const pct = Math.round(value * 100);
    const color = value > 0.7 ? "#2E7D52" : value > 0.5 ? "#E6A817" : "#B71C1C";
    return (
      <div style={{ marginTop:4 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#888", marginBottom:3 }}>
          <span>NDVI</span><span style={{ color, fontWeight:700 }}>{value.toFixed(2)}</span>
        </div>
        <div style={{ height:5, background:"#eee", borderRadius:3, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={upStyles.page}>
      <div style={upStyles.header}>
        <div>
          <h1 style={upStyles.title}>Medien</h1>
          <p style={upStyles.sub}>{files.length} Dateien · Fotos, Videos & Drohnenaufnahmen</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setViewMode("grid")} style={{...upStyles.viewBtn,...(viewMode==="grid"?upStyles.viewBtnActive:{})}}>⊞ Galerie</button>
          <button onClick={()=>setViewMode("list")} style={{...upStyles.viewBtn,...(viewMode==="list"?upStyles.viewBtnActive:{})}}>☰ Liste</button>
        </div>
      </div>

      {/* Drop zone */}
      <div style={{...upStyles.dropZone,...(dragging?upStyles.dropZoneActive:{})}}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)} onDrop={handleDrop}>
        <div style={{fontSize:36,marginBottom:8}}>☁️</div>
        <div style={upStyles.dropTitle}>Dateien hierher ziehen oder auswählen</div>
        <div style={upStyles.dropSub}>JPG · PNG · MP4 · MOV · DJI-Formate · Max 500 MB</div>
        <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"center",flexWrap:"wrap"}}>
          <button style={upStyles.uploadBtn}>📂 Dateien auswählen</button>
          <button style={upStyles.uploadBtnAlt}>🚁 Drohnenaufnahme importieren</button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={upStyles.filterBar}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={()=>setTagFilter("all")} style={{...upStyles.chip,...(tagFilter==="all"?upStyles.chipActive:{})}}>Alle Tags</button>
          {allTags.map(t=>(
            <button key={t} onClick={()=>setTagFilter(t)}
              style={{...upStyles.chip,...(tagFilter===t?{...upStyles.chipActive,background:(tagColors[t]||"#888")+"20",borderColor:tagColors[t]||"#888",color:tagColors[t]||"#888"}:{})}}>
              {t}
            </button>
          ))}
        </div>
        <select style={upStyles.select} value={treeFilter} onChange={e=>setTreeFilter(e.target.value)}>
          <option value="all">Alle Bäume</option>
          {trees.map(t=><option key={t.id} value={t.id}>{t.id} – {t.name}</option>)}
        </select>
      </div>

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div style={upStyles.grid}>
          {filtered.map(f => {
            const tc = tagColors[f.tag]||"#888";
            return (
              <div key={f.id} style={upStyles.gridCard} onClick={()=>setLightbox(f)}>
                <div style={upStyles.thumb}>
                  {f.thumb ? (
                    <img src={f.thumb} alt={f.name}
                      style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>{e.target.style.display="none";}} />
                  ) : (
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:28,background:"#f5f5f3"}}>
                      {f.type==="video"?"🎬":"🖼️"}
                    </div>
                  )}
                  {f.drone && (
                    <div style={upStyles.droneBadge}>🚁</div>
                  )}
                  {f.type==="video" && (
                    <div style={upStyles.playOverlay}>▶</div>
                  )}
                </div>
                <div style={upStyles.gridInfo}>
                  <div style={upStyles.gridName}>{f.name}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                    <span style={{...upStyles.tagBadge,background:tc+"18",color:tc}}>{f.tag}</span>
                    <span style={{fontSize:10,color:"#aaa"}}>{f.size}</span>
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginTop:3}}>{f.date}</div>
                  {f.drone?.ndvi != null && <NdviBar value={f.drone.ndvi} />}
                </div>
              </div>
            );
          })}
          {filtered.length===0 && (
            <div style={{gridColumn:"1/-1",padding:"40px",textAlign:"center",color:"#aaa",fontSize:14}}>
              Keine Dateien gefunden
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div style={upStyles.listCard}>
          <table style={upStyles.table}>
            <thead><tr>
              {["","Dateiname","Typ","Baum","Größe","Datum","Tag","Drohne","Aktionen"].map(h=>(
                <th key={h} style={upStyles.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(f=>{
                const tc=tagColors[f.tag]||"#888";
                return (
                  <tr key={f.id} style={upStyles.tr}>
                    <td style={{...upStyles.td,width:40}}>
                      {f.thumb
                        ? <img src={f.thumb} style={{width:32,height:32,objectFit:"cover",borderRadius:4,cursor:"pointer"}} onClick={()=>setLightbox(f)} onError={e=>{e.target.style.display="none";}} />
                        : <span style={{fontSize:18,cursor:"pointer"}} onClick={()=>setLightbox(f)}>{f.type==="video"?"🎬":"🖼️"}</span>}
                    </td>
                    <td style={{...upStyles.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500,color:"#1a1a18",cursor:"pointer"}}
                      onClick={()=>setLightbox(f)}>{f.name}</td>
                    <td style={upStyles.td}>{f.type==="image"?"Bild":"Video"}</td>
                    <td style={upStyles.td}><span style={upStyles.treeChip}>{f.tree}</span></td>
                    <td style={upStyles.td}>{f.size}</td>
                    <td style={upStyles.td}>{f.date}</td>
                    <td style={upStyles.td}><span style={{...upStyles.tagBadge,background:tc+"18",color:tc}}>{f.tag}</span></td>
                    <td style={upStyles.td}>{f.drone ? <span style={{fontSize:11,color:"#1565A0"}}>🚁 {f.drone.alt}m</span> : "—"}</td>
                    <td style={upStyles.td}>
                      <div style={{display:"flex",gap:5}}>
                        <button style={upStyles.iconBtn} onClick={()=>setLightbox(f)} title="Vorschau">👁</button>
                        <button style={upStyles.iconBtn} title="Download">⬇</button>
                        <button style={{...upStyles.iconBtn,color:"#B71C1C"}} title="Löschen"
                          onClick={()=>setFiles(prev=>prev.filter(x=>x.id!==f.id))}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && (
                <tr><td colSpan={9} style={{padding:"28px",textAlign:"center",color:"#aaa",fontSize:13}}>Keine Dateien</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={upStyles.lbOverlay} onClick={()=>setLightbox(null)}>
          <div style={upStyles.lbBox} onClick={e=>e.stopPropagation()}>
            {/* Nav arrows */}
            <button style={{...upStyles.lbArrow,left:12}} onClick={lbPrev}
              disabled={lightboxIndex===0}>‹</button>
            <button style={{...upStyles.lbArrow,right:12}} onClick={lbNext}
              disabled={lightboxIndex===filtered.length-1}>›</button>

            {/* Close */}
            <button style={upStyles.lbClose} onClick={()=>setLightbox(null)}>✕</button>

            {/* Image */}
            <div style={upStyles.lbImgWrap}>
              {lightbox.thumb ? (
                <img src={lightbox.thumb} alt={lightbox.name}
                  style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:4}} />
              ) : (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  height:"100%",gap:12,color:"#666"}}>
                  <span style={{fontSize:64}}>{lightbox.type==="video"?"🎬":"🖼️"}</span>
                  <span style={{fontSize:13}}>{lightbox.name}</span>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div style={upStyles.lbInfo}>
              <div style={upStyles.lbTitle}>{lightbox.name}</div>
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <span style={{...upStyles.tagBadge,background:(tagColors[lightbox.tag]||"#888")+"20",color:tagColors[lightbox.tag]||"#888"}}>{lightbox.tag}</span>
                <span style={{fontSize:12,color:"#aaa"}}>{lightbox.size}</span>
                <span style={{fontSize:12,color:"#aaa"}}>{lightbox.date}</span>
              </div>

              <div style={upStyles.lbSection}>Baum</div>
              <div style={{fontSize:13,color:"#1D7A56",fontWeight:500,marginBottom:10}}>
                {(() => { const t=MOCK_DATA.trees.find(t=>t.id===lightbox.tree); return t ? `${t.name} (${t.id})` : lightbox.tree; })()}
              </div>

              {lightbox.drone && <>
                <div style={upStyles.lbSection}>Drohnen-Metadaten</div>
                <div style={upStyles.droneGrid}>
                  {[["Flughöhe",lightbox.drone.alt+" m"],
                    ["Geschw.",lightbox.drone.speed+" m/s"],
                    ["Thermal",lightbox.drone.thermal?"Ja":"Nein"]].map(([k,v])=>(
                    <div key={k} style={upStyles.droneCell}>
                      <div style={upStyles.droneCellKey}>{k}</div>
                      <div style={upStyles.droneCellVal}>{v}</div>
                    </div>
                  ))}
                </div>
                {lightbox.drone.ndvi != null && (
                  <div style={{marginTop:10}}>
                    <div style={upStyles.lbSection}>NDVI-Wert</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1,height:10,background:"#eee",borderRadius:5,overflow:"hidden"}}>
                        <div style={{width:`${lightbox.drone.ndvi*100}%`,height:"100%",
                          background:lightbox.drone.ndvi>0.7?"#2E7D52":lightbox.drone.ndvi>0.5?"#E6A817":"#B71C1C",
                          borderRadius:5}} />
                      </div>
                      <span style={{fontSize:15,fontWeight:700,
                        color:lightbox.drone.ndvi>0.7?"#2E7D52":lightbox.drone.ndvi>0.5?"#E6A817":"#B71C1C"}}>
                        {lightbox.drone.ndvi.toFixed(2)}
                      </span>
                    </div>
                    <div style={{fontSize:10,color:"#aaa",marginTop:4}}>
                      {lightbox.drone.ndvi>0.7?"Gesunde Vegetation":"Vitalität prüfen"}
                    </div>
                  </div>
                )}
              </>}

              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button style={upStyles.lbBtn}>⬇ Download</button>
                <button style={upStyles.lbBtnAlt}
                  onClick={()=>{setFiles(prev=>prev.filter(x=>x.id!==lightbox.id));setLightbox(null);}}>
                  Löschen
                </button>
              </div>

              {/* Counter */}
              <div style={{fontSize:11,color:"#aaa",marginTop:12,textAlign:"center"}}>
                {lightboxIndex+1} / {filtered.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const upStyles = {
  page:         {padding:"28px 32px",maxWidth:1200},
  header:       {display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},
  title:        {fontSize:26,fontWeight:700,color:"#1a1a18",margin:0,letterSpacing:"-0.4px"},
  sub:          {fontSize:14,color:"#888",marginTop:4},
  viewBtn:      {padding:"6px 13px",border:"1px solid #e0e0dc",background:"#fff",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",color:"#555"},
  viewBtnActive:{background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  dropZone:     {border:"2px dashed #ccc",borderRadius:12,padding:"32px",textAlign:"center",
                 background:"#fff",marginBottom:18,transition:"all 0.2s",cursor:"pointer"},
  dropZoneActive:{borderColor:"#1D7A56",background:"oklch(0.97 0.03 158)"},
  dropTitle:    {fontSize:15,fontWeight:600,color:"#333",marginBottom:5},
  dropSub:      {fontSize:12,color:"#aaa"},
  uploadBtn:    {padding:"9px 18px",background:"#1D7A56",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
  uploadBtnAlt: {padding:"9px 18px",background:"#EDF7F1",color:"#1D7A56",border:"1px solid #1D7A56",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
  filterBar:    {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8},
  chip:         {padding:"5px 12px",borderRadius:100,border:"1px solid #e0e0dc",background:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",color:"#555"},
  chipActive:   {background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  select:       {padding:"6px 12px",border:"1px solid #e0e0dc",borderRadius:8,fontSize:12,background:"#fff",color:"#555",outline:"none"},
  grid:         {display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:20},
  gridCard:     {background:"#fff",border:"1px solid #e5e5e0",borderRadius:10,overflow:"hidden",
                 cursor:"pointer",transition:"box-shadow 0.15s",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"},
  thumb:        {height:140,overflow:"hidden",position:"relative",background:"#f5f5f3"},
  droneBadge:   {position:"absolute",top:6,right:6,background:"rgba(21,101,160,0.85)",
                 color:"#fff",fontSize:11,padding:"2px 7px",borderRadius:100,backdropFilter:"blur(4px)"},
  playOverlay:  {position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                 background:"rgba(0,0,0,0.3)",color:"#fff",fontSize:28},
  gridInfo:     {padding:"10px 12px"},
  gridName:     {fontSize:12,fontWeight:600,color:"#1a1a18",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  tagBadge:     {display:"inline-block",padding:"3px 8px",borderRadius:100,fontSize:10,fontWeight:600},
  listCard:     {background:"#fff",border:"1px solid #e5e5e0",borderRadius:10,overflow:"auto",marginBottom:20},
  table:        {width:"100%",borderCollapse:"collapse"},
  th:           {textAlign:"left",fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.5px",
                 textTransform:"uppercase",padding:"12px 12px",borderBottom:"1px solid #e5e5e0",whiteSpace:"nowrap"},
  tr:           {borderBottom:"1px solid #f5f5f2"},
  td:           {padding:"10px 12px",fontSize:13,color:"#444",verticalAlign:"middle"},
  treeChip:     {fontSize:11,color:"#1D7A56",background:"#EDF7F1",padding:"2px 8px",borderRadius:4},
  iconBtn:      {background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"2px 5px",color:"#888",borderRadius:4},
  // Lightbox
  lbOverlay:    {position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:2000,
                 display:"flex",alignItems:"center",justifyContent:"center"},
  lbBox:        {background:"#fff",borderRadius:14,overflow:"hidden",width:"min(920px,95vw)",
                 maxHeight:"90vh",display:"flex",position:"relative",boxShadow:"0 40px 80px rgba(0,0,0,0.5)"},
  lbImgWrap:    {flex:1,background:"#111",display:"flex",alignItems:"center",justifyContent:"center",
                 minHeight:300,maxHeight:"90vh",overflow:"hidden"},
  lbInfo:       {width:260,minWidth:260,padding:"24px 20px",overflowY:"auto",background:"#fff",borderLeft:"1px solid #f0f0ee"},
  lbTitle:      {fontSize:14,fontWeight:700,color:"#1a1a18",lineHeight:1.4,marginBottom:10,wordBreak:"break-all"},
  lbSection:    {fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.8px",textTransform:"uppercase",
                 marginBottom:6,marginTop:0},
  lbClose:      {position:"absolute",top:12,right:12,width:32,height:32,borderRadius:"50%",
                 background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",cursor:"pointer",
                 fontSize:14,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"},
  lbArrow:      {position:"absolute",top:"50%",transform:"translateY(-50%)",width:40,height:40,
                 borderRadius:"50%",background:"rgba(0,0,0,0.4)",color:"#fff",border:"none",
                 cursor:"pointer",fontSize:22,zIndex:10,display:"flex",alignItems:"center",
                 justifyContent:"center",transition:"background 0.15s"},
  droneGrid:    {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:4},
  droneCell:    {background:"#f8f7f4",borderRadius:7,padding:"8px"},
  droneCellKey: {fontSize:9,color:"#aaa",fontWeight:600,textTransform:"uppercase"},
  droneCellVal: {fontSize:14,fontWeight:700,color:"#1a1a18",marginTop:3},
  lbBtn:        {flex:1,padding:"9px",background:"#1D7A56",color:"#fff",border:"none",
                 borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"},
  lbBtnAlt:     {flex:1,padding:"9px",background:"#FFEBEE",color:"#B71C1C",border:"none",
                 borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"},
};

Object.assign(window, { UploadView });
