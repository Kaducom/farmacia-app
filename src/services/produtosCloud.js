import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../db";
import { firestore } from "../firebase";

const LIMITE_IMAGEM_MINI = 130000;
const TAMANHO_MAXIMO_IMAGEM = 180;
const QUALIDADES_IMAGEM = [0.42, 0.34, 0.28, 0.22, 0.16];

function limparTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizarDataChave(valor) {
  return String(valor || "")
    .trim()
    .replace(/\D/g, "")
    .slice(0, 8);
}

export function criarCloudIdProduto(produto) {
  if (produto?.cloudId) return String(produto.cloudId);

  const setor = limparTexto(produto?.setor || "Medicamentos");
  const validade = normalizarDataChave(produto?.validade);

  if (produto?.codigo) {
    return `cod-${limparTexto(produto.codigo)}-${validade}-${setor}`;
  }

  return `nome-${limparTexto(produto?.nome || "produto")}-${validade}-${setor}`;
}

function podeSincronizar(usuarioAtual) {
  return Boolean(usuarioAtual?.uid && !usuarioAtual?.visitante);
}

function imagemEhBase64DataUrl(imagem) {
  return typeof imagem === "string" && imagem.startsWith("data:image");
}

function imagemEhUrlWeb(imagem) {
  return (
    typeof imagem === "string" &&
    (imagem.startsWith("http://") || imagem.startsWith("https://"))
  );
}

function carregarImagem(imagemBase64) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = imagemBase64;
  });
}

async function gerarMiniaturaBase64(imagem) {
  if (!imagem || typeof imagem !== "string") return null;
  if (imagemEhUrlWeb(imagem)) return imagem;
  if (!imagemEhBase64DataUrl(imagem)) return null;

  if (imagem.length <= LIMITE_IMAGEM_MINI) {
    return imagem;
  }

  try {
    const img = await carregarImagem(imagem);
    const canvas = document.createElement("canvas");

    const proporcao = Math.min(
      TAMANHO_MAXIMO_IMAGEM / img.width,
      TAMANHO_MAXIMO_IMAGEM / img.height,
      1
    );

    canvas.width = Math.max(1, Math.round(img.width * proporcao));
    canvas.height = Math.max(1, Math.round(img.height * proporcao));

    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const qualidade of QUALIDADES_IMAGEM) {
      const mini = canvas.toDataURL("image/jpeg", qualidade);

      if (mini.length <= LIMITE_IMAGEM_MINI) {
        return mini;
      }
    }

    return null;
  } catch (err) {
    console.warn("[produtosCloud] Não consegui gerar miniatura:", err);
    return null;
  }
}

async function prepararImagemParaFirestore(produto) {
  const imagemOriginal = produto?.imagem;

  if (!imagemOriginal) {
    return {
      imagem: null,
      imagemTipo: null,
      imagemTamanho: 0,
      imagemMiniGeradaEm: null,
    };
  }

  const mini = await gerarMiniaturaBase64(imagemOriginal);

  if (!mini) {
    return {
      imagem: null,
      imagemTipo: "miniatura-indisponivel",
      imagemTamanho: 0,
      imagemMiniGeradaEm: Date.now(),
    };
  }

  return {
    imagem: mini,
    imagemTipo: imagemEhUrlWeb(mini) ? "url" : "base64-mini-firestore",
    imagemTamanho: mini.length,
    imagemMiniGeradaEm: Date.now(),
  };
}

function numeroSeguro(valor, fallback = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return fallback;

  return numero;
}

function numeroOuNull(valor) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function montarCamposInteligentes(produto) {
  const produtoJaPre = Boolean(produto?.produtoJaPre);
  const modoDataRetirada = Boolean(produto?.modoDataRetirada);
  const dataRetiradaInformada = produto?.dataRetiradaInformada || null;

  return {
    produtoJaPre,
    modoDataRetirada,
    dataRetiradaInformada,
    preVencimentoAtivadoEm: produtoJaPre
      ? numeroOuNull(produto?.preVencimentoAtivadoEm) || Date.now()
      : null,
  };
}

function montarPayloadProduto(usuarioAtual, produto, dadosImagem) {
  const agora = Date.now();
  const cloudId = criarCloudIdProduto(produto);

  return {
    cloudId,
    nome: String(produto?.nome || "").trim(),
    validade: produto?.validade || "",

    imagem: dadosImagem?.imagem ?? null,
    imagemTipo: dadosImagem?.imagemTipo ?? null,
    imagemTamanho: dadosImagem?.imagemTamanho ?? 0,
    imagemMiniGeradaEm: dadosImagem?.imagemMiniGeradaEm ?? null,
    imagemPath: null,

    codigo: produto?.codigo ? String(produto.codigo) : null,
    setor: produto?.setor || "Medicamentos",
    diasRemover: Number(produto?.diasRemover || 7),
    diasPreVencido: produto?.diasPreVencido
      ? Number(produto.diasPreVencido)
      : null,
    quantidade: Number(produto?.quantidade || 1),

    ...montarCamposInteligentes(produto),

    donoUid: usuarioAtual.uid,
    criadoEmLocal: Number(produto?.criadoEmLocal || agora),
    atualizadoEmLocal: Number(produto?.atualizadoEmLocal || agora),

    deletado: false,
    excluido: false,
    atualizadoEm: serverTimestamp(),
  };
}

export async function salvarProdutoNaNuvem(usuarioAtual, produto) {
  if (!podeSincronizar(usuarioAtual) || !produto) {
    return {
      ok: false,
      ignorado: true,
      erro: "Usuário sem nuvem",
    };
  }

  try {
    const cloudId = criarCloudIdProduto(produto);
    const dadosImagem = await prepararImagemParaFirestore(produto);
    const payload = montarPayloadProduto(usuarioAtual, produto, dadosImagem);

    const refProduto = doc(
      firestore,
      "usuarios",
      usuarioAtual.uid,
      "produtos",
      cloudId
    );

    await setDoc(refProduto, payload, { merge: true });

    return {
      ok: true,
      cloudId,
      payload,
    };
  } catch (err) {
    console.error("[produtosCloud] Erro ao salvar:", err);

    return {
      ok: false,
      erro: err?.code || err?.message || "Erro ao salvar na nuvem",
    };
  }
}

export async function excluirProdutoDaNuvem(usuarioAtual, produto) {
  if (!podeSincronizar(usuarioAtual) || !produto) {
    return {
      ok: false,
      ignorado: true,
    };
  }

  try {
    const cloudId = criarCloudIdProduto(produto);

    const refProduto = doc(
      firestore,
      "usuarios",
      usuarioAtual.uid,
      "produtos",
      cloudId
    );

    await setDoc(
      refProduto,
      {
        cloudId,
        codigo: produto.codigo ? String(produto.codigo) : null,
        nome: produto.nome || "",
        validade: produto.validade || "",
        setor: produto.setor || "Medicamentos",
        donoUid: usuarioAtual.uid,

        deletado: true,
        excluido: true,
        excluidoEm: serverTimestamp(),

        atualizadoEmLocal: Date.now(),
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      ok: true,
      cloudId,
    };
  } catch (err) {
    console.error("[produtosCloud] Erro ao excluir:", err);

    return {
      ok: false,
      erro: err?.code || err?.message || "Erro ao excluir da nuvem",
    };
  }
}

export async function baixarProdutosDaNuvem(usuarioAtual) {
  if (!podeSincronizar(usuarioAtual)) {
    return [];
  }

  const refProdutos = collection(
    firestore,
    "usuarios",
    usuarioAtual.uid,
    "produtos"
  );

  const snap = await getDocs(refProdutos);

  return snap.docs.map((docSnap) => {
    const dados = docSnap.data() || {};
    const deletado = Boolean(dados.deletado || dados.excluido);

    return {
      cloudId: dados.cloudId || docSnap.id,
      nome: dados.nome || "",
      validade: dados.validade || "",

      imagem: dados.imagem || null,
      imagemPath: null,
      imagemTipo: dados.imagemTipo || null,
      imagemTamanho: numeroSeguro(dados.imagemTamanho, 0),
      imagemMiniGeradaEm: numeroSeguro(dados.imagemMiniGeradaEm, 0),

      codigo: dados.codigo ? String(dados.codigo) : null,
      setor: dados.setor || "Medicamentos",
      diasRemover: Number(dados.diasRemover || 7),
      diasPreVencido: dados.diasPreVencido
        ? Number(dados.diasPreVencido)
        : null,
      quantidade: Number(dados.quantidade || 1),

      produtoJaPre: Boolean(dados.produtoJaPre),
      modoDataRetirada: Boolean(dados.modoDataRetirada),
      dataRetiradaInformada: dados.dataRetiradaInformada || null,
      preVencimentoAtivadoEm: numeroOuNull(dados.preVencimentoAtivadoEm),

      criadoEmLocal: numeroSeguro(dados.criadoEmLocal, 0),
      atualizadoEmLocal: numeroSeguro(dados.atualizadoEmLocal, 0),

      sincronizadoEm: Date.now(),
      pendenteSync: false,

      deletado,
      excluido: deletado,
    };
  });
}

export async function sincronizarProdutosDoUsuario(usuarioAtual) {
  if (!podeSincronizar(usuarioAtual)) {
    return {
      ok: false,
      ignorado: true,
      baixados: 0,
      enviados: 0,
      atualizados: 0,
      removidos: 0,
    };
  }

  let baixados = 0;
  let enviados = 0;
  let atualizados = 0;
  let removidos = 0;

  try {
    const [locais, nuvem] = await Promise.all([
      db.medicamentos.toArray(),
      baixarProdutosDaNuvem(usuarioAtual),
    ]);

    const nuvemDeletados = nuvem.filter(
      (produto) => produto.deletado || produto.excluido
    );

    const nuvemAtivos = nuvem.filter(
      (produto) => !produto.deletado && !produto.excluido
    );

    const deletadosPorCloudId = new Set(
      nuvemDeletados.map((produto) => produto.cloudId).filter(Boolean)
    );

    const locaisPorCloudId = new Map();

    locais.forEach((produto) => {
      const cloudId = criarCloudIdProduto(produto);

      locaisPorCloudId.set(cloudId, {
        ...produto,
        cloudId,
      });
    });

    const nuvemPorCloudId = new Map();

    nuvemAtivos.forEach((produto) => {
      nuvemPorCloudId.set(produto.cloudId, produto);
    });

    for (const produtoLocal of locaisPorCloudId.values()) {
      if (deletadosPorCloudId.has(produtoLocal.cloudId)) {
        if (produtoLocal.id) {
          await db.medicamentos.delete(produtoLocal.id);
          removidos += 1;
        }

        continue;
      }

      const produtoNuvem = nuvemPorCloudId.get(produtoLocal.cloudId);

      if (!produtoNuvem) {
        const res = await salvarProdutoNaNuvem(usuarioAtual, produtoLocal);

        if (res.ok && produtoLocal.id) {
          await db.medicamentos.update(produtoLocal.id, {
            cloudId: res.cloudId,
            imagem: res.payload?.imagem ?? produtoLocal.imagem ?? null,
            imagemPath: null,
            imagemTipo:
              res.payload?.imagemTipo ?? produtoLocal.imagemTipo ?? null,
            imagemTamanho:
              res.payload?.imagemTamanho ?? produtoLocal.imagemTamanho ?? 0,
            imagemMiniGeradaEm:
              res.payload?.imagemMiniGeradaEm ??
              produtoLocal.imagemMiniGeradaEm ??
              null,

            produtoJaPre: Boolean(res.payload?.produtoJaPre),
            modoDataRetirada: Boolean(res.payload?.modoDataRetirada),
            dataRetiradaInformada:
              res.payload?.dataRetiradaInformada ??
              produtoLocal.dataRetiradaInformada ??
              null,
            preVencimentoAtivadoEm:
              res.payload?.preVencimentoAtivadoEm ??
              produtoLocal.preVencimentoAtivadoEm ??
              null,

            sincronizadoEm: Date.now(),
            pendenteSync: false,
          });

          enviados += 1;
        }

        continue;
      }

      const localTime = Number(produtoLocal.atualizadoEmLocal || 0);
      const cloudTime = Number(produtoNuvem.atualizadoEmLocal || 0);

      const localTemImagemBase64 = imagemEhBase64DataUrl(produtoLocal.imagem);
      const nuvemSemImagem = !produtoNuvem.imagem;

      if (localTime > cloudTime || (localTemImagemBase64 && nuvemSemImagem)) {
        const res = await salvarProdutoNaNuvem(usuarioAtual, produtoLocal);

        if (res.ok && produtoLocal.id) {
          await db.medicamentos.update(produtoLocal.id, {
            cloudId: res.cloudId,
            imagem: res.payload?.imagem ?? produtoLocal.imagem ?? null,
            imagemPath: null,
            imagemTipo:
              res.payload?.imagemTipo ?? produtoLocal.imagemTipo ?? null,
            imagemTamanho:
              res.payload?.imagemTamanho ?? produtoLocal.imagemTamanho ?? 0,
            imagemMiniGeradaEm:
              res.payload?.imagemMiniGeradaEm ??
              produtoLocal.imagemMiniGeradaEm ??
              null,

            produtoJaPre: Boolean(res.payload?.produtoJaPre),
            modoDataRetirada: Boolean(res.payload?.modoDataRetirada),
            dataRetiradaInformada:
              res.payload?.dataRetiradaInformada ??
              produtoLocal.dataRetiradaInformada ??
              null,
            preVencimentoAtivadoEm:
              res.payload?.preVencimentoAtivadoEm ??
              produtoLocal.preVencimentoAtivadoEm ??
              null,

            sincronizadoEm: Date.now(),
            pendenteSync: false,
          });

          enviados += 1;
        }

        continue;
      }

      if (cloudTime > localTime && produtoLocal.id) {
        await db.medicamentos.update(produtoLocal.id, {
          ...produtoNuvem,
          id: produtoLocal.id,
          sincronizadoEm: Date.now(),
          pendenteSync: false,
        });

        atualizados += 1;
      }
    }

    for (const produtoNuvem of nuvemPorCloudId.values()) {
      if (locaisPorCloudId.has(produtoNuvem.cloudId)) continue;

      await db.medicamentos.add({
        ...produtoNuvem,
        sincronizadoEm: Date.now(),
        pendenteSync: false,
      });

      baixados += 1;
    }

    return {
      ok: true,
      baixados,
      enviados,
      atualizados,
      removidos,
    };
  } catch (err) {
    console.error("[produtosCloud] Erro ao sincronizar:", err);

    return {
      ok: false,
      erro: err?.code || err?.message || "Erro ao sincronizar produtos",
      baixados,
      enviados,
      atualizados,
      removidos,
    };
  }
}