import { api } from "./apiClient";

export const adminApi = {
  getDashboard: () => api.get("/api/admin/dashboard", { credentials: "include" }),

  getUsers: () => api.get("/api/admin/users", { credentials: "include" }),

  getNearbyPlaces: ({ lat, lng, radius, category = "all" }) => {
    const queryParams = new URLSearchParams();
    if (lat !== undefined && lat !== null) queryParams.append("lat", lat);
    if (lng !== undefined && lng !== null) queryParams.append("lng", lng);
    if (radius) queryParams.append("radius", radius);
    if (category) queryParams.append("category", category);
    const queryString = queryParams.toString();
    return api.get(`/api/admin/places/nearby${queryString ? `?${queryString}` : ""}`, { credentials: "include" });
  },

  importPlace: (data) => api.post("/api/admin/places/import", data, { credentials: "include" }),

  getPendingSpots: () => api.get("/api/admin/spots/pending", { credentials: "include" }),
  updateSpotStatus: (spotId, status) =>
    api.put(`/api/admin/spots/${spotId}/status`, { status }, { credentials: "include" }),
};