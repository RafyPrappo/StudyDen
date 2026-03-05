export default function Button({
  children,
  variant = "primary", // primary | ghost
  className = "",
  ...props
}) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
    "transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--ring),0.35)]";
  const styles = {
    primary:
      "text-black/80 shadow-[var(--shadow-soft)] " +
      "bg-gradient-to-r from-rose-100 via-sky-100 to-amber-100 " +
      "hover:brightness-95",

    ghost:
      "text-black/80 border border-black/10 bg-white/70 " +
      "hover:bg-white hover:border-black/15",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}