// frontend/src/api/axios.js
import axios from "axios";
import i18n from "../i18n";

import {useState} from "react"; // wherever you init i18n

const ensureSlash = (s) => (s.endsWith("/") ? s : s + "/");
export const API_BASE = ensureSlash(import.meta.env.VITE_API_URL || "/api");
export const MEDIA_BASE = ensureSlash(import.meta.env.VITE_MEDIA_URL || "/api/media");

const api = axios.create({baseURL: API_BASE});
api.interceptors.request.use((config) => {
    // Utiliser des chemins relatifs ("clients/", "token/refresh/") => pas de slash au début
    const url = config.url || "";
    if (/^https?:\/\//i.test(url)) {
        // laisse tel quel si URL absolue
    } else {
        config.url = url.replace(/^\/+/, ""); // "///x" -> "x"
    }

    const access = localStorage.getItem("token");
    if (access) config.headers.Authorization = `Bearer ${access}`;

    config.headers["Accept-Language"] = i18n?.language || "fr";
    return config;
});

// Endpoints d'auth à ignorer dans le retry pour éviter les boucles
const AUTH_PATHS = ["token", "token/refresh", "logout", "logout_all"];

let isRefreshing = false;
let queue = [];

function onRefreshed(newAccess) {
    queue.forEach((cb) => cb(newAccess));
    queue = [];
}

export function logoutClientSide() {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
   // localStorage.removeItem("token");
    //alert('remove token')

    window.location.href = "http://127.0.0.1:5173/login";
}

export async function logoutServerSide() {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return;
    try {
        // on passe par l'instance api pour bénéficier de baseURL
        //await api.post("api/logout/", {refresh});
    } catch {
        alert('ok')
        // 401/403 ici n'est pas bloquant
    }
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const {response, config} = error;
        if (!response) throw error;

        const url = (config?.url || "").replace(/^\/+/, "");
        const isAuthEndpoint = AUTH_PATHS.some((p) => url.startsWith(p));

        // Si c'est un endpoint d'auth, ne pas faire d'autres tours de manège
        if (isAuthEndpoint) {
            return Promise.reject(error);
        }
        if (response.status === 401) {
            //const [isLogged, setIsLogged] = useState(!!localStorage.getItem("token"));
           // setIsLogged(false);
           await logoutServerSide();
            logoutClientSide();
            return;
             //return Promise.reject(error);
        }
        if (response.status === 401 && !config.__isRetryRequest) {
            const refresh = localStorage.getItem("refresh");
            if (!refresh) {
                // pas de refresh -> déconnexion propre
                await logoutServerSide();
                logoutClientSide();
              //  return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve) => {
                    queue.push((newAcc) => {
                        config.headers.Authorization = `Bearer ${newAcc}`;
                        resolve(api(config));
                    });
                });
            }

            isRefreshing = true;
            config.__isRetryRequest = true;

            try {
                // IMPORTANT: utiliser l'instance api et chemin relatif
                const {data} = await api.post("token/refresh/", {refresh});
                const newAcc = data?.access;
                if (!newAcc) throw new Error("No access in refresh response");

                localStorage.setItem("token", newAcc);
                isRefreshing = false;
                onRefreshed(newAcc);

                config.headers.Authorization = `Bearer ${newAcc}`;
                return api(config);
            } catch (e) {
                isRefreshing = false;
                // on tente un logout serveur (blacklist), puis cleanup client
                await logoutServerSide();
                logoutClientSide();
                //return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
