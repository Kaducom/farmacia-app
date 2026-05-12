/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const STAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);

const BACKUP_DIR = path.join(ROOT, "_backups", `corrigir_modal_medicamento_${STAMP}`);

const ARQUIVOS = {
  modal: path.join("src", "components", "medicamentos", "ModalMedicamento.jsx"),
  bottomNav: path.join("src", "components", "navigation", "BottomNav.jsx"),
};

function abs(rel) {
  return path.join(ROOT, rel);
}

function garantirPasta(pasta) {
  fs.mkdirSync(pasta, { recursive: true });
}

function backup(rel) {
  const origem = abs(rel);

  if (!fs.existsSync(origem)) {
    console.log(`⚠️ Não achei ${rel}`);
    return false;
  }

  const destino = path.join(BACKUP_DIR, rel);
  garantirPasta(path.dirname(destino));
  fs.copyFileSync(origem, destino);

  return true;
}

function escrever(rel, conteudo) {
  fs.writeFileSync(abs(rel), conteudo, "utf8");
}

function ler(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}

function salvar(rel, antes, depois) {
  if (antes === depois) {
    console.log(`ℹ️ ${rel}: sem mudanças.`);
    return;
  }

  backup(rel);
  escrever(rel, depois);
  console.log(`✅ ${rel}: corrigido.`);
}

function ensureReactHooks(codigo, hooks) {
  const regex = /import\s+\{([\s\S]*?)\}\s+from\s+["']react["'];/;
  const match = codigo.match(regex);

  if (!match) {
    return `import { ${hooks.join(", ")} } from "react";\n${codigo}`;
  }

  const atuais = match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  let mudou = false;

  hooks.forEach((hook) => {
    if (!atuais.includes(hook)) {
      atuais.push(hook);
      mudou = true;
    }
  });

  if (!mudou) return codigo;

  const novo = `import {\n  ${atuais.join(",\n  ")},\n} from "react";`;

  return codigo.replace(match[0], novo);
}

function ensureImportMotion(codigo) {
  if (codigo.includes('from "framer-motion"')) return codigo;

  const linhas = codigo.split("\n");
  let ultimoImport = -1;

  linhas.forEach((linha, index) => {
    if (linha.trim().startsWith("import ")) {
      ultimoImport = index;
    }
  });

  linhas.splice(ultimoImport + 1, 0, 'import { motion } from "framer-motion";');

  return linhas.join("\n");
}

function patchBottomNav() {
  const rel = ARQUIVOS.bottomNav;

  if (!fs.existsSync(abs(rel))) {
    console.log(`⚠️ Pulei BottomNav: não achei ${rel}`);
    return;
  }

  let codigo = ler(rel);
  const antes = codigo;

  codigo = ensureReactHooks(codigo, ["useEffect", "useState"]);
  codigo = ensureImportMotion(codigo);

  if (!codigo.includes("corrigir_modal_medicamento: overlay bottom nav")) {
    codigo = codigo.replace(
      /function BottomNav\(\{([\s\S]*?)\}\) \{/,
      (match) => `${match}
  // corrigir_modal_medicamento: overlay bottom nav
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
      /return\s*\(\s*<nav\s+className=/,
      `return (
    <motion.nav
      initial={false}
      animate={{
        y: overlayAberto ? "135%" : "0%",
        opacity: overlayAberto ? 0 : 1,
        pointerEvents: overlayAberto ? "none" : "auto",
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className=`
    );

    codigo = codigo.replace(/<\/nav>\s*\);/, "</motion.nav>\n  );");
  } else if (!codigo.includes('pointerEvents: overlayAberto ? "none" : "auto"')) {
    codigo = codigo.replace(
      /opacity:\s*overlayAberto\s*\?\s*0\s*:\s*1,\s*/g,
      'opacity: overlayAberto ? 0 : 1,\n        pointerEvents: overlayAberto ? "none" : "auto",\n      '
    );
  }

  salvar(rel, antes, codigo);
}

function patchModal() {
  const rel = ARQUIVOS.modal;

  if (!fs.existsSync(abs(rel))) {
    console.log(`❌ Não achei ${rel}`);
    process.exit(1);
  }

  let codigo = ler(rel);
  const antes = codigo;

  // Remove a trava antiga baseada em body position fixed.
  const efeitoRegex = /  useEffect\(\(\) => \{[\s\S]*?window\.addEventListener\("keydown", fecharComEsc\);[\s\S]*?window\.removeEventListener\("keydown", fecharComEsc\);\s*\};\s*\}, \[abrirModal\]\);\n/;

  const efeitoNovo = `  // corrigir_modal_medicamento: trava segura do scroll
  useEffect(() => {
    function soltarTravasPerdidas() {
      const main = document.querySelector("main");

      if (main?.dataset?.modalMedicamentoLock === "true") {
        main.style.overflow = "";
        main.style.touchAction = "";
        main.style.overscrollBehavior = "";
        main.removeAttribute("data-modal-medicamento-lock");
      }

      if (document.body?.dataset?.modalMedicamentoLock === "true") {
        document.body.style.overflow = "";
        document.body.removeAttribute("data-modal-medicamento-lock");
      }

      if (document.documentElement?.dataset?.modalMedicamentoLock === "true") {
        document.documentElement.style.overflow = "";
        document.documentElement.removeAttribute("data-modal-medicamento-lock");
      }
    }

    if (!abrirModal) {
      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: {
            open: false,
          },
        })
      );

      setTimeout(soltarTravasPerdidas, 80);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: {
          open: true,
        },
      })
    );

    const main = document.querySelector("main");
    const body = document.body;
    const html = document.documentElement;

    const scrollMain = main?.scrollTop || 0;

    const anterior = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      mainOverflow: main?.style.overflow || "",
      mainTouchAction: main?.style.touchAction || "",
      mainOverscroll: main?.style.overscrollBehavior || "",
    };

    body.dataset.modalMedicamentoLock = "true";
    html.dataset.modalMedicamentoLock = "true";

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    if (main) {
      main.dataset.modalMedicamentoLock = "true";
      main.style.overflow = "hidden";
      main.style.touchAction = "none";
      main.style.overscrollBehavior = "contain";
    }

    function bloquearScrollFundo(e) {
      const areaModal = e.target?.closest?.("[data-modal-scroll='true']");

      if (areaModal) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
    }

    function fecharComEsc(e) {
      if (e.key === "Escape") {
        fecharModal();
      }
    }

    document.addEventListener("wheel", bloquearScrollFundo, {
      passive: false,
      capture: true,
    });

    document.addEventListener("touchmove", bloquearScrollFundo, {
      passive: false,
      capture: true,
    });

    window.addEventListener("keydown", fecharComEsc);

    return () => {
      document.removeEventListener("wheel", bloquearScrollFundo, true);
      document.removeEventListener("touchmove", bloquearScrollFundo, true);
      window.removeEventListener("keydown", fecharComEsc);

      body.style.overflow = anterior.bodyOverflow;
      html.style.overflow = anterior.htmlOverflow;

      body.removeAttribute("data-modal-medicamento-lock");
      html.removeAttribute("data-modal-medicamento-lock");

      if (main) {
        main.style.overflow = anterior.mainOverflow;
        main.style.touchAction = anterior.mainTouchAction;
        main.style.overscrollBehavior = anterior.mainOverscroll;
        main.scrollTop = scrollMain;
        main.removeAttribute("data-modal-medicamento-lock");
      }

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: {
            open: false,
          },
        })
      );

      setTimeout(soltarTravasPerdidas, 120);
    };
  }, [abrirModal]);

`;

  if (efeitoRegex.test(codigo)) {
    codigo = codigo.replace(efeitoRegex, efeitoNovo);
  } else if (!codigo.includes("corrigir_modal_medicamento: trava segura do scroll")) {
    const marcador = "  const [erros, setErros] = useState({});\n";
    codigo = codigo.replace(marcador, `${marcador}\n${efeitoNovo}`);
  }

  // Overlay mais seguro: menos chance de bater no nav.
  codigo = codigo.replace(
    /fixed inset-0 z-\[2147483647\] flex items-end justify-center overflow-hidden\s*bg-black\/70 px-3\s*pt-\[calc\(env\(safe-area-inset-top\)\+4\.75rem\)\]\s*pb-\[calc\(env\(safe-area-inset-bottom\)\+0\.75rem\)\]\s*backdrop-blur-md\s*sm:items-center sm:p-4/g,
    `fixed inset-0 z-[2147483647] flex h-[100dvh] items-end justify-center overflow-hidden
            bg-black/70 px-3
            pt-[calc(env(safe-area-inset-top)+0.9rem)]
            pb-[calc(env(safe-area-inset-bottom)+0.9rem)]
            backdrop-blur-md
            sm:items-center sm:p-4`
  );

  // Se o overlay estiver em outra formatação, adiciona h-[100dvh].
  codigo = codigo.replace(
    /fixed inset-0 z-\[2147483647\] flex items-end justify-center overflow-hidden/g,
    "fixed inset-0 z-[2147483647] flex h-[100dvh] items-end justify-center overflow-hidden"
  );

  // Remove top gigantesco antigo, que empurra o modal pra baixo.
  codigo = codigo.replace(
    /pt-\[calc\(env\(safe-area-inset-top\)\+4\.75rem\)\]/g,
    "pt-[calc(env(safe-area-inset-top)+0.9rem)]"
  );

  codigo = codigo.replace(
    /pb-\[calc\(env\(safe-area-inset-bottom\)\+0\.75rem\)\]/g,
    "pb-[calc(env(safe-area-inset-bottom)+0.9rem)]"
  );

  // Container do modal com altura real.
  codigo = codigo.replace(
    /max-h-\[calc\(100dvh-env\(safe-area-inset-top\)-env\(safe-area-inset-bottom\)-5\.5rem\)\]/g,
    "max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.8rem)]"
  );

  codigo = codigo.replace(
    /sm:max-h-\[92vh\]/g,
    "sm:max-h-[92dvh]"
  );

  codigo = codigo.replace(
    /rounded-t-\[2rem\]/g,
    "rounded-[2rem]"
  );

  // Marcação para permitir scroll apenas no body do modal.
  if (!codigo.includes("data-modal-scroll")) {
    codigo = codigo.replace(
      /<div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">/,
      `<div
              data-modal-scroll="true"
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
            >`
    );
  }

  // Se já tem o body em linha única, deixa marcado.
  codigo = codigo.replace(
    /<div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">/g,
    `<div
              data-modal-scroll="true"
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
            >`
  );

  // Evita overlay preventDefault em scroll interno.
  if (!codigo.includes("function impedirBolhaDoModal")) {
    const antesDoReturn = "  return (\n";
    codigo = codigo.replace(
      antesDoReturn,
      `  function impedirBolhaDoModal(e) {
    e.stopPropagation();
  }

${antesDoReturn}`
    );
  }

  codigo = codigo.replace(
    /data-modal-scroll="true"\s*className=/g,
    `data-modal-scroll="true"
              onWheel={impedirBolhaDoModal}
              onTouchMove={impedirBolhaDoModal}
              className=`
  );

  // Remove o antigo onWheel preventDefault no overlay se existir.
  codigo = codigo.replace(/\s*onWheel=\{\(e\) => e\.preventDefault\(\)\}/g, "");

  // Rodapé sempre acima, com padding bom e shrink-0.
  codigo = codigo.replace(
    /relative z-20 shrink-0 border-t border-gray-200\/80 bg-white\/95\s*p-4 backdrop-blur-xl\s*dark:border-white\/10 dark:bg-gray-950\/95\s*sm:p-5/g,
    `relative z-20 shrink-0 border-t border-gray-200/80 bg-white/95
                p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl
                dark:border-white/10 dark:bg-gray-950/95
                sm:p-5`
  );

  salvar(rel, antes, codigo);
}

console.log("🧪 corrigir_modal_medicamento.cjs");
console.log(`📁 Projeto: ${ROOT}`);
console.log(`🛟 Backup: ${BACKUP_DIR}`);
console.log("");

patchModal();
patchBottomNav();

console.log("");
console.log("Pronto. Agora rode:");
console.log("npm run dev");
console.log("");
console.log("Depois confira:");
console.log('Select-String -Path src\\components\\medicamentos\\ModalMedicamento.jsx -Pattern "corrigir_modal_medicamento|data-modal-scroll|body.style.position|app-overlay-change" -Context 1,2');
console.log('Select-String -Path src\\components\\navigation\\BottomNav.jsx -Pattern "app-overlay-change|motion.nav|overlayAberto" -Context 1,2');
console.log("");
console.log("Se der ruim, backup está em:");
console.log(BACKUP_DIR);
