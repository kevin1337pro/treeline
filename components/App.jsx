function App() {
  const savedPage = localStorage.getItem("treeline_nav") || "login";
  const savedTree = localStorage.getItem("treeline_selectedTree") || null;
  const savedUser = (() => { try { return JSON.parse(localStorage.getItem("treeline_user")); } catch(e){return null;} })();

  const [loggedIn, setLoggedIn] = React.useState(!!savedUser);
  const [currentUser, setCurrentUser] = React.useState(savedUser || null);
  const [page, setPage] = React.useState(savedUser ? (savedPage === "login" ? "dashboard" : savedPage) : "login");
  const [selectedTreeId, setSelectedTreeId] = React.useState(savedTree);
  const [tweaksVisible, setTweaksVisible] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => { localStorage.setItem("treeline_nav", page); }, [page]);
  React.useEffect(() => { if (selectedTreeId) localStorage.setItem("treeline_selectedTree", selectedTreeId); }, [selectedTreeId]);

  React.useEffect(() => {
    window.addEventListener("message", e => {
      if (e.data?.type === "__activate_edit_mode")   setTweaksVisible(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksVisible(false);
    });
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
  }, []);

  function applyTweak(key, val) {
    const next = { ...tweaks, [key]: val };
    setTweaks(next);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*");
  }

  function handleLogin(user) {
    setCurrentUser(user);
    // Inject into mock data
    MOCK_DATA.currentUser = user;
    setLoggedIn(true);
    setPage("dashboard");
    localStorage.setItem("treeline_user", JSON.stringify(user));
  }

  function handleLogout() {
    setLoggedIn(false);
    setCurrentUser(null);
    setPage("login");
    localStorage.removeItem("treeline_user");
    localStorage.removeItem("treeline_nav");
  }

  function handleNav(id) {
    setPage(id);
    if (id === "trees" && !selectedTreeId) setSelectedTreeId(MOCK_DATA.trees[0]?.id);
  }

  function handleSelectTree(id) {
    setSelectedTreeId(id);
    setPage("trees");
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const pageTitle = {
    dashboard:"Übersicht", map:"Karte", trees:"Bäume",
    measures:"Maßnahmen", pflanzung:"Neupflanzungen", team:"Team", upload:"Medien",
  };

  const user = currentUser || MOCK_DATA.currentUser;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background: tweaks.bgColor, fontFamily: tweaks.font }}>
      <Sidebar active={page} onNav={handleNav} currentUser={user} onLogout={handleLogout}
        collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      <div style={{ marginLeft: sidebarOpen ? 220 : 56, flex:1, display:"flex", flexDirection:"column",
        minHeight:"100vh", transition:"margin-left 0.2s" }}>
        {/* Top bar */}
        <div style={appStyles.topBar}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button style={appStyles.menuBtn} onClick={() => setSidebarOpen(o => !o)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={appStyles.topTitle}>{pageTitle[page]}</div>
          </div>
          <div style={appStyles.topRight}>
            <div style={appStyles.searchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input style={appStyles.searchInput} placeholder="Global suchen…" />
            </div>
            <div style={appStyles.notifBtn} title="Benachrichtigungen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={appStyles.notifDot} />
            </div>
            <button style={appStyles.logoutBtn} onClick={handleLogout} title="Abmelden">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY: page==="map"||page==="trees"||page==="pflanzung" ? "hidden" : "auto" }}>
          {page==="dashboard" && <Dashboard onNav={handleNav} onSelectTree={handleSelectTree}/>}
          {page==="map"       && <MapView onSelectTree={handleSelectTree}/>}
          {page==="trees"     && <TreesView selectedTreeId={selectedTreeId} onSelectTree={setSelectedTreeId}/>}
          {page==="measures"  && <MassnahmenView/>}
          {page==="pflanzung" && <PflanzungView/>}
          {page==="team"      && <TeamView/>}
          {page==="upload"    && <UploadView/>}
        </div>
      </div>

      {/* Tweaks panel */}
      {tweaksVisible && (
        <div style={appStyles.tweaksPanel}>
          <div style={appStyles.tweaksTitle}>Tweaks</div>
          <div style={appStyles.tweakGroup}>Primärfarbe</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["#1D7A56","#1565A0","#6D4C41","#4A148C","#BF360C"].map(c=>(
              <div key={c} onClick={()=>applyTweak("primaryColor",c)}
                style={{...appStyles.colorSwatch,background:c,outline:tweaks.primaryColor===c?"3px solid #333":"none"}}/>
            ))}
          </div>
          <div style={appStyles.tweakGroup}>Hintergrund</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["#f8f7f4","#f0f4f0","#f4f0f7","#f5f5f5","#fff"].map(c=>(
              <div key={c} onClick={()=>applyTweak("bgColor",c)}
                style={{...appStyles.colorSwatch,background:c,border:"1px solid #ccc",outline:tweaks.bgColor===c?"3px solid #333":"none"}}/>
            ))}
          </div>
          <div style={appStyles.tweakGroup}>Schrift</div>
          {[["-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif","System"],
            ["'Inter', sans-serif","Inter"],["Georgia, serif","Georgia"]].map(([val,label])=>(
            <button key={label} onClick={()=>applyTweak("font",val)}
              style={{...appStyles.tweakBtn,...(tweaks.font===val?appStyles.tweakBtnActive:{})}}>{label}</button>
          ))}
          <div style={appStyles.tweakGroup}>Sidebar</div>
          <button style={appStyles.tweakBtn} onClick={()=>setSidebarOpen(o=>!o)}>
            {sidebarOpen?"Einklappen":"Ausklappen"}
          </button>
        </div>
      )}
    </div>
  );
}

const appStyles = {
  topBar:      {display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"0 20px",height:52,background:"#fff",
                borderBottom:"1px solid #e5e5e0",flexShrink:0},
  topTitle:    {fontSize:15,fontWeight:700,color:"#1a1a18"},
  topRight:    {display:"flex",alignItems:"center",gap:10},
  menuBtn:     {width:34,height:34,borderRadius:7,border:"none",background:"#f5f5f3",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#666"},
  searchWrap:  {display:"flex",alignItems:"center",gap:8,background:"#f5f5f3",
                borderRadius:8,padding:"6px 12px"},
  searchInput: {border:"none",background:"none",outline:"none",fontSize:13,width:180,color:"#333"},
  notifBtn:    {position:"relative",width:34,height:34,borderRadius:7,background:"#f5f5f3",
                display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},
  notifDot:    {position:"absolute",top:7,right:7,width:7,height:7,
                borderRadius:"50%",background:"#B71C1C",border:"1.5px solid #fff"},
  logoutBtn:   {width:34,height:34,borderRadius:7,border:"none",background:"#f5f5f3",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#888"},
  tweaksPanel: {position:"fixed",right:0,top:0,bottom:0,width:210,background:"#fff",
                borderLeft:"1px solid #e5e5e0",padding:"18px 14px",zIndex:200,
                overflowY:"auto",display:"flex",flexDirection:"column",gap:7},
  tweaksTitle: {fontSize:14,fontWeight:700,color:"#1a1a18",marginBottom:6},
  tweakGroup:  {fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.8px",
                textTransform:"uppercase",marginTop:10},
  colorSwatch: {width:24,height:24,borderRadius:5,cursor:"pointer"},
  tweakBtn:    {padding:"7px 10px",border:"1px solid #e0e0dc",borderRadius:7,
                background:"#fff",fontSize:12,cursor:"pointer",textAlign:"left",color:"#555"},
  tweakBtnActive:{background:"#EDF7F1",borderColor:"#1D7A56",color:"#1D7A56",fontWeight:700},
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
