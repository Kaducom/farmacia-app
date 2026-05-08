function LoadingScreen({
  text = "Carregando...",
  full = false,
}) {
  return (
    <div
      className={`
        flex items-center justify-center
        bg-gray-100 text-gray-800
        dark:bg-[#0f172a] dark:text-white
        ${full ? "min-h-[100dvh]" : "min-h-[45vh]"}
      `}
    >
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-black/5 bg-white/80 px-6 py-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl shadow-lg shadow-emerald-600/25">
          💊
        </div>

        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
            Farmácia App
          </p>

          <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-300">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;