import { api } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9120';

export const userApi = {
  getProfile: (userId) => 
    api.get(userId ? `/api/users/profile/${userId}` : "/api/users/profile", { credentials: "include" }),
  
  updateProfile: (data) => 
    api.put("/api/users/profile", data, { credentials: "include" }),
  
  // Fixed: Use the correct base URL for file uploads
  uploadPhoto: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/profile/photo`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    
    return response.json();
  },
  
  removePhoto: () => 
    api.del("/api/users/profile/photo", { credentials: "include" }),

  getNotifications: (page = 1) => 
    api.get(`/api/users/notifications?page=${page}`, { credentials: "include" }),
  
  markNotificationRead: (id) => 
    api.put(`/api/users/notifications/${id}/read`, {}, { credentials: "include" }),
  
  markAllRead: () => 
    api.put("/api/users/notifications/read-all", {}, { credentials: "include" }),
  
  deleteNotification: (id) => 
    api.del(`/api/users/notifications/${id}`, { credentials: "include" }),

  getDitchStreak: () => 
    api.get("/api/users/ditch-streak", { credentials: "include" }),
  
  getCompletedEvents: (page = 1) => 
    api.get(`/api/users/completed-events?page=${page}`, { credentials: "include" }),
  
  getPreferences: () => 
    api.get("/api/users/preferences", { credentials: "include" }),

  updatePreferences: (data) =>
    api.put("/api/users/preferences", data, { credentials: "include" }),
};