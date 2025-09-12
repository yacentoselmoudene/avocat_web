// frontend/src/api/axios.js
import axios from "axios";

// Read from Vite env; default to same-origin /api
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE, // dev: /api (proxied) | prod: /api (same origin)
  // withCredentials: true, // only if you use cookie auth (you're using Bearer, so leave false)
});

// Attach JWT if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401s safely (avoid reload loops)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Redirect to login only if you're not already there
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
