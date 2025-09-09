// frontend/src/lib/api.js
import axios from "axios";

const trimRight = (s) => s.replace(/\/+$/, "");
const trimLeft  = (s) => s.replace(/^\/+/, "");

export const API_BASE   = trimRight(import.meta.env.VITE_API_URL || "/api");
export const MEDIA_BASE = trimRight(import.meta.env.VITE_MEDIA_URL || "/media");

export const api = axios.create({
  baseURL: API_BASE, // dev: /api (proxied); prod: /api (same origin)
  // withCredentials: true, // enable only if you use cookie auth
});

// Build absolute URLs safely (for <a href> etc.)
export const toAbsoluteUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const joined = `/${trimLeft(path)}`;
  return new URL(joined, window.location.origin).toString();
};

// Normalize media URLs (file paths coming from Django)
export const mediaUrl = (fp) => {
  if (!fp) return "";
  if (/^https?:\/\//i.test(fp)) return fp;              // already absolute
  if (fp.startsWith("/media/")) return toAbsoluteUrl(fp);
  return toAbsoluteUrl(`${MEDIA_BASE}/${trimLeft(fp)}`);
};
