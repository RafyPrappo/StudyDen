import { api } from "./apiClient";

export const calendarApi = {
  // Check if user has connected Google Calendar
  checkConnection: () => api.get("/api/calendar/status", { credentials: "include" }),
  
  syncEvent: (eventId) => api.post(`/api/calendar/sync/${eventId}`, {}, { credentials: "include" }),
  
  connectCalendar: () => {
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9120'}/api/calendar/auth`,
      'Connect Google Calendar',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    return popup;
  },
};