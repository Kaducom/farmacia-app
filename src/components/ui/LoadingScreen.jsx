import { motion } from "framer-motion";

import {
  Loader2,
  Rocket,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

function LoadingScreen({
  text = "Carregando...",
  full = false,
}) {
  return (
    <div
      className={`
        relative flex overflow-hidden bg-[#020806] text-white
        ${full ? "min-h-[100dvh]" : "min-h-[62dvh]"}
        items-center justify-center px-4
      `}
    >
      <FundoLoading />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          relative z-10 w-full max-w-sm rounded-[2.2rem]
          border border-white/10 bg-white/10 p-6 text-center
          shadow-2xl shadow-black/45 backdrop-blur-2xl
        "
      >
        <div className="mx-auto mb-5 flex w-fit flex-col items-center">
          <motion.div
            animate={{
              y: [0, -9, 0],
              rotate: [-1.5, 1.5, -1.5],
            }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/35 blur-2xl" />

            <div
              className="
                relative flex h-24 w-24 items-center justify-center overflow-hidden
                rounded-[2rem] border border-white/15 bg-[#062018]
                shadow-2xl shadow-emerald-600/25
              "
            >
              <img
                src="/icons/icon-512.png"
                alt="AVISAI"
                className="h-full w-full object-cover"
              />
            </div>

            <motion.div
              animate={{
                y: [0, -8, 0],
                opacity: [0.72, 1, 0.72],
              }}
              transition={{
                duration: 1.35,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center
                rounded-2xl border border-white/15 bg-emerald-500 text-white
                shadow-lg shadow-emerald-500/30
              "
            >
              <Rocket size={19} />
            </motion.div>
          </motion.div>

          <div className="mt-4">
            <p className="text-3xl font-black tracking-[0.18em]">
              AVISAI
            </p>

            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
              Inteligência em saúde
            </p>
          </div>
        </div>

        <div
          className="
            mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full
            border border-emerald-300/20 bg-emerald-400/10 px-3 py-1
            text-[11px] font-black uppercase tracking-wide text-emerald-100
          "
        >
          <Sparkles size={13} />
          Preparando decolagem
        </div>

        <h1 className="text-xl font-black">
          {text}
        </h1>

        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-300">
          Organizando produtos, validade, estoque e scanner para a missão.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="
              flex h-11 w-11 items-center justify-center rounded-2xl
              bg-emerald-600 text-white shadow-lg shadow-emerald-600/25
            "
          >
            <Loader2 size={22} />
          </motion.div>

          <div className="flex gap-1.5">
            {[0, 1, 2].map((item) => (
              <motion.span
                key={item}
                animate={{
                  y: [0, -7, 0],
                  opacity: [0.45, 1, 0.45],
                }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: item * 0.14,
                  ease: "easeInOut",
                }}
                className="h-2.5 w-2.5 rounded-full bg-emerald-300"
              />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-100/85">
            <ShieldCheck size={15} />
            Gestão, confiança e cuidado
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FundoLoading() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute right-[-80px] top-32 h-72 w-72 rounded-full bg-lime-500/16 blur-3xl" />
      <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-green-700/20 blur-3xl" />

      <motion.div
        animate={{
          y: [-10, 12, -10],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2
          rounded-[4rem] border border-white/10 bg-white/[0.045]
          backdrop-blur-sm
        "
      />

      <motion.div
        animate={{
          y: [0, -18, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute left-[12%] bottom-24 hidden h-24 w-24 -rotate-12
          rounded-3xl border border-white/10 bg-white/5 sm:block
        "
      />

      <motion.div
        animate={{
          y: [0, 22, 0],
          x: [0, -12, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute right-[10%] bottom-28 hidden h-32 w-32 rounded-full
          border border-emerald-300/10 bg-emerald-300/5 sm:block
        "
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.22),rgba(2,8,6,1))]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px] opacity-20" />
    </div>
  );
}

export default LoadingScreen;