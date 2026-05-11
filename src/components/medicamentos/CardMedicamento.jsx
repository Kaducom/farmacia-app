import { motion } from "framer-motion";

import {
  Barcode,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  ImageIcon,
  Package,
  Pencil,
  Pill,
  Trash2,
  TriangleAlert,
  AlertTriangle,
  XCircle,
} from "lucide-react";

function CardMedicamento({
  m,
  calcularStatus,
  calcularDatas,
  formatarData,

  setPreview,
  setConfirmar,

  setEditando,
  setNome,
  setValidade,
  setImagem,
  setDiasPre,
  setDiasRemover,
  setQuantidade,
  setAbrirModal,
  setFabOpen,
}) {
  const status = calcularStatus(m);
  const { validade, remover, pre } = calcularDatas(m);

  const statusMap = {
    vencido: {
      label: "Vencido",
      descricao: "Retirar imediatamente",
      icon: XCircle,
      badge:
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
      iconBox: "bg-red-600 text-white",
      border: "border-red-200 dark:border-red-500/20",
      soft: "bg-red-50 dark:bg-red-500/10",
    },

    remover: {
      label: "Remover",
      descricao: "Tirar da prateleira",
      icon: AlertTriangle,
      badge:
        "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
      iconBox: "bg-orange-600 text-white",
      border: "border-orange-200 dark:border-orange-500/20",
      soft: "bg-orange-50 dark:bg-orange-500/10",
    },

    pre: {
      label: "Pré-vencimento",
      descricao: "Atenção para ação",
      icon: Clock3,
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      iconBox: "bg-amber-500 text-white",
      border: "border-amber-200 dark:border-amber-500/20",
      soft: "bg-amber-50 dark:bg-amber-500/10",
    },

    ok: {
      label: "Em dia",
      descricao: "Estoque tranquilo",
      icon: CheckCircle2,
      badge:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      iconBox: "bg-emerald-700 text-white",
      border: "border-emerald-200 dark:border-emerald-500/20",
      soft: "bg-emerald-50 dark:bg-emerald-500/10",
    },
  };

  const statusInfo = statusMap[status] || statusMap.ok;
  const StatusIcon = statusInfo.icon;

  function abrirConfirmacao() {
    setConfirmar(m);
  }

  function abrirEdicao() {
    setEditando(m);
    setNome(m.nome || "");
    setValidade(m.validade || "");
    setImagem(m.imagem || null);
    setDiasPre(m.diasPreVencido || "");
    setDiasRemover(m.diasRemover || 7);

    if (setQuantidade) {
      setQuantidade(m.quantidade || 1);
    }

    setAbrirModal(true);
    setFabOpen(false);
  }

  function calcularDiasAte(data) {
    if (!data) return null;

    const alvo = new Date(data);

    if (Number.isNaN(alvo.getTime())) {
      return null;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    alvo.setHours(0, 0, 0, 0);

    return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
  }

  function textoDistancia(data) {
    const dias = calcularDiasAte(data);

    if (dias === null) return "Sem cálculo";
    if (dias === 0) return "Hoje";
    if (dias === 1) return "Amanhã";
    if (dias === -1) return "Ontem";
    if (dias < 0) return `${Math.abs(dias)} dias atrás`;

    return `Em ${dias} dias`;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        overflow-hidden rounded-3xl border bg-white/85 p-4 shadow-sm backdrop-blur-xl
        dark:bg-gray-950/45
        ${statusInfo.border}
      `}
    >
      {/* TOPO */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            if (m.imagem) {
              setPreview(m.imagem);
            }
          }}
          className={`
            relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden
            rounded-2xl shadow-inner transition active:scale-95
            ${m.imagem ? "bg-gray-100 dark:bg-gray-800" : statusInfo.iconBox}
          `}
        >
          {m.imagem ? (
            <>
              <img
                src={m.imagem}
                alt={m.nome || "Imagem do medicamento"}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition hover:bg-black/35 hover:opacity-100">
                <Eye size={20} />
              </div>
            </>
          ) : (
            <ImageIcon size={27} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge statusInfo={statusInfo} StatusIcon={StatusIcon} />

            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              <Package size={13} />
              x{Number(m.quantidade || 1)}
            </span>
          </div>

          <h2 className="mt-2 break-words text-lg font-black leading-tight text-gray-950 dark:text-white">
            {m.nome || "Medicamento sem nome"}
          </h2>

          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {statusInfo.descricao}
          </p>

          {m.codigo && (
            <p className="mt-2 flex items-center gap-1 truncate text-xs text-gray-400">
              <Barcode size={14} />
              {m.codigo}
            </p>
          )}
        </div>
      </div>

      {/* LINHA DO TEMPO */}
      <div className={`mt-4 rounded-3xl p-4 ${statusInfo.soft}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-gray-950 dark:text-white">
              Linha do tempo
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Datas importantes deste lote
            </p>
          </div>

          <div className={`rounded-2xl p-2 ${statusInfo.iconBox}`}>
            <CalendarDays size={19} />
          </div>
        </div>

        <div className="space-y-3">
          <TimelineItem
            icon={TriangleAlert}
            label="Pré-vencimento"
            data={pre}
            valor={pre ? formatarData(pre) : "Não configurado"}
            detalhe={pre ? textoDistancia(pre) : "Sem etapa de pré"}
            variant="warning"
            apagado={!pre}
          />

          <TimelineItem
            icon={Trash2}
            label="Retirar da prateleira"
            data={remover}
            valor={remover ? formatarData(remover) : "Sem data"}
            detalhe={remover ? textoDistancia(remover) : "Sem cálculo"}
            variant="danger"
          />

          <TimelineItem
            icon={CalendarDays}
            label="Validade final"
            data={validade}
            valor={validade ? formatarData(validade) : "Sem data"}
            detalhe={validade ? textoDistancia(validade) : "Sem cálculo"}
            variant="success"
          />
        </div>
      </div>

      {/* AÇÕES */}
      <div
        className={`
          mt-4 grid gap-2
          ${m.imagem ? "grid-cols-3" : "grid-cols-2"}
        `}
      >
        {m.imagem && (
          <button
            type="button"
            onClick={() => setPreview(m.imagem)}
            className="
              flex h-12 items-center justify-center gap-2 rounded-2xl
              bg-gray-100 text-sm font-black text-gray-700 transition active:scale-95
              dark:bg-white/10 dark:text-gray-200
            "
          >
            <Eye size={17} />
            Ver
          </button>
        )}

        <button
          type="button"
          onClick={abrirEdicao}
          className="
            flex h-12 items-center justify-center gap-2 rounded-2xl
            bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20
            transition active:scale-95
          "
        >
          <Pencil size={17} />
          Editar
        </button>

        <button
          type="button"
          onClick={abrirConfirmacao}
          className="
            flex h-12 items-center justify-center gap-2 rounded-2xl
            bg-red-600 text-sm font-black text-white shadow-lg shadow-red-600/20
            transition active:scale-95
          "
        >
          <Trash2 size={17} />
          Excluir
        </button>
      </div>
    </motion.div>
  );
}

function StatusBadge({ statusInfo, StatusIcon }) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
        text-xs font-black shadow-sm backdrop-blur-md
        ${statusInfo.badge}
      `}
    >
      <StatusIcon size={14} />
      {statusInfo.label}
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  valor,
  detalhe,
  variant = "success",
  apagado = false,
}) {
  const variants = {
    success: {
      icon: "bg-emerald-700 text-white",
      dot: "bg-emerald-600",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    danger: {
      icon: "bg-red-600 text-white",
      dot: "bg-red-600",
      text: "text-red-700 dark:text-red-300",
    },
    warning: {
      icon: "bg-amber-500 text-white",
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
    },
  };

  const styles = variants[variant] || variants.success;

  return (
    <div
      className={`
        flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm
        dark:bg-black/10
        ${apagado ? "opacity-60" : ""}
      `}
    >
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
          ${styles.icon}
        `}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <p className="truncate text-sm font-black text-gray-950 dark:text-white">
          {valor}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-xs font-black ${styles.text}`}>{detalhe}</p>

        <div className="mt-1 flex justify-end">
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        </div>
      </div>
    </div>
  );
}

export default CardMedicamento;