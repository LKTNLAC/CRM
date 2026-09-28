import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refresh })
          .then((r) => {
            localStorage.setItem("access_token", r.data.access_token);
            localStorage.setItem("refresh_token", r.data.refresh_token);
            return r.data.access_token;
          })
          .catch(() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);