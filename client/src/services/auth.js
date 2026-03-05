import { api } from "./apiClient";

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload, { credentials: "include" }),
  login: (payload) => api.post("/api/auth/login", payload, { credentials: "include" }),
  me: () => api.get("/api/auth/me", { credentials: "include" }),
  logout: () => api.post("/api/auth/logout", {}, { credentials: "include" }),
};