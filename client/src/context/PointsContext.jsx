import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { pointsApi } from "../services/points";
import { useAuth } from "./AuthContext";

const PointsContext = createContext(null);

export function PointsProvider({ children }) {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [nextBadges, setNextBadges] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshPoints = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await pointsApi.getMyPoints();
      setPoints(data.points);
      setBadges(data.badges);
      setNextBadges(data.nextBadges || []);
    } catch (err) {
      console.error("Failed to refresh points:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshPoints();
    }
  }, [user, refreshPoints]);

  const value = {
    points,
    badges,
    nextBadges,
    loading,
    refreshPoints
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used inside <PointsProvider>");
  return ctx;
}