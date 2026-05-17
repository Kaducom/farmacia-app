import { AnimatePresence, motion } from "framer-motion";

import {
  Boxes,
  CalendarDays,
  ChevronDown,
  Clock3,
  Eye,
  Minus,
  PackageCheck,
  Pencil,
  Pill,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";

function CardProdutoSanfonado({
  produto,
  aberto,
  onToggle,
  calcularStatus,
  calcularDatas,
  formatarData,
  onPreview,
  onConfirmar,
  onEditar,
  onAlterarQuantidade,
}) {
  const status = calcularStatus(produto);
  const datas = calcularDatas(produto);
  const setor = produto.setor || "Medicamentos";

  const produtoJaPre = Boolean(produto.produtoJaPre);
  const modoDataRetirada = Boolean(produto.modoDataRetirada);
  const dataRetiradaInformada = produto.dataRetiradaInformada || null;

  const configStatus = {
    vencido: {
      titulo: "Vencido",
      descricao: "Retirar imediatamente",
      card:
        "border-red-300 bg-red-50/95 dark:border-red-500/25 dark:bg-red-500/10",
      badge: "bg-red-600 text-white",
      icon: "bg-red-600 text-white",
      texto: "text-red-700 dark:text-red-300",
      brilho: "shadow-red-500/10",
      halo: "from-red-500/12",
    },
    remover: {
      titulo: "Remover",
      descricao: "Hora de tirar da prateleira",
      card:
        "border-orange-300 bg-orange-50/95 dark:border-orange-500/25 dark:bg-orange-500/10",
      badge: "bg-orange-600 text-white",
      icon: "bg-orange-600 text-white",
      texto: "text-orange-700 dark:text-orange-300",
      brilho: "shadow-orange-500/10",
      halo: "from-orange-500/12",
    },
    pre: {
      titulo: produtoJaPre ? "Já em pré" : "Pré-vencimento",
      descricao: produtoJaPre
        ? "Produto marcado como pré-vencimento"
        : "Atenção para desconto/ação",
      card:
        "border-amber-300 bg-amber-50/95 dark:border-amber-500/25 dark:bg-amber-500/10",
      badge: "bg-amber-500 text-white",
      icon: "bg-amber-500 text-white",
      texto: "text-amber-700 dark:text-amber-300",
      brilho: "shadow-amber-500/10",
      halo: "from-amber-500/12",
    },
    ok: {
      titulo: "Normal",
      descricao: "Estoque tranquilo",
      card:
        "border-emerald-200 bg-white/90 dark:border-emerald-500/20 dark:bg-gray-900/80",
      badge: "bg-emerald-600 text-white",
      icon: "bg-emerald-600 text-white",
      texto: "text-emerald-700 dark:text-emerald-300",
      brilho: "shadow-emerald-500/10",
      halo: "from-emerald-500/10",
    },
  };

  const config = configStatus[status] || configStatus.ok;

  function obterDataPrincipal() {
    if (modoDataRetirada && datas.remover) {
      return {
        label: "Retirada informada",
        valor: formatarData(datas.remover),
      };
    }

    if (status === "vencido") {
      return {
        label: "Venceu em",
        valor: datas.validade ? formatarData(datas.validade) : "Sem data",
      };
    }

    if (status === "remover") {
      return {
        label: "Retirar desde",
        valor: datas.remover ? formatarData(datas.remover) : "Sem data",
      };
    }

    if (status === "pre") {
      return {
        label: produtoJaPre ? "Retirar em" : "Pré ativo",
        valor: datas.remover ? formatarData(datas.remover) : "Sem data",
      };
    }

    if (datas.pre) {
      return {
        label: "Pré em",
        valor: formatarData(datas.pre),
      };
    }

    return {
      label: "Retirar em",
      valor: datas.remover ? formatarData(datas.remover) : "Sem data",
    };
  }

  const dataPrincipal = obterDataPrincipal();
  const quantidadeAtual = Number(produto.quantidade || 1);

  return (
    <motion.div
      layout
      className={`
        group relative overflow-hidden rounded-[2rem] border shadow-xl
        backdrop-blur-xl transition
        ${config.card} ${config.brilho}
      `}
    >
      <div
        className={`
          pointer-events-none absolute inset-x-0 top-0 h-24
          bg-gradient-to-b ${config.halo} to-transparent
        `}
      />

      <button
        type="button"
        onClick={onToggle}
        className="
          relative flex w-full items-center gap-3 p-3 text-left transition
          active:scale-[0.99] sm:p-4
        "
      >
        <div
          className="
            relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl
            bg-gray-100 shadow-inner ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10
          "
        >
          {produto.imagem ? (
            <img
              src={produto.imagem}
              alt={produto.nome || "Produto"}
              className="h-full w-full object-cover"
            />
          ) : (
            <Pill size={28} className={config.texto} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />

          {produtoJaPre && (
            <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
              <Zap size={13} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`
                rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide
                ${config.badge}
              `}
            >
              {config.titulo}
            </span>

            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
              x{quantidadeAtual}
            </span>

            <span
              className="
                inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2.5 py-1
                text-[11px] font-black text-slate-600
                dark:bg-white/10 dark:text-slate-200
              "
            >
              <Boxes size={12} />
              {setor}
            </span>

            {produtoJaPre && (
              <span
                className="
                  inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1
                  text-[11px] font-black text-white shadow-sm
                "
              >
                <Zap size={12} />
                Pré
              </span>
            )}

            {modoDataRetirada && (
              <span
                className="
                  inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1
                  text-[11px] font-black text-white shadow-sm
                "
              >
                <CalendarDays size={12} />
                Etiqueta
              </span>
            )}
          </div>

          <p className="mt-2 truncate text-base font-black text-gray-950 dark:text-white">
            {produto.nome || "Produto sem nome"}
          </p>

          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {dataPrincipal.label}:{" "}
            <strong className={config.texto}>{dataPrincipal.valor}</strong>
          </p>

          {modoDataRetirada && dataRetiradaInformada && (
            <p className="mt-1 truncate text-[11px] font-semibold text-blue-600 dark:text-blue-300">
              Retirada da etiqueta: {dataRetiradaInformada}
            </p>
          )}

          {produto.codigo && (
            <p className="mt-1 truncate text-[11px] text-gray-400">
              Código: {produto.codigo}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <div
            className={`
              flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg
              ${config.icon}
            `}
          >
            <ChevronDown
              size={22}
              className={`transition-transform duration-200 ${
                aberto ? "rotate-180" : ""
              }`}
            />
          </div>

          <span className="hidden text-[10px] font-bold uppercase text-gray-400 sm:block">
            {aberto ? "Fechar" : "Abrir"}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-black/5 p-3 dark:border-white/10 sm:p-4">
              {(produtoJaPre || modoDataRetirada) && (
                <PainelInteligente
                  produtoJaPre={produtoJaPre}
                  modoDataRetirada={modoDataRetirada}
                  dataRetiradaInformada={dataRetiradaInformada}
                  datas={datas}
                  formatarData={formatarData}
                />
              )}

              <div className="mb-3 grid grid-cols-3 gap-2">
                <MiniDataCard
                  label={produtoJaPre ? "Pré ativo" : "Pré"}
                  valor={datas.pre ? formatarData(datas.pre) : "Sem pré"}
                  destaque={produtoJaPre || status === "pre"}
                  tipo="pre"
                />

                <MiniDataCard
                  label={modoDataRetirada ? "Retirada etiqueta" : "Retirar"}
                  valor={
                    datas.remover ? formatarData(datas.remover) : "Sem data"
                  }
                  destaque={status === "remover" || modoDataRetirada}
                  tipo="retirada"
                />

                <MiniDataCard
                  label="Validade"
                  valor={
                    datas.validade ? formatarData(datas.validade) : "Sem data"
                  }
                  destaque={status === "vencido"}
                  tipo="validade"
                />
              </div>

              <LinhaTempoProduto
                datas={datas}
                status={status}
                formatarData={formatarData}
                produtoJaPre={produtoJaPre}
                modoDataRetirada={modoDataRetirada}
              />

              <div className="mt-3 rounded-3xl border border-black/5 bg-white/70 p-3 shadow-inner dark:border-white/10 dark:bg-black/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-950 dark:text-white">
                      Controle rápido de quantidade
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Ajuste sem abrir edição. Perfeito para reposição relâmpago.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAlterarQuantidade?.(produto.id, -1)}
                      className="
                        flex h-11 w-11 items-center justify-center rounded-2xl
                        bg-gray-200 text-gray-700 transition active:scale-95
                        dark:bg-white/10 dark:text-gray-200
                      "
                    >
                      <Minus size={18} />
                    </button>

                    <div
                      className="
                        flex h-11 min-w-20 items-center justify-center rounded-2xl
                        bg-gray-950 px-4 text-lg font-black text-white shadow-lg
                        dark:bg-white dark:text-gray-950
                      "
                    >
                      x{quantidadeAtual}
                    </div>

                    <button
                      type="button"
                      onClick={() => onAlterarQuantidade?.(produto.id, 1)}
                      className="
                        flex h-11 w-11 items-center justify-center rounded-2xl
                        bg-emerald-700 text-white shadow-lg shadow-emerald-700/20
                        transition active:scale-95
                      "
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => produto.imagem && onPreview?.(produto.imagem)}
                  disabled={!produto.imagem}
                  className="
                    flex h-12 items-center justify-center gap-2 rounded-2xl
                    bg-gray-800 text-sm font-black text-white shadow-lg transition active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-45
                    dark:bg-white/10
                  "
                >
                  <Eye size={17} />
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() => onEditar?.(produto)}
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
                  onClick={() => onConfirmar?.(produto)}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PainelInteligente({
  produtoJaPre,
  modoDataRetirada,
  dataRetiradaInformada,
  datas,
  formatarData,
}) {
  return (
    <div
      className="
        mb-3 overflow-hidden rounded-3xl border border-emerald-200/80
        bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-3
        shadow-inner
        dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-slate-950/40 dark:to-blue-500/10
      "
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
          <Sparkles size={19} />
        </div>

        <div>
          <p className="text-sm font-black text-gray-950 dark:text-white">
            Regras inteligentes
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Informações vindas do cadastro/scanner
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {produtoJaPre && (
          <InfoInteligente
            icon={Zap}
            titulo="Produto já em pré"
            texto="Marcado como item que já chegou ou já está em pré-vencimento."
            cor="amber"
          />
        )}

        {modoDataRetirada && (
          <InfoInteligente
            icon={CalendarDays}
            titulo="Retirada informada"
            texto={
              dataRetiradaInformada
                ? `Etiqueta: ${dataRetiradaInformada}`
                : datas.remover
                ? `Retirar em ${formatarData(datas.remover)}`
                : "Retirada marcada no cadastro."
            }
            cor="blue"
          />
        )}
      </div>
    </div>
  );
}

function InfoInteligente({ icon: Icon, titulo, texto, cor }) {
  const classes =
    cor === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
      : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200";

  return (
    <div className={`rounded-2xl border p-3 ${classes}`}>
      <div className="flex items-start gap-2">
        <Icon size={18} className="mt-0.5 shrink-0" />

        <div className="min-w-0">
          <p className="text-sm font-black">{titulo}</p>
          <p className="mt-1 text-xs font-semibold opacity-80">{texto}</p>
        </div>
      </div>
    </div>
  );
}

function MiniDataCard({ label, valor, destaque = false, tipo = "normal" }) {
  const corDestaque = {
    pre: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    retirada:
      "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200",
    validade:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200",
    normal:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
  };

  return (
    <div
      className={`
        rounded-2xl border p-3 text-center shadow-sm
        ${
          destaque
            ? corDestaque[tipo] || corDestaque.normal
            : "border-transparent bg-white/80 text-gray-800 dark:bg-white/10 dark:text-gray-100"
        }
      `}
    >
      <p className="text-[10px] font-black uppercase tracking-wide opacity-65">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black">{valor}</p>
    </div>
  );
}

function calcularDiasLinha(data) {
  if (!data) return null;

  const dataFinal = data instanceof Date ? new Date(data) : new Date(data);

  if (Number.isNaN(dataFinal.getTime())) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  dataFinal.setHours(0, 0, 0, 0);

  return Math.ceil((dataFinal - hoje) / (1000 * 60 * 60 * 24));
}

function textoDiasLinha(dias) {
  if (dias === null) return "Sem cálculo";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias < 0) return `Há ${Math.abs(dias)} dias`;

  return `Em ${dias} dias`;
}

function LinhaTempoProduto({
  datas,
  status,
  formatarData,
  produtoJaPre,
  modoDataRetirada,
}) {
  const etapas = [
    {
      id: "pre",
      icon: produtoJaPre ? Zap : Clock3,
      titulo: produtoJaPre ? "Produto já em pré" : "Pré-vencimento",
      descricao: produtoJaPre
        ? "Marcado manualmente como pré-vencimento"
        : datas.pre
        ? "Começa o alerta de atenção"
        : "Sem pré-vencimento configurado",
      data: datas.pre,
      ativo: status === "pre" || produtoJaPre,
      corIcone:
        datas.pre || produtoJaPre
          ? "bg-amber-500 text-white"
          : "bg-gray-300 text-gray-700 dark:bg-white/10 dark:text-gray-300",
      corBadge:
        datas.pre || produtoJaPre
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
    },
    {
      id: "remover",
      icon: Trash2,
      titulo: modoDataRetirada
        ? "Retirada da etiqueta"
        : "Retirar da prateleira",
      descricao: modoDataRetirada
        ? "Data informada manualmente no cadastro/scanner"
        : "Data limite para remover do estoque exposto",
      data: datas.remover,
      ativo: status === "remover" || modoDataRetirada,
      corIcone: modoDataRetirada
        ? "bg-blue-600 text-white"
        : "bg-red-600 text-white",
      corBadge: modoDataRetirada
        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
        : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    },
    {
      id: "validade",
      icon: CalendarDays,
      titulo: "Validade final",
      descricao: "Último dia informado para o lote",
      data: datas.validade,
      ativo: status === "vencido",
      corIcone:
        status === "vencido"
          ? "bg-red-600 text-white"
          : "bg-emerald-700 text-white",
      corBadge:
        status === "vencido"
          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  ];

  return (
    <div
      className="
        mt-3 overflow-hidden rounded-3xl border border-emerald-200/80
        bg-gradient-to-br from-emerald-950/[0.04] via-white/80 to-emerald-50/80
        p-4 shadow-inner
        dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-slate-950/40 dark:to-slate-950/70
      "
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-black text-gray-950 dark:text-white">
            Linha do tempo
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Datas importantes deste lote
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
          <CalendarDays size={21} />
        </div>
      </div>

      <div className="space-y-3">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon;
          const dias = calcularDiasLinha(etapa.data);
          const semData = !etapa.data;

          return (
            <div key={etapa.id} className="relative flex gap-3">
              {index < etapas.length - 1 && (
                <div className="absolute left-[21px] top-11 h-[calc(100%+0.75rem)] w-0.5 rounded-full bg-gray-200 dark:bg-white/10" />
              )}

              <div
                className={`
                  relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg
                  ${etapa.corIcone}
                  ${
                    etapa.ativo
                      ? "ring-4 ring-white/70 dark:ring-white/10"
                      : ""
                  }
                `}
              >
                <Icon size={19} />
              </div>

              <div
                className={`
                  min-w-0 flex-1 rounded-2xl border p-3
                  ${
                    etapa.ativo
                      ? "border-emerald-300 bg-white shadow-md dark:border-emerald-500/25 dark:bg-white/10"
                      : "border-transparent bg-white/70 dark:bg-black/10"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-gray-950 dark:text-white">
                      {etapa.titulo}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {etapa.descricao}
                    </p>

                    <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">
                      {semData ? "Sem data" : formatarData(etapa.data)}
                    </p>
                  </div>

                  <span
                    className={`
                      shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black
                      ${etapa.corBadge}
                    `}
                  >
                    {textoDiasLinha(dias)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CardProdutoSanfonado;