// frontend/src/api/axios.js
import axios from "axios";

const trim = (s) => (s || "").trim();
const stripEdges = (s) => trim(s).replace(/^\/+|\/+$/g, ""); // remove leading+trailing '/'

const RAW_API_BASE   = import.meta.env.VITE_API_BASE   || "/api";
const RAW_MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || "/media";

// Normalise base: garde un trailing slash
const API_BASE   = `/${stripEdges(RAW_API_BASE)}/`;     // ex: '/api/' ou '/api/api/'
const MEDIA_BASE = `/${stripEdges(RAW_MEDIA_BASE)}/`;   // ex: '/media/'

// pour détecter un préfixe en trop dans les URLs passées à axios
const basePathNoSlash = stripEdges(RAW_API_BASE).toLowerCase(); // 'api' ou 'api/api'

const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor requêtes:
// - Ignore les URLs absolues (http/https)
// - Enlève les leading '/' pour que baseURL soit respecté
// - Retire un éventuel doublon du préfixe (ex: 'api/clients/' quand base='/api/')
api.interceptors.request.use((config) => {
  const orig = config.url || "";
  if (/^https?:\/\//i.test(orig)) return config; // absolu -> ne touche pas

  let u = orig.replace(/^\/+/, ""); // enlève leading '/'

  // si l'appel inclut déjà le préfixe base (ex: 'api/...' ou 'api/api/...'), on le retire
  if (basePathNoSlash && u.toLowerCase().startsWith(basePathNoSlash + "/")) {
    u = u.slice(basePathNoSlash.length + 1);
  }

  config.url = u;

  // JWT
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// 401 -> logout
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Helpers media
const toAbs = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  return new URL(`/${clean}`, window.location.origin).toString();
};

export const mediaUrl = (fp) => {
  if (!fp) return "";
  if (/^https?:\/\//i.test(fp)) return fp;
  const clean = fp.replace(/^\/+/, "");
  if (clean.startsWith("media/")) return toAbs(clean);
  return toAbs(`${stripEdges(MEDIA_BASE)}/${clean}`);
};

export default api;
