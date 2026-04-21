function Dashboard({ onNav, onSelectTree }) {
  const { trees, measures, users, statusColors, measureTypes } = MOCK_DATA;

  const statusCount = { gut:0, mittel:0, schlecht:0, kritisch:0 };
  trees.forEach(t => statusCount[t.status]++);
  const certified    = trees.filter(t => t.certified).length;
  const openMeasures = measures.filter(m => m.status !== "abgeschlossen").length;
  const criticalTrees = trees.filter(t => t.status === "kritisch" || t.status === "schlecht");

  const recentMeasures = [...measures].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  const statusLabel = { gut:"Gut", mittel:"Mittel", schlecht:"Schlecht", kritisch:"Kritisch" };

  // Mini donut SVG
  function DonutChart({ data }) {
    const total = data.reduce((s,d) => s+d.value, 0);
    if (!total) return null;
    let cum = 0;
    const r = 40, cx = 50, cy = 50, stroke = 18;
    const circumference = 2 * Math.PI * r;
    const segments = data.map(d => {
      const pct = d.value / total;
      const offset = circumference * (1 - cum);
      cum += pct;
      return { ...d, pct, offset, dash: circumference * pct };
    });
    return (
      <svg width="100" height="100" viewBox="0 0 100 100">
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={s.offset}
            transform="rotate(-90 50 50)" />
        ))}
        <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a18">{total}</text>
      </svg>
    );
  }

  // Mini bar SVG
  function BarChart({ data, height = 60 }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const w = 100 / data.length;
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * 24} ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 16);
          return (
            <g key={i}>
              <rect x={i*24+2} y={height-16-barH} width={20} height={barH}
                fill={d.color || "#1D7A56"} rx="3" />
              <text x={i*24+12} y={height-2} textAnchor="middle" fontSize="8" fill="#aaa">{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Trend line SVG
  function SparkLine({ data, color = "#1D7A56" }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 120, h = 36;
    const pts = data.map((v, i) => `${(i / (data.length-1)) * w},${h - (v/max)*h}`).join(" ");
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.1" />
      </svg>
    );
  }

  const donutData = Object.entries(statusCount).map(([k,v]) => ({ color: statusColors[k], value: v }));

  const monthlyMeasures = [3,5,4,7,6,8].map((v, i) => ({
    value: v, label: ["Nov","Dez","Jan","Feb","Mär","Apr"][i], color: "#1D7A56"
  }));

  const mtypeSummary = Object.entries(measureTypes).slice(0,6).map(([k,v]) => ({
    label: v.label.split(" ")[0], value: measures.filter(m=>m.type===k).length, color: v.color
  })).filter(d => d.value > 0);

  return (
    <div style={dbStyles.page}>
      <div style={dbStyles.header}>
        <div>
          <h1 style={dbStyles.title}>Übersicht</h1>
          <p style={dbStyles.sub}>Willkommen, {MOCK_DATA.currentUser.name.split(" ")[0]} · {new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <button style={dbStyles.addBtn} onClick={() => onNav("trees")}>+ Neuer Baum</button>
      </div>

      {/* KPI row */}
      <div style={dbStyles.statGrid}>
        {[
          { label:"Bäume gesamt", value:trees.length, sub:"erfasst", color:"#1D7A56", spark:[4,5,5,6,6,7] },
          { label:"Zertifiziert",  value:certified,    sub:`${Math.round(certified/trees.length*100)}% zertifiziert`, color:"#1565A0", spark:[2,2,3,4,4,5] },
          { label:"Offene Maßnahmen", value:openMeasures, sub:"aktive Aufgaben", color:"#E6A817", spark:[5,4,6,5,4,5] },
          { label:"Kritisch",     value:criticalTrees.length, sub:"Handlungsbedarf", color:"#B71C1C", spark:[1,2,1,2,1,2] },
        ].map((s,i) => (
          <div key={i} style={dbStyles.statCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{...dbStyles.statValue, color:s.color}}>{s.value}</div>
                <div style={dbStyles.statLabel}>{s.label}</div>
                <div style={dbStyles.statSub}>{s.sub}</div>
              </div>
              <SparkLine data={s.spark} color={s.color} />
            </div>
          </div>
        ))}
      </div>

      <div style={dbStyles.row3}>
        {/* Status Donut */}
        <div style={dbStyles.card}>
          <div style={dbStyles.cardTitle}>Baumstatus</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <DonutChart data={donutData} />
            <div style={{flex:1}}>
              {Object.entries(statusCount).map(([st,count]) => (
                <div key={st} style={dbStyles.barRow}>
                  <span style={{...dbStyles.dot,background:statusColors[st]}}/>
                  <span style={dbStyles.barLbl}>{statusLabel[st]}</span>
                  <div style={dbStyles.barTrack}>
                    <div style={{...dbStyles.barFill, width:`${trees.length?(count/trees.length)*100:0}%`, background:statusColors[st]}}/>
                  </div>
                  <span style={dbStyles.barN}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly bar */}
        <div style={dbStyles.card}>
          <div style={dbStyles.cardTitle}>Maßnahmen / Monat</div>
          <div style={{marginTop:8}}>
            <BarChart data={monthlyMeasures} height={72} />
          </div>
          <div style={{fontSize:11,color:"#aaa",marginTop:6}}>Letzten 6 Monate</div>
        </div>

        {/* Maßnahmen nach Typ */}
        <div style={dbStyles.card}>
          <div style={dbStyles.cardTitle}>Maßnahmentypen</div>
          {mtypeSummary.map(d => (
            <div key={d.label} style={dbStyles.barRow}>
              <span style={{...dbStyles.dot,background:d.color}}/>
              <span style={{...dbStyles.barLbl,width:80}}>{d.label}</span>
              <div style={dbStyles.barTrack}>
                <div style={{...dbStyles.barFill, width:`${(d.value/measures.length)*100}%`, background:d.color}}/>
              </div>
              <span style={dbStyles.barN}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={dbStyles.twoCol}>
        {/* Handlungsbedarf */}
        <div style={dbStyles.card}>
          <div style={dbStyles.cardTitle}>⚠️ Handlungsbedarf</div>
          {criticalTrees.length === 0 && <div style={dbStyles.empty}>Keine kritischen Bäume</div>}
          {criticalTrees.map(t => (
            <div key={t.id} style={dbStyles.alertRow}
              onClick={() => { onNav("trees"); onSelectTree(t.id); }}>
              <div style={{...dbStyles.alertDot, background:statusColors[t.status]}}/>
              <div style={{flex:1}}>
                <div style={dbStyles.alertName}>{t.name} <span style={dbStyles.alertId}>{t.id}</span></div>
                <div style={dbStyles.alertNote}>{t.standort}</div>
              </div>
              <div style={{...dbStyles.badge,background:statusColors[t.status]+"20",color:statusColors[t.status]}}>
                {statusLabel[t.status]}
              </div>
            </div>
          ))}
        </div>

        {/* Team-Auslastung */}
        <div style={dbStyles.card}>
          <div style={dbStyles.cardTitle}>Team-Auslastung</div>
          {users.filter(u=>u.role!=="client").map(u => {
            const assigned = measures.filter(m => m.assignedTo===u.id && m.status!=="abgeschlossen").length;
            const max = 5;
            return (
              <div key={u.id} style={dbStyles.barRow}>
                <div style={{...dbStyles.userMini,background:u.role==="admin"?"#1D7A56":u.role==="certifier"?"#6D4C41":"#1565A0"}}>
                  {u.initials}
                </div>
                <span style={{...dbStyles.barLbl,width:80,fontSize:11}}>{u.name.split(" ")[0]}</span>
                <div style={dbStyles.barTrack}>
                  <div style={{...dbStyles.barFill,width:`${Math.min((assigned/max)*100,100)}%`,background:assigned>3?"#B71C1C":"#1D7A56"}}/>
                </div>
                <span style={dbStyles.barN}>{assigned}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maßnahmentabelle */}
      <div style={dbStyles.card}>
        <div style={{...dbStyles.cardTitle,marginBottom:14}}>Anstehende Maßnahmen</div>
        <table style={dbStyles.table}>
          <thead>
            <tr>{["Maßnahme","Baum","Typ","Fällig","Status","Priorität"].map(h=>(
              <th key={h} style={dbStyles.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {recentMeasures.map(m => {
              const tree = trees.find(t=>t.id===m.treeId);
              const mt = measureTypes[m.type]||{};
              const stStyle={geplant:{bg:"#EDF7F1",c:"#1D7A56"},in_arbeit:{bg:"#FFF8E1",c:"#E6A817"},abgeschlossen:{bg:"#F0F0F0",c:"#777"}}[m.status]||{};
              const prStyle={kritisch:{bg:"#FFEBEE",c:"#B71C1C"},hoch:{bg:"#FFF3E0",c:"#E65100"},mittel:{bg:"#E8F5E9",c:"#2E7D52"},niedrig:{bg:"#F5F5F5",c:"#777"}}[m.priority]||{};
              return (
                <tr key={m.id} style={dbStyles.tr}>
                  <td style={dbStyles.td}><span style={dbStyles.tdMain}>{m.title}</span></td>
                  <td style={dbStyles.td}><span style={dbStyles.treeChip}>{tree?tree.name:m.treeId}</span></td>
                  <td style={dbStyles.td}><span style={{...dbStyles.badge,background:(mt.color||"#888")+"20",color:mt.color||"#888"}}>{mt.label||m.type}</span></td>
                  <td style={dbStyles.td}>{m.date}</td>
                  <td style={dbStyles.td}><span style={{...dbStyles.badge,background:stStyle.bg,color:stStyle.c}}>{{geplant:"Geplant",in_arbeit:"In Arbeit",abgeschlossen:"Abgeschlossen"}[m.status]}</span></td>
                  <td style={dbStyles.td}><span style={{...dbStyles.badge,background:prStyle.bg,color:prStyle.c}}>{m.priority}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const dbStyles = {
  page:      { padding:"32px 36px", maxWidth:1280 },
  header:    { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 },
  title:     { fontSize:26, fontWeight:700, color:"#1a1a18", margin:0, letterSpacing:"-0.4px" },
  sub:       { fontSize:14, color:"#888", marginTop:4 },
  addBtn:    { padding:"9px 18px", background:"#1D7A56", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" },
  statGrid:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 },
  statCard:  { background:"#fff", border:"1px solid #e5e5e0", borderRadius:10, padding:"18px 20px" },
  statValue: { fontSize:34, fontWeight:800, letterSpacing:"-1px", lineHeight:1 },
  statLabel: { fontSize:13, fontWeight:600, color:"#333", marginTop:6 },
  statSub:   { fontSize:11, color:"#aaa", marginTop:2 },
  row3:      { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 },
  twoCol:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 },
  card:      { background:"#fff", border:"1px solid #e5e5e0", borderRadius:10, padding:"18px 20px", marginBottom:0 },
  cardTitle: { fontSize:13, fontWeight:700, color:"#1a1a18", marginBottom:12 },
  barRow:    { display:"flex", alignItems:"center", gap:8, marginBottom:9 },
  dot:       { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  barLbl:    { fontSize:12, color:"#555", width:52 },
  barTrack:  { flex:1, height:7, background:"#f0f0ee", borderRadius:4, overflow:"hidden" },
  barFill:   { height:"100%", borderRadius:4, transition:"width 0.5s" },
  barN:      { width:18, fontSize:12, fontWeight:700, color:"#333", textAlign:"right" },
  userMini:  { width:24, height:24, borderRadius:"50%", color:"#fff", fontSize:9, fontWeight:700,
               display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  alertRow:  { display:"flex", alignItems:"center", gap:12, padding:"10px 0",
               borderBottom:"1px solid #f0f0ee", cursor:"pointer" },
  alertDot:  { width:10, height:10, borderRadius:"50%", flexShrink:0 },
  alertName: { fontSize:13, fontWeight:600, color:"#1a1a18" },
  alertId:   { fontSize:11, color:"#aaa", fontWeight:400, marginLeft:4 },
  alertNote: { fontSize:12, color:"#888", marginTop:2 },
  empty:     { fontSize:13, color:"#aaa", padding:"16px 0" },
  badge:     { display:"inline-block", padding:"3px 9px", borderRadius:100, fontSize:11, fontWeight:600 },
  table:     { width:"100%", borderCollapse:"collapse" },
  th:        { textAlign:"left", fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.5px",
               textTransform:"uppercase", padding:"0 12px 10px 0", borderBottom:"1px solid #e5e5e0" },
  tr:        { borderBottom:"1px solid #f5f5f2" },
  td:        { padding:"11px 12px 11px 0", fontSize:13, color:"#444", verticalAlign:"middle" },
  tdMain:    { fontWeight:500, color:"#1a1a18" },
  treeChip:  { fontSize:12, color:"#1D7A56", background:"#EDF7F1", padding:"2px 8px", borderRadius:4 },
};

Object.assign(window, { Dashboard });
