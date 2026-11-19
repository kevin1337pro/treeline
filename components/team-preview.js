(function (root) {
  "use strict";
  const key = "treeline_demo_teamfunk_v1";
  const seed = [{ $id:"welcome", kind:"post", thread:"-", author:"demo-office", byName:"Beispielbüro", topic:"Frage",
    body:"Was gehört für euch vor der Abfahrt zum Materialcheck?", $createdAt:"2026-11-18T15:00:00Z", $updatedAt:"2026-11-18T15:00:00Z" }];
  function preview(user) {
    return async (action, input = {}) => {
      const operate = async () => {
        const raw = localStorage.getItem(key);
        const docs = raw ? JSON.parse(raw) : seed.map(x => ({ ...x }));
        let changed = false;
        const get = (_,id) => docs.find(d => d.$id === id);
        function list(_, queries) {
          let items = [...docs], limit;
          for (const { method, attribute:a, values:v } of queries) {
            if (method === "equal") items = items.filter(x => v.includes(x[a]));
            if (method.startsWith("order")) items.sort((x,y) => (x[a].localeCompare(y[a]) || x.$id.localeCompare(y.$id)) * (method === "orderDesc" ? -1 : 1));
            if (method === "cursorAfter") items = items.slice(items.findIndex(x => x.$id === v[0])+1);
            if (method === "limit") limit = v[0];
          }
          return items.slice(0,limit ?? items.length);
        }
        const err = code => Object.assign(new Error("Eintrag nicht verfügbar."),{code});
        const db = { get,list,all:list,
          create(c,id,data) { if (get(c,id)) throw err(409); const t = new Date().toISOString(); const d = { ...data,$id:id,$createdAt:t,$updatedAt:t }; docs.push(d); changed = true; return d; },
          update(c,id,data) { const d = get(c,id); if (!d) throw err(404); changed = true; return Object.assign(d,data,{$updatedAt:new Date().toISOString()}); },
          remove(c,id) { const d = get(c,id); if (!d) throw err(404); docs.splice(docs.indexOf(d),1); changed = true; },
        };
        const result = await TeamService.run(db,{id:user.id,name:user.name,role:user.role === "client" ? "client" : "employee"},{...input,action});
        if (changed) localStorage.setItem(key,JSON.stringify(docs));
        return result;
      };
      return navigator.locks ? navigator.locks.request(key,operate) : operate();
    };
  }
  root.createTeamPreview = preview;
})(window);
