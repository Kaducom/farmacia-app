import { useState } from "react";
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

  if (!abrirModal) return null;

  function limparErro(campo) {
    setErros((prev) => {
      const novo = { ...prev };
      delete novo[campo];
      delete novo.geral;
      return novo;
    });
  }

  function validarData(data) {
    if (!data || data.length !== 10) return false;

    const [dia, mes, ano] = data.split("/").map(Number);

    if (
      dia < 1 ||
      dia > 31 ||
      mes < 1 ||
      mes > 12 ||
      ano < 2024 ||
      ano > 2100
    ) {
      return false;
    }

    const dataObj = new Date(ano, mes - 1, dia);

    return (
      dataObj.getDate() === dia &&
      dataObj.getMonth() === mes - 1 &&
      dataObj.getFullYear() === ano
    );
  }

  function formatarValidade(valorDigitado) {
    let valor = valorDigitado.replace(/\D/g, "").slice(0, 8);

    if (valor.length >= 5) {
      valor = valor.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    } else if (valor.length >= 3) {
      valor = valor.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    }

    return valor;
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
      novosErros.validade = "Informe uma data válida.";
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

  return (
    <AnimatePresence>
      {abrirModal && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={fecharModal}
        >
          <motion.div
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="
              relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem]
              border border-gray-200 bg-white text-gray-950 shadow-2xl
              dark:border-gray-800 dark:bg-gray-950 dark:text-white
            "
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent" />

            <div className="absolute left-1/2 top-3 z-50 w-[92%] -translate-x-1/2">
              <ToastStack notificacoes={toasts} remover={removerToast} />
            </div>

            {/* HEADER */}
            <div className="relative border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
                    <Pill size={25} />
                  </div>

                  <div>
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Sparkles size={13} />
                      {editando ? "Modo edição" : "Novo cadastro"}
                    </div>

                    <h2 className="text-xl font-black tracking-tight">
                      {editando ? "Editar medicamento" : "Novo medicamento"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Controle de estoque, validade e alertas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  className="
                    flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                    bg-gray-100 text-gray-600 transition active:scale-95 hover:bg-gray-200
                    dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800
                  "
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="relative flex-1 space-y-5 overflow-y-auto p-5">
              {erros.geral && (
                <AvisoErro texto={erros.geral} />
              )}

              {/* IMAGEM */}
              <section className="space-y-2">
                <LabelArea
                  icon={ImagePlus}
                  label="Foto do produto"
                  optional
                />

                {!imagem ? (
                  <label
                    className="
                      group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl
                      border-2 border-dashed border-emerald-500/35 bg-gray-50 p-8 text-center
                      transition hover:border-emerald-500 hover:bg-emerald-50
                      dark:bg-gray-900/60 dark:hover:bg-emerald-500/10
                    "
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition group-active:scale-95">
                      <ImagePlus size={30} />
                    </div>

                    <div>
                      <p className="font-bold">Adicionar imagem</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        PNG ou JPG, opcional
                      </p>
                    </div>

                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={handleImagem}
                    />
                  </label>
                ) : (
                  <div className="relative overflow-hidden rounded-3xl border border-gray-200 shadow-xl dark:border-gray-800">
                    <img
                      src={imagem}
                      alt="Preview do medicamento"
                      className="h-56 w-full object-cover"
                    />

                    <div className="absolute inset-0 flex items-end justify-center gap-3 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-4">
                      <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-lg transition active:scale-95">
                        <ImagePlus size={16} />
                        Trocar
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          className="hidden"
                          onChange={handleImagem}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setImagem(null)}
                        className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95"
                      >
                        <Trash2 size={16} />
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* NOME */}
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

              <Campo
                icon={Package}
                label="Quantidade"
                type="number"
                value={quantidade}
                onChange={(valor) => {
                  limparErro("quantidade");
                  setQuantidade(valor);
                }}
                min={1}
                max={9999}
                descricao="Quantidade disponível no estoque."
                erro={erros.quantidade}
              />

              {/* VALIDADE */}
              <section>
                <LabelArea icon={CalendarDays} label="Data de validade" />

                <InputBase
                  value={validade}
                  onChange={(e) => {
                    limparErro("validade");
                    setValidade(formatarValidade(e.target.value));
                  }}
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  maxLength={10}
                  erro={erros.validade || (validade && !validarData(validade))}
                />

                <Dica texto="Exemplo: 25/12/2026" />

                {validade && !validarData(validade) && !erros.validade && (
                  <MensagemErro texto="Data inválida." />
                )}

                {erros.validade && <MensagemErro texto={erros.validade} />}
              </section>

              <Campo
                icon={Trash2}
                label="Dias antes para remover"
                type="number"
                value={diasRemover}
                onChange={(valor) => {
                  limparErro("diasRemover");
                  setDiasRemover(valor);
                }}
                min={0}
                max={365}
                descricao="Define quantos dias antes da validade o produto deve sair da lista."
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
                descricao="Cria um aviso antecipado antes da data de remoção."
                erro={erros.diasPre}
              />

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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
                      <ShieldCheck size={18} />
                    </div>

                    <div>
                      <h3 className="font-bold">Preview automático</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Linha do tempo calculada pelo app.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <PreviewLinha
                      icon={CalendarDays}
                      label="Validade"
                      valor={preview.validade.toLocaleDateString("pt-BR")}
                    />

                    <PreviewLinha
                      icon={Trash2}
                      label="Remover em"
                      valor={preview.remover.toLocaleDateString("pt-BR")}
                    />

                    {preview.pre && (
                      <PreviewLinha
                        icon={Clock3}
                        label="Pré-vencimento"
                        valor={preview.pre.toLocaleDateString("pt-BR")}
                      />
                    )}
                  </div>
                </motion.section>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-200 bg-white/90 p-5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="
                    flex h-13 h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl
                    border border-gray-300 bg-white font-bold text-gray-700 transition active:scale-95
                    hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800
                  "
                >
                  <X size={18} />
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSalvar}
                  className="
                    flex h-13 h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl
                    bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-700/20
                    transition active:scale-95 hover:bg-emerald-800
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
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
      <TriangleAlert size={20} />
      {texto}
    </div>
  );
}

function LabelArea({ icon: Icon, label, optional = false }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon size={16} className="text-emerald-600 dark:text-emerald-400" />

      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {optional && (
        <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
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
        w-full rounded-2xl border bg-gray-100 p-4 text-gray-950 outline-none transition
        placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-500/15
        dark:bg-gray-900 dark:text-white
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
    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <Info size={13} />
      {texto}
    </p>
  );
}

function MensagemErro({ texto }) {
  return (
    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500">
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
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm dark:bg-gray-950/50">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <Icon size={16} />
        {label}
      </div>

      <strong className="text-gray-950 dark:text-white">{valor}</strong>
    </div>
  );
}

export default ModalMedicamento;