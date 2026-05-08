import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "./context/AuthContext";

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

function App() {
  const {
    usuarioAtual,
    loading,
    isAdmin,
  } = useAuth();

  const [pagina, setPagina] = useState(COMMON_START_PAGE);

  const primeiraPaginaDefinida = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!usuarioAtual) {
      primeiraPaginaDefinida.current = false;
      setPagina(COMMON_START_PAGE);
      return;
    }

    if (!primeiraPaginaDefinida.current) {
      setPagina(
        isAdmin
          ? ADMIN_START_PAGE
          : COMMON_START_PAGE
      );

      primeiraPaginaDefinida.current = true;
      return;
    }

    if (!isAdmin && !COMMON_ALLOWED_PAGES.includes(pagina)) {
      setPagina(COMMON_START_PAGE);
    }
  }, [
    loading,
    usuarioAtual,
    isAdmin,
    pagina,
  ]);

  if (loading) {
    return (
      <LoadingScreen
        full
        text="Carregando sessão..."
      />
    );
  }

  if (!usuarioAtual) {
    return <TelaLogin />;
  }

  const mostrarVoltar = MENU_PAGES.includes(pagina);

  function irPara(proximaPagina) {
    if (
      !isAdmin &&
      !COMMON_ALLOWED_PAGES.includes(proximaPagina)
    ) {
      setPagina(COMMON_START_PAGE);
      return;
    }

    setPagina(proximaPagina);
  }

  function voltarPagina() {
    if (MENU_PAGES.includes(pagina)) {
      setPagina("menu");
      return;
    }

    setPagina(
      isAdmin
        ? ADMIN_START_PAGE
        : COMMON_START_PAGE
    );
  }

  function renderPagina() {
    if (
      !isAdmin &&
      !COMMON_ALLOWED_PAGES.includes(pagina)
    ) {
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

      default:
        return isAdmin ? <Medicamentos /> : <Receitas />;
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-100 text-black transition-colors duration-300 dark:bg-[#0f172a] dark:text-white">
      <AppHeader
        title={PAGE_TITLES[pagina] || "Farmácia App"}
        showBack={mostrarVoltar}
        onBack={voltarPagina}
      />

      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+7.5rem)]">
        <Suspense
          fallback={
            <LoadingScreen text="Carregando página..." />
          }
        >
          {renderPagina()}
        </Suspense>
      </main>

      <BottomNav
        page={pagina}
        isAdmin={isAdmin}
        onNavigate={irPara}
      />
    </div>
  );
}

export default App;