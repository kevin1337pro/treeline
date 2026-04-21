// Calendar helper
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function CalendarView({ measures, trees, measureTypes }) {
  const today = new Date();
  const [cur, setCur] = React.useState({ year: today.getFullYear(), month: today.getMonth() });
  const monthNames = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const dayNames   = ["So","Mo","Di","Mi","Do","Fr","Sa"];

  const daysInMonth  = getDaysInMonth(cur.year, cur.month);
  const firstDay     = getFirstDayOfMonth(cur.year, cur.month);

  // Index measures by date
  const measuresByDate = {};
  measures.forEach(m => {
    const d = m.date;
    if (!measuresByDate[d]) measuresByDate[d] = [];
    measuresByDate[d].push(m);
  });

  function prevMonth() {
    setCur(c => c.month === 0 ? {year:c.year-1,month:11} : {year:c.year,month:c.month-1});
  }
  function nextMonth() {
    setCur(c => c.month === 11 ? {year:c.year+1,month:0} : {year:c.year,month:c.month+1});
  }

  const cells = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const stColors = { geplant:"#1D7A56", in_arbeit:"#E6A817", abgeschlossen:"#aaa" };

  return (
    <div style={calStyles.wrap}>
      <div style={calStyles.header}>
        <button style={calStyles.navBtn} onClick={prevMonth}>←</button>
        <span style={calStyles.monthTitle}>{monthNames[cur.month]} {cur.year}</span>
        <button style={calStyles.navBtn} onClick={nextMonth}>→</button>
        <button style={calStyles.todayBtn} onClick={()=>setCur({year:today.getFullYear(),month:today.getMonth()})}>
          Heute
        </button>
      </div>
      <div style={calStyles.grid}>
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
          <div key={d} style={calStyles.dayHeader}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${cur.year}-${String(cur.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayMeasures = measuresByDate[dateStr] || [];
          const isToday = today.getFullYear()===cur.year && today.getMonth()===cur.month && today.getDate()===day;
          return (
            <div key={day} style={{...calStyles.cell, ...(isToday?calStyles.cellToday:{})}}>
              <div style={{...calStyles.dayNum, ...(isToday?calStyles.dayNumToday:{})}}>{day}</div>
              {dayMeasures.slice(0,3).map(m => {
                const mt = measureTypes[m.type] || {};
                return (
                  <div key={m.id} style={{...calStyles.event, background:(mt.color||stColors[m.status]||"#888")+"22",
                    borderLeft:`2px solid ${mt.color||stColors[m.status]||"#888"}`}}>
                    <span style={{color:mt.color||"#555",fontSize:10,fontWeight:600,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {m.title}
                    </span>
                  </div>
                );
              })}
              {dayMeasures.length > 3 && (
                <div style={calStyles.more}>+{dayMeasures.length-3} weitere</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const calStyles = {
  wrap:       { background:"#fff", borderRadius:10, border:"1px solid #e5e5e0", overflow:"hidden" },
  header:     { display:"flex", alignItems:"center", gap:10, padding:"16px 20px",
                borderBottom:"1px solid #e5e5e0" },
  monthTitle: { fontSize:16, fontWeight:700, color:"#1a1a18", flex:1 },
  navBtn:     { padding:"5px 12px", border:"1px solid #e0e0dc", borderRadius:7, background:"#fff",
                cursor:"pointer", fontSize:14, color:"#555" },
  todayBtn:   { padding:"5px 12px", border:"1px solid #e0e0dc", borderRadius:7, background:"#f5f5f3",
                cursor:"pointer", fontSize:12, color:"#555", fontWeight:500 },
  grid:       { display:"grid", gridTemplateColumns:"repeat(7,1fr)",
                borderTop:"1px solid #f0f0ee" },
  dayHeader:  { padding:"8px 0", textAlign:"center", fontSize:11, fontWeight:700,
                color:"#aaa", letterSpacing:"0.3px", borderBottom:"1px solid #f0f0ee" },
  cell:       { minHeight:90, padding:"6px", borderRight:"1px solid #f5f5f2",
                borderBottom:"1px solid #f5f5f2", verticalAlign:"top" },
  cellToday:  { background:"oklch(0.97 0.03 158)" },
  dayNum:     { fontSize:12, fontWeight:600, color:"#888", marginBottom:4 },
  dayNumToday:{ color:"#1D7A56", background:"#1D7A56", color:"#fff",
                width:20, height:20, borderRadius:"50%", display:"flex",
                alignItems:"center", justifyContent:"center", fontSize:11 },
  event:      { padding:"2px 5px", borderRadius:3, marginBottom:2, fontSize:10,
                display:"flex", alignItems:"center", overflow:"hidden" },
  more:       { fontSize:10, color:"#aaa", marginTop:2 },
};

function MassnahmenView() {
  const { measures, trees, users, measureTypes } = MOCK_DATA;
  const [filter, setFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [view, setView] = React.useState("kanban");
  const [showModal, setShowModal] = React.useState(false);

  const statusCols = [
    { id:"geplant",       label:"Geplant",       color:"#1D7A56" },
    { id:"in_arbeit",     label:"In Arbeit",     color:"#E6A817" },
    { id:"abgeschlossen", label:"Abgeschlossen", color:"#aaa" },
  ];
  const priColors = {
    kritisch:{ bg:"#FFEBEE", c:"#B71C1C" },
    hoch:    { bg:"#FFF3E0", c:"#E65100" },
    mittel:  { bg:"#E8F5E9", c:"#2E7D52" },
    niedrig: { bg:"#F5F5F5", c:"#777" },
  };

  const filtered = measures.filter(m =>
    (filter==="all" || m.status===filter) &&
    (typeFilter==="all" || m.type===typeFilter)
  );

  function getTree(id) { return trees.find(t=>t.id===id); }
  function getUser(id) { return users.find(u=>u.id===id); }

  function MeasureCard({ m }) {
    const tree = getTree(m.treeId);
    const user = getUser(m.assignedTo);
    const mt = measureTypes[m.type]||{};
    const pri = priColors[m.priority]||{};
    return (
      <div style={msStyles.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <span style={{...msStyles.typeBadge,background:(mt.color||"#888")+"20",color:mt.color||"#888"}}>{mt.label||m.type}</span>
          <span style={{...msStyles.priBadge,background:pri.bg,color:pri.c}}>{m.priority}</span>
        </div>
        <div style={msStyles.cardTitle}>{m.title}</div>
        {tree && <div style={msStyles.treeRef}><span style={msStyles.treeRefDot}/>{tree.name} · <span style={{color:"#aaa"}}>{m.treeId}</span></div>}
        {m.notes && <div style={msStyles.cardNotes}>{m.notes}</div>}
        <div style={msStyles.cardFooter}>
          <span style={msStyles.dateChip}>📅 {m.date}</span>
          {m.cost && <span style={msStyles.costChip}>💶 {m.cost.toLocaleString("de")} €</span>}
          {user && <span style={msStyles.avatarChip} title={user.name}>{user.initials}</span>}
        </div>
      </div>
    );
  }

  function TableRow({ m }) {
    const tree = getTree(m.treeId);
    const user = getUser(m.assignedTo);
    const mt = measureTypes[m.type]||{};
    const pri = priColors[m.priority]||{};
    const stCol={geplant:"#1D7A56",in_arbeit:"#E6A817",abgeschlossen:"#aaa"};
    const stBg ={geplant:"#EDF7F1",in_arbeit:"#FFF8E1",abgeschlossen:"#F5F5F5"};
    const stLabel={geplant:"Geplant",in_arbeit:"In Arbeit",abgeschlossen:"Abgeschlossen"};
    return (
      <tr style={msStyles.tr}>
        <td style={msStyles.td}><span style={msStyles.cardTitle}>{m.title}</span></td>
        <td style={msStyles.td}>{tree?<span style={msStyles.treeChip}>{tree.name}</span>:m.treeId}</td>
        <td style={msStyles.td}><span style={{...msStyles.typeBadge,background:(mt.color||"#888")+"20",color:mt.color||"#888"}}>{mt.label||m.type}</span></td>
        <td style={msStyles.td}>{m.date}</td>
        <td style={msStyles.td}><span style={{...msStyles.priBadge,background:pri.bg,color:pri.c}}>{m.priority}</span></td>
        <td style={msStyles.td}><span style={{...msStyles.priBadge,background:stBg[m.status],color:stCol[m.status]}}>{stLabel[m.status]}</span></td>
        <td style={msStyles.td}>{user?<span style={msStyles.avatarChip}>{user.initials}</span>:"—"}</td>
        <td style={msStyles.td}>{m.cost?m.cost.toLocaleString("de")+" €":"—"}</td>
      </tr>
    );
  }

  return (
    <div style={msStyles.page}>
      <div style={msStyles.header}>
        <div>
          <h1 style={msStyles.title}>Maßnahmen</h1>
          <p style={msStyles.sub}>{filtered.length} Maßnahmen · {measures.filter(m=>m.status==="in_arbeit").length} in Arbeit</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[["kanban","⬜ Kanban"],["table","☰ Tabelle"],["calendar","📅 Kalender"]].map(([id,label])=>(
            <button key={id} onClick={()=>setView(id)}
              style={{...msStyles.viewBtn,...(view===id?msStyles.viewBtnActive:{})}}>{label}</button>
          ))}
          <button style={msStyles.addBtn} onClick={()=>setShowModal(true)}>+ Neue Maßnahme</button>
        </div>
      </div>

      {view !== "calendar" && (
        <div style={msStyles.filterBar}>
          <div style={{display:"flex",gap:6}}>
            {[["all","Alle Status"],["geplant","Geplant"],["in_arbeit","In Arbeit"],["abgeschlossen","Abgeschlossen"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)}
                style={{...msStyles.filterChip,...(filter===v?msStyles.filterChipActive:{})}}>{l}</button>
            ))}
          </div>
          <select style={msStyles.select} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="all">Alle Typen</option>
            {Object.entries(measureTypes).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}

      {view === "kanban" && (
        <div style={msStyles.kanban}>
          {statusCols.map(col => {
            const items = filtered.filter(m=>m.status===col.id);
            return (
              <div key={col.id} style={msStyles.kanbanCol}>
                <div style={{...msStyles.colHeader,borderTopColor:col.color}}>
                  <span style={{fontWeight:700,color:col.color}}>{col.label}</span>
                  <span style={{...msStyles.colCount,background:col.color+"20",color:col.color}}>{items.length}</span>
                </div>
                <div style={msStyles.colBody}>
                  {items.map(m=><MeasureCard key={m.id} m={m}/>)}
                  {items.length===0 && <div style={msStyles.colEmpty}>Keine Maßnahmen</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <div style={msStyles.tableWrap}>
          <table style={msStyles.table}>
            <thead><tr>{["Titel","Baum","Typ","Datum","Priorität","Status","Zuständig","Kosten"].map(h=>(
              <th key={h} style={msStyles.th}>{h}</th>
            ))}</tr></thead>
            <tbody>{filtered.map(m=><TableRow key={m.id} m={m}/>)}</tbody>
          </table>
        </div>
      )}

      {view === "calendar" && (
        <CalendarView measures={measures} trees={trees} measureTypes={measureTypes} />
      )}

      {showModal && (
        <div style={msStyles.overlay} onClick={()=>setShowModal(false)}>
          <div style={msStyles.modal} onClick={e=>e.stopPropagation()}>
            <div style={msStyles.modalTitle}>Neue Maßnahme</div>
            <div style={msStyles.formLabel}>Titel</div>
            <input style={msStyles.formInput} placeholder="z.B. Kronenpflege Eiche TRE-2024-001" />
            <div style={msStyles.formLabel}>Maßnahmentyp</div>
            <select style={msStyles.formInput}>
              {Object.entries(measureTypes).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <div style={msStyles.formLabel}>Baum</div>
            <select style={msStyles.formInput}>
              {trees.map(t=><option key={t.id} value={t.id}>{t.id} – {t.name}</option>)}
            </select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <div style={msStyles.formLabel}>Priorität</div>
                <select style={msStyles.formInput}><option>kritisch</option><option>hoch</option><option>mittel</option><option>niedrig</option></select>
              </div>
              <div>
                <div style={msStyles.formLabel}>Datum</div>
                <input type="date" style={msStyles.formInput}/>
              </div>
            </div>
            <div style={msStyles.formLabel}>Notizen</div>
            <textarea style={{...msStyles.formInput,minHeight:72,resize:"vertical"}} placeholder="Beschreibung…"/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
              <button style={msStyles.cancelBtn} onClick={()=>setShowModal(false)}>Abbrechen</button>
              <button style={msStyles.primaryBtn} onClick={()=>setShowModal(false)}>Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const msStyles = {
  page:{padding:"32px 36px",maxWidth:1300},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},
  title:{fontSize:26,fontWeight:700,color:"#1a1a18",margin:0,letterSpacing:"-0.4px"},
  sub:{fontSize:14,color:"#888",marginTop:4},
  viewBtn:{padding:"7px 13px",border:"1px solid #e0e0dc",background:"#fff",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",color:"#555"},
  viewBtnActive:{background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  addBtn:{padding:"8px 18px",background:"#1D7A56",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
  filterBar:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8},
  filterChip:{padding:"6px 14px",borderRadius:100,border:"1px solid #e0e0dc",background:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",color:"#555"},
  filterChipActive:{background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
  select:{padding:"7px 12px",border:"1px solid #e0e0dc",borderRadius:8,fontSize:12,background:"#fff",color:"#555",outline:"none"},
  kanban:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,alignItems:"start"},
  kanbanCol:{background:"#f8f7f4",borderRadius:10,overflow:"hidden"},
  colHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderTop:"3px solid",background:"#fff",borderBottom:"1px solid #e5e5e0"},
  colCount:{padding:"2px 8px",borderRadius:100,fontSize:11,fontWeight:700},
  colBody:{padding:"12px",display:"flex",flexDirection:"column",gap:10,minHeight:80},
  colEmpty:{fontSize:12,color:"#bbb",textAlign:"center",padding:"16px 0"},
  card:{background:"#fff",border:"1px solid #e5e5e0",borderRadius:9,padding:"14px"},
  cardTitle:{fontSize:13,fontWeight:600,color:"#1a1a18",lineHeight:1.4,marginBottom:6},
  typeBadge:{display:"inline-block",padding:"3px 8px",borderRadius:100,fontSize:11,fontWeight:600},
  priBadge:{display:"inline-block",padding:"3px 8px",borderRadius:100,fontSize:11,fontWeight:600},
  treeRef:{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#1D7A56",marginBottom:6},
  treeRefDot:{width:6,height:6,borderRadius:"50%",background:"#1D7A56",flexShrink:0},
  cardNotes:{fontSize:11,color:"#888",lineHeight:1.5,marginBottom:8},
  cardFooter:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"},
  dateChip:{fontSize:11,color:"#aaa"},
  costChip:{fontSize:11,color:"#aaa"},
  avatarChip:{width:22,height:22,borderRadius:"50%",background:"#1D7A56",color:"#fff",fontSize:9,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",marginLeft:"auto"},
  tableWrap:{background:"#fff",borderRadius:10,border:"1px solid #e5e5e0",overflow:"auto"},
  table:{width:"100%",borderCollapse:"collapse"},
  th:{textAlign:"left",fontSize:11,fontWeight:700,color:"#aaa",letterSpacing:"0.5px",textTransform:"uppercase",padding:"12px 16px",borderBottom:"1px solid #e5e5e0",whiteSpace:"nowrap"},
  tr:{borderBottom:"1px solid #f5f5f2"},
  td:{padding:"12px 16px",fontSize:13,color:"#444",verticalAlign:"middle"},
  treeChip:{fontSize:11,color:"#1D7A56",background:"#EDF7F1",padding:"2px 8px",borderRadius:4},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"},
  modal:{background:"#fff",borderRadius:12,padding:"28px",width:460,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",gap:8},
  modalTitle:{fontSize:18,fontWeight:700,color:"#1a1a18",marginBottom:12},
  formLabel:{fontSize:12,fontWeight:600,color:"#555",marginTop:4},
  formInput:{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box",marginTop:4},
  primaryBtn:{padding:"10px 20px",background:"#1D7A56",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
  cancelBtn:{padding:"10px 20px",background:"#f5f5f3",color:"#555",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"},
};

Object.assign(window, { MassnahmenView });
