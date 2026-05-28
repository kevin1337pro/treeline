function TeamView() {
  const { users, roleLabels } = MOCK_DATA;
  const [selected, setSelected] = React.useState(users[0]);
  const [showInvite, setShowInvite] = React.useState(false);
  const [invite, setInvite] = React.useState(createInviteForm());

  const roleColors = { admin:"#1D7A56", team:"#1565A0", certifier:"#6D4C41", client:"#888", single:"#555" };
  const roleDescriptions = {
    admin:    "Voller Zugriff auf alle Funktionen, Benutzerverwaltung, Systemkonfiguration.",
    team:     "Kann Bäume bearbeiten, Maßnahmen anlegen und bearbeiten. Eingeschränkte Benutzerverwaltung.",
    certifier:"Kann Bäume zertifizieren und VTA-Gutachten erstellen. Lesezugriff auf alle Daten.",
    client:   "Nur Lesezugriff auf zugewiesene Bäume und Maßnahmen. Keine Bearbeitungsrechte.",
    single:   "Zugriff nur auf eigene erfasste Bäume.",
  };

  const permissions = {
    admin:    { bäume:"Voll", maßnahmen:"Voll", zertifizierung:"Voll", team:"Voll", medien:"Voll", karte:"Voll" },
    team:     { bäume:"Voll", maßnahmen:"Voll", zertifizierung:"Lesen", team:"Lesen", medien:"Voll", karte:"Voll" },
    certifier:{ bäume:"Lesen", maßnahmen:"Lesen", zertifizierung:"Voll", team:"Lesen", medien:"Lesen", karte:"Voll" },
    client:   { bäume:"Lesen", maßnahmen:"Lesen", zertifizierung:"—", team:"—", medien:"Lesen", karte:"Lesen" },
    single:   { bäume:"Eigene", maßnahmen:"Eigene", zertifizierung:"—", team:"—", medien:"Eigene", karte:"Eigene" },
  };

  const permColor = { "Voll":"#EDF7F1", "Lesen":"#EEF4FB", "Eigene":"#FFF8E1", "—":"#F5F5F5" };
  const permText  = { "Voll":"#1D7A56", "Lesen":"#1565A0", "Eigene":"#E6A817", "—":"#bbb" };
  function createInviteForm() {
    return { name:"", email:"", role:"team", team:"Außendienst" };
  }
  function initialsForName(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "NU";
  }
  function nextUserId() {
    const max = users.reduce((n, u) => Math.max(n, Number((u.id || "").match(/\d+$/)?.[0] || 0)), 0);
    return `user-${String(max + 1).padStart(3,"0")}`;
  }
  function inviteUser() {
    if (!invite.name.trim() || !invite.email.trim()) return;
    const user = {
      id: nextUserId(),
      name: invite.name.trim(),
      email: invite.email.trim(),
      role: invite.role,
      initials: initialsForName(invite.name),
      team: invite.team,
    };
    users.push(user);
    window.TREELINE_DB?.save();
    setSelected(user);
    setInvite(createInviteForm());
    setShowInvite(false);
  }

  return (
    <div style={tmStyles.page}>
      <div style={tmStyles.header}>
        <div>
          <h1 style={tmStyles.title}>Team</h1>
          <p style={tmStyles.sub}>{users.length} Mitglieder · {users.filter(u=>u.role==="admin").length} Admins</p>
        </div>
        <button style={tmStyles.addBtn} onClick={() => setShowInvite(true)}>+ Einladen</button>
      </div>

      <div style={tmStyles.layout}>
        {/* User list */}
        <div style={tmStyles.userList}>
          {users.map(u => (
            <div key={u.id} onClick={() => setSelected(u)}
              style={{ ...tmStyles.userRow, ...(selected?.id===u.id ? tmStyles.userRowActive : {}) }}>
              <div style={{ ...tmStyles.avatar, background: roleColors[u.role] }}>{u.initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={tmStyles.userName}>{u.name}</div>
                <div style={tmStyles.userEmail}>{u.email}</div>
              </div>
              <span style={{ ...tmStyles.roleBadge, background: roleColors[u.role]+"18", color: roleColors[u.role] }}>
                {roleLabels[u.role]}
              </span>
            </div>
          ))}
        </div>

        {/* User detail */}
        {selected && (
          <div style={tmStyles.detail}>
            <div style={tmStyles.detailTop}>
              <div style={{ ...tmStyles.bigAvatar, background: roleColors[selected.role] }}>{selected.initials}</div>
              <div>
                <div style={tmStyles.detailName}>{selected.name}</div>
                <div style={tmStyles.detailEmail}>{selected.email}</div>
                <div style={tmStyles.detailTeam}>Team: {selected.team}</div>
              </div>
              <span style={{ ...tmStyles.roleBadgeLarge, background: roleColors[selected.role]+"18", color: roleColors[selected.role] }}>
                {roleLabels[selected.role]}
              </span>
            </div>

            <div style={tmStyles.section}>Rollenbeschreibung</div>
            <div style={tmStyles.desc}>{roleDescriptions[selected.role]}</div>

            <div style={tmStyles.section}>Berechtigungen</div>
            <div style={tmStyles.permGrid}>
              {Object.entries(permissions[selected.role] || {}).map(([area, level]) => (
                <div key={area} style={tmStyles.permCell}>
                  <div style={tmStyles.permArea}>{area.charAt(0).toUpperCase()+area.slice(1)}</div>
                  <div style={{ ...tmStyles.permLevel, background: permColor[level], color: permText[level] }}>
                    {level}
                  </div>
                </div>
              ))}
            </div>

            <div style={tmStyles.section}>Aktionen</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button style={tmStyles.actionBtn}>✏️ Rolle ändern</button>
              <button style={tmStyles.actionBtn}>📧 E-Mail senden</button>
              <button style={tmStyles.actionBtn}>🔑 Passwort zurücksetzen</button>
              {selected.role !== "admin" && (
                <button style={{ ...tmStyles.actionBtn, color:"#B71C1C", borderColor:"#FFCDD2", background:"#FFEBEE" }}>
                  🚫 Zugang sperren
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Role overview table */}
      <div style={tmStyles.card}>
        <div style={tmStyles.cardTitle}>Rollenübersicht & Berechtigungen</div>
        <table style={tmStyles.table}>
          <thead>
            <tr>
              <th style={tmStyles.th}>Bereich</th>
              {Object.entries(roleLabels).map(([k,v]) => (
                <th key={k} style={{ ...tmStyles.th, color: roleColors[k] }}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["bäume","maßnahmen","zertifizierung","team","medien","karte"].map(area => (
              <tr key={area} style={tmStyles.tr}>
                <td style={{ ...tmStyles.td, fontWeight:600, color:"#333" }}>{area.charAt(0).toUpperCase()+area.slice(1)}</td>
                {Object.keys(roleLabels).map(role => {
                  const level = (permissions[role]||{})[area] || "—";
                  return (
                    <td key={role} style={tmStyles.td}>
                      <span style={{ ...tmStyles.permLevel, background: permColor[level], color: permText[level] }}>
                        {level}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div style={tmStyles.overlay} onClick={() => setShowInvite(false)}>
          <div style={tmStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={tmStyles.modalTitle}>Nutzer einladen</div>
            {[["Name","text","Max Mustermann"],["E-Mail","email","m.mustermann@enbergs.de"]].map(([label,type,ph]) => (
              <div key={label} style={{ marginBottom:12 }}>
                <div style={tmStyles.formLabel}>{label}</div>
                <input type={type} style={tmStyles.formInput} placeholder={ph}
                  value={label === "Name" ? invite.name : invite.email}
                  onChange={e=>setInvite({...invite,[label === "Name" ? "name" : "email"]: e.target.value})} />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <div style={tmStyles.formLabel}>Rolle</div>
              <select style={tmStyles.formInput} value={invite.role}
                onChange={e=>setInvite({...invite,role:e.target.value})}>
                {Object.entries(roleLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={tmStyles.formLabel}>Team</div>
              <select style={tmStyles.formInput} value={invite.team}
                onChange={e=>setInvite({...invite,team:e.target.value})}>
                {["Außendienst","Gutachten","Leitung","Auftraggeber"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button style={tmStyles.cancelBtn} onClick={() => setShowInvite(false)}>Abbrechen</button>
              <button style={tmStyles.primaryBtn} onClick={inviteUser}
                disabled={!invite.name.trim() || !invite.email.trim()}>Einladung senden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tmStyles = {
  page:          { padding:"32px 36px", maxWidth:1200 },
  header:        { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 },
  title:         { fontSize:26, fontWeight:700, color:"#1a1a18", margin:0, letterSpacing:"-0.4px" },
  sub:           { fontSize:14, color:"#888", marginTop:4 },
  addBtn:        { padding:"9px 18px", background:"#1D7A56", color:"#fff", border:"none",
                   borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" },
  layout:        { display:"grid", gridTemplateColumns:"340px 1fr", gap:20, marginBottom:24 },
  userList:      { background:"#fff", border:"1px solid #e5e5e0", borderRadius:10, overflow:"hidden" },
  userRow:       { display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                   borderBottom:"1px solid #f5f5f2", cursor:"pointer", transition:"background 0.1s" },
  userRowActive: { background:"oklch(0.95 0.04 158)" },
  avatar:        { width:38, height:38, borderRadius:"50%", color:"#fff", display:"flex",
                   alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 },
  userName:      { fontSize:13, fontWeight:600, color:"#1a1a18" },
  userEmail:     { fontSize:11, color:"#aaa", marginTop:1 },
  roleBadge:     { padding:"3px 9px", borderRadius:100, fontSize:10, fontWeight:700, whiteSpace:"nowrap" },
  detail:        { background:"#fff", border:"1px solid #e5e5e0", borderRadius:10, padding:"24px" },
  detailTop:     { display:"flex", alignItems:"flex-start", gap:16, marginBottom:20,
                   paddingBottom:20, borderBottom:"1px solid #f0f0ee" },
  bigAvatar:     { width:56, height:56, borderRadius:"50%", color:"#fff", display:"flex",
                   alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, flexShrink:0 },
  detailName:    { fontSize:20, fontWeight:700, color:"#1a1a18", letterSpacing:"-0.3px" },
  detailEmail:   { fontSize:13, color:"#888", marginTop:3 },
  detailTeam:    { fontSize:12, color:"#aaa", marginTop:2 },
  roleBadgeLarge:{ padding:"5px 13px", borderRadius:100, fontSize:12, fontWeight:700, marginLeft:"auto" },
  section:       { fontSize:10, fontWeight:700, color:"#aaa", letterSpacing:"0.8px",
                   textTransform:"uppercase", marginTop:20, marginBottom:10 },
  desc:          { fontSize:13, color:"#555", lineHeight:1.7, background:"#f8f7f4",
                   padding:"12px", borderRadius:8 },
  permGrid:      { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 },
  permCell:      { background:"#f8f7f4", borderRadius:8, padding:"10px 12px" },
  permArea:      { fontSize:11, color:"#888", fontWeight:600 },
  permLevel:     { display:"inline-block", marginTop:4, padding:"3px 10px", borderRadius:100,
                   fontSize:12, fontWeight:700 },
  actionBtn:     { padding:"8px 14px", background:"#f5f5f3", border:"1px solid #e0e0dc",
                   borderRadius:7, fontSize:12, fontWeight:500, cursor:"pointer", color:"#444" },
  card:          { background:"#fff", border:"1px solid #e5e5e0", borderRadius:10, padding:"22px" },
  cardTitle:     { fontSize:14, fontWeight:700, color:"#1a1a18", marginBottom:16 },
  table:         { width:"100%", borderCollapse:"collapse" },
  th:            { textAlign:"left", fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.5px",
                   textTransform:"uppercase", padding:"0 12px 10px 0", borderBottom:"1px solid #e5e5e0" },
  tr:            { borderBottom:"1px solid #f5f5f2" },
  td:            { padding:"10px 12px 10px 0", fontSize:13, verticalAlign:"middle" },
  overlay:       { position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000,
                   display:"flex", alignItems:"center", justifyContent:"center" },
  modal:         { background:"#fff", borderRadius:12, padding:"28px", width:420,
                   boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle:    { fontSize:18, fontWeight:700, color:"#1a1a18", marginBottom:20 },
  formLabel:     { fontSize:12, fontWeight:600, color:"#555", marginBottom:5 },
  formInput:     { width:"100%", padding:"9px 12px", border:"1px solid #ddd", borderRadius:7,
                   fontSize:13, outline:"none", boxSizing:"border-box" },
  primaryBtn:    { padding:"10px 20px", background:"#1D7A56", color:"#fff", border:"none",
                   borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" },
  cancelBtn:     { padding:"10px 20px", background:"#f5f5f3", color:"#555", border:"none",
                   borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" },
};

Object.assign(window, { TeamView });
