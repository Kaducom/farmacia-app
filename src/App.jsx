import { useState } from "react";
import Medicamentos from "./pages/Medicamentos";
import Receitas from "./pages/Receitas";
import Posologia from "./pages/Posologia";
import Doutor from "./pages/Doutor";
import Menu from "./pages/Menu";

function App() {
  const [pagina, setPagina] = useState("medicamentos");
  const [modoAuditoria, setModoAuditoria] = useState(false);
  const [relatorioAuditoria, setRelatorioAuditoria] = useState([]);

  function renderPagina() {
    switch (pagina) {
      case "medicamentos":
      return (
      <Medicamentos 
      modoAuditoria={modoAuditoria}
      setModoAuditoria={setModoAuditoria}
      relatorioAuditoria={relatorioAuditoria}
      setRelatorioAuditoria={setRelatorioAuditoria}
    />
  );
      case "receitas":
        return <Receitas />;
      case "posologia":
        return <Posologia />;
      case "doutor":
        return <Doutor />;
      case "menu":
      return (
      <Menu 
      setModoAuditoria={setModoAuditoria}
      relatorioAuditoria={relatorioAuditoria}
    />
  );
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-black dark:text-white">

      {/* 🔝 TOPO iOS */}
      <div className="pt-safe px-4 py-3 text-center font-semibold text-lg backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
        {pagina}
      </div>

      {/* 📄 CONTEÚDO */}
      <div className="flex-1 overflow-y-auto pb-24">
        {renderPagina()}
      </div>

      {/* 📍 BOTTOM NAV */}
      <div className="pb-safe fixed bottom-0 left-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-around py-2">

        <Tab icon="💊" label="Medicamentos" ativa={pagina === "medicamentos"} onClick={() => setPagina("medicamentos")} />
        <Tab icon="📄" label="Receitas" ativa={pagina === "receitas"} onClick={() => setPagina("receitas")} />
        <Tab icon="💉" label="Posologia" ativa={pagina === "posologia"} onClick={() => setPagina("posologia")} />
        <Tab icon="👨‍⚕️" label="Doutor" ativa={pagina === "doutor"} onClick={() => setPagina("doutor")} />
        <Tab icon="≡" label="Menu" ativa={pagina === "menu"} onClick={() => setPagina("menu")} />

      </div>
    </div>
  );
}

function Tab({ icon, label, ativa, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-xs transition ${
        ativa ? "text-blue-500" : "text-gray-500"
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

export default App;