function Login({ onLogin }) {
  const [profileId, setProfileId] = React.useState("user-001");

  const roleProfiles = [
    { id:"user-001", role:"admin",     name:"Mara Esche",   email:"office@example.invalid",   initials:"ME", team:"Geschäftsführung",
      color:"#1D7A56", desc:"Voller Zugriff" },
    { id:"user-002", role:"team",      name:"Joris Bach",        email:"field@example.invalid",     initials:"JB", team:"Außendienst",
      color:"#1565A0", desc:"Bäume & Maßnahmen" },
    { id:"user-003", role:"certifier", name:"Alva Stein",    email:"inspection@example.invalid",  initials:"AS", team:"Gutachten",
      color:"#6D4C41", desc:"Zertifizierung" },
    { id:"user-006", role:"client",    name:"Stadt Beispielstadt", email:"client@example.invalid", initials:"GE", team:"Auftraggeber",
      color:"#555",    desc:"Nur Lesezugriff" },
  ];

  function handleLogin() {
    onLogin({ ...selected });
  }

  const selected = MOCK_DATA.users.find(r => r.id === profileId) || roleProfiles[0];

  return (
    <div style={loginStyles.wrap}>
      {/* Left: branding */}
      <div className="login-brand" style={loginStyles.left}>
        <div style={loginStyles.leftInner}>
          <BrandLogo variant="dark" className="login-brand-logo"/>
          <div style={loginStyles.tagline}>Baummanagement & Dokumentation</div>
          <div style={loginStyles.vision}>
            "Bäume sind wichtig – und so behandeln wir sie. Jede Entscheidung in Pflege, Planung und Fällung wird nachvollziehbar."
          </div>
          <div style={loginStyles.statsRow}>
            {[[MOCK_DATA.trees.length,"Bäume erfasst"],[MOCK_DATA.measures.filter(item => item.status === "geplant").length,"Maßnahmen geplant"],[MOCK_DATA.users.length,"Beispielprofile"]].map(([n,l]) => (
              <div key={l} style={loginStyles.stat}>
                <div style={loginStyles.statN}>{n}</div>
                <div style={loginStyles.statL}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="login-form-panel" style={loginStyles.right}>
        <div style={loginStyles.form}>
          <BrandLogo variant="stacked" className="login-mobile-logo"/>
          <div style={loginStyles.formTitle}>Anmelden</div>
          <div style={loginStyles.formSub}>Wähle dein Profil für diese Demo-Session</div>

          {/* Role picker */}
          <div style={loginStyles.roleGrid}>
            {roleProfiles.map(r => (
              <button type="button" key={r.role} onClick={() => setProfileId(r.id)}
                style={{ ...loginStyles.roleCard, ...(selected.id===r.id ? { ...loginStyles.roleCardActive, borderColor: r.color } : {}) }}>
                <div style={{ ...loginStyles.roleAvatar, background: r.color }}>{r.initials}</div>
                <div style={loginStyles.roleName}>{r.name}</div>
                <div style={loginStyles.roleDesc}>{r.desc}</div>
                {selected.id===r.id && <div style={{ ...loginStyles.roleCheck, color: r.color }}>✓</div>}
              </button>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={loginStyles.label} htmlFor="demo-profile">Beispielprofil</label>
            <select id="demo-profile" style={loginStyles.input} value={selected.id} onChange={event => setProfileId(event.target.value)}>
              {MOCK_DATA.users.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </div>

          <button style={{ ...loginStyles.loginBtn, background: selected?.color || "#1D7A56" }}
            onClick={handleLogin}>
            {`Als ${selected?.name?.split(" ")[0]} anmelden →`}
          </button>

          <div style={loginStyles.hint}>Beispielprofile · Keine echte Anmeldung · Einsatzpläne werden lokal gespeichert</div>
          <a className="dp-button" href="?betrieb=1">Zum Betriebszugang</a>
        </div>
      </div>
    </div>
  );
}

const loginStyles = {
  wrap:        { display:"flex", minHeight:"100vh", fontFamily:"inherit" },
  left:        { flex:"0 0 42%", background:"#18271e", display:"flex", alignItems:"center", justifyContent:"center",
                 padding:"48px" },
  leftInner:   { maxWidth:340 },
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
