import { api } from "./apiClient";

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  me: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout", {}),
};