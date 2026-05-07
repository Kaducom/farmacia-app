import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import FundoBolhas from "../components/FundoBolhas";
import { db } from "../db";

import {
  User,
  Settings,
  Moon,
  LogOut,
  Database,
  Bell,
  Shield,
  ChevronRight,
  LayoutDashboard,
  Package,
  Boxes,
  Skull,
  CalendarClock,
  BookOpenCheck,
  History,
  RefreshCcw,
  Loader2,
  HardDrive,
  X,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudOff,
  Sparkles,
  ScanBarcode,
  Map,
  UserPlus,
  Mail,
  Lock,
  Crown,
  Wrench,
  Download,
} from "lucide-react";

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
  logout,
  criarUsuario,
  buscarUsuarioPorId,
  alterarTipoPorId,
} = useAuth();

  const dark = theme === "dark";

  const [toast, setToast] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [dashboard, setDashboard] = useState(dashboardInicial);

  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    tipo: "comum",
  });
  const [buscaId, setBuscaId] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);

  useEffect(() => {
    carregarDashboard();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => setToast(null), 3000);
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

  async function criarNovaConta() {
    if (!isAdmin) return;

    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
      mostrarToast("Preencha nome, email e senha ⚠️", "erro");
      return;
    }

    const res = await criarUsuario(novoUsuario);

    if (!res.ok) {
      mostrarToast(res.erro || "Erro ao criar usuário 😕", "erro");
      return;
    }

    setNovoUsuario({
      nome: "",
      email: "",
      senha: "",
      tipo: "comum",
    });

    mostrarToast("Usuário criado na nuvem ✨", "ok");
  }
  async function buscarPorId() {
  if (!buscaId.trim()) {
    mostrarToast("Digite um ID 😅", "erro");
    return;
  }

  setLoadingBusca(true);

  const res = await buscarUsuarioPorId(buscaId);

  setLoadingBusca(false);

  if (!res.ok) {
    mostrarToast(res.erro, "erro");
    setUsuarioEncontrado(null);
    return;
  }

  setUsuarioEncontrado(res.usuario);

  mostrarToast("Usuário encontrado 🔍");
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
      : "Usuário rebaixado 👤"
  );
}

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <div className="relative z-10 mx-auto max-w-5xl space-y-5 p-4 pb-32 text-black dark:text-white">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-700 via-emerald-800 to-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/30">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-emerald-300/10" />
          <div className="absolute right-24 top-20 h-10 w-10 rounded-full bg-white/10 blur-sm" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/20 shadow-xl backdrop-blur-md">
                <User size={38} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-3xl font-black">
                  {usuarioAtual?.nome || "Usuário"}
                </p>

                <p className="truncate text-sm text-green-100">
                  {usuarioAtual?.email || "Conta Firebase"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip>{isAdmin ? "👑 Admin" : "👤 Usuário"}</Chip>
                  <Chip>{isAdmin ? "Acesso completo" : "Receitas + Posologia"}</Chip>
                  <Chip>Firebase ativo</Chip>
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-3 md:max-w-sm">
              <button
                type="button"
                onClick={() => setPagina("perfil")}
                className="rounded-2xl bg-white py-3 font-bold text-green-800 shadow-lg transition active:scale-95"
              >
                Perfil
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-red-500/20 py-3 font-bold backdrop-blur-sm transition active:scale-95"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            icon={Cloud}
            titulo="Nuvem"
            valor="Firebase"
            descricao="Login real ativo"
            ativo
          />

          <StatusCard
            icon={HardDrive}
            titulo="Banco local"
            valor="IndexedDB"
            descricao="Dados locais ainda ativos"
          />

          <StatusCard
            icon={Wrench}
            titulo="Próxima fase"
            valor="Sync"
            descricao="Migrar estoque para Firestore"
            aviso
          />
        </div>

        {/* ADMIN DASHBOARD */}
        {isAdmin && (
          <div className="space-y-4 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <LayoutDashboard size={22} />
                  Dashboard Admin
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visão geral dos dados locais deste aparelho
                </p>
              </div>

              <button
                type="button"
                onClick={carregarDashboard}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg transition active:scale-95"
              >
                {carregando ? (
                  <Loader2 size={25} className="animate-spin" />
                ) : (
                  <RefreshCcw size={25} />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <CardMetrica
                icon={Package}
                titulo="Medicamentos"
                valor={dashboard.totalMedicamentos}
                descricao="itens cadastrados"
              />

              <CardMetrica
                icon={Boxes}
                titulo="Unidades"
                valor={dashboard.totalUnidades}
                descricao="quantidade total"
              />

              <CardMetrica
                icon={Skull}
                titulo="Vencidos"
                valor={dashboard.vencidos}
                descricao="exigem atenção"
                alerta={dashboard.vencidos > 0}
              />

              <CardMetrica
                icon={CalendarClock}
                titulo="Próximos"
                valor={dashboard.proximos}
                descricao="vencer/remover"
                aviso={dashboard.proximos > 0}
              />

              <CardMetrica
                icon={BookOpenCheck}
                titulo="Base local"
                valor={dashboard.produtosAprendidos}
                descricao="scanner aprendeu"
              />

              <CardMetrica
                icon={History}
                titulo="Mapeamentos"
                valor={dashboard.mapeamentos}
                descricao="históricos salvos"
              />
            </div>
          </div>
        )}

        {/* FERRAMENTAS ADMIN */}
        {isAdmin && (
          <div className="space-y-3 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Sparkles size={22} />
                Central Admin
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Atalhos principais do sistema completo
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <CardOpcao
                icon={ScanBarcode}
                titulo="Base de Produtos"
                descricao="Produtos aprendidos pelo scanner"
                onClick={() => setPagina("baseProdutos")}
              />

              <CardOpcao
                icon={Map}
                titulo="Mapeamentos"
                descricao="Histórico das contagens"
                onClick={() => setPagina("mapeamentos")}
              />

              <CardOpcao
                icon={Bell}
                titulo="Notificações"
                descricao="Alertas e avisos"
                onClick={() => setPagina("notificacoes")}
              />

              <CardOpcao
                icon={Download}
                titulo="Backup"
                descricao="Exportar e restaurar dados"
                onClick={() => setPagina("backup")}
              />
            </div>
          </div>
        )}

        {/* CRIAR USUÁRIO */}
        {isAdmin && (
          <div className="space-y-4 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <UserPlus size={22} />
                Criar usuário
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Crie contas reais no Firebase. Usuário comum vê apenas Receitas,
                Posologia e Menu.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Campo
                icon={User}
                label="Nome"
                value={novoUsuario.nome}
                placeholder="Ex: Maria"
                onChange={(v) =>
                  setNovoUsuario((prev) => ({ ...prev, nome: v }))
                }
              />

              <Campo
                icon={Mail}
                label="Email"
                type="email"
                value={novoUsuario.email}
                placeholder="maria@email.com"
                onChange={(v) =>
                  setNovoUsuario((prev) => ({ ...prev, email: v }))
                }
              />

              <Campo
                icon={Lock}
                label="Senha"
                type="password"
                value={novoUsuario.senha}
                placeholder="Mínimo 6 caracteres"
                onChange={(v) =>
                  setNovoUsuario((prev) => ({ ...prev, senha: v }))
                }
              />

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                  <Crown size={16} />
                  Tipo
                </label>

                <select
                  value={novoUsuario.tipo}
                  onChange={(e) =>
                    setNovoUsuario((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950"
                >
                  <option value="comum">Comum</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={criarNovaConta}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition active:scale-95"
            >
              <UserPlus size={20} />
              Criar conta Firebase
            </button>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              ⚠️ Se ao criar usuário o Firebase trocar para a nova conta, a
              gente corrige no próximo passo usando autenticação secundária.
            </div>
          </div>
        )}

        {/* GERENCIAR ACESSOS */}
{isAdmin && (
  <div className="space-y-4 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">

    <div>
      <h2 className="flex items-center gap-2 text-xl font-black">
        <Shield size={22} />
        Gerenciar acessos
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Promover ou rebaixar usuários usando ID público
      </p>
    </div>

    {/* BUSCA */}
    <div className="flex gap-2">
      <input
        value={buscaId}
        onChange={(e) => setBuscaId(e.target.value)}
        placeholder="Digite o ID"
        className="
          flex-1 rounded-2xl border border-gray-200
          bg-gray-50 px-4 py-3 font-semibold
          outline-none focus:border-emerald-500
          focus:ring-4 focus:ring-emerald-500/20
          dark:border-gray-800 dark:bg-gray-950
        "
      />

      <button
        onClick={buscarPorId}
        className="
          rounded-2xl bg-emerald-700 px-5
          font-bold text-white
        "
      >
        {loadingBusca ? "..." : "Buscar"}
      </button>
    </div>

    {/* RESULTADO */}
    {usuarioEncontrado && (
      <div className="
        rounded-3xl border border-gray-200
        bg-gray-100/80 p-5
        dark:border-gray-700
        dark:bg-gray-800/70
      ">

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-black">
              {usuarioEncontrado.nome}
            </p>

            <p className="text-sm text-gray-500">
              ID: {usuarioEncontrado.publicId}
            </p>
          </div>

          <div className={`
            rounded-full px-3 py-1 text-xs font-black
            ${
              usuarioEncontrado.tipo === "admin"
                ? "bg-yellow-500 text-black"
                : "bg-blue-500 text-white"
            }
          `}>
            {usuarioEncontrado.tipo}
          </div>
        </div>

        {(usuarioEncontrado.permissaoAtualizadaPor ||
          usuarioEncontrado.criadoPor) && (
          <div className="
            mt-4 rounded-2xl bg-black/5 p-3
            text-sm dark:bg-white/5
          ">
            <p>
              👤 Última alteração por:
              <span className="font-bold">
                {" "}
                {usuarioEncontrado.permissaoAtualizadaPor ||
                  usuarioEncontrado.criadoPor}
              </span>
            </p>

            {usuarioEncontrado.permissaoAtualizadaEm && (
              <p className="mt-1 text-xs text-gray-500">
                {new Date(
                  usuarioEncontrado.permissaoAtualizadaEm
                ).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => alterarPermissao("admin")}
            className="
              flex-1 rounded-2xl bg-yellow-500
              py-3 font-black text-black
            "
          >
            👑 Tornar admin
          </button>

          <button
            onClick={() => alterarPermissao("comum")}
            className="
              flex-1 rounded-2xl bg-blue-600
              py-3 font-black text-white
            "
          >
            👤 Tornar comum
          </button>
        </div>

      </div>
    )}
  </div>
)}

        {/* CONFIGURAÇÕES */}
        <div className="space-y-3 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Settings size={22} />
              Configurações
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajustes gerais da conta
            </p>
          </div>

          <CardOpcao
            icon={User}
            titulo="Perfil"
            descricao="Editar informações do perfil"
            onClick={() => setPagina("perfil")}
          />

          <div className="flex items-center justify-between rounded-2xl bg-gray-100/90 p-4 dark:bg-gray-800/70">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-700 text-white">
                <Moon size={20} />
              </div>

              <div>
                <p className="font-bold">Modo Escuro</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Alternar aparência
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-7 w-14 items-center rounded-full px-1 transition-all ${
                dark ? "justify-end bg-green-500" : "justify-start bg-gray-400"
              }`}
            >
              <div className="h-5 w-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {isAdmin && (
            <CardOpcao
              icon={Shield}
              titulo="Privacidade local"
              descricao="Estado atual dos dados locais e nuvem"
              onClick={() =>
                mostrarToast("Login já está na nuvem. Dados do estoque ainda serão migrados 🛡️", "info")
              }
            />
          )}
        </div>

        {/* RODAPÉ */}
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              {isAdmin ? <Cloud size={22} /> : <CloudOff size={22} />}
            </div>

            <div>
              <p className="font-black">
                {isAdmin ? "Modo premium admin ativo" : "Conta de usuário ativa"}
              </p>
              <p className="mt-1 text-sm">
                {isAdmin
                  ? "Login real funcionando. Próximo passo: vincular medicamentos, receitas e base de produtos ao Firestore."
                  : "Você tem acesso às áreas liberadas para uso básico do app."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ icon: Icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
        <Icon size={16} />
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950"
      />
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

function StatusCard({ icon: Icon, titulo, valor, descricao, ativo = false, aviso = false }) {
  return (
    <div
      className={`
        rounded-3xl border p-4 shadow-xl backdrop-blur-xl
        ${
          ativo
            ? "border-emerald-200 bg-emerald-50/90 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
            : aviso
            ? "border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
            : "border-gray-200 bg-white/90 dark:border-gray-800 dark:bg-gray-900/90"
        }
      `}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black">{titulo}</p>
        <Icon size={20} />
      </div>

      <p className="text-2xl font-black">{valor}</p>
      <p className="mt-1 text-xs opacity-75">{descricao}</p>
    </div>
  );
}

function CardMetrica({ icon: Icon, titulo, valor, descricao, alerta = false, aviso = false }) {
  return (
    <div
      className={`
        rounded-2xl border p-4 shadow-sm
        ${
          alerta
            ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
            : aviso
            ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
            : "border-gray-200 bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800/70"
        }
      `}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {titulo}
        </p>

        <Icon size={18} />
      </div>

      <p className={`text-2xl font-black ${alerta ? "text-red-500" : aviso ? "text-amber-500" : ""}`}>
        {valor}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

function CardOpcao({ icon: Icon, titulo, descricao, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-gray-100/90 p-4 transition-all hover:bg-gray-200 active:scale-[0.98] dark:bg-gray-800/70 dark:hover:bg-gray-800"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
          <Icon size={20} />
        </div>

        <div className="min-w-0 text-left">
          <p className="font-bold text-black dark:text-white">{titulo}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {descricao}
          </p>
        </div>
      </div>

      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}

function Toast({ toast, fechar }) {
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
            erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="flex-1 text-sm font-bold">{toast.msg}</p>

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