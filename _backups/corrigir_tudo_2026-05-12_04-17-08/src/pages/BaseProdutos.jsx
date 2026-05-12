import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  Archive,
  Barcode,
  CalendarClock,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  DownloadCloud,
  Edit3,
  Filter,
  ImageIcon,
  Loader2,
  Package,
  PackageCheck,
  PackageSearch,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  UploadCloud,
  X,
} from "lucide-react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../db";
import { firestore } from "../firebase";
import { useAuth } from "../context/AuthContext";
import FundoBolhas from "../components/FundoBolhas";

const COLECAO_PRODUTOS_GLOBAIS = "produtosCodigo";
const LIMITE_IMAGEM_GLOBAL = 650000;

const produtoVazio = {
  idLocal: null,
  nome: "",
  codigo: "",
  imagem: "",
  diasRemover: "7",
  diasPreVencido: "",
  sincronizar: false,
};

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

function BaseProdutos() {
  const { usuarioAtual, isVisitante } = useAuth();

  const [produtosLocais, setProdutosLocais] = useState([]);
  const [produtosGlobais, setProdutosGlobais] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [toast, setToast] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(produtoVazio);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  const podeGravarGlobal = Boolean(usuarioAtual?.uid && !isVisitante);

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    const overlayAberto = modalAberto || Boolean(confirmarExclusao);

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: {
          open: overlayAberto,
        },
      })
    );

    if (!overlayAberto) {
      return;
    }

    const body = document.body;
    const html = document.documentElement;
    const main = document.querySelector("main");

    const scrollYJanela = window.scrollY;
    const scrollTopMain = main?.scrollTop || 0;

    const estiloBodyAnterior = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      touchAction: body.style.touchAction,
      overscrollBehavior: body.style.overscrollBehavior,
    };

    const estiloHtmlAnterior = {
      overflow: html.style.overflow,
      touchAction: html.style.touchAction,
      overscrollBehavior: html.style.overscrollBehavior,
    };

    const estiloMainAnterior = main
      ? {
          overflow: main.style.overflow,
          touchAction: main.style.touchAction,
          overscrollBehavior: main.style.overscrollBehavior,
        }
      : null;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollYJanela}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "none";

    html.style.overflow = "hidden";
    html.style.touchAction = "none";
    html.style.overscrollBehavior = "none";

    if (main) {
      main.style.overflow = "hidden";
      main.style.touchAction = "none";
      main.style.overscrollBehavior = "none";
    }

    function areaScrollModal(target) {
      return target?.closest?.("[data-modal-scroll='true']") || null;
    }

    function podeRolarArea(area, deltaY) {
      if (!area) return false;

      const consegueRolar = area.scrollHeight > area.clientHeight + 1;

      if (!consegueRolar) return false;

      const noTopo = area.scrollTop <= 0;
      const noFim = area.scrollTop + area.clientHeight >= area.scrollHeight - 1;

      if (deltaY < 0 && !noTopo) return true;
      if (deltaY > 0 && !noFim) return true;

      return false;
    }

    function bloquearWheel(e) {
      const area = areaScrollModal(e.target);

      if (area && podeRolarArea(area, e.deltaY)) {
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
    }

    let ultimoTouchY = 0;

    function registrarTouch(e) {
      ultimoTouchY = e.touches?.[0]?.clientY || 0;
    }

    function bloquearTouchMove(e) {
      const touchY = e.touches?.[0]?.clientY || 0;
      const deltaY = ultimoTouchY - touchY;
      ultimoTouchY = touchY;

      const area = areaScrollModal(e.target);

      if (area && podeRolarArea(area, deltaY)) {
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
    }

    document.addEventListener("wheel", bloquearWheel, {
      passive: false,
      capture: true,
    });

    document.addEventListener("touchstart", registrarTouch, {
      passive: true,
      capture: true,
    });

    document.addEventListener("touchmove", bloquearTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", bloquearWheel, {
        capture: true,
      });

      document.removeEventListener("touchstart", registrarTouch, {
        capture: true,
      });

      document.removeEventListener("touchmove", bloquearTouchMove, {
        capture: true,
      });

      body.style.overflow = estiloBodyAnterior.overflow;
      body.style.position = estiloBodyAnterior.position;
      body.style.top = estiloBodyAnterior.top;
      body.style.left = estiloBodyAnterior.left;
      body.style.right = estiloBodyAnterior.right;
      body.style.width = estiloBodyAnterior.width;
      body.style.touchAction = estiloBodyAnterior.touchAction;
      body.style.overscrollBehavior = estiloBodyAnterior.overscrollBehavior;

      html.style.overflow = estiloHtmlAnterior.overflow;
      html.style.touchAction = estiloHtmlAnterior.touchAction;
      html.style.overscrollBehavior = estiloHtmlAnterior.overscrollBehavior;

      if (main && estiloMainAnterior) {
        main.style.overflow = estiloMainAnterior.overflow;
        main.style.touchAction = estiloMainAnterior.touchAction;
        main.style.overscrollBehavior = estiloMainAnterior.overscrollBehavior;
        main.scrollTop = scrollTopMain;
      }

      window.scrollTo(0, scrollYJanela);

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: {
            open: false,
          },
        })
      );
    };
  }, [modalAberto, confirmarExclusao]);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }

    setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  function normalizarNumero(valor, padrao = 0) {
    const n = Number(valor);

    if (Number.isNaN(n)) return padrao;

    return n;
  }

  function tempoProduto(produto) {
    const possiveis = [
      produto.atualizadoEm,
      produto.sincronizadoEm,
      produto.criadoEm,
      produto.idLocal,
      produto.id,
    ];

    for (const valor of possiveis) {
      if (!valor) continue;

      if (typeof valor === "number") return valor;

      if (typeof valor === "string") {
        const n = Number(valor);
        if (!Number.isNaN(n)) return n;

        const data = new Date(valor);
        if (!Number.isNaN(data.getTime())) return data.getTime();
      }

      if (typeof valor?.toMillis === "function") {
        return valor.toMillis();
      }
    }

    return 0;
  }

  function montarListaUnificada(locais, globais) {
    const mapa = new Map();

    locais.forEach((local) => {
      const chave = local.codigo
        ? `codigo-${String(local.codigo)}`
        : `local-${local.id}`;

      mapa.set(chave, {
        ...local,
        idLocal: local.id,
        origemLocal: true,
        origemGlobal: false,
        localData: local,
      });
    });

    globais.forEach((global) => {
      const chave = global.codigo
        ? `codigo-${String(global.codigo)}`
        : `global-${global.idGlobal}`;

      const existente = mapa.get(chave);

      if (existente) {
        mapa.set(chave, {
          ...global,
          ...existente,
          nome: existente.nome || global.nome || "",
          codigo: existente.codigo || global.codigo || "",
          imagem: existente.imagem || global.imagem || "",
          diasRemover:
            existente.diasRemover ?? global.diasRemover ?? 7,
          diasPreVencido:
            existente.diasPreVencido ??
            existente.diasPre ??
            global.diasPreVencido ??
            global.diasPre ??
            null,
          idGlobal: global.idGlobal,
          origemLocal: true,
          origemGlobal: true,
          globalData: global,
          localData: existente.localData || existente,
        });

        return;
      }

      mapa.set(chave, {
        ...global,
        idLocal: null,
        origemLocal: false,
        origemGlobal: true,
        globalData: global,
      });
    });

    return Array.from(mapa.values()).sort((a, b) => {
      return tempoProduto(b) - tempoProduto(a);
    });
  }

  async function carregarTudo() {
    try {
      setCarregando(true);

      const locais = await db.produtosCodigo.toArray();

      let globais = [];

      try {
        const snap = await getDocs(collection(firestore, COLECAO_PRODUTOS_GLOBAIS));

        globais = snap.docs.map((docSnap) => ({
          idGlobal: docSnap.id,
          ...docSnap.data(),
          origemGlobal: true,
        }));
      } catch (err) {
        console.warn("Não consegui carregar base global:", err);
        mostrarToast(
          `Base global indisponível: ${err?.code || "erro"}`,
          "erro"
        );
      }

      setProdutosLocais(locais);
      setProdutosGlobais(globais);
      setProdutos(montarListaUnificada(locais, globais));
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar base de produtos 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  const resumo = useMemo(() => {
    const sincronizados = produtos.filter(
      (p) => p.origemLocal && p.origemGlobal
    ).length;

    const soLocal = produtos.filter(
      (p) => p.origemLocal && !p.origemGlobal
    ).length;

    const soGlobal = produtos.filter(
      (p) => !p.origemLocal && p.origemGlobal
    ).length;

    return {
      total: produtos.length,
      locais: produtosLocais.length,
      globais: produtosGlobais.length,
      sincronizados,
      soLocal,
      soGlobal,
      comImagem: produtos.filter((p) => !!p.imagem).length,
      semImagem: produtos.filter((p) => !p.imagem).length,
    };
  }, [produtos, produtosLocais.length, produtosGlobais.length]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((p) => {
      const texto = `${p.nome || ""} ${p.codigo || ""}`.toLowerCase();

      const bateBusca = !termo || texto.includes(termo);

      const temPre =
        Number(p.diasPreVencido || p.diasPre || 0) > 0;

      const bateFiltro =
        filtro === "todos" ||
        (filtro === "local" && p.origemLocal) ||
        (filtro === "global" && p.origemGlobal) ||
        (filtro === "sincronizados" && p.origemLocal && p.origemGlobal) ||
        (filtro === "soLocal" && p.origemLocal && !p.origemGlobal) ||
        (filtro === "soGlobal" && !p.origemLocal && p.origemGlobal) ||
        (filtro === "comImagem" && !!p.imagem) ||
        (filtro === "semImagem" && !p.imagem) ||
        (filtro === "comPre" && temPre) ||
        (filtro === "semCodigo" && !p.codigo);

      return bateBusca && bateFiltro;
    });
  }, [produtos, busca, filtro]);

  function abrirEditar(produto) {
    setForm({
      idLocal: produto.idLocal || null,
      nome: produto.nome || "",
      codigo: produto.codigo || "",
      imagem: produto.imagem || "",
      diasRemover: String(produto.diasRemover || "7"),
      diasPreVencido: String(produto.diasPreVencido || produto.diasPre || ""),
      sincronizar: Boolean(podeGravarGlobal && produto.codigo),
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setForm(produtoVazio);
  }

  function limparBusca() {
    setBusca("");
    setFiltro("todos");
  }

  async function selecionarImagemModal(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      const original = String(reader.result || "");
      const compactada = await compactarImagemParaFirestore(original);

      setForm((prev) => ({
        ...prev,
        imagem: compactada || original,
      }));

      if (compactada) {
        mostrarToast("Imagem otimizada 📸", "ok");
      } else {
        mostrarToast("Não consegui compactar a imagem 😕", "erro");
      }
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function salvarProdutoGlobal(produto) {
    if (!podeGravarGlobal) {
      mostrarToast("Visitante não salva na nuvem", "erro");
      return false;
    }

    const codigo = String(produto.codigo || "").trim();

    if (!codigo) {
      mostrarToast("Produto sem código não vai para a nuvem", "erro");
      return false;
    }

    if (!produto.nome?.trim()) {
      mostrarToast("Digite o nome antes de sincronizar", "erro");
      return false;
    }

    try {
      const imagemCompactada = await compactarImagemParaFirestore(produto.imagem);

      const ref = doc(
        firestore,
        COLECAO_PRODUTOS_GLOBAIS,
        idDocumentoProduto(codigo)
      );

      const snap = await getDoc(ref);

      const payload = {
        codigo,
        nome: produto.nome.trim(),
        diasRemover: normalizarNumero(produto.diasRemover, 7),
        diasPreVencido:
          produto.diasPreVencido === "" ||
          produto.diasPreVencido === null ||
          produto.diasPreVencido === undefined
            ? null
            : normalizarNumero(produto.diasPreVencido, 0),
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

      return true;
    } catch (err) {
      console.error("Erro ao sincronizar produto global:", err);
      mostrarToast(
        `Nuvem bloqueou: ${err?.code || err?.message || "erro"}`,
        "erro"
      );

      return false;
    }
  }

  async function salvarEdicao() {
    if (!form.nome.trim()) {
      mostrarToast("Digite o nome do produto", "erro");
      return;
    }

    const codigo = form.codigo.trim();
    const diasRemover = normalizarNumero(form.diasRemover, 7);
    const diasPreVencido =
      form.diasPreVencido === "" ? null : normalizarNumero(form.diasPreVencido, 0);

    if (diasRemover < 0 || Number(diasPreVencido || 0) < 0) {
      mostrarToast("Os dias não podem ser negativos", "erro");
      return;
    }

    const dados = {
      nome: form.nome.trim(),
      codigo,
      imagem: form.imagem || "",
      diasRemover,
      diasPreVencido,
      atualizadoEm: Date.now(),
    };

    try {
      setProcessando(true);

      let idLocal = form.idLocal;

      if (idLocal) {
        await db.produtosCodigo.update(idLocal, dados);
      } else {
        idLocal = await db.produtosCodigo.add({
          ...dados,
          criadoEm: Date.now(),
          origemBase: "local",
        });
      }

      if (form.sincronizar && codigo) {
        const ok = await salvarProdutoGlobal({
          ...dados,
          idLocal,
        });

        if (ok) {
          await db.produtosCodigo.update(idLocal, {
            origemBase: "global",
            sincronizadoEm: Date.now(),
          });

          mostrarToast("Produto salvo e sincronizado ☁️", "ok");
        }
      } else {
        mostrarToast("Produto salvo localmente ✨", "ok");
      }

      fecharModal();
      await carregarTudo();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao salvar produto 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  async function baixarGlobalParaLocal(produto) {
    if (!produto?.codigo) {
      mostrarToast("Produto global sem código", "erro");
      return;
    }

    try {
      setProcessando(true);

      const existente = await db.produtosCodigo
        .where("codigo")
        .equals(String(produto.codigo))
        .first();

      const dados = {
        nome: produto.nome || "",
        codigo: String(produto.codigo),
        imagem: produto.imagem || "",
        diasRemover: normalizarNumero(produto.diasRemover, 7),
        diasPreVencido:
          produto.diasPreVencido === undefined
            ? null
            : produto.diasPreVencido,
        origemBase: "global",
        sincronizadoEm: Date.now(),
        atualizadoEm: Date.now(),
      };

      if (existente) {
        await db.produtosCodigo.update(existente.id, dados);
      } else {
        await db.produtosCodigo.add({
          ...dados,
          criadoEm: Date.now(),
        });
      }

      mostrarToast("Produto global salvo neste aparelho 📲", "ok");
      await carregarTudo();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao trazer produto global 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  async function sincronizarProduto(produto) {
    try {
      setProcessando(true);

      const ok = await salvarProdutoGlobal(produto);

      if (ok && produto.idLocal) {
        await db.produtosCodigo.update(produto.idLocal, {
          origemBase: "global",
          sincronizadoEm: Date.now(),
          atualizadoEm: Date.now(),
        });

        mostrarToast("Produto enviado para a nuvem ☁️📸", "ok");
        await carregarTudo();
      }
    } finally {
      setProcessando(false);
    }
  }

  async function sincronizarLocais() {
    if (!podeGravarGlobal) {
      mostrarToast("Visitante não sincroniza com a nuvem", "erro");
      return;
    }

    const candidatos = produtos.filter(
      (p) => p.origemLocal && p.codigo && p.nome
    );

    if (!candidatos.length) {
      mostrarToast("Nenhum produto local com código para sincronizar", "erro");
      return;
    }

    try {
      setProcessando(true);

      let enviados = 0;

      for (const produto of candidatos) {
        const ok = await salvarProdutoGlobal(produto);

        if (ok) {
          enviados += 1;

          if (produto.idLocal) {
            await db.produtosCodigo.update(produto.idLocal, {
              origemBase: "global",
              sincronizadoEm: Date.now(),
              atualizadoEm: Date.now(),
            });
          }
        }
      }

      mostrarToast(`${enviados} produto(s) sincronizado(s) ☁️`, "ok");
      await carregarTudo();
    } finally {
      setProcessando(false);
    }
  }

  async function removerProdutoLocal(produto) {
    if (!produto?.idLocal) {
      setConfirmarExclusao(null);
      mostrarToast("Esse produto só existe na nuvem", "erro");
      return;
    }

    try {
      await db.produtosCodigo.delete(produto.idLocal);

      setConfirmarExclusao(null);
      mostrarToast("Produto removido deste aparelho 🗑️", "ok");
      await carregarTudo();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao remover produto 😕", "erro");
    }
  }

  async function copiarCodigo(codigo) {
    if (!codigo) return;

    try {
      await navigator.clipboard.writeText(String(codigo));
      mostrarToast("Código copiado 📋", "ok");
    } catch {
      mostrarToast("Não consegui copiar o código", "erro");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl space-y-5 p-4 pb-32 text-gray-950 dark:text-white">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/25">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-emerald-300/10" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
                <Archive size={34} />
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-100">
                  <Sparkles size={15} />
                  Scanner inteligente
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  Base de Produtos
                </h1>

                <p className="mt-1 text-sm text-emerald-100">
                  Base local + base global compartilhada entre aparelhos.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={carregarTudo}
                disabled={carregando || processando}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-emerald-800 shadow-lg transition active:scale-95 disabled:opacity-60"
              >
                {carregando ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <RefreshCcw size={20} />
                )}
                Atualizar
              </button>

              <button
                type="button"
                onClick={sincronizarLocais}
                disabled={!podeGravarGlobal || processando || carregando}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 font-black text-emerald-950 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {processando ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <UploadCloud size={20} />
                )}
                Sincronizar
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <ResumoCard icon={Package} valor={resumo.locais} label="Locais" />
            <ResumoCard icon={Cloud} valor={resumo.globais} label="Nuvem" />
            <ResumoCard icon={PackageCheck} valor={resumo.sincronizados} label="Sincronizados" />
            <ResumoCard icon={ImageIcon} valor={resumo.comImagem} label="Com imagem" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou código..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950"
              />
            </div>

            <div className="relative md:w-64">
              <Filter
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950"
              >
                <option value="todos">Todos</option>
                <option value="local">Locais</option>
                <option value="global">Na nuvem</option>
                <option value="sincronizados">Sincronizados</option>
                <option value="soLocal">Só neste aparelho</option>
                <option value="soGlobal">Só na nuvem</option>
                <option value="comImagem">Com imagem</option>
                <option value="semImagem">Sem imagem</option>
                <option value="comPre">Com pré-vencimento</option>
                <option value="semCodigo">Sem código</option>
              </select>
            </div>
          </div>

          {(busca || filtro !== "todos") && (
            <button
              type="button"
              onClick={limparBusca}
              className="mt-3 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
            >
              Limpar busca e filtro
            </button>
          )}
        </section>

        {!podeGravarGlobal && (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50/95 p-4 text-amber-800 shadow-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <CloudOff size={22} className="mt-0.5 shrink-0" />

              <p className="text-sm font-semibold">
                Visitante consegue ler a base global, mas não grava produtos na nuvem.
                Para sincronizar, entre com uma conta.
              </p>
            </div>
          </section>
        )}

        {carregando ? (
          <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <Loader2 className="mx-auto mb-3 animate-spin text-emerald-600" size={42} />
            <h2 className="font-black">Carregando base...</h2>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <PackageSearch className="mx-auto mb-3 text-gray-400" size={48} />

            <h2 className="font-black">Nenhum produto encontrado</h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Escaneie um produto, sincronize a base ou ajuste a busca.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {filtrados.map((produto) => (
              <ProdutoCard
                key={`${produto.codigo || "sem-codigo"}-${produto.idLocal || ""}-${produto.idGlobal || ""}`}
                produto={produto}
                processando={processando}
                podeGravarGlobal={podeGravarGlobal}
                onEditar={() => abrirEditar(produto)}
                onRemover={() => setConfirmarExclusao(produto)}
                onSincronizar={() => sincronizarProduto(produto)}
                onBaixar={() => baixarGlobalParaLocal(produto)}
                onCopiar={() => copiarCodigo(produto.codigo)}
              />
            ))}
          </section>
        )}

        <AnimatePresence>
          {modalAberto && (
            <ModalEditar
              form={form}
              setForm={setForm}
              processando={processando}
              podeGravarGlobal={podeGravarGlobal}
              selecionarImagem={selecionarImagemModal}
              onClose={fecharModal}
              onSave={salvarEdicao}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmarExclusao && (
            <ModalConfirmar
              produto={confirmarExclusao}
              onCancel={() => setConfirmarExclusao(null)}
              onConfirm={() => removerProdutoLocal(confirmarExclusao)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResumoCard({ icon: Icon, valor, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-4 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-2 text-emerald-100" size={22} />
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-xs font-bold text-emerald-100">{label}</p>
    </div>
  );
}

function ProdutoCard({
  produto,
  processando,
  podeGravarGlobal,
  onEditar,
  onRemover,
  onSincronizar,
  onBaixar,
  onCopiar,
}) {
  const diasRemover = produto.diasRemover || 7;
  const diasPre = produto.diasPreVencido || produto.diasPre || "";

  const sincronizado = produto.origemLocal && produto.origemGlobal;
  const soLocal = produto.origemLocal && !produto.origemGlobal;
  const soGlobal = !produto.origemLocal && produto.origemGlobal;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-4 shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-950">
          {produto.imagem ? (
            <img
              src={produto.imagem}
              alt={produto.nome || "Produto"}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={32} className="text-gray-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            {sincronizado && <Badge tone="emerald">☁️ Sincronizado</Badge>}
            {soLocal && <Badge tone="amber">📱 Só local</Badge>}
            {soGlobal && <Badge tone="blue">☁️ Só nuvem</Badge>}
            {!!produto.imagem && <Badge tone="slate">📸 Imagem</Badge>}
          </div>

          <h2 className="truncate text-lg font-black">
            {produto.nome || "Produto sem nome"}
          </h2>

          <button
            type="button"
            onClick={onCopiar}
            className="mt-1 flex max-w-full items-center gap-1 truncate text-xs font-bold text-gray-500 transition hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-300"
          >
            <Barcode size={14} />
            <span className="truncate">{produto.codigo || "Sem código"}</span>
            {produto.codigo && <Copy size={13} />}
          </button>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>Remover {diasRemover} dia(s)</Badge>
            <Badge>{diasPre ? `Pré ${diasPre} dia(s)` : "Sem pré"}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <BotaoCard
          icon={Edit3}
          label="Editar"
          onClick={onEditar}
          disabled={processando}
          color="blue"
        />

        <BotaoCard
          icon={UploadCloud}
          label="Nuvem"
          onClick={onSincronizar}
          disabled={processando || !podeGravarGlobal || !produto.origemLocal}
          color="emerald"
        />

        <BotaoCard
          icon={DownloadCloud}
          label="Baixar"
          onClick={onBaixar}
          disabled={processando || !produto.origemGlobal}
          color="slate"
        />

        <BotaoCard
          icon={Trash2}
          label="Local"
          onClick={onRemover}
          disabled={processando || !produto.origemLocal}
          color="red"
        />
      </div>
    </article>
  );
}

function BotaoCard({ icon: Icon, label, onClick, disabled, color }) {
  const cores = {
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-700 text-white",
    slate: "bg-slate-700 text-white",
    red: "bg-red-600 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-11 items-center justify-center gap-1.5 rounded-2xl
        text-xs font-black transition active:scale-95 disabled:opacity-45
        ${cores[color] || cores.slate}
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Badge({ children, tone = "emerald" }) {
  const tons = {
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    blue:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    slate:
      "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        tons[tone] || tons.emerald
      }`}
    >
      {children}
    </span>
  );
}

function ModalEditar({
  form,
  setForm,
  processando,
  podeGravarGlobal,
  selecionarImagem,
  onClose,
  onSave,
}) {
  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end justify-center overscroll-contain bg-black/60 p-4 backdrop-blur-sm md:items-center"
    >
      <motion.div
        data-modal-scroll="true"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="max-h-[92dvh] w-full max-w-lg overscroll-contain overflow-y-auto rounded-[2rem] border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Edit3 size={22} />
              Editar produto
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajuste a base local e, se quiser, envie para a nuvem.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 transition active:scale-95 dark:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <CampoModal
            label="Nome"
            value={form.nome}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                nome: v,
              }))
            }
            placeholder="Nome do produto"
          />

          <CampoModal
            label="Código de barras"
            value={form.codigo}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                codigo: v.replace(/\D/g, ""),
                sincronizar: prev.sincronizar && Boolean(v.replace(/\D/g, "")),
              }))
            }
            placeholder="Código"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <CampoModal
              label="Dias para remover"
              type="number"
              value={form.diasRemover}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  diasRemover: v,
                }))
              }
              placeholder="7"
            />

            <CampoModal
              label="Dias de pré-vencimento"
              type="number"
              value={form.diasPreVencido}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  diasPreVencido: v,
                }))
              }
              placeholder="Opcional"
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-bold text-gray-500 dark:text-gray-400">
              Imagem
            </span>

            <div className="flex gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-950">
                {form.imagem ? (
                  <img
                    src={form.imagem}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={28} className="text-gray-400" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-sm font-black text-white transition active:scale-95">
                  <ImageIcon size={17} />
                  Selecionar imagem
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={selecionarImagem}
                    className="hidden"
                  />
                </label>

                {form.imagem && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        imagem: "",
                      }))
                    }
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white transition active:scale-95"
                  >
                    <Trash2 size={16} />
                    Remover imagem
                  </button>
                )}
              </div>
            </div>
          </div>

          <CampoModal
            label="Imagem manual"
            value={form.imagem}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                imagem: v,
              }))
            }
            placeholder="URL/base64 da imagem"
          />

          {podeGravarGlobal && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div>
                <p className="font-black">Sincronizar na nuvem</p>
                <p className="text-xs opacity-80">
                  Envia nome, código, imagem e regras para outros aparelhos.
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.sincronizar}
                disabled={!form.codigo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sincronizar: e.target.checked,
                  }))
                }
                className="h-5 w-5 accent-emerald-700"
              />
            </label>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processando}
            className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-gray-800 dark:text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={processando}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition active:scale-95 disabled:opacity-60"
          >
            {processando ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Salvar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CampoModal({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950"
      />
    </label>
  );
}

function ModalConfirmar({ produto, onCancel, onConfirm }) {
  return (
    <motion.div
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overscroll-contain bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-5 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500 text-white">
          <TriangleAlert size={32} />
        </div>

        <h2 className="text-xl font-black">Remover deste aparelho?</h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Isso apaga a cópia local de{" "}
          <span className="font-black">
            {produto.nome || "produto sem nome"}
          </span>
          . Se existir na nuvem, ela continua disponível para baixar depois.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-red-600 py-3 font-black text-white transition active:scale-95"
          >
            Remover
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="fixed left-1/2 top-5 z-[10000] w-[92%] max-w-sm -translate-x-1/2"
    >
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${
            erro ? "bg-red-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>
    </motion.div>
  );
}

export default BaseProdutos;
