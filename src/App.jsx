import { useRef, useState } from "react";
import Mapeamentos from "./pages/Mapeamentos";
import Backup from "./pages/Backup";
import {
  Pill,
  FileText,
  Syringe,
  Stethoscope,
  Menu as MenuIcon,
  ArrowLeft,
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
  const {
  usuarioAtual,
  isAdmin,
  login,
  criarUsuario,
} = useAuth();
  const [pagina, setPagina] = useState(isAdmin ? "medicamentos" : "receitas");

  const paginasMenu = [
  "baseProdutos",
  "mapeamentos",
  "backup",
  "perfil",
  "notificacoes",
];

const mostrarVoltar =
  paginasMenu.includes(pagina);

function voltarPagina() {

  if (paginasMenu.includes(pagina)) {
    setPagina("menu");
    return;
  }

  if (!isAdmin) {
    setPagina("receitas");
    return;
  }

  setPagina("medicamentos");
}

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
    return <TelaLogin
  login={login}
  criarUsuario={criarUsuario}
/>;
  }

  function irPara(p) {
    if (!isAdmin && !["receitas", "posologia", "menu", "perfil"].includes(p)) {
      setPagina("receitas");
      return;
    }

    setPagina(p);
  }

  function renderPagina() {
    const paginasComuns = ["receitas", "posologia", "menu", "perfil"];

    if (!isAdmin && !paginasComuns.includes(pagina)) {
      return <Receitas />;
    }

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
<div
  className="
    sticky top-0 z-40 border-b border-gray-200/70
    bg-white/85 pt-safe
    backdrop-blur-md
    dark:border-gray-700/70
    dark:bg-[#111827]/90
  "
>
  <div className="relative flex items-center justify-center px-4 py-3">

    {mostrarVoltar && (
      <button
        type="button"
        onClick={voltarPagina}
        className="
          absolute left-3
          flex h-11 w-11 items-center justify-center
          rounded-2xl
          bg-gray-100 text-gray-700
          transition active:scale-95
          dark:bg-gray-800 dark:text-white
        "
      >
        <ArrowLeft size={21} />
      </button>
    )}

    <p className="text-lg font-black">
      {titulos[pagina]}
    </p>

  </div>
</div>

      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
        {renderPagina()}
      </main>

      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/90 px-2 pt-2 app-bottom-nav-safe backdrop-blur-md dark:border-gray-700 dark:bg-[#111827]/90">
        <div className="mx-auto flex max-w-4xl justify-around">
          {isAdmin && (
            <>
              <Tab
                icon={Pill}
                label="Meds"
                ativa={pagina === "medicamentos"}
                onClick={() => irPara("medicamentos")}
              />

              <Tab
                icon={Stethoscope}
                label="Doutor"
                ativa={pagina === "doutor"}
                onClick={() => irPara("doutor")}
              />
            </>
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

function TelaLogin({ login, criarUsuario }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  const senhaRef = useRef(null);

  async function entrar() {
    setErro("");
    setCarregando(true);

    const res = await login(email, senha);

    setCarregando(false);

    if (!res.ok) {
      setErro(res.erro || "Email ou senha inválidos");
      return;
    }

    if (navigator.vibrate) navigator.vibrate(30);
  }

  async function criarAdminInicial() {
    setErro("");
    setCarregando(true);

    const res = await criarUsuario({
      nome: "Kadu",
      email: "kadu@farmacia.com",
      senha: "123456",
      tipo: "admin",
    });

    setCarregando(false);

    if (!res.ok) {
      setErro(res.erro || "Erro ao criar admin");
      return;
    }

    setEmail("kadu@farmacia.com");
    setSenha("123456");
    setErro("Admin criado. Agora clique em Entrar ✨");
  }

  function handleEmailKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      senhaRef.current?.focus();
    }
  }

  function handleSenhaKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      entrar();
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#020617] p-4 text-white">
      <div className="absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-80px] top-32 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-green-700/20 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.25),rgba(2,6,23,1))]" />

        <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rotate-12 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-sm" />
        <div className="absolute left-[15%] bottom-24 h-24 w-24 -rotate-12 rounded-3xl border border-white/10 bg-white/5" />
        <div className="absolute right-[12%] bottom-32 h-32 w-32 rounded-full border border-emerald-300/10 bg-emerald-300/5" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center">
        <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 shadow-xl shadow-emerald-600/30">
            💊
          </div>

          <h1 className="text-center text-3xl font-black">Farmácia App</h1>

          <p className="mt-2 text-center text-sm text-gray-300">
            Acesse com email e senha
          </p>

          {erro && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/15 p-3 text-center text-sm font-semibold text-emerald-200">
              {erro}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-300">
                Email
              </label>

              <input
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="exemplo@email.com"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-300">
                Senha
              </label>

              <input
                ref={senhaRef}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleSenhaKeyDown}
                placeholder="Digite sua senha"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="button"
              onClick={entrar}
              disabled={carregando}
              className="mt-2 w-full rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"
            >
              {carregando ? "Carregando..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={criarAdminInicial}
              disabled={carregando}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 active:scale-95 disabled:opacity-60"
            >
              Criar admin inicial
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-gray-400">
            Primeiro acesso: <strong>kadu@farmacia.com / 123456</strong>
          </div>
        </div>
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