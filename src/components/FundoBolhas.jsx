function FundoBolhas({ variant = "emerald" }) {
  const cores = {
    emerald: {
      a: "bg-emerald-400/20",
      b: "bg-green-500/10",
      c: "bg-cyan-400/10",
      d: "bg-white/10 dark:bg-white/5",
    },
    blue: {
      a: "bg-blue-400/20",
      b: "bg-sky-500/10",
      c: "bg-cyan-400/10",
      d: "bg-white/10 dark:bg-white/5",
    },
    amber: {
      a: "bg-amber-400/20",
      b: "bg-orange-500/10",
      c: "bg-yellow-300/10",
      d: "bg-white/10 dark:bg-white/5",
    },
    rose: {
      a: "bg-rose-400/20",
      b: "bg-pink-500/10",
      c: "bg-fuchsia-400/10",
      d: "bg-white/10 dark:bg-white/5",
    },
    violet: {
      a: "bg-violet-400/20",
      b: "bg-indigo-500/10",
      c: "bg-fuchsia-400/10",
      d: "bg-white/10 dark:bg-white/5",
    },
  };

  const cor = cores[variant] || cores.emerald;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`
          absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl
          ${cor.a}
          animate-floatBubbleSlow
        `}
      />

      <div
        className={`
          absolute -left-20 top-32 h-64 w-64 rounded-full blur-3xl
          ${cor.b}
          animate-floatBubbleMedium
        `}
      />

      <div
        className={`
          absolute bottom-10 right-8 h-44 w-44 rounded-full blur-3xl
          ${cor.c}
          animate-floatBubbleFast
        `}
      />

      <div
        className={`
          absolute bottom-40 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl
          ${cor.d}
          animate-floatBubbleTiny
        `}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/30 dark:from-slate-950/20 dark:via-transparent dark:to-slate-950/60" />
    </div>
  );
}

export default FundoBolhas;