import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkUser = async () => {
      try {
        const res = await authApi.me();
        if (mounted) {
          setUser(res?.user || null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      setUser,
      isAdmin: user?.role === "admin",
      login: async (email, password) => {
        try {
          const res = await authApi.login({ email, password });
          setUser(res.user);
          return res.user;
        } catch (err) {
          throw err;
        }
      },
      register: async (name, email, password) => {
        try {
          const res = await authApi.register({ name, email, password });
          setUser(res.user);
          return res.user;
        } catch (err) {
          throw err;
        }
      },
      logout: async () => {
        try {
          await authApi.logout();
          setUser(null);
        } catch (err) {
          console.error("Logout failed:", err);
          setUser(null);
        }
      },
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}