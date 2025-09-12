// frontend/src/api/axios.js
import axios from "axios";

const trimRight = (s) => s.replace(/\/+$/, "");
const trimLeft  = (s) => s.replace(/^\/+/, "");

export const API_BASE   = trimRight(import.meta.env.VITE_API_URL || "/api");
export const MEDIA_BASE = trimRight(import.meta.env.VITE_MEDIA_URL || "/media");

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  let u = config.url || "";
  // 🔧 si l'appel commence par /api/... on enlève CE /api pour éviter /api/api/...
  if (u.startsWith("/api/")) u = u.replace(/^\/api\//, "/");
  else if (u.startsWith("api/")) u = `/${u.slice(4)}`; // 'api/x' -> '/x'
  // garantir le leading slash
  if (!u.startsWith("/")) u = `/${u}`;
  config.url = u;

  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Helpers identiques
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
