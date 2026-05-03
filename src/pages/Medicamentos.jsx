import { useEffect, useRef, useState } from "react";
import { db } from "../db";
import ToastStack from "../components/ToastStack";
import Scanner from "../components/Scanner";
import { motion, AnimatePresence } from "framer-motion";

import {
  CalendarDays,
  ImageIcon,
  PackagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import CardMedicamento from "../components/medicamentos/CardMedicamento";
import BuscaMedicamentos from "../components/medicamentos/BuscaMedicamentos";
import FabMedicamentos from "../components/medicamentos/FabMedicamentos";
import ModalMedicamento from "../components/medicamentos/ModalMedicamento";

// =============================
// 💊 COMPONENTE PRINCIPAL
// =============================

function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);

  const [imagem, setImagem] = useState(null);
  const [abrirModal, setAbrirModal] = useState(false);

  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [diasPre, setDiasPre] = useState("");
  const [diasRemover, setDiasRemover] = useState(7);
  const [quantidade, setQuantidade] = useState(1);

  const [editando, setEditando] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [preview, setPreview] = useState(null);

  const [busca, setBusca] = useState("");
  const [toasts, setToasts] = useState([]);

  const [fabOpen, setFabOpen] = useState(false);

  const [abrirScanner, setAbrirScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [modoReposicao, setModoReposicao] = useState(false);
  const [scannerPreviewItens, setScannerPreviewItens] = useState([]);

  const [inputValidadeRapida, setInputValidadeRapida] = useState(null);
  const [codigoScanner, setCodigoScanner] = useState("");

  const topRef = useRef(null);

  // =============================
  // 🚀 INICIALIZAÇÃO
  // =============================

  useEffect(() => {
    setAbrirScanner(false);
    setFabOpen(false);

    carregar();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // =============================
  // 📦 BANCO DE DADOS
  // =============================

  async function carregar() {
    try {
      const dados = await db.medicamentos.toArray();

      const normalizados = dados.map((m) => ({
        ...m,
        quantidade: Number(m.quantidade || 1),
      }));

      normalizados.sort((a, b) => {
        const dataA = parseDataSegura(a.validade);
        const dataB = parseDataSegura(b.validade);

        if (!dataA && !dataB) return 0;
        if (!dataA) return 1;
        if (!dataB) return -1;

        return dataA - dataB;
      });

      setMedicamentos(normalizados);
    } catch (err) {
      console.error("Erro ao carregar medicamentos:", err);
      addToast("Erro ao carregar medicamentos 😕", "erro");
    }
  }

  // =============================
  // 🔔 TOASTS
  // =============================

  function addToast(msg, tipo = "ok") {
    const id = `${Date.now()}-${Math.random()}`;

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    setToasts((prev) => [...prev, { id, msg, tipo }]);

    setTimeout(() => {
      removerToast(id);
    }, 4000);
  }

  function removerToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // =============================
  // 🧹 LIMPAR / IMAGEM
  // =============================

  function limpar() {
    setNome("");
    setValidade("");
    setImagem(null);
    setDiasPre("");
    setDiasRemover(7);
    setQuantidade(1);
    setEditando(null);
    setCodigoScanner("");
  }

  function handleImagem(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagem(reader.result);
    };

    reader.readAsDataURL(file);
  }

  // =============================
  // 💾 SALVAR / EDITAR
  // =============================

  async function salvar() {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo || !validade) {
      addToast("Preencha os campos obrigatórios ⚠️", "erro");
      return;
    }

    const dataValida = parseDataSegura(validade);

    if (!dataValida || Number.isNaN(dataValida.getTime())) {
      addToast("Data inválida ⚠️", "erro");
      return;
    }

    const qtd = Number(quantidade) || 1;

    if (qtd <= 0) {
      addToast("Quantidade inválida ⚠️", "erro");
      return;
    }

    const codigoFinal = codigoScanner || editando?.codigo || null;

    const existente = medicamentos.find(
      (m) =>
        String(m.nome || "").toLowerCase() === nomeLimpo.toLowerCase() &&
        (!editando || m.id !== editando.id)
    );

    const dados = {
      nome: nomeLimpo,
      validade,
      imagem,
      codigo: codigoFinal,
      diasRemover: Number(diasRemover) || 7,
      diasPreVencido: diasPre ? Number(diasPre) : null,
      quantidade: qtd,
    };

    try {
      if (codigoFinal) {
        const jaExisteNaBase = await db.produtosCodigo
          .where("codigo")
          .equals(String(codigoFinal))
          .first();

        if (!jaExisteNaBase) {
          await db.produtosCodigo.add({
            codigo: String(codigoFinal),
            nome: nomeLimpo,
            imagem,
            diasRemover: Number(diasRemover) || 7,
            diasPreVencido: diasPre ? Number(diasPre) : null,
            criadoEm: new Date().toISOString(),
          });
        }
      }

      if (editando) {
        await db.medicamentos.update(editando.id, dados);
        addToast("Medicamento atualizado ✨");
      } else if (existente) {
        await db.medicamentos.update(existente.id, {
          quantidade: Number(existente.quantidade || 1) + qtd,
        });

        addToast("Quantidade atualizada 📦");
      } else {
        await db.medicamentos.add(dados);
        addToast("Medicamento salvo 💊");
      }

      limpar();
      setAbrirModal(false);
      setFabOpen(false);

      await carregar();
    } catch (err) {
      console.error("Erro ao salvar medicamento:", err);
      addToast("Erro ao salvar medicamento 😕", "erro");
    }
  }

  async function remover(id) {
    try {
      await db.medicamentos.delete(id);

      setConfirmar(null);
      addToast("Medicamento excluído 🗑️");

      await carregar();
    } catch (err) {
      console.error("Erro ao remover medicamento:", err);
      addToast("Erro ao excluir medicamento 😕", "erro");
    }
  }

  // =============================
  // 📅 DATAS
  // =============================

  function parseDataSegura(data) {
    if (!data) return null;

    if (data instanceof Date && !Number.isNaN(data.getTime())) {
      return data;
    }

    if (typeof data === "string" && data.includes("/")) {
      const [dia, mes, ano] = data.split("/").map(Number);

      if (!dia || !mes || !ano) return null;

      return new Date(ano, mes - 1, dia);
    }

    if (typeof data === "string" && data.includes("-")) {
      const [ano, mes, dia] = data.split("-").map(Number);

      if (!dia || !mes || !ano) return null;

      return new Date(ano, mes - 1, dia);
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return null;
    }

    return dataConvertida;
  }

  function gerarPreviewDatas() {
    if (!validade) return null;

    const validadeDate = parseDataSegura(validade);

    if (!validadeDate || Number.isNaN(validadeDate.getTime())) {
      return null;
    }

    const removerDate = new Date(validadeDate);
    removerDate.setDate(removerDate.getDate() - Number(diasRemover || 0));

    let preDate = null;

    if (diasPre) {
      preDate = new Date(removerDate);
      preDate.setDate(preDate.getDate() - Number(diasPre));
    }

    return {
      validade: validadeDate,
      remover: removerDate,
      pre: preDate,
    };
  }

  function calcularDatas(med) {
    const validadeDate = parseDataSegura(med.validade);

    if (!validadeDate || Number.isNaN(validadeDate.getTime())) {
      return {
        validade: null,
        remover: null,
        pre: null,
      };
    }

    const removerDate = new Date(validadeDate);
    removerDate.setDate(removerDate.getDate() - Number(med.diasRemover || 0));

    let preDate = null;

    if (med.diasPreVencido) {
      preDate = new Date(removerDate);
      preDate.setDate(preDate.getDate() - Number(med.diasPreVencido));
    }

    return {
      validade: validadeDate,
      remover: removerDate,
      pre: preDate,
    };
  }

  function calcularStatus(med) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { validade, remover, pre } = calcularDatas(med);

    if (!validade || Number.isNaN(validade.getTime())) {
      return "ok";
    }

    const validadeLimpa = new Date(validade);
    validadeLimpa.setHours(0, 0, 0, 0);

    const removerLimpa = remover ? new Date(remover) : null;
    if (removerLimpa) removerLimpa.setHours(0, 0, 0, 0);

    const preLimpa = pre ? new Date(pre) : null;
    if (preLimpa) preLimpa.setHours(0, 0, 0, 0);

    if (hoje >= validadeLimpa) return "vencido";
    if (removerLimpa && hoje >= removerLimpa) return "remover";
    if (preLimpa && hoje >= preLimpa) return "pre";

    return "ok";
  }

  function formatarData(data) {
    const dataFormatada = parseDataSegura(data);

    if (!dataFormatada || Number.isNaN(dataFormatada.getTime())) {
      return "Data inválida";
    }

    return dataFormatada.toLocaleDateString("pt-BR");
  }

  // =============================
  // 🔍 LISTA / FILTRO
  // =============================

  const lista = medicamentos.filter((m) =>
    `${m.nome || ""} ${m.validade || ""}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  // =============================
  // 📷 FLUXO DO SCANNER
  // =============================

function fecharScannerSeguro() {
  setAbrirScanner(false);
  setFabOpen(false);
  setScannerPreviewItens([]);

  setTimeout(() => {
    setScannerKey((prev) => prev + 1);
  }, 0);
}

  function adicionarPreviewScanner(item) {
  const agora = Date.now();

  setScannerPreviewItens((prev) => {
    const semMesmoCodigo = prev.filter(
      (p) => String(p.codigo || "") !== String(item.codigo || "")
    );

    const novoItem = {
      id: `${item.codigo}-${agora}`,
      codigo: item.codigo,
      nome: item.nome || "Medicamento",
      imagem: item.imagem || null,
      validade: item.validade || "",
      quantidade: Number(item.quantidade || 1),
      tipo: item.tipo || "incrementado",
      atualizadoEm: agora,
    };

    return [novoItem, ...semMesmoCodigo].slice(0, 5);
  });
}

async function iniciarScanner() {
  setFabOpen(false);
  setAbrirModal(false);
  setConfirmar(null);
  setPreview(null);
  setScannerPreviewItens([]);

  setScannerKey((prev) => prev + 1);
  setAbrirScanner(true);
}

  async function aoEscanear(codigo) {
    const codigoLimpo = String(codigo || "").trim();

    if (!codigoLimpo) {
      addToast("Código inválido 😕", "erro");

      return {
        manterAberto: true,
        continuarScanner: true,
      };
    }

    addToast("Código lido 🔎", "info");

    try {
      let existenteEstoque = await db.medicamentos
        .where("codigo")
        .equals(codigoLimpo)
        .first();

      if (!existenteEstoque) {
        existenteEstoque = await db.medicamentos
          .filter((m) => String(m.codigo || "") === codigoLimpo)
          .first();
      }

if (existenteEstoque) {
  const novaQuantidade = Number(existenteEstoque.quantidade || 1) + 1;

  await db.medicamentos.update(existenteEstoque.id, {
    quantidade: novaQuantidade,
  });

  adicionarPreviewScanner({
    codigo: codigoLimpo,
    nome: existenteEstoque.nome || "Medicamento",
    imagem: existenteEstoque.imagem || null,
    validade: existenteEstoque.validade || "",
    quantidade: novaQuantidade,
    tipo: "incrementado",
  });

  addToast(`+1 ${existenteEstoque.nome || "produto"} 📦`, "ok");

  await carregar();

  return {
    manterAberto: true,
    continuarScanner: true,
  };
}

      let produtoLocal = await db.produtosCodigo
        .where("codigo")
        .equals(codigoLimpo)
        .first();

      if (!produtoLocal) {
        produtoLocal = await db.produtosCodigo
          .filter((p) => String(p.codigo || "") === codigoLimpo)
          .first();
      }

      limpar();

      setCodigoScanner(codigoLimpo);
      setQuantidade(1);
      setValidade("");
      setFabOpen(false);

      if (produtoLocal) {
        setNome(produtoLocal.nome || "");
        setImagem(produtoLocal.imagem || null);
        setDiasRemover(produtoLocal.diasRemover || 7);
        setDiasPre(produtoLocal.diasPreVencido || "");

        addToast("Produto reconhecido. Só informe a validade ⚡", "ok");
      } else {
        setNome("");
        setImagem(null);
        setDiasRemover(7);
        setDiasPre(2);

        addToast("Novo produto. Cadastre uma vez e eu aprendo 🧠", "aviso");
      }

      fecharScannerSeguro();

      setTimeout(() => {
        setAbrirModal(true);
      }, 180);

      return {
        fecharScanner: true,
        abrirModal: true,
      };
    } catch (err) {
      console.error("Erro ao processar código:", err);
      addToast("Erro ao processar código 😕", "erro");

      return {
        manterAberto: true,
        continuarScanner: true,
      };
    }
  }

  // =============================
  // ⚡ VALIDADE RÁPIDA
  // =============================

  async function salvarRapido(validadeRapida) {
    const dataValida = parseDataSegura(validadeRapida);

    if (!dataValida || Number.isNaN(dataValida.getTime())) {
      addToast("Data inválida ⚠️", "erro");
      return;
    }

    if (!inputValidadeRapida?.nome) {
      addToast("Produto inválido 😕", "erro");
      return;
    }

    try {
      await db.medicamentos.add({
        nome: inputValidadeRapida.nome,
        validade: validadeRapida,
        quantidade: 1,
        diasRemover: 7,
      });

      addToast("Produto adicionado ✨");

      setInputValidadeRapida(null);
      await carregar();
    } catch (err) {
      console.error("Erro ao salvar produto rápido:", err);
      addToast("Erro ao adicionar produto 😕", "erro");
    }
  }

  // =============================
  // 🎨 RENDER
  // =============================

  return (
    <div
      ref={topRef}
      className="
        mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-4
        text-gray-900 dark:text-white
      "
    >
      {/* 🔍 BUSCA */}
      <BuscaMedicamentos
        busca={busca}
        setBusca={setBusca}
        quantidadeFiltrada={lista.length}
      />

      {/* EMPTY STATE */}
      <AnimatePresence>
        {lista.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25 }}
            className="
              mt-20 rounded-3xl border border-gray-200 bg-white/80 p-8 text-center shadow-xl
              dark:border-gray-800 dark:bg-gray-900/80
            "
          >
            <div
              className="
                mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl
                bg-emerald-100 text-emerald-700
                dark:bg-emerald-500/15 dark:text-emerald-400
              "
            >
              <PackagePlus size={32} />
            </div>

            <h2 className="text-xl font-bold">Nenhum medicamento encontrado</h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cadastre seu primeiro medicamento e deixe sua farmácia digital em
              ordem.
            </p>

            <button
              type="button"
              onClick={() => {
                limpar();
                setAbrirModal(true);
                setFabOpen(false);
              }}
              className="
                mt-6 inline-flex items-center justify-center gap-2 rounded-2xl
                bg-emerald-700 px-6 py-3 text-sm font-semibold text-white
                shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800
                active:scale-95
              "
            >
              <Plus size={18} />
              Adicionar medicamento
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA */}
      {lista.length > 0 && (
        <motion.div
          layout
          className="mt-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0"
        >
          {lista.map((m) => (
            <CardMedicamento
              key={m.id}
              m={m}
              calcularStatus={calcularStatus}
              calcularDatas={calcularDatas}
              formatarData={formatarData}
              setPreview={setPreview}
              setConfirmar={setConfirmar}
              setEditando={setEditando}
              setNome={setNome}
              setValidade={setValidade}
              setImagem={setImagem}
              setDiasPre={setDiasPre}
              setDiasRemover={setDiasRemover}
              setQuantidade={setQuantidade}
              setAbrirModal={setAbrirModal}
              setFabOpen={setFabOpen}
            />
          ))}
        </motion.div>
      )}

      {/* FAB */}
      <FabMedicamentos
        fabOpen={fabOpen}
        setFabOpen={setFabOpen}
        limpar={limpar}
        setAbrirModal={setAbrirModal}
        iniciarScanner={iniciarScanner}
        modoReposicao={modoReposicao}
        setModoReposicao={setModoReposicao}
      />

      {/* MODAL MEDICAMENTO */}
      <ModalMedicamento
        abrirModal={abrirModal}
        setAbrirModal={setAbrirModal}
        editando={editando}
        imagem={imagem}
        setImagem={setImagem}
        nome={nome}
        setNome={setNome}
        quantidade={quantidade}
        setQuantidade={setQuantidade}
        validade={validade}
        setValidade={setValidade}
        diasRemover={diasRemover}
        setDiasRemover={setDiasRemover}
        diasPre={diasPre}
        setDiasPre={setDiasPre}
        gerarPreviewDatas={gerarPreviewDatas}
        salvar={salvar}
        handleImagem={handleImagem}
        toasts={toasts}
        removerToast={removerToast}
        ToastStack={ToastStack}
      />

      {/* PREVIEW IMAGEM */}
      <AnimatePresence>
        {preview && (
          <motion.div
            onClick={() => setPreview(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-[9997] flex items-center justify-center
              bg-black/85 p-4 backdrop-blur-sm
            "
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="
                  absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full
                  bg-white text-gray-900 shadow-xl transition active:scale-95
                  dark:bg-gray-900 dark:text-white
                "
              >
                <X size={20} />
              </button>

              <div
                className="
                  overflow-hidden rounded-3xl border border-white/10
                  bg-white/10 p-2 shadow-2xl
                "
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview do medicamento"
                    className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain"
                  />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <ImageIcon size={36} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMAR EXCLUSÃO */}
      <AnimatePresence>
        {confirmar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-[9998] flex items-center justify-center
              bg-black/60 p-4 backdrop-blur-sm
            "
          >
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="
                w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-center
                text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white
              "
            >
              <div
                className="
                  mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl
                  bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400
                "
              >
                <Trash2 size={28} />
              </div>

              <h2 className="text-lg font-bold">Excluir medicamento?</h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Essa ação removerá{" "}
                <strong className="text-gray-800 dark:text-gray-100">
                  {confirmar.nome}
                </strong>{" "}
                da sua lista.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => remover(confirmar.id)}
                  className="
                    flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white
                    shadow-lg shadow-red-600/20 transition hover:bg-red-700 active:scale-95
                  "
                >
                  Excluir
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmar(null)}
                  className="
                    flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700
                    transition hover:bg-gray-200 active:scale-95
                    dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
                  "
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VALIDADE RÁPIDA */}
      <AnimatePresence>
        {inputValidadeRapida && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-[9999] flex items-center justify-center
              bg-black/70 p-4 backdrop-blur-sm
            "
          >
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="
                w-full max-w-sm space-y-4 rounded-3xl border border-gray-200 bg-white p-6 text-center
                text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white
              "
            >
              <div
                className="
                  mx-auto flex h-14 w-14 items-center justify-center rounded-2xl
                  bg-emerald-100 text-emerald-700
                  dark:bg-emerald-500/15 dark:text-emerald-400
                "
              >
                <CalendarDays size={28} />
              </div>

              <div>
                <h2 className="text-lg font-bold">Validade rápida</h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {inputValidadeRapida.nome}
                </p>
              </div>

              <input
                autoFocus
                placeholder="ddmmaaaa"
                inputMode="numeric"
                maxLength={8}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                  e.target.value = v;

                  if (v.length === 8) {
                    const formatada = v.replace(
                      /(\d{2})(\d{2})(\d{4})/,
                      "$1/$2/$3"
                    );

                    salvarRapido(formatada);
                  }
                }}
                className="
                  w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center
                  text-lg font-semibold text-gray-900 outline-none transition
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20
                  dark:border-gray-800 dark:bg-gray-950 dark:text-white
                "
              />

              <button
                type="button"
                onClick={() => setInputValidadeRapida(null)}
                className="
                  inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium
                  text-gray-500 transition hover:bg-gray-100 active:scale-95
                  dark:text-gray-400 dark:hover:bg-gray-800
                "
              >
                <X size={16} />
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCANNER */}
      <AnimatePresence>
        {abrirScanner && !abrirModal && (
          <Scanner
            key={scannerKey}
            onClose={fecharScannerSeguro}
            onScan={aoEscanear}
            modoContinuo={true}
            itensPreview={scannerPreviewItens}
            onLimparPreview={() => setScannerPreviewItens([])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Medicamentos;