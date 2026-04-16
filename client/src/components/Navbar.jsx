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
  Shield,
  Menu,
} from "lucide-react";

const linkBase =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-blue-600 hover:bg-blue-50";
const active = "bg-blue-50 text-blue-600";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const data = await userApi.getNotifications(1);
      setUnreadNotifications(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const gatedTo = (path) => (user ? path : "/login");

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
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50 overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 gap-2">
        <NavLink
          to="/"
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white flex-shrink-0">
            SD
          </div>
          <span className="text-lg font-semibold text-gray-900 truncate">
            StudyDen
          </span>
        </NavLink>

        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <nav className="hidden lg:flex items-center">
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <Home size={18} />
              <span className="hidden xl:inline">Home</span>
            </NavLink>

            <NavLink
              to={gatedTo("/spots")}
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <MapPin size={18} />
              <span className="hidden xl:inline">Spots</span>
            </NavLink>

            <NavLink
              to={gatedTo("/events")}
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <Calendar size={18} />
              <span className="hidden xl:inline">Events</span>
            </NavLink>

            <NavLink
              to={gatedTo("/leaderboard")}
              className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
            >
              <Trophy size={18} />
              <span className="hidden xl:inline">Leaderboard</span>
            </NavLink>

            {user && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : ""} relative`
                }
              >
                <User size={18} />
                <span className="hidden xl:inline">Profile</span>
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
                <span className="hidden xl:inline">Admin</span>
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
                <span className="hidden xl:inline">Login</span>
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
              >
                <UserPlus size={18} />
                <span className="hidden xl:inline">Register</span>
              </NavLink>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                <span className="hidden xl:inline">
                  {loggingOut ? "Logging out..." : "Logout"}
                </span>
              </Button>
            </div>
          )}
        </nav>
      </div>

      <div
        className={`lg:hidden overflow-hidden bg-white transition-all duration-300 ease-out ${
          menuOpen
            ? "max-h-[500px] opacity-100 border-t border-gray-200"
            : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`px-4 py-4 space-y-2 transform transition-all duration-300 ease-out ${
            menuOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
        >
          <NavLink to="/" className={linkBase} onClick={() => setMenuOpen(false)}>
            <Home size={18} /> Home
          </NavLink>

          <NavLink
            to={gatedTo("/spots")}
            className={linkBase}
            onClick={() => setMenuOpen(false)}
          >
            <MapPin size={18} /> Spots
          </NavLink>

          <NavLink
            to={gatedTo("/events")}
            className={linkBase}
            onClick={() => setMenuOpen(false)}
          >
            <Calendar size={18} /> Events
          </NavLink>

          <NavLink
            to={gatedTo("/leaderboard")}
            className={linkBase}
            onClick={() => setMenuOpen(false)}
          >
            <Trophy size={18} /> Leaderboard
          </NavLink>

          {user && (
            <NavLink
              to="/profile"
              className={linkBase}
              onClick={() => setMenuOpen(false)}
            >
              <User size={18} /> Profile
            </NavLink>
          )}

          {user && isAdmin && (
            <NavLink
              to="/admin"
              className={linkBase}
              onClick={() => setMenuOpen(false)}
            >
              <Shield size={18} /> Admin
            </NavLink>
          )}

          <div className="border-t pt-3 mt-3" />

          {!user ? (
            <>
              <NavLink
                to="/login"
                className={linkBase}
                onClick={() => setMenuOpen(false)}
              >
                <LogIn size={18} /> Login
              </NavLink>

              <NavLink
                to="/register"
                className={linkBase}
                onClick={() => setMenuOpen(false)}
              >
                <UserPlus size={18} /> Register
              </NavLink>
            </>
          ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
              className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-600"            
              >
              <LogOut size={16} /> Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}