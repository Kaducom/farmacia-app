import { motion } from "framer-motion";

import {
  Activity,
  Loader2,
  Pill,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function LoadingScreen({
  text = "Carregando...",
  full = false,
}) {
  return (
    <div
      className={`
        relative flex items-center justify-center overflow-hidden
        bg-gradient-to-br from-emerald-50 via-white to-blue-50
        text-gray-950
        dark:from-[#020617] dark:via-[#0f172a] dark:to-[#022c22]
        dark:text-white
        ${full ? "min-h-[100dvh]" : "min-h-[45vh]"}
      `}
    >
      {/* FUNDO PREMIUM */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 28, -18, 0],
            y: [0, -24, 18, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            absolute -left-24 -top-24 h-72 w-72 rounded-full
            bg-emerald-400/25 blur-3xl
            dark:bg-emerald-400/15
          "
        />

        <motion.div
          animate={{
            x: [0, -24, 18, 0],
            y: [0, 22, -16, 0],
            scale: [1, 0.95, 1.08, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            absolute -bottom-28 -right-24 h-80 w-80 rounded-full
            bg-blue-400/25 blur-3xl
            dark:bg-blue-500/15
          "
        />

        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.14),transparent_34%)]
          "
        />

        <div
          className="
            absolute inset-0 opacity-[0.06]
            [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
            [background-size:34px_34px]
            dark:opacity-[0.08]
            dark:[background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]
          "
        />
      </div>

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
        className="
          relative mx-4 w-full max-w-sm overflow-hidden rounded-[2rem]
          border border-white/70 bg-white/80 p-6 text-center
          shadow-2xl shadow-emerald-900/10 backdrop-blur-2xl
          dark:border-white/10 dark:bg-white/10 dark:shadow-black/30
        "
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-blue-400/20 blur-2xl" />

        {/* ÍCONE COM ORBITA */}
        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="
              absolute inset-0 rounded-[2rem]
              bg-[conic-gradient(from_0deg,transparent,rgba(16,185,129,0.95),transparent,rgba(59,130,246,0.85),transparent)]
              p-[2px]
            "
          >
            <div className="h-full w-full rounded-[1.9rem] bg-white dark:bg-[#0f172a]" />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.06, 1],
              rotate: [0, -3, 3, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              relative flex h-20 w-20 items-center justify-center rounded-[1.65rem]
              bg-gradient-to-br from-emerald-500 via-emerald-700 to-slate-950
              text-white shadow-2xl shadow-emerald-700/30
            "
          >
            <Pill size={36} strokeWidth={2.5} />

            <motion.div
              animate={{
                opacity: [0.45, 1, 0.45],
                scale: [0.9, 1.12, 0.9],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center
                rounded-full bg-white text-emerald-700 shadow-lg
              "
            >
              <Sparkles size={14} />
            </motion.div>
          </motion.div>
        </div>

        {/* TEXTO */}
        <div className="relative">
          <div
            className="
              mx-auto mb-3 inline-flex items-center gap-2 rounded-full
              border border-emerald-200 bg-emerald-50 px-3 py-1
              text-[11px] font-black uppercase tracking-[0.22em]
              text-emerald-700
              dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300
            "
          >
            <ShieldCheck size={14} />
            Farmácia App
          </div>

          <h2 className="text-xl font-black tracking-tight">
            Preparando o balcão digital
          </h2>

          <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-300">
            {text}
          </p>
        </div>

        {/* BARRA */}
        <div className="relative mt-6 overflow-hidden rounded-full bg-gray-200/80 p-1 dark:bg-white/10">
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-black/20">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "120%" }}
              transition={{
                duration: 1.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute inset-y-0 h-full w-1/2 rounded-full
                bg-gradient-to-r from-transparent via-emerald-500 to-transparent
              "
            />
          </div>
        </div>

        {/* STATUS */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-black text-gray-500 dark:text-gray-400">
          <Loader2 size={15} className="animate-spin text-emerald-600 dark:text-emerald-300" />
          <span>Sincronizando interface</span>
          <Activity size={15} className="text-blue-500" />
        </div>

        {/* PONTINHOS */}
        <div className="mt-5 flex justify-center gap-2">
          {[0, 1, 2].map((item) => (
            <motion.span
              key={item}
              animate={{
                opacity: [0.25, 1, 0.25],
                y: [0, -4, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: item * 0.18,
                ease: "easeInOut",
              }}
              className="h-2 w-2 rounded-full bg-emerald-500"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LoadingScreen;