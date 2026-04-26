function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = React.useState("admin");
  const [email, setEmail] = React.useState("m.enbergs@enbergs.de");
  const [pw, setPw] = React.useState("••••••••");
  const [loading, setLoading] = React.useState(false);

  const roleProfiles = [
    { role:"admin",     name:"Markus Enbergs",   email:"m.enbergs@enbergs.de",   initials:"ME", team:"Geschäftsführung",
      color:"#1D7A56", desc:"Voller Zugriff" },
    { role:"team",      name:"Jan Becker",        email:"j.becker@enbergs.de",     initials:"JB", team:"Außendienst",
      color:"#1565A0", desc:"Bäume & Maßnahmen" },
    { role:"certifier", name:"Anna Schneider",    email:"a.schneider@enbergs.de",  initials:"AS", team:"Gutachten",
      color:"#6D4C41", desc:"Zertifizierung" },
    { role:"client",    name:"Stadt Gelsenkirchen", email:"kontakt@gelsenkirchen.de", initials:"GE", team:"Auftraggeber",
      color:"#555",    desc:"Nur Lesezugriff" },
  ];

  function handleLogin() {
    setLoading(true);
    const profile = roleProfiles.find(r => r.role === selectedRole);
    setTimeout(() => {
      onLogin({ ...profile, id: "user-001" });
    }, 900);
  }

  const selected = roleProfiles.find(r => r.role === selectedRole);

  return (
    <div style={loginStyles.wrap}>
      {/* Left: branding */}
      <div style={loginStyles.left}>
        <div style={loginStyles.leftInner}>
          <img src="uploads/logo-1776797212104.png" alt="Enbergs" style={loginStyles.logo} />
          <div style={loginStyles.brand}>treeline</div>
          <div style={loginStyles.tagline}>Baummanagement & Dokumentation</div>
          <div style={loginStyles.vision}>
            "Bäume sind wichtig – und so behandeln wir sie. Jede Entscheidung in Pflege, Planung und Fällung wird nachvollziehbar."
          </div>
          <div style={loginStyles.statsRow}>
            {[["7","Bäume erfasst"],["6","Maßnahmen geplant"],["5","Nutzer aktiv"]].map(([n,l]) => (
              <div key={l} style={loginStyles.stat}>
                <div style={loginStyles.statN}>{n}</div>
                <div style={loginStyles.statL}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div style={loginStyles.right}>
        <div style={loginStyles.form}>
          <div style={loginStyles.formTitle}>Anmelden</div>
          <div style={loginStyles.formSub}>Wähle dein Profil für diese Demo-Session</div>

          {/* Role picker */}
          <div style={loginStyles.roleGrid}>
            {roleProfiles.map(r => (
              <div key={r.role} onClick={() => { setSelectedRole(r.role); setEmail(r.email); }}
                style={{ ...loginStyles.roleCard, ...(selectedRole===r.role ? { ...loginStyles.roleCardActive, borderColor: r.color } : {}) }}>
                <div style={{ ...loginStyles.roleAvatar, background: r.color }}>{r.initials}</div>
                <div style={loginStyles.roleName}>{r.name}</div>
                <div style={loginStyles.roleDesc}>{r.desc}</div>
                {selectedRole===r.role && <div style={{ ...loginStyles.roleCheck, color: r.color }}>✓</div>}
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={loginStyles.label}>E-Mail</label>
            <input style={loginStyles.input} value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={loginStyles.label}>Passwort</label>
            <input style={loginStyles.input} type="password" value={pw} onChange={e=>setPw(e.target.value)} />
          </div>

          <button style={{ ...loginStyles.loginBtn, background: selected?.color || "#1D7A56" }}
            onClick={handleLogin} disabled={loading}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span style={loginStyles.spinner} /> Anmelden…
              </span>
            ) : `Als ${selected?.name?.split(" ")[0]} anmelden →`}
          </button>

          <div style={loginStyles.hint}>🔒 Demo-Modus · Keine echten Daten werden gespeichert</div>
        </div>
      </div>
    </div>
  );
}

const loginStyles = {
  wrap:        { display:"flex", minHeight:"100vh", fontFamily:"inherit" },
  left:        { flex:"0 0 42%", background:"#1a2e1f", display:"flex", alignItems:"center", justifyContent:"center",
                 padding:"48px" },
  leftInner:   { maxWidth:340 },
  logo:        { width:56, height:56, objectFit:"contain", marginBottom:16 },
  brand:       { fontSize:38, fontWeight:800, color:"#fff", letterSpacing:"-1px", lineHeight:1 },
  tagline:     { fontSize:14, color:"rgba(255,255,255,0.55)", marginTop:6, marginBottom:24 },
  vision:      { fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.7, fontStyle:"italic",
                 borderLeft:"3px solid #1D7A56", paddingLeft:14, marginBottom:32 },
  statsRow:    { display:"flex", gap:24 },
  stat:        { textAlign:"center" },
  statN:       { fontSize:28, fontWeight:700, color:"#4CAF8A" },
  statL:       { fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:2, textTransform:"uppercase",
                 letterSpacing:"0.5px" },
  right:       { flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                 background:"#f8f7f4", padding:"48px 32px" },
  form:        { width:"100%", maxWidth:440 },
  formTitle:   { fontSize:26, fontWeight:700, color:"#1a1a18", letterSpacing:"-0.4px", marginBottom:4 },
  formSub:     { fontSize:14, color:"#888", marginBottom:24 },
  roleGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 },
  roleCard:    { background:"#fff", border:"2px solid #e5e5e0", borderRadius:10, padding:"14px 12px",
                 cursor:"pointer", position:"relative", transition:"all 0.15s", textAlign:"center" },
  roleCardActive:{ background:"#f8fff8" },
  roleAvatar:  { width:36, height:36, borderRadius:"50%", color:"#fff", display:"flex",
                 alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
                 margin:"0 auto 8px" },
  roleName:    { fontSize:12, fontWeight:600, color:"#1a1a18", lineHeight:1.3 },
  roleDesc:    { fontSize:10, color:"#aaa", marginTop:3 },
  roleCheck:   { position:"absolute", top:8, right:10, fontSize:14, fontWeight:700 },
  label:       { display:"block", fontSize:12, fontWeight:600, color:"#555", marginBottom:5 },
  input:       { width:"100%", padding:"10px 14px", border:"1px solid #ddd", borderRadius:8,
                 fontSize:14, outline:"none", background:"#fff", boxSizing:"border-box" },
  loginBtn:    { width:"100%", padding:"13px", color:"#fff", border:"none", borderRadius:9,
                 fontSize:15, fontWeight:700, cursor:"pointer", transition:"opacity 0.15s",
                 letterSpacing:"-0.2px" },
  hint:        { textAlign:"center", fontSize:11, color:"#bbb", marginTop:14 },
  spinner:     { display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.3)",
                 borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
};

// Add spin animation
const spinStyle = document.createElement("style");
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

Object.assign(window, { Login });
