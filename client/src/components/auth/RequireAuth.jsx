import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  // While checking /me on refresh
  if (booting) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-black/60">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}