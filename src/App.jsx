import { useState } from "react";
import {
  Pill,
  FileText,
  Syringe,
  Stethoscope,
  Menu as MenuIcon,
} from "lucide-react";

import Medicamentos from "./pages/Medicamentos";
import Receitas from "./pages/Receitas";
import Posologia from "./pages/Posologia";
import Doutor from "./pages/Doutor";
import Menu from "./pages/Menu";
import BaseProdutos from "./pages/BaseProdutos";

function App() {
  const [pagina, setPagina] = useState("medicamentos");

  const titulos = {
    medicamentos: "Medicamentos",
    receitas: "Receitas",
    posologia: "Posologia",
    doutor: "Assistente",
    menu: "Menu",
    baseProdutos: "Base de Produtos",
  };

  function renderPagina() {
    switch (pagina) {
      case "medicamentos":
        return <Medicamentos />;

      case "receitas":
        return <Receitas />;

      case "posologia":
        return <Posologia />;

      case "doutor":
        return <Doutor />;

      case "menu":
        return <Menu setPagina={setPagina} />;

      case "baseProdutos":
        return <BaseProdutos />;

      default:
        return <Medicamentos />;
    }
  }

  return (
    <div
      className="
        min-h-screen flex flex-col
        bg-gray-100 text-black
        transition-colors duration-300
        dark:bg-[#0f172a] dark:text-white
      "
    >
      <div
        className="
          sticky top-0 z-40 border-b border-gray-200/70
          bg-white/80 px-4 py-3 text-center text-lg font-black
          backdrop-blur-md dark:border-gray-700/70 dark:bg-[#111827]/80
        "
      >
        {titulos[pagina]}
      </div>

      <main className="flex-1 overflow-y-auto pb-24">{renderPagina()}</main>

      <nav
        className="
          fixed bottom-0 left-0 z-50 w-full
          border-t border-gray-200 bg-white/85 px-2 py-2
          backdrop-blur-md dark:border-gray-700 dark:bg-[#111827]/85
        "
      >
        <div className="mx-auto flex max-w-4xl justify-around">
          <Tab
            icon={Pill}
            label="Meds"
            ativa={pagina === "medicamentos"}
            onClick={() => setPagina("medicamentos")}
          />

          <Tab
            icon={FileText}
            label="Receitas"
            ativa={pagina === "receitas"}
            onClick={() => setPagina("receitas")}
          />

          <Tab
            icon={Syringe}
            label="Posologia"
            ativa={pagina === "posologia"}
            onClick={() => setPagina("posologia")}
          />

          <Tab
            icon={Stethoscope}
            label="Doutor"
            ativa={pagina === "doutor"}
            onClick={() => setPagina("doutor")}
          />

          <Tab
            icon={MenuIcon}
            label="Menu"
            ativa={pagina === "menu" || pagina === "baseProdutos"}
            onClick={() => setPagina("menu")}
          />
        </div>
      </nav>
    </div>
  );
}

function Tab({ icon: Icon, label, ativa, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2
        text-xs font-bold transition active:scale-95
        ${
          ativa
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }
      `}
    >
      <Icon size={21} />
      {label}
    </button>
  );
}

export default App;