import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Bell,
  BookOpenCheck,
  Boxes,
  Brain,
  ChevronRight,
  Crown,
  Download,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  Package,
  RefreshCcw,
  ScanBarcode,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Tags,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";
import FundoBolhas from "../components/FundoBolhas";
import { db } from "../db";
import {
  HeroAvatar,
  ModalConfirmarSair,
  Toast,
  obterIniciais,
} from "./menu/components/MenuShared";

const dashboardInicial = {
  totalMedicamentos: 0,
  totalUnidades: 0,
  vencidos: 0,
  proximos: 0,
  produtosAprendidos: 0,
  mapeamentos: 0,
};

function Menu({ setPagina }) {
  const { theme } = useTheme();
  const { usuarioAtual, isAdmin, isVisitante, logout } = useAuth();
  const toastTimerRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [confirmarSair, setConfirmarSair] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dashboard, setDashboard] = useState(dashboardInicial);

  const primeiroNome = usuarioAtual?.nome?.split(" ")?.[0] || "usuário";
  const dark = theme === "dark";

  const saudacao = useMemo(() => {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();

    if ((hora >= 5 && hora < 12) || (hora === 12 && minuto === 0)) return "Bom dia";
    if ((hora === 12 && minuto >= 1) || (hora > 12 && hora < 18)) return "Boa tarde";
    return "Boa noite";
  }, []);

  const cardsPrincipais = useMemo(() => {
    const base = [
      {
        titulo: "Configurações de Produtos",
        descricao: "Setor principal, pré-vencimento, retirada e fotos.",
        icon: SlidersHorizontal,
        pagina: "menuProdutosConfig",
        destaque: "from-emerald-700 to-lime-500",
        admin: false,
      },
      {
        titulo: "Diagnóstico AVISAI",
        descricao: "Locais, nuvem, pendentes, vencidos e etiquetas.",
        icon: LayoutDashboard,
        pagina: "menuDiagnostico",
        destaque: "from-cyan-700 to-blue-500",
        admin: false,
      },
      {
        titulo: "Preferências",
        descricao: `Visual ${dark ? "escuro" : "claro"}, tema e ajustes rápidos.`,
        icon: Settings,
        pagina: "menuPreferencias",
        destaque: "from-slate-800 to-slate-500",
        admin: false,
      },
    ];

    if (!isAdmin) return base;

    return [
      {
        titulo: "Central Master",
        descricao: "Ferramentas administrativas fora da barra inferior.",
        icon: Crown,
        pagina: "menuMaster",
        destaque: "from-amber-500 to-yellow-300",
        admin: true,
      },
      {
        titulo: "Gerenciar Acessos",
        descricao: "Buscar ID, promover admin e revisar permissões.",
        icon: Shield,
        pagina: "menuAcessos",
        destaque: "from-violet-700 to-fuchsia-500",
        admin: true,
      },
      ...base,
    ];
  }, [dark, isAdmin]);

  useEffect(() => {
    carregarResumo();
  }, [isAdmin]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: confirmarSair },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );
    };
  }, [confirmarSair]);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function carregarResumo() {
    try {
      setCarregando(true);

      const [medicamentos, produtosAprendidos, mapeamentos] = await Promise.all([
        db.medicamentos.toArray(),
        db.produtosCodigo.count(),
        db.mapeamentos.count(),
      ]);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const totalUnidades = medicamentos.reduce(
        (total, item) => total + Number(item.quantidade || 1),
        0
      );

      let vencidos = 0;
      let proximos = 0;

      medicamentos.forEach((item) => {
        const validade = normalizarData(item.validade);
        if (!validade) return;

        validade.setHours(0, 0, 0, 0);
        const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
        const limite = Math.max(
          Number(item.diasPre || item.diasPreVencido || 30),
          Number(item.diasRemover || 7)
        );

        if (dias < 0) vencidos += 1;
        else if (dias <= limite) proximos += 1;
      });

      setDashboard({
        totalMedicamentos: medicamentos.filter((m) => !m.deletado && !m.excluido).length,
        totalUnidades,
        vencidos,
        proximos,
        produtosAprendidos,
        mapeamentos,
      });
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar resumo 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarLogout() {
    setConfirmarSair(false);
    await logout();
  }

  async function copiarId() {
    const id = usuarioAtual?.publicId;

    if (!id) {
      mostrarToast("ID ainda não disponível 😅", "erro");
      return;
    }

    try {
      await navigator.clipboard.writeText(id);
      mostrarToast("ID copiado 📋", "ok");
    } catch {
      mostrarToast("Não foi possível copiar", "erro");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarSair && (
          <ModalConfirmarSair
            isVisitante={isVisitante}
            onCancel={() => setConfirmarSair(false)}
            onConfirm={confirmarLogout}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 pb-32 text-gray-950 dark:text-white">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-4 text-white shadow-2xl shadow-emerald-950/30 md:p-5">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-300/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%)]" />

          <div className="relative grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <div className="flex flex-col justify-between gap-5">
              <div className="flex items-start gap-3">
                <HeroAvatar usuarioAtual={usuarioAtual} nome={primeiroNome} />

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                    {saudacao}
                  </p>

                  <h1 className="mt-1 truncate text-3xl font-black md:text-4xl">
                    {primeiroNome}
                  </h1>

                  <p className="mt-1 truncate text-sm text-emerald-100">
                    {isVisitante ? "Acesso rápido sem conta" : usuarioAtual?.email || "Conta ativa"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip>{isVisitante ? "✨ Visitante" : "Conta ativa"}</Chip>
                    {isAdmin && <Chip>👑 Master</Chip>}
                    {!isAdmin && <Chip>Controle de produtos</Chip>}

                    {usuarioAtual?.publicId && !isVisitante && (
                      <button
                        type="button"
                        onClick={copiarId}
                        className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm transition active:scale-95"
                      >
                        ID: {usuarioAtual.publicId}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
                <button
                  type="button"
                  onClick={() => setPagina("perfil")}
                  className="flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-black text-green-800 shadow-lg transition hover:bg-emerald-50 active:scale-95"
                >
                  Meu perfil
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmarSair(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-red-500/20 text-sm font-black text-white backdrop-blur-sm transition hover:bg-red-500/30 active:scale-95"
                >
                  <LogOut size={17} />
                  Sair
                </button>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-3 backdrop-blur-xl sm:p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-emerald-100">
                <Sparkles size={15} />
                Resumo rápido
              </p>

              <div className="grid grid-cols-2 gap-2">
                <HeroMiniStat label="Produtos" value={dashboard.totalMedicamentos} detail="cadastrados" />
                <HeroMiniStat label="Alertas" value={dashboard.proximos} detail="pré/retirada" />
                <HeroMiniStat label="Unidades" value={dashboard.totalUnidades} detail="no aparelho" />
                <HeroMiniStat label="Vencidos" value={dashboard.vencidos} detail="atenção" />
              </div>

              <button
                type="button"
                onClick={carregarResumo}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-black/15 text-sm font-black text-emerald-100 transition active:scale-95"
              >
                <RefreshCcw size={17} className={carregando ? "animate-spin" : ""} />
                Atualizar resumo
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Package size={22} />
                Central AVISAI
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Menu limpo, subpáginas fortes. Agora cada área respira melhor no celular.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cardsPrincipais.map((card) => (
              <MenuCard
                key={card.pagina}
                {...card}
                onClick={() => setPagina(card.pagina)}
              />
            ))}
          </div>
        </section>

        {isAdmin && (
          <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Crown size={22} />
              Atalhos Master
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Entradas rápidas para as telas administrativas antigas.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
              <MiniTool icon={ScanBarcode} titulo="Base" pagina="baseProdutos" setPagina={setPagina} />
              <MiniTool icon={Map} titulo="Mapas" pagina="mapeamentos" setPagina={setPagina} />
              <MiniTool icon={Bell} titulo="Alertas" pagina="notificacoes" setPagina={setPagina} />
              <MiniTool icon={Download} titulo="Backup" pagina="backup" setPagina={setPagina} />
              <MiniTool icon={Brain} titulo="AMSI" pagina="doutor" setPagina={setPagina} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function normalizarData(valor) {
  if (!valor) return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;

  const texto = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

function MenuCard({ icon: Icon, titulo, descricao, destaque, admin, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[150px] overflow-hidden rounded-[1.65rem] border border-gray-200 bg-gray-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] dark:border-white/10 dark:bg-white/5"
    >
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${destaque} opacity-20 blur-xl transition group-hover:opacity-35`} />

      <div className="relative flex items-center justify-between gap-3">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${destaque} text-white shadow-lg`}>
          <Icon size={25} />
        </div>

        <ChevronRight size={19} className="text-gray-400 transition group-hover:translate-x-1" />
      </div>

      <div className="relative mt-4">
        <div className="flex items-center gap-2">
          <p className="text-base font-black">{titulo}</p>
          {admin && (
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-black">
              admin
            </span>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {descricao}
        </p>
      </div>
    </button>
  );
}

function MiniTool({ icon: Icon, titulo, pagina, setPagina }) {
  return (
    <button
      type="button"
      onClick={() => setPagina(pagina)}
      className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 bg-gray-50 p-3 text-center transition active:scale-95 dark:border-white/10 dark:bg-white/5"
    >
      <Icon size={22} className="text-emerald-600 dark:text-emerald-300" />
      <span className="text-xs font-black">{titulo}</span>
    </button>
  );
}

function HeroMiniStat({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <p className="text-[11px] font-bold text-emerald-100">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-xs text-emerald-100/80">{detail}</p>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
      {children}
    </span>
  );
}

export default Menu;
