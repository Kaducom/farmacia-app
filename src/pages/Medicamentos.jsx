import { useEffect, useRef, useState } from "react";
import { db } from "../db";
import ToastStack from "../components/ToastStack";
import Scanner from "../components/Scanner";
import { motion, AnimatePresence } from "framer-motion";

import {
  Barcode,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Loader2,
  PackageCheck,
  PackagePlus,
  Pill,
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

  const [loteScanner, setLoteScanner] = useState(null);
  const [processandoLote, setProcessandoLote] = useState(false);

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
        codigo: m.codigo ? String(m.codigo) : null,
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
    const validadeFormatada = dataParaTextoBR(dataValida);
    const validadeComparacao = normalizarValidadeParaComparar(validadeFormatada);

    const existente = medicamentos.find((m) => {
      if (editando && m.id === editando.id) return false;

      const mesmaValidade =
        normalizarValidadeParaComparar(m.validade) === validadeComparacao;

      if (codigoFinal) {
        return String(m.codigo || "") === String(codigoFinal) && mesmaValidade;
      }

      return (
        String(m.nome || "").toLowerCase() === nomeLimpo.toLowerCase() &&
        mesmaValidade
      );
    });

    const dados = {
      nome: nomeLimpo,
      validade: validadeFormatada,
      imagem,
      codigo: codigoFinal ? String(codigoFinal) : null,
      diasRemover: Number(diasRemover) || 7,
      diasPreVencido: diasPre ? Number(diasPre) : null,
      quantidade: qtd,
    };

    try {
      if (codigoFinal) {
        await salvarProdutoNaBase({
          codigo: String(codigoFinal),
          nome: nomeLimpo,
          imagem,
          diasRemover: Number(diasRemover) || 7,
          diasPreVencido: diasPre ? Number(diasPre) : null,
        });
      }

      if (editando) {
        await db.medicamentos.update(editando.id, dados);
        addToast("Medicamento atualizado ✨");
      } else if (existente) {
        await db.medicamentos.update(existente.id, {
          quantidade: Number(existente.quantidade || 1) + qtd,
        });

        addToast("Quantidade atualizada nesse lote 📦");
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

  async function salvarProdutoNaBase(produto) {
    const codigo = String(produto.codigo || "").trim();

    if (!codigo) return;

    const existente = await db.produtosCodigo
      .where("codigo")
      .equals(codigo)
      .first();

    const dados = {
      codigo,
      nome: produto.nome || "",
      imagem: produto.imagem || null,
      diasRemover: Number(produto.diasRemover) || 7,
      diasPreVencido: produto.diasPreVencido
        ? Number(produto.diasPreVencido)
        : null,
      criadoEm: produto.criadoEm || new Date().toISOString(),
    };

    if (existente) {
      await db.produtosCodigo.update(existente.id, {
        nome: dados.nome || existente.nome,
        imagem: dados.imagem || existente.imagem || null,
        diasRemover: dados.diasRemover || existente.diasRemover || 7,
        diasPreVencido:
          dados.diasPreVencido ?? existente.diasPreVencido ?? null,
      });

      return;
    }

    await db.produtosCodigo.add(dados);
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

    const texto = String(data).trim();

    // 0427 = 04/2027, validade no fim do mês
    if (/^\d{4}$/.test(texto)) {
      const mes = Number(texto.slice(0, 2));
      const anoCurto = Number(texto.slice(2, 4));
      const ano = 2000 + anoCurto;

      if (mes < 1 || mes > 12) return null;

      const ultimoDia = new Date(ano, mes, 0).getDate();

      return new Date(ano, mes - 1, ultimoDia);
    }

    // 15052027 = 15/05/2027
    if (/^\d{8}$/.test(texto)) {
      const dia = Number(texto.slice(0, 2));
      const mes = Number(texto.slice(2, 4));
      const ano = Number(texto.slice(4, 8));

      const dataFinal = new Date(ano, mes - 1, dia);

      if (
        dataFinal.getFullYear() !== ano ||
        dataFinal.getMonth() !== mes - 1 ||
        dataFinal.getDate() !== dia
      ) {
        return null;
      }

      return dataFinal;
    }

    // 04/27 = 04/2027, validade no fim do mês
    if (/^\d{2}\/\d{2}$/.test(texto)) {
      const [mesTexto, anoTexto] = texto.split("/");
      const mes = Number(mesTexto);
      const ano = 2000 + Number(anoTexto);

      if (mes < 1 || mes > 12) return null;

      const ultimoDia = new Date(ano, mes, 0).getDate();

      return new Date(ano, mes - 1, ultimoDia);
    }

    // 04/2027 = validade no fim do mês
    if (/^\d{2}\/\d{4}$/.test(texto)) {
      const [mesTexto, anoTexto] = texto.split("/");
      const mes = Number(mesTexto);
      const ano = Number(anoTexto);

      if (mes < 1 || mes > 12) return null;

      const ultimoDia = new Date(ano, mes, 0).getDate();

      return new Date(ano, mes - 1, ultimoDia);
    }

    // 15/05/2027
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split("/").map(Number);

      const dataFinal = new Date(ano, mes - 1, dia);

      if (
        dataFinal.getFullYear() !== ano ||
        dataFinal.getMonth() !== mes - 1 ||
        dataFinal.getDate() !== dia
      ) {
        return null;
      }

      return dataFinal;
    }

    // 2027-05-15
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [ano, mes, dia] = texto.split("-").map(Number);

      const dataFinal = new Date(ano, mes - 1, dia);

      if (
        dataFinal.getFullYear() !== ano ||
        dataFinal.getMonth() !== mes - 1 ||
        dataFinal.getDate() !== dia
      ) {
        return null;
      }

      return dataFinal;
    }

    const dataConvertida = new Date(texto);

    if (Number.isNaN(dataConvertida.getTime())) {
      return null;
    }

    return dataConvertida;
  }

  function dataParaTextoBR(data) {
    const d = parseDataSegura(data);

    if (!d || Number.isNaN(d.getTime())) return "";

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();

    return `${dia}/${mes}/${ano}`;
  }

  function normalizarValidadeParaComparar(data) {
    const d = parseDataSegura(data);

    if (!d || Number.isNaN(d.getTime())) return "";

    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarValidadeDigitada(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 8);

    if (digitos.length <= 2) return digitos;

    if (digitos.length <= 4) {
      return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }

    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
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
    `${m.nome || ""} ${m.validade || ""} ${m.codigo || ""}`
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
    setLoteScanner(null);

    setTimeout(() => {
      setScannerKey((prev) => prev + 1);
    }, 0);
  }

  function adicionarPreviewScanner(item) {
    const agora = Date.now();

    setScannerPreviewItens((prev) => {
      const semMesmoLote = prev.filter(
        (p) =>
          !(
            String(p.codigo || "") === String(item.codigo || "") &&
            normalizarValidadeParaComparar(p.validade) ===
              normalizarValidadeParaComparar(item.validade)
          )
      );

      const novoItem = {
        id: `${item.codigo}-${normalizarValidadeParaComparar(
          item.validade
        )}-${agora}`,
        codigo: item.codigo ? String(item.codigo) : "",
        nome: item.nome || "Medicamento",
        imagem: item.imagem || null,
        validade: item.validade || "",
        quantidade: Number(item.quantidade || 1),
        tipo: item.tipo || "incrementado",
        atualizadoEm: agora,
      };

      return [novoItem, ...semMesmoLote].slice(0, 5);
    });
  }

  async function iniciarScanner() {
    setFabOpen(false);
    setAbrirModal(false);
    setConfirmar(null);
    setPreview(null);
    setLoteScanner(null);
    setScannerPreviewItens([]);

    setScannerKey((prev) => prev + 1);
    setAbrirScanner(true);
  }

  async function buscarProdutoLocal(codigo) {
    const codigoTexto = String(codigo || "").trim();

    if (!codigoTexto) return null;

    let produtoLocal = await db.produtosCodigo
      .where("codigo")
      .equals(codigoTexto)
      .first();

    if (!produtoLocal) {
      produtoLocal = await db.produtosCodigo
        .filter((p) => String(p.codigo || "") === codigoTexto)
        .first();
    }

    return produtoLocal || null;
  }

  async function buscarLotesPorCodigo(codigo) {
    const codigoTexto = String(codigo || "").trim();

    if (!codigoTexto) return [];

    let lotes = await db.medicamentos
      .where("codigo")
      .equals(codigoTexto)
      .toArray();

    if (!lotes.length) {
      lotes = await db.medicamentos
        .filter((m) => String(m.codigo || "") === codigoTexto)
        .toArray();
    }

    return lotes
      .map((lote) => ({
        ...lote,
        codigo: lote.codigo ? String(lote.codigo) : null,
        quantidade: Number(lote.quantidade || 1),
      }))
      .sort((a, b) => {
        const dataA = parseDataSegura(a.validade);
        const dataB = parseDataSegura(b.validade);

        if (!dataA && !dataB) return 0;
        if (!dataA) return 1;
        if (!dataB) return -1;

        return dataA - dataB;
      });
  }

  async function aoEscanear(codigo) {
    const codigoLimpo = String(codigo || "").replace(/\s/g, "").trim();

    if (!codigoLimpo) {
      addToast("Código inválido 😕", "erro");

      return {
        manterAberto: true,
        continuarScanner: true,
      };
    }

    addToast(`Código lido: ${codigoLimpo} 🔎`, "info");

    try {
      const [lotes, produtoLocal] = await Promise.all([
        buscarLotesPorCodigo(codigoLimpo),
        buscarProdutoLocal(codigoLimpo),
      ]);

      if (lotes.length > 0 || produtoLocal) {
        const produtoBase = {
          codigo: codigoLimpo,
          nome: produtoLocal?.nome || lotes[0]?.nome || "",
          imagem: produtoLocal?.imagem || lotes[0]?.imagem || null,
          diasRemover: produtoLocal?.diasRemover || lotes[0]?.diasRemover || 7,
          diasPreVencido:
            produtoLocal?.diasPreVencido || lotes[0]?.diasPreVencido || "",
        };

        setLoteScanner({
          codigo: codigoLimpo,
          produto: produtoBase,
          lotes,
          origem: lotes.length > 0 ? "estoque" : "base",
        });

        if (lotes.length > 0) {
          addToast("Produto encontrado. Escolha a validade ⚡", "ok");
        } else {
          addToast("Produto reconhecido. Informe a validade ⚡", "ok");
        }

        return {
          manterAberto: true,
          continuarScanner: true,
          abrirLote: true,
        };
      }

      limpar();

      setCodigoScanner(codigoLimpo);
      setQuantidade(1);
      setValidade("");
      setFabOpen(false);
      setNome("");
      setImagem(null);
      setDiasRemover(7);
      setDiasPre(2);

      addToast("Novo produto. Cadastre uma vez e eu aprendo 🧠", "aviso");

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

  async function somarLoteExistente(lote) {
    if (!lote?.id || processandoLote) return;

    try {
      setProcessandoLote(true);

      const novaQuantidade = Number(lote.quantidade || 1) + 1;

      await db.medicamentos.update(lote.id, {
        quantidade: novaQuantidade,
      });

      adicionarPreviewScanner({
        codigo: lote.codigo,
        nome: lote.nome,
        imagem: lote.imagem,
        validade: lote.validade,
        quantidade: novaQuantidade,
        tipo: "incrementado",
      });

      addToast(`+1 ${lote.nome || "produto"} • ${lote.validade} 📦`, "ok");

      setLoteScanner(null);
      await carregar();
    } catch (err) {
      console.error("Erro ao somar lote:", err);
      addToast("Erro ao somar lote 😕", "erro");
    } finally {
      setProcessandoLote(false);
    }
  }

  async function salvarNovaValidadeDoScanner(validadeNova) {
    if (processandoLote) return;

    const validadeDigitada = formatarValidadeDigitada(validadeNova);
    const dataValida = parseDataSegura(validadeDigitada);

    if (!dataValida || Number.isNaN(dataValida.getTime())) {
      addToast("Validade inválida ⚠️", "erro");
      return;
    }

    if (!loteScanner?.codigo) {
      addToast("Código inválido 😕", "erro");
      return;
    }

    const validadeFormatada = dataParaTextoBR(dataValida);
    const produto = loteScanner.produto || {};
    const nomeProduto = produto.nome || "Produto sem nome";

    try {
      setProcessandoLote(true);

      const lotesAtualizados = await buscarLotesPorCodigo(loteScanner.codigo);

      const loteMesmaValidade = lotesAtualizados.find(
        (lote) =>
          normalizarValidadeParaComparar(lote.validade) ===
          normalizarValidadeParaComparar(validadeFormatada)
      );

      if (loteMesmaValidade) {
        const novaQuantidade = Number(loteMesmaValidade.quantidade || 1) + 1;

        await db.medicamentos.update(loteMesmaValidade.id, {
          quantidade: novaQuantidade,
        });

        adicionarPreviewScanner({
          codigo: loteScanner.codigo,
          nome: loteMesmaValidade.nome,
          imagem: loteMesmaValidade.imagem,
          validade: loteMesmaValidade.validade,
          quantidade: novaQuantidade,
          tipo: "incrementado",
        });

        addToast("Validade já existia. +1 nesse lote 📦", "ok");
      } else {
        const novoLote = {
          nome: nomeProduto,
          validade: validadeFormatada,
          imagem: produto.imagem || null,
          codigo: String(loteScanner.codigo),
          diasRemover: Number(produto.diasRemover || 7),
          diasPreVencido: produto.diasPreVencido
            ? Number(produto.diasPreVencido)
            : null,
          quantidade: 1,
        };

        await db.medicamentos.add(novoLote);

        await salvarProdutoNaBase({
          codigo: String(loteScanner.codigo),
          nome: nomeProduto,
          imagem: produto.imagem || null,
          diasRemover: Number(produto.diasRemover || 7),
          diasPreVencido: produto.diasPreVencido
            ? Number(produto.diasPreVencido)
            : null,
        });

        adicionarPreviewScanner({
          codigo: loteScanner.codigo,
          nome: nomeProduto,
          imagem: produto.imagem || null,
          validade: validadeFormatada,
          quantidade: 1,
          tipo: "novo-lote",
        });

        addToast(`Novo lote criado • ${validadeFormatada} ✨`, "ok");
      }

      setLoteScanner(null);
      await carregar();
    } catch (err) {
      console.error("Erro ao salvar validade pelo scanner:", err);
      addToast("Erro ao salvar validade 😕", "erro");
    } finally {
      setProcessandoLote(false);
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
        validade: dataParaTextoBR(dataValida),
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

      {/* MODAL LOTE DO SCANNER */}
      <AnimatePresence>
        {loteScanner && (
          <ModalLoteScanner
            dados={loteScanner}
            processando={processandoLote}
            formatarData={formatarData}
            formatarValidadeDigitada={formatarValidadeDigitada}
            onFechar={() => setLoteScanner(null)}
            onSomarLote={somarLoteExistente}
            onNovaValidade={salvarNovaValidadeDoScanner}
          />
        )}
      </AnimatePresence>

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
                placeholder="mmaa ou ddmmaaaa"
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => {
                  const formatada = formatarValidadeDigitada(e.target.value);
                  const digitos = formatada.replace(/\D/g, "");

                  e.target.value = formatada;

                  const mesPossivel = Number(digitos.slice(0, 2));

                  const validadeMesAno =
                    digitos.length === 4 &&
                    mesPossivel >= 1 &&
                    mesPossivel <= 12;

                  const validadeCompleta = digitos.length === 8;

                  if (validadeMesAno || validadeCompleta) {
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

// =============================
// 🧪 MODAL LOTE SCANNER
// =============================

function ModalLoteScanner({
  dados,
  processando,
  formatarData,
  formatarValidadeDigitada,
  onFechar,
  onSomarLote,
  onNovaValidade,
}) {
  const [validadeRapida, setValidadeRapida] = useState("");

  const produto = dados?.produto || {};
  const lotes = Array.isArray(dados?.lotes) ? dados.lotes : [];

  function handleValidade(e) {
    const formatada = formatarValidadeDigitada(e.target.value);
    const digitos = formatada.replace(/\D/g, "");

    setValidadeRapida(formatada);

    const mesPossivel = Number(digitos.slice(0, 2));

    const validadeMesAno =
      digitos.length === 4 && mesPossivel >= 1 && mesPossivel <= 12;

    const validadeCompleta = digitos.length === 8;

    if (validadeMesAno || validadeCompleta) {
      onNovaValidade(formatada);
      setValidadeRapida("");
    }
  }

  return (
    <motion.div
      onClick={onFechar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[100000] flex items-end justify-center
        bg-black/45 p-3 backdrop-blur-sm sm:items-center
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 28, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 28, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="
          w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white
          text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white
        "
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 to-slate-950 p-5 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/15">
              {produto.imagem ? (
                <img
                  src={produto.imagem}
                  alt={produto.nome || "Produto"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Pill size={30} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black">
                {produto.nome || "Produto reconhecido"}
              </p>

              <p className="mt-1 flex items-center gap-1 truncate text-xs text-emerald-100">
                <Barcode size={14} />
                {dados.codigo}
              </p>

              <p className="mt-1 text-xs text-emerald-100">
                {lotes.length > 0
                  ? "Escolha a validade certa"
                  : "Informe a validade deste lote"}
              </p>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          {lotes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Clock3 size={18} className="text-emerald-600" />
                <p className="font-black">Validades no estoque</p>
              </div>

              <div className="space-y-3">
                {lotes.map((lote) => (
                  <button
                    key={lote.id}
                    type="button"
                    disabled={processando}
                    onClick={() => onSomarLote(lote)}
                    className="
                      flex w-full items-center gap-3 rounded-2xl border border-gray-200
                      bg-gray-100 p-3 text-left transition active:scale-[0.98]
                      disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800
                    "
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                      <CalendarDays size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black">{formatarData(lote.validade)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Quantidade atual: x{lote.quantidade || 1}
                      </p>
                    </div>

                    <div className="flex h-11 min-w-16 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 font-black text-white">
                      {processando ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={17} />
                          1
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <PackageCheck size={18} />
              <p className="font-black">Nova validade</p>
            </div>

            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              Digite <strong>0427</strong> para 04/2027 ou{" "}
              <strong>15052027</strong> para 15/05/2027.
            </p>

            <input
              autoFocus
              value={validadeRapida}
              onChange={handleValidade}
              inputMode="numeric"
              maxLength={10}
              placeholder="mmaa ou ddmmaaaa"
              disabled={processando}
              className="
                w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center
                text-lg font-black text-gray-950 outline-none transition
                focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20
                disabled:opacity-60 dark:border-emerald-500/20 dark:bg-gray-950 dark:text-white
              "
            />

            {processando && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <Loader2 size={17} className="animate-spin" />
                Salvando lote...
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-gray-100 p-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <p>
                Mesmo código com validade diferente vira outro card. Validade
                mês/ano usa o último dia do mês.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Medicamentos;