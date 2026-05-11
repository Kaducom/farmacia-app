import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Cloud,
  CloudOff,
  Copy,
  LogOut,
  Mail,
  Moon,
  Pencil,
  ReceiptText,
  Save,
  Shield,
  Sparkles,
  Stethoscope,
  User,
  X,
} from "lucide-react";

import FundoBolhas from "../components/FundoBolhas";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Perfil() {
  const {
    usuarioAtual,
    isAdmin,
    isVisitante,
    logout,
    atualizarMeuPerfil,
    garantirMeuPublicId,
  } = useAuth();

  const { theme, toggleTheme } = useTheme();

  const [nome, setNome] = useState(usuarioAtual?.nome || "");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);

  const dark = theme === "dark";

  useEffect(() => {
    setNome(usuarioAtual?.nome || "");
  }, [usuarioAtual?.nome]);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function salvarPerfil() {
    if (isVisitante) {
      mostrarToast(
        "Visitante usa Receitas e Posologia sem conta. Para salvar perfil na nuvem, crie uma conta.",
        "info"
      );
      return;
    }

    if (!nome.trim()) {
      mostrarToast("Digite seu nome", "erro");
      return;
    }

    setSalvando(true);

    const res = await atualizarMeuPerfil({
      nome: nome.trim(),
    });

    setSalvando(false);

    if (!res.ok) {
      mostrarToast(res.erro || "Erro ao salvar perfil", "erro");
      return;
    }

    setEditando(false);
    mostrarToast("Perfil atualizado ✨", "ok");
  }

  async function copiarId() {
    const id = usuarioAtual?.publicId;

    if (!id || isVisitante) {
      mostrarToast("Conta visitante não tem ID público fixo", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(id);
      mostrarToast("ID copiado 📋", "ok");
    } catch {
      mostrarToast("Não foi possível copiar o ID", "erro");
    }
  }

  async function gerarId() {
    if (isVisitante) {
      mostrarToast("Visitante não gera ID público", "info");
      return;
    }

    const id = await garantirMeuPublicId();

    if (!id) {
      mostrarToast("Não foi possível gerar ID", "erro");
      return;
    }

    mostrarToast(`ID pronto: ${id}`, "ok");
  }

  const nomeExibido =
    usuarioAtual?.nome ||
    (isVisitante ? "Visitante" : usuarioAtual?.email || "Usuário");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-5xl space-y-5 p-4 pb-32 text-gray-950 dark:text-white">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-700 via-emerald-800 to-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/30">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-emerald-300/10" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-white/20 bg-white/20 shadow-xl backdrop-blur-md">
              <User size={44} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-50">
                <Sparkles size={13} />
                {isVisitante ? "Uso rápido liberado" : "Conta ativa"}
              </div>

              <p className="truncate text-3xl font-black">{nomeExibido}</p>

              <p className="mt-1 truncate text-sm text-green-100">
                {isVisitante
                  ? "Modo visitante local"
                  : usuarioAtual?.email || "Conta Firebase"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip>
                  {isAdmin
                    ? "👑 Admin"
                    : isVisitante
                    ? "✨ Visitante"
                    : "👤 Usuário"}
                </Chip>

                <Chip>{isVisitante ? "Sem nuvem" : "Firebase ativo"}</Chip>

                <Chip>
                  {isVisitante
                    ? "Receitas + Posologia"
                    : "Perfil sincronizável"}
                </Chip>

                {!isVisitante && usuarioAtual?.publicId && (
                  <Chip>ID: {usuarioAtual.publicId}</Chip>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-red-500/20 px-5 py-3 font-black backdrop-blur-sm transition active:scale-95"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </section>

        {isVisitante && (
          <section className="rounded-[2rem] border border-blue-200 bg-blue-50/90 p-5 text-blue-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Sparkles size={24} />
              </div>

              <div>
                <h2 className="text-xl font-black">Modo visitante</h2>

                <p className="mt-1 text-sm">
                  Ideal para usar na hora, sem criar conta. O visitante pode usar
                  Receitas e Posologia normalmente. Para salvar perfil, nuvem,
                  histórico compartilhado ou recursos avançados, basta criar uma conta.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniAcesso
                    icon={ReceiptText}
                    titulo="Receitas"
                    texto="Calcule validade de receita sem cadastro."
                  />

                  <MiniAcesso
                    icon={Stethoscope}
                    titulo="Posologia"
                    texto="Calcule frascos, gotas e tratamento rápido."
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Pencil size={22} />
                Editar perfil
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dados simples da sua conta
              </p>
            </div>

            {!editando && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition active:scale-95"
              >
                Editar
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
              <User size={16} />
              Nome
            </label>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={!editando || isVisitante}
              placeholder={isVisitante ? "Visitante" : "Seu nome"}
              className="
                w-full rounded-2xl border border-gray-200 bg-gray-50
                px-4 py-3 font-semibold outline-none
                focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20
                disabled:opacity-70
                dark:border-white/10 dark:bg-white/5
              "
            />
          </div>

          <InfoRow
            icon={Mail}
            label="Email"
            value={
              isVisitante
                ? "Visitante sem email"
                : usuarioAtual?.email || "Não informado"
            }
          />

          {editando && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={salvarPerfil}
                disabled={salvando || isVisitante}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition active:scale-95 disabled:opacity-60"
              >
                <Save size={19} />
                {salvando ? "Salvando..." : "Salvar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setNome(usuarioAtual?.nome || "");
                  setEditando(false);
                }}
                className="rounded-2xl border border-gray-200 bg-gray-100 py-3 font-black text-gray-700 transition active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                Cancelar
              </button>
            </div>
          )}

          {isVisitante && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              ✨ Você está em modo visitante. Para salvar perfil na nuvem,
              crie uma conta na tela de login.
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Shield size={22} />
              Conta
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Identificação e estado da conta
            </p>
          </div>

          <InfoRow
            icon={isVisitante ? CloudOff : Cloud}
            label="Tipo de acesso"
            value={
              isAdmin
                ? "Administrador"
                : isVisitante
                ? "Visitante rápido"
                : "Usuário comum"
            }
          />

          <div className="rounded-2xl bg-gray-100/90 p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-white">
                  <Clipboard size={20} />
                </div>

                <div>
                  <p className="font-bold">ID público</p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Usado para admin encontrar sua conta
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 truncate rounded-2xl border border-gray-200 bg-white px-4 py-3 font-black dark:border-white/10 dark:bg-white/5">
                {isVisitante
                  ? "Visitante sem ID fixo"
                  : usuarioAtual?.publicId || "Sem ID"}
              </div>

              <button
                type="button"
                onClick={usuarioAtual?.publicId ? copiarId : gerarId}
                disabled={isVisitante}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white transition active:scale-95 disabled:opacity-60"
                aria-label="Copiar ou gerar ID"
              >
                {usuarioAtual?.publicId ? <Copy size={19} /> : <Save size={19} />}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Moon size={22} />
              Aparência
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajuste rápido do tema visual
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-gray-100/90 p-4 dark:bg-white/5">
            <div>
              <p className="font-bold">Modo Escuro</p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tema atual: {dark ? "escuro" : "claro"}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-7 w-14 items-center rounded-full px-1 transition-all ${
                dark ? "justify-end bg-green-500" : "justify-start bg-gray-400"
              }`}
            >
              <div className="h-5 w-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-100/90 p-4 dark:bg-white/5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <p className="truncate font-black">{value}</p>
      </div>
    </div>
  );
}

function MiniAcesso({ icon: Icon, titulo, texto }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 dark:bg-black/20">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={18} />
        <p className="font-black">{titulo}</p>
      </div>

      <p className="text-sm opacity-80">{texto}</p>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
      {children}
    </span>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="fixed left-1/2 top-5 z-[99999] w-[92%] max-w-sm -translate-x-1/2"
    >
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : info
              ? "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${
            erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>
    </motion.div>
  );
}

export default Perfil;
