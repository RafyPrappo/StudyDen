import { api } from "./apiClient";

export const userApi = {
  getProfile: (userId) => api.get(userId ? `/api/users/profile/${userId}` : "/api/users/profile", { credentials: "include" }),
  
  updateProfile: (data) => api.put("/api/users/profile", data, { credentials: "include" }),
  
  uploadPhoto: async (formData) => {
    const response = await fetch("http://localhost:5000/api/users/profile/photo", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    return response.json();
  },
  
  removePhoto: () => api.del("/api/users/profile/photo", { credentials: "include" }),

  getNotifications: (page = 1) => api.get(`/api/users/notifications?page=${page}`, { credentials: "include" }),
  
  markNotificationRead: (id) => api.put(`/api/users/notifications/${id}/read`, {}, { credentials: "include" }),
  
  markAllRead: () => api.put("/api/users/notifications/read-all", {}, { credentials: "include" }),
  
  deleteNotification: (id) => api.del(`/api/users/notifications/${id}`, { credentials: "include" }),

  getDitchStreak: () => api.get("/api/users/ditch-streak", { credentials: "include" }),
  
  getCompletedEvents: (page = 1) => api.get(`/api/users/completed-events?page=${page}`, { credentials: "include" }),
  getPreferences: () => api.get("/api/users/preferences", { credentials: "include" }),

  updatePreferences: (data) =>
    api.put("/api/users/preferences", data, { credentials: "include" }),
};