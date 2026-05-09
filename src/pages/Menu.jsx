import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  Bell,
  BookOpenCheck,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Cloud,
  CloudOff,
  Crown,
  Download,
  FileText,
  HardDrive,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Moon,
  Package,
  Pill,
  RefreshCcw,
  ScanBarcode,
  Search,
  Settings,
  Shield,
  Skull,
  Sparkles,
  Stethoscope,
  Syringe,
  User,
  Wrench,
  X,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import FundoBolhas from "../components/FundoBolhas";
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
  const [carregando, setCarregando] = useState(false);
  const [dashboard, setDashboard] = useState(dashboardInicial);

  const [buscaId, setBuscaId] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const primeiroNome =
    usuarioAtual?.nome?.split(" ")?.[0] || "usuário";

  useEffect(() => {
    if (isAdmin) {
      carregarDashboard();
    }
  }, [isAdmin]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({
      msg,
      tipo,
    });

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

      const [
        medicamentos,
        produtosAprendidos,
        mapeamentos,
      ] = await Promise.all([
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

        const diasPreVencido = Number(
          item.diasPre || item.diasPreVencido || 30
        );

        const diasRemover = Number(
          item.diasRemover || 7
        );

        const limiteAlerta = Math.max(
          diasPreVencido,
          diasRemover
        );

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

  async function buscarPorId() {
    if (!buscaId.trim()) {
      mostrarToast("Digite um ID 😅", "erro");
      return;
    }

    try {
      setLoadingBusca(true);

      const res = await buscarUsuarioPorId(
        buscaId.trim()
      );

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

    const res = await alterarTipoPorId(
      usuarioEncontrado.publicId,
      tipo
    );

    if (!res.ok) {
      mostrarToast(res.erro, "erro");
      return;
    }

    setUsuarioEncontrado(res.usuario);

    mostrarToast(
      tipo === "admin"
        ? "Usuário promovido 👑"
        : "Usuário rebaixado 👤",
      "ok"
    );
  }

  const acoesPrincipais = [
    {
      titulo: "Receitas",
      descricao: "Consultar validade",
      icon: FileText,
      pagina: "receitas",
      destaque: "from-blue-600 to-cyan-500",
    },
    {
      titulo: "Posologia",
      descricao: "Calcular tratamento",
      icon: Syringe,
      pagina: "posologia",
      destaque: "from-emerald-600 to-green-500",
    },
    {
      titulo: "Perfil",
      descricao: "Conta e ID público",
      icon: User,
      pagina: "perfil",
      destaque: "from-violet-600 to-fuchsia-500",
    },
  ];

  const acoesAdmin = [
    {
      titulo: "Medicamentos",
      descricao: "Controle do estoque",
      icon: Pill,
      pagina: "medicamentos",
      destaque: "from-emerald-700 to-teal-500",
    },
    {
      titulo: "Doutor",
      descricao: "Estudo e balcão",
      icon: Stethoscope,
      pagina: "doutor",
      destaque: "from-indigo-700 to-blue-500",
    },
    {
      titulo: "Base Produtos",
      descricao: "Scanner aprendido",
      icon: ScanBarcode,
      pagina: "baseProdutos",
      destaque: "from-orange-600 to-amber-500",
    },
    {
      titulo: "Mapeamentos",
      descricao: "Histórico salvo",
      icon: Map,
      pagina: "mapeamentos",
      destaque: "from-slate-700 to-slate-500",
    },
    {
      titulo: "Notificações",
      descricao: "Alertas do app",
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
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      {toast && (
        <Toast
          toast={toast}
          fechar={() => setToast(null)}
        />
      )}

      <div className="relative z-10 mx-auto max-w-6xl space-y-5 p-4 pb-32 text-black dark:text-white">
        <MenuHero
          saudacao={saudacao}
          primeiroNome={primeiroNome}
          usuarioAtual={usuarioAtual}
          isAdmin={isAdmin}
          isVisitante={isVisitante}
          dashboard={dashboard}
          onPerfil={() => setPagina("perfil")}
          onLogout={logout}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatusPremium
            icon={isVisitante ? CloudOff : Cloud}
            titulo="Acesso"
            valor={isVisitante ? "Visitante" : "Firebase"}
            descricao={
              isVisitante
                ? "Modo local de teste"
                : "Login real ativo"
            }
            status={isVisitante ? "Local" : "Online"}
            variante={isVisitante ? "amber" : "emerald"}
          />

          <StatusPremium
            icon={HardDrive}
            titulo="Banco local"
            valor="IndexedDB"
            descricao="Dados rápidos no aparelho"
            status="Ativo"
            variante="blue"
          />

          <StatusPremium
            icon={Wrench}
            titulo="Próxima fase"
            valor="Sync"
            descricao="Estoque integrado à nuvem"
            status="Planejado"
            variante="purple"
          />
        </section>

        <section className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xl font-black">
                <Sparkles size={22} />
                Atalhos premium
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                As ferramentas mais usadas em um toque
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {acoesPrincipais.map((acao) => (
              <ActionCard
                key={acao.pagina}
                {...acao}
                onClick={() => setPagina(acao.pagina)}
              />
            ))}

            {isAdmin &&
              acoesAdmin.map((acao) => (
                <ActionCard
                  key={acao.pagina}
                  {...acao}
                  onClick={() => setPagina(acao.pagina)}
                />
              ))}
          </div>
        </section>

        {isAdmin && (
          <section className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <LayoutDashboard size={22} />
                  Painel do estoque
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Leitura rápida dos dados locais deste aparelho
                </p>
              </div>

              <button
                type="button"
                onClick={carregarDashboard}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg shadow-emerald-700/20 transition active:scale-95"
                aria-label="Atualizar dashboard"
              >
                {carregando ? (
                  <Loader2 size={25} className="animate-spin" />
                ) : (
                  <RefreshCcw size={25} />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
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
                descricao="vencer/remover"
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
          <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Shield size={22} />
                  Central de acessos
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Promova ou rebaixe usuários usando o ID público
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
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
                    placeholder="Digite o ID do usuário"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>

                <button
                  type="button"
                  onClick={buscarPorId}
                  disabled={loadingBusca}
                  className="rounded-2xl bg-emerald-700 px-5 font-bold text-white shadow-lg shadow-emerald-700/15 transition active:scale-95 disabled:opacity-60"
                >
                  {loadingBusca ? "..." : "Buscar"}
                </button>
              </div>

              {usuarioEncontrado ? (
                <UsuarioEncontrado
                  usuario={usuarioEncontrado}
                  onAdmin={() => alterarPermissao("admin")}
                  onComum={() => alterarPermissao("comum")}
                />
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-gray-300 bg-gray-50/80 p-5 text-center dark:border-gray-700 dark:bg-gray-900/60">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                    <Search size={22} />
                  </div>

                  <p className="font-black">
                    Nenhum usuário selecionado
                  </p>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Digite o ID público para abrir o cartão de permissão.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-5 text-white shadow-2xl shadow-emerald-950/20">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Crown size={24} />
                  </div>

                  <p className="text-2xl font-black">
                    Área Master
                  </p>

                  <p className="mt-2 text-sm text-emerald-100">
                    Seu painel de comando para permissões, estoque, scanner,
                    backup e evolução para nuvem.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniAdminStat
                    label="Acesso"
                    value="Total"
                  />

                  <MiniAdminStat
                    label="Perfil"
                    value="Admin"
                  />

                  <MiniAdminStat
                    label="Dados"
                    value="Local"
                  />

                  <MiniAdminStat
                    label="Sync"
                    value="Próx."
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Settings size={22} />
              Preferências
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajustes rápidos da conta e do visual
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <PreferenceCard
              icon={User}
              titulo="Perfil"
              descricao="Ver dados, ID público e conta"
              onClick={() => setPagina("perfil")}
            />

            <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-800 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white dark:bg-white/10">
                  <Moon size={21} />
                </div>

                <div>
                  <p className="font-black">
                    Modo Escuro
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dark ? "Visual noturno ativo" : "Visual claro ativo"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-8 w-16 items-center rounded-full px-1 transition-all ${
                  dark
                    ? "justify-end bg-green-500"
                    : "justify-start bg-gray-400"
                }`}
                aria-label="Alternar tema"
              >
                <div className="h-6 w-6 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {isAdmin && (
              <PreferenceCard
                icon={Shield}
                titulo="Privacidade local"
                descricao="Status atual da nuvem e banco local"
                onClick={() =>
                  mostrarToast(
                    "Login já está na nuvem. Dados do estoque ainda serão migrados 🛡️",
                    "info"
                  )
                }
              />
            )}

            <PreferenceCard
              icon={LogOut}
              titulo="Sair"
              descricao="Encerrar sessão neste aparelho"
              danger
              onClick={logout}
            />
          </div>
        </section>

        <FooterStatus
          isAdmin={isAdmin}
          isVisitante={isVisitante}
        />
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
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-5 text-white shadow-2xl shadow-emerald-950/30 md:p-6">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-300/10" />
      <div className="absolute right-28 top-24 h-10 w-10 rounded-full bg-white/10 blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%)]" />

      <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              {isAdmin ? (
                <Crown size={39} />
              ) : (
                <User size={39} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-100">
                {saudacao}
              </p>

              <h1 className="mt-1 truncate text-3xl font-black md:text-4xl">
                {primeiroNome}
              </h1>

              <p className="mt-2 truncate text-sm text-emerald-100">
                {isVisitante
                  ? "Acesso local de visitante"
                  : usuarioAtual?.email || "Conta Firebase"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip>
                  {isAdmin
                    ? "👑 Admin Master"
                    : isVisitante
                    ? "✨ Visitante"
                    : "👤 Usuário"}
                </Chip>

                <Chip>
                  {isAdmin
                    ? "Acesso completo"
                    : "Receitas + Posologia"}
                </Chip>

                <Chip>
                  {isVisitante
                    ? "Sem nuvem"
                    : "Firebase ativo"}
                </Chip>

                {usuarioAtual?.publicId && !isVisitante && (
                  <Chip>ID: {usuarioAtual.publicId}</Chip>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <button
              type="button"
              onClick={onPerfil}
              className="rounded-2xl bg-white py-3 font-black text-green-800 shadow-lg transition active:scale-95"
            >
              Meu perfil
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-red-500/20 py-3 font-black backdrop-blur-sm transition active:scale-95"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.15em] text-emerald-100">
            <Sparkles size={16} />
            Resumo rápido
          </p>

          <div className="grid grid-cols-2 gap-3">
            <HeroMiniStat
              label="Itens"
              value={isAdmin ? dashboard.totalMedicamentos : "Uso"}
              detail={isAdmin ? "estoque" : "básico"}
            />

            <HeroMiniStat
              label="Alertas"
              value={isAdmin ? dashboard.proximos : "OK"}
              detail={isAdmin ? "próximos" : "consulta"}
            />

            <HeroMiniStat
              label="Perfil"
              value={
                isAdmin
                  ? "Admin"
                  : isVisitante
                  ? "Local"
                  : "Comum"
              }
              detail="acesso"
            />

            <HeroMiniStat
              label="Nuvem"
              value={isVisitante ? "Off" : "On"}
              detail="status"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMiniStat({
  label,
  value,
  detail,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <p className="text-xs font-bold text-emerald-100">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

      <p className="text-xs text-emerald-100/80">
        {detail}
      </p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  titulo,
  descricao,
  destaque,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[1.7rem] border border-gray-200 bg-gray-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] dark:border-white/10 dark:bg-gray-900/70"
    >
      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${destaque} opacity-20 blur-xl transition group-hover:opacity-35`}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${destaque} text-white shadow-lg`}
        >
          <Icon size={25} />
        </div>

        <ChevronRight
          size={19}
          className="text-gray-400 transition group-hover:translate-x-1"
        />
      </div>

      <div className="relative mt-4">
        <p className="text-lg font-black">
          {titulo}
        </p>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {descricao}
        </p>
      </div>
    </button>
  );
}

function StatusPremium({
  icon: Icon,
  titulo,
  valor,
  descricao,
  status,
  variante = "emerald",
}) {
  const estilos = {
    emerald:
      "border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
    amber:
      "border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
    blue:
      "border-blue-200 bg-blue-50/90 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100",
    purple:
      "border-violet-200 bg-violet-50/90 text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100",
  };

  return (
    <div
      className={`
        rounded-[1.7rem] border p-4 shadow-xl shadow-black/5 backdrop-blur-xl
        ${estilos[variante]}
      `}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/65 shadow-sm dark:bg-white/10">
          <Icon size={23} />
        </div>

        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-white/10">
          {status}
        </span>
      </div>

      <p className="text-sm font-black opacity-80">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-black">
        {valor}
      </p>

      <p className="mt-1 text-xs opacity-75">
        {descricao}
      </p>
    </div>
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
    : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/70";

  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black text-gray-500 dark:text-gray-400">
          {titulo}
        </p>

        <Icon size={18} className={destaque} />
      </div>

      <p className={`text-3xl font-black ${destaque}`}>
        {valor}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

function UsuarioEncontrado({
  usuario,
  onAdmin,
  onComum,
}) {
  return (
    <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50/90 p-5 dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-black">
            {usuario.nome}
          </p>

          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {usuario.email || "Email não informado"}
          </p>

          <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">
            ID: {usuario.publicId}
          </p>
        </div>

        <span
          className={`
            rounded-full px-3 py-1 text-xs font-black
            ${
              usuario.tipo === "admin"
                ? "bg-yellow-500 text-black"
                : "bg-blue-600 text-white"
            }
          `}
        >
          {usuario.tipo === "admin" ? "Admin" : "Comum"}
        </span>
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAdmin}
          className="rounded-2xl bg-yellow-500 py-3 font-black text-black transition active:scale-95"
        >
          👑 Tornar admin
        </button>

        <button
          type="button"
          onClick={onComum}
          className="rounded-2xl bg-blue-600 py-3 font-black text-white transition active:scale-95"
        >
          👤 Tornar comum
        </button>
      </div>
    </div>
  );
}

function PreferenceCard({
  icon: Icon,
  titulo,
  descricao,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-3xl border border-gray-200 bg-gray-50/90 p-4 text-left transition hover:bg-gray-100 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900/70 dark:hover:bg-gray-900"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`
            flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white
            ${danger ? "bg-red-600" : "bg-green-700"}
          `}
        >
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="font-black">
            {titulo}
          </p>

          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {descricao}
          </p>
        </div>
      </div>

      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}

function MiniAdminStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-xs text-emerald-100">
        {label}
      </p>

      <p className="mt-1 text-lg font-black">
        {value}
      </p>
    </div>
  );
}

function FooterStatus({
  isAdmin,
  isVisitante,
}) {
  return (
    <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          {isVisitante ? (
            <CloudOff size={22} />
          ) : (
            <Cloud size={22} />
          )}
        </div>

        <div>
          <p className="font-black">
            {isAdmin
              ? "Modo premium admin ativo"
              : isVisitante
              ? "Modo visitante ativo"
              : "Conta de usuário ativa"}
          </p>

          <p className="mt-1 text-sm">
            {isAdmin
              ? "Login real funcionando. Próximo passo: vincular medicamentos, receitas e base de produtos ao Firestore."
              : isVisitante
              ? "Você está testando o app sem conta. Para salvar perfil na nuvem, crie uma conta na tela de login."
              : "Você tem acesso às áreas liberadas para uso básico do app."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
      {children}
    </span>
  );
}

function Toast({
  toast,
  fechar,
}) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <div className="fixed left-1/2 top-5 z-[99999] w-[92%] max-w-sm -translate-x-1/2">
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
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
            erro
              ? "bg-red-500"
              : info
              ? "bg-blue-500"
              : "bg-emerald-600"
          }`}
        >
          {erro ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
        </div>

        <p className="flex-1 text-sm font-bold">
          {toast.msg}
        </p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

export default Menu;