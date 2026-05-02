import { motion, useMotionValue, animate } from "framer-motion";

import {
  Pill,
  CalendarDays,
  TriangleAlert,
  Trash2,
  Pencil,
  Package,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  XCircle,
  ImageIcon,
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
  const x = useMotionValue(0);

  const status = calcularStatus(m);
  const { validade, remover, pre } = calcularDatas(m);

  const statusMap = {
    vencido: {
      label: "Vencido",
      icon: XCircle,
      classes:
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
      iconBg: "bg-red-600",
    },

    remover: {
      label: "Remover",
      icon: AlertTriangle,
      classes:
        "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
      iconBg: "bg-orange-600",
    },

    pre: {
      label: "Pré-vencimento",
      icon: Clock3,
      classes:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
      iconBg: "bg-yellow-500",
    },

    ok: {
      label: "Em dia",
      icon: CheckCircle2,
      classes:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      iconBg: "bg-emerald-700",
    },
  };

  const statusInfo = statusMap[status] || statusMap.ok;
  const StatusIcon = statusInfo.icon;

  function resetSwipe() {
    animate(x, 0, {
      type: "spring",
      stiffness: 420,
      damping: 34,
    });
  }

  function abrirConfirmacao() {
    setConfirmar(m);
    resetSwipe();
  }

  function abrirEdicao() {
    resetSwipe();

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

  return (
    <div className="relative">
      {/* AÇÃO FUNDO DO SWIPE */}
      <div
        className="
          absolute inset-0 flex items-center justify-start rounded-3xl
          bg-red-600 px-5 text-white shadow-xl
        "
      >
        <div className="flex items-center gap-2 font-semibold">
          <Trash2 size={20} />
          Excluir
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 120 }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ x }}
        whileTap={{ scale: 0.99 }}
        whileHover={{ y: -2 }}
        whileDrag={{ scale: 0.985 }}
        onDragEnd={(e, info) => {
          if (info.offset.x > 95) {
            animate(x, 120, {
              type: "spring",
              stiffness: 300,
              damping: 26,
            });

            setTimeout(() => {
              abrirConfirmacao();
            }, 120);

            return;
          }

          resetSwipe();
        }}
        className="
          relative overflow-hidden rounded-3xl border border-gray-200 bg-white
          shadow-xl shadow-black/5 touch-pan-y will-change-transform
          dark:border-gray-800 dark:bg-gray-900
        "
      >
        {/* IMAGEM */}
        {m.imagem ? (
          <div className="relative">
            <img
              src={m.imagem}
              alt={m.nome || "Imagem do medicamento"}
              onClick={(e) => {
                e.stopPropagation();
                setPreview(m.imagem);
              }}
              className="h-48 w-full cursor-pointer object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

            <div className="absolute right-4 top-4">
              <StatusBadge statusInfo={statusInfo} StatusIcon={StatusIcon} />
            </div>
          </div>
        ) : (
          <div
            className="
              flex h-24 items-center justify-between bg-gradient-to-br
              from-emerald-700 to-emerald-900 px-5 text-white
            "
          >
            <div>
              <p className="text-xs font-medium text-white/70">
                Medicamento
              </p>
              <p className="text-lg font-bold">Sem imagem</p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <ImageIcon size={28} />
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="space-y-4 p-5">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <div
                  className={`
                    flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                    text-white shadow-lg ${statusInfo.iconBg}
                  `}
                >
                  <Pill size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold leading-tight text-gray-950 dark:text-white">
                    {m.nome}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Medicamento cadastrado
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                flex shrink-0 items-center gap-1.5 rounded-2xl bg-blue-500 px-3 py-1.5
                text-xs font-bold text-white shadow-lg shadow-blue-500/20
              "
            >
              <Package size={14} />
              x{m.quantidade || 1}
            </div>
          </div>

          {/* STATUS SEM IMAGEM */}
          {!m.imagem && (
            <StatusBadge statusInfo={statusInfo} StatusIcon={StatusIcon} />
          )}

          {/* DATAS */}
          <div className="space-y-3 pt-1">
            <InfoLinha
              icon={CalendarDays}
              label="Validade"
              valor={formatarData(validade)}
              variant="success"
            />

            <InfoLinha
              icon={Trash2}
              label="Remover em"
              valor={formatarData(remover)}
              variant="danger"
            />

            {pre && (
              <InfoLinha
                icon={TriangleAlert}
                label="Pré-vencimento"
                valor={formatarData(pre)}
                variant="warning"
              />
            )}
          </div>

          {/* AÇÕES */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={abrirEdicao}
              className="
                flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl
                bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/20
                transition hover:bg-blue-700 active:scale-95
              "
            >
              <Pencil size={18} />
              Editar
            </button>

            <button
              onClick={abrirConfirmacao}
              className="
                flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl
                bg-red-600 font-semibold text-white shadow-lg shadow-red-600/20
                transition hover:bg-red-700 active:scale-95
              "
            >
              <Trash2 size={18} />
              Excluir
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ statusInfo, StatusIcon }) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full px-3 py-1.5
        text-xs font-bold shadow-sm backdrop-blur-md
        ${statusInfo.classes}
      `}
    >
      <StatusIcon size={15} />
      {statusInfo.label}
    </div>
  );
}

function InfoLinha({ icon: Icon, label, valor, variant = "success" }) {
  const variants = {
    success: {
      icon: "bg-emerald-700 text-white",
      card: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    danger: {
      icon: "bg-red-600 text-white",
      card: "bg-red-50 dark:bg-red-500/10",
    },
    warning: {
      icon: "bg-yellow-500 text-white",
      card: "bg-yellow-50 dark:bg-yellow-500/10",
    },
  };

  const styles = variants[variant] || variants.success;

  return (
    <div
      className={`
        flex items-center justify-between gap-3 rounded-2xl px-4 py-3
        ${styles.card}
      `}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
            ${styles.icon}
          `}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>

          <p className="truncate font-semibold text-gray-950 dark:text-white">
            {valor}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CardMedicamento;