function teamTime(value) {
  if (!value) return "nicht erfasst";
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(dayOnly ? value + "T12:00:00Z" : value);
  if (!Number.isFinite(d.getTime())) return "nicht erfasst";
  return new Intl.DateTimeFormat("de-DE",{ dateStyle:"short", ...(dayOnly ? {} : {timeStyle:"short"}), timeZone:"Europe/Berlin" }).format(d);
}
function treeStamp(user, created) {
  const at = new Date().toISOString(), by = user?.name || "";
  return { ...(created ? {createdAt:at,createdBy:by} : {}), updatedAt:at,updatedBy:by };
}
function TreeAudit({ tree }) {
  return <small className="tree-audit"><span>Angelegt: {tree.createdBy || "unbekannt"} · {teamTime(tree.createdAt)}</span>
    <span>Letzte Änderung: {tree.updatedAt ? (tree.updatedBy || "unbekannt") + " · " + teamTime(tree.updatedAt) : "nicht erfasst"}</span></small>;
}
function TeamAvatar({name}) {
  const parts = name.trim().split(/\s+/);
  return <span aria-hidden="true" className={"tf-avatar tone-" + (Array.from(name).reduce((n,c) => n+c.charCodeAt(0),0)%4)}>{(parts[0][0]+(parts.length>1 ? parts.at(-1)[0] : "")).toUpperCase()}</span>;
}
function useTeamData(run,action,after,onDenied) {
  const [value,setValue] = React.useState(null), [error,setError] = React.useState("");
  const sequence = React.useRef(0), denied = React.useRef(onDenied); denied.current=onDenied;
  const refresh = React.useCallback(async () => {
    const n = ++sequence.current;
    try { const data = await run(action,{after}); if (sequence.current === n) {setValue(data);setError("");} }
    catch (e) { if (sequence.current === n) { if ([401,403].includes(e.code) && denied.current) {setValue(null); denied.current(e);} else setError(e.message || "Abruf fehlgeschlagen."); } }
  },[run,action,after]);
  React.useEffect(() => {
    setValue(null); refresh();
    const visible = () => { if (!document.hidden) refresh(); };
    const timer = setInterval(visible,15000);
    for (const event of ["online","focus","storage"]) window.addEventListener(event,visible);
    document.addEventListener("visibilitychange",visible);
    return () => { ++sequence.current;clearInterval(timer); for (const event of ["online","focus","storage"]) window.removeEventListener(event,visible);document.removeEventListener("visibilitychange",visible); };
  },[refresh]);
  return {value,error,refresh};
}
function TeamPost({ post, write, busy }) {
  const [open,setOpen] = React.useState(false), [reply,setReply] = React.useState(""), [edit,setEdit] = React.useState(null);
  const replyId = React.useRef(null);
  function author(item) {
    return <div className="tf-author"><TeamAvatar name={item.name}/><div><strong>{item.name}</strong><small>{teamTime(item.createdAt)}{item.updatedAt !== item.createdAt && " · bearbeitet"}</small></div>
      {item.mine && <button type="button" className="tf-icon" title="Text bearbeiten" aria-label={"Text bearbeiten: "+item.name} onClick={() => setEdit({id:item.id,text:item.text})}><DispatchIcon name="Pencil" size={16}/></button>}</div>;
  }
  function body(item,limit) {
    if (edit?.id !== item.id) return <p className="tf-text">{item.text}</p>;
    return <form onSubmit={async e => { e.preventDefault();if (await write("team:edit",edit)) setEdit(null); }}><textarea autoFocus required aria-label="Text bearbeiten" maxLength={limit} value={edit.text} onChange={e=>setEdit({...edit,text:e.target.value})}/><div className="tf-tools"><button type="button" onClick={()=>setEdit(null)}>Abbrechen</button><button disabled={busy || !edit.text.trim()}>Speichern</button></div></form>;
  }
  return <article className="tf-post"><div className="tf-topic" data-topic={post.topic}>{post.topic}</div>{author(post)}{body(post,3000)}
    <div className="tf-tools"><button type="button" aria-label={post.liked ? "Like zurücknehmen" : "Gefällt mir"} aria-pressed={post.liked} disabled={busy} onClick={()=>write("team:like",{thread:post.id,on:!post.liked})}><DispatchIcon name="ThumbsUp" size={16}/>{post.likes}</button>
    <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}><DispatchIcon name="MessageCircle" size={16}/>{post.comments.length} {post.comments.length===1 ? "Kommentar" : "Kommentare"}</button></div>
    {open && <section className="tf-replies" aria-label="Kommentare">{post.comments.map(c=><div className="tf-reply" key={c.id}>{author(c)}{body(c,1000)}</div>)}
      <form onSubmit={async e => {e.preventDefault();replyId.current ||= crypto.randomUUID();if (await write("team:reply",{id:replyId.current,thread:post.id,text:reply})) {setReply("");replyId.current=null;}}}>
        <label>Kommentar<textarea maxLength={1000} rows={2} value={reply} onChange={e=>{setReply(e.target.value);replyId.current=null;}} placeholder="Antwort an das Team"/></label><button className="dp-button" disabled={busy || !reply.trim()}><DispatchIcon name="Send" size={16}/>Kommentieren</button></form></section>}
  </article>;
}
function TeamFeed({user,run,onDenied,demo=false}) {
  const [pages,setPages] = React.useState([null]), [draft,setDraft] = React.useState(""), [topic,setTopic] = React.useState("Allgemein");
  const [busy,setBusy] = React.useState(false), [alert,setAlert] = React.useState("");
  const postId = React.useRef(null), writing = React.useRef(false);
  const {value,error,refresh} = useTeamData(run,"team:feed",pages.at(-1),onDenied);
  async function write(action,input) {
    if (writing.current) return false;
    writing.current=true;setBusy(true);setAlert("");
    try {await run(action,input); await refresh();return true;}
    catch(e) {setAlert(e.message || "Nicht gesendet.");return false;}
    finally {writing.current=false;setBusy(false);}
  }
  return <main className="tf-page"><header className="tf-heading"><span className="tf-mark"><DispatchIcon name="Radio" size={26}/></span><div><p>{demo ? "Lokale Vorschau" : "Interne Gruppe"}</p><h1>Teamfunk</h1></div></header>
    <form className="tf-compose" onSubmit={async e=>{e.preventDefault();postId.current ||= crypto.randomUUID();if (await write("team:post",{id:postId.current,text:draft,topic})) {setDraft("");postId.current=null;if(pages.length>1)setPages([null]);}}}>
      <div className="tf-author"><TeamAvatar name={user.name}/><label htmlFor="team-post"><strong>Beitrag von {user.name}</strong></label></div>
      <textarea id="team-post" required disabled={busy} rows={3} maxLength={3000} value={draft} onChange={e=>{setDraft(e.target.value);postId.current=null;}} placeholder="Was gibt es im Team?"/>
      <div className="tf-compose-foot"><select aria-label="Thema" value={topic} onChange={e=>{setTopic(e.target.value);postId.current=null;}}>{TeamService.topics.map(t=><option key={t}>{t}</option>)}</select>
        <button className="dp-button dp-primary" disabled={busy || !draft.trim()}><DispatchIcon name="Send" size={16}/>Posten</button></div>
    </form>
    <div className="tf-subhead"><h2>Unterhaltung</h2><button className="tf-icon" onClick={refresh} title="Aktualisieren" aria-label="Unterhaltung aktualisieren"><DispatchIcon name="RotateCw" size={18}/></button></div>
    {(error || alert) && <p role="alert" className="dp-error">{alert || error}</p>}
    {value ? value.posts.length ? value.posts.map(p=><TeamPost key={p.id} post={p} write={write} busy={busy}/>) : <p className="tf-empty">Noch keine Beiträge im Teamfunk.</p> : !error && <p role="status">Beiträge werden geladen …</p>}
    <div className="tf-tools">{pages.length>1 && <button onClick={()=>setPages(p=>p.slice(0,-1))}>Neuere Beiträge</button>}{value?.next && <button onClick={()=>setPages(p=>[...p,value.next])}>Ältere Beiträge</button>}</div>
  </main>;
}
function DemoTeamFeed({user}) {
  const run = React.useMemo(()=>createTeamPreview(user),[user.id,user.name,user.role]);
  return <TeamFeed user={user} run={run} demo/>;
}
function WorkTrees({run,onDenied}) {
  const {value,error,refresh} = useTeamData(run,"tree:list",null,onDenied);
  const [form,setForm]=React.useState(null), [saving,setSaving]=React.useState(false), [issue,setIssue]=React.useState(""), [query,setQuery]=React.useState("");
  const open = f=>{setForm(f);setIssue("");};
  return <main className="tf-page"><header className="tf-heading"><span className="tf-mark"><DispatchIcon name="TreePine" size={26}/></span><div><p>Betriebskataster</p><h1>Bäume</h1></div>
    <button className="tf-icon" aria-label="Baum anlegen" title="Baum anlegen" onClick={()=>open({id:crypto.randomUUID(),name:"",species:"",place:"",notes:""})}><DispatchIcon name="Plus"/></button></header>
    <input className="tf-search" type="search" aria-label="Bäume suchen" placeholder="Art oder Standort suchen" value={query} onChange={e=>setQuery(e.target.value)}/>
    {error && <p role="alert" className="dp-error">{error}</p>}
    {value?.trees.filter(t=>(t.name+" "+t.place+" "+t.species).toLocaleLowerCase("de").includes(query.trim().toLocaleLowerCase("de"))).map(t=><article className="tf-tree" key={t.id}><div><h2>{t.name}</h2><i>{t.species}</i><p>{t.place}</p>{t.notes && <p>{t.notes}</p>}<TreeAudit tree={t}/></div><DispatchIconButton icon="Pencil" label={"Baum bearbeiten: "+t.name} onClick={()=>open({...t})}/></article>)}
    {!value && !error && <p role="status">Bäume werden geladen …</p>}
    {value && !value.trees.length && <p className="tf-empty">Noch keine Betriebsbäume erfasst.</p>}
    {form && <DispatchDialog title={form.createdAt ? "Baum bearbeiten" : "Baum anlegen"} onClose={()=>{if(!saving)open(null);}}><form onSubmit={async e=>{e.preventDefault();if(saving)return;setSaving(true);setIssue("");try {await run(form.createdAt ? "tree:update":"tree:new",form);await refresh();open(null);}catch(err){setIssue(err.message);}finally{setSaving(false);}}}>
      <div className="dp-form-body">{[["name","Baumart",160],["species","Lateinischer Name",160],["place","Standort",240],["notes","Notizen",2000]].map(([key,label,max])=><label key={key}>{label}<input required={key==="name" || key==="place"} maxLength={max} value={form[key]} onChange={e=>{const v=e.target.value;setForm(f=>({...f,[key]:v,...(key==="name" ? {species:window.TREELINE_SPECIES?.getLatinName(v) || (f.species===window.TREELINE_SPECIES?.getLatinName(f.name) ? "" : f.species)} : {})}));}}/></label>)}{issue && <p className="dp-error" role="alert">{issue}</p>}</div>
      <footer><button type="button" className="dp-button" disabled={saving} onClick={()=>open(null)}>Abbrechen</button><button className="dp-button dp-primary" disabled={saving}>Speichern</button></footer></form></DispatchDialog>}
  </main>;
}
