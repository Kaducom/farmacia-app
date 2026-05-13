import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  FileText,
  Menu as MenuIcon,
  Package,
  Syringe,
} from "lucide-react";

import TabButton from "./TabButton";

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

  const paginasDoMenu = useMemo(
    () => [
      "menu",
      "perfil",
      "baseProdutos",
      "mapeamentos",
      "backup",
      "notificacoes",
    ],
    []
  );

  const abasAdmin = [
    {
      id: "medicamentos",
      label: "Produtos",
      icon: Package,
      active: page === "medicamentos",
    },
    {
      id: "receitas",
      label: "Receitas",
      icon: FileText,
      active: page === "receitas",
    },
    {
      id: "posologia",
      label: "Posologia",
      icon: Syringe,
      active: page === "posologia",
    },
    {
      id: "menu",
      label: "Menu",
      icon: MenuIcon,
      active: paginasDoMenu.includes(page),
    },
  ];

  const abasComum = [
    {
      id: "receitas",
      label: "Receitas",
      icon: FileText,
      active: page === "receitas",
    },
    {
      id: "posologia",
      label: "Posologia",
      icon: Syringe,
      active: page === "posologia",
    },
    {
      id: "menu",
      label: "Menu",
      icon: MenuIcon,
      active: paginasDoMenu.includes(page),
    },
  ];

  const abas = isAdmin ? abasAdmin : abasComum;

  return (
    <motion.nav
      initial={false}
      animate={{
        y: overlayAberto ? "130%" : "0%",
        opacity: overlayAberto ? 0 : 1,
      }}
      transition={{
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`
        fixed bottom-0 left-0 z-50 w-full
        border-t border-gray-200/80 bg-white/86 px-2 pt-2
        app-bottom-nav-safe shadow-[0_-18px_55px_rgba(15,23,42,0.10)]
        backdrop-blur-2xl
        dark:border-white/10 dark:bg-[#0b1220]/88 dark:shadow-black/35
        ${overlayAberto ? "pointer-events-none" : ""}
      `}
    >
      <div
        className={`
          mx-auto grid max-w-4xl items-center gap-1
          ${abas.length === 4 ? "grid-cols-4" : "grid-cols-3"}
        `}
      >
        {abas.map((aba) => (
          <TabButton
            key={aba.id}
            icon={aba.icon}
            label={aba.label}
            active={aba.active}
            onClick={() => onNavigate(aba.id)}
          />
        ))}
      </div>
    </motion.nav>
  );
}

export default BottomNav;