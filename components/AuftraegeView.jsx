function AuftraegeView({ onSelectTree }) {
  const { orders = [], users = [], vehicles = [], equipment = [], trees = [], statusColors } = MOCK_DATA;
  const [selectedOrderId, setSelectedOrderId] = React.useState(orders[0]?.id);
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [doneSteps, setDoneSteps] = React.useState({});
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const filteredOrders = orders.filter(order => {
    const q = query.trim().toLowerCase();
    const haystack = `${order.id} ${order.title} ${order.client} ${order.street} ${order.city}`.toLowerCase();
    return (filter === "all" || order.status === filter) && (!q || haystack.includes(q));
  });

  function getUser(id) { return users.find(u => u.id === id); }
  function getVehicle(id) { return vehicles.find(v => v.id === id); }
  function getEquipment(id) { return equipment.find(e => e.id === id); }
  function getTree(id) { return trees.find(t => t.id === id); }

  function canDrive(user, vehicle) {
    if (!user || !vehicle) return { ok:false, reason:"Nicht zugeordnet" };
    const max = user.maxVehicleWeightKg;
    if (max && vehicle.weightKg > max) {
      return { ok:false, reason:`max. ${Math.round(max / 1000).toLocaleString("de-DE")}t` };
    }
    const licenses = user.licenses || [];
    if (vehicle.requiredLicense === "B" && licenses.includes("B")) return { ok:true, reason:"fahrbar" };
    if ((vehicle.requiredLicense === "C1/C" || vehicle.requiredLicense === "C") && (licenses.includes("C") || licenses.includes("CE"))) {
      return { ok:true, reason:"fahrbar" };
    }
    return { ok:false, reason:`${vehicle.requiredLicense} fehlt` };
  }

  function toggleStep(orderId, idx) {
    const key = `${orderId}-${idx}`;
    setDoneSteps(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (!selectedOrder) {
    return (
      <div style={ovStyles.page}>
        <div style={ovStyles.empty}>Keine Aufträge vorhanden.</div>
      </div>
    );
  }

  const orderTrees = selectedOrder.treeIds.map(getTree).filter(Boolean);
  const leftTrees = orderTrees.filter(t => t.routeSide === "links").sort((a,b) => a.routeIndex - b.routeIndex);
  const rightTrees = orderTrees.filter(t => t.routeSide === "rechts").sort((a,b) => a.routeIndex - b.routeIndex);
  const crew = selectedOrder.crewIds.map(getUser).filter(Boolean);
  const orderVehicles = selectedOrder.vehicleIds.map(getVehicle).filter(Boolean);
  const orderEquipment = selectedOrder.equipmentIds.map(getEquipment).filter(Boolean);
  const completedSteps = selectedOrder.workflow.filter((_, idx) => doneSteps[`${selectedOrder.id}-${idx}`]).length;

  return (
    <div style={ovStyles.shell}>
      <aside style={ovStyles.list}>
        <div style={ovStyles.listHeader}>
          <div>
            <div style={ovStyles.listTitle}>Aufträge</div>
            <div style={ovStyles.listSub}>{orders.length} geplant · Büro & Außendienst</div>
          </div>
        </div>
        <div style={ovStyles.searchBar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input style={ovStyles.searchInput} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Auftrag, Ort, Kunde suchen" />
        </div>
        <div style={ovStyles.filterTabs}>
          {[["all","Alle"],["geplant","Geplant"],["in_arbeit","In Arbeit"],["abgeschlossen","Fertig"]].map(([id,label])=>(
            <button key={id} onClick={()=>setFilter(id)}
              style={{...ovStyles.filterTab,...(filter===id?ovStyles.filterTabActive:{})}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {filteredOrders.map(order => (
            <button key={order.id} style={{...ovStyles.orderRow,...(selectedOrder.id===order.id?ovStyles.orderRowActive:{})}}
              onClick={()=>setSelectedOrderId(order.id)}>
              <div style={ovStyles.orderTop}>
                <span style={ovStyles.orderId}>{order.id}</span>
                <span style={{...ovStyles.statusBadge,background:"#EDF7F1",color:"#1D7A56"}}>{order.status}</span>
              </div>
              <div style={ovStyles.orderTitle}>{order.title}</div>
              <div style={ovStyles.orderMeta}>{order.city} · {order.scheduledDate} · {order.treeIds.length} Bäume</div>
            </button>
          ))}
        </div>
      </aside>

      <main style={ovStyles.detail}>
        <div style={ovStyles.header}>
          <div>
            <div style={ovStyles.eyebrow}>{selectedOrder.client} · {selectedOrder.city}</div>
            <h1 style={ovStyles.title}>{selectedOrder.title}</h1>
            <p style={ovStyles.sub}>{selectedOrder.description}</p>
          </div>
          <div style={ovStyles.headerActions}>
            <span style={ovStyles.dateBadge}>{selectedOrder.scheduledDate} · {selectedOrder.startTime}</span>
            <span style={{...ovStyles.priorityBadge,color:"#E65100",background:"#FFF3E0"}}>{selectedOrder.priority}</span>
          </div>
        </div>

        <div className="stat-grid" style={ovStyles.kpiGrid}>
          {[
            ["Bäume", selectedOrder.treeIds.length, "links/rechts erfasst"],
            ["Dauer", `${selectedOrder.estimatedHours}h`, "geplante Tagesleistung"],
            ["Team", crew.length, crew.map(u=>u.initials).join(" + ")],
            ["Fortschritt", `${completedSteps}/${selectedOrder.workflow.length}`, "Außendienst-Checkliste"],
          ].map(([label,value,sub])=>(
            <div key={label} style={ovStyles.kpi}>
              <div style={ovStyles.kpiValue}>{value}</div>
              <div style={ovStyles.kpiLabel}>{label}</div>
              <div style={ovStyles.kpiSub}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="two-col" style={ovStyles.twoCol}>
          <section style={ovStyles.panel}>
            <div style={ovStyles.panelTitle}>Team & Führerscheinprüfung</div>
            {crew.map(user => (
              <div key={user.id} style={ovStyles.crewRow}>
                <div style={ovStyles.avatar}>{user.initials}</div>
                <div style={{flex:1}}>
                  <div style={ovStyles.crewName}>{user.name}</div>
                  <div style={ovStyles.crewMeta}>Führerschein: {(user.licenses || []).join(", ")} · {user.maxVehicleWeightKg ? `bis ${user.maxVehicleWeightKg / 1000}t` : "alle Fahrzeuge"}</div>
                </div>
              </div>
            ))}
            <div style={ovStyles.matrix}>
              <div style={ovStyles.matrixHead}>Fahrzeug</div>
              {crew.map(user => <div key={user.id} style={ovStyles.matrixHead}>{user.initials}</div>)}
              {orderVehicles.map(vehicle => (
                <React.Fragment key={vehicle.id}>
                  <div style={ovStyles.matrixVehicle}>{vehicle.name}<br/><span>{vehicle.plate} · {(vehicle.weightKg/1000).toLocaleString("de-DE")}t</span></div>
                  {crew.map(user => {
                    const result = canDrive(user, vehicle);
                    return <div key={`${vehicle.id}-${user.id}`} style={{...ovStyles.driveCell,background:result.ok?"#EDF7F1":"#FFEBEE",color:result.ok?"#1D7A56":"#B71C1C"}}>{result.reason}</div>;
                  })}
                </React.Fragment>
              ))}
            </div>
          </section>

          <section style={ovStyles.panel}>
            <div style={ovStyles.panelTitle}>Fahrzeuge & Geräte</div>
            {orderVehicles.map(vehicle => (
              <div key={vehicle.id} style={ovStyles.assetRow}>
                <div>
                  <div style={ovStyles.assetName}>{vehicle.name}</div>
                  <div style={ovStyles.assetMeta}>{vehicle.plate} · {(vehicle.weightKg/1000).toLocaleString("de-DE")}t · {vehicle.requiredLicense}</div>
                </div>
                <span style={ovStyles.assetBadge}>{vehicle.status}</span>
              </div>
            ))}
            {orderEquipment.map(item => (
              <div key={item.id} style={ovStyles.assetRow}>
                <div>
                  <div style={ovStyles.assetName}>{item.name}</div>
                  <div style={ovStyles.assetMeta}>{item.requiredLicense} · gekoppelt an {getVehicle(item.attachedTo)?.plate}</div>
                </div>
                <span style={ovStyles.assetBadge}>{item.status}</span>
              </div>
            ))}
            <div style={ovStyles.noteBox}>{selectedOrder.access}</div>
          </section>
        </div>

        <section style={ovStyles.panel}>
          <div style={ovStyles.panelTitle}>Baumroute finden und abarbeiten</div>
          <div className="two-col" style={ovStyles.routeGrid}>
            <TreeRoute title="Linke Straßenseite" items={leftTrees} statusColors={statusColors} onSelectTree={onSelectTree} />
            <TreeRoute title="Rechte Straßenseite" items={rightTrees} statusColors={statusColors} onSelectTree={onSelectTree} />
          </div>
        </section>

        <div className="two-col" style={ovStyles.twoCol}>
          <section style={ovStyles.panel}>
            <div style={ovStyles.panelTitle}>Außendienst-Checkliste</div>
            {selectedOrder.workflow.map((step, idx) => {
              const user = getUser(step.owner);
              const key = `${selectedOrder.id}-${idx}`;
              return (
                <label key={key} style={ovStyles.checkRow}>
                  <input type="checkbox" checked={Boolean(doneSteps[key])} onChange={()=>toggleStep(selectedOrder.id, idx)} />
                  <span style={{flex:1}}>{step.label}</span>
                  <span style={ovStyles.stepOwner}>{user?.initials}</span>
                </label>
              );
            })}
          </section>

          <section style={ovStyles.panel}>
            <div style={ovStyles.panelTitle}>Sicherheit</div>
            {selectedOrder.safety.map(item => (
              <div key={item} style={ovStyles.safetyItem}>{item}</div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

function TreeRoute({ title, items, statusColors, onSelectTree }) {
  return (
    <div style={ovStyles.routeSide}>
      <div style={ovStyles.routeTitle}>{title}</div>
      {items.map(tree => (
        <button key={tree.id} style={ovStyles.treeStep} onClick={()=>onSelectTree(tree.id)}>
          <span style={ovStyles.routeIndex}>{tree.routeIndex}</span>
          <span style={{...ovStyles.treeDot,background:statusColors[tree.status] || "#888"}} />
          <span style={{flex:1,minWidth:0}}>
            <span style={ovStyles.treeName}>{tree.name}</span>
            <span style={ovStyles.treeMeta}>{tree.id} · {tree.height}m · {tree.standort}</span>
          </span>
          <span style={ovStyles.openTree}>Öffnen</span>
        </button>
      ))}
    </div>
  );
}

const ovStyles = {
  shell:{display:"flex",height:"100vh",overflow:"hidden",background:"#f8f7f4"},
  page:{padding:"32px 36px"},
  list:{width:320,minWidth:320,background:"#fff",borderRight:"1px solid #e5e5e0",display:"flex",flexDirection:"column",height:"100vh"},
  listHeader:{padding:"20px 16px 12px"},
  listTitle:{fontSize:18,fontWeight:700,color:"#1a1a18"},
  listSub:{fontSize:11,color:"#888",marginTop:2},
  searchBar:{display:"flex",alignItems:"center",gap:8,margin:"0 12px 8px",background:"#f5f5f3",borderRadius:8,padding:"8px 12px"},
  searchInput:{border:"none",background:"none",outline:"none",fontSize:13,width:"100%",color:"#333"},
  filterTabs:{display:"flex",borderBottom:"1px solid #e5e5e0",padding:"0 8px"},
  filterTab:{flex:1,padding:"8px 4px",border:"none",borderBottom:"2px solid transparent",background:"none",fontSize:11,cursor:"pointer",color:"#888",fontWeight:600},
  filterTabActive:{borderBottomColor:"#1D7A56",color:"#1D7A56"},
  orderRow:{display:"block",width:"100%",textAlign:"left",border:"none",background:"#fff",padding:"13px 14px",borderBottom:"1px solid #f5f5f2",cursor:"pointer"},
  orderRowActive:{background:"oklch(0.95 0.04 158)"},
  orderTop:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5},
  orderId:{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:"0.3px"},
  statusBadge:{padding:"3px 8px",borderRadius:100,fontSize:10,fontWeight:700},
  orderTitle:{fontSize:13,fontWeight:700,color:"#1a1a18",lineHeight:1.35},
  orderMeta:{fontSize:11,color:"#888",marginTop:4},
  detail:{flex:1,overflowY:"auto",padding:"28px 32px 40px"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:18,marginBottom:18},
  eyebrow:{fontSize:11,fontWeight:700,color:"#1D7A56",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:5},
  title:{fontSize:27,fontWeight:800,color:"#1a1a18",margin:0,letterSpacing:"-0.4px"},
  sub:{fontSize:14,color:"#666",lineHeight:1.5,marginTop:6,maxWidth:760},
  headerActions:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"},
  dateBadge:{padding:"7px 12px",background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,fontSize:12,fontWeight:700,color:"#333"},
  priorityBadge:{padding:"7px 12px",borderRadius:8,fontSize:12,fontWeight:700,textTransform:"uppercase"},
  kpiGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14},
  kpi:{background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,padding:"14px 16px"},
  kpiValue:{fontSize:25,fontWeight:800,color:"#1D7A56",lineHeight:1},
  kpiLabel:{fontSize:12,fontWeight:700,color:"#333",marginTop:7},
  kpiSub:{fontSize:11,color:"#888",marginTop:2},
  twoCol:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14},
  panel:{background:"#fff",border:"1px solid #e5e5e0",borderRadius:8,padding:"18px",marginBottom:14},
  panelTitle:{fontSize:13,fontWeight:800,color:"#1a1a18",marginBottom:13},
  crewRow:{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f3f3ef"},
  avatar:{width:34,height:34,borderRadius:"50%",background:"#1565A0",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0},
  crewName:{fontSize:13,fontWeight:700,color:"#1a1a18"},
  crewMeta:{fontSize:11,color:"#888",marginTop:2},
  matrix:{display:"grid",gridTemplateColumns:"minmax(170px,1.5fr) repeat(2,1fr)",gap:1,background:"#eee",border:"1px solid #eee",borderRadius:8,overflow:"hidden",marginTop:12},
  matrixHead:{background:"#f8f7f4",padding:"8px",fontSize:10,fontWeight:800,color:"#888",textTransform:"uppercase"},
  matrixVehicle:{background:"#fff",padding:"9px",fontSize:12,fontWeight:700,color:"#1a1a18"},
  driveCell:{background:"#fff",padding:"9px",fontSize:11,fontWeight:800,textAlign:"center"},
  assetRow:{display:"flex",justifyContent:"space-between",gap:12,padding:"11px 0",borderBottom:"1px solid #f3f3ef"},
  assetName:{fontSize:13,fontWeight:700,color:"#1a1a18"},
  assetMeta:{fontSize:11,color:"#888",marginTop:2},
  assetBadge:{alignSelf:"flex-start",padding:"3px 8px",borderRadius:100,fontSize:10,fontWeight:800,background:"#EDF7F1",color:"#1D7A56"},
  noteBox:{fontSize:12,color:"#555",lineHeight:1.6,background:"#f8f7f4",borderRadius:8,padding:"11px",marginTop:12},
  routeGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:0},
  routeSide:{background:"#f8f7f4",borderRadius:8,padding:"10px"},
  routeTitle:{fontSize:11,fontWeight:800,color:"#888",textTransform:"uppercase",letterSpacing:"0.6px",margin:"2px 2px 8px"},
  treeStep:{width:"100%",display:"flex",alignItems:"center",gap:8,border:"1px solid #e5e5e0",background:"#fff",borderRadius:7,padding:"9px",marginBottom:7,cursor:"pointer",textAlign:"left"},
  routeIndex:{width:22,height:22,borderRadius:"50%",background:"#1D7A56",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0},
  treeDot:{width:8,height:8,borderRadius:"50%",flexShrink:0},
  treeName:{display:"block",fontSize:12,fontWeight:800,color:"#1a1a18"},
  treeMeta:{display:"block",fontSize:10,color:"#888",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  openTree:{fontSize:10,fontWeight:800,color:"#1D7A56",background:"#EDF7F1",borderRadius:100,padding:"3px 7px",flexShrink:0},
  checkRow:{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f3f3ef",fontSize:13,color:"#333"},
  stepOwner:{fontSize:10,fontWeight:800,color:"#1D7A56",background:"#EDF7F1",borderRadius:"50%",width:24,height:24,display:"inline-flex",alignItems:"center",justifyContent:"center"},
  safetyItem:{fontSize:13,color:"#444",padding:"9px 0",borderBottom:"1px solid #f3f3ef"},
  empty:{fontSize:14,color:"#888"},
};

Object.assign(window, { AuftraegeView });
