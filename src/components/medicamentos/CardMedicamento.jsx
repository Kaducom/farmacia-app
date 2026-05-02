import {
  motion,
  useMotionValue,
  animate,
} from "framer-motion";

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
  setAbrirModal,
  setFabOpen,
}) {

  const x = useMotionValue(0);

  const status =
    calcularStatus(m);

  const {
    validade,
    remover,
    pre,
  } = calcularDatas(m);

  /* STATUS */
  const statusMap = {

    vencido: {
      label: "Vencido",
      icon: XCircle,
      classes: `
        bg-red-100
        text-red-700
        dark:bg-red-900/30
        dark:text-red-300
      `,
    },

    remover: {
      label: "Remover",
      icon: AlertTriangle,
      classes: `
        bg-orange-100
        text-orange-700
        dark:bg-orange-900/30
        dark:text-orange-300
      `,
    },

    pre: {
      label: "Pré-vencimento",
      icon: Clock3,
      classes: `
        bg-yellow-100
        text-yellow-700
        dark:bg-yellow-900/30
        dark:text-yellow-300
      `,
    },

    ok: {
      label: "Em dia",
      icon: CheckCircle2,
      classes: `
        bg-green-100
        text-green-700
        dark:bg-green-900/30
        dark:text-green-300
      `,
    },
  };

  const statusInfo =
    statusMap[status] ||
    statusMap.ok;

  const StatusIcon =
    statusInfo.icon;

  return (

    <motion.div

      drag="x"

      dragConstraints={{
        left: 0,
        right: 140,
      }}

      dragElastic={0.08}

      dragMomentum={false}

      style={{ x }}

      whileTap={{
        scale: 0.99,
      }}

      whileHover={{
        y: -2,
      }}

      whileDrag={{
        scale: 0.98,
      }}

      onDragEnd={(e, info) => {

        if (info.offset.x > 110) {

          animate(x, 140, {
            type: "spring",
            stiffness: 300,
            damping: 25,
          });

          setConfirmar(m);

          return;
        }

        animate(x, 0, {
          type: "spring",
          stiffness: 400,
          damping: 30,
        });
      }}

      className="
        overflow-hidden
        rounded-3xl
        bg-white
        dark:bg-[#111827]
        shadow-xl
        border
        border-gray-200
        dark:border-gray-800
        touch-pan-y
        will-change-transform
      "
    >

      {/* IMAGEM */}
      {m.imagem && (

        <div className="relative">

          <img
            src={m.imagem}

            onClick={(e) => {

              e.stopPropagation();

              setPreview(m.imagem);
            }}

            className="
              w-full
              h-48
              object-cover
              cursor-pointer
            "
          />

          {/* overlay */}
          <div className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/50
            to-transparent
          " />

          {/* status */}
          <div className="
            absolute
            top-4
            right-4
          ">

            <div className={`
              flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              text-xs
              font-semibold
              backdrop-blur-md
              shadow-lg

              ${statusInfo.classes}
            `}>

              <StatusIcon size={14} />

              {statusInfo.label}

            </div>

          </div>

        </div>

      )}

      {/* BODY */}
      <div className="p-5 space-y-4">

        {/* HEADER */}
        <div className="
          flex
          items-start
          justify-between
          gap-3
        ">

          <div className="flex-1">

            <div className="
              flex
              items-center
              gap-2
              flex-wrap
            ">

              <div className="
                w-10
                h-10
                rounded-2xl
                bg-green-700
                text-white
                flex
                items-center
                justify-center
                shadow-lg
              ">

                <Pill size={18} />

              </div>

              <div>

                <h2 className="
                  text-lg
                  font-bold
                  text-black
                  dark:text-white
                  break-words
                ">
                  {m.nome}
                </h2>

                <p className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                ">
                  Medicamento cadastrado
                </p>

              </div>

            </div>

          </div>

          {(m.quantidade || 1) > 1 && (

            <div className="
              px-3
              py-1.5
              rounded-2xl
              bg-blue-500
              text-white
              text-xs
              font-semibold
              shadow-lg
              flex
              items-center
              gap-1
            ">

              <Package size={14} />

              x{m.quantidade}

            </div>

          )}

        </div>

        {/* STATUS SEM IMAGEM */}
        {!m.imagem && (

          <div className={`
            inline-flex
            items-center
            gap-2
            px-3
            py-2
            rounded-2xl
            text-sm
            font-medium

            ${statusInfo.classes}
          `}>

            <StatusIcon size={16} />

            {statusInfo.label}

          </div>

        )}

        {/* DATAS */}
        <div className="
          space-y-3
          pt-1
        ">

          <InfoLinha
            icon={CalendarDays}
            label="Validade"
            valor={formatarData(validade)}
          />

          <InfoLinha
            icon={Trash2}
            label="Remover em"
            valor={formatarData(remover)}
          />

          {pre && (

            <InfoLinha
              icon={TriangleAlert}
              label="Pré-vencimento"
              valor={formatarData(pre)}
              alerta
            />

          )}

        </div>

        {/* AÇÕES */}
        <div className="
          flex
          gap-3
          pt-2
        ">

          <button

            onClick={() => {

              setEditando(m);

              setNome(m.nome);

              setValidade(m.validade);

              setImagem(m.imagem);

              setDiasPre(
                m.diasPreVencido || ""
              );

              setDiasRemover(
                m.diasRemover || 7
              );

              setAbrirModal(true);

              setFabOpen(false);
            }}

            className="
              flex-1
              h-12
              rounded-2xl
              bg-blue-500
              hover:bg-blue-600
              text-white
              font-semibold
              transition
              active:scale-95

              flex
              items-center
              justify-center
              gap-2
            "
          >

            <Pencil size={18} />

            Editar

          </button>

          <button

            onClick={() =>
              setConfirmar(m)
            }

            className="
              flex-1
              h-12
              rounded-2xl
              bg-red-500
              hover:bg-red-600
              text-white
              font-semibold
              transition
              active:scale-95

              flex
              items-center
              justify-center
              gap-2
            "
          >

            <Trash2 size={18} />

            Excluir

          </button>

        </div>

        {/* swipe hint */}


      </div>

    </motion.div>
  );
}

/* LINHA INFO */
function InfoLinha({
  icon: Icon,
  label,
  valor,
  alerta = false,
}) {

  return (

    <div className="
      flex
      items-center
      justify-between
      gap-3

      bg-gray-100
      dark:bg-gray-800/70

      rounded-2xl
      px-4
      py-3
    ">

      <div className="
        flex
        items-center
        gap-3
      ">

        <div className={`
          w-10
          h-10
          rounded-xl

          flex
          items-center
          justify-center

          ${
            alerta

              ? `
                bg-yellow-500
                text-white
              `

              : `
                bg-green-700
                text-white
              `
          }
        `}>

          <Icon size={18} />

        </div>

        <div>

          <p className="
            text-xs
            text-gray-500
            dark:text-gray-400
          ">
            {label}
          </p>

          <p className="
            font-semibold
            text-black
            dark:text-white
          ">
            {valor}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CardMedicamento;