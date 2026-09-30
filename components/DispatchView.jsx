function DispatchIcon({ name, size = 18 }) {
  const [tag, attrs, children] = TREELINE_ICONS[name];
  return React.createElement(tag, { ...attrs, width: size, height: size, "aria-hidden": true },
    children.map(([child, props], index) => React.createElement(child, { ...props, key: index })));
}

function DispatchIconButton({ icon, label, ...props }) {
  return <button className="dp-icon" aria-label={label} title={label} {...props}><DispatchIcon name={icon}/></button>;
}

function useDispatchStore() {
  const [state, setState] = React.useState({ days: {}, receipts: {} });
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const refresh = event => {
      if (event?.type === "storage" && event.key && event.key !== Dispatch.KEY) return;
      try { setState(DISPATCH_STORE.read()); setError(""); } catch (failure) { setError(failure.message); }
    };
    refresh();
    window.addEventListener("treeline:dispatch", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("treeline:dispatch", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return { state, error };
}

const dispatchDateLabel = date => new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
const dispatchTimeLabel = value => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function DispatchDatePicker({ date, onChange }) {
  function move(amount) { onChange(Dispatch.localDate(amount, new Date(`${date}T12:00:00`))); }
  return <div className="dp-date-picker">
    <DispatchIconButton icon="ChevronLeft" label="Vorheriger Tag" onClick={() => move(-1)}/>
    <input type="date" aria-label="Einsatzdatum" value={date} onChange={event => { if (Dispatch.validDate(event.target.value)) onChange(event.target.value); }}/>
    <DispatchIconButton icon="ChevronRight" label="Nächster Tag" onClick={() => move(1)}/>
  </div>;
}

function DispatchDialog({ title, children, onClose }) {
  const ref = React.useRef();
  React.useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog className="dp-dialog" ref={ref} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="dp-dialog-title">
    <header><h2 id="dp-dialog-title">{title}</h2><DispatchIconButton icon="X" label="Dialog schließen" onClick={onClose}/></header>
    {children}
  </dialog>;
}

function DispatchEntryForm({ entry, onSave, onClose, error }) {
  const [form, setForm] = React.useState(entry);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  function orderChanged(id) {
    const order = MOCK_DATA.orders.find(item => item.id === id);
    if (!order) { set("orderId", ""); return; }
    setForm(current => ({ ...current, orderId: id, site: order.title, address: [order.street, order.city].filter(Boolean).join(", "),
      task: order.description || "", start: order.startTime || "07:00", employeeIds: [...(order.crewIds || [])],
      vehicleIds: [...(order.vehicleIds || [])], equipmentIds: [...(order.equipmentIds || [])] }));
  }
  function choices(title, field, records) {
    return <fieldset><legend>{title}</legend><div className="dp-choices">{records.map(record => <label key={record.id}>
      <input type="checkbox" checked={form[field].includes(record.id)} onChange={event => set(field, event.target.checked ? [...form[field], record.id] : form[field].filter(id => id !== record.id))}/>
      <span>{record.name}{record.plate && <small>{record.plate}</small>}</span>
    </label>)}</div></fieldset>;
  }
  return <form onSubmit={event => { event.preventDefault(); onSave(form); }}>
    <div className="dp-form-body">
      <label>Auftrag<span className="dp-select"><select aria-label="Auftrag" value={form.orderId} onChange={event => orderChanged(event.target.value)}><option value="">Ohne Auftrag / Hofeinsatz</option>{MOCK_DATA.orders.map(order => <option key={order.id} value={order.id}>{order.id} · {order.title}</option>)}</select><DispatchIcon name="ChevronDown"/></span></label>
      <label>Baustelle<input autoFocus required maxLength={160} value={form.site} onChange={event => set("site", event.target.value)}/></label>
      <label>Adresse / Abschnitt<input maxLength={240} value={form.address} onChange={event => set("address", event.target.value)}/></label>
      <div className="dp-form-columns">
        <label>Beginn<input type="time" required value={form.start} onChange={event => set("start", event.target.value)}/></label>
        <label>Ende<input type="time" required value={form.end} onChange={event => set("end", event.target.value)}/></label>
      </div>
      <label>Treffpunkt<input maxLength={200} value={form.meeting} onChange={event => set("meeting", event.target.value)}/></label>
      <label>Arbeiten<textarea rows={2} maxLength={2000} value={form.task} onChange={event => set("task", event.target.value)}/></label>
      {choices("Mitarbeiter", "employeeIds", Dispatch.employees(MOCK_DATA))}
      {choices("Fahrzeuge", "vehicleIds", MOCK_DATA.vehicles)}
      {choices("Geräte / Anhänger", "equipmentIds", MOCK_DATA.equipment)}
      <label>Besonderheiten<textarea rows={2} maxLength={2000} value={form.notes} onChange={event => set("notes", event.target.value)}/></label>
      {error && <p className="dp-error" role="alert">{error}</p>}
    </div>
    <footer><button type="button" className="dp-button" onClick={onClose}>Abbrechen</button><button className="dp-button dp-primary" type="submit">Entwurf speichern</button></footer>
  </form>;
}

function DispatchRows({ rows, onEdit, onDelete, onMap, receipts }) {
  return <div className="dp-table" role="table" aria-label="Einsatzliste">
    <div className="dp-table-head" role="row"><span role="columnheader">Beginn / Ende</span><span role="columnheader">Baustelle / Arbeiten</span><span role="columnheader">Fahrzeuge / Geräte</span><span role="columnheader">Mitarbeiter</span>{onEdit && <span role="columnheader">Aktionen</span>}</div>
    {rows.map(entry => <div className="dp-table-row" role="row" key={entry.id} data-testid="dispatch-row">
      <div role="cell" className="dp-time"><strong>{entry.start}</strong><span>bis {entry.end}</span>{entry.meeting && <p>{entry.meeting}</p>}</div>
      <div role="cell" className="dp-site"><strong>{entry.site}</strong><span>{entry.address}</span>{entry.task && <p>{entry.task}</p>}{entry.notes && <p className="dp-note">{entry.notes}</p>}{onMap && entry.orderId && <button className="dp-link" onClick={() => onMap(entry.orderId)}><DispatchIcon name="MapPin" size={16}/>Auftragskarte</button>}</div>
      <div role="cell" className="dp-resources">
        {entry.vehicles.map(vehicle => <p key={vehicle.id}><strong>{vehicle.name}</strong><span>{vehicle.plate}</span></p>)}
        {entry.equipment.map(item => <p key={item.id}>{item.name}</p>)}
        {!entry.vehicles.length && !entry.equipment.length && <span>Keine Fahrzeuge</span>}
      </div>
      <div role="cell" className="dp-crew">{entry.employees.map(employee => <p key={employee.id}>{employee.name}{receipts && <small>{receipts[employee.id] ? "Gelesen" : "Noch ungelesen"}</small>}</p>)}</div>
      {onEdit && <div role="cell" className="dp-row-actions"><DispatchIconButton icon="Pencil" label={`Einsatz bearbeiten: ${entry.site}`} onClick={() => onEdit(entry.id)}/><DispatchIconButton icon="Trash2" label={`Einsatz entfernen: ${entry.site}`} onClick={() => onDelete(entry.id)}/></div>}
    </div>)}
  </div>;
}

function dispatchDraftRows(entries) {
  return entries.map(entry => ({ ...entry,
    employees: entry.employeeIds.map(id => MOCK_DATA.users.find(item => item.id === id) || { id, name: "Unbekanntes Profil" }),
    vehicles: entry.vehicleIds.map(id => MOCK_DATA.vehicles.find(item => item.id === id) || { id, name: "Unbekanntes Fahrzeug" }),
    equipment: entry.equipmentIds.map(id => MOCK_DATA.equipment.find(item => item.id === id) || { id, name: "Unbekanntes Gerät" }),
  }));
}

function DispatchView({ currentUser, onBoard }) {
  const { state, error: storageError } = useDispatchStore();
  const [date, setDate] = React.useState(() => Dispatch.localDate(1));
  const [dialog, setDialog] = React.useState(null);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const day = state.days[date] || Dispatch.blankDay(date);
  const release = Dispatch.latest(day);
  const pending = Dispatch.dirty(day);
  if (currentUser.role !== "admin") return <section className="dp-page"><h1>Einsatzplanung</h1><p>Diese Ansicht ist der Disposition vorbehalten.</p></section>;
  function open(value) { setError(""); setDialog(value); }
  function act(action, message) {
    try { action(); setError(""); setDialog(null); setStatus(message); }
    catch (failure) { setError(failure.message); }
  }
  function edit(id) {
    const entry = day.entries.find(item => item.id === id) || { id: crypto.randomUUID(), orderId: "", site: "", address: "", start: "07:00", end: "15:30", meeting: "Betriebshof", task: "", notes: "", employeeIds: [], vehicleIds: [], equipmentIds: [] };
    open({ type: "edit", entry, day });
  }
  const recipients = release?.recipients || [];
  const readCount = recipients.filter(id => state.receipts[`${id}:${release.id}`]).length;
  return <section className="dp-page">
    <div className="dp-heading"><div><p className="dp-eyebrow">Disposition</p><h1>Einsatzplanung</h1><span className="dp-muted">Vorschau · lokal auf diesem Gerät</span></div>
      <div className="dp-actions"><button className="dp-button" onClick={() => onBoard(date)}><DispatchIcon name="Monitor"/>Aushang</button><button className="dp-button dp-primary" onClick={() => edit()} disabled={!!storageError}><DispatchIcon name="Plus"/>Neuer Einsatz</button></div>
    </div>
    <div className="dp-toolbar"><DispatchDatePicker date={date} onChange={value => { setDate(value); setStatus(""); setError(""); }}/><div className="dp-actions"><button className="dp-button" onClick={() => setDate(Dispatch.localDate())}>Heute</button><button className="dp-button" onClick={() => setDate(Dispatch.localDate(1))}>Morgen</button></div></div>
    <div className="dp-day-heading"><div><h2>{dispatchDateLabel(date)}</h2><p className="dp-muted">{day.entries.length} Einsätze · {new Set(day.entries.flatMap(entry => entry.employeeIds)).size} Mitarbeiter</p></div><span className={`dp-badge ${pending ? "dp-draft" : "dp-live"}`}>{pending ? "Entwurf" : `Freigegeben · Version ${release.revision}`}</span></div>
    {(storageError || (error && !dialog)) && <p className="dp-error" role="alert">{storageError || error}</p>}
    {status && <p role="status" className="dp-success">{status}</p>}
    {day.entries.length ? <DispatchRows rows={dispatchDraftRows(day.entries)} onEdit={edit} onDelete={id => open({ type: "delete", id, day })}/> : <div className="dp-empty"><DispatchIcon name="CalendarDays" size={32}/><h3>Noch keine Einsätze</h3><p>{dispatchDateLabel(date)}</p><button className="dp-button" onClick={() => edit()} disabled={!!storageError}>Einsatz anlegen</button></div>}
    <div className="dp-day-note"><div><h3>Tageshinweis</h3><p>{day.note || "Kein Tageshinweis"}</p></div><DispatchIconButton icon="Pencil" label="Tageshinweis bearbeiten" disabled={!!storageError} onClick={() => open({ type: "note", note: day.note, day })}/></div>
    <div className="dp-publish-bar"><div><strong>{release ? `Zuletzt freigegeben: Version ${release.revision}` : "Noch nicht freigegeben"}</strong><p>{release ? `${dispatchTimeLabel(release.publishedAt)} · ${readCount}/${recipients.length} gelesen${pending ? " · Änderungen ausstehend" : ""}` : "Kein Eintrag im Mitarbeiterpostfach"}</p></div><button className="dp-button dp-primary" disabled={!pending || !!storageError || (!day.entries.length && !day.note)} onClick={() => open({ type: "publish", day })}><DispatchIcon name="Send"/>{release ? "Änderungen freigeben" : "Tagesplan freigeben"}</button></div>
    {dialog && <DispatchDialog title={{ edit: "Einsatz bearbeiten", delete: "Einsatz entfernen?", note: "Tageshinweis", publish: "Tagesplan freigeben?" }[dialog.type]} onClose={() => setDialog(null)}>
      {dialog.type === "edit" ? <DispatchEntryForm entry={dialog.entry} error={error} onClose={() => setDialog(null)} onSave={entry => act(() => DISPATCH_STORE.saveDraft(date, { ...dialog.day, entries: [...dialog.day.entries.filter(item => item.id !== entry.id), entry] }, dialog.day.version), "Entwurf gespeichert.")}/> : <form onSubmit={event => {
        event.preventDefault();
        act(() => {
          if (dialog.type === "publish") DISPATCH_STORE.publish(date, dialog.day.version, currentUser);
          else DISPATCH_STORE.saveDraft(date, { ...dialog.day, note: dialog.type === "note" ? dialog.note : dialog.day.note, entries: dialog.type === "delete" ? dialog.day.entries.filter(item => item.id !== dialog.id) : dialog.day.entries }, dialog.day.version);
        }, dialog.type === "publish" ? "Tagesplan im lokalen Postfach und Aushang freigegeben." : "Entwurf gespeichert.");
      }}>
        <div className="dp-form-body">
          {dialog.type === "note" ? <label>Tageshinweis<textarea autoFocus rows={4} maxLength={2000} value={dialog.note} onChange={event => setDialog({ ...dialog, note: event.target.value })}/></label> : <p>{dialog.type === "publish" ? `${dispatchDateLabel(date)}: ${day.entries.length} Einsätze. Die neue Version wird für die zugeordneten Beispielprofile sichtbar. Es werden keine E-Mails oder Push-Nachrichten verschickt.` : "Der Einsatz wird aus dem Entwurf entfernt. Eine bereits freigegebene Einteilung bleibt bis zur nächsten Freigabe bestehen."}</p>}
          {error && <p className="dp-error" role="alert">{error}</p>}
        </div><footer><button type="button" className="dp-button" onClick={() => setDialog(null)}>Abbrechen</button><button type="submit" className="dp-button dp-primary">{dialog.type === "publish" ? "Jetzt freigeben" : dialog.type === "delete" ? "Entfernen" : "Hinweis speichern"}</button></footer>
      </form>}
    </DispatchDialog>}
  </section>;
}

function DispatchInbox({ currentUser, onMap }) {
  const { state, error: storageError } = useDispatchStore();
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  let messages = [];
  try { messages = DISPATCH_STORE.messages(currentUser.id); } catch (_) { /* Storage error is shown by the subscription. */ }
  const message = messages.find(item => item.id === selected) || messages[0];
  const latestId = message && Dispatch.latest(state.days[message.date])?.id;
  const unread = messages.filter(item => !item.readAt).length;
  return <section className="dp-page">
    <div className="dp-heading"><div><p className="dp-eyebrow">{currentUser.name}</p><h1>Mein Postfach</h1><span className="dp-muted">Vorschau · {unread} ungelesen</span></div><DispatchIcon name="Inbox" size={28}/></div>
    {(storageError || error) && <p className="dp-error" role="alert">{storageError || error}</p>}
    {!messages.length ? <div className="dp-empty"><DispatchIcon name="Inbox" size={32}/><h2>Keine Einsatzmitteilungen</h2><p>Für {currentUser.name} ist noch kein Tagesplan freigegeben.</p></div> : <div className="dp-inbox">
      <nav className="dp-message-list" aria-label="Einsatzmitteilungen">{messages.map(item => <button className={`dp-message ${item.id === message.id ? "dp-selected" : ""}`} key={item.id} onClick={() => setSelected(item.id)} aria-current={item.id === message.id ? "true" : undefined}>
        <span>{item.readAt ? "Gelesen" : "Ungelesen"} · Version {item.revision}</span><strong>{dispatchDateLabel(item.date)}</strong><span>{item.revision === 1 ? "Neue Einteilung" : "Einteilung aktualisiert"} · {dispatchTimeLabel(item.publishedAt)}</span>
      </button>)}</nav>
      <article className="dp-message-detail">
        <div className="dp-day-heading"><div><h2>{dispatchDateLabel(message.date)}</h2><p className="dp-muted">Version {message.revision} · Freigabe von {message.publishedBy}</p></div><span className={`dp-badge ${latestId === message.id ? "dp-live" : "dp-draft"}`}>{latestId === message.id ? "Aktuell" : "Ältere Version"}</span></div>
        {latestId !== message.id && <p className="dp-note">Diese Einteilung wurde ersetzt. <button className="dp-link" onClick={() => setSelected(latestId)}>Aktuelle Version öffnen</button></p>}
        {message.note && <p className="dp-day-note">{message.note}</p>}
        {message.rows.length ? <DispatchRows rows={message.rows} onMap={onMap}/> : <div className="dp-empty"><h3>Kein Einsatz zugeteilt</h3><p>Eine vorherige Einteilung für diesen Tag ist aufgehoben.</p></div>}
        <div className="dp-publish-bar"><span className="dp-muted">Freigegeben am {dispatchTimeLabel(message.publishedAt)}</span><button className="dp-button dp-primary" disabled={!!message.readAt} onClick={() => { try { DISPATCH_STORE.markRead(currentUser.id, message.id); setError(""); } catch (failure) { setError(failure.message); } }}><DispatchIcon name="Check"/>{message.readAt ? "Als gelesen bestätigt" : "Als gelesen bestätigen"}</button></div>
      </article>
    </div>}
  </section>;
}

function DispatchBoard({ initialDate, onBack }) {
  const { state, error } = useDispatchStore();
  const [date, setDate] = React.useState(initialDate || Dispatch.localDate());
  const [followToday, setFollowToday] = React.useState(!initialDate);
  const [now, setNow] = React.useState(new Date());
  const [page, setPage] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [fullscreenError, setFullscreenError] = React.useState("");
  const [viewport, setViewport] = React.useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [pages, setPages] = React.useState([]);
  const listsRef = React.useRef();
  const measureRef = React.useRef();
  const release = Dispatch.latest(state.days[date]);
  const pageCount = Math.max(1, pages.length);
  React.useEffect(() => {
    const resize = () => { setViewport({ width: window.innerWidth, height: window.innerHeight }); setPage(0); };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  React.useLayoutEffect(() => {
    if (!release?.rows.length || !measureRef.current) { setPages([]); return; }
    const measure = () => {
      const table = measureRef.current;
      const headingHeight = table.querySelector(".dp-table-head").getBoundingClientRect().height;
      const available = Math.max(100, window.innerHeight - listsRef.current.getBoundingClientRect().top - window.scrollY - headingHeight - 90);
      const groups = [];
      let group = [], height = 0;
      // Measure complete rows so long notes are not silently clipped on wall displays.
      [...table.querySelectorAll(".dp-table-row")].forEach((row, index) => {
        const rowHeight = row.getBoundingClientRect().height;
        if (group.length && height + rowHeight > available) { groups.push(group); group = []; height = 0; }
        group.push(release.rows[index]); height += rowHeight;
      });
      if (group.length) groups.push(group);
      setPages(groups);
      setPage(value => Math.min(value, Math.max(0, groups.length - 1)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(measureRef.current.firstElementChild);
    return () => observer.disconnect();
  }, [release?.id, date, viewport.width, viewport.height]);
  React.useEffect(() => {
    const timer = setInterval(() => { setNow(new Date()); if (followToday) setDate(Dispatch.localDate()); }, 1000);
    return () => clearInterval(timer);
  }, [followToday]);
  React.useEffect(() => { setPage(0); }, [date, release?.id]);
  React.useEffect(() => {
    if (paused || pageCount < 2) return;
    const timer = setInterval(() => setPage(value => (value + 1) % pageCount), 15000);
    return () => clearInterval(timer);
  }, [paused, pageCount]);
  function chooseDate(value) {
    setDate(value); setFollowToday(false);
    const url = new URL(location.href); url.searchParams.set("date", value); history.replaceState(null, "", url);
  }
  return <main className="dp-board dp-page">
    <div className="dp-board-tools"><DispatchIconButton icon="ArrowLeft" label="Zurück zur App" onClick={onBack}/><DispatchDatePicker date={date} onChange={chooseDate}/><label className="dp-checkbox"><input type="checkbox" checked={followToday} onChange={event => { setFollowToday(event.target.checked); if (event.target.checked) { setDate(Dispatch.localDate()); const url = new URL(location.href); url.searchParams.delete("date"); history.replaceState(null, "", url); } }}/>Aktueller Tag</label><div className="dp-actions"><DispatchIconButton icon="Printer" label="Einsatzliste drucken" onClick={() => window.print()}/><DispatchIconButton icon="Maximize" label="Vollbild" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else throw new Error(); } catch (_) { setFullscreenError("Vollbild ist in diesem Browser nicht verfügbar."); } }}/></div></div>
    <header className="dp-board-header"><div className="dp-board-brand"><img src="uploads/logo-1776797212104.png" alt="Enbergs"/><div><p className="dp-eyebrow">Baumdienst Enbergs</p><h1>Tägliche Einsatzliste</h1><h2>{dispatchDateLabel(date)}</h2></div></div><div className="dp-board-clock"><strong>{now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</strong><span>Lokale Vorschau</span></div></header>
    {(error || fullscreenError) && <p className="dp-error" role="alert">{error || fullscreenError}</p>}
    {release ? <React.Fragment>
      <div className="dp-day-heading"><strong>{release.rows.length} Einsätze · {new Set(release.rows.flatMap(row => row.employeeIds)).size} Mitarbeiter</strong><span className="dp-badge dp-live">Freigegeben · Version {release.revision}</span></div>
      {release.note && <p className="dp-day-note">{release.note}</p>}
      {release.rows.length ? <div className="dp-board-lists" ref={listsRef}><div className="dp-screen-rows"><DispatchRows rows={pages[page] || release.rows.slice(0, 1)}/></div><div className="dp-measure-rows" ref={measureRef} aria-hidden="true"><DispatchRows rows={release.rows}/></div><div className="dp-print-rows"><DispatchRows rows={release.rows}/></div></div> : <div className="dp-empty"><h2>Keine Einsätze geplant</h2></div>}
      <footer className="dp-board-footer"><span>Stand {dispatchTimeLabel(release.publishedAt)} · {release.publishedBy}</span><div className="dp-actions">{pageCount > 1 && <React.Fragment><DispatchIconButton icon="ChevronLeft" label="Vorherige Seite" onClick={() => setPage(value => (value + pageCount - 1) % pageCount)}/><DispatchIconButton icon={paused ? "Play" : "Pause"} label={paused ? "Seitenwechsel fortsetzen" : "Seitenwechsel pausieren"} onClick={() => setPaused(value => !value)}/><DispatchIconButton icon="ChevronRight" label="Nächste Seite" onClick={() => setPage(value => (value + 1) % pageCount)}/></React.Fragment>}<span>Seite {page + 1} / {pageCount}</span></div></footer>
    </React.Fragment> : <div className="dp-empty"><DispatchIcon name="CalendarDays" size={40}/><h2>Noch kein Tagesplan freigegeben</h2><p>{dispatchDateLabel(date)}</p></div>}
  </main>;
}
