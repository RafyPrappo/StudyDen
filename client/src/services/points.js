import { api } from "./apiClient";

export const pointsApi = {
  getMyPoints: () => api.get("/api/points/me", { credentials: "include" }),
  getUserPoints: (userId) => api.get(`/api/points/user/${userId}`, { credentials: "include" }),
  awardPoints: (data) => api.post("/api/points/award", data, { credentials: "include" })
};

export const leaderboardApi = {
  getLeaderboard: (page = 1, limit = 10) => 
    api.get(`/api/leaderboard?page=${page}&limit=${limit}`),
  getMyRank: () => api.get("/api/leaderboard/me", { credentials: "include" }),
  getUserRank: (userId) => api.get(`/api/leaderboard/user/${userId}`, { credentials: "include" })
};