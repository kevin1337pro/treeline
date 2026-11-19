(function (root) {
  "use strict";
  const endpoint = "https://fra.cloud.appwrite.io/v1";
  const project = "6a1eb74900004d821d08";
  const sessionKey = "treeline_dispatch_session_" + project;
  const clear = () => localStorage.removeItem(sessionKey);
  async function request(path, method = "GET", data) {
    const headers = { "X-Appwrite-Project": project, "Content-Type": "application/json" };
    const fallback = localStorage.getItem(sessionKey);
    if (fallback) headers["X-Fallback-Cookies"] = fallback;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint + path, { method, headers, credentials: "include", cache: "no-store", signal: controller.signal, body: data && JSON.stringify(data) });
      const cookies = response.headers.get("X-Fallback-Cookies");
      if (cookies) localStorage.setItem(sessionKey, cookies);
      const value = response.status === 204 ? {} : await response.json();
      if (!response.ok) {
        const message = value.type === "project_paused" ? "Das Appwrite-Projekt ist pausiert. Bitte das Büro informieren." :
          response.status === 401 ? "Anmeldung erforderlich. Bitte E-Mail und Passwort prüfen." :
          response.status === 429 ? "Zu viele Anfragen. Bitte etwas später erneut versuchen." : "Betriebszugang derzeit nicht verfügbar.";
        throw Object.assign(new Error(message), { code: response.status, type: value.type });
      }
      return value;
    } finally { clearTimeout(timeout); }
  }
  root.CloudDispatchAPI = {
    account: () => request("/account"),
    login: (email, password) => request("/account/sessions/email", "POST", { email, password }),
    async logout() { try { await request("/account/sessions/current", "DELETE"); } catch (e) { if (e.code !== 401) throw e; } clear(); },
    async run(action, args = {}) {
      const result = await request("/functions/dispatch_gateway/executions", "POST", { body: JSON.stringify({ ...args, action }), async: false, method: "POST", headers: { "content-type": "application/json" } });
      if (!result.responseStatusCode || result.status === "failed") throw new Error("Der Einsatzdienst antwortet nicht.");
      let body;
      try { body = JSON.parse(result.responseBody); } catch (_) { throw new Error("Der Einsatzdienst ist nicht verfügbar."); }
      if (result.responseStatusCode !== 200) throw Object.assign(new Error(body.message || "Aktion fehlgeschlagen."), { code: result.responseStatusCode });
      return body;
    },
  };
})(window);
