import { motion } from "framer-motion";

function TabButton({ icon: Icon, label, active, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={`
        relative flex min-w-[64px] flex-col items-center justify-center gap-1
        rounded-2xl px-2.5 py-2 text-[11px] font-black
        transition
        ${
          active
            ? "text-white"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        }
      `}
    >
      {active && (
        <motion.div
          layoutId="bottom-nav-active-bg"
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 34,
          }}
          className="
            absolute inset-0 rounded-2xl
            bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950
            shadow-lg shadow-emerald-700/25
          "
        />
      )}

      <span
        className={`
          relative flex h-8 w-8 items-center justify-center rounded-xl transition
          ${
            active
              ? "bg-white/15 text-white"
              : "bg-transparent text-inherit"
          }
        `}
      >
        <Icon size={20} strokeWidth={active ? 2.8 : 2.35} />
      </span>

      <span className="relative max-w-[70px] truncate leading-none">
        {label}
      </span>
    </motion.button>
  );
}

export default TabButton;
