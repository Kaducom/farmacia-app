import { ArrowLeft } from "lucide-react";

function AppHeader({
  title,
  showBack,
  onBack,
}) {
  return (
    <header
      className="
        sticky top-0 z-40 border-b border-gray-200/70
        bg-white/85 pt-safe
        backdrop-blur-md
        dark:border-gray-700/70
        dark:bg-[#111827]/90
      "
    >
      <div className="relative flex items-center justify-center px-4 py-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="
              absolute left-3
              flex h-11 w-11 items-center justify-center
              rounded-2xl
              bg-gray-100 text-gray-700
              transition active:scale-95
              dark:bg-gray-800 dark:text-white
            "
          >
            <ArrowLeft size={21} />
          </button>
        )}

        <p className="text-lg font-black">
          {title}
        </p>
      </div>
    </header>
  );
}

export default AppHeader;
