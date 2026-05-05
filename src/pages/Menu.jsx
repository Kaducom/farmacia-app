import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { db } from "../db";
import FundoBolhas from "../components/FundoBolhas";

import {
  User,
  LayoutDashboard,
  Settings,
  Moon,
  Bell,
  Shield,
  Database,
  ChevronRight,
  Pill,
  Brain,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Boxes,
  CalendarClock,
  Skull,
  BookOpenCheck,
  History,
  Loader2,
  Sparkles,
  RefreshCcw,
  LockKeyhole,
  HardDrive,
} from "lucide-react";

const dashboardInicial = {
  totalMedicamentos: 0,
  totalUnidades: 0,
  vencidos: 0,
  proximos: 0,
  produtosAprendidos: 0,
  ultimoMapeamento: null,
};

const PERFIL_KEY = "farmaciaPerfil";

const perfilPadrao = {
  nome: "Usuário",
  farmacia: "Painel local do estoque",
  avatar: null,
};

function Menu({ setPagina }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  const [toast, setToast] = useState(null);
  const [confirmarMapeamento, setConfirmarMapeamento] = useState(false);
  const [abrirSeguranca, setAbrirSeguranca] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [criandoMapeamento, setCriandoMapeamento] = useState(false);

  const [dashboard, setDashboard] = useState(dashboardInicial);
  const [perfil, setPerfil] = useState(perfilPadrao);

  useEffect(() => {
    carregarDashboard();
  }, []);

  useEffect(() => {
    carregarPerfilMenu();

    window.addEventListener("perfilFarmaciaAtualizado", carregarPerfilMenu);

    return () => {
      window.removeEventListener("perfilFarmaciaAtualizado", carregarPerfilMenu);
    };
  }, []);

  function carregarPerfilMenu() {
    try {
      const salvo = localStorage.getItem(PERFIL_KEY);

      if (!salvo) {
        setPerfil(perfilPadrao);
        return;
      }

      const dados = JSON.parse(salvo);

      setPerfil({
        ...perfilPadrao,
        ...dados,
      });
    } catch (err) {
      console.error("Erro ao carregar perfil no menu:", err);
      setPerfil(perfilPadrao);
    }
  }

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      setToast(null);
    }, 2800);
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
          db.mapeamentos.orderBy("dataCriacao").reverse().limit(1).toArray(),
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
        ultimoMapeamento: mapeamentos[0] || null,
      });
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar dashboard 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function novoMapeamento() {
    if (criandoMapeamento) return;

    try {
      setCriandoMapeamento(true);

      const medicamentos = await db.medicamentos.toArray();

      if (medicamentos.length === 0) {
        setConfirmarMapeamento(false);
        mostrarToast("Nada para mapear. O estoque já está vazio 📭", "info");
        return;
      }

      const agora = new Date();

      const totalUnidades = medicamentos.reduce((total, item) => {
        return total + Number(item.quantidade || 1);
      }, 0);

      await db.transaction("rw", db.mapeamentos, db.medicamentos, async () => {
        await db.mapeamentos.add({
          nome: `Mapeamento ${agora.toLocaleDateString(
            "pt-BR"
          )} ${agora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          dataCriacao: agora.toISOString(),
          totalItens: medicamentos.length,
          totalUnidades,
          itens: medicamentos,
        });

        await db.medicamentos.clear();
      });

      setConfirmarMapeamento(false);
      mostrarToast("Mapeamento salvo e estoque limpo ✨", "ok");
      await carregarDashboard();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao criar novo mapeamento 😕", "erro");
    } finally {
      setCriandoMapeamento(false);
    }
  }

  const resumoMapeamento = useMemo(() => {
    const ultimo = dashboard.ultimoMapeamento;

    if (!ultimo) {
      return {
        titulo: "Nenhum mapeamento ainda",
        descricao: "Quando criar um novo mapeamento, ele aparece aqui.",
      };
    }

    const data = normalizarData(ultimo.dataCriacao);

    return {
      titulo: ultimo.nome || "Último mapeamento",
      descricao: data
        ? `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )} • ${ultimo.totalItens || 0} itens • ${
            ultimo.totalUnidades || 0
          } unidades`
        : `${ultimo.totalItens || 0} itens • ${
            ultimo.totalUnidades || 0
          } unidades`,
    };
  }, [dashboard.ultimoMapeamento]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      {confirmarMapeamento && (
        <ConfirmarMapeamento
          totalItens={dashboard.totalMedicamentos}
          totalUnidades={dashboard.totalUnidades}
          carregando={criandoMapeamento}
          onCancelar={() => setConfirmarMapeamento(false)}
          onConfirmar={novoMapeamento}
        />
      )}

      {abrirSeguranca && (
        <ModalSeguranca
          onFechar={() => setAbrirSeguranca(false)}
          onAbrirBackup={() => {
            setAbrirSeguranca(false);
            setPagina("backup");
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        {/* HEADER PERFIL */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-emerald-800 to-emerald-950 p-6 text-white shadow-2xl shadow-emerald-950/25">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-emerald-300/10" />
          <div className="absolute right-20 top-16 h-8 w-8 rounded-full bg-white/10 blur-sm" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/20 shadow-xl backdrop-blur-md">
              {perfil.avatar ? (
                <img
                  src={perfil.avatar}
                  alt={perfil.nome || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={36} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-2xl font-black">
                {perfil.nome || "Usuário"}
              </p>

              <p className="truncate text-sm text-green-100">
                {perfil.farmacia || "Painel local do estoque"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip>💊 Farmácia</Chip>
                <Chip>📦 Estoque</Chip>
                <Chip>🧠 Scanner aprende</Chip>
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPagina("perfil")}
              className="rounded-2xl bg-white py-3 font-bold text-green-800 shadow-lg transition active:scale-95"
            >
              Editar Perfil
            </button>

            <button
              type="button"
              onClick={carregarDashboard}
              className="rounded-2xl border border-white/20 bg-white/10 py-3 font-semibold backdrop-blur-sm transition active:scale-95"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* DASHBOARD */}
        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <LayoutDashboard size={20} />
                Dashboard
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dados reais salvos no banco de dados
              </p>
            </div>

            <button
              type="button"
              onClick={carregarDashboard}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg transition active:scale-95"
              title="Recarregar dashboard"
            >
              {carregando ? (
                <Loader2 size={25} className="animate-spin" />
              ) : (
                <RefreshCcw size={25} />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CardMetrica
              icon={Package}
              titulo="Medicamentos"
              valor={dashboard.totalMedicamentos}
              descricao="itens no estoque"
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
              descricao="precisam atenção"
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
              titulo="Base Local"
              valor={dashboard.produtosAprendidos}
              descricao="produtos aprendidos"
            />

            <CardMetrica
              icon={History}
              titulo="Mapeamento"
              valor={dashboard.ultimoMapeamento ? "1" : "0"}
              descricao={
                dashboard.ultimoMapeamento ? "histórico salvo" : "nenhum ainda"
              }
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/60">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                <History size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-black">{resumoMapeamento.titulo}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {resumoMapeamento.descricao}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AÇÕES IMPORTANTES */}
        <div className="space-y-3 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Sparkles size={20} />
              Ações rápidas
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Atalhos principais do controle de estoque
            </p>
          </div>

          <CardOpcao
            icon={RotateCcw}
            titulo="Novo Mapeamento"
            descricao="Salvar estoque atual e começar nova contagem"
            onClick={() => setConfirmarMapeamento(true)}
            destaque
          />

          <CardOpcao
            icon={Brain}
            titulo="Base de Produtos"
            descricao={`${dashboard.produtosAprendidos} produtos aprendidos pelo scanner`}
            onClick={() => setPagina("baseProdutos")}
          />

          <CardOpcao
            icon={History}
            titulo="Histórico de Mapeamentos"
            descricao="Ver contagens anteriores"
            onClick={() => setPagina("mapeamentos")}
          />
        </div>

        {/* CONFIGURAÇÕES */}
        <div className="space-y-3 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Settings size={20} />
              Configurações
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajustes e proteção dos dados
            </p>
          </div>

          <CardOpcao
            icon={Bell}
            titulo="Notificações"
            descricao="Alertas e avisos de vencimento"
            onClick={() => setPagina("notificacoes")}
          />

          <CardOpcao
            icon={Database}
            titulo="Backup"
            descricao="Salvar e restaurar dados"
            onClick={() => setPagina("backup")}
          />

          <CardOpcao
            icon={Shield}
            titulo="Privacidade Local"
            descricao="Entenda onde seus dados ficam salvos"
            onClick={() => setAbrirSeguranca(true)}
          />
        </div>

        {/* DARK MODE */}
        <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
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
            className={`
              flex h-7 w-14 items-center rounded-full px-1 transition-all
              ${dark ? "justify-end bg-green-500" : "justify-start bg-gray-400"}
            `}
          >
            <div className="h-5 w-5 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* STATUS LOCAL */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <HardDrive size={22} />
            </div>

            <div>
              <p className="font-black">Modo local ativo</p>
              <p className="mt-1 text-sm">
                Seus dados estão salvos neste dispositivo. Para trocar de celular
                ou PC, use Backup até a futura versão com conta em nuvem.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-gray-400">
          Farmácia App • build turbo mega deluxe 🚀
        </div>
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs backdrop-blur-sm">
      {children}
    </span>
  );
}

function CardMetrica({
  icon: Icon,
  titulo,
  valor,
  descricao,
  alerta = false,
  aviso = false,
}) {
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

        <Icon
          size={18}
          className={
            alerta
              ? "text-red-500"
              : aviso
              ? "text-amber-500"
              : "text-green-600 dark:text-green-400"
          }
        />
      </div>

      <p
        className={`
          text-2xl font-black
          ${alerta ? "text-red-500" : aviso ? "text-amber-500" : ""}
        `}
      >
        {valor}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

function CardOpcao({
  icon: Icon,
  titulo,
  descricao,
  danger = false,
  destaque = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full items-center justify-between rounded-2xl p-4 transition-all active:scale-[0.98]
        ${
          danger
            ? "border border-red-500/20 bg-red-500/10 hover:bg-red-500/20"
            : destaque
            ? "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-700/20"
            : "bg-gray-100/90 hover:bg-gray-200 dark:bg-gray-800/70 dark:hover:bg-gray-800"
        }
      `}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
            ${
              danger
                ? "bg-red-500 text-white"
                : destaque
                ? "bg-white/15 text-white"
                : "bg-green-700 text-white"
            }
          `}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 text-left">
          <p
            className={`font-bold ${
              danger
                ? "text-red-500"
                : destaque
                ? "text-white"
                : "text-black dark:text-white"
            }`}
          >
            {titulo}
          </p>

          <p
            className={`truncate text-xs ${
              destaque ? "text-white/75" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {descricao}
          </p>
        </div>
      </div>

      <ChevronRight
        size={18}
        className={destaque ? "text-white/70" : "text-gray-400"}
      />
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
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white
            ${erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"}
          `}
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

function ConfirmarMapeamento({
  onCancelar,
  onConfirmar,
  totalItens,
  totalUnidades,
  carregando,
}) {
  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <RotateCcw size={28} />
        </div>

        <h2 className="text-center text-lg font-black">
          Criar novo mapeamento?
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          O estoque atual será salvo no histórico e depois a lista de
          medicamentos será limpa. A base aprendida do scanner não será apagada.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-100 p-3 text-center dark:bg-gray-800">
            <p className="text-2xl font-black">{totalItens}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">itens</p>
          </div>

          <div className="rounded-2xl bg-gray-100 p-3 text-center dark:bg-gray-800">
            <p className="text-2xl font-black">{totalUnidades}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-700 font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {carregando && <Loader2 size={18} className="animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSeguranca({ onFechar, onAbrirBackup }) {
  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 z-[99998] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 to-slate-950 p-5 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-emerald-300/10" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <LockKeyhole size={25} />
              </div>

              <h2 className="text-xl font-black">Privacidade Local</h2>
              <p className="mt-1 text-sm text-emerald-100">
                O app ainda trabalha com dados salvos no dispositivo.
              </p>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <InfoSeguranca
            icon={HardDrive}
            titulo="Banco local"
            texto="Medicamentos, receitas, base aprendida e mapeamentos ficam salvos no navegador usando Dexie."
          />

          <InfoSeguranca
            icon={AlertTriangle}
            titulo="Cuidado ao limpar dados"
            texto="Se limpar cache/dados do navegador, trocar de aparelho ou reinstalar o PWA, você pode perder informações sem backup."
            aviso
          />

          <InfoSeguranca
            icon={Database}
            titulo="Backup é o escudo atual"
            texto="Enquanto não existe login em nuvem, a melhor proteção é exportar backup com frequência."
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-2xl bg-gray-100 py-3 font-bold text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-gray-200"
            >
              Entendi
            </button>

            <button
              type="button"
              onClick={onAbrirBackup}
              className="rounded-2xl bg-emerald-700 py-3 font-bold text-white transition active:scale-95"
            >
              Abrir Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoSeguranca({ icon: Icon, titulo, texto, aviso = false }) {
  return (
    <div
      className={`
        flex gap-3 rounded-2xl border p-4
        ${
          aviso
            ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
            : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
        }
      `}
    >
      <Icon
        size={21}
        className={`mt-0.5 shrink-0 ${
          aviso ? "text-amber-600" : "text-emerald-600 dark:text-emerald-300"
        }`}
      />

      <div>
        <p className="font-black">{titulo}</p>
        <p className="mt-1 text-sm opacity-80">{texto}</p>
      </div>
    </div>
  );
}

export default Menu;