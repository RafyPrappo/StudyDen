import { api } from "./apiClient";

export const eventApi = {
  getEvents: (params) => api.get("/api/events", { params }),
  getEvent: (id) => api.get(`/api/events/${id}`),
  createEvent: (data) => api.post("/api/events", data, { credentials: "include" }),
  joinEvent: (id) => api.post(`/api/events/${id}/join`, {}, { credentials: "include" }),
  leaveEvent: (id) => api.post(`/api/events/${id}/leave`, {}, { credentials: "include" }),
  toggleFavorite: (id) => api.post(`/api/events/${id}/favorite`, {}, { credentials: "include" }),
  shareEvent: (id) => api.post(`/api/events/${id}/share`, {}, { credentials: "include" }),
  deleteEvent: (id) => api.del(`/api/events/${id}`, { credentials: "include" }),
  removeCalendarEvent: (id) => api.del(`/api/events/${id}/calendar`, { credentials: "include" }),
};