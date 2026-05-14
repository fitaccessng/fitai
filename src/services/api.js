import axios from "axios";

const TOKEN_KEY = "pulsepilot_token";
const initialToken = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: initialToken ? { Authorization: `Bearer ${initialToken}` } : undefined,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
