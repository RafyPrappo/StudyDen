export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-grain rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}