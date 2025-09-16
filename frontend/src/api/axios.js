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
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  const lang = i18n?.language || "fr";
  config.headers["Accept-Language"] = lang; // preferred
  return config;
});

export default api;
