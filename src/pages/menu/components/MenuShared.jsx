import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  X,
} from "lucide-react";

export function PageShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-gray-950 dark:text-white">
      {children}
    </div>
  );
}

export function BackHeader({ icon: Icon, title, description, setPagina, right }) {
  return (
    <header className="relative z-10 mx-auto max-w-6xl px-4 pb-2 pt-4">
      <div className="flex items-center justify-between gap-3 rounded-[1.7rem] border border-gray-200 bg-white/85 p-3 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setPagina("menu")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition active:scale-95 dark:bg-white/10 dark:text-white"
            aria-label="Voltar para o menu"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 sm:flex">
              <Icon size={22} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-black sm:text-2xl">{title}</h1>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                {description}
              </p>
            </div>
          </div>
        </div>

        {right}
      </div>
    </header>
  );
}

export function SectionTitle({ icon: Icon, title, description, noMargin = false }) {
  return (
    <div className={noMargin ? "" : "mb-3"}>
      <h2 className="flex items-center gap-2 text-lg font-black sm:text-xl">
        <Icon size={21} />
        {title}
      </h2>

      <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
        {description}
      </p>
    </div>
  );
}

export function MetricPremium({
  icon: Icon,
  titulo,
  valor,
  descricao,
  alerta = false,
  aviso = false,
}) {
  const destaque = alerta
    ? "text-red-500"
    : aviso
    ? "text-amber-500"
    : "text-emerald-600 dark:text-emerald-300";

  const bg = alerta
    ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
    : aviso
    ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
    : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5";

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${bg}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 sm:text-xs">
          {titulo}
        </p>
        <Icon size={17} className={destaque} />
      </div>

      <p className={`text-2xl font-black sm:text-3xl ${destaque}`}>{valor}</p>

      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
        {descricao}
      </p>
    </div>
  );
}

export function ActionCard({
  icon: Icon,
  titulo,
  descricao,
  destaque,
  onClick,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[1.45rem] border border-gray-200 bg-gray-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] dark:border-white/10 dark:bg-white/5 sm:rounded-[1.7rem] sm:p-4 ${
        compact ? "min-h-[128px]" : "min-h-[136px]"
      }`}
    >
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${destaque} opacity-20 blur-xl transition group-hover:opacity-35`} />

      <div className="relative flex items-center justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${destaque} text-white shadow-lg sm:h-14 sm:w-14`}>
          <Icon size={compact ? 22 : 24} />
        </div>

        <span className="text-gray-400 transition group-hover:translate-x-1">›</span>
      </div>

      <div className="relative mt-3">
        <p className="text-sm font-black sm:text-base">{titulo}</p>
        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {descricao}
        </p>
      </div>
    </button>
  );
}

export function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[99999] flex justify-center px-3"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl sm:max-w-md ${
          erro
            ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
            : info
            ? "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300"
            : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${
            erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="min-w-0 flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
          aria-label="Fechar aviso"
        >
          <X size={17} />
        </button>
      </div>
    </motion.div>
  );
}

export function ModalConfirmarSair({ isVisitante, onCancel, onConfirm }) {
  return (
    <motion.div
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 22, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-white p-6 text-gray-950 shadow-2xl dark:bg-gray-950 dark:text-white"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-600/25">
          <LogOut size={30} />
        </div>

        <h2 className="text-center text-xl font-black">Sair da conta?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {isVisitante
            ? "Você vai sair do modo visitante e voltar para a tela inicial."
            : "Sua sessão será encerrada e o app voltará para a tela de login."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-2xl bg-gray-100 font-black text-gray-700 transition active:scale-95 dark:bg-white/10 dark:text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 active:scale-95"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HeroAvatar({ usuarioAtual, nome }) {
  const foto = usuarioAtual?.fotoPerfil;

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.45rem] border border-white/20 bg-white/15 shadow-xl backdrop-blur-md sm:h-20 sm:w-20 sm:rounded-[1.7rem]">
      {foto ? (
        <img src={foto} alt={nome || "Usuário"} className="h-full w-full object-cover" />
      ) : (
        <span className="text-2xl font-black text-white sm:text-3xl">
          {obterIniciais(nome)}
        </span>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/80 p-5 text-center dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
        <Icon size={22} />
      </div>

      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export function obterIniciais(nome) {
  const partes = String(nome || "U").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}
