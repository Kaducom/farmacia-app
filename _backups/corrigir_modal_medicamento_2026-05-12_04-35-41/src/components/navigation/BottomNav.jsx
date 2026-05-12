import {
  useEffect,
  useState,
} from "react";

import {
  Pill,
  FileText,
  Syringe,
  Brain,
  Menu as MenuIcon,
  UserRound,
} from "lucide-react";

import TabButton from "./TabButton";
import { motion } from "framer-motion";

function BottomNav({ page, isAdmin, onNavigate }) {
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

  const menuPages = [
    "baseProdutos",
    "mapeamentos",
    "backup",
    "notificacoes",
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        y: overlayAberto ? "140%" : "0%",
        opacity: overlayAberto ? 0 : 1,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className="
        fixed bottom-0 left-0 z-50 w-full
        border-t border-gray-200 bg-white/90 px-2 pt-2
        app-bottom-nav-safe backdrop-blur-md
        dark:border-gray-700 dark:bg-[#111827]/90
      "
    >
      <div className="mx-auto flex max-w-4xl justify-around">
        {isAdmin ? (
          <>
            <TabButton
              icon={Pill}
              label="Meds"
              active={page === "medicamentos"}
              onClick={() => onNavigate("medicamentos")}
            />

            <TabButton
              icon={Brain}
              label="AMSI"
              active={page === "doutor"}
              onClick={() => onNavigate("doutor")}
            />

            <TabButton
              icon={FileText}
              label="Receitas"
              active={page === "receitas"}
              onClick={() => onNavigate("receitas")}
            />

            <TabButton
              icon={Syringe}
              label="Posologia"
              active={page === "posologia"}
              onClick={() => onNavigate("posologia")}
            />

            <TabButton
              icon={MenuIcon}
              label="Menu"
              active={page === "menu" || menuPages.includes(page)}
              onClick={() => onNavigate("menu")}
            />
          </>
        ) : (
          <>
            <TabButton
              icon={FileText}
              label="Receitas"
              active={page === "receitas"}
              onClick={() => onNavigate("receitas")}
            />

            <TabButton
              icon={Syringe}
              label="Posologia"
              active={page === "posologia"}
              onClick={() => onNavigate("posologia")}
            />

            <TabButton
              icon={UserRound}
              label="Perfil"
              active={page === "perfil"}
              onClick={() => onNavigate("perfil")}
            />

            <TabButton
              icon={MenuIcon}
              label="Menu"
              active={page === "menu"}
              onClick={() => onNavigate("menu")}
            />
          </>
        )}
      </div>
    </motion.nav>
  );
}

export default BottomNav;
