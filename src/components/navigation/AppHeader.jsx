import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  BellRing,
  Brain,
  Database,
  Download,
  FileText,
  History,
  Home,
  Package,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

const titleIcons = {
  produtos: Package,
  medicamentos: Package,
  receitas: FileText,
  posologia: Stethoscope,
  amsi: Brain,
  doutor: Brain,
  assistente: Brain,
  menu: Home,
  "base de produtos": PackageSearch,
  mapeamentos: History,
  backup: Download,
  perfil: UserRound,
  notificações: BellRing,
  notificacoes: BellRing,
};

const subtitles = {
  produtos: "Controle de validade e estoque",
  medicamentos: "Controle de validade e estoque",
  receitas: "Validade de receitas e conferência",
  posologia: "Cálculos rápidos de tratamento",
  amsi: "Estudo, consulta e treinamento",
  doutor: "Estudo, consulta e treinamento",
  menu: "Ferramentas e configurações",
  "base de produtos": "Produtos aprendidos pelo scanner",
  mapeamentos: "Histórico de contagens e auditorias",
  backup: "Segurança dos dados locais",
  perfil: "Conta, foto e preferências",
  notificações: "Alertas e lembretes",
  notificacoes: "Alertas e lembretes",
};

function AppHeader({ title, showBack, onBack }) {
  const [overlayAberto, setOverlayAberto] = useState(false);

  useEffect(() => {
    function ouvirOverlay(e) {
      setOverlayAberto(Boolean(e.detail?.open));
    }

    window.addEventListener("app-overlay-change", ouvirOverlay);

    return () => {
      window.removeEventListener("app-overlay-change", ouvirOverlay);
    };
  }, []);

  const chaveTitulo = useMemo(() => {
    return String(title || "")
      .trim()
      .toLowerCase();
  }, [title]);

  const IconeTitulo = useMemo(() => {
    return titleIcons[chaveTitulo] || ShieldCheck;
  }, [chaveTitulo]);

  const subtitulo = subtitles[chaveTitulo] || "Farmácia App";

  return (
    <motion.header
      initial={false}
      animate={{
        y: overlayAberto ? "-110%" : "0%",
        opacity: overlayAberto ? 0 : 1,
      }}
      transition={{
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`
        sticky top-0 z-40
        border-b border-gray-200/70 bg-white/84
        pt-[env(safe-area-inset-top)]
        shadow-sm shadow-black/[0.03] backdrop-blur-2xl
        dark:border-white/10 dark:bg-[#0f172a]/90
        ${overlayAberto ? "pointer-events-none" : ""}
      `}
    >
      <div
        className="
          mx-auto flex min-h-[64px] max-w-6xl items-center justify-between
          gap-3 px-4 py-2.5
        "
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showBack && (
            <motion.button
              type="button"
              onClick={onBack}
              aria-label="Voltar para o menu"
              whileTap={{ scale: 0.92 }}
              className="
                flex h-11 w-11 shrink-0 items-center justify-center
                rounded-2xl border border-gray-200 bg-gray-100 text-gray-700
                shadow-sm transition hover:bg-gray-200
                dark:border-white/10 dark:bg-white/10 dark:text-white
                dark:hover:bg-white/15
              "
            >
              <ArrowLeft size={21} strokeWidth={2.8} />
            </motion.button>
          )}

          <div
            className="
              flex h-12 w-12 shrink-0 items-center justify-center
              overflow-hidden rounded-2xl
              bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950
              text-white shadow-lg shadow-emerald-700/20
            "
          >
            <IconeTitulo size={23} strokeWidth={2.6} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p
                className="
                  truncate text-lg font-black tracking-tight
                  text-gray-950 dark:text-white
                "
              >
                {title || "Farmácia App"}
              </p>

              {!showBack && (
                <span
                  className="
                    hidden items-center gap-1 rounded-full
                    bg-emerald-100 px-2 py-0.5 text-[10px] font-black
                    uppercase tracking-wide text-emerald-700
                    dark:bg-emerald-500/15 dark:text-emerald-300
                    sm:inline-flex
                  "
                >
                  <Sparkles size={11} />
                  App
                </span>
              )}
            </div>

            <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">
              {showBack ? "Voltar para o menu" : subtitulo}
            </p>
          </div>
        </div>

        <div
          className="
            hidden h-10 items-center gap-2 rounded-2xl
            border border-gray-200 bg-gray-100 px-3
            text-xs font-black text-gray-500
            dark:border-white/10 dark:bg-white/5 dark:text-gray-300
            sm:flex
          "
        >
          <Database size={15} />
          Local
        </div>
      </div>
    </motion.header>
  );
}

export default AppHeader;