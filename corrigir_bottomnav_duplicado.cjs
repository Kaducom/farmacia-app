/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const REL = path.join("src", "components", "navigation", "BottomNav.jsx");
const ARQ = path.join(ROOT, REL);

const STAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);

const BACKUP_DIR = path.join(ROOT, "_backups", `corrigir_bottomnav_duplicado_${STAMP}`);

if (!fs.existsSync(ARQ)) {
  console.error(`❌ Não achei ${REL}`);
  process.exit(1);
}

fs.mkdirSync(path.join(BACKUP_DIR, path.dirname(REL)), { recursive: true });
fs.copyFileSync(ARQ, path.join(BACKUP_DIR, REL));

const novo = `import {
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  Pill,
  FileText,
  Syringe,
  Stethoscope,
  Menu as MenuIcon,
} from "lucide-react";

import TabButton from "./TabButton";

function BottomNav({
  page,
  isAdmin,
  onNavigate,
}) {
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
    "menu",
    "baseProdutos",
    "mapeamentos",
    "backup",
    "perfil",
    "notificacoes",
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        y: overlayAberto ? "135%" : "0%",
        opacity: overlayAberto ? 0 : 1,
        pointerEvents: overlayAberto ? "none" : "auto",
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className="
        fixed bottom-0 left-0 z-50 w-full
        border-t border-gray-200
        bg-white/90 px-2 pt-2 app-bottom-nav-safe
        backdrop-blur-md
        dark:border-gray-700 dark:bg-[#111827]/90
      "
    >
      <div className="mx-auto flex max-w-4xl justify-around">
        {isAdmin && (
          <>
            <TabButton
              icon={Pill}
              label="Meds"
              active={page === "medicamentos"}
              onClick={() => onNavigate("medicamentos")}
            />

            <TabButton
              icon={Stethoscope}
              label="Doutor"
              active={page === "doutor"}
              onClick={() => onNavigate("doutor")}
            />
          </>
        )}

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
          active={menuPages.includes(page)}
          onClick={() => onNavigate("menu")}
        />
      </div>
    </motion.nav>
  );
}

export default BottomNav;
`;

fs.writeFileSync(ARQ, novo, "utf8");

console.log("✅ BottomNav.jsx corrigido sem overlayAberto duplicado.");
console.log(`🛟 Backup salvo em: ${BACKUP_DIR}`);
console.log("");
console.log("Agora rode:");
console.log("npm run dev");
console.log("");
console.log("Conferência:");
console.log('Select-String -Path src\\components\\navigation\\BottomNav.jsx -Pattern "overlayAberto|motion.nav|app-overlay-change" -Context 1,2');
