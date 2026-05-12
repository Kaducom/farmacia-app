import {
  Pill,
  FileText,
  Syringe,
  Brain,
  Menu as MenuIcon,
  UserRound,
} from "lucide-react";

import TabButton from "./TabButton";

function BottomNav({ page, isAdmin, onNavigate }) {
  const menuPages = [
    "baseProdutos",
    "mapeamentos",
    "backup",
    "notificacoes",
  ];

  return (
    <nav
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
    </nav>
  );
}

export default BottomNav;
