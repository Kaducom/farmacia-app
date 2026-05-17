import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "./context/useAuth";

import AppHeader from "./components/navigation/AppHeader";
import BottomNav from "./components/navigation/BottomNav";
import LoadingScreen from "./components/ui/LoadingScreen";
import TelaLogin from "./pages/TelaLogin";

import {
  ADMIN_START_PAGE,
  COMMON_ALLOWED_PAGES,
  COMMON_START_PAGE,
  MENU_PAGES,
  PAGE_TITLES,
} from "./config/pagesConfig";

const Medicamentos = lazy(() => import("./pages/Medicamentos"));
const Receitas = lazy(() => import("./pages/Receitas"));
const Posologia = lazy(() => import("./pages/Posologia"));
const Doutor = lazy(() => import("./pages/Doutor"));
const Menu = lazy(() => import("./pages/Menu"));
const BaseProdutos = lazy(() => import("./pages/BaseProdutos"));
const Mapeamentos = lazy(() => import("./pages/Mapeamentos"));
const Backup = lazy(() => import("./pages/Backup"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));

// =============================
// 🚀 SUBPAGES DO MENU AVISAI
// =============================
const MenuMaster = lazy(() => import("./pages/menu/MenuMaster"));
const MenuAcessos = lazy(() => import("./pages/menu/MenuAcessos"));
const MenuDiagnostico = lazy(() => import("./pages/menu/MenuDiagnostico"));
const MenuProdutosConfig = lazy(() => import("./pages/menu/MenuProdutosConfig"));
const MenuPreferencias = lazy(() => import("./pages/menu/MenuPreferencias"));

const MENU_SUBPAGES = [
  "menuMaster",
  "menuAcessos",
  "menuDiagnostico",
  "menuProdutosConfig",
  "menuPreferencias",
];

const COMMON_EXTRA_ALLOWED_PAGES = [
  "menuProdutosConfig",
  "menuPreferencias",
];

const LOCAL_PAGE_TITLES = {
  menuMaster: "Central Master",
  menuAcessos: "Gerenciar Acessos",
  menuDiagnostico: "Diagnóstico AVISAI",
  menuProdutosConfig: "Configurações de Produtos",
  menuPreferencias: "Preferências",
};

const HEADER_BACK_PAGES = [
  ...MENU_PAGES,
  ...MENU_SUBPAGES,
  "perfil",
];

function App() {
  const { usuarioAtual, loading, isAdmin } = useAuth();

  const [pagina, setPagina] = useState(COMMON_START_PAGE);
  const [overlayAberto, setOverlayAberto] = useState(false);

  const primeiraPaginaDefinida = useRef(false);

  function paginaPermitidaParaComum(nomePagina) {
    return (
      COMMON_ALLOWED_PAGES.includes(nomePagina) ||
      COMMON_EXTRA_ALLOWED_PAGES.includes(nomePagina)
    );
  }

  useEffect(() => {
    function ouvirOverlay(e) {
      const aberto = Boolean(e.detail?.open);

      setOverlayAberto(aberto);
      document.body.classList.toggle("app-overlay-open", aberto);
    }

    window.addEventListener("app-overlay-change", ouvirOverlay);

    return () => {
      window.removeEventListener("app-overlay-change", ouvirOverlay);
      document.body.classList.remove("app-overlay-open");
    };
  }, []);

  useEffect(() => {
    if (!usuarioAtual) {
      setOverlayAberto(false);
      document.body.classList.remove("app-overlay-open");
    }
  }, [usuarioAtual]);

  useEffect(() => {
    if (loading) return;

    if (!usuarioAtual) {
      primeiraPaginaDefinida.current = false;
      setPagina(COMMON_START_PAGE);
      return;
    }

    if (!primeiraPaginaDefinida.current) {
      setPagina(isAdmin ? ADMIN_START_PAGE : COMMON_START_PAGE);
      primeiraPaginaDefinida.current = true;
      return;
    }

    if (!isAdmin && !paginaPermitidaParaComum(pagina)) {
      setPagina(COMMON_START_PAGE);
    }
  }, [loading, usuarioAtual, isAdmin, pagina]);

  if (loading) {
    return <LoadingScreen full text="Carregando sessão..." />;
  }

  if (!usuarioAtual) {
    return <TelaLogin />;
  }

  const mostrarVoltar = HEADER_BACK_PAGES.includes(pagina);

  function limparOverlay() {
    setOverlayAberto(false);
    document.body.classList.remove("app-overlay-open");

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: {
          open: false,
        },
      })
    );
  }

  function irPara(proximaPagina) {
    if (!isAdmin && !paginaPermitidaParaComum(proximaPagina)) {
      limparOverlay();
      setPagina(COMMON_START_PAGE);
      return;
    }

    limparOverlay();
    setPagina(proximaPagina);
  }

  function voltarPagina() {
    limparOverlay();

    if (pagina === "perfil") {
      setPagina("menu");
      return;
    }

    if (MENU_PAGES.includes(pagina) || MENU_SUBPAGES.includes(pagina)) {
      setPagina("menu");
      return;
    }

    setPagina(isAdmin ? ADMIN_START_PAGE : COMMON_START_PAGE);
  }

  function renderPagina() {
    if (!isAdmin && !paginaPermitidaParaComum(pagina)) {
      return <Receitas />;
    }

    switch (pagina) {
      case "medicamentos":
        return isAdmin ? <Medicamentos /> : <Receitas />;

      case "receitas":
        return <Receitas />;

      case "posologia":
        return <Posologia />;

      case "doutor":
        return isAdmin ? <Doutor /> : <Receitas />;

      case "menu":
        return <Menu setPagina={irPara} />;

      case "baseProdutos":
        return isAdmin ? <BaseProdutos /> : <Receitas />;

      case "mapeamentos":
        return isAdmin ? <Mapeamentos /> : <Receitas />;

      case "backup":
        return isAdmin ? <Backup /> : <Receitas />;

      case "perfil":
        return <Perfil />;

      case "notificacoes":
        return isAdmin ? <Notificacoes /> : <Receitas />;

      // =============================
      // 🚀 SUBPAGES DO MENU
      // =============================
      case "menuMaster":
        return isAdmin ? <MenuMaster setPagina={irPara} /> : <Receitas />;

      case "menuAcessos":
        return isAdmin ? <MenuAcessos setPagina={irPara} /> : <Receitas />;

      case "menuDiagnostico":
        return isAdmin ? <MenuDiagnostico setPagina={irPara} /> : <Receitas />;

      case "menuProdutosConfig":
        return <MenuProdutosConfig setPagina={irPara} />;

      case "menuPreferencias":
        return <MenuPreferencias setPagina={irPara} />;

      default:
        return isAdmin ? <Medicamentos /> : <Receitas />;
    }
  }

  const tituloPagina =
    PAGE_TITLES[pagina] || LOCAL_PAGE_TITLES[pagina] || "Avisai";

  return (
    <div className="min-h-[100dvh] bg-gray-100 text-black transition-colors duration-300 dark:bg-[#0f172a] dark:text-white">
      <AnimatePresence mode="wait">
        {!overlayAberto && (
          <motion.div
            key="app-header"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -36 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-[90]"
          >
            <AppHeader
              title={tituloPagina}
              showBack={mostrarVoltar}
              onBack={voltarPagina}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={`
          min-h-[100dvh] overflow-y-auto transition-all duration-300
          ${
            overlayAberto
              ? "pb-4"
              : "pb-[calc(env(safe-area-inset-bottom)+7.5rem)]"
          }
        `}
      >
        <Suspense fallback={<LoadingScreen text="Carregando página..." />}>
          {renderPagina()}
        </Suspense>
      </main>

      <div
        className={`
          fixed inset-x-0 bottom-0 z-[80]
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            overlayAberto
              ? "translate-y-[145%] opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100"
          }
        `}
      >
        <BottomNav
          page={pagina}
          isAdmin={isAdmin}
          onNavigate={irPara}
        />
      </div>
    </div>
  );
}

export default App;