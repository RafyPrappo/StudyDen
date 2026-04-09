import { api } from "./apiClient";

export const spotApi = {
  getSpots: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.type && params.type !== "All") queryParams.append("type", params.type);
    if (params.search) queryParams.append("search", params.search);
    if (params.amenity && params.amenity !== "All") queryParams.append("amenity", params.amenity);
    if (params.minRating && params.minRating !== "All") queryParams.append("minRating", params.minRating);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    return api.get(`/api/spots${queryString ? `?${queryString}` : ""}`);
  },

  getSpot: (id) => api.get(`/api/spots/${id}`),

  createSpot: (data) => api.post("/api/spots", data, { credentials: "include" }),

  getMySpots: () => api.get("/api/spots/my-spots", { credentials: "include" }),

  deleteSpot: (id) => api.del(`/api/spots/${id}`, { credentials: "include" }),

  createCheckIn: (id, data) =>
    api.post(`/api/spots/${id}/check-in`, data, { credentials: "include" }),

  getCheckInStatus: (id) =>
    api.get(`/api/spots/${id}/check-in-status`, { credentials: "include" }),

  getReviews: (id) => api.get(`/api/spots/${id}/reviews`),

  getMyReview: (id) =>
    api.get(`/api/spots/${id}/my-review`, { credentials: "include" }),

  saveReview: (id, data) =>
    api.post(`/api/spots/${id}/reviews`, data, { credentials: "include" }),
};