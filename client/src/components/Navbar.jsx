import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const linkBase =
  "rounded-md px-3 py-2 text-sm font-medium transition hover:bg-black/5 text-black/80";
const active = "bg-black/10";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const gatedTo = (path) => (user ? path : "/login");
  const gatedState = (path) => (user ? undefined : { from: path });

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout(); // clears cookie + sets user null
      nav("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* LEFT — LOGO / HOME BUTTON */}
        <NavLink
          to="/"
          className="group flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-black/5"
        >
          {/* icon */}
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-rose-100 via-sky-100 to-amber-100 shadow-md flex items-center justify-center font-extrabold text-black">
            SD
          </div>

          {/* text logo */}
          <span className="text-lg font-extrabold tracking-tight bg-[linear-gradient(90deg,rgba(var(--accent),1),rgba(var(--primary),1),rgba(var(--warm),1))] bg-clip-text text-transparent">
            StudyDen
          </span>
        </NavLink>

        {/* RIGHT — NAV LINKS */}
        <nav className="flex items-center gap-1">
          <NavLink
            to={gatedTo("/spots")}
            state={gatedState("/spots")}
            className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
          >
            Spots
          </NavLink>

          <NavLink
            to={gatedTo("/events")}
            state={gatedState("/events")}
            className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
          >
            Events
          </NavLink>

          <NavLink
            to={gatedTo("/leaderboard")}
            state={gatedState("/leaderboard")}
            className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
          >
            Leaderboard
          </NavLink>

          <div className="mx-2 h-6 w-px bg-black/10" />

          {!user ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `${linkBase} ${isActive ? active : ""}`}
              >
                Register
              </NavLink>
            </>
          ) : (
            <Button variant="ghost" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}