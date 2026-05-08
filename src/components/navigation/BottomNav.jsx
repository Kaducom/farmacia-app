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
  const menuPages = [
    "menu",
    "baseProdutos",
    "mapeamentos",
    "backup",
    "perfil",
    "notificacoes",
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/90 px-2 pt-2 app-bottom-nav-safe backdrop-blur-md dark:border-gray-700 dark:bg-[#111827]/90">
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
    </nav>
  );
}

export default BottomNav;