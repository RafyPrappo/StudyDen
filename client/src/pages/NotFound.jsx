import { Link, useRouteError } from "react-router-dom";

export default function NotFound() {
  const err = useRouteError();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-slate-600">
        {err?.statusText || err?.message || "The page you requested doesn't exist."}
      </p>
      <Link to="/" className="inline-block rounded-md bg-slate-900 px-3 py-2 text-white">
        Go Home
      </Link>
    </div>
  );
}