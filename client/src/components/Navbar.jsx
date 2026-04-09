import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";
import { userApi } from "../services/user";
import {
  Home,
  MapPin,
  Calendar,
  Trophy,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Plus,
  Shield,
} from "lucide-react";

const linkBase =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-blue-600 hover:bg-blue-50";
const active = "bg-blue-50 text-blue-600";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    setShowCreateButton(location.pathname === "/events");
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const data = await userApi.getNotifications(1);
      setUnreadNotifications(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const gatedTo = (path) => (user ? path : "/login");
  const gatedState = (path) => (user ? undefined : { from: path });

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      nav("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <NavLink
          to="/"
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white">
            SD
          </div>
          <span className="text-lg font-semibold text-gray-900">StudyDen</span>
        </NavLink>

        <nav className="flex items-center">
          <div
            className={`flex items-center gap-1 transition-all duration-500 ease-in-out ${
              showCreateButton ? "mr-8" : "mr-0"
            }`}
          >
            <NavLink
              to="/"
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <Home size={18} />
              <span className="hidden sm:inline">Home</span>
            </NavLink>

            <NavLink
              to={gatedTo("/spots")}
              state={gatedState("/spots")}
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <MapPin size={18} />
              <span className="hidden sm:inline">Spots</span>
            </NavLink>

            <NavLink
              to={gatedTo("/events")}
              state={gatedState("/events")}
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Events</span>
            </NavLink>

            <NavLink
              to={gatedTo("/leaderboard")}
              state={gatedState("/leaderboard")}
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <Trophy size={18} />
              <span className="hidden sm:inline">Leaderboard</span>
            </NavLink>

            {user && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : ""} relative`
                }
              >
                <User size={18} />
                <span className="hidden sm:inline">Profile</span>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs font-bold items-center justify-center">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  </span>
                )}
              </NavLink>
            )}

            {user && isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
              >
                <Shield size={18} />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 mx-2" />

          {!user ? (
            <div className="flex items-center gap-1">
              <NavLink
                to="/login"
                className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Login</span>
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
              >
                <UserPlus size={18} />
                <span className="hidden sm:inline">Register</span>
              </NavLink>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={`transition-all duration-500 ease-in-out ${
                  showCreateButton
                    ? "opacity-100 translate-x-0 w-auto ml-0"
                    : "opacity-0 translate-x-4 w-0 -ml-4"
                }`}
                style={{
                  transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <Button
                  variant="primary"
                  onClick={() => nav("/events?create=true")}
                  className="whitespace-nowrap flex items-center gap-2 animate-fall-from-sky"
                >
                  <Plus size={16} />
                  <span>Create event</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">
                  {loggingOut ? "Logging out..." : "Logout"}
                </span>
              </Button>
            </div>
          )}
        </nav>
      </div>

      <style>{`
        @keyframes fallFromSky {
          0% {
            transform: translateY(-30px) rotate(-2deg);
            opacity: 0;
          }
          40% {
            transform: translateY(5px) rotate(1deg);
            opacity: 0.95;
          }
          70% {
            transform: translateY(-2px) rotate(-0.5deg);
          }
          100% {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
        }

        .animate-fall-from-sky {
          animation: fallFromSky 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </header>
  );
}