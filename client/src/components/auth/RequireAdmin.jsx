import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAdmin({ children }) {
  const { user, booting, isAdmin } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Checking admin access...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}