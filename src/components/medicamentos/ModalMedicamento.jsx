import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import ToastStack from "../ToastStack";

import {
  Boxes,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ImagePlus,
  Images,
  Info,
  Loader2,
  Minus,
  Package,
  Pill,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
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

      const parsed = JSON.parse(bruto);
      return {
        ...CONFIG_PADRAO,
        ...(parsed || {}),
      };
    } catch {
      // Continua tentando outras chaves.
    }
  }

  return CONFIG_PADRAO;
}

function ModalMedicamento({
  abrirModal,
  setAbrirModal,
  editando,

  imagem,
  setImagem,

  nome,
  setNome,

  setor = "Medicamentos",
  setSetor = () => {},

  quantidade,
  setQuantidade,

  validade,
  setValidade,

  diasRemover,
  setDiasRemover,

  diasPre,
  setDiasPre,

  gerarPreviewDatas,
  salvar,
  handleImagem,

  toasts,
  removerToast,
}) {
  const cameraInputRef = useRef(null);
  const galeriaInputRef = useRef(null);
  const aplicouConfigRef = useRef(false);

  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [configProdutos, setConfigProdutos] = useState(() =>
    carregarConfigProdutos()
  );
  const [mostrarTodosSetores, setMostrarTodosSetores] = useState(false);
  const [produtoJaPre, setProdutoJaPre] = useState(false);
  const [usarDataRetirada, setUsarDataRetirada] = useState(false);
  const [dataRetirada, setDataRetirada] = useState("");
  const [abrirConfiguracoesRapidas, setAbrirConfiguracoesRapidas] =
    useState(false);

  const setorPrincipal = configProdutos.setorPrincipal || "Medicamentos";
  const setorSelecionado = setor || setorPrincipal || "Medicamentos";
  const diasRetiradaPadrao = Number(configProdutos.diasRetiradaPadrao || 30);
  const diasPrePadrao = configProdutos.diasPrePadrao || "";

  const setoresDisponiveis = useMemo(() => {
    const unicos = new Set([setorPrincipal, setorSelecionado, ...SETORES_PADRAO]);
    return Array.from(unicos).filter(Boolean);
  }, [setorPrincipal, setorSelecionado]);

  const setoresVisiveis = useMemo(() => {
    if (!configProdutos.mostrarSoBotoesUteis || mostrarTodosSetores) {
      return setoresDisponiveis;
    }

    const principais = [
      setorPrincipal,
      setorSelecionado,
      "Medicamentos",
    ].filter(Boolean);

    return Array.from(new Set(principais)).filter((item) =>
      setoresDisponiveis.includes(item)
    );
  }, [
    configProdutos.mostrarSoBotoesUteis,
    mostrarTodosSetores,
    setoresDisponiveis,
    setorPrincipal,
    setorSelecionado,
  ]);

  const preview = validarData(validade) ? gerarPreviewDatas() : null;

  const dataRetiradaCalculada = useMemo(() => {
    const data = dataValidadeParaDate(validade);
    if (!data) return null;

    const remover = new Date(data);
    remover.setDate(remover.getDate() - Number(diasRemover || 0));

    return remover;
  }, [validade, diasRemover]);

  const validadeCalculadaPelaRetirada = useMemo(() => {
    if (!usarDataRetirada || !validarData(dataRetirada)) return null;

    const retirada = dataValidadeParaDate(dataRetirada);
    if (!retirada) return null;

    const calculada = new Date(retirada);
    calculada.setDate(calculada.getDate() + Number(diasRemover || 0));

    return calculada;
  }, [usarDataRetirada, dataRetirada, diasRemover]);

  const progresso = useMemo(() => {
    let pontos = 0;

    if (nome.trim()) pontos += 22;
    if (setorSelecionado) pontos += 10;
    if (Number(quantidade || 0) > 0) pontos += 18;
    if (validarData(validade)) pontos += 30;
    if (diasRemover !== "" && Number(diasRemover) >= 0) pontos += 12;
    if (imagem) pontos += 8;

    return Math.min(100, pontos);
  }, [nome, setorSelecionado, quantidade, validade, diasRemover, imagem]);

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
    if (!abrirModal) {
      aplicouConfigRef.current = false;
      setMostrarTodosSetores(false);
      setProdutoJaPre(false);
      setUsarDataRetirada(false);
      setDataRetirada("");
      setAbrirConfiguracoesRapidas(false);
      destravarResquiciosDoModal();

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );

      return;
    }

    destravarResquiciosDoModal();

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: true },
      })
    );

    if (!editando && !aplicouConfigRef.current) {
      aplicouConfigRef.current = true;

      if (configProdutos.usarSetorPrincipal && setorPrincipal) {
        setSetor(setorPrincipal);
      }

      if (configProdutos.datasAutomaticas) {
        setDiasRemover(Number(configProdutos.diasRetiradaPadrao || 30));

        if (configProdutos.diasPrePadrao !== undefined) {
          setDiasPre(configProdutos.diasPrePadrao || "");
        }
      }
    }

    function fecharComEsc(e) {
      if (e.key === "Escape") {
        fecharModal();
      }
    }

    window.addEventListener("keydown", fecharComEsc);

    return () => {
      window.removeEventListener("keydown", fecharComEsc);

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );

      setTimeout(destravarResquiciosDoModal, 60);
      setTimeout(destravarResquiciosDoModal, 250);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirModal, editando, configProdutos, setorPrincipal]);

  useEffect(() => {
    if (!abrirModal) return;
    if (!usarDataRetirada) return;
    if (!validadeCalculadaPelaRetirada) return;

    setValidade(dataParaTextoBR(validadeCalculadaPelaRetirada));
    limparErro("validade");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirModal, usarDataRetirada, validadeCalculadaPelaRetirada]);

  if (!abrirModal) return null;

  function destravarResquiciosDoModal() {
    const main = document.querySelector("main");

    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.height = "";
    document.body.style.touchAction = "";
    document.body.style.overscrollBehavior = "";
    document.body.removeAttribute("data-modal-medicamento-open");
    document.body.removeAttribute("data-modal-medicamento-lock");
    document.body.classList.remove("app-modal-open");
    document.body.classList.remove("modal-open");

    document.documentElement.style.overflow = "";
    document.documentElement.style.position = "";
    document.documentElement.style.height = "";
    document.documentElement.style.touchAction = "";
    document.documentElement.style.overscrollBehavior = "";
    document.documentElement.removeAttribute("data-modal-medicamento-open");
    document.documentElement.removeAttribute("data-modal-medicamento-lock");

    if (main) {
      main.style.overflow = "";
      main.style.position = "";
      main.style.touchAction = "";
      main.style.overscrollBehavior = "";
      main.removeAttribute("data-modal-medicamento-open");
      main.removeAttribute("data-modal-medicamento-lock");
    }
  }

  function limparErro(campo) {
    setErros((prev) => {
      const novo = { ...prev };
      delete novo[campo];
      delete novo.geral;
      return novo;
    });
  }

  function dataValidadeParaDate(valor) {
    if (!valor) return null;

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

      if (mes < 1 || mes > 12 || ano < 2024 || ano > 2100) return null;

      const ultimoDia = new Date(ano, mes, 0).getDate();
      return new Date(ano, mes - 1, ultimoDia);
    }

    if (/^\d{2}\/\d{2}$/.test(texto) || /^\d{4}$/.test(digitos)) {
      const mes = Number(digitos.slice(0, 2));
      const ano = 2000 + Number(digitos.slice(2, 4));

      if (mes < 1 || mes > 12 || ano < 2024 || ano > 2100) return null;

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

    return null;
  }

  function validarData(data) {
    return Boolean(dataValidadeParaDate(data));
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

  function prepararModoDataRetirada() {
    const proximo = !usarDataRetirada;
    setUsarDataRetirada(proximo);

    if (proximo && dataRetiradaCalculada) {
      setDataRetirada(dataParaTextoBR(dataRetiradaCalculada));
    }
  }

  function ativarProdutoJaPre() {
    setProdutoJaPre((prev) => {
      const proximo = !prev;

      if (proximo && configProdutos.produtoPreVencimento) {
        if (diasPre === "" && diasPrePadrao !== "") {
          setDiasPre(diasPrePadrao);
        }
      }

      return proximo;
    });
  }

  async function handleSalvar() {
    const novosErros = {};

    if (!nome.trim()) {
      novosErros.nome = "Informe o nome do produto.";
    }

    if (!setorSelecionado) {
      novosErros.setor = "Escolha o setor do produto.";
    }

    if (!quantidade || Number(quantidade) < 1) {
      novosErros.quantidade = "Informe uma quantidade válida.";
    }

    if (!validarData(validade)) {
      novosErros.validade =
        "Informe uma validade válida. Ex: 0427 ou 25/12/2026.";
    }

    if (usarDataRetirada && !validarData(dataRetirada)) {
      novosErros.dataRetirada = "Informe a data de retirada da etiqueta.";
    }

    if (diasRemover === "" || Number(diasRemover) < 0) {
      novosErros.diasRemover = "Informe os dias para remoção.";
    }

    if (diasPre !== "" && Number(diasPre) < 0) {
      novosErros.diasPre = "Informe um valor válido.";
    }

    if (Object.keys(novosErros).length > 0) {
      novosErros.geral = "Revise os campos destacados antes de salvar.";
      setErros(novosErros);
      return;
    }

    try {
      setSalvando(true);
      setErros({});
      await Promise.resolve(salvar());
    } finally {
      setSalvando(false);
      setTimeout(destravarResquiciosDoModal, 80);
    }
  }

  function fecharModal() {
    setErros({});
    setSalvando(false);
    setAbrirModal(false);

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: false },
      })
    );

    setTimeout(destravarResquiciosDoModal, 60);
    setTimeout(destravarResquiciosDoModal, 250);
  }

  function alterarQuantidade(delta) {
    const atual = Number(quantidade || 1);
    const proximo = Math.max(1, Math.min(9999, atual + delta));

    limparErro("quantidade");
    setQuantidade(proximo);
  }

  function abrirCamera() {
    cameraInputRef.current?.click();
  }

  function abrirGaleria() {
    galeriaInputRef.current?.click();
  }

  function limparInputArquivo(e) {
    e.currentTarget.value = "";
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        className="
          fixed inset-0 z-[2147483647] h-[100dvh] overflow-hidden
          bg-slate-950 text-white
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.1),rgba(2,6,23,0.55))]" />

        <motion.div
          data-modal-medicamento="true"
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.985 }}
          transition={{ duration: 0.22 }}
          className="
            relative mx-auto flex h-[100dvh] w-full flex-col overflow-hidden
            bg-white text-gray-950 dark:bg-gray-950 dark:text-white
            sm:my-4 sm:h-[calc(100dvh-2rem)] sm:max-w-5xl
            sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-2xl
          "
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-500/10 to-transparent" />

          <div className="absolute left-1/2 top-3 z-50 w-[92%] max-w-sm -translate-x-1/2">
            <ToastStack notificacoes={toasts} remover={removerToast} />
          </div>

          <HeaderModal
            editando={editando}
            progresso={progresso}
            setorSelecionado={setorSelecionado}
            produtoJaPre={produtoJaPre}
            usarDataRetirada={usarDataRetirada}
            onFechar={fecharModal}
          />

          <div
            data-modal-scroll="true"
            className="
              relative min-h-0 flex-1 overflow-y-auto overscroll-contain
              px-4 py-4 sm:px-5
            "
          >
            <div className="mx-auto grid max-w-5xl gap-4 pb-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="space-y-4">
                {erros.geral && <AvisoErro texto={erros.geral} />}

                <FotoProdutoBox
                  imagem={imagem}
                  cameraInputRef={cameraInputRef}
                  galeriaInputRef={galeriaInputRef}
                  abrirCamera={abrirCamera}
                  abrirGaleria={abrirGaleria}
                  limparInputArquivo={limparInputArquivo}
                  handleImagem={handleImagem}
                  setImagem={setImagem}
                  qualidade={configProdutos.qualidadeFotoLocal}
                />

                <ResumoInteligente
                  setorSelecionado={setorSelecionado}
                  diasRemover={diasRemover}
                  diasPre={diasPre}
                  produtoJaPre={produtoJaPre}
                  usarDataRetirada={usarDataRetirada}
                  dataRetirada={dataRetirada}
                  validade={validade}
                  preview={preview}
                />
              </div>

              <div className="space-y-4">
                <DadosPrincipaisBox
                  nome={nome}
                  setNome={setNome}
                  setorSelecionado={setorSelecionado}
                  setSetor={setSetor}
                  quantidade={quantidade}
                  setQuantidade={setQuantidade}
                  alterarQuantidade={alterarQuantidade}
                  setoresVisiveis={setoresVisiveis}
                  setoresDisponiveis={setoresDisponiveis}
                  mostrarTodosSetores={mostrarTodosSetores}
                  setMostrarTodosSetores={setMostrarTodosSetores}
                  erros={erros}
                  limparErro={limparErro}
                />

                <ValidadeBox
                  validade={validade}
                  setValidade={setValidade}
                  validarData={validarData}
                  formatarValidade={formatarValidade}
                  diasRemover={diasRemover}
                  setDiasRemover={setDiasRemover}
                  diasPre={diasPre}
                  setDiasPre={setDiasPre}
                  erros={erros}
                  limparErro={limparErro}
                  preview={preview}
                  produtoJaPre={produtoJaPre}
                  ativarProdutoJaPre={ativarProdutoJaPre}
                  usarDataRetirada={usarDataRetirada}
                  prepararModoDataRetirada={prepararModoDataRetirada}
                  dataRetirada={dataRetirada}
                  setDataRetirada={setDataRetirada}
                  dataRetiradaCalculada={dataRetiradaCalculada}
                  validadeCalculadaPelaRetirada={validadeCalculadaPelaRetirada}
                  configProdutos={configProdutos}
                />

                <ConfiguracaoRapidaBox
                  aberto={abrirConfiguracoesRapidas}
                  setAberto={setAbrirConfiguracoesRapidas}
                  configProdutos={configProdutos}
                  setorPrincipal={setorPrincipal}
                  diasRetiradaPadrao={diasRetiradaPadrao}
                  diasPrePadrao={diasPrePadrao}
                  aplicarPadrao={() => {
                    setSetor(setorPrincipal);
                    setDiasRemover(diasRetiradaPadrao);
                    setDiasPre(diasPrePadrao || "");
                  }}
                />
              </div>
            </div>
          </div>

          <FooterModal
            editando={editando}
            salvando={salvando}
            onCancelar={fecharModal}
            onSalvar={handleSalvar}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

function HeaderModal({
  editando,
  progresso,
  setorSelecionado,
  produtoJaPre,
  usarDataRetirada,
  onFechar,
}) {
  return (
    <div className="relative shrink-0 border-b border-gray-200/80 bg-white/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.9rem)] backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/95 sm:p-5">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700 sm:hidden" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl
              bg-gradient-to-br from-emerald-500 via-emerald-700 to-slate-950 text-white
              shadow-lg shadow-emerald-700/25
            "
          >
            <Package size={27} />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span
                className="
                  inline-flex items-center gap-1.5 rounded-full
                  bg-emerald-100 px-2.5 py-1 text-[11px] font-black
                  text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300
                "
              >
                <Sparkles size={13} />
                {editando ? "Modo edição" : "Novo cadastro"}
              </span>

              {produtoJaPre && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Pré
                </span>
              )}

              {usarDataRetirada && (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  Retirada
                </span>
              )}
            </div>

            <h2 className="truncate text-xl font-black tracking-tight sm:text-2xl">
              {editando ? "Editar produto" : "Novo produto"}
            </h2>

            <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
              {setorSelecionado} · validade, retirada, estoque e imagem.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="
            flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
            bg-gray-100 text-gray-600 transition hover:bg-gray-200 active:scale-95
            dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15
          "
          aria-label="Fechar modal"
        >
          <X size={22} />
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <span>Cadastro</span>
          <span>{progresso}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          <motion.div
            initial={false}
            animate={{ width: `${progresso}%` }}
            transition={{ duration: 0.25 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700"
          />
        </div>
      </div>
    </div>
  );
}

function FotoProdutoBox({
  imagem,
  cameraInputRef,
  galeriaInputRef,
  abrirCamera,
  abrirGaleria,
  limparInputArquivo,
  handleImagem,
  setImagem,
  qualidade,
}) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-gray-200 bg-gray-50/80 p-4 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <LabelArea icon={ImagePlus} label="Foto do produto" optional />

        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {qualidade || "boa"}
        </span>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onClick={limparInputArquivo}
        onChange={handleImagem}
      />

      <input
        ref={galeriaInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/*"
        className="hidden"
        onClick={limparInputArquivo}
        onChange={handleImagem}
      />

      {!imagem ? (
        <div className="mt-3 rounded-[1.6rem] border-2 border-dashed border-emerald-500/35 bg-white p-4 dark:bg-gray-950/50">
          <div className="flex flex-col items-center gap-3 p-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
              <ImagePlus size={30} />
            </div>

            <div>
              <p className="font-black">Adicionar imagem</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Foto local em qualidade boa. Na nuvem vai compactada.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <BotaoImagem
              icon={Camera}
              titulo="Tirar foto"
              texto="Câmera"
              onClick={abrirCamera}
              destaque
            />

            <BotaoImagem
              icon={Images}
              titulo="Galeria"
              texto="Fotos"
              onClick={abrirGaleria}
            />
          </div>
        </div>
      ) : (
        <div className="relative mt-3 overflow-hidden rounded-[1.6rem] border border-gray-200 shadow-xl dark:border-white/10">
          <img
            src={imagem}
            alt="Preview do produto"
            className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/15 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
            <BotaoImagemOverlay icon={Camera} label="Foto" onClick={abrirCamera} />

            <BotaoImagemOverlay
              icon={Images}
              label="Galeria"
              onClick={abrirGaleria}
            />

            <button
              type="button"
              onClick={() => setImagem(null)}
              className="
                flex h-11 items-center justify-center gap-1.5 rounded-2xl
                bg-red-600 px-3 text-xs font-black text-white shadow-lg
                transition active:scale-95
              "
            >
              <Trash2 size={16} />
              Remover
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function DadosPrincipaisBox({
  nome,
  setNome,
  setorSelecionado,
  setSetor,
  quantidade,
  setQuantidade,
  alterarQuantidade,
  setoresVisiveis,
  setoresDisponiveis,
  mostrarTodosSetores,
  setMostrarTodosSetores,
  erros,
  limparErro,
}) {
  return (
    <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <SecaoTitulo
        icon={Package}
        titulo="Dados principais"
        texto="Nome, setor e quantidade do lote."
      />

      <div className="mt-4 space-y-4">
        <section>
          <LabelArea icon={Pill} label="Nome do produto" />

          <InputBase
            value={nome}
            onChange={(e) => {
              limparErro("nome");
              setNome(e.target.value);
            }}
            placeholder="Ex: Dipirona 500mg, Shampoo, Leite..."
            maxLength={80}
            erro={erros.nome}
          />

          <Dica texto={`${nome.length}/80 caracteres`} />

          {erros.nome && <MensagemErro texto={erros.nome} />}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <LabelArea icon={Boxes} label="Setor" />

            {setoresDisponiveis.length > setoresVisiveis.length && (
              <button
                type="button"
                onClick={() => setMostrarTodosSetores((prev) => !prev)}
                className="mb-2 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black text-gray-600 transition active:scale-95 dark:bg-white/10 dark:text-gray-300"
              >
                {mostrarTodosSetores ? "Ver úteis" : "Todos"}
              </button>
            )}
          </div>

          <div
            className={`
              grid grid-cols-2 gap-2 sm:grid-cols-3
              ${erros.setor ? "rounded-3xl border border-red-500/60 p-2" : ""}
            `}
          >
            {setoresVisiveis.map((item) => {
              const ativo = setorSelecionado === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    limparErro("setor");
                    setSetor(item);
                  }}
                  className={`
                    min-h-[44px] rounded-2xl border px-3 py-2 text-xs font-black
                    transition active:scale-95
                    ${
                      ativo
                        ? "border-emerald-600 bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"
                        : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                    }
                  `}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <Dica texto="Você pode deixar só o setor principal aparecendo pelo Menu." />

          {erros.setor && <MensagemErro texto={erros.setor} />}
        </section>

        <section>
          <LabelArea icon={Package} label="Quantidade" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alterarQuantidade(-1)}
              className="
                flex h-[52px] w-[52px] shrink-0 items-center justify-center
                rounded-2xl bg-gray-100 text-gray-700 transition active:scale-95
                dark:bg-white/10 dark:text-gray-200
              "
            >
              <Minus size={19} />
            </button>

            <InputBase
              type="number"
              value={quantidade}
              onChange={(e) => {
                limparErro("quantidade");
                setQuantidade(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="1"
              inputMode="numeric"
              erro={erros.quantidade}
            />

            <button
              type="button"
              onClick={() => alterarQuantidade(1)}
              className="
                flex h-[52px] w-[52px] shrink-0 items-center justify-center
                rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20
                transition active:scale-95
              "
            >
              <Plus size={19} />
            </button>
          </div>

          <Dica texto="Quantidade disponível no estoque." />

          {erros.quantidade && <MensagemErro texto={erros.quantidade} />}
        </section>
      </div>
    </section>
  );
}

function ValidadeBox({
  validade,
  setValidade,
  validarData,
  formatarValidade,
  diasRemover,
  setDiasRemover,
  diasPre,
  setDiasPre,
  erros,
  limparErro,
  preview,
  produtoJaPre,
  ativarProdutoJaPre,
  usarDataRetirada,
  prepararModoDataRetirada,
  dataRetirada,
  setDataRetirada,
  dataRetiradaCalculada,
  validadeCalculadaPelaRetirada,
  configProdutos,
}) {
  return (
    <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <SecaoTitulo
        icon={CalendarDays}
        titulo="Validade e retirada"
        texto="O app calcula a linha do tempo conforme sua seção."
        azul
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {configProdutos.produtoPreVencimento && (
          <BotaoModoInteligente
            ativo={produtoJaPre}
            icon={Zap}
            titulo="Já está em pré"
            texto="Produto já chegou com etiqueta diferente"
            onClick={ativarProdutoJaPre}
            cor="amber"
          />
        )}

        {configProdutos.permitirDataRetirada && (
          <BotaoModoInteligente
            ativo={usarDataRetirada}
            icon={CalendarDays}
            titulo="Tenho retirada"
            texto="Calcular validade pela retirada"
            onClick={prepararModoDataRetirada}
            cor="blue"
          />
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {usarDataRetirada && (
          <section className="sm:col-span-2">
            <LabelArea icon={CalendarDays} label="Data de retirada da etiqueta" />

            <InputBase
              value={dataRetirada}
              onChange={(e) => {
                limparErro("dataRetirada");
                setDataRetirada(formatarValidade(e.target.value));
              }}
              placeholder="Ex: 31032026"
              inputMode="numeric"
              maxLength={10}
              erro={
                erros.dataRetirada ||
                (dataRetirada &&
                  dataRetirada.length >= 4 &&
                  !validarData(dataRetirada))
              }
            />

            <Dica
              texto={
                validadeCalculadaPelaRetirada
                  ? `Validade calculada: ${validadeCalculadaPelaRetirada.toLocaleDateString(
                      "pt-BR"
                    )}`
                  : "Digite a retirada. O app soma os dias de retirada e calcula a validade."
              }
            />

            {erros.dataRetirada && <MensagemErro texto={erros.dataRetirada} />}
          </section>
        )}

        <section className="sm:col-span-2">
          <LabelArea
            icon={CalendarDays}
            label={usarDataRetirada ? "Validade calculada" : "Data de validade"}
          />

          <InputBase
            value={validade}
            onChange={(e) => {
              limparErro("validade");
              setValidade(formatarValidade(e.target.value));
            }}
            placeholder="0427 ou 25/12/2026"
            inputMode="numeric"
            maxLength={10}
            erro={
              erros.validade ||
              (validade && validade.length >= 4 && !validarData(validade))
            }
          />

          <Dica
            texto={
              usarDataRetirada
                ? "Pode editar manualmente se a conta da etiqueta estiver diferente."
                : "0427 vira 04/2027. 25122026 vira 25/12/2026."
            }
          />

          {validade &&
            validade.length >= 4 &&
            !validarData(validade) &&
            !erros.validade && <MensagemErro texto="Data inválida." />}

          {erros.validade && <MensagemErro texto={erros.validade} />}
        </section>

        <Campo
          icon={Trash2}
          label="Retirar antes"
          type="number"
          value={diasRemover}
          onChange={(valor) => {
            limparErro("diasRemover");
            setDiasRemover(valor);
          }}
          min={0}
          max={365}
          descricao={
            dataRetiradaCalculada
              ? `Retirada calculada: ${dataRetiradaCalculada.toLocaleDateString(
                  "pt-BR"
                )}`
              : "Ex: 7 ou 30 dias antes."
          }
          erro={erros.diasRemover}
          atalhos={[7, 15, 30, 60]}
        />

        <Campo
          icon={TriangleAlert}
          label="Pré-vencimento"
          type="number"
          value={diasPre}
          onChange={(valor) => {
            limparErro("diasPre");
            setDiasPre(valor);
          }}
          min={0}
          max={365}
          optional
          descricao="Aviso antes da data de remoção."
          erro={erros.diasPre}
          atalhos={[7, 15, 30, 60]}
        />
      </div>

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4
            dark:border-emerald-500/20 dark:bg-emerald-500/10
          "
        >
          <SecaoTitulo
            icon={ShieldCheck}
            titulo="Preview automático"
            texto="Linha do tempo calculada pelo app."
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <PreviewLinha
              icon={Clock3}
              label="Pré"
              valor={preview.pre ? preview.pre.toLocaleDateString("pt-BR") : "Sem pré"}
            />

            <PreviewLinha
              icon={Trash2}
              label="Retirar"
              valor={preview.remover.toLocaleDateString("pt-BR")}
            />

            <PreviewLinha
              icon={CalendarDays}
              label="Validade"
              valor={preview.validade.toLocaleDateString("pt-BR")}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}

function ResumoInteligente({
  setorSelecionado,
  diasRemover,
  diasPre,
  produtoJaPre,
  usarDataRetirada,
  dataRetirada,
  validade,
  preview,
}) {
  return (
    <section className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50/80 p-4 shadow-lg shadow-black/5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
      <SecaoTitulo
        icon={Sparkles}
        titulo="Resumo inteligente"
        texto="O AVISAI já prepara a regra antes de salvar."
      />

      <div className="mt-4 grid gap-2">
        <ResumoLinha icon={Tag} label="Setor" valor={setorSelecionado} />
        <ResumoLinha icon={Trash2} label="Retirada" valor={`${Number(diasRemover || 0)} dias antes`} />
        <ResumoLinha
          icon={TriangleAlert}
          label="Pré"
          valor={diasPre ? `${Number(diasPre)} dias antes` : "Sem pré"}
        />
        <ResumoLinha
          icon={CalendarDays}
          label={usarDataRetirada ? "Retirada informada" : "Validade"}
          valor={usarDataRetirada ? dataRetirada || "Não informada" : validade || "Não informada"}
        />
      </div>

      {produtoJaPre && (
        <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-100/80 p-3 text-sm font-bold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Produto marcado como pré-vencimento. Bom para etiquetas que já chegam com regra de retirada.
        </div>
      )}

      {preview && (
        <div className="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold text-gray-600 dark:bg-slate-950/45 dark:text-gray-300">
          Retirar em {preview.remover.toLocaleDateString("pt-BR")}.
        </div>
      )}
    </section>
  );
}

function ConfiguracaoRapidaBox({
  aberto,
  setAberto,
  configProdutos,
  setorPrincipal,
  diasRetiradaPadrao,
  diasPrePadrao,
  aplicarPadrao,
}) {
  return (
    <section className="rounded-[1.8rem] border border-gray-200 bg-white/70 p-3 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-1 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white/10">
            <Settings2 size={18} />
          </div>

          <div>
            <p className="text-sm font-black">Configuração aplicada</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Puxada do menu de produtos.
            </p>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-gray-400 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-2 rounded-2xl bg-gray-100 p-3 text-sm dark:bg-slate-950/50"
        >
          <ResumoLinha icon={Boxes} label="Setor principal" valor={setorPrincipal} />
          <ResumoLinha icon={Trash2} label="Retirada padrão" valor={`${diasRetiradaPadrao} dias`} />
          <ResumoLinha
            icon={TriangleAlert}
            label="Pré padrão"
            valor={diasPrePadrao ? `${diasPrePadrao} dias` : "Não definido"}
          />
          <ResumoLinha
            icon={ImagePlus}
            label="Foto local"
            valor={configProdutos.qualidadeFotoLocal || "boa"}
          />

          <button
            type="button"
            onClick={aplicarPadrao}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-xs font-black text-white transition active:scale-95"
          >
            <Wand2 size={15} />
            Aplicar padrão do menu
          </button>
        </motion.div>
      )}
    </section>
  );
}

function FooterModal({ editando, salvando, onCancelar, onSalvar }) {
  return (
    <div
      className="
        shrink-0 border-t border-gray-200/80 bg-white/95 p-4
        pb-[calc(env(safe-area-inset-bottom)+0.9rem)]
        backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/95 sm:p-5
      "
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="
            flex h-[52px] items-center justify-center gap-2 rounded-2xl
            border border-gray-300 bg-white font-black text-gray-700 transition
            hover:bg-gray-100 active:scale-95 disabled:opacity-60
            dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15
          "
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando}
          className="
            flex h-[52px] items-center justify-center gap-2 rounded-2xl
            bg-emerald-700 font-black text-white shadow-lg shadow-emerald-700/20
            transition hover:bg-emerald-800 active:scale-95 disabled:opacity-70
          "
        >
          {salvando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {salvando ? "Salvando..." : editando ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function SecaoTitulo({ icon: Icon, titulo, texto, azul = false }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
          ${
            azul
              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h3 className="font-black">{titulo}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{texto}</p>
      </div>
    </div>
  );
}

function BotaoModoInteligente({ ativo, icon: Icon, titulo, texto, onClick, cor }) {
  const ativoClasse =
    cor === "amber"
      ? "border-amber-400 bg-amber-500 text-white shadow-amber-500/20"
      : "border-blue-400 bg-blue-600 text-white shadow-blue-600/20";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex min-h-[72px] items-center gap-3 rounded-2xl border p-3 text-left
        shadow-lg transition active:scale-[0.98]
        ${
          ativo
            ? ativoClasse
            : "border-gray-200 bg-gray-100 text-gray-800 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
        }
      `}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/18">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-black">{titulo}</p>
        <p className={`text-xs ${ativo ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
          {texto}
        </p>
      </div>
    </button>
  );
}

function BotaoImagem({ icon: Icon, titulo, texto, onClick, destaque = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl
        border px-3 py-3 text-center transition active:scale-95
        ${
          destaque
            ? "border-emerald-500 bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"
            : "border-gray-200 bg-gray-100 text-gray-800 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
        }
      `}
    >
      <Icon size={23} />
      <span className="text-sm font-black">{titulo}</span>
      <span
        className={`text-[11px] font-bold ${
          destaque ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {texto}
      </span>
    </button>
  );
}

function BotaoImagemOverlay({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex h-11 items-center justify-center gap-1.5 rounded-2xl
        bg-white px-3 text-xs font-black text-gray-900 shadow-lg
        transition active:scale-95
      "
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function AvisoErro({ texto }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
      <TriangleAlert size={20} className="shrink-0" />
      {texto}
    </div>
  );
}

function LabelArea({ icon: Icon, label, optional = false }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />

      <label className="text-sm font-black text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {optional && (
        <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
          opcional
        </span>
      )}
    </div>
  );
}

function InputBase({
  value,
  onChange,
  placeholder,
  erro,
  type = "text",
  inputMode,
  maxLength,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      className={`
        h-[52px] w-full rounded-2xl border bg-gray-100 px-4 text-gray-950 outline-none transition
        placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-500/15
        dark:bg-gray-950/70 dark:text-white
        ${
          erro
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
            : "border-transparent focus:border-emerald-500"
        }
      `}
    />
  );
}

function Dica({ texto }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <Info size={13} className="mt-0.5 shrink-0" />
      {texto}
    </p>
  );
}

function MensagemErro({ texto }) {
  return (
    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-red-500">
      <TriangleAlert size={14} />
      {texto}
    </p>
  );
}

function Campo({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  optional = false,
  descricao,
  erro,
  atalhos = [],
}) {
  function handleChange(e) {
    let valor = e.target.value;

    if (type === "number") {
      valor = valor.replace(/\D/g, "");

      if (valor === "") {
        onChange("");
        return;
      }

      valor = Number(valor);

      if (min !== undefined && valor < min) valor = min;
      if (max !== undefined && valor > max) valor = max;
    }

    onChange(valor);
  }

  return (
    <section>
      <LabelArea icon={Icon} label={label} optional={optional} />

      <InputBase
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        erro={erro}
        inputMode={type === "number" ? "numeric" : undefined}
      />

      {atalhos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {atalhos.map((item) => (
            <button
              key={`${label}-${item}`}
              type="button"
              onClick={() => onChange(item)}
              className={`
                rounded-full px-3 py-1 text-[11px] font-black transition active:scale-95
                ${
                  Number(value) === Number(item)
                    ? "bg-emerald-700 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                }
              `}
            >
              {item}d
            </button>
          ))}
        </div>
      )}

      {descricao && <Dica texto={descricao} />}

      {erro && <MensagemErro texto={erro} />}
    </section>
  );
}

function PreviewLinha({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm dark:bg-gray-950/50 sm:block sm:text-center">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 sm:justify-center">
        <Icon size={16} />
        {label}
      </div>

      <strong className="text-gray-950 dark:text-white sm:mt-1 sm:block">
        {valor}
      </strong>
    </div>
  );
}

function ResumoLinha({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 text-sm dark:bg-slate-950/35">
      <span className="flex min-w-0 items-center gap-2 text-gray-500 dark:text-gray-400">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>

      <strong className="truncate text-right text-gray-950 dark:text-white">
        {valor}
      </strong>
    </div>
  );
}

export default ModalMedicamento;
