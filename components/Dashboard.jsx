function Dashboard({ currentUser, onNav, onSelectTree, onOpenDispatch, onOpenOrderMap }) {
  const [today, setToday] = React.useState(() => DashboardData.today());
  const [dayOffset, setDayOffset] = React.useState(0);
  const [months, setMonths] = React.useState(6);
  const [measureFilter, setMeasureFilter] = React.useState("open");
  const [query, setQuery] = React.useState("");
  const { state, error: dispatchError } = useDispatchStore();
  React.useEffect(() => {
    const refresh = () => setToday(DashboardData.today());
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const { trees = [], measures = [], users = [], statusColors = {}, measureTypes = {} } = MOCK_DATA;
  const summary = DashboardData.summarize(MOCK_DATA, today);
  const user = currentUser || MOCK_DATA.currentUser;
  const office = user.role === "admin", client = user.role === "client";
  const date = DashboardData.addDays(today, dayOffset);
  const day = state.days[date], published = Dispatch.latest(day);
  const release = office || published?.recipients.includes(user.id) ? published : null;
  const isDraft = office && day && Dispatch.dirty(day);
  const schedule = isDraft ? dispatchDraftRows(day.entries) : (release?.rows || []).filter(row => office || row.employeeIds.includes(user.id));
  const monthly = DashboardData.monthly(measures, today, months);
  const chartMax = Math.max(1, ...monthly.map(item => item.total));
  const chartTotal = monthly.reduce((total, item) => total + item.total, 0);
  const statusLabels = { gut: "Gut", mittel: "Mittel", schlecht: "Schlecht", kritisch: "Kritisch", unbekannt: "Nicht erfasst" };
  const colors = { ...statusColors, unbekannt: "#8a969c" };
  const statuses = Object.entries(summary.statusCounts).filter(([key, count]) => key !== "unbekannt" || count > 0);
  let position = 0;
  const segments = statuses.filter(([, count]) => count > 0).map(([key, count]) => {
    const start = position;
    position += count / Math.max(trees.length, 1) * 100;
    return `${colors[key]} ${start}% ${position}%`;
  });
  const filtered = ({ open: summary.openMeasures, overdue: summary.overdue, week: summary.nextWeek })[measureFilter].filter(item => Dispatch.matchesSearch(item, query));
  const names = ids => ids.map(id => users.find(item => item.id === id)?.name || "Nicht zugeordnet").join(", ");
  const stateLabel = { geplant: "Geplant", in_arbeit: "In Arbeit", abgeschlossen: "Abgeschlossen" };
  function openPlanning() { if (office) onOpenDispatch(date); else onNav("inbox"); }

  return <main className="dashboard-page">
    <header className="db-header">
      <div><h1>Übersicht</h1><p>Willkommen, {user.name.split(" ")[0]} · {DashboardData.dateLabel(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
      <div className="db-actions">
        <button className="db-button" onClick={() => onNav("map")}><DispatchIcon name="MapPin"/>Karte öffnen</button>
        {!client && <button className="db-button db-primary" onClick={openPlanning}><DispatchIcon name={office ? "CalendarDays" : "Inbox"}/>{office ? "Einsatzplanung öffnen" : "Mein Postfach"}</button>}
      </div>
    </header>

    <section className="db-stats" aria-label="Kennzahlen">
      {[
        { label: "Bäume gesamt", value: trees.length, sub: `${summary.certified} zertifiziert`, icon: "TreePine", tone: "green", page: "trees" },
        { label: "Offene Aufträge", value: summary.openOrders.length, sub: `${summary.openOrders.filter(order => order.status === "in_arbeit").length} in Arbeit`, icon: "ClipboardList", tone: "blue", page: "orders" },
        { label: "Offene Maßnahmen", value: summary.openMeasures.length, sub: `${summary.overdue.length} überfällig`, icon: "CalendarDays", tone: "amber", page: "measures" },
        { label: "Bäume mit Handlungsbedarf", value: summary.criticalTrees.length, sub: `${summary.statusCounts.kritisch} kritisch · ${summary.statusCounts.schlecht} schlecht`, icon: "TriangleAlert", tone: "red", page: "trees" },
      ].map(item => <button key={item.label} className={`db-stat db-${item.tone}`} onClick={() => onNav(item.page)}>
        <span className="db-stat-top"><strong>{item.value}</strong><DispatchIcon name={item.icon} size={21}/></span>
        <span className="db-stat-label">{item.label}</span><span className="db-muted">{item.sub}</span>
      </button>)}
    </section>

    <div className={`db-split db-operations ${client ? "db-single" : ""}`}>
      {!client && <section className="db-section" aria-labelledby="db-schedule-heading">
        <div className="db-section-heading"><div><h2 id="db-schedule-heading">{office ? "Einsätze" : "Meine Einsätze"}</h2><p>{DashboardData.dateLabel(date, { weekday: "short", day: "2-digit", month: "long" })} · Lokale Planung</p></div>
          <div className="db-segmented" role="group" aria-label="Einsatztag">{["Heute", "Morgen"].map((label, index) => <button key={label} aria-pressed={dayOffset === index} onClick={() => setDayOffset(index)}>{label}</button>)}</div>
        </div>
        {dispatchError ? <p className="db-error" role="alert">{dispatchError}</p> : <React.Fragment>
          <div className="db-schedule-meta"><span>{schedule.length} Einsätze · {new Set(schedule.flatMap(row => row.employeeIds)).size} Mitarbeiter</span><span className={`db-badge ${isDraft ? "db-amber" : "db-green"}`}>{isDraft ? "Entwurf" : release ? `Freigegeben · V${release.revision}` : "Keine Freigabe"}</span></div>
          {schedule.length ? <ul className="db-schedule">{schedule.slice(0, 3).map(row => <li key={row.id}>
            <div className="db-time"><strong>{row.start}</strong><span>{row.end}</span></div>
            <div><strong>{row.site}</strong><p>{row.address || "Adresse offen"}</p><p>{row.employees?.map(item => item.name).join(", ") || names(row.employeeIds)}</p><small>{[...(row.vehicles || []), ...(row.equipment || [])].map(item => item.name).join(" · ") || "Keine Fahrzeuge eingeplant"}</small></div>
            {row.orderId && <button className="db-icon" aria-label={`Auftragskarte: ${row.site}`} title="Auftragskarte öffnen" onClick={() => onOpenOrderMap(row.orderId)}><DispatchIcon name="MapPin"/></button>}
          </li>)}</ul> : <div className="db-empty"><DispatchIcon name="CalendarDays" size={26}/><strong>{office ? "Noch keine Einsätze geplant" : "Kein freigegebener Einsatz zugeteilt"}</strong></div>}
          {(isDraft ? day.note : release?.note) && <p className="db-day-note">{isDraft ? day.note : release.note}</p>}
          <button className="db-link" onClick={openPlanning}>{office ? "Tagesplanung öffnen" : "Postfach öffnen"}{schedule.length > 3 ? ` (${schedule.length})` : ""}<DispatchIcon name="ArrowRight" size={16}/></button>
        </React.Fragment>}
      </section>}

      <section className="db-section" aria-labelledby="db-alert-heading">
        <div className="db-section-heading"><div><h2 id="db-alert-heading">Handlungsbedarf</h2><p>{summary.criticalTrees.length} Bäume mit auffälligem Zustand</p></div><DispatchIcon name="TriangleAlert" size={21}/></div>
        {summary.criticalTrees.length ? <ul className="db-alerts">{summary.criticalTrees.slice(0, 3).map(tree => <li key={tree.id}><button onClick={() => onSelectTree(tree.id)}>
          <span className="db-alert-copy"><strong>{tree.name}</strong><small>{tree.id}</small><span>{tree.standort || "Standort offen"}</span></span>
          <span className={`db-badge ${tree.status === "kritisch" ? "db-red" : "db-amber"}`}>{statusLabels[tree.status]}</span>
        </button></li>)}</ul> : <p className="db-empty">Keine kritischen oder schlechten Baumzustände erfasst.</p>}
        {!!summary.overdue.length && <button className="db-overdue" onClick={() => { setMeasureFilter("overdue"); setQuery(""); document.getElementById("db-measures-heading")?.focus(); }}><DispatchIcon name="CalendarDays" size={18}/><span>{summary.overdue.length} {summary.overdue.length === 1 ? "überfällige Maßnahme" : "überfällige Maßnahmen"}</span><DispatchIcon name="ArrowRight" size={16}/></button>}
        {summary.criticalTrees.length > 3 && <button className="db-link" onClick={() => onNav("trees")}>Alle Bäume öffnen<DispatchIcon name="ArrowRight" size={16}/></button>}
      </section>
    </div>

    <div className="db-split db-analytics">
      <section className="db-section" aria-labelledby="db-monthly-heading">
        <div className="db-section-heading"><div><h2 id="db-monthly-heading">Maßnahmen / Monat</h2><p>Nach Fälligkeit · {chartTotal} im Zeitraum</p></div>
          <label className="db-period">Zeitraum<span className="db-select"><select aria-label="Diagrammzeitraum" value={months} onChange={event => setMonths(Number(event.target.value))}>{[3, 6, 12].map(value => <option key={value} value={value}>{value} Monate</option>)}</select><DispatchIcon name="ChevronDown" size={16}/></span></label>
        </div>
        <figure>
          <div className="db-chart-scroll" tabIndex={0} aria-label="Monatsdiagramm">
            <ol className="db-chart" style={{ gridTemplateColumns: `repeat(${months}, minmax(36px, 1fr))`, minWidth: months * 44 }}>
              {monthly.map(item => <li key={item.key} role="img" aria-label={`${DashboardData.dateLabel(`${item.key}-01`, { month: "long", year: "numeric" })}: ${item.open} offen, ${item.done} abgeschlossen`} title={`${item.open} offen · ${item.done} abgeschlossen`}>
                <strong className="db-chart-count">{item.total}</strong>
                <div className="db-bar-track"><div className="db-bar-stack" style={{ height: `${item.total / chartMax * 100}%` }}>
                  {item.open > 0 && <span className="db-bar-open" style={{ flexGrow: item.open }}/>}
                  {item.done > 0 && <span className="db-bar-done" style={{ flexGrow: item.done }}/>}
                </div></div>
                <span className="db-month-label">{item.label}</span><small className="db-month-year">{item.year}</small>
              </li>)}
            </ol>
          </div>
          <figcaption className="db-chart-legend"><span><i className="db-bar-open"/>Offen</span><span><i className="db-bar-done"/>Abgeschlossen</span>{chartTotal === 0 && <span>Keine Maßnahmen im Zeitraum</span>}</figcaption>
        </figure>
      </section>

      <section className="db-section" aria-labelledby="db-status-heading">
        <div className="db-section-heading"><div><h2 id="db-status-heading">Baumbestand</h2><p>{summary.certified} von {trees.length} Bäumen zertifiziert</p></div></div>
        <div className="db-tree-status">
          <div className="db-donut" aria-hidden="true" style={{ background: segments.length ? `conic-gradient(${segments.join(", ")})` : "#e4e9ed" }}><div><strong>{trees.length}</strong><span>Bäume</span></div></div>
          <ul>{statuses.map(([key, count]) => <li key={key}><span className="db-dot" style={{ background: colors[key] }}/><span>{statusLabels[key]}</span><strong>{count}</strong></li>)}</ul>
        </div>
      </section>
    </div>

    <div className={`db-split db-work ${!office ? "db-single" : ""}`}>
      <section className="db-section" aria-labelledby="db-measures-heading">
        <div className="db-section-heading"><div><h2 id="db-measures-heading" tabIndex={-1}>Maßnahmen im Blick</h2><p>{filtered.length} Treffer · nächste Fälligkeit zuerst</p></div><button className="db-link" onClick={() => onNav("measures")}>Alle Maßnahmen<DispatchIcon name="ArrowRight" size={16}/></button></div>
        <div className="db-measure-controls"><div className="db-segmented" role="group" aria-label="Maßnahmen filtern">
          {[["open", "Offen"], ["overdue", "Überfällig"], ["week", "Nächste 7 Tage"]].map(([key, label]) => <button key={key} aria-pressed={measureFilter === key} onClick={() => setMeasureFilter(key)}>{label}</button>)}
        </div><label className="db-search"><DispatchIcon name="Search" size={17}/><input type="search" aria-label="Maßnahmen suchen" placeholder="Maßnahme suchen" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
        {filtered.length ? <ul className="db-measures">{filtered.slice(0, 6).map(measure => {
          const tree = trees.find(item => item.id === measure.treeId);
          const overdue = DashboardData.validDate(measure.date) && measure.date < today;
          return <li key={measure.id}>
            <div className="db-measure-title"><strong>{measure.title}</strong><small>{measureTypes[measure.type]?.label || measure.label || measure.type || "Typ offen"}</small><small>{users.find(item => item.id === measure.assignedTo)?.name || "Nicht zugeordnet"}</small></div>
            <div className="db-due"><time dateTime={DashboardData.validDate(measure.date) ? measure.date : undefined}>{DashboardData.dateLabel(measure.date)}</time><span className={overdue ? "db-text-red" : "db-muted"}>{overdue ? "Überfällig" : measure.date === today ? "Heute fällig" : "Fälligkeit"}</span></div>
            <span className={`db-badge ${measure.status === "in_arbeit" ? "db-blue" : "db-neutral"}`}>{stateLabel[measure.status] || "Status offen"}</span>
            {tree ? <button className="db-icon" aria-label={`Baum öffnen: ${measure.title}`} title={`Baumprofil: ${tree.name}`} onClick={() => onSelectTree(tree.id)}><DispatchIcon name="TreePine" size={18}/></button> : <span/>}
          </li>;
        })}</ul> : <p className="db-empty">Keine Maßnahmen für diese Auswahl.</p>}
        {filtered.length > 6 && <p className="db-muted db-list-footer">6 von {filtered.length} Maßnahmen</p>}
      </section>

      {office && <section className="db-section" aria-labelledby="db-team-heading">
        <div className="db-section-heading"><div><h2 id="db-team-heading">Aufgaben im Team</h2><p>Offene Maßnahmen je Mitarbeiter</p></div><DispatchIcon name="Users" size={21}/></div>
        {summary.workload.length ? <ul className="db-workload">{summary.workload.slice(0, 5).map(person => <li key={person.id}><div><span>{person.name}</span><strong>{person.count}</strong></div><div className="db-workload-track" aria-hidden="true"><span style={{ width: `${person.count / summary.workload[0].count * 100}%` }}/></div></li>)}</ul> : <p className="db-empty">Keine offenen Maßnahmen zugeordnet.</p>}
        {!!summary.unassigned && <p className="db-day-note">{summary.unassigned} {summary.unassigned === 1 ? "Maßnahme" : "Maßnahmen"} ohne Mitarbeiterzuordnung</p>}
        {summary.workload.length > 5 && <p className="db-muted">Weitere {summary.workload.length - 5} Mitarbeiter mit offenen Maßnahmen</p>}
        <button className="db-link" onClick={() => onNav("team")}>Team öffnen<DispatchIcon name="ArrowRight" size={16}/></button>
      </section>}
    </div>
  </main>;
}

Object.assign(window, { Dashboard });
