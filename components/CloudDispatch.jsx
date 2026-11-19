const cloudMessage = err => err.code || (err.name !== "TypeError" && err.name !== "AbortError") ? err.message : "Keine Verbindung zum Einsatzdienst. Bitte Verbindung prüfen.";
function CloudWorkplace({ user, onExit, onDenied }) {
  const isOffice = user.role === "office";
  const params = new URLSearchParams(location.search);
  const fixed = Dispatch.validDate(params.get("date") || "") ? params.get("date") : null;
  const [date, setDate] = React.useState(fixed || Dispatch.localDate(isOffice ? 1 : 0));
  const [officeBoard, setOfficeBoard] = React.useState(false);
  const [section, setSection] = React.useState("plan");
  const action = user.role === "display" || officeBoard ? "board" : isOffice ? "office" : "inbox";
  const key = action + ":" + date;
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [retry, setRetry] = React.useState(0);
  const refresh = React.useRef(null);
  React.useEffect(() => {
    if (section !== "plan") return;
    let live = true, sequence = 0;
    async function fetchPlan() {
      const tick = ++sequence;
      try {
        const data = await CloudDispatchAPI.run(action, { date });
        if (live && tick === sequence) { setResult({ key, data }); setError(""); }
      } catch (err) {
        if (!live || tick !== sequence) return;
        if (err.code === 401 || err.code === 403) { onDenied(err); return; }
        setError(cloudMessage(err));
      }
    }
    refresh.current = fetchPlan;
    setError(""); fetchPlan();
    const visible = () => { if (!document.hidden) fetchPlan(); };
    const timer = setInterval(visible, 20000);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    window.addEventListener("online", visible);
    return () => { live = false; clearInterval(timer); document.removeEventListener("visibilitychange", visible); window.removeEventListener("focus", visible); window.removeEventListener("online", visible); };
  }, [key, retry, section]);
  const data = result?.key === key ? result.data : null;
  const days = {};
  if (data?.day) days[date] = data.day;
  if (data?.release) days[date] = { releases: [data.release] };
  for (const m of data?.messages || []) if (!days[m.date] || m.revision > Dispatch.latest(days[m.date]).revision) days[m.date] = { releases: [m] };
  const staff = data?.staff || [];
  const catalog = { ...MOCK_DATA, users: staff, orders: MOCK_DATA.orders.map(o => ({ ...o, crewIds: (o.crewIds || []).filter(id => staff.some(p => p.id === id)) })) };
  async function write(method, args) {
    try { await CloudDispatchAPI.run(method, args); }
    finally { await refresh.current?.(); }
  }
  const repo = {
    saveDraft(date, draft, version) {
      const resources = {};
      for (const [key, field] of [["vehicles", "vehicleIds"], ["equipment", "equipmentIds"], ["orders", "orderId"]]) {
        const used = new Set(draft.entries.flatMap(e => e[field]));
        resources[key] = catalog[key].filter(r => used.has(r.id)).map(r => ({ id: r.id, name: r.name || r.title, ...(r.plate ? { plate: r.plate } : {}) }));
      }
      return write("draft", { date, version, note: draft.note, entries: draft.entries, resources });
    },
    publish: (date, version) => write("publish", { date, version }),
    markRead: (_, id) => write("confirm", { id }),
  };
  const value = { state: { days, receipts: data?.receipts || {} }, date, setDate, error, loading: !data, messages: data?.messages || [], catalog, repo };
  return <DispatchCloud.Provider value={value}><div className="dp-cloud-shell">
    <header className="dp-cloud-header"><BrandLogo variant="stacked"/><span>{user.name}</span><button className="dp-button" onClick={onExit}>Abmelden</button></header>
    {user.role !== "display" && <nav className="tf-nav" aria-label="Betriebsbereiche">{[["plan",isOffice ? "Einsatzplanung" : "Postfach",isOffice ? "CalendarDays" : "Inbox"],["community","Teamfunk","MessagesSquare"],["trees","Bäume","TreePine"]].map(([id,label,icon]) => <button key={id} aria-current={id === section ? "page" : undefined} onClick={() => setSection(id)}><DispatchIcon name={icon}/>{label}</button>)}</nav>}
    {section === "community" ? <TeamFeed user={user} run={CloudDispatchAPI.run} onDenied={onDenied}/> : section === "trees" ? <WorkTrees run={CloudDispatchAPI.run} onDenied={onDenied}/> : !data ? <main className="dp-page"><p role={error ? "alert" : "status"}>{error || "Einsatzdaten werden geladen …"}</p>{error && <button className="dp-button" onClick={() => setRetry(v => v + 1)}>Erneut versuchen</button>}</main> :
      action === "board" ? <DispatchBoard initialDate={officeBoard ? date : fixed} onBack={officeBoard ? () => setOfficeBoard(false) : onExit}/> :
      isOffice ? <DispatchView currentUser={{ ...user, role: "admin" }} onBoard={() => setOfficeBoard(true)}/> : <DispatchInbox currentUser={user}/>}
  </div></DispatchCloud.Provider>;
}

function CloudDispatchApp() {
  const [user, setUser] = React.useState(null);
  const [session, setSession] = React.useState(false);
  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState("");
  async function identify() {
    setSession(true);
    const profile = await CloudDispatchAPI.run("profile");
    setUser(profile);
  }
  React.useEffect(() => {
    (async () => { try { await CloudDispatchAPI.account(); await identify(); } catch (e) { if (e.code !== 401) setError(cloudMessage(e)); } finally { setBusy(false); } })();
  }, []);
  async function logout() {
    setUser(null); setBusy(true); setError("");
    try { await CloudDispatchAPI.logout(); setSession(false); }
    catch (e) { setError("Abmeldung nicht abgeschlossen. Bitte erneut versuchen."); }
    finally { setBusy(false); }
  }
  if (user) return <CloudWorkplace user={user} onExit={logout} onDenied={err => { setUser(null); setSession(err.code !== 401); setError(cloudMessage(err)); }}/>;
  return <main className="dp-cloud-login dp-page"><BrandLogo variant="stacked"/><h1>Betriebszugang</h1>
    <form className="dp-form-body" onSubmit={async event => {
      event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
      setBusy(true); setError("");
      try { if (!session) { await CloudDispatchAPI.login(values.get("email").trim(), values.get("password")); form.reset(); } await identify(); }
      catch (e) { setError(cloudMessage(e)); } finally { setBusy(false); }
    }}>
      {!session && <React.Fragment><label>E-Mail<input type="email" autoComplete="username" name="email" required/></label><label>Passwort<input type="password" name="password" autoComplete="current-password" required/></label></React.Fragment>}
      {error && <p role="alert" className="dp-error">{error}</p>}
      <button type="submit" disabled={busy} className="dp-button dp-primary">{busy ? "Verbindung wird geprüft …" : session ? "Zugang erneut prüfen" : "Mit Betriebskonto anmelden"}</button>
      {session && <button type="button" className="dp-button" disabled={busy} onClick={logout}>Abmelden</button>}
    </form><a href="treeline.html">Zur lokalen Demo</a></main>;
}
