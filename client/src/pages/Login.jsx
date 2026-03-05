import { useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="space-y-4 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-black/60">Welcome back to StudyDen.</p>
        </div>

        {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-black/70">Email</span>
            <input
              className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-[rgba(var(--ring),0.35)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-black/70">Password</span>
            <input
              className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-[rgba(var(--ring),0.35)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <Button className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-black/60">
          No account?{" "}
          <Link className="font-semibold text-black/80 hover:underline" to="/register">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}