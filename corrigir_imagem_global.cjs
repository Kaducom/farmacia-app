const fs = require("fs");
const path = require("path");

const arquivo = path.join(process.cwd(), "src", "pages", "Medicamentos.jsx");

if (!fs.existsSync(arquivo)) {
  console.error("❌ Não achei src/pages/Medicamentos.jsx. Rode este script na raiz do projeto.");
  process.exit(1);
}

let codigo = fs.readFileSync(arquivo, "utf8");

function aplicarRegex(regex, substituto, nome) {
  if (!regex.test(codigo)) {
    console.error(`❌ Não achei o trecho para trocar: ${nome}`);
    process.exit(1);
  }

  codigo = codigo.replace(regex, substituto);
  console.log(`✅ ${nome}`);
}

const helper = `
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
`;

if (!codigo.includes("async function compactarImagemParaFirestore")) {
  aplicarRegex(
    /function idDocumentoProduto\(codigo\) \{\s*return String\(codigo \|\| ""\)\.trim\(\)\.replaceAll\("\/", "_"\);\s*\}/,
    `function idDocumentoProduto(codigo) {
  return String(codigo || "").trim().replaceAll("/", "_");
}
${helper}`,
    "helper de compactação adicionado"
  );
} else {
  console.log("ℹ️ Helper de compactação já existia, pulei.");
}

const novoHandleImagem = `async function handleImagem(e) {
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
  }`;

aplicarRegex(
  /function handleImagem\(e\) \{[\s\S]*?reader\.readAsDataURL\(file\);\s*\}/,
  novoHandleImagem,
  "handleImagem compactando antes de salvar"
);

const novoSalvarProdutoGlobal = `async function salvarProdutoGlobal(produto) {
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
        \`Nuvem bloqueou: \${err?.code || err?.message || "erro desconhecido"}\`,
        "erro"
      );

      return false;
    }
  }`;

aplicarRegex(
  /async function salvarProdutoGlobal\(produto\) \{[\s\S]*?\n  \}\s*\n\s*async function salvarProdutoNaBase/,
  `${novoSalvarProdutoGlobal}

  async function salvarProdutoNaBase`,
  "salvarProdutoGlobal com imagem base64-mini e logs"
);

fs.writeFileSync(arquivo, codigo, "utf8");

console.log("");
console.log("🔥 Pronto! Agora rode:");
console.log("npm run dev");
console.log("");
console.log("Depois teste adicionando/editando um produto COM CÓDIGO + IMAGEM.");
console.log("No Console procure por: [produtosCodigo] Salvando global");
