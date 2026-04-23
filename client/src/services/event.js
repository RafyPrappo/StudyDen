import { api } from "./apiClient";

export const eventApi = {
  getEvents: (params) => {
    const query = new URLSearchParams();
    if (params.topic) query.append("topic", params.topic);
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    return api.get(`/api/events?${query.toString()}`);
  },
  getEvent: (id) => api.get(`/api/events/${id}`),
  createEvent: (data) => api.post("/api/events", data, { credentials: "include" }),
  joinEvent: (id) => api.post(`/api/events/${id}/join`, {}, { credentials: "include" }),
  leaveEvent: (id) => api.post(`/api/events/${id}/leave`, {}, { credentials: "include" }),
  toggleFavorite: (id) => api.post(`/api/events/${id}/favorite`, {}, { credentials: "include" }),
  shareEvent: (id) => api.post(`/api/events/${id}/share`, {}, { credentials: "include" }),
  deleteEvent: (id) => api.del(`/api/events/${id}`, { credentials: "include" }),
  removeCalendarEvent: (id) => api.del(`/api/events/${id}/calendar`, { credentials: "include" }),
  submitEndorsement: (id, data) => api.post(`/api/events/${id}/endorse`, data, { credentials: "include" }),
  completeEvent: (id) => api.post(`/api/events/${id}/complete`, {}, { credentials: "include" }),
  trackLocation: (id, lat, lng) => api.post(`/api/events/${id}/track`, { lat, lng }, { credentials: "include" }),
};