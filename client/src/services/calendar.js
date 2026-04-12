import { api } from "./apiClient";

export const calendarApi = {
  syncEvent: (eventId) => api.post(`/api/calendar/sync/${eventId}`, {}, { credentials: "include" }),
  connectCalendar: () => {
    window.open('http://localhost:9120/api/calendar/auth', '_blank');
  },
};