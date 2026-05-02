import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export default function ToastStack({ notificacoes = [], remover }) {
  if (!notificacoes.length) return null;

  return (
    <div className="fixed left-1/2 top-5 z-[99999] flex w-[92%] max-w-sm -translate-x-1/2 flex-col gap-3">
      {notificacoes.map((n) => (
        <Toast key={n.id} data={n} remover={remover} />
      ))}
    </div>
  );
}

function Toast({ data, remover }) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => fechar(), 4000);
    return () => clearTimeout(timer);
  }, []);

  function fechar() {
    setSaindo(true);

    setTimeout(() => {
      remover(data.id);
    }, 250);
  }

  const config = {
    erro: {
      icon: AlertTriangle,
      container:
        "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300",
      iconBg: "bg-red-500",
    },
    aviso: {
      icon: AlertTriangle,
      container:
        "border-amber-300 bg-amber-50/95 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-200",
      iconBg: "bg-amber-500",
    },
    info: {
      icon: Info,
      container:
        "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300",
      iconBg: "bg-blue-500",
    },
    ok: {
      icon: CheckCircle2,
      container:
        "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300",
      iconBg: "bg-emerald-600",
    },
  };

  const tipo = config[data.tipo] ? data.tipo : "ok";
  const item = config[tipo];
  const Icon = item.icon;

  return (
    <div
      className={`
        flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
        transition-all duration-300
        ${item.container}
        ${saindo ? "translate-y-[-12px] scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"}
      `}
    >
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white
          ${item.iconBg}
        `}
      >
        <Icon size={20} />
      </div>

      <p className="flex-1 text-sm font-bold">{data.msg}</p>

      <button
        type="button"
        onClick={fechar}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
      >
        <X size={17} />
      </button>
    </div>
  );
}