import axios from "axios";


// instance axios personnalisée
const api = axios.create({
  baseURL: "http://localhost:8000/",
});

// Intercepteur qui ajoute le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor qui gére les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.reload(); // Forcer le retour à la page de login
    }
    return Promise.reject(error);
  }
);

export default api; 