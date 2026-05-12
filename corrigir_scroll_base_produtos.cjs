const fs = require("fs");
const path = require("path");

const arquivo = path.join(process.cwd(), "src", "pages", "BaseProdutos.jsx");

if (!fs.existsSync(arquivo)) {
  console.error("❌ Não achei src/pages/BaseProdutos.jsx. Rode este script na raiz do projeto.");
  process.exit(1);
}

let codigo = fs.readFileSync(arquivo, "utf8");

function trocar(regex, substituto, nome) {
  if (!regex.test(codigo)) {
    console.warn(`⚠️ Não achei para trocar: ${nome}`);
    return false;
  }

  codigo = codigo.replace(regex, substituto);
  console.log(`✅ ${nome}`);
  return true;
}

const efeitoScroll = `
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
    body.style.top = \`-\${scrollYJanela}px\`;
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
`;

if (!codigo.includes("data-modal-scroll") && !codigo.includes("document.addEventListener(\"wheel\"")) {
  const alvo = `  useEffect(() => {\n    carregarTudo();\n  }, []);\n`;

  if (!codigo.includes(alvo)) {
    console.error("❌ Não achei o useEffect do carregarTudo para inserir a trava.");
    process.exit(1);
  }

  codigo = codigo.replace(alvo, alvo + efeitoScroll);
  console.log("✅ trava de scroll adicionada depois do carregarTudo");
} else {
  console.log("ℹ️ Parece que a trava já existe. Vou reforçar as classes/atributos mesmo assim.");
}

trocar(
  /className="fixed inset-0 z-\[9999\] flex items-end justify-center bg-black\/60 p-4 backdrop-blur-sm md:items-center"/,
  'className="fixed inset-0 z-[9999] flex items-end justify-center overscroll-contain bg-black/60 p-4 backdrop-blur-sm md:items-center"',
  "overlay do modal editar com overscroll-contain"
);

trocar(
  /<motion\.div\n\s*onClick=\{\(e\) => e\.stopPropagation\(\)\}\n\s*initial=\{\{ opacity: 0, y: 24, scale: 0\.96 \}\}/,
  `<motion.div
        data-modal-scroll="true"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}`,
  "data-modal-scroll no painel editar"
);

trocar(
  /className="max-h-\[92dvh\] w-full max-w-lg overflow-y-auto rounded-\[2rem\] border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"/,
  'className="max-h-[92dvh] w-full max-w-lg overscroll-contain overflow-y-auto rounded-[2rem] border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"',
  "painel editar com overscroll-contain"
);

trocar(
  /className="fixed inset-0 z-\[9999\] flex items-center justify-center bg-black\/60 p-4 backdrop-blur-sm"/,
  'className="fixed inset-0 z-[9999] flex items-center justify-center overscroll-contain bg-black/60 p-4 backdrop-blur-sm"',
  "overlay confirmar com overscroll-contain"
);

fs.writeFileSync(arquivo, codigo, "utf8");

console.log("");
console.log("🔥 Pronto. Confere agora com:");
console.log('Select-String -Path src\\pages\\BaseProdutos.jsx -Pattern "data-modal-scroll|app-overlay-change|document.addEventListener|overscroll-contain" -Context 1,2');
console.log("");
console.log("Depois roda: npm run dev");
