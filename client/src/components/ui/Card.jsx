export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "bg-grain rounded-[var(--r-lg)] border border-black/5 " +
        "bg-white/80 shadow-[var(--shadow-soft)] backdrop-blur-xl " +
        "transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] " +
        className
      }
    >
      {children}
    </div>
  );
}