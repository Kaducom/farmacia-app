/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const STAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);

const BACKUP_DIR = path.join(ROOT, "_backups", `corrigir_tudo_${STAMP}`);

const rels = {
  medicamentos: path.join("src", "pages", "Medicamentos.jsx"),
  baseProdutos: path.join("src", "pages", "BaseProdutos.jsx"),
  bottomNav: path.join("src", "components", "navigation", "BottomNav.jsx"),
  appHeader: path.join("src", "components", "navigation", "AppHeader.jsx"),
  modalMedicamento: path.join("src", "components", "medicamentos", "ModalMedicamento.jsx"),
};

let alterados = 0;
let avisos = 0;

function abs(rel) {
  return path.join(ROOT, rel);
}

function existe(rel) {
  return fs.existsSync(abs(rel));
}

function ler(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}

function escrever(rel, conteudo) {
  fs.writeFileSync(abs(rel), conteudo, "utf8");
}

function garantirPasta(pasta) {
  fs.mkdirSync(pasta, { recursive: true });
}

function backup(rel) {
  const origem = abs(rel);

  if (!fs.existsSync(origem)) return;

  const destino = path.join(BACKUP_DIR, rel);
  garantirPasta(path.dirname(destino));
  fs.copyFileSync(origem, destino);
}

function salvarSeMudou(rel, antes, depois) {
  if (antes === depois) {
    console.log(`ℹ️  ${rel}: sem mudanças necessárias.`);
    return false;
  }

  backup(rel);
  escrever(rel, depois);
  alterados += 1;
  console.log(`✅ ${rel}: atualizado.`);
  return true;
}

function aviso(msg) {
  avisos += 1;
  console.log(`⚠️  ${msg}`);
}

function temArquivo(rel, nome) {
  if (!existe(rel)) {
    aviso(`Não achei ${rel}. Pulei ${nome}.`);
    return false;
  }

  return true;
}

function escaparRegExp(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureImportReactHooks(codigo, hooks) {
  const temReactImport = codigo.match(/import\s+\{([\s\S]*?)\}\s+from\s+["']react["'];/);

  if (temReactImport) {
    const atuais = temReactImport[1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    let mudou = false;

    hooks.forEach((hook) => {
      if (!atuais.includes(hook)) {
        atuais.push(hook);
        mudou = true;
      }
    });

    if (!mudou) return codigo;

    const novoImport = `import {\n  ${atuais.join(",\n  ")},\n} from "react";`;

    return codigo.replace(temReactImport[0], novoImport);
  }

  return `import {\n  ${hooks.join(",\n  ")},\n} from "react";\n\n${codigo}`;
}

function ensureImportLinha(codigo, linha) {
  if (codigo.includes(linha)) return codigo;

  const linhas = codigo.split("\n");
  let ultimoImport = -1;

  linhas.forEach((l, i) => {
    if (l.trim().startsWith("import ")) {
      ultimoImport = i;
    }
  });

  if (ultimoImport === -1) {
    return `${linha}\n${codigo}`;
  }

  linhas.splice(ultimoImport + 1, 0, linha);
  return linhas.join("\n");
}

function ensureFirestoreImports(codigo, nomes) {
  const regex = /import\s+\{([\s\S]*?)\}\s+from\s+["']firebase\/firestore["'];/;
  const match = codigo.match(regex);

  if (!match) {
    const linha = `import {\n  ${nomes.join(",\n  ")},\n} from "firebase/firestore";`;
    return ensureImportLinha(codigo, linha);
  }

  const atuais = match[1]
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let mudou = false;

  nomes.forEach((nome) => {
    if (!atuais.includes(nome)) {
      atuais.push(nome);
      mudou = true;
    }
  });

  if (!mudou) return codigo;

  const novoImport = `import {\n  ${atuais.join(",\n  ")},\n} from "firebase/firestore";`;

  return codigo.replace(match[0], novoImport);
}

function patchBaseProdutos() {
  const rel = rels.baseProdutos;

  if (!temArquivo(rel, "BaseProdutos")) return;

  let codigo = ler(rel);
  const antes = codigo;

  const efeito = `  // 🔒 corrigir_tudo.cjs: trava scroll do app quando modal abre
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

    const scrollYWindow = window.scrollY;
    const scrollTopMain = main?.scrollTop || 0;

    const estiloBodyAnterior = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      touchAction: body.style.touchAction,
    };

    const estiloHtmlAnterior = {
      overflow: html.style.overflow,
      touchAction: html.style.touchAction,
    };

    const estiloMainAnterior = main
      ? {
          overflow: main.style.overflow,
          touchAction: main.style.touchAction,
          overscrollBehavior: main.style.overscrollBehavior,
        }
      : null;

    function corrigirTudoBloquearScroll(e) {
      const alvo = e.target;
      const areaModal = alvo?.closest?.("[data-modal-scroll='true']");

      if (areaModal) return;

      e.preventDefault();
      e.stopPropagation();
    }

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = \`-\${scrollYWindow}px\`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.touchAction = "none";

    html.style.overflow = "hidden";
    html.style.touchAction = "none";

    if (main) {
      main.style.overflow = "hidden";
      main.style.touchAction = "none";
      main.style.overscrollBehavior = "contain";
    }

    document.addEventListener("wheel", corrigirTudoBloquearScroll, {
      passive: false,
      capture: true,
    });

    document.addEventListener("touchmove", corrigirTudoBloquearScroll, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", corrigirTudoBloquearScroll, {
        capture: true,
      });

      document.removeEventListener("touchmove", corrigirTudoBloquearScroll, {
        capture: true,
      });

      body.style.overflow = estiloBodyAnterior.overflow;
      body.style.position = estiloBodyAnterior.position;
      body.style.top = estiloBodyAnterior.top;
      body.style.left = estiloBodyAnterior.left;
      body.style.right = estiloBodyAnterior.right;
      body.style.width = estiloBodyAnterior.width;
      body.style.touchAction = estiloBodyAnterior.touchAction;

      html.style.overflow = estiloHtmlAnterior.overflow;
      html.style.touchAction = estiloHtmlAnterior.touchAction;

      if (main && estiloMainAnterior) {
        main.style.overflow = estiloMainAnterior.overflow;
        main.style.touchAction = estiloMainAnterior.touchAction;
        main.style.overscrollBehavior = estiloMainAnterior.overscrollBehavior;
        main.scrollTop = scrollTopMain;
      }

      window.scrollTo(0, scrollYWindow);

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: {
            open: false,
          },
        })
      );
    };
  }, [modalAberto, confirmarExclusao]);

`;

  if (!codigo.includes("corrigir_tudo.cjs: trava scroll do app")) {
    const alvo = `  useEffect(() => {
    carregarTudo();
  }, []);
`;

    if (codigo.includes(alvo)) {
      codigo = codigo.replace(alvo, `${alvo}\n${efeito}`);
    } else {
      aviso("BaseProdutos.jsx: não achei o useEffect carregarTudo para inserir trava de scroll.");
    }
  }

  if (!codigo.includes("data-modal-scroll")) {
    codigo = codigo.replace(
      /<motion\.div(\s+onClick=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}[\s\S]*?className="[^"]*overflow-y-auto[^"]*")/,
      '<motion.div data-modal-scroll="true"$1'
    );
  }

  codigo = codigo.replaceAll("max-h-[92dvh] w-full max-w-lg overflow-y-auto", "max-h-[92dvh] w-full max-w-lg overscroll-contain overflow-y-auto");
  codigo = codigo.replaceAll("fixed inset-0 z-[9999] flex", "fixed inset-0 z-[9999] flex overscroll-contain");

  salvarSeMudou(rel, antes, codigo);
}

function patchMedicamentos() {
  const rel = rels.medicamentos;

  if (!temArquivo(rel, "Medicamentos")) return;

  let codigo = ler(rel);
  const antes = codigo;

  codigo = ensureFirestoreImports(codigo, ["doc", "getDoc", "serverTimestamp", "setDoc"]);

  if (!codigo.includes('import { firestore } from "../firebase";')) {
    if (codigo.match(/import\s+\{([\s\S]*?)\}\s+from\s+["']\.\.\/firebase["'];/)) {
      codigo = codigo.replace(
        /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\.\/firebase["'];/,
        (m, conteudo) => {
          if (conteudo.includes("firestore")) return m;
          return `import {\n  ${conteudo
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
            .concat("firestore")
            .join(",\n  ")},\n} from "../firebase";`;
        }
      );
    } else {
      codigo = ensureImportLinha(codigo, 'import { firestore } from "../firebase";');
    }
  }

  if (!codigo.includes('from "../context/AuthContext"')) {
    codigo = ensureImportLinha(codigo, 'import { useAuth } from "../context/AuthContext";');
  }

  const helper = `async function compactarImagemParaFirestore(imagemBase64) {
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
    const regexIdDoc = /function idDocumentoProduto\(codigo\) \{[\s\S]*?return String\(codigo \|\| ""\)\.trim\(\)\.replaceAll\("\/", "_"\);[\s\S]*?\}/;

    if (regexIdDoc.test(codigo)) {
      codigo = codigo.replace(regexIdDoc, (m) => `${m}\n\n${helper}`);
    } else {
      aviso("Medicamentos.jsx: não achei idDocumentoProduto para inserir compactador.");
    }
  }

  if (!codigo.includes("const { usuarioAtual, isVisitante } = useAuth();")) {
    codigo = codigo.replace(
      /function Medicamentos\(\) \{\s*/,
      (m) => `${m}const { usuarioAtual, isVisitante } = useAuth();\n\n  `
    );
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

  if (!codigo.includes("[produtosCodigo] Imagem selecionada")) {
    const regexHandle = /function handleImagem\(e\) \{[\s\S]*?reader\.readAsDataURL\(file\);\s*\}/;

    if (regexHandle.test(codigo)) {
      codigo = codigo.replace(regexHandle, novoHandleImagem);
    } else {
      aviso("Medicamentos.jsx: não achei handleImagem para trocar.");
    }
  }

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

  if (!codigo.includes("[produtosCodigo] Salvando global")) {
    const regexSalvarGlobal = /async function salvarProdutoGlobal\(produto\) \{[\s\S]*?\n  \}\s*\n\s*async function salvarProdutoNaBase/;

    if (regexSalvarGlobal.test(codigo)) {
      codigo = codigo.replace(
        regexSalvarGlobal,
        `${novoSalvarProdutoGlobal}\n\n  async function salvarProdutoNaBase`
      );
    } else {
      aviso("Medicamentos.jsx: não achei salvarProdutoGlobal antes de salvarProdutoNaBase.");
    }
  }

  salvarSeMudou(rel, antes, codigo);
}

function patchBottomNav() {
  const rel = rels.bottomNav;

  if (!temArquivo(rel, "BottomNav")) return;

  let codigo = ler(rel);
  const antes = codigo;

  codigo = ensureImportReactHooks(codigo, ["useEffect", "useState"]);
  codigo = ensureImportLinha(codigo, 'import { motion } from "framer-motion";');

  if (!codigo.includes("const [overlayAberto, setOverlayAberto] = useState(false);")) {
    codigo = codigo.replace(
      /function BottomNav\(\{([\s\S]*?)\}\) \{/,
      (m) => `${m}
  const [overlayAberto, setOverlayAberto] = useState(false);

  useEffect(() => {
    function ouvirOverlay(e) {
      setOverlayAberto(Boolean(e.detail?.open));
    }

    window.addEventListener("app-overlay-change", ouvirOverlay);

    return () => {
      window.removeEventListener("app-overlay-change", ouvirOverlay);
    };
  }, []);
`
    );
  }

  if (!codigo.includes("<motion.nav")) {
    codigo = codigo.replace(
      /<nav\s+className=/,
      `<motion.nav
      initial={false}
      animate={{
        y: overlayAberto ? "140%" : "0%",
        opacity: overlayAberto ? 0 : 1,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className=`
    );

    codigo = codigo.replace(/<\/nav>/, "</motion.nav>");
  }

  salvarSeMudou(rel, antes, codigo);
}

function patchAppHeader() {
  const rel = rels.appHeader;

  if (!temArquivo(rel, "AppHeader")) return;

  let codigo = ler(rel);
  const antes = codigo;

  if (codigo.includes("app-overlay-change")) {
    console.log(`ℹ️  ${rel}: já escuta app-overlay-change.`);
    return;
  }

  codigo = ensureImportReactHooks(codigo, ["useEffect", "useState"]);
  codigo = ensureImportLinha(codigo, 'import { motion } from "framer-motion";');

  if (!codigo.includes("const [overlayAberto, setOverlayAberto] = useState(false);")) {
    codigo = codigo.replace(
      /function AppHeader\(\{([\s\S]*?)\}\) \{/,
      (m) => `${m}
  const [overlayAberto, setOverlayAberto] = useState(false);

  useEffect(() => {
    function ouvirOverlay(e) {
      setOverlayAberto(Boolean(e.detail?.open));
    }

    window.addEventListener("app-overlay-change", ouvirOverlay);

    return () => {
      window.removeEventListener("app-overlay-change", ouvirOverlay);
    };
  }, []);
`
    );
  }

  if (!codigo.includes("<motion.header")) {
    codigo = codigo.replace(
      /<header\s+className=/,
      `<motion.header
      initial={false}
      animate={{
        y: overlayAberto ? "-110%" : "0%",
        opacity: overlayAberto ? 0 : 1,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className=`
    );

    codigo = codigo.replace(/<\/header>/, "</motion.header>");
  }

  salvarSeMudou(rel, antes, codigo);
}

function patchModalMedicamento() {
  const rel = rels.modalMedicamento;

  if (!temArquivo(rel, "ModalMedicamento")) return;

  let codigo = ler(rel);
  const antes = codigo;

  codigo = ensureImportReactHooks(codigo, ["useEffect", "useState"]);

  if (!codigo.includes("ModalMedicamento overlay")) {
    const marcador = `  const [erros, setErros] = useState({});
`;

    const efeito = `  // ModalMedicamento overlay: avisa header/nav que existe modal aberto
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: {
          open: Boolean(abrirModal),
        },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: {
            open: false,
          },
        })
      );
    };
  }, [abrirModal]);

`;

    if (codigo.includes(marcador)) {
      codigo = codigo.replace(marcador, `${marcador}\n${efeito}`);
    } else {
      aviso("ModalMedicamento.jsx: não achei const [erros...] para inserir overlay.");
    }
  }

  salvarSeMudou(rel, antes, codigo);
}

console.log("🧰 corrigir_tudo.cjs iniciado");
console.log(`📁 Projeto: ${ROOT}`);
console.log(`🛟 Backups: ${BACKUP_DIR}`);
console.log("");

try {
  patchBaseProdutos();
  patchMedicamentos();
  patchBottomNav();
  patchAppHeader();
  patchModalMedicamento();

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Arquivos alterados: ${alterados}`);
  console.log(`⚠️  Avisos: ${avisos}`);

  if (alterados > 0) {
    console.log(`🛟 Backup criado em: ${BACKUP_DIR}`);
  }

  console.log("");
  console.log("Agora rode:");
  console.log("npm run dev");
  console.log("");
  console.log("Conferência rápida:");
  console.log('Select-String -Path src\\pages\\BaseProdutos.jsx -Pattern "data-modal-scroll|app-overlay-change|document.addEventListener|overscroll-contain" -Context 1,2');
  console.log('Select-String -Path src\\pages\\Medicamentos.jsx -Pattern "Salvando global|Imagem selecionada|imagemTamanho|compactarImagemParaFirestore" -Context 1,2');
  console.log("");
  console.log("Se algo ficar estranho, os arquivos antigos estão no backup. 🛟");
} catch (err) {
  console.error("");
  console.error("❌ corrigir_tudo.cjs falhou:");
  console.error(err);
  console.error("");
  console.error("Nenhum pânico: veja a pasta de backup se algum arquivo já tiver sido alterado.");
  process.exit(1);
}
