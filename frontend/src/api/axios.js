// frontend/src/api/axios.js
import axios from "axios";
import i18n from "../i18n"; // wherever you init i18n

const ensureSlash = (s) => (s.endsWith("/") ? s : s + "/");
export const API_BASE   = ensureSlash(import.meta.env.VITE_API_URL || "/api");
export const MEDIA_BASE = ensureSlash(import.meta.env.VITE_MEDIA_URL || "/api/media");

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const u = config.url || "";
  if (!/^https?:\/\//i.test(u)) config.url = u.replace(/^\/+/, ""); // "clients/" pas "/clients/"
  const t = localStorage.getItem("access");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  const lang = i18n?.language || "fr";
  config.headers["Accept-Language"] = lang; // preferred
  return config;
});


let isRefreshing = false;
let queue = [];

function onRefreshed(newAccess) {
  queue.forEach(cb => cb(newAccess));
  queue = [];
}

export function logout() {
  const refresh = localStorage.getItem("refresh");
  if (refresh) {
    fetch(`${API_BASE}/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("access")||""}` },
      body: JSON.stringify({ refresh }),
      credentials: "include",
    }).catch(()=>{});
  }
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
}

api.interceptors.response.use(
  r => r,
  async err => {
    const { response, config } = err;
    if (!response) throw err;

    if (response.status === 401 && !config.__isRetryRequest) {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) { logout(); return Promise.reject(err); }

      if (isRefreshing) {
        return new Promise(resolve => {
          queue.push((newAcc) => {
            config.headers.Authorization = `Bearer ${newAcc}`;
            resolve(api(config));
          });
        });
      }

      isRefreshing = true;
      config.__isRetryRequest = true;

      try {
        const { data } = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
        const newAcc = data.access;
        localStorage.setItem("access", newAcc);
        isRefreshing = false;
        onRefreshed(newAcc);

        config.headers.Authorization = `Bearer ${newAcc}`;
        return api(config);
      } catch (e) {
        isRefreshing = false;
        logout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
