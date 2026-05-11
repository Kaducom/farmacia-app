import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToastStack from "../ToastStack";

import {
  ImagePlus,
  Pill,
  Package,
  CalendarDays,
  TriangleAlert,
  Save,
  X,
  Trash2,
  Sparkles,
  Clock3,
  ShieldCheck,
  Info,
  Minus,
  Plus,
} from "lucide-react";

function ModalMedicamento({
  abrirModal,
  setAbrirModal,
  editando,

  imagem,
  setImagem,

  nome,
  setNome,

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
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (!abrirModal) return;

    const scrollY = window.scrollY;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;
    const originalPaddingRight = body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function fecharComEsc(e) {
      if (e.key === "Escape") {
        fecharModal();
      }
    }

    window.addEventListener("keydown", fecharComEsc);

    return () => {
      body.style.overflow = originalOverflow;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;
      body.style.paddingRight = originalPaddingRight;

      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [abrirModal]);

  if (!abrirModal) return null;

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

  const preview = validarData(validade) ? gerarPreviewDatas() : null;

  function handleSalvar() {
    const novosErros = {};

    if (!nome.trim()) {
      novosErros.nome = "Informe o nome do medicamento.";
    }

    if (!quantidade || Number(quantidade) < 1) {
      novosErros.quantidade = "Informe uma quantidade válida.";
    }

    if (!validarData(validade)) {
      novosErros.validade =
        "Informe uma validade válida. Ex: 0427 ou 25/12/2026.";
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

    setErros({});
    salvar();
  }

  function fecharModal() {
    setErros({});
    setAbrirModal(false);
  }

  function alterarQuantidade(delta) {
    const atual = Number(quantidade || 1);
    const proximo = Math.max(1, Math.min(9999, atual + delta));

    limparErro("quantidade");
    setQuantidade(proximo);
  }

  return (
    <AnimatePresence>
      {abrirModal && (
        <motion.div
          className="
            fixed inset-0 z-[2147483647] flex items-center justify-center overflow-hidden
            bg-black/70 px-3
            pt-[calc(env(safe-area-inset-top)+5.25rem)]
            pb-[calc(env(safe-area-inset-bottom)+7.75rem)]
            backdrop-blur-md
            sm:p-4
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fecharModal}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 34, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 34, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="
              relative flex w-full max-w-2xl flex-col overflow-hidden
              rounded-[2rem] border border-gray-200 bg-white text-gray-950 shadow-2xl
              max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-15rem)]
              dark:border-white/10 dark:bg-gray-950 dark:text-white
              sm:max-h-[92vh]
            "
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent" />
            <div className="pointer-events-none absolute -right-20 top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="absolute left-1/2 top-3 z-50 w-[92%] max-w-sm -translate-x-1/2">
              <ToastStack notificacoes={toasts} remover={removerToast} />
            </div>

            {/* HEADER */}
            <div className="relative shrink-0 border-b border-gray-200/80 bg-white/90 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/90 sm:p-5">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700 sm:hidden" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="
                      flex h-13 w-13 h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl
                      bg-gradient-to-br from-emerald-600 to-emerald-900 text-white
                      shadow-lg shadow-emerald-700/20
                    "
                  >
                    <Pill size={25} />
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        mb-1 inline-flex items-center gap-1.5 rounded-full
                        bg-emerald-100 px-2.5 py-1 text-[11px] font-black
                        text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300
                      "
                    >
                      <Sparkles size={13} />
                      {editando ? "Modo edição" : "Novo cadastro"}
                    </div>

                    <h2 className="truncate text-xl font-black tracking-tight">
                      {editando ? "Editar medicamento" : "Novo medicamento"}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      Estoque, validade, remoção e pré-vencimento.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  className="
                    flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                    bg-gray-100 text-gray-600 transition hover:bg-gray-200 active:scale-95
                    dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15
                  "
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="space-y-4 pb-2">
                {erros.geral && <AvisoErro texto={erros.geral} />}

                {/* IMAGEM */}
                <section className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <LabelArea icon={ImagePlus} label="Foto do produto" optional />

                  {!imagem ? (
                    <label
                      className="
                        group mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl
                        border-2 border-dashed border-emerald-500/35 bg-white p-6 text-center
                        transition hover:border-emerald-500 hover:bg-emerald-50
                        dark:bg-gray-950/50 dark:hover:bg-emerald-500/10
                        sm:p-8
                      "
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition group-active:scale-95">
                        <ImagePlus size={30} />
                      </div>

                      <div>
                        <p className="font-black">Adicionar imagem</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Opcional, mas deixa o estoque mais visual.
                        </p>
                      </div>

                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleImagem}
                      />
                    </label>
                  ) : (
                    <div className="relative mt-3 overflow-hidden rounded-3xl border border-gray-200 shadow-xl dark:border-white/10">
                      <img
                        src={imagem}
                        alt="Preview do medicamento"
                        className="h-52 w-full object-cover sm:h-64"
                      />

                      <div className="absolute inset-0 flex items-end justify-center gap-3 bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4">
                        <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-gray-900 shadow-lg transition active:scale-95">
                          <ImagePlus size={16} />
                          Trocar
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={handleImagem}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setImagem(null)}
                          className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-lg transition active:scale-95"
                        >
                          <Trash2 size={16} />
                          Remover
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* DADOS PRINCIPAIS */}
                <section className="rounded-3xl border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Pill size={19} />
                    </div>

                    <div>
                      <h3 className="font-black">Dados principais</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Nome e quantidade do lote.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <section>
                      <LabelArea icon={Pill} label="Nome do medicamento" />

                      <InputBase
                        value={nome}
                        onChange={(e) => {
                          limparErro("nome");
                          setNome(e.target.value);
                        }}
                        placeholder="Ex: Dipirona 500mg"
                        maxLength={80}
                        erro={erros.nome}
                      />

                      <Dica texto={`${nome.length}/80 caracteres`} />

                      {erros.nome && <MensagemErro texto={erros.nome} />}
                    </section>

                    <section>
                      <LabelArea icon={Package} label="Quantidade" />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(-1)}
                          className="flex h-13 h-[52px] w-13 w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition active:scale-95 dark:bg-white/10 dark:text-gray-200"
                        >
                          <Minus size={19} />
                        </button>

                        <InputBase
                          type="number"
                          value={quantidade}
                          onChange={(e) => {
                            limparErro("quantidade");
                            const valor = e.target.value.replace(/\D/g, "");
                            setQuantidade(valor);
                          }}
                          placeholder="1"
                          inputMode="numeric"
                          erro={erros.quantidade}
                        />

                        <button
                          type="button"
                          onClick={() => alterarQuantidade(1)}
                          className="flex h-13 h-[52px] w-13 w-[52px] shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition active:scale-95"
                        >
                          <Plus size={19} />
                        </button>
                      </div>

                      <Dica texto="Quantidade disponível no estoque." />

                      {erros.quantidade && (
                        <MensagemErro texto={erros.quantidade} />
                      )}
                    </section>
                  </div>
                </section>

                {/* VALIDADE */}
                <section className="rounded-3xl border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      <CalendarDays size={19} />
                    </div>

                    <div>
                      <h3 className="font-black">Validade e alertas</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        O app calcula quando avisar e quando retirar.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="sm:col-span-2">
                      <LabelArea icon={CalendarDays} label="Data de validade" />

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

                      <Dica texto="Digite 0427 para 04/2027 ou 25122026 para 25/12/2026." />

                      {validade &&
                        validade.length >= 4 &&
                        !validarData(validade) &&
                        !erros.validade && <MensagemErro texto="Data inválida." />}

                      {erros.validade && <MensagemErro texto={erros.validade} />}
                    </section>

                    <Campo
                      icon={Trash2}
                      label="Dias para remover"
                      type="number"
                      value={diasRemover}
                      onChange={(valor) => {
                        limparErro("diasRemover");
                        setDiasRemover(valor);
                      }}
                      min={0}
                      max={365}
                      descricao="Ex: 7 dias antes da validade."
                      erro={erros.diasRemover}
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
                    />
                  </div>
                </section>

                {/* PREVIEW */}
                {preview && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                      rounded-3xl border border-emerald-200 bg-emerald-50 p-4
                      dark:border-emerald-500/20 dark:bg-emerald-500/10
                    "
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                        <ShieldCheck size={19} />
                      </div>

                      <div>
                        <h3 className="font-black">Preview automático</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Linha do tempo calculada pelo app.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <PreviewLinha
                        icon={Clock3}
                        label="Pré"
                        valor={
                          preview.pre
                            ? preview.pre.toLocaleDateString("pt-BR")
                            : "Sem pré"
                        }
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
                  </motion.section>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="
                relative z-20 shrink-0 border-t border-gray-200/80 bg-white/95
                px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3
                backdrop-blur-xl
                dark:border-white/10 dark:bg-gray-950/95
                sm:p-5
              "
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="
                    flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl
                    border border-gray-300 bg-white font-black text-gray-700 transition
                    hover:bg-gray-100 active:scale-95
                    dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15
                  "
                >
                  <X size={18} />
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSalvar}
                  className="
                    flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl
                    bg-emerald-700 font-black text-white shadow-lg shadow-emerald-700/20
                    transition hover:bg-emerald-800 active:scale-95
                  "
                >
                  <Save size={18} />
                  {editando ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

export default ModalMedicamento;