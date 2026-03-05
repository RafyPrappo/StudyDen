import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    authApi
      .me()
      .then((res) => alive && setUser(res?.user || null))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setBooting(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      setUser,
      isAdmin: user?.role === "admin",
      login: async (email, password) => {
        const res = await authApi.login({ email, password });
        setUser(res.user);
        return res.user;
      },
      register: async (name, email, password) => {
        const res = await authApi.register({ name, email, password });
        setUser(res.user);
        return res.user;
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
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