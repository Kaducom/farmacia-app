import { useEffect, useRef, useState } from "react";
import { db } from "../db";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import ToastStack from "../components/ToastStack";
import Scanner from "../components/Scanner";
import { motion, AnimatePresence } from "framer-motion";

import {
  Barcode,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
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
import FundoBolhas from "../components/FundoBolhas";
import { firestore } from "../firebase";
import { useAuth } from "../context/AuthContext";

// =============================
// 💊 COMPONENTE PRINCIPAL
// =============================

const COLECAO_PRODUTOS_GLOBAIS = "produtosCodigo";
const LIMITE_IMAGEM_GLOBAL = 650000;

function idDocumentoProduto(codigo) {
  return String(codigo || "").trim().replaceAll("/", "_");
}

async function compactarImagemParaFirestore(imagemBase64) {
  if (!imagemBase64 || typeof imagemBase64 !== "string") {
    return null;
  }

  if (!imagemBase64.startsWith("data:image")) {
    return imagemBase64;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        const tamanhoMaximo = 280;
        const proporcao = Math.min(
          tamanhoMaximo / img.width,
          tamanhoMaximo / img.height,
          1
        );

        canvas.width = Math.max(1, Math.round(img.width * proporcao));
        canvas.height = Math.max(1, Math.round(img.height * proporcao));

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const qualidades = [0.42, 0.34, 0.28, 0.22];

        for (const qualidade of qualidades) {
          const compactada = canvas.toDataURL("image/jpeg", qualidade);

          if (compactada.length <= LIMITE_IMAGEM_GLOBAL) {
            resolve(compactada);
            return;
          }
        }

        resolve(null);
      } catch (err) {
        console.warn("Erro ao compactar imagem:", err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imagemBase64;
  });
}


function Medicamentos() {
  const { usuarioAtual, isVisitante } = useAuth();

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
  const [cardsAbertos, setCardsAbertos] = useState({});

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

  useEffect(() => {
  const overlayAberto =
    abrirModal ||
    abrirScanner ||
    Boolean(loteScanner) ||
    Boolean(preview) ||
    Boolean(confirmar) ||
    Boolean(inputValidadeRapida);

  window.dispatchEvent(
    new CustomEvent("app-overlay-change", {
      detail: {
        open: overlayAberto,
      },
    })
  );

  document.body.classList.toggle("app-overlay-open", overlayAberto);

  return () => {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: {
          open: false,
        },
      })
    );

    document.body.classList.remove("app-overlay-open");
  };
}, [
  abrirModal,
  abrirScanner,
  loteScanner,
  preview,
  confirmar,
  inputValidadeRapida,
]);

  useEffect(() => {
  setCardsAbertos((prev) => {
    const proximos = { ...prev };
    const idsAtuais = new Set(medicamentos.map((m) => String(m.id)));

    medicamentos.forEach((m) => {
      const id = String(m.id);

      if (proximos[id] === undefined && deveAbrirAutomaticamente(m)) {
        proximos[id] = true;
      }
    });

    Object.keys(proximos).forEach((id) => {
      if (!idsAtuais.has(id)) {
        delete proximos[id];
      }
    });

    return proximos;
  });
}, [medicamentos]);

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

  async function handleImagem(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      const original = String(reader.result || "");
      const compactada = await compactarImagemParaFirestore(original);

      console.log("[produtosCodigo] Imagem selecionada", {
        tamanhoOriginal: original.length,
        tamanhoCompactado: compactada ? compactada.length : 0,
        compactou: Boolean(compactada),
      });

      setImagem(compactada || original);

      if (compactada) {
        addToast("Imagem otimizada para nuvem 📸", "ok");
      } else {
        addToast("Imagem mantida localmente. Não consegui compactar 😕", "erro");
      }
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

  function montarDadosProdutoBase(produto) {
    const codigo = String(produto?.codigo || "").trim();

    if (!codigo) return null;

    return {
      codigo,
      nome: String(produto?.nome || "").trim(),
      imagem: produto?.imagem || null,
      diasRemover: Number(produto?.diasRemover || 7),
      diasPreVencido: produto?.diasPreVencido
        ? Number(produto.diasPreVencido)
        : null,
      criadoEm: produto?.criadoEm || new Date().toISOString(),
      atualizadoEmLocal: new Date().toISOString(),
    };
  }

  async function salvarProdutoLocalNaBase(produto) {
    const dados = montarDadosProdutoBase(produto);

    if (!dados) return null;

    const existente = await db.produtosCodigo
      .where("codigo")
      .equals(dados.codigo)
      .first();

    if (existente) {
      await db.produtosCodigo.update(existente.id, {
        nome: dados.nome || existente.nome,
        imagem: dados.imagem || existente.imagem || null,
        diasRemover: dados.diasRemover || existente.diasRemover || 7,
        diasPreVencido:
          dados.diasPreVencido ?? existente.diasPreVencido ?? null,
        origemBase: produto?.origemBase || existente.origemBase || "local",
        sincronizadoEm: produto?.sincronizadoEm || existente.sincronizadoEm || null,
        atualizadoEmLocal: dados.atualizadoEmLocal,
      });

      return {
        ...existente,
        ...dados,
      };
    }

    await db.produtosCodigo.add({
      ...dados,
      origemBase: produto?.origemBase || "local",
      sincronizadoEm: produto?.sincronizadoEm || null,
    });

    return dados;
  }

  async function buscarProdutoGlobal(codigo) {
    const codigoTexto = String(codigo || "").trim();

    if (!codigoTexto) return null;

    try {
      const ref = doc(firestore, COLECAO_PRODUTOS_GLOBAIS, idDocumentoProduto(codigoTexto));
      const snap = await getDoc(ref);

      if (!snap.exists()) return null;

      const dados = snap.data() || {};

      return {
        codigo: String(dados.codigo || codigoTexto),
        nome: dados.nome || "",
        imagem: dados.imagem || null,
        diasRemover: Number(dados.diasRemover || 7),
        diasPreVencido: dados.diasPreVencido
          ? Number(dados.diasPreVencido)
          : null,
        origemBase: "global",
        sincronizadoEm: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("Não consegui buscar produto global:", err);
      return null;
    }
  }

  async function salvarProdutoGlobal(produto) {
    const dados = montarDadosProdutoBase(produto);

    if (!dados || !dados.nome) {
      console.log("[produtosCodigo] Não sincronizou: dados incompletos", dados);
      return false;
    }

    if (isVisitante) {
      console.log("[produtosCodigo] Visitante não grava na nuvem");
      return false;
    }

    try {
      const imagemCompactada = await compactarImagemParaFirestore(dados.imagem);

      console.log("[produtosCodigo] Salvando global", {
        codigo: dados.codigo,
        nome: dados.nome,
        temImagemOriginal: Boolean(dados.imagem),
        tamanhoOriginal: dados.imagem ? String(dados.imagem).length : 0,
        temImagemCompactada: Boolean(imagemCompactada),
        tamanhoCompactado: imagemCompactada ? imagemCompactada.length : 0,
      });

      const ref = doc(
        firestore,
        COLECAO_PRODUTOS_GLOBAIS,
        idDocumentoProduto(dados.codigo)
      );

      const snap = await getDoc(ref);

      const payload = {
        codigo: dados.codigo,
        nome: dados.nome,
        diasRemover: dados.diasRemover || 7,
        diasPreVencido: dados.diasPreVencido ?? null,
        atualizadoEm: serverTimestamp(),
        atualizadoPor: usuarioAtual?.uid || null,
        atualizadoPorNome:
          usuarioAtual?.nome || usuarioAtual?.email || "Usuário",
      };

      if (imagemCompactada) {
        payload.imagem = imagemCompactada;
        payload.imagemTipo = "base64-mini";
        payload.imagemTamanho = imagemCompactada.length;
      }

      if (!snap.exists()) {
        payload.criadoEm = serverTimestamp();
        payload.criadoPor = usuarioAtual?.uid || null;
        payload.criadoPorNome =
          usuarioAtual?.nome || usuarioAtual?.email || "Usuário";
      }

      await setDoc(ref, payload, { merge: true });

      if (imagemCompactada) {
        addToast("Produto sincronizado com imagem ☁️📸", "ok");
      } else if (dados.imagem) {
        addToast("Produto sincronizado, mas a imagem ficou grande 😕", "erro");
      } else {
        addToast("Produto sincronizado sem imagem ☁️", "ok");
      }

      return true;
    } catch (err) {
      console.error("[produtosCodigo] Erro ao salvar global:", err);

      addToast(
        `Nuvem bloqueou: ${err?.code || err?.message || "erro desconhecido"}`,
        "erro"
      );

      return false;
    }
  }

  async function salvarProdutoNaBase(produto) {
    const salvoLocal = await salvarProdutoLocalNaBase(produto);

    if (!salvoLocal) return null;

    const sincronizouGlobal = await salvarProdutoGlobal(salvoLocal);

    return {
      ...salvoLocal,
      sincronizouGlobal,
    };
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

  function calcularDiasAte(data) {
  const dataFinal = parseDataSegura(data);

  if (!dataFinal || Number.isNaN(dataFinal.getTime())) {
    return null;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const alvo = new Date(dataFinal);
  alvo.setHours(0, 0, 0, 0);

  return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
}

function deveAbrirAutomaticamente(med) {
  const status = calcularStatus(med);

  if (["vencido", "remover", "pre"].includes(status)) {
    return true;
  }

  const { validade, remover, pre } = calcularDatas(med);
  const proximaData = pre || remover || validade;
  const dias = calcularDiasAte(proximaData);

  return dias !== null && dias <= 30;
}

function alternarCardMedicamento(id) {
  setCardsAbertos((prev) => ({
    ...prev,
    [String(id)]: !prev[String(id)],
  }));
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

    if (produtoLocal) {
      return {
        ...produtoLocal,
        origemBase: produtoLocal.origemBase || "local",
      };
    }

    const produtoGlobal = await buscarProdutoGlobal(codigoTexto);

    if (!produtoGlobal) return null;

    await salvarProdutoLocalNaBase(produtoGlobal);

    return produtoGlobal;
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
        const origemBase = produtoLocal?.origemBase || "estoque";

        const produtoBase = {
          codigo: codigoLimpo,
          nome: produtoLocal?.nome || lotes[0]?.nome || "",
          imagem: produtoLocal?.imagem || lotes[0]?.imagem || null,
          diasRemover: produtoLocal?.diasRemover || lotes[0]?.diasRemover || 7,
          diasPreVencido:
            produtoLocal?.diasPreVencido || lotes[0]?.diasPreVencido || "",
          origemBase,
        };

        setLoteScanner({
          codigo: codigoLimpo,
          produto: produtoBase,
          lotes,
          origem:
            lotes.length > 0
              ? "estoque"
              : origemBase === "global"
              ? "nuvem"
              : "base",
        });

        if (lotes.length > 0) {
          addToast("Produto encontrado. Escolha a validade ⚡", "ok");
        } else if (origemBase === "global") {
          addToast("Produto puxado da nuvem. Informe a validade ☁️", "ok");
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

      addToast(
        isVisitante
          ? "Novo produto. Visitante salva só neste aparelho 🧠"
          : "Novo produto. Cadastre uma vez e eu compartilho na nuvem 🧠☁️",
        "aviso"
      );

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
  <div className="relative min-h-screen overflow-hidden">
    <FundoBolhas variant="emerald" />

    <div
      ref={topRef}
      className="
        relative z-10 mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-4
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
  <motion.div layout className="mt-4 space-y-3">
    {lista.map((m) => (
      <CardMedicamentoSanfonado
        key={m.id}
        m={m}
        aberto={
          cardsAbertos[String(m.id)] ?? deveAbrirAutomaticamente(m)
        }
        onToggle={() => alternarCardMedicamento(m.id)}
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
  </div>
);
}

// =============================
// 💊 CARD SANFONADO MEDICAMENTO
// =============================

function CardMedicamentoSanfonado({
  m,
  aberto,
  onToggle,
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
  const status = calcularStatus(m);
  const datas = calcularDatas(m);

  const configStatus = {
    vencido: {
      titulo: "Vencido",
      descricao: "Retirar imediatamente",
      card:
        "border-red-200 bg-red-50/90 dark:border-red-500/20 dark:bg-red-500/10",
      badge: "bg-red-600 text-white",
      icon: "bg-red-600 text-white",
      texto: "text-red-700 dark:text-red-300",
    },
    remover: {
      titulo: "Remover",
      descricao: "Hora de tirar da prateleira",
      card:
        "border-orange-200 bg-orange-50/90 dark:border-orange-500/20 dark:bg-orange-500/10",
      badge: "bg-orange-600 text-white",
      icon: "bg-orange-600 text-white",
      texto: "text-orange-700 dark:text-orange-300",
    },
    pre: {
      titulo: "Pré-vencimento",
      descricao: "Atenção para desconto/ação",
      card:
        "border-amber-200 bg-amber-50/90 dark:border-amber-500/20 dark:bg-amber-500/10",
      badge: "bg-amber-500 text-white",
      icon: "bg-amber-500 text-white",
      texto: "text-amber-700 dark:text-amber-300",
    },
    ok: {
      titulo: "Normal",
      descricao: "Estoque em ordem",
      card:
        "border-emerald-200 bg-white/90 dark:border-emerald-500/20 dark:bg-gray-900/80",
      badge: "bg-emerald-600 text-white",
      icon: "bg-emerald-600 text-white",
      texto: "text-emerald-700 dark:text-emerald-300",
    },
  };

  const config = configStatus[status] || configStatus.ok;

  function obterDataPrincipal() {
    if (status === "vencido") {
      return {
        label: "Venceu em",
        valor: datas.validade ? formatarData(datas.validade) : "Sem data",
      };
    }

    if (status === "remover") {
      return {
        label: "Validade",
        valor: datas.validade ? formatarData(datas.validade) : "Sem data",
      };
    }

    if (status === "pre") {
      return {
        label: "Retirar em",
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

  return (
    <motion.div
      layout
      className={`
        overflow-hidden rounded-3xl border shadow-xl backdrop-blur-xl transition
        ${config.card}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className="
          flex w-full items-center gap-3 p-3 text-left transition
          active:scale-[0.99] sm:p-4
        "
      >
        <div
          className="
            flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl
            bg-gray-100 shadow-inner dark:bg-gray-800
          "
        >
          {m.imagem ? (
            <img
              src={m.imagem}
              alt={m.nome || "Medicamento"}
              className="h-full w-full object-cover"
            />
          ) : (
            <Pill size={28} className={config.texto} />
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
              x{Number(m.quantidade || 1)}
            </span>
          </div>

          <p className="mt-2 truncate text-base font-black text-gray-950 dark:text-white">
            {m.nome || "Medicamento sem nome"}
          </p>

          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {dataPrincipal.label}:{" "}
            <strong className={config.texto}>{dataPrincipal.valor}</strong>
          </p>

          {m.codigo && (
            <p className="mt-1 truncate text-[11px] text-gray-400">
              Código: {m.codigo}
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
            <div className="border-t border-black/5 p-3 pt-0 dark:border-white/10 sm:p-4 sm:pt-0">
              <div className="mb-3 grid grid-cols-3 gap-2">
                <MiniDataCard
                  label="Pré"
                  valor={datas.pre ? formatarData(datas.pre) : "Sem pré"}
                />

                <MiniDataCard
                  label="Retirar"
                  valor={datas.remover ? formatarData(datas.remover) : "Sem data"}
                />

                <MiniDataCard
                  label="Validade"
                  valor={
                    datas.validade ? formatarData(datas.validade) : "Sem data"
                  }
                />
              </div>

              <div className="rounded-3xl bg-white/70 p-2 shadow-inner dark:bg-black/10">
                <CardMedicamento
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniDataCard({ label, valor }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3 text-center shadow-sm dark:bg-white/10">
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-gray-800 dark:text-gray-100">
        {valor}
      </p>
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

  function parseDataLocal(valor) {
    if (!valor) return null;

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      return valor;
    }

    const texto = String(valor).trim();

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

    if (Number.isNaN(convertida.getTime())) {
      return null;
    }

    return convertida;
  }

  function calcularDiasAte(valor) {
    const data = parseDataLocal(valor);

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

  const lotesOrdenados = [...lotes].sort((a, b) => {
    const dataA = parseDataLocal(a.validade);
    const dataB = parseDataLocal(b.validade);

    if (!dataA && !dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;

    return dataA - dataB;
  });

  const loteMaisProximo = lotesOrdenados[0] || null;

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
        bg-black/65 px-3
        pb-[calc(env(safe-area-inset-bottom)+0.75rem)]
        pt-[calc(env(safe-area-inset-top)+0.75rem)]
        backdrop-blur-md
        sm:items-center sm:p-4
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 34, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 34, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
        className="
          relative flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)]
          w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem]
          border border-gray-200 bg-white text-gray-950 shadow-2xl
          dark:border-white/10 dark:bg-gray-950 dark:text-white
          sm:rounded-[2rem] sm:max-h-[92vh]
        "
      >
        {/* HEADER */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-950 p-5 text-white">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-emerald-300/10" />

          <div className="relative mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/30 sm:hidden" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/15 shadow-xl backdrop-blur-md">
              {produto.imagem ? (
                <img
                  src={produto.imagem}
                  alt={produto.nome || "Produto"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Pill size={31} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="mb-1 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-50">
                Produto reconhecido
              </span>

              <p className="truncate text-xl font-black">
                {produto.nome || "Produto reconhecido"}
              </p>

              <p className="mt-1 flex items-center gap-1 truncate text-xs text-emerald-100">
                <Barcode size={14} />
                {dados.codigo}
              </p>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="
                flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                bg-white/15 text-white transition active:scale-95
              "
            >
              <X size={21} />
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-2">
            <MiniLoteInfo label="Lotes" valor={lotes.length} />
            <MiniLoteInfo
              label="Unid."
              valor={lotes.reduce(
                (total, lote) => total + Number(lote.quantidade || 1),
                0
              )}
            />
            <MiniLoteInfo
              label="Próximo"
              valor={
                loteMaisProximo ? formatarData(loteMaisProximo.validade) : "Novo"
              }
            />
          </div>
        </div>

        {/* BODY */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {lotesOrdenados.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-black">
                    <Clock3 size={18} className="text-emerald-600" />
                    Validades no estoque
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Toque na validade correta para somar +1 unidade.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  +1
                </span>
              </div>

              <div className="space-y-3">
                {lotesOrdenados.map((lote, index) => {
                  const destaque = index === 0;
                  const dias = calcularDiasAte(lote.validade);
                  const vencido = dias !== null && dias < 0;

                  return (
                    <button
                      key={lote.id || `${lote.validade}-${index}`}
                      type="button"
                      disabled={processando}
                      onClick={() => onSomarLote(lote)}
                      className={`
                        group flex w-full items-center gap-3 rounded-3xl border p-3 text-left
                        shadow-sm transition active:scale-[0.985] disabled:opacity-60
                        ${
                          destaque
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                            : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg
                          ${
                            vencido
                              ? "bg-red-600"
                              : destaque
                              ? "bg-emerald-700"
                              : "bg-slate-700 dark:bg-slate-600"
                          }
                        `}
                      >
                        <CalendarDays size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">
                            {formatarData(lote.validade)}
                          </p>

                          {destaque && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              mais próxima
                            </span>
                          )}

                          {vencido && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              vencida
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {textoDias(lote.validade)} • quantidade atual: x
                          {lote.quantidade || 1}
                        </p>
                      </div>

                      <div className="flex h-12 min-w-16 items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3 font-black text-white shadow-lg shadow-emerald-600/20 transition group-active:scale-95">
                        {processando ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Plus size={18} />
                            1
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <PackageCheck size={21} />
                </div>

                <div>
                  <p className="font-black">Produto aprendido na base</p>
                  <p className="mt-1 text-sm">
                    Ainda não há lote no estoque. Informe a primeira validade
                    para criar o card.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* NOVA VALIDADE */}
          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <PackageCheck size={20} />
              </div>

              <div>
                <p className="font-black text-blue-800 dark:text-blue-300">
                  Criar nova validade
                </p>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Use quando o mesmo produto chegou com outro vencimento.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 p-3 dark:bg-gray-950/40">
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
                  h-13 h-[52px] w-full rounded-2xl border border-blue-200 bg-white px-4
                  text-center text-lg font-black text-gray-950 outline-none transition
                  placeholder:text-gray-400
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20
                  disabled:opacity-60
                  dark:border-blue-500/20 dark:bg-gray-950 dark:text-white
                "
              />

              {processando && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm font-black text-blue-700 dark:text-blue-300">
                  <Loader2 size={17} className="animate-spin" />
                  Salvando lote...
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-gray-100 p-4 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <p>
                Mesmo código com validade diferente vira outro card. Validade
                mês/ano usa o último dia do mês automaticamente.
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniLoteInfo({ label, valor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-2 text-center backdrop-blur-md">
      <p className="truncate text-sm font-black">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-100">
        {label}
      </p>
    </div>
  );
}

export default Medicamentos;