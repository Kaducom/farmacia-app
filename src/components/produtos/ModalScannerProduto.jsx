import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  Barcode,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  ImageIcon,
  Loader2,
  Minus,
  Package,
  PackagePlus,
  Plus,
  Save,
  ScanBarcode,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  TriangleAlert,
  Wand2,
  X,
  Zap,
} from "lucide-react";

const SETORES_PADRAO = [
  "Medicamentos",
  "Alimentos",
  "Geladeira",
  "Perfumaria",
  "Higiene",
  "Estoque geral",
  "Outros",
];

const CONFIG_PADRAO = {
  setorPrincipal: "Medicamentos",
  usarSetorPrincipal: true,
  mostrarSoBotoesUteis: true,
  datasAutomaticas: true,
  produtoPreVencimento: true,
  permitirDataRetirada: true,
  diasRetiradaPadrao: 30,
  diasPrePadrao: "",
  qualidadeFotoLocal: "boa",
};

const STORAGE_KEYS_CONFIG = [
  "avisai-config-produtos",
  "avisaiConfigProdutos",
  "avisai:config-produtos",
];

function carregarConfigProdutos() {
  if (typeof window === "undefined") return CONFIG_PADRAO;

  for (const key of STORAGE_KEYS_CONFIG) {
    try {
      const bruto = window.localStorage.getItem(key);
      if (!bruto) continue;

      return {
        ...CONFIG_PADRAO,
        ...(JSON.parse(bruto) || {}),
      };
    } catch {
      // Continua tentando outras chaves.
    }
  }

  return CONFIG_PADRAO;
}

function ModalScannerProduto({
  dados,
  processando = false,
  formatarData,
  formatarValidadeDigitada,
  onFechar,
  onSomarLote,
  onNovaValidade,
  onAtualizarProduto,
  onAtualizarLote,
}) {
  const produtoBase = dados?.produto || {};
  const lotes = Array.isArray(dados?.lotes) ? dados.lotes : [];
  const inputImagemRef = useRef(null);

  const [configProdutos, setConfigProdutos] = useState(() =>
    carregarConfigProdutos()
  );

  const [produtoLocal, setProdutoLocal] = useState(() => ({
    ...produtoBase,
  }));

  const [quantidade, setQuantidade] = useState(
    Math.max(1, Number(dados?.quantidadeScanner || 1))
  );

  const [validadeNova, setValidadeNova] = useState("");
  const [dataRetiradaNova, setDataRetiradaNova] = useState("");

  const [abrirLotes, setAbrirLotes] = useState(true);
  const [abrirEdicao, setAbrirEdicao] = useState(false);
  const [mostrarTodosSetores, setMostrarTodosSetores] = useState(false);

  const [produtoJaPre, setProdutoJaPre] = useState(false);
  const [usarDataRetirada, setUsarDataRetirada] = useState(false);

  const [ultimaAcao, setUltimaAcao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [edicaoProduto, setEdicaoProduto] = useState(() => ({
    nome: produtoBase.nome || "",
    setor: produtoBase.setor || "Medicamentos",
    diasRemover: String(produtoBase.diasRemover || 7),
    diasPreVencido: produtoBase.diasPreVencido
      ? String(produtoBase.diasPreVencido)
      : "",
    imagem: produtoBase.imagem || null,
  }));

  const setoresDisponiveis = useMemo(() => {
    const vindosDeDados =
      Array.isArray(dados?.setores) && dados.setores.length > 0
        ? dados.setores
        : [];

    const principal = configProdutos.setorPrincipal || "Medicamentos";

    return Array.from(
      new Set([
        principal,
        produtoLocal.setor || produtoBase.setor || "Medicamentos",
        ...vindosDeDados,
        ...SETORES_PADRAO,
      ])
    ).filter(Boolean);
  }, [dados?.setores, configProdutos.setorPrincipal, produtoBase.setor, produtoLocal.setor]);

  const setoresVisiveis = useMemo(() => {
    if (!configProdutos.mostrarSoBotoesUteis || mostrarTodosSetores) {
      return setoresDisponiveis;
    }

    return Array.from(
      new Set([
        configProdutos.setorPrincipal || "Medicamentos",
        produtoLocal.setor || "Medicamentos",
        "Medicamentos",
      ])
    ).filter((setor) => setoresDisponiveis.includes(setor));
  }, [
    configProdutos.mostrarSoBotoesUteis,
    configProdutos.setorPrincipal,
    mostrarTodosSetores,
    produtoLocal.setor,
    setoresDisponiveis,
  ]);

  const temLotes = lotes.length > 0;

  const lotesOrdenados = useMemo(() => {
    return [...lotes].sort((a, b) => {
      const dataA = parseDataSegura(a.validade);
      const dataB = parseDataSegura(b.validade);

      if (!dataA && !dataB) return 0;
      if (!dataA) return 1;
      if (!dataB) return -1;

      return dataA - dataB;
    });
  }, [lotes]);

  const totalUnidades = useMemo(() => {
    return lotesOrdenados.reduce(
      (total, lote) => total + Number(lote.quantidade || 1),
      0
    );
  }, [lotesOrdenados]);

  const loteMaisProximo = lotesOrdenados[0] || null;

  const origemTexto = useMemo(() => {
    if (dados?.origem === "nuvem") return "Encontrado na nuvem";
    if (dados?.origem === "base") return "Encontrado na base";
    if (dados?.origem === "estoque") return "Já existe no estoque";
    return "Produto encontrado";
  }, [dados?.origem]);

  const dataRetiradaCalculada = useMemo(() => {
    const validade = parseDataSegura(validadeNova);

    if (!validade) return null;

    const retirar = new Date(validade);
    retirar.setDate(retirar.getDate() - Number(edicaoProduto.diasRemover || produtoLocal.diasRemover || 7));

    return retirar;
  }, [validadeNova, edicaoProduto.diasRemover, produtoLocal.diasRemover]);

  const validadeCalculadaPelaRetirada = useMemo(() => {
    if (!usarDataRetirada) return null;

    const retirada = parseDataSegura(dataRetiradaNova);

    if (!retirada) return null;

    const validade = new Date(retirada);
    validade.setDate(
      validade.getDate() + Number(edicaoProduto.diasRemover || produtoLocal.diasRemover || 7)
    );

    return validade;
  }, [usarDataRetirada, dataRetiradaNova, edicaoProduto.diasRemover, produtoLocal.diasRemover]);

  const validadeParaCriar = usarDataRetirada
    ? dataParaTextoBR(validadeCalculadaPelaRetirada)
    : validadeNova;

  useEffect(() => {
    function atualizarConfig() {
      setConfigProdutos(carregarConfigProdutos());
    }

    window.addEventListener("avisai-config-produtos-change", atualizarConfig);
    window.addEventListener("storage", atualizarConfig);

    return () => {
      window.removeEventListener(
        "avisai-config-produtos-change",
        atualizarConfig
      );
      window.removeEventListener("storage", atualizarConfig);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: Boolean(dados) },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );
    };
  }, [dados]);

  useEffect(() => {
    const produto = dados?.produto || {};

    setProdutoLocal({ ...produto });
    setEdicaoProduto({
      nome: produto.nome || "",
      setor:
        produto.setor ||
        configProdutos.setorPrincipal ||
        "Medicamentos",
      diasRemover: String(
        produto.diasRemover ||
          configProdutos.diasRetiradaPadrao ||
          7
      ),
      diasPreVencido: produto.diasPreVencido
        ? String(produto.diasPreVencido)
        : String(configProdutos.diasPrePadrao || ""),
      imagem: produto.imagem || null,
    });

    setQuantidade(Math.max(1, Number(dados?.quantidadeScanner || 1)));
    setValidadeNova("");
    setDataRetiradaNova("");
    setProdutoJaPre(false);
    setUsarDataRetirada(false);
    setAbrirEdicao(false);
    setAbrirLotes(true);
    setUltimaAcao(null);
  }, [dados?.codigo, dados?.quantidadeScanner, configProdutos]);

  function fechar() {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: false },
      })
    );

    onFechar?.();
  }

  function alterarQuantidade(delta) {
    setQuantidade((prev) => {
      const atual = Number(prev || 1);
      return Math.max(1, Math.min(999, atual + delta));
    });
  }

  function definirQuantidade(valor) {
    const numero = Number(String(valor || "").replace(/\D/g, ""));
    setQuantidade(Math.max(1, Math.min(999, numero || 1)));
  }

  function definirAtalho(valor) {
    setQuantidade(Math.max(1, Math.min(999, Number(valor || 1))));
  }

  function alterarCampoProduto(campo, valor) {
    setEdicaoProduto((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function escolherImagem(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    const reader = new FileReader();

    reader.onload = () => {
      alterarCampoProduto("imagem", reader.result);
    };

    reader.readAsDataURL(arquivo);

    e.target.value = "";
  }

  function removerImagem() {
    alterarCampoProduto("imagem", null);
  }

  function digitarValidade(valor) {
    const formatada = formatarValidadeDigitada
      ? formatarValidadeDigitada(valor)
      : formatarValidade(valor);

    setValidadeNova(formatada);
  }

  function digitarRetirada(valor) {
    const formatada = formatarValidadeDigitada
      ? formatarValidadeDigitada(valor)
      : formatarValidade(valor);

    setDataRetiradaNova(formatada);
  }

  async function criarNovaValidade() {
    if (!String(validadeParaCriar || "").trim() || processando) return;

    const validadeUsada = validadeParaCriar;

    await Promise.resolve(
      onNovaValidade?.(validadeUsada, quantidade, {
        manterAberto: true,
        produtoJaPre,
        dataRetiradaInformada: usarDataRetirada ? dataRetiradaNova : null,
      })
    );

    setUltimaAcao({
      tipo: "nova-validade",
      texto: `Adicionado x${quantidade} em ${validadeUsada}`,
    });

    setValidadeNova("");
    setDataRetiradaNova("");
    setAbrirLotes(true);
  }

  async function somarNoLote(lote) {
    if (!lote || processando) return;

    await Promise.resolve(
      onSomarLote?.(lote, quantidade, {
        manterAberto: true,
      })
    );

    const validadeTexto = formatarData ? formatarData(lote.validade) : lote.validade;

    setUltimaAcao({
      tipo: "lote",
      texto: `Somado x${quantidade} em ${validadeTexto}`,
    });
  }

  async function atualizarLote(lote, alteracoes) {
    if (!lote || processando) return;

    await Promise.resolve(
      onAtualizarLote?.(lote, alteracoes, {
        manterAberto: true,
      })
    );

    setUltimaAcao({
      tipo: "editar-lote",
      texto: "Validade atualizada com sucesso",
    });

    setAbrirLotes(true);
  }

  async function salvarEdicaoProduto() {
    if (salvandoEdicao || processando) return;

    const nomeLimpo = String(edicaoProduto.nome || "").trim();

    if (!nomeLimpo) {
      setUltimaAcao({
        tipo: "erro",
        texto: "Informe um nome para o produto",
      });
      return;
    }

    const payload = {
      ...produtoLocal,
      codigo: dados?.codigo || produtoLocal.codigo || null,
      nome: nomeLimpo,
      setor: edicaoProduto.setor || configProdutos.setorPrincipal || "Medicamentos",
      diasRemover: Number(edicaoProduto.diasRemover || configProdutos.diasRetiradaPadrao || 7),
      diasPreVencido: edicaoProduto.diasPreVencido
        ? Number(edicaoProduto.diasPreVencido)
        : null,
      imagem: edicaoProduto.imagem || null,
    };

    try {
      setSalvandoEdicao(true);

      await Promise.resolve(
        onAtualizarProduto?.(payload, {
          manterAberto: true,
        })
      );

      setProdutoLocal(payload);
      setAbrirEdicao(false);

      setUltimaAcao({
        tipo: "produto",
        texto: "Produto atualizado",
      });
    } finally {
      setSalvandoEdicao(false);
    }
  }

  if (!dados) return null;

  return (
    <motion.div
      onClick={fechar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[2147483647] flex h-[100dvh] items-end justify-center
        overflow-hidden bg-slate-950/78 p-0 backdrop-blur-md
        sm:items-center sm:p-4
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 26, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="
          flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden
          rounded-t-[2rem] border border-white/10 bg-[#07111f]
          text-white shadow-2xl shadow-black/50
          sm:h-[88dvh] sm:rounded-[2rem]
        "
      >
        <HeaderScannerModal
          produto={produtoLocal}
          origemTexto={origemTexto}
          codigo={dados.codigo}
          lotes={lotesOrdenados}
          totalUnidades={totalUnidades}
          loteMaisProximo={loteMaisProximo}
          quantidade={quantidade}
          produtoJaPre={produtoJaPre}
          usarDataRetirada={usarDataRetirada}
          formatarData={formatarData}
          onFechar={fechar}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-3">
              {ultimaAcao && <AvisoAcao ultimaAcao={ultimaAcao} />}

              <ResumoProduto
                produto={produtoLocal}
                codigo={dados.codigo}
                onEditar={() => setAbrirEdicao((prev) => !prev)}
                editando={abrirEdicao}
                podeEditar={Boolean(onAtualizarProduto)}
              />

              {abrirEdicao && (
                <EditarProdutoBox
                  edicao={edicaoProduto}
                  setores={setoresVisiveis}
                  setoresTotais={setoresDisponiveis}
                  mostrarTodosSetores={mostrarTodosSetores}
                  setMostrarTodosSetores={setMostrarTodosSetores}
                  salvando={salvandoEdicao}
                  processando={processando}
                  inputImagemRef={inputImagemRef}
                  onImagem={escolherImagem}
                  onRemoverImagem={removerImagem}
                  onChange={alterarCampoProduto}
                  onSalvar={salvarEdicaoProduto}
                />
              )}

              <QuantidadeBox
                quantidade={quantidade}
                setQuantidade={definirQuantidade}
                alterarQuantidade={alterarQuantidade}
                definirAtalho={definirAtalho}
              />

              <ResumoInteligente
                produto={produtoLocal}
                produtoJaPre={produtoJaPre}
                usarDataRetirada={usarDataRetirada}
                dataRetiradaNova={dataRetiradaNova}
                validadeNova={validadeNova}
                validadeCalculadaPelaRetirada={validadeCalculadaPelaRetirada}
                dataRetiradaCalculada={dataRetiradaCalculada}
              />
            </div>

            <div className="space-y-3">
              <section
                className="
                  rounded-[1.6rem] border border-white/10 bg-white/[0.06]
                  p-3 shadow-lg backdrop-blur-xl
                "
              >
                <button
                  type="button"
                  onClick={() => setAbrirLotes((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                      <CalendarDays size={21} />
                    </div>

                    <div className="min-w-0 text-left">
                      <p className="text-sm font-black">
                        {temLotes ? "Escolher ou editar validade" : "Nenhum lote ainda"}
                      </p>

                      <p className="truncate text-xs text-white/55">
                        {temLotes
                          ? `${lotes.length} validade${lotes.length > 1 ? "s" : ""}`
                          : "Crie uma validade para adicionar ao estoque"}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-white/55 transition ${abrirLotes ? "rotate-180" : ""}`}
                  />
                </button>

                {abrirLotes && temLotes && (
                  <div className="mt-3 space-y-2">
                    {lotesOrdenados.map((lote, index) => (
                      <LoteCard
                        key={lote.id || `${lote.codigo}-${lote.validade}`}
                        lote={lote}
                        destaque={index === 0}
                        quantidade={quantidade}
                        processando={processando}
                        formatarData={formatarData}
                        formatarValidadeDigitada={formatarValidadeDigitada}
                        onSomar={() => somarNoLote(lote)}
                        onAtualizar={
                          onAtualizarLote
                            ? (alteracoes) => atualizarLote(lote, alteracoes)
                            : null
                        }
                      />
                    ))}
                  </div>
                )}
              </section>

              <CriarValidadeBox
                quantidade={quantidade}
                validadeNova={validadeNova}
                dataRetiradaNova={dataRetiradaNova}
                usarDataRetirada={usarDataRetirada}
                produtoJaPre={produtoJaPre}
                setProdutoJaPre={setProdutoJaPre}
                setUsarDataRetirada={setUsarDataRetirada}
                digitarValidade={digitarValidade}
                digitarRetirada={digitarRetirada}
                criarNovaValidade={criarNovaValidade}
                processando={processando}
                validadeCalculadaPelaRetirada={validadeCalculadaPelaRetirada}
                dataRetiradaCalculada={dataRetiradaCalculada}
                configProdutos={configProdutos}
              />

              <section
                className="
                  rounded-[1.6rem] border border-white/10 bg-white/[0.045]
                  p-3 text-xs text-white/55
                "
              >
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  <p>
                    Pós-scan centralizado: soma lote, cria nova validade, edita
                    produto e respeita as configurações do menu.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-slate-950/86 p-3">
          <button
            type="button"
            onClick={fechar}
            className="
              flex h-12 w-full items-center justify-center rounded-2xl
              border border-white/10 bg-white/[0.06] text-sm font-black
              text-white transition active:scale-95
            "
          >
            Voltar para o scanner
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HeaderScannerModal({
  produto,
  origemTexto,
  codigo,
  lotes,
  totalUnidades,
  loteMaisProximo,
  quantidade,
  produtoJaPre,
  usarDataRetirada,
  formatarData,
  onFechar,
}) {
  return (
    <div
      className="
        relative shrink-0 overflow-hidden border-b border-white/10
        bg-gradient-to-br from-emerald-700 via-emerald-900 to-slate-950
        p-4 text-white sm:p-5
      "
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-xl" />

      <div className="relative mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/30 sm:hidden" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden
              rounded-2xl border border-white/15 bg-black/25 shadow-xl
              sm:h-16 sm:w-16
            "
          >
            {produto.imagem ? (
              <img
                src={produto.imagem}
                alt={produto.nome || "Produto"}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon size={28} className="text-white/75" />
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <span
                className="
                  inline-flex items-center gap-1 rounded-full
                  border border-white/10 bg-white/12 px-2 py-0.5
                  text-[10px] font-black uppercase tracking-wide text-emerald-100
                "
              >
                <ScanBarcode size={11} />
                Scanner
              </span>

              {produtoJaPre && (
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-100">
                  Pré
                </span>
              )}

              {usarDataRetirada && (
                <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-black text-blue-100">
                  Retirada
                </span>
              )}
            </div>

            <h2 className="truncate text-xl font-black sm:text-2xl">
              {produto.nome || "Produto encontrado"}
            </h2>

            <p className="truncate text-xs font-semibold text-emerald-100/80">
              {origemTexto} · {codigo || "sem código"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="
            flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
            bg-white text-slate-950 shadow-xl transition active:scale-95
          "
          aria-label="Fechar"
        >
          <X size={22} strokeWidth={3} />
        </button>
      </div>

      <div className="relative mt-4 grid grid-cols-4 gap-2">
        <MiniInfo label="Lotes" valor={lotes.length} />
        <MiniInfo label="Unid." valor={totalUnidades} />
        <MiniInfo label="Somar" valor={`x${quantidade}`} />
        <MiniInfo
          label="Próximo"
          valor={loteMaisProximo ? formatarData?.(loteMaisProximo.validade) : "Novo"}
        />
      </div>
    </div>
  );
}

function MiniInfo({ label, valor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-2 text-center backdrop-blur-sm">
      <p className="truncate text-[10px] font-black uppercase tracking-wide text-emerald-100/75">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-white sm:text-sm">
        {valor}
      </p>
    </div>
  );
}

function AvisoAcao({ ultimaAcao }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-[1.35rem] border p-3
        ${
          ultimaAcao.tipo === "erro"
            ? "border-red-400/20 bg-red-500/12 text-red-100"
            : "border-emerald-400/20 bg-emerald-500/12 text-emerald-100"
        }
      `}
    >
      <div className="flex items-center gap-2">
        {ultimaAcao.tipo === "erro" ? (
          <TriangleAlert size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
        <p className="text-sm font-black">{ultimaAcao.texto}</p>
      </div>

      {ultimaAcao.tipo !== "erro" && (
        <p className="mt-1 text-xs text-emerald-100/70">
          Pode ajustar mais coisas ou voltar manualmente para o scanner.
        </p>
      )}
    </motion.div>
  );
}

function ResumoProduto({ produto, codigo, onEditar, editando, podeEditar }) {
  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-3 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
            <Package size={20} />
          </div>

          <div>
            <p className="text-sm font-black">Resumo do produto</p>
            <p className="text-xs text-white/55">Dados principais do item</p>
          </div>
        </div>

        {podeEditar && (
          <button
            type="button"
            onClick={onEditar}
            className={`
              flex h-10 items-center gap-1.5 rounded-2xl px-3 text-xs font-black
              transition active:scale-95
              ${
                editando
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/10 text-white"
              }
            `}
          >
            <Edit3 size={15} />
            Editar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoChip icon={Barcode} label="Código" value={codigo || "Sem código"} />
        <InfoChip icon={Tag} label="Setor" value={produto.setor || "Medicamentos"} />
        <InfoChip
          icon={Settings2}
          label="Retirar"
          value={`${Number(produto.diasRemover || 7)} dias antes`}
        />
        <InfoChip
          icon={CalendarDays}
          label="Pré"
          value={
            produto.diasPreVencido
              ? `${Number(produto.diasPreVencido)} dias antes`
              : "Não definido"
          }
        />
      </div>
    </section>
  );
}

function EditarProdutoBox({
  edicao,
  setores,
  setoresTotais,
  mostrarTodosSetores,
  setMostrarTodosSetores,
  salvando,
  processando,
  inputImagemRef,
  onImagem,
  onRemoverImagem,
  onChange,
  onSalvar,
}) {
  return (
    <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/10 p-3 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-100">
          <Edit3 size={21} />
        </div>

        <div>
          <p className="text-sm font-black text-emerald-50">Editar produto</p>
          <p className="text-xs text-emerald-100/65">
            Nome, foto, setor e regras do item
          </p>
        </div>
      </div>

      <input
        ref={inputImagemRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImagem}
      />

      <div className="mb-3 flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
          {edicao.imagem ? (
            <img
              src={edicao.imagem}
              alt="Foto do produto"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={25} className="text-white/55" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Foto do produto</p>
          <p className="text-xs text-white/55">Use câmera ou galeria do celular</p>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputImagemRef.current?.click()}
              className="
                flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3
                text-xs font-black text-white transition active:scale-95
              "
            >
              <Camera size={14} />
              Trocar
            </button>

            {edicao.imagem && (
              <button
                type="button"
                onClick={onRemoverImagem}
                className="
                  flex h-9 items-center rounded-xl bg-red-500/15 px-3
                  text-xs font-black text-red-100 transition active:scale-95
                "
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <CampoTexto
          label="Nome"
          value={edicao.nome}
          onChange={(valor) => onChange("nome", valor)}
          placeholder="Nome do produto"
        />

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-xs font-black text-white/70">Setor</label>

            {setoresTotais.length > setores.length && (
              <button
                type="button"
                onClick={() => setMostrarTodosSetores((prev) => !prev)}
                className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white/70"
              >
                {mostrarTodosSetores ? "Úteis" : "Todos"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {setores.map((setor) => {
              const ativo = edicao.setor === setor;

              return (
                <button
                  key={setor}
                  type="button"
                  onClick={() => onChange("setor", setor)}
                  className={`
                    min-h-10 rounded-2xl border px-2 py-2 text-xs font-black
                    transition active:scale-95
                    ${
                      ativo
                        ? "border-emerald-400 bg-emerald-500 text-white"
                        : "border-white/10 bg-black/20 text-white/75"
                    }
                  `}
                >
                  {setor}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CampoTexto
            label="Retirar antes"
            value={edicao.diasRemover}
            onChange={(valor) => onChange("diasRemover", valor.replace(/\D/g, ""))}
            placeholder="7"
            inputMode="numeric"
            sufixo="dias"
          />

          <CampoTexto
            label="Pré-vencimento"
            value={edicao.diasPreVencido}
            onChange={(valor) => onChange("diasPreVencido", valor.replace(/\D/g, ""))}
            placeholder="Opcional"
            inputMode="numeric"
            sufixo="dias"
          />
        </div>

        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando || processando}
          className="
            mt-1 flex h-12 w-full items-center justify-center gap-2
            rounded-2xl bg-emerald-600 text-sm font-black text-white
            shadow-lg shadow-emerald-600/25 transition active:scale-95
            disabled:cursor-not-allowed disabled:opacity-45
          "
        >
          {salvando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Salvar alterações
        </button>
      </div>
    </section>
  );
}

function QuantidadeBox({
  quantidade,
  setQuantidade,
  alterarQuantidade,
  definirAtalho,
}) {
  const atalhos = [1, 5, 10, 20, 50];

  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-3 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">Quantidade da ação</p>
          <p className="text-xs text-white/55">Soma na validade escolhida</p>
        </div>

        <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-200">
          x{quantidade}
        </div>
      </div>

      <div className="grid grid-cols-[46px_minmax(0,1fr)_46px] gap-2">
        <button
          type="button"
          onClick={() => alterarQuantidade(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition active:scale-95"
          aria-label="Diminuir quantidade"
        >
          <Minus size={18} />
        </button>

        <input
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          inputMode="numeric"
          className="
            h-12 min-w-0 rounded-2xl border border-white/10 bg-black/25
            text-center text-xl font-black text-white outline-none
            focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
          "
          aria-label="Quantidade"
        />

        <button
          type="button"
          onClick={() => alterarQuantidade(1)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 transition active:scale-95"
          aria-label="Aumentar quantidade"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {atalhos.map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => definirAtalho(valor)}
            className={`
              rounded-2xl px-2 py-2 text-[11px] font-black transition active:scale-95
              ${
                Number(quantidade) === valor
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/10 text-white/72"
              }
            `}
          >
            x{valor}
          </button>
        ))}
      </div>
    </section>
  );
}

function CriarValidadeBox({
  quantidade,
  validadeNova,
  dataRetiradaNova,
  usarDataRetirada,
  produtoJaPre,
  setProdutoJaPre,
  setUsarDataRetirada,
  digitarValidade,
  digitarRetirada,
  criarNovaValidade,
  processando,
  validadeCalculadaPelaRetirada,
  dataRetiradaCalculada,
  configProdutos,
}) {
  const podeCriar = usarDataRetirada
    ? Boolean(validadeCalculadaPelaRetirada)
    : Boolean(String(validadeNova || "").trim());

  return (
    <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/10 p-3 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-100">
          <PackagePlus size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black text-emerald-50">
            Adicionar outra validade
          </p>

          <p className="text-xs text-emerald-100/65">
            Mesmo item com data diferente
          </p>
        </div>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        {configProdutos.produtoPreVencimento && (
          <BotaoModo
            ativo={produtoJaPre}
            icon={Zap}
            titulo="Já está em pré"
            texto="Etiqueta especial"
            onClick={() => setProdutoJaPre((prev) => !prev)}
          />
        )}

        {configProdutos.permitirDataRetirada && (
          <BotaoModo
            ativo={usarDataRetirada}
            icon={CalendarDays}
            titulo="Tenho retirada"
            texto="Calcular validade"
            onClick={() => setUsarDataRetirada((prev) => !prev)}
            azul
          />
        )}
      </div>

      {usarDataRetirada ? (
        <div className="space-y-2">
          <CampoTexto
            label="Data de retirada"
            value={dataRetiradaNova}
            onChange={digitarRetirada}
            placeholder="mmaa ou ddmmaaaa"
            inputMode="numeric"
          />

          <p className="text-xs font-semibold text-emerald-100/70">
            {validadeCalculadaPelaRetirada
              ? `Validade calculada: ${validadeCalculadaPelaRetirada.toLocaleDateString("pt-BR")}`
              : "O app soma os dias de retirada e calcula a validade."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <CampoTexto
            label="Nova validade"
            value={validadeNova}
            onChange={digitarValidade}
            placeholder="mmaa ou ddmmaaaa"
            inputMode="numeric"
          />

          <p className="text-xs font-semibold text-emerald-100/70">
            {dataRetiradaCalculada
              ? `Retirada calculada: ${dataRetiradaCalculada.toLocaleDateString("pt-BR")}`
              : `Essa validade será criada com x${quantidade}.`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={criarNovaValidade}
        disabled={processando || !podeCriar}
        className="
          mt-3 flex h-12 w-full items-center justify-center gap-2
          rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white
          shadow-lg shadow-emerald-600/25 transition active:scale-95
          disabled:cursor-not-allowed disabled:opacity-45
        "
      >
        {processando ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Plus size={18} />
        )}
        Adicionar x{quantidade}
      </button>
    </section>
  );
}

function BotaoModo({ ativo, icon: Icon, titulo, texto, onClick, azul = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 rounded-2xl border p-2.5 text-left transition active:scale-[0.98]
        ${
          ativo
            ? azul
              ? "border-blue-400 bg-blue-600 text-white"
              : "border-amber-400 bg-amber-500 text-white"
            : "border-white/10 bg-black/20 text-white/75"
        }
      `}
    >
      <Icon size={17} className="shrink-0" />

      <div className="min-w-0">
        <p className="text-xs font-black">{titulo}</p>
        <p className={`truncate text-[11px] ${ativo ? "text-white/80" : "text-white/45"}`}>
          {texto}
        </p>
      </div>
    </button>
  );
}

function ResumoInteligente({
  produto,
  produtoJaPre,
  usarDataRetirada,
  dataRetiradaNova,
  validadeNova,
  validadeCalculadaPelaRetirada,
  dataRetiradaCalculada,
}) {
  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-3 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
          <Sparkles size={18} />
        </div>

        <div>
          <p className="text-sm font-black">Resumo inteligente</p>
          <p className="text-xs text-white/50">Regras aplicadas no pós-scan</p>
        </div>
      </div>

      <div className="space-y-2">
        <ResumoLinha icon={Tag} label="Setor" value={produto.setor || "Medicamentos"} />
        <ResumoLinha
          icon={Trash2}
          label="Retirar"
          value={`${Number(produto.diasRemover || 7)} dias antes`}
        />
        <ResumoLinha
          icon={TriangleAlert}
          label="Pré"
          value={
            produtoJaPre
              ? "Produto já em pré"
              : produto.diasPreVencido
              ? `${Number(produto.diasPreVencido)} dias`
              : "Não definido"
          }
        />
        <ResumoLinha
          icon={CalendarDays}
          label={usarDataRetirada ? "Retirada" : "Nova validade"}
          value={
            usarDataRetirada
              ? dataRetiradaNova || "Não informada"
              : validadeNova || "Não informada"
          }
        />
      </div>

      {usarDataRetirada && validadeCalculadaPelaRetirada && (
        <p className="mt-3 rounded-2xl bg-blue-500/10 p-3 text-xs font-bold text-blue-100">
          Validade calculada: {validadeCalculadaPelaRetirada.toLocaleDateString("pt-BR")}
        </p>
      )}

      {!usarDataRetirada && dataRetiradaCalculada && (
        <p className="mt-3 rounded-2xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-100">
          Retirada calculada: {dataRetiradaCalculada.toLocaleDateString("pt-BR")}
        </p>
      )}
    </section>
  );
}

function LoteCard({
  lote,
  destaque,
  quantidade,
  processando,
  formatarData,
  formatarValidadeDigitada,
  onSomar,
  onAtualizar,
}) {
  const validadeTexto = formatarData ? formatarData(lote.validade) : lote.validade;
  const estoqueAtual = Number(lote.quantidade || 1);
  const estoqueFinal = estoqueAtual + Number(quantidade || 1);
  const status = getStatusLote(lote.validade);

  const [editando, setEditando] = useState(false);
  const [validadeEditada, setValidadeEditada] = useState(validadeTexto || "");
  const [quantidadeEditada, setQuantidadeEditada] = useState(String(estoqueAtual));

  function alterarValidade(valor) {
    const formatada = formatarValidadeDigitada
      ? formatarValidadeDigitada(valor)
      : formatarValidade(valor);

    setValidadeEditada(formatada);
  }

  function salvarEdicaoLote() {
    onAtualizar?.({
      validade: validadeEditada,
      quantidade: Number(quantidadeEditada || 1),
    });

    setEditando(false);
  }

  return (
    <div
      className={`
        rounded-[1.35rem] border p-3
        ${
          destaque
            ? "border-emerald-400/25 bg-emerald-500/10"
            : "border-white/10 bg-black/20"
        }
      `}
    >
      {!editando ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-black text-white">
                {validadeTexto}
              </p>

              {destaque && (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
                  próxima
                </span>
              )}

              {status === "vencido" && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                  vencida
                </span>
              )}

              {status === "alerta" && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  atenção
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-white/50">
              Atual <span className="font-black text-white">x{estoqueAtual}</span>
              {"  "}→{"  "}
              <span className="font-black text-emerald-200">x{estoqueFinal}</span>
            </p>

            <p className="mt-1 text-[11px] font-semibold text-white/40">
              {textoDias(lote.validade)}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            {onAtualizar && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="
                  flex h-11 w-11 items-center justify-center rounded-2xl
                  bg-white/10 text-white transition active:scale-95
                "
                aria-label="Editar validade"
              >
                <Edit3 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onSomar}
              disabled={processando}
              className="
                flex h-11 shrink-0 items-center justify-center gap-1.5
                rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white
                shadow-lg shadow-emerald-600/20 transition active:scale-95
                disabled:cursor-not-allowed disabled:opacity-45
              "
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              +{quantidade}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
            <CampoTexto
              label="Validade"
              value={validadeEditada}
              onChange={alterarValidade}
              placeholder="mmaa ou ddmmaaaa"
              inputMode="numeric"
            />

            <CampoTexto
              label="Qtd"
              value={quantidadeEditada}
              onChange={(valor) => setQuantidadeEditada(valor.replace(/\D/g, ""))}
              placeholder="1"
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="
                h-10 rounded-2xl border border-white/10 bg-white/[0.06]
                text-xs font-black text-white transition active:scale-95
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvarEdicaoLote}
              disabled={processando}
              className="
                flex h-10 items-center justify-center gap-1.5 rounded-2xl
                bg-emerald-600 text-xs font-black text-white
                transition active:scale-95 disabled:opacity-45
              "
            >
              <Save size={15} />
              Salvar lote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
  sufixo,
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black text-white/70">
        {label}
      </label>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`
            h-12 w-full rounded-2xl border border-white/10 bg-black/25
            px-4 text-sm font-black text-white outline-none
            placeholder:text-white/35
            focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
            ${sufixo ? "pr-14" : ""}
          `}
        />

        {sufixo && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-white/40">
            {sufixo}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/18 p-3 backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-100/70">
        <Icon size={12} />
        {label}
      </div>

      <p className="truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

function ResumoLinha({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/18 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-white/55">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>

      <strong className="truncate text-right text-white">{value}</strong>
    </div>
  );
}

function parseDataSegura(valor) {
  if (!valor) return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor;
  }

  const texto = String(valor).trim();
  const digitos = texto.replace(/\D/g, "");

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);
    const data = new Date(ano, mes - 1, dia);

    if (
      data.getDate() !== dia ||
      data.getMonth() !== mes - 1 ||
      data.getFullYear() !== ano
    ) {
      return null;
    }

    return data;
  }

  if (/^\d{2}\/\d{4}$/.test(texto)) {
    const [mesTexto, anoTexto] = texto.split("/");
    const mes = Number(mesTexto);
    const ano = Number(anoTexto);

    if (mes < 1 || mes > 12) return null;

    const ultimoDia = new Date(ano, mes, 0).getDate();
    return new Date(ano, mes - 1, ultimoDia);
  }

  if (/^\d{2}\/\d{2}$/.test(texto) || /^\d{4}$/.test(digitos)) {
    const mes = Number(digitos.slice(0, 2));
    const ano = 2000 + Number(digitos.slice(2, 4));

    if (mes < 1 || mes > 12) return null;

    const ultimoDia = new Date(ano, mes, 0).getDate();
    return new Date(ano, mes - 1, ultimoDia);
  }

  if (/^\d{8}$/.test(digitos)) {
    const dia = Number(digitos.slice(0, 2));
    const mes = Number(digitos.slice(2, 4));
    const ano = Number(digitos.slice(4, 8));
    const data = new Date(ano, mes - 1, dia);

    if (
      data.getDate() !== dia ||
      data.getMonth() !== mes - 1 ||
      data.getFullYear() !== ano
    ) {
      return null;
    }

    return data;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);

    if (
      data.getDate() !== dia ||
      data.getMonth() !== mes - 1 ||
      data.getFullYear() !== ano
    ) {
      return null;
    }

    return data;
  }

  const convertida = new Date(texto);
  return Number.isNaN(convertida.getTime()) ? null : convertida;
}

function dataParaTextoBR(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) return "";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatarValidade(valorDigitado) {
  const valor = String(valorDigitado || "")
    .replace(/\D/g, "")
    .slice(0, 8);

  if (valor.length <= 2) return valor;

  if (valor.length <= 4) {
    return `${valor.slice(0, 2)}/${valor.slice(2)}`;
  }

  return `${valor.slice(0, 2)}/${valor.slice(2, 4)}/${valor.slice(4)}`;
}

function calcularDiasAte(valor) {
  const data = parseDataSegura(valor);

  if (!data) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const alvo = new Date(data);
  alvo.setHours(0, 0, 0, 0);

  return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
}

function textoDias(valor) {
  const dias = calcularDiasAte(valor);

  if (dias === null) return "Sem cálculo";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias < 0) return `${Math.abs(dias)} dias vencido`;

  return `Em ${dias} dias`;
}

function getStatusLote(valor) {
  const dias = calcularDiasAte(valor);

  if (dias === null) return "neutro";
  if (dias < 0) return "vencido";
  if (dias <= 30) return "alerta";

  return "ok";
}

export default ModalScannerProduto;
