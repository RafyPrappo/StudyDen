import { api } from "./apiClient";

export const eventApi = {
  // Get all events with filters
  getEvents: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.topic && params.topic !== "All") queryParams.append("topic", params.topic);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    
    const queryString = queryParams.toString();
    return api.get(`/api/events${queryString ? `?${queryString}` : ""}`);
  },

  // Get single event
  getEvent: (id) => api.get(`/api/events/${id}`),

  // Create event
  createEvent: (data) => api.post("/api/events", data, { credentials: "include" }),

  // Join event
  joinEvent: (id) => api.post(`/api/events/${id}/join`, {}, { credentials: "include" }),

  // Leave event
  leaveEvent: (id) => api.post(`/api/events/${id}/leave`, {}, { credentials: "include" }),

  // Toggle favorite
  toggleFavorite: (id) => api.post(`/api/events/${id}/favorite`, {}, { credentials: "include" }),

  // Share event
  shareEvent: (id) => api.post(`/api/events/${id}/share`, {}, { credentials: "include" }),

  // Delete/cancel event
  deleteEvent: (id) => api.del(`/api/events/${id}`, { credentials: "include" }),

  // Track location (for attendance)
  trackLocation: (id, coords) => api.post(`/api/events/${id}/track`, coords, { credentials: "include" }),

  // Get event status (for live tracking)
  getEventStatus: (id) => api.get(`/api/events/${id}/status`, { credentials: "include" }),

  // Get user's joined events
  getMyEvents: () => api.get("/api/events/user/joined", { credentials: "include" }),

  // Get user's hosted events
  getHostedEvents: () => api.get("/api/events/user/hosted", { credentials: "include" })
};