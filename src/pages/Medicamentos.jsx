import { useEffect, useState, useRef } from "react";
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
  const [editando, setEditando] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busca, setBusca] = useState("");
  const [toasts, setToasts] = useState([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [abrirScanner, setAbrirScanner] = useState(false);
  const [modoReposicao, setModoReposicao] = useState(false);
  const [inputValidadeRapida, setInputValidadeRapida] = useState(null);
  const [codigoScanner, setCodigoScanner] = useState("");

  const topRef = useRef(null);

  // =============================
  // 🚀 INICIALIZAÇÃO
  // =============================

  useEffect(() => {
    carregar();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // =============================
  // 🔎 SCANNER / API
  // =============================

async function buscarProdutoPorCodigo(codigo) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`
    );

    const data = await res.json();

    if (data.status === 1) {
      const p = data.product;

      return {
        codigo,
        nome:
          p.product_name ||
          p.product_name_pt ||
          p.generic_name ||
          "Produto sem nome",
        marca: p.brands || "",
        imagem:
          p.image_front_url ||
          p.image_url ||
          p.selected_images?.front?.display?.pt ||
          null,
      };
    }

    return null;
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    return null;
  }
}

  // =============================
  // 📦 BANCO DE DADOS
  // =============================

  async function carregar() {
    const dados = await db.medicamentos.toArray();

    const normalizados = dados.map((m) => ({
      ...m,
      quantidade: m.quantidade || 1,
    }));

    normalizados.sort(
      (a, b) => parseDataSegura(a.validade) - parseDataSegura(b.validade)
    );

    setMedicamentos(normalizados);
  }

  // =============================
  // 🔔 TOASTS
  // =============================

  function addToast(msg, tipo = "ok") {
    const id = Date.now();

    if (navigator.vibrate) navigator.vibrate(30);

    setToasts((prev) => [...prev, { id, msg, tipo }]);

    setTimeout(() => removerToast(id), 4000);
  }

  function removerToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
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

    if (!dataValida || isNaN(dataValida.getTime())) {
      addToast("Data inválida ⚠️", "erro");
      return;
    }

    const qtd = Number(quantidade) || 1;

    if (qtd <= 0) {
      addToast("Quantidade inválida ⚠️", "erro");
      return;
    }

    const existente = medicamentos.find(
      (m) =>
        m.nome.toLowerCase() === nomeLimpo.toLowerCase() &&
        (!editando || m.id !== editando.id)
    );

const dados = {
  nome: nomeLimpo,
  validade,
  imagem,
  codigo: codigoScanner || null,
  diasRemover: Number(diasRemover) || 7,
  diasPreVencido: diasPre ? Number(diasPre) : null,
  quantidade: qtd,
};

if (codigoScanner) {
  const jaExisteNaBase = await db.produtosCodigo
    .where("codigo")
    .equals(codigoScanner)
    .first();

  if (!jaExisteNaBase) {
    await db.produtosCodigo.add({
      codigo: codigoScanner,
      nome: nomeLimpo,
      imagem,
      diasRemover: Number(diasRemover) || 7,
      diasPreVencido: diasPre ? Number(diasPre) : null,
      criadoEm: new Date().toISOString(),
    });
  }
}

    try {
      if (editando) {
        await db.medicamentos.update(editando.id, dados);
        addToast("Medicamento atualizado ✨");
      } else if (existente) {
        await db.medicamentos.update(existente.id, {
          quantidade: (existente.quantidade || 1) + qtd,
        });

        addToast("Quantidade atualizada 📦");
      } else {
        await db.medicamentos.add(dados);
        addToast("Medicamento salvo 💊");
      }

      limpar();
      setAbrirModal(false);
      setFabOpen(false);
      setCodigoScanner("");
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

  function limpar() {
    setNome("");
    setValidade("");
    setImagem(null);
    setDiasPre("");
    setDiasRemover(7);
    setQuantidade(1);
    setEditando(null);
  }

  function handleImagem(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => setImagem(reader.result);
    reader.readAsDataURL(file);
  }

  // =============================
  // 📅 DATAS
  // =============================

  function parseDataSegura(data) {
    if (!data) return null;

    if (typeof data === "string" && data.includes("/")) {
      const [dia, mes, ano] = data.split("/");

      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }

    return new Date(data);
  }

  function gerarPreviewDatas() {
    if (!validade) return null;

    const validadeDate = parseDataSegura(validade);

    if (!validadeDate || isNaN(validadeDate.getTime())) return null;

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
    const validade = parseDataSegura(med.validade);

    const remover = new Date(validade);
    remover.setDate(remover.getDate() - (med.diasRemover || 0));

    let pre = null;

    if (med.diasPreVencido) {
      pre = new Date(remover);
      pre.setDate(pre.getDate() - med.diasPreVencido);
    }

    return { validade, remover, pre };
  }

  function calcularStatus(med) {
    const hoje = new Date();
    const { validade, remover, pre } = calcularDatas(med);

    if (!validade || isNaN(validade.getTime())) return "ok";

    if (hoje >= validade) return "vencido";
    if (hoje >= remover) return "remover";
    if (pre && hoje >= pre) return "pre";

    return "ok";
  }

  function formatarData(data) {
    const dataFormatada = parseDataSegura(data);

    if (!dataFormatada || isNaN(dataFormatada.getTime())) {
      return "Data inválida";
    }

    return dataFormatada.toLocaleDateString("pt-BR");
  }

  // =============================
  // 🔍 LISTA / FILTRO
  // =============================

  const lista = medicamentos.filter((m) =>
    `${m.nome} ${m.validade}`.toLowerCase().includes(busca.toLowerCase())
  );

  // =============================
  // 📷 FLUXO DO SCANNER
  // =============================

  async function iniciarScanner() {
    setFabOpen(false);
    setAbrirScanner(true);
  }

async function aoEscanear(codigo) {
  setAbrirScanner(false);
  addToast("Código lido 🔎", "info");

  // 1. Primeiro procura no estoque atual
  const existenteEstoque = medicamentos.find((m) => m.codigo === codigo);

  if (existenteEstoque) {
    await db.medicamentos.update(existenteEstoque.id, {
      quantidade: (existenteEstoque.quantidade || 1) + 1,
    });

    addToast("Produto já cadastrado. +1 unidade 📦", "ok");
    await carregar();
    return;
  }

  // 2. Depois procura na sua base local aprendida
  const produtoLocal = await db.produtosCodigo
    .where("codigo")
    .equals(codigo)
    .first();

  limpar();
  setCodigoScanner(codigo);
  setQuantidade(1);
  setValidade("");

  if (produtoLocal) {
    setNome(produtoLocal.nome || "");
    setImagem(produtoLocal.imagem || null);
    setDiasRemover(produtoLocal.diasRemover || 7);
    setDiasPre(produtoLocal.diasPreVencido || "");

    addToast("Produto encontrado na sua base 🧠", "ok");
  } else {
    setNome("");
    setImagem(null);
    setDiasRemover(7);
    setDiasPre(2);

    addToast("Novo código. Cadastre uma vez e eu aprendo ✍️", "aviso");
  }

  setAbrirModal(true);
}

  async function salvarRapido(validadeRapida) {
    const dataValida = parseDataSegura(validadeRapida);

    if (!dataValida || isNaN(dataValida.getTime())) {
      addToast("Data inválida ⚠️", "erro");
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
        min-h-screen max-w-5xl mx-auto px-4 pt-4 pb-28
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
              onClick={() => {
                limpar();
                setAbrirModal(true);
                setFabOpen(false);
              }}
              className="
                mt-6 inline-flex items-center justify-center gap-2 rounded-2xl
                bg-emerald-700 px-6 py-3 text-sm font-semibold text-white
                shadow-lg shadow-emerald-700/20 transition active:scale-95
                hover:bg-emerald-800
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

      {/* MODAL */}
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
              fixed inset-0 z-[9997] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm
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
                  overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-2 shadow-2xl
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
              fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm
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
                  onClick={() => remover(confirmar.id)}
                  className="
                    flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white
                    shadow-lg shadow-red-600/20 transition active:scale-95 hover:bg-red-700
                  "
                >
                  Excluir
                </button>

                <button
                  onClick={() => setConfirmar(null)}
                  className="
                    flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700
                    transition active:scale-95 hover:bg-gray-200
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
              fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm
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
        {abrirScanner && (
          <Scanner onClose={() => setAbrirScanner(false)} onScan={aoEscanear} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Medicamentos;