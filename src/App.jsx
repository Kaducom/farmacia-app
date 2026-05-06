import { useState } from "react";
import Mapeamentos from "./pages/Mapeamentos";
import Backup from "./pages/Backup";
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
import Perfil from "./pages/Perfil";
import Notificacoes from "./pages/Notificacoes";
import { useAuth } from "./context/AuthContext";

function App() {
  const { usuarioAtual, isAdmin, login } = useAuth();
  const [pagina, setPagina] = useState(isAdmin ? "medicamentos" : "receitas");

  const titulos = {
    medicamentos: "Medicamentos",
    receitas: "Receitas",
    posologia: "Posologia",
    doutor: "Assistente",
    menu: "Menu",
    baseProdutos: "Base de Produtos",
    mapeamentos: "Mapeamentos",
    backup: "Backup",
    perfil: "Perfil",
    notificacoes: "Notificações",
  };

  if (!usuarioAtual) {
    return <TelaLogin login={login} />;
  }

  function irPara(p) {
    if (!isAdmin && !["receitas", "posologia", "menu", "perfil"].includes(p)) {
      setPagina("receitas");
      return;
    }

    setPagina(p);
  }

  function renderPagina() {
    switch (pagina) {
      case "medicamentos":
        return isAdmin ? <Medicamentos /> : <Receitas />;

      case "receitas":
        return <Receitas />;

      case "posologia":
        return <Posologia />;

      case "doutor":
        return isAdmin ? <Doutor /> : <Receitas />;

      case "menu":
        return <Menu setPagina={irPara} />;

      case "baseProdutos":
        return isAdmin ? <BaseProdutos /> : <Receitas />;

      case "mapeamentos":
        return isAdmin ? <Mapeamentos /> : <Receitas />;

      case "backup":
        return isAdmin ? <Backup /> : <Receitas />;

      case "perfil":
        return <Perfil />;

      case "notificacoes":
        return isAdmin ? <Notificacoes /> : <Receitas />;

      default:
        return isAdmin ? <Medicamentos /> : <Receitas />;
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-100 text-black transition-colors duration-300 dark:bg-[#0f172a] dark:text-white">
      <div className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 pt-safe text-center text-lg font-black backdrop-blur-md dark:border-gray-700/70 dark:bg-[#111827]/90">
        <div className="px-4 py-3">{titulos[pagina]}</div>
      </div>

      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
        {renderPagina()}
      </main>

      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/90 px-2 pt-2 app-bottom-nav-safe backdrop-blur-md dark:border-gray-700 dark:bg-[#111827]/90">
        <div className="mx-auto flex max-w-4xl justify-around">
          {isAdmin && (
            <Tab
              icon={Pill}
              label="Meds"
              ativa={pagina === "medicamentos"}
              onClick={() => irPara("medicamentos")}
            />
          )}

          <Tab
            icon={FileText}
            label="Receitas"
            ativa={pagina === "receitas"}
            onClick={() => irPara("receitas")}
          />

          <Tab
            icon={Syringe}
            label="Posologia"
            ativa={pagina === "posologia"}
            onClick={() => irPara("posologia")}
          />

          {isAdmin && (
            <Tab
              icon={Stethoscope}
              label="Doutor"
              ativa={pagina === "doutor"}
              onClick={() => irPara("doutor")}
            />
          )}

          <Tab
            icon={MenuIcon}
            label="Menu"
            ativa={[
              "menu",
              "baseProdutos",
              "mapeamentos",
              "backup",
              "perfil",
              "notificacoes",
            ].includes(pagina)}
            onClick={() => irPara("menu")}
          />
        </div>
      </nav>
    </div>
  );
}

function TelaLogin({ login }) {
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");

  function entrar() {
    setErro("");

    const ok = login(nome, pin);

    if (!ok) {
      setErro("Usuário ou PIN inválido");
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0f172a] p-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <h1 className="text-center text-2xl font-black">💊 Farmácia App</h1>

        <p className="mt-2 text-center text-sm text-gray-300">
          Entre com seu usuário local
        </p>

        {erro && (
          <div className="mt-4 rounded-2xl bg-red-500/15 p-3 text-center text-sm text-red-300">
            {erro}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Usuário"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />

          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            type="password"
            inputMode="numeric"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />

          <button
            onClick={entrar}
            className="w-full rounded-2xl bg-emerald-700 py-3 font-bold text-white active:scale-95"
          >
            Entrar
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Primeiro acesso admin: Kadu / 123
        </p>
      </div>
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