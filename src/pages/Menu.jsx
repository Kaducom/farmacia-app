import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  AlertTriangle,
  Bell,
  BookOpenCheck,
  Boxes,
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  Download,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Moon,
  Package,
  RefreshCcw,
  ScanBarcode,
  Search,
  Settings,
  Shield,
  Skull,
  Sparkles,
  X,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";
import FundoBolhas from "../components/FundoBolhas";
import { firestore } from "../firebase";
import { db } from "../db";

const dashboardInicial = {
  totalMedicamentos: 0,
  totalUnidades: 0,
  vencidos: 0,
  proximos: 0,
  produtosAprendidos: 0,
  mapeamentos: 0,
};

function Menu({ setPagina }) {
  const { theme, toggleTheme } = useTheme();

  const {
    usuarioAtual,
    isAdmin,
    isVisitante,
    logout,
    buscarUsuarioPorId,
    alterarTipoPorId,
  } = useAuth();

  const dark = theme === "dark";
  const toastTimerRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [confirmarSair, setConfirmarSair] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dashboard, setDashboard] = useState(dashboardInicial);

  const [buscaId, setBuscaId] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [buscaAdmin, setBuscaAdmin] = useState("");
  const [carregandoAdmins, setCarregandoAdmins] = useState(false);

  const saudacao = useMemo(() => {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();

    if ((hora >= 5 && hora < 12) || (hora === 12 && minuto === 0)) {
      return "Bom dia";
    }

    if ((hora === 12 && minuto >= 1) || (hora > 12 && hora < 18)) {
      return "Boa tarde";
    }

    return "Boa noite";
  }, []);

  const primeiroNome = usuarioAtual?.nome?.split(" ")?.[0] || "usuário";

  const adminsFiltrados = useMemo(() => {
    const termo = buscaAdmin.trim().toLowerCase();

    if (!termo) return admins;

    return admins.filter((admin) => {
      const nome = String(admin.nome || "").toLowerCase();
      const email = String(admin.email || "").toLowerCase();
      const publicId = String(admin.publicId || "").toLowerCase();

      return (
        nome.includes(termo) ||
        email.includes(termo) ||
        publicId.includes(termo)
      );
    });
  }, [admins, buscaAdmin]);

  const ferramentasAdmin = [
    {
      titulo: "Base Produtos",
      descricao: "Produtos aprendidos",
      icon: ScanBarcode,
      pagina: "baseProdutos",
      destaque: "from-orange-600 to-amber-500",
    },
    {
      titulo: "Mapeamentos",
      descricao: "Histórico de contagens",
      icon: Map,
      pagina: "mapeamentos",
      destaque: "from-slate-700 to-slate-500",
    },
    {
      titulo: "Notificações",
      descricao: "Alertas e lembretes",
      icon: Bell,
      pagina: "notificacoes",
      destaque: "from-pink-600 to-rose-500",
    },
    {
      titulo: "Backup",
      descricao: "Exportar dados",
      icon: Download,
      pagina: "backup",
      destaque: "from-green-700 to-lime-500",
    },
    {
      titulo: "Academia AMSI",
      descricao: "Estudo e treino",
      icon: Brain,
      pagina: "doutor",
      destaque: "from-cyan-700 to-blue-500",
    },
  ];

  useEffect(() => {
    if (isAdmin) {
      carregarDashboard();
      carregarAdmins();
    }
  }, [isAdmin]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
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

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function normalizarData(valor) {
    if (!valor) return null;

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      return valor;
    }

    if (typeof valor === "string") {
      if (valor.includes("-")) {
        const [ano, mes, dia] = valor.split("-").map(Number);
        return new Date(ano, mes - 1, dia);
      }

      if (valor.includes("/")) {
        const [dia, mes, ano] = valor.split("/").map(Number);
        return new Date(ano, mes - 1, dia);
      }
    }

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  function diferencaEmDias(dataFinal, dataInicial) {
    const umDia = 1000 * 60 * 60 * 24;

    const inicio = new Date(dataInicial);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(dataFinal);
    fim.setHours(0, 0, 0, 0);

    return Math.ceil((fim - inicio) / umDia);
  }

  async function carregarDashboard() {
    try {
      setCarregando(true);

      const [medicamentos, produtosAprendidos, mapeamentos] =
        await Promise.all([
          db.medicamentos.toArray(),
          db.produtosCodigo.count(),
          db.mapeamentos.count(),
        ]);

      const hoje = new Date();

      const totalUnidades = medicamentos.reduce((total, item) => {
        return total + Number(item.quantidade || 1);
      }, 0);

      let vencidos = 0;
      let proximos = 0;

      medicamentos.forEach((item) => {
        const validade = normalizarData(item.validade);

        if (!validade) return;

        const dias = diferencaEmDias(validade, hoje);

        const diasPreVencido = Number(item.diasPre || item.diasPreVencido || 30);
        const diasRemover = Number(item.diasRemover || 7);
        const limiteAlerta = Math.max(diasPreVencido, diasRemover);

        if (dias < 0) {
          vencidos += 1;
          return;
        }

        if (dias <= limiteAlerta) {
          proximos += 1;
        }
      });

      setDashboard({
        totalMedicamentos: medicamentos.length,
        totalUnidades,
        vencidos,
        proximos,
        produtosAprendidos,
        mapeamentos,
      });
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar dashboard 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarAdmins() {
    if (!isAdmin) return;

    try {
      setCarregandoAdmins(true);

      const q = query(
        collection(firestore, "usuarios"),
        where("tipo", "==", "admin")
      );

      const snap = await getDocs(q);

      const lista = snap.docs
        .map((docSnap) => ({
          uid: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a, b) =>
          String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
        );

      setAdmins(lista);
    } catch (err) {
      console.error(err);
      mostrarToast("Não consegui carregar os admins 😕", "erro");
    } finally {
      setCarregandoAdmins(false);
    }
  }

  async function buscarPorId() {
    if (!buscaId.trim()) {
      mostrarToast("Digite um ID 😅", "erro");
      return;
    }

    try {
      setLoadingBusca(true);

      const res = await buscarUsuarioPorId(buscaId.trim());

      if (!res.ok) {
        mostrarToast(res.erro, "erro");
        setUsuarioEncontrado(null);
        return;
      }

      setUsuarioEncontrado(res.usuario);
      mostrarToast("Usuário encontrado 🔍", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao buscar usuário", "erro");
    } finally {
      setLoadingBusca(false);
    }
  }

  async function alterarPermissao(tipo) {
    if (!usuarioEncontrado) return;

    const res = await alterarTipoPorId(usuarioEncontrado.publicId, tipo);

    if (!res.ok) {
      mostrarToast(res.erro, "erro");
      return;
    }

    setUsuarioEncontrado(res.usuario);

    mostrarToast(
      tipo === "admin" ? "Usuário promovido 👑" : "Usuário rebaixado 👤",
      "ok"
    );

    carregarAdmins();
  }

  async function copiarTexto(texto, label = "Texto") {
    if (!texto) {
      mostrarToast("Nada para copiar 😅", "erro");
      return;
    }

    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast(`${label} copiado 📋`, "ok");
    } catch {
      mostrarToast("Não foi possível copiar", "erro");
    }
  }

  async function confirmarLogout() {
    setConfirmarSair(false);
    await logout();
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
        <MenuHero
          saudacao={saudacao}
          primeiroNome={primeiroNome}
          usuarioAtual={usuarioAtual}
          isAdmin={isAdmin}
          isVisitante={isVisitante}
          dashboard={dashboard}
          onPerfil={() => setPagina("perfil")}
          onLogout={() => setConfirmarSair(true)}
          onCopyId={() => copiarTexto(usuarioAtual?.publicId, "ID")}
        />

        {isAdmin && (
          <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
            <SectionTitle
              icon={Crown}
              title="Ferramentas Master"
              description="Recursos administrativos fora da barra inferior"
            />

            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
              {ferramentasAdmin.map((acao) => (
                <ActionCard
                  key={acao.pagina}
                  {...acao}
                  compact
                  onClick={() => setPagina(acao.pagina)}
                />
              ))}
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionTitle
                icon={LayoutDashboard}
                title="Painel do estoque"
                description="Leitura rápida dos dados locais deste aparelho"
                noMargin
              />

              <button
                type="button"
                onClick={carregarDashboard}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg shadow-emerald-700/20 transition active:scale-95 sm:h-14 sm:w-14"
                aria-label="Atualizar dashboard"
              >
                {carregando ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <RefreshCcw size={24} />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-6">
              <MetricPremium
                icon={Package}
                titulo="Itens"
                valor={dashboard.totalMedicamentos}
                descricao="cadastrados"
              />

              <MetricPremium
                icon={Boxes}
                titulo="Unidades"
                valor={dashboard.totalUnidades}
                descricao="no total"
              />

              <MetricPremium
                icon={Skull}
                titulo="Vencidos"
                valor={dashboard.vencidos}
                descricao="atenção"
                alerta={dashboard.vencidos > 0}
              />

              <MetricPremium
                icon={CalendarClock}
                titulo="Próximos"
                valor={dashboard.proximos}
                descricao="alerta"
                aviso={dashboard.proximos > 0}
              />

              <MetricPremium
                icon={BookOpenCheck}
                titulo="Base"
                valor={dashboard.produtosAprendidos}
                descricao="scanner"
              />

              <MetricPremium
                icon={History}
                titulo="Mapas"
                valor={dashboard.mapeamentos}
                descricao="históricos"
              />
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
              <SectionTitle
                icon={Shield}
                title="Gerenciar acessos"
                description="Busque pelo ID público para editar a permissão"
              />

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={buscaId}
                    onChange={(e) => setBuscaId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        buscarPorId();
                      }
                    }}
                    placeholder="ID do usuário"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <button
                  type="button"
                  onClick={buscarPorId}
                  disabled={loadingBusca}
                  className="h-12 rounded-2xl bg-emerald-700 px-5 font-bold text-white shadow-lg shadow-emerald-700/15 transition active:scale-95 disabled:opacity-60"
                >
                  {loadingBusca ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </button>
              </div>

              {usuarioEncontrado ? (
                <UsuarioEncontrado
                  usuario={usuarioEncontrado}
                  onAdmin={() => alterarPermissao("admin")}
                  onComum={() => alterarPermissao("comum")}
                  onCopyId={() => copiarTexto(usuarioEncontrado.publicId, "ID")}
                />
              ) : (
                <EmptySearch />
              )}
            </div>

            <AreaMaster
              admins={adminsFiltrados}
              totalAdmins={admins.length}
              buscaAdmin={buscaAdmin}
              setBuscaAdmin={setBuscaAdmin}
              carregandoAdmins={carregandoAdmins}
              onRefresh={carregarAdmins}
              onCopyId={(id) => copiarTexto(id, "ID")}
            />
          </section>
        )}

        <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
          <SectionTitle
            icon={Settings}
            title="Preferências"
            description="Ajustes rápidos do visual"
          />

          <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-white dark:bg-white/10">
                  <Moon size={21} />
                </div>

                <div className="min-w-0">
                  <p className="font-black">Modo Escuro</p>

                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {dark ? "Visual noturno ativo" : "Visual claro ativo"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-8 w-16 shrink-0 items-center rounded-full px-1 transition-all ${
                  dark ? "justify-end bg-green-500" : "justify-start bg-gray-400"
                }`}
                aria-label="Alternar tema"
              >
                <div className="h-6 w-6 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MenuHero({
  saudacao,
  primeiroNome,
  usuarioAtual,
  isAdmin,
  isVisitante,
  dashboard,
  onPerfil,
  onLogout,
  onCopyId,
}) {
  const subtitulo = isVisitante
    ? "Acesso rápido sem conta"
    : usuarioAtual?.email || "Conta ativa";

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-4 text-white shadow-2xl shadow-emerald-950/30 md:p-5">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-300/10" />
      <div className="absolute right-28 top-24 h-10 w-10 rounded-full bg-white/10 blur-sm" />
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
                {subtitulo}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip>{isVisitante ? "✨ Visitante" : "Conta ativa"}</Chip>

                {usuarioAtual?.publicId && !isVisitante && (
                  <button
                    type="button"
                    onClick={onCopyId}
                    className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm transition active:scale-95"
                  >
                    ID: {usuarioAtual.publicId}
                  </button>
                )}

                {isAdmin && <Chip>👑 Painel master</Chip>}
                {!isAdmin && <Chip>Receitas + Posologia</Chip>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
            <button
              type="button"
              onClick={onPerfil}
              className="
                flex h-12 items-center justify-center rounded-2xl bg-white
                text-sm font-black text-green-800 shadow-lg transition
                hover:bg-emerald-50 active:scale-95
              "
            >
              Meu perfil
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="
                flex h-12 items-center justify-center gap-2 rounded-2xl
                border border-white/20 bg-red-500/20 text-sm font-black
                text-white backdrop-blur-sm transition hover:bg-red-500/30
                active:scale-95
              "
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
            <HeroMiniStat
              label={isAdmin ? "Itens" : "Receitas"}
              value={isAdmin ? dashboard.totalMedicamentos : "Livre"}
              detail={isAdmin ? "estoque" : "sem conta"}
            />

            <HeroMiniStat
              label={isAdmin ? "Alertas" : "Posologia"}
              value={isAdmin ? dashboard.proximos : "Livre"}
              detail={isAdmin ? "próximos" : "uso rápido"}
            />
          </div>

          {!isAdmin && (
            <p className="mt-3 rounded-2xl bg-black/15 p-3 text-xs font-semibold text-emerald-100/90">
              Use as ferramentas principais sem burocracia. Para nuvem e permissões, crie uma conta.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroAvatar({ usuarioAtual, nome }) {
  const foto = usuarioAtual?.fotoPerfil;

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.45rem] border border-white/20 bg-white/15 shadow-xl backdrop-blur-md sm:h-20 sm:w-20 sm:rounded-[1.7rem]">
      {foto ? (
        <img
          src={foto}
          alt={nome || "Usuário"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-2xl font-black text-white sm:text-3xl">
          {obterIniciais(nome)}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description, noMargin = false }) {
  return (
    <div className={noMargin ? "" : "mb-3"}>
      <h2 className="flex items-center gap-2 text-lg font-black sm:text-xl">
        <Icon size={21} />
        {title}
      </h2>

      <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
        {description}
      </p>
    </div>
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

function ActionCard({
  icon: Icon,
  titulo,
  descricao,
  destaque,
  onClick,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-[1.45rem] border border-gray-200
        bg-gray-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5
        hover:shadow-xl active:scale-[0.98]
        dark:border-white/10 dark:bg-white/5 sm:rounded-[1.7rem] sm:p-4
        ${compact ? "min-h-[128px]" : "min-h-[136px]"}
      `}
    >
      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${destaque} opacity-20 blur-xl transition group-hover:opacity-35`}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${destaque} text-white shadow-lg sm:h-14 sm:w-14`}
        >
          <Icon size={compact ? 22 : 24} />
        </div>

        <ChevronRight
          size={18}
          className="text-gray-400 transition group-hover:translate-x-1"
        />
      </div>

      <div className="relative mt-3">
        <p className="text-sm font-black sm:text-base">{titulo}</p>
        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {descricao}
        </p>
      </div>
    </button>
  );
}

function MetricPremium({
  icon: Icon,
  titulo,
  valor,
  descricao,
  alerta = false,
  aviso = false,
}) {
  const destaque = alerta
    ? "text-red-500"
    : aviso
    ? "text-amber-500"
    : "text-emerald-600 dark:text-emerald-300";

  const bg = alerta
    ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
    : aviso
    ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
    : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5";

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${bg}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 sm:text-xs">
          {titulo}
        </p>

        <Icon size={17} className={destaque} />
      </div>

      <p className={`text-2xl font-black sm:text-3xl ${destaque}`}>{valor}</p>

      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
        {descricao}
      </p>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="mt-4 rounded-3xl border border-dashed border-gray-300 bg-gray-50/80 p-5 text-center dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
        <Search size={22} />
      </div>

      <p className="font-black">Nenhum usuário selecionado</p>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Digite o ID público para abrir o cartão de permissão.
      </p>
    </div>
  );
}

function UsuarioEncontrado({ usuario, onAdmin, onComum, onCopyId }) {
  return (
    <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-black">{usuario.nome}</p>

          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {usuario.email || "Email não informado"}
          </p>

          <button
            type="button"
            onClick={onCopyId}
            className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-300"
          >
            ID: {usuario.publicId}
            <Copy size={14} />
          </button>
        </div>

        <CargoBadge tipo={usuario.tipo} />
      </div>

      {(usuario.permissaoAtualizadaPor || usuario.criadoPor) && (
        <div className="mt-4 rounded-2xl bg-black/5 p-3 text-sm dark:bg-white/5">
          <p>
            👤 Última alteração por:
            <span className="font-bold">
              {" "}
              {usuario.permissaoAtualizadaPor || usuario.criadoPor}
            </span>
          </p>

          {usuario.permissaoAtualizadaEm && (
            <p className="mt-1 text-xs text-gray-500">
              {new Date(usuario.permissaoAtualizadaEm).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onAdmin}
          className="rounded-2xl bg-yellow-500 py-3 text-sm font-black text-black transition active:scale-95 sm:text-base"
        >
          👑 Admin
        </button>

        <button
          type="button"
          onClick={onComum}
          className="rounded-2xl bg-blue-600 py-3 text-sm font-black text-white transition active:scale-95 sm:text-base"
        >
          👤 Comum
        </button>
      </div>
    </div>
  );
}

function AreaMaster({
  admins,
  totalAdmins,
  buscaAdmin,
  setBuscaAdmin,
  carregandoAdmins,
  onRefresh,
  onCopyId,
}) {
  return (
    <div className="rounded-[1.8rem] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-4 text-white shadow-2xl shadow-emerald-950/20 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 sm:h-12 sm:w-12">
            <Crown size={23} />
          </div>

          <p className="text-2xl font-black">Área Master</p>

          <p className="mt-1 text-sm text-emerald-100">
            {buscaAdmin.trim()
              ? `${admins.length} de ${totalAdmins} admins`
              : totalAdmins === 1
              ? "1 administrador ativo"
              : `${totalAdmins} administradores ativos`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 transition active:scale-95"
          aria-label="Atualizar admins"
        >
          {carregandoAdmins ? (
            <Loader2 size={21} className="animate-spin" />
          ) : (
            <RefreshCcw size={21} />
          )}
        </button>
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/70"
        />

        <input
          value={buscaAdmin}
          onChange={(e) => setBuscaAdmin(e.target.value)}
          placeholder="Buscar nome, email ou ID"
          className="
            h-12 w-full rounded-2xl border border-white/10 bg-black/20
            py-3 pl-11 pr-4 font-semibold text-white outline-none
            placeholder:text-emerald-100/50
            focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10
          "
        />
      </div>

      <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
        {admins.length === 0 && !carregandoAdmins && (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-100">
            {buscaAdmin.trim()
              ? "Nenhum admin encontrado nessa busca."
              : "Nenhum admin encontrado ainda."}
          </div>
        )}

        {carregandoAdmins && (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-100">
            Carregando administradores...
          </div>
        )}

        {admins.map((admin) => (
          <AdminRow
            key={admin.uid || admin.publicId}
            admin={admin}
            onCopyId={() => onCopyId(admin.publicId)}
          />
        ))}
      </div>
    </div>
  );
}

function AdminRow({ admin, onCopyId }) {
  const nome = admin.nome || "Admin sem nome";
  const inicial = nome.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-sm transition hover:bg-white/15">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-emerald-800 shadow-md">
          {inicial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-black">{nome}</p>

            <span className="shrink-0 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-black">
              Admin
            </span>
          </div>

          <p className="truncate text-xs text-emerald-100/80">
            {admin.email || "Email não informado"}
          </p>

          <button
            type="button"
            onClick={onCopyId}
            className="mt-1 flex max-w-full items-center gap-1 text-xs font-bold text-emerald-100/90 transition hover:text-white active:scale-95"
          >
            <span className="truncate">ID: {admin.publicId || "sem ID"}</span>

            <Copy size={12} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CargoBadge({ tipo }) {
  const admin = tipo === "admin";

  return (
    <span
      className={`
        rounded-full px-3 py-1 text-xs font-black
        ${admin ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"}
      `}
    >
      {admin ? "Admin" : "Comum"}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
      {children}
    </span>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="
        fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)]
        z-[99999] flex justify-center px-3
        pointer-events-none
      "
    >
      <div
        className={`
          pointer-events-auto flex w-full max-w-[calc(100vw-1.5rem)] items-center gap-3
          rounded-3xl border p-4 shadow-2xl backdrop-blur-xl sm:max-w-md
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : info
              ? "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${
            erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="min-w-0 flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
          aria-label="Fechar aviso"
        >
          <X size={17} />
        </button>
      </div>
    </motion.div>
  );
}

function ModalConfirmarSair({ isVisitante, onCancel, onConfirm }) {
  return (
    <motion.div
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[2147483647] flex items-center justify-center
        bg-slate-950/75 p-4 backdrop-blur-md
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 22, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="
          w-full max-w-sm rounded-[2rem] border border-white/10
          bg-white p-6 text-gray-950 shadow-2xl dark:bg-gray-950 dark:text-white
        "
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-600/25">
          <LogOut size={30} />
        </div>

        <h2 className="text-center text-xl font-black">Sair da conta?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {isVisitante
            ? "Você vai sair do modo visitante e voltar para a tela inicial."
            : "Sua sessão será encerrada e o app voltará para a tela de login."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              h-12 rounded-2xl bg-gray-100 font-black text-gray-700
              transition active:scale-95 dark:bg-white/10 dark:text-white
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="
              flex h-12 items-center justify-center gap-2 rounded-2xl
              bg-red-600 font-black text-white shadow-lg shadow-red-600/20
              transition hover:bg-red-700 active:scale-95
            "
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function obterIniciais(nome) {
  const partes = String(nome || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) return "U";

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export default Menu;