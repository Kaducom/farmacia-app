import { useEffect, useRef, useState } from "react";
import { db } from "../db";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import ToastStack from "../components/ToastStack";
import Scanner from "../components/Scanner";
import { motion, AnimatePresence } from "framer-motion";
import CardProdutoSanfonado from "../components/produtos/CardProdutoSanfonado";
import ModalScannerProduto from "../components/produtos/ModalScannerProduto";
import {
  filtrarProdutosPorEscopo,
  obterEscopoProdutos,
  obterSetorInicialFiltro,
  obterSetoresParaFiltro,
} from "../config/acessoProdutos";

import {
  excluirProdutoDaNuvem,
  salvarProdutoNaNuvem,
  sincronizarProdutosDoUsuario,
} from "../services/produtosCloud";

import {
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudOff,
  Clock3,
  ImageIcon,
  Loader2,
  PackagePlus,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

import FabMedicamentos from "../components/medicamentos/FabMedicamentos";
import ModalMedicamento from "../components/medicamentos/ModalMedicamento";
import FundoBolhas from "../components/FundoBolhas";
import { firestore } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BuscaProdutos from "../components/produtos/BuscaProdutos";

// =============================
// 📦 COMPONENTE PRINCIPAL
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

  const escopoProdutos = obterEscopoProdutos(usuarioAtual);
  const setoresFiltroProdutos = obterSetoresParaFiltro(usuarioAtual);
  const setorInicialProdutos = obterSetorInicialFiltro(usuarioAtual);

  const [medicamentos, setMedicamentos] = useState([]);

  const [imagem, setImagem] = useState(null);
  const [abrirModal, setAbrirModal] = useState(false);

  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("Medicamentos");
  const [validade, setValidade] = useState("");
  const [diasPre, setDiasPre] = useState("");
  const [diasRemover, setDiasRemover] = useState(7);
  const [quantidade, setQuantidade] = useState(1);

  const [editando, setEditando] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [preview, setPreview] = useState(null);

  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("validade-proxima");
  const [setorFiltro, setSetorFiltro] = useState(setorInicialProdutos);
  const [toasts, setToasts] = useState([]);

  const [fabOpen, setFabOpen] = useState(false);
  const [cardsAbertos, setCardsAbertos] = useState({});

  const [abrirScanner, setAbrirScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [modoReposicao, setModoReposicao] = useState(false);

  const [inputValidadeRapida, setInputValidadeRapida] = useState(null);
  const [codigoScanner, setCodigoScanner] = useState("");

  const [loteScanner, setLoteScanner] = useState(null);
  const [processandoLote, setProcessandoLote] = useState(false);
  const [sincronizandoManual, setSincronizandoManual] = useState(false);

  const topRef = useRef(null);

  // =============================
  // 🚀 INICIALIZAÇÃO
  // =============================

  useEffect(() => {
  setAbrirScanner(false);
  setFabOpen(false);

  carregar({ sincronizar: true });

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}, [usuarioAtual?.uid, isVisitante]);

  useEffect(() => {
  const setoresPermitidosFiltro = obterSetoresParaFiltro(usuarioAtual);
  const setorInicial = obterSetorInicialFiltro(usuarioAtual);

  setSetorFiltro((atual) => {
    if (!setoresPermitidosFiltro.includes(atual)) {
      return setorInicial;
    }

    if (setoresPermitidosFiltro.includes("Todos") && atual === "Medicamentos") {
      return "Todos";
    }

    return atual;
  });
}, [usuarioAtual]);

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

async function salvarProdutoContaNaNuvem(produto) {
  if (isVisitante || !usuarioAtual?.uid || !produto?.id) {
    return;
  }

  const res = await salvarProdutoNaNuvem(usuarioAtual, produto);

  if (!res.ok) {
    await db.medicamentos.update(produto.id, {
      pendenteSync: true,
    });

    console.warn("[sync-produtos] Não sincronizou:", res.erro);
    return;
  }

  await db.medicamentos.update(produto.id, {
    cloudId: res.cloudId,
    imagem: res.payload?.imagem ?? produto.imagem ?? null,
    imagemPath: res.payload?.imagemPath ?? produto.imagemPath ?? null,
    imagemTipo: res.payload?.imagemTipo ?? produto.imagemTipo ?? null,
    sincronizadoEm: Date.now(),
    pendenteSync: false,
  });
}
  
async function carregar(opcoes = {}) {
  try {
    if (opcoes.sincronizar && !isVisitante && usuarioAtual?.uid) {
      const resSync = await sincronizarProdutosDoUsuario(usuarioAtual);

      if (resSync.ok) {
        const totalSync =
          Number(resSync.baixados || 0) +
          Number(resSync.enviados || 0) +
          Number(resSync.atualizados || 0);

        if (totalSync > 0) {
          addToast("Produtos sincronizados com a conta ☁️", "ok");
        }
      } else if (!resSync.ignorado) {
        console.warn("[sync-produtos] Falha:", resSync.erro);
      }
    }

    const dados = await db.medicamentos.toArray();

    const normalizados = dados.map((m) => ({
      ...m,
      quantidade: Number(m.quantidade || 1),
      codigo: m.codigo ? String(m.codigo) : null,
      setor: m.setor || "Medicamentos",
      atualizadoEmLocal: Number(m.atualizadoEmLocal || Date.now()),
      pendenteSync: Boolean(m.pendenteSync),
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
    console.error("Erro ao carregar produtos:", err);
    addToast("Erro ao carregar produtos 😕", "erro");
  }
}

async function sincronizarAgora() {
  if (isVisitante || !usuarioAtual?.uid) {
    addToast("Visitante salva só neste aparelho 📱", "info");
    return;
  }

  try {
    setSincronizandoManual(true);

    const res = await sincronizarProdutosDoUsuario(usuarioAtual);

    if (!res.ok) {
      addToast(res.erro || "Não consegui sincronizar agora 😕", "erro");
      return;
    }

    const total =
      Number(res.baixados || 0) +
      Number(res.enviados || 0) +
      Number(res.atualizados || 0);

    if (total > 0) {
      addToast("Produtos sincronizados com a conta ☁️", "ok");
    } else {
      addToast("Tudo já estava sincronizado ☁️✨", "ok");
    }

    await carregar();
  } catch (err) {
    console.error("Erro ao sincronizar manualmente:", err);
    addToast("Erro ao sincronizar agora 😕", "erro");
  } finally {
    setSincronizandoManual(false);
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
    setSetor("Medicamentos");
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
    const setorFinal = setor || "Medicamentos";
    const validadeFormatada = dataParaTextoBR(dataValida);
    const validadeComparacao = normalizarValidadeParaComparar(validadeFormatada);

    const existente = medicamentos.find((m) => {
      if (editando && m.id === editando.id) return false;

      const mesmaValidade =
        normalizarValidadeParaComparar(m.validade) === validadeComparacao;

      const mesmoSetor = String(m.setor || "Medicamentos") === setorFinal;

      if (codigoFinal) {
        return (
          String(m.codigo || "") === String(codigoFinal) &&
          mesmaValidade &&
          mesmoSetor
        );
      }

      return (
        String(m.nome || "").toLowerCase() === nomeLimpo.toLowerCase() &&
        mesmaValidade &&
        mesmoSetor
      );
    });

    const dados = {
      nome: nomeLimpo,
      validade: validadeFormatada,
      imagem,
      codigo: codigoFinal ? String(codigoFinal) : null,
      setor: setorFinal,
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
          setor: setorFinal,
          diasRemover: Number(diasRemover) || 7,
          diasPreVencido: diasPre ? Number(diasPre) : null,
        });
      }

      const agora = Date.now();

      if (editando) {
        await db.medicamentos.update(editando.id, {
          ...dados,
          atualizadoEmLocal: agora,
          pendenteSync: true,
        });

        const produtoAtualizado = await db.medicamentos.get(editando.id);
        await salvarProdutoContaNaNuvem(produtoAtualizado);

        addToast("Produto atualizado ✨");
      } else if (existente) {
        const novaQuantidade = Number(existente.quantidade || 1) + qtd;

        await db.medicamentos.update(existente.id, {
          quantidade: novaQuantidade,
          atualizadoEmLocal: agora,
          pendenteSync: true,
        });

        const produtoAtualizado = await db.medicamentos.get(existente.id);
        await salvarProdutoContaNaNuvem(produtoAtualizado);

        addToast("Quantidade atualizada nesse lote 📦");
      } else {
        const idNovo = await db.medicamentos.add({
          ...dados,
          atualizadoEmLocal: agora,
          criadoEmLocal: agora,
          pendenteSync: true,
        });

        const produtoNovo = await db.medicamentos.get(idNovo);
        await salvarProdutoContaNaNuvem(produtoNovo);

        addToast(
          isVisitante
            ? "Produto salvo neste aparelho 📦"
            : "Produto salvo e enviado para sua conta ☁️📦"
        );
      }

      limpar();
      setAbrirModal(false);
      setFabOpen(false);

      await carregar();
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      addToast("Erro ao salvar produto 😕", "erro");
    }
  }

  function montarDadosProdutoBase(produto) {
    const codigo = String(produto?.codigo || "").trim();

    if (!codigo) return null;

    return {
      codigo,
      nome: String(produto?.nome || "").trim(),
      imagem: produto?.imagem || null,
      setor: produto?.setor || "Medicamentos",
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
        setor: dados.setor || existente.setor || "Medicamentos",
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
        setor: dados.setor || "Medicamentos",
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
        setor: dados.setor || "Medicamentos",
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
    const produto = await db.medicamentos.get(id);

    if (!produto) {
      setConfirmar(null);
      addToast("Produto não encontrado 😕", "erro");
      await carregar();
      return;
    }

    await db.medicamentos.delete(id);

    if (produto && !isVisitante && usuarioAtual?.uid) {
      const res = await excluirProdutoDaNuvem(usuarioAtual, produto);

      if (!res.ok && !res.ignorado) {
        console.warn("[sync-delete] Não marcou exclusão na nuvem:", res.erro);
        addToast("Apaguei neste aparelho, mas a nuvem pode tentar trazer de volta ⚠️", "erro");
      }
    }

    setConfirmar(null);
    addToast("Produto excluído da conta 🗑️☁️");

    await carregar();
  } catch (err) {
    console.error("Erro ao remover produto:", err);
    addToast("Erro ao excluir produto 😕", "erro");
  }
}


  async function alterarQuantidadeMedicamento(id, delta) {
    if (!id) return;

    const med = medicamentos.find((item) => item.id === id);

    if (!med) return;

    const quantidadeAtual = Number(med.quantidade || 1);
    const novaQuantidade = Math.max(1, Math.min(9999, quantidadeAtual + delta));

    if (novaQuantidade === quantidadeAtual) {
      addToast("Quantidade mínima é 1 unidade 📦", "info");
      return;
    }

    try {
await db.medicamentos.update(id, {
  quantidade: novaQuantidade,
  atualizadoEmLocal: Date.now(),
  pendenteSync: true,
});

const produtoAtualizado = await db.medicamentos.get(id);
await salvarProdutoContaNaNuvem(produtoAtualizado);

      setMedicamentos((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quantidade: novaQuantidade,
              }
            : item
        )
      );

      addToast(
        `${delta > 0 ? "+" : "-"}1 ${med.nome || "produto"} • agora x${novaQuantidade} 📦`,
        "ok"
      );
    } catch (err) {
      console.error("Erro ao alterar quantidade:", err);
      addToast("Erro ao alterar quantidade 😕", "erro");
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

function prepararEdicaoProduto(produto) {
  setEditando(produto);
  setNome(produto.nome || "");
  setValidade(produto.validade || "");
  setImagem(produto.imagem || null);
  setDiasPre(produto.diasPreVencido || "");
  setDiasRemover(produto.diasRemover || 7);
  setQuantidade(Number(produto.quantidade || 1));

  if (typeof setSetor === "function") {
    setSetor(produto.setor || "Medicamentos");
  }

  setAbrirModal(true);
  setFabOpen(false);
}

  // =============================
  // 🔍 LISTA / FILTRO / ORDENAÇÃO
  // =============================

  const buscaNormalizada = busca.trim().toLowerCase();

  function obterTempoValidade(item) {
    const data = parseDataSegura(item.validade);

    if (!data || Number.isNaN(data.getTime())) {
      return Number.POSITIVE_INFINITY;
    }

    return data.getTime();
  }

  function compararNome(a, b) {
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", {
      sensitivity: "base",
      numeric: true,
    });
  }

  function compararCodigo(a, b) {
    return String(a.codigo || "").localeCompare(String(b.codigo || ""), "pt-BR", {
      sensitivity: "base",
      numeric: true,
    });
  }

const produtosNoEscopo = filtrarProdutosPorEscopo(
  medicamentos,
  usuarioAtual
);

const produtosPendentesSync = produtosNoEscopo.filter(
  (produto) => produto.pendenteSync
).length;

const produtosSincronizados = produtosNoEscopo.filter(
  (produto) => !produto.pendenteSync && produto.sincronizadoEm
).length;

const lista = [...produtosNoEscopo]
  .filter((m) => {
    const setorProduto = m.setor || "Medicamentos";

    const combinaBusca = `${m.nome || ""} ${m.validade || ""} ${
      m.codigo || ""
    } ${setorProduto}`
      .toLowerCase()
      .includes(buscaNormalizada);

    const combinaSetor =
      !escopoProdutos.mostrarFiltroSetor ||
      setorFiltro === "Todos" ||
      setorProduto === setorFiltro;

    return combinaBusca && combinaSetor;
  })
    .sort((a, b) => {
      if (ordenacao === "validade-proxima") {
        return obterTempoValidade(a) - obterTempoValidade(b);
      }

      if (ordenacao === "validade-distante") {
        return obterTempoValidade(b) - obterTempoValidade(a);
      }

      if (ordenacao === "nome-az") {
        return compararNome(a, b);
      }

      if (ordenacao === "nome-za") {
        return compararNome(b, a);
      }

      if (ordenacao === "quantidade-maior") {
        return Number(b.quantidade || 0) - Number(a.quantidade || 0);
      }

      if (ordenacao === "quantidade-menor") {
        return Number(a.quantidade || 0) - Number(b.quantidade || 0);
      }

      if (ordenacao === "codigo") {
        return compararCodigo(a, b);
      }

      return 0;
    });

  // =============================
  // 📷 FLUXO DO SCANNER
  // =============================

  function fecharScannerSeguro() {
    setAbrirScanner(false);
    setFabOpen(false);
    setLoteScanner(null);

    setTimeout(() => {
      setScannerKey((prev) => prev + 1);
    }, 0);
  }

  async function iniciarScanner() {
    setFabOpen(false);
    setAbrirModal(false);
    setConfirmar(null);
    setPreview(null);
    setLoteScanner(null);
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
        setor: lote.setor || "Medicamentos",
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

  async function aoEscanear(codigo, meta = {}) {
    const codigoLimpo = String(codigo || "").replace(/\s/g, "").trim();
    const quantidadeEscaneada = Math.max(
      1,
      Math.min(999, Number(meta?.quantidade || 1))
    );

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
          setor: produtoLocal?.setor || lotes[0]?.setor || "Medicamentos",
          diasRemover: produtoLocal?.diasRemover || lotes[0]?.diasRemover || 7,
          diasPreVencido:
            produtoLocal?.diasPreVencido || lotes[0]?.diasPreVencido || "",
          origemBase,
        };

        setLoteScanner({
          codigo: codigoLimpo,
          produto: produtoBase,
          lotes,
          quantidadeScanner: quantidadeEscaneada,
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
      setQuantidade(quantidadeEscaneada);
      setValidade("");
      setFabOpen(false);
      setNome("");
      setImagem(null);
      setSetor("Medicamentos");
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

  async function finalizarAcaoScannerProduto(codigo, opcoes = {}) {
  await carregar();

  if (opcoes?.manterAberto) {
    const lotesAtualizados = await buscarLotesPorCodigo(codigo);

    setLoteScanner((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        lotes: lotesAtualizados,
      };
    });

    return;
  }

  setLoteScanner(null);
}

async function somarLoteExistente(lote, quantidadeSomar = 1, opcoes = {}) {
    if (!lote?.id || processandoLote) return;

    const qtdSomar = Math.max(1, Math.min(999, Number(quantidadeSomar || 1)));

    try {
      setProcessandoLote(true);

      const novaQuantidade = Number(lote.quantidade || 1) + qtdSomar;

      await db.medicamentos.update(lote.id, {
        quantidade: novaQuantidade,
        atualizadoEmLocal: Date.now(),
        pendenteSync: true,
      });

      const produtoAtualizado = await db.medicamentos.get(lote.id);
      await salvarProdutoContaNaNuvem(produtoAtualizado);

      addToast(`+${qtdSomar} ${lote.nome || "produto"} • ${lote.validade} 📦`, "ok");

      await finalizarAcaoScannerProduto(lote.codigo, opcoes);
    } catch (err) {
      console.error("Erro ao somar lote:", err);
      addToast("Erro ao somar lote 😕", "erro");
    } finally {
      setProcessandoLote(false);
    }
  }

  async function atualizarProdutoDoScanner(produtoEditado, opcoes = {}) {
  if (!produtoEditado) return;

  const codigo = String(
    produtoEditado.codigo || loteScanner?.codigo || ""
  ).trim();

  if (!codigo) {
    addToast("Código não encontrado para atualizar 😕", "erro");
    return;
  }

  try {
    setProcessandoLote(true);

    const lotes = await buscarLotesPorCodigo(codigo);

    const dadosAtualizados = {
      nome: String(produtoEditado.nome || "").trim(),
      imagem: produtoEditado.imagem || null,
      setor: produtoEditado.setor || "Medicamentos",
      diasRemover: Number(produtoEditado.diasRemover || 7),
      diasPreVencido: produtoEditado.diasPreVencido
        ? Number(produtoEditado.diasPreVencido)
        : null,
      atualizadoEmLocal: Date.now(),
      pendenteSync: true,
    };

    for (const lote of lotes) {
      await db.medicamentos.update(lote.id, dadosAtualizados);

      const atualizado = await db.medicamentos.get(lote.id);
      await salvarProdutoContaNaNuvem(atualizado);
    }

    if (codigo) {
      await salvarProdutoNaBase({
        codigo,
        nome: dadosAtualizados.nome,
        imagem: dadosAtualizados.imagem,
        setor: dadosAtualizados.setor,
        diasRemover: dadosAtualizados.diasRemover,
        diasPreVencido: dadosAtualizados.diasPreVencido,
      });
    }

    addToast("Produto atualizado pelo scanner ✨", "ok");

    await finalizarAcaoScannerProduto(codigo, {
      manterAberto: true,
    });

    setLoteScanner((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        produto: {
          ...prev.produto,
          ...dadosAtualizados,
          codigo,
        },
      };
    });
  } catch (err) {
    console.error("Erro ao atualizar produto pelo scanner:", err);
    addToast("Erro ao atualizar produto 😕", "erro");
  } finally {
    setProcessandoLote(false);
  }
}

async function atualizarLoteDoScanner(lote, alteracoes = {}, opcoes = {}) {
  if (!lote?.id) {
    addToast("Lote não encontrado 😕", "erro");
    return;
  }

  try {
    setProcessandoLote(true);

    const validadeDigitada = String(
      alteracoes.validade || lote.validade || ""
    ).trim();

    const dataValida = parseDataSegura(validadeDigitada);

    if (!dataValida || Number.isNaN(dataValida.getTime())) {
      addToast("Validade inválida ⚠️", "erro");
      return;
    }

    const quantidadeNova = Math.max(
      1,
      Number(alteracoes.quantidade || lote.quantidade || 1)
    );

    await db.medicamentos.update(lote.id, {
      validade: dataParaTextoBR(dataValida),
      quantidade: quantidadeNova,
      atualizadoEmLocal: Date.now(),
      pendenteSync: true,
    });

    const atualizado = await db.medicamentos.get(lote.id);
    await salvarProdutoContaNaNuvem(atualizado);

    addToast("Lote atualizado ✨", "ok");

    await finalizarAcaoScannerProduto(lote.codigo, {
      manterAberto: true,
      ...opcoes,
    });
  } catch (err) {
    console.error("Erro ao atualizar lote pelo scanner:", err);
    addToast("Erro ao atualizar lote 😕", "erro");
  } finally {
    setProcessandoLote(false);
  }
}

  async function salvarNovaValidadeDoScanner(
  validadeNova,
  quantidadeSomar = null,
  opcoes = {}
) {
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
    const qtdSomar = Math.max(
      1,
      Math.min(
        999,
        Number(quantidadeSomar || loteScanner?.quantidadeScanner || 1)
      )
    );

    try {
      setProcessandoLote(true);

      const lotesAtualizados = await buscarLotesPorCodigo(loteScanner.codigo);

      const loteMesmaValidade = lotesAtualizados.find(
        (lote) =>
          normalizarValidadeParaComparar(lote.validade) ===
          normalizarValidadeParaComparar(validadeFormatada)
      );

      if (loteMesmaValidade) {
        const novaQuantidade = Number(loteMesmaValidade.quantidade || 1) + qtdSomar;

        await db.medicamentos.update(loteMesmaValidade.id, {
          quantidade: novaQuantidade,
          atualizadoEmLocal: Date.now(),
          pendenteSync: true,
        });

        const produtoAtualizado = await db.medicamentos.get(loteMesmaValidade.id);
        await salvarProdutoContaNaNuvem(produtoAtualizado);

        addToast(`Validade já existia. +${qtdSomar} nesse lote 📦`, "ok");
      } else {
        const novoLote = {
          nome: nomeProduto,
          validade: validadeFormatada,
          imagem: produto.imagem || null,
          codigo: String(loteScanner.codigo),
          setor: produto.setor || "Medicamentos",
          diasRemover: Number(produto.diasRemover || 7),
          diasPreVencido: produto.diasPreVencido
            ? Number(produto.diasPreVencido)
            : null,
          quantidade: qtdSomar,
        };

        const agora = Date.now();
        const idNovoLote = await db.medicamentos.add({
          ...novoLote,
          criadoEmLocal: agora,
          atualizadoEmLocal: agora,
          pendenteSync: true,
        });

        const produtoNovoLote = await db.medicamentos.get(idNovoLote);
        await salvarProdutoContaNaNuvem(produtoNovoLote);

        await salvarProdutoNaBase({
          codigo: String(loteScanner.codigo),
          nome: nomeProduto,
          imagem: produto.imagem || null,
          setor: produto.setor || "Medicamentos",
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
          setor: produto.setor || "Medicamentos",
          quantidade: qtdSomar,
          tipo: "novo-lote",
        });

        addToast(`Novo lote criado • ${validadeFormatada} • x${qtdSomar} ✨`, "ok");
      }

      await finalizarAcaoScannerProduto(loteScanner.codigo, opcoes);
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
      const agora = Date.now();

      const idNovo = await db.medicamentos.add({
        nome: inputValidadeRapida.nome,
        setor: inputValidadeRapida.setor || "Medicamentos",
        validade: dataParaTextoBR(dataValida),
        quantidade: 1,
        diasRemover: 7,
        atualizadoEmLocal: agora,
        criadoEmLocal: agora,
        pendenteSync: true,
      });

const produtoNovo = await db.medicamentos.get(idNovo);
await salvarProdutoContaNaNuvem(produtoNovo);

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
      <BuscaProdutos
        busca={busca}
        setBusca={setBusca}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
        setorFiltro={setorFiltro}
        setSetorFiltro={setSetorFiltro}
        setores={setoresFiltroProdutos}
        mostrarFiltroSetor={escopoProdutos.mostrarFiltroSetor}
        quantidadeFiltrada={lista.length}
        quantidadeTotal={produtosNoEscopo.length}
      />
      <SyncResumoProdutos
        isVisitante={isVisitante}
        total={produtosNoEscopo.length}
        pendentes={produtosPendentesSync}
        sincronizados={produtosSincronizados}
        sincronizando={sincronizandoManual}
        onSincronizar={sincronizarAgora}
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

            <h2 className="text-xl font-bold">Nenhum produto encontrado</h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cadastre seu primeiro produto.
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
              Adicionar produto
            </button>
          </motion.div>
        )}
      </AnimatePresence>

{/* LISTA */}
{lista.length > 0 && (
  <motion.div layout className="relative z-0 mt-4 space-y-3">
    {lista.map((produto) => (
      <div key={produto.id} className="space-y-1.5">
        {(isVisitante || produto.pendenteSync || !produto.sincronizadoEm) && (
          <div className="flex justify-end">
            <SyncBadgeProduto produto={produto} isVisitante={isVisitante} />
          </div>
        )}

        <CardProdutoSanfonado
          produto={produto}
          aberto={
            cardsAbertos[String(produto.id)] ??
            deveAbrirAutomaticamente(produto)
          }
          onToggle={() => alternarCardMedicamento(produto.id)}
          calcularStatus={calcularStatus}
          calcularDatas={calcularDatas}
          formatarData={formatarData}
          onPreview={setPreview}
          onConfirmar={setConfirmar}
          onEditar={prepararEdicaoProduto}
          onAlterarQuantidade={alterarQuantidadeMedicamento}
        />
      </div>
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
        setor={setor}
        setSetor={setSetor}
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

        {/* MODAL PRODUTO DO SCANNER */}
        <AnimatePresence>
          {loteScanner && (
            <ModalScannerProduto
              dados={loteScanner}
              processando={processandoLote}
              formatarData={formatarData}
              formatarValidadeDigitada={formatarValidadeDigitada}
              onFechar={() => setLoteScanner(null)}
              onSomarLote={somarLoteExistente}
              onNovaValidade={salvarNovaValidadeDoScanner}
              onAtualizarProduto={atualizarProdutoDoScanner}
              onAtualizarLote={atualizarLoteDoScanner}
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
                    alt="Preview do produto"
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

              <h2 className="text-lg font-bold">Excluir produto?</h2>

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
          />
        )}
      </AnimatePresence>
     </div>
  </div>
);
}

function SyncResumoProdutos({
  isVisitante,
  total,
  pendentes,
  sincronizados,
  sincronizando,
  onSincronizar,
}) {
  const tudoOk = !isVisitante && total > 0 && pendentes === 0;
  const temPendencia = !isVisitante && pendentes > 0;
    if (!isVisitante && !temPendencia) {
     return null;
}

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="
        mt-3 rounded-[1.5rem] border border-gray-200 bg-white/75 p-3
        shadow-lg shadow-black/5 backdrop-blur-xl
        dark:border-white/10 dark:bg-gray-950/65
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`
              flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg
              ${
                isVisitante
                  ? "bg-slate-700 shadow-slate-700/20"
                  : temPendencia
                  ? "bg-amber-500 shadow-amber-500/20"
                  : "bg-emerald-700 shadow-emerald-700/20"
              }
            `}
          >
            {isVisitante ? (
              <CloudOff size={20} />
            ) : temPendencia ? (
              <Clock3 size={20} />
            ) : (
              <Cloud size={20} />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-900 dark:text-white">
              {isVisitante
                ? "Modo local"
                : temPendencia
                ? `${pendentes} produto${pendentes > 1 ? "s" : ""} pendente${pendentes > 1 ? "s" : ""}`
                : tudoOk
                ? "Tudo sincronizado"
                : "Sincronização da conta"}
            </p>

            <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isVisitante
                ? "Visitante salva apenas neste aparelho"
                : `${sincronizados}/${total} na nuvem`}
            </p>
          </div>
        </div>

        {temPendencia && (
        <button
          type="button"
          onClick={onSincronizar}
          disabled={sincronizando}
            className="
              flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl
              bg-emerald-700 px-3 text-xs font-black text-white shadow-lg
              shadow-emerald-700/20 transition hover:bg-emerald-800
              active:scale-95 disabled:opacity-60
            "
          >
            {sincronizando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}

            <span className="hidden sm:inline">
              {sincronizando ? "Sincronizando" : "Sincronizar"}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SyncBadgeProduto({ produto, isVisitante }) {
  const pendente = Boolean(produto?.pendenteSync);
  const sincronizado = Boolean(produto?.sincronizadoEm || produto?.cloudId);
  const temFotoMini = produto?.imagemTipo === "base64-mini-firestore";

  if (isVisitante) {
    return (
      <span
        className="
          inline-flex items-center gap-1.5 rounded-full border border-slate-300
          bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700
          shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200
        "
      >
        <CloudOff size={13} />
        Local
      </span>
    );
  }

  if (pendente) {
    return (
      <span
        className="
          inline-flex items-center gap-1.5 rounded-full border border-amber-300
          bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700
          shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300
        "
      >
        <Clock3 size={13} />
        Pendente
      </span>
    );
  }

if (sincronizado) {
  return null;
}

  return (
    <span
      className="
        inline-flex items-center gap-1.5 rounded-full border border-gray-300
        bg-gray-50 px-2.5 py-1 text-[11px] font-black text-gray-600
        shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-300
      "
    >
      <CloudOff size={13} />
      Local
    </span>
  );
}

export default Medicamentos;