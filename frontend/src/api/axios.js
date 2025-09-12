// frontend/src/api/axios.js
import axios from "axios";

// utils
const trimRight = (s) => (s || "").replace(/\/+$/, "");
const trimLeft  = (s) => (s || "").replace(/^\/+/, "");

// Base URLs via .env (dev et prod)
export const API_BASE   = trimRight(import.meta.env.VITE_API_URL || "/api");
export const MEDIA_BASE = trimRight(import.meta.env.VITE_MEDIA_URL || "/media");

// Parse le chemin de base (ex: '/api' ou '/api/v1') pour éviter les doublons
const apiBaseURL = (() => {
  try {
    return new URL(API_BASE, window.location.origin);
  } catch {
    return new URL("/api", window.location.origin);
  }
})();
const basePath = apiBaseURL.pathname.replace(/\/+$/, ""); // '/api' | '/api/v1' | ''

const api = axios.create({
  // garde ce que tu as défini dans .env (ex: '/api')
  baseURL: API_BASE,
});

// Interceptor requêtes :
// - si l'appel est relatif (pas http/https), garantir un leading '/'
// - si l'URL commence déjà par le basePath (ex: '/api/...'), on le retire
//   pour éviter 'baseURL(/api)' + 'url(/api/...)' => '/api/api/...'
api.interceptors.request.use((config) => {
  // ne touche pas aux URLs absolues
  const isAbsolute = /^https?:\/\//i.test(config.url || "");
  if (!isAbsolute) {
    let u = config.url || "/";
    if (!u.startsWith("/")) u = `/${u}`;
    if (basePath && u.startsWith(basePath + "/")) {
      u = u.slice(basePath.length); // retire le '/api' en double
    }
    config.url = u;
  }

  // JWT
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// Interceptor réponses : 401 => logout
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

// Helpers pour construire des URLs de fichiers (MEDIA)
export const toAbsoluteUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const joined = `/${trimLeft(path)}`;
  return new URL(joined, window.location.origin).toString();
};

export const mediaUrl = (fp) => {
  if (!fp) return "";
  if (/^https?:\/\//i.test(fp)) return fp;
  if (fp.startsWith("/media/")) return toAbsoluteUrl(fp);
  return toAbsoluteUrl(`${MEDIA_BASE}/${trimLeft(fp)}`);
};

export default api;
