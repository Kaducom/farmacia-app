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
  User,
  X,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
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

  const primeiroNome =
    usuarioAtual?.nome?.split(" ")?.[0] || "usuário";

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
      descricao: "Produtos aprendidos pelo scanner",
      icon: ScanBarcode,
      pagina: "baseProdutos",
      destaque: "from-orange-600 to-amber-500",
    },
    {
      titulo: "Mapeamentos",
      descricao: "Histórico das contagens",
      icon: Map,
      pagina: "mapeamentos",
      destaque: "from-slate-700 to-slate-500",
    },
    {
      titulo: "Notificações",
      descricao: "Alertas e avisos do app",
      icon: Bell,
      pagina: "notificacoes",
      destaque: "from-pink-600 to-rose-500",
    },
    {
      titulo: "Backup",
      descricao: "Exportar e restaurar dados",
      icon: Download,
      pagina: "backup",
      destaque: "from-green-700 to-lime-500",
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
          String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR"
          )
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
          onCopyId={() =>
            copiarTexto(usuarioAtual?.publicId, "ID")
          }
        />

        {isAdmin && (
          <section className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xl font-black">
                  <Sparkles size={22} />
                  Ferramentas Master
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recursos administrativos que não ficam no menu inferior
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ferramentasAdmin.map((acao) => (
                <ActionCard
                  key={acao.pagina}
                  {...acao}
                  onClick={() => setPagina(acao.pagina)}
                />
              ))}
            </div>
          </section>
        )}

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
          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <Shield size={22} />
                  Gerenciar acessos
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Busque pelo ID público para editar o cargo de uma conta
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
                  onCopyId={() =>
                    copiarTexto(usuarioEncontrado.publicId, "ID")
                  }
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

        <section className="rounded-[2rem] border border-gray-200 bg-white/85 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Settings size={22} />
              Preferências
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajustes rápidos do visual e sessão
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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

            <PreferenceCard
              icon={LogOut}
              titulo="Sair"
              descricao="Encerrar sessão neste aparelho"
              danger
              onClick={logout}
            />
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
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-5 text-white shadow-2xl shadow-emerald-950/30 md:p-6">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-300/10" />
      <div className="absolute right-28 top-24 h-10 w-10 rounded-full bg-white/10 blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%)]" />

      <div className="relative grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              <User size={39} />
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
                  : usuarioAtual?.email || "Conta ativa"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip>
                  {isVisitante ? "✨ Visitante" : "Conta ativa"}
                </Chip>

                {usuarioAtual?.publicId && !isVisitante && (
                  <button
                    type="button"
                    onClick={onCopyId}
                    className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm transition active:scale-95"
                  >
                    ID: {usuarioAtual.publicId}
                  </button>
                )}

                {isAdmin && (
                  <Chip>
                    Painel master
                  </Chip>
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
              value={isAdmin ? dashboard.totalMedicamentos : "OK"}
              detail={isAdmin ? "estoque" : "uso"}
            />

            <HeroMiniStat
              label="Alertas"
              value={isAdmin ? dashboard.proximos : "OK"}
              detail={isAdmin ? "próximos" : "consulta"}
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
  onCopyId,
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
    <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-5 text-white shadow-2xl shadow-emerald-950/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Crown size={24} />
          </div>

          <p className="text-2xl font-black">
            Área Master
          </p>

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
          placeholder="Buscar por nome, email ou ID"
          className="
            w-full rounded-2xl border border-white/10 bg-black/20
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

function AdminRow({
  admin,
  onCopyId,
}) {
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
            <p className="truncate font-black">
              {nome}
            </p>

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
            <span className="truncate">
              ID: {admin.publicId || "sem ID"}
            </span>

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
        ${
          admin
            ? "bg-yellow-500 text-black"
            : "bg-blue-600 text-white"
        }
      `}
    >
      {admin ? "Admin" : "Comum"}
    </span>
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