function Sidebar({ active, onNav, currentUser, onLogout, collapsed, onToggle }) {
  const navItems = [
    { id:"dashboard", label:"Übersicht",     icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { id:"orders",    label:"Aufträge",       icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg> },
    { id:"map",       label:"Karte",          icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg> },
    { id:"trees",     label:"Bäume",          icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-7"/><path d="M5 12H3l9-9 9 9h-2"/><path d="M5 17H3l9-9 9 9h-2"/></svg> },
    { id:"measures",  label:"Maßnahmen",      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg> },
    { id:"pflanzung", label:"Neupflanzungen", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12"/><path d="M5 12c0-4.4 3.1-8 7-8s7 3.6 7 8"/><path d="M5 12H3"/><path d="M21 12h-2"/></svg> },
    { id:"team",      label:"Team",           icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id:"upload",    label:"Medien",         icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
  ];

  const roleColors = { admin:"#1D7A56", team:"#1565A0", certifier:"#6D4C41", client:"#555", single:"#555" };
  const roleLabels = MOCK_DATA.roleLabels;

  return (
    <aside className={`sidebar-desktop ${collapsed ? "sidebar-collapsed" : "sidebar-open"}`} style={{
      width: collapsed ? 56 : 220, minWidth: collapsed ? 56 : 220,
      background:"#fff", borderRight:"1px solid #e5e5e0",
      display:"flex", flexDirection:"column", height:"100vh",
      position:"fixed", left:0, top:0, zIndex:100,
      transition:"width 0.2s, min-width 0.2s", overflow:"hidden"
    }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding: collapsed ? "16px 0" : "16px 14px",
        borderBottom:"1px solid #e5e5e0", justifyContent: collapsed ? "center" : "flex-start" }}>
        <img src="uploads/logo-1776797212104.png" alt="Enbergs" style={{width:34,height:34,objectFit:"contain",flexShrink:0}} />
        {!collapsed && (
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"#1D7A56",letterSpacing:"-0.3px",lineHeight:1.1}}>treeline</div>
            <div style={{fontSize:9,color:"#aaa",letterSpacing:"0.2px"}}>Baummanagement</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{padding:"10px 6px",display:"flex",flexDirection:"column",gap:2}}>
        {!collapsed && <div style={{fontSize:10,fontWeight:600,color:"#aaa",letterSpacing:"0.8px",textTransform:"uppercase",padding:"6px 8px 4px"}}>Menü</div>}
        {navItems.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            title={collapsed ? item.label : ""}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding: collapsed ? "10px 0" : "9px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius:7, border:"none",
              background: active===item.id ? "oklch(0.95 0.04 158)" : "none",
              cursor:"pointer", color: active===item.id ? "#1D7A56" : "#4a4a46",
              fontSize:14, fontWeight: active===item.id ? 600 : 500, width:"100%",
              transition:"all 0.15s"
            }}>
            <span style={{color: active===item.id ? "#1D7A56" : "#aaa", display:"flex", alignItems:"center", flexShrink:0}}>
              {item.icon}
            </span>
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      <div style={{flex:1}}/>

      {/* User */}
      {!collapsed ? (
        <div style={{margin:"0 8px 12px",padding:"10px 12px",borderRadius:8,background:"#f8f7f4",
          display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:roleColors[currentUser?.role]||"#1D7A56",
            color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>
            {currentUser?.initials}
          </div>
          <div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:11,fontWeight:600,color:"#1a1a18",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {currentUser?.name}
            </div>
            <div style={{fontSize:10,color:roleColors[currentUser?.role]||"#888",marginTop:1}}>
              {roleLabels[currentUser?.role]}
            </div>
          </div>
        </div>
      ) : (
        <div style={{display:"flex",justifyContent:"center",paddingBottom:12}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:roleColors[currentUser?.role]||"#1D7A56",
            color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>
            {currentUser?.initials}
          </div>
        </div>
      )}
    </aside>
  );
}

Object.assign(window, { Sidebar });
