import { useEffect, useMemo, useState } from "react";
import { db } from "../db";
import { AnimatePresence, motion } from "framer-motion";

import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Pill,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Skull,
  ToggleLeft,
  ToggleRight,
  TriangleAlert,
  X,
} from "lucide-react";

const CONFIG_KEY = "farmaciaNotificacoes";

const configInicial = {
  diasAlertaGeral: 30,
  notificarVencidos: true,
  notificarRemover: true,
  notificarPreVencimento: true,
  notificarProximos: true,
  ultimaVerificacao: null,
};

function Notificacoes() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [config, setConfig] = useState(configInicial);
  const [permissao, setPermissao] = useState("default");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    carregarConfig();
    carregarMedicamentos();

    if ("Notification" in window) {
      setPermissao(Notification.permission);
    }
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function carregarConfig() {
    try {
      const salvo = localStorage.getItem(CONFIG_KEY);

      if (!salvo) return;

      setConfig({
        ...configInicial,
        ...JSON.parse(salvo),
      });
    } catch (err) {
      console.error("Erro ao carregar config:", err);
      mostrarToast("Erro ao carregar configurações 😕", "erro");
    }
  }

  async function carregarMedicamentos() {
    try {
      setCarregando(true);

      const dados = await db.medicamentos.toArray();

      setMedicamentos(dados);
    } catch (err) {
      console.error("Erro ao carregar medicamentos:", err);
      mostrarToast("Erro ao carregar medicamentos 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  function salvarConfig(novaConfig = config) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(novaConfig));
      setConfig(novaConfig);
      mostrarToast("Configurações salvas 🔔", "ok");
    } catch (err) {
      console.error("Erro ao salvar config:", err);
      mostrarToast("Erro ao salvar configurações 😕", "erro");
    }
  }

  function atualizarConfig(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      [campo]: valor,
    }));
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

  function diferencaEmDias(dataFinal, dataInicial = new Date()) {
    const umDia = 1000 * 60 * 60 * 24;

    const inicio = new Date(dataInicial);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(dataFinal);
    fim.setHours(0, 0, 0, 0);

    return Math.ceil((fim - inicio) / umDia);
  }

  function subtrairDias(data, dias) {
    const copia = new Date(data);
    copia.setDate(copia.getDate() - Number(dias || 0));
    return copia;
  }

  function analisarMedicamento(med) {
    const validade = normalizarData(med.validade);

    if (!validade) {
      return {
        med,
        status: "semData",
        titulo: "Sem validade",
        descricao: "Medicamento sem data de validade válida.",
        diasValidade: null,
      };
    }

    const hoje = new Date();
    const diasValidade = diferencaEmDias(validade, hoje);

    const diasRemover = Number(med.diasRemover || 7);
    const diasPreVencido = Number(med.diasPreVencido || med.diasPre || 0);

    const dataRemover = subtrairDias(validade, diasRemover);
    const dataPre = diasPreVencido ? subtrairDias(dataRemover, diasPreVencido) : null;

    const diasAteRemover = diferencaEmDias(dataRemover, hoje);
    const diasAtePre = dataPre ? diferencaEmDias(dataPre, hoje) : null;

    if (diasValidade < 0) {
      return {
        med,
        status: "vencido",
        titulo: "Vencido",
        descricao: `Venceu há ${Math.abs(diasValidade)} dia(s).`,
        validade,
        dataRemover,
        dataPre,
        diasValidade,
      };
    }

    if (diasAteRemover <= 0) {
      return {
        med,
        status: "remover",
        titulo: "Remover",
        descricao: `Remover do estoque. Vence em ${diasValidade} dia(s).`,
        validade,
        dataRemover,
        dataPre,
        diasValidade,
      };
    }

    if (dataPre && diasAtePre <= 0) {
      return {
        med,
        status: "pre",
        titulo: "Pré-vencimento",
        descricao: `Entrou no pré-alerta. Vence em ${diasValidade} dia(s).`,
        validade,
        dataRemover,
        dataPre,
        diasValidade,
      };
    }

    if (diasValidade <= Number(config.diasAlertaGeral || 30)) {
      return {
        med,
        status: "proximo",
        titulo: "Próximo de vencer",
        descricao: `Vence em ${diasValidade} dia(s).`,
        validade,
        dataRemover,
        dataPre,
        diasValidade,
      };
    }

    return {
      med,
      status: "ok",
      titulo: "Em dia",
      descricao: `Vence em ${diasValidade} dia(s).`,
      validade,
      dataRemover,
      dataPre,
      diasValidade,
    };
  }

  const analises = useMemo(() => {
    return medicamentos.map(analisarMedicamento).sort((a, b) => {
      const peso = {
        vencido: 0,
        remover: 1,
        pre: 2,
        proximo: 3,
        semData: 4,
        ok: 5,
      };

      if (peso[a.status] !== peso[b.status]) {
        return peso[a.status] - peso[b.status];
      }

      return Number(a.diasValidade ?? 9999) - Number(b.diasValidade ?? 9999);
    });
  }, [medicamentos, config.diasAlertaGeral]);

  const alertas = useMemo(() => {
    return analises.filter((item) => {
      if (item.status === "vencido") return config.notificarVencidos;
      if (item.status === "remover") return config.notificarRemover;
      if (item.status === "pre") return config.notificarPreVencimento;
      if (item.status === "proximo") return config.notificarProximos;

      return false;
    });
  }, [analises, config]);

  const resumo = useMemo(() => {
    return {
      total: medicamentos.length,
      alertas: alertas.length,
      vencidos: analises.filter((item) => item.status === "vencido").length,
      remover: analises.filter((item) => item.status === "remover").length,
      pre: analises.filter((item) => item.status === "pre").length,
      proximos: analises.filter((item) => item.status === "proximo").length,
    };
  }, [medicamentos.length, alertas.length, analises]);

  async function pedirPermissao() {
    if (!("Notification" in window)) {
      mostrarToast("Este navegador não suporta notificações 😕", "erro");
      return false;
    }

    try {
      const resultado = await Notification.requestPermission();

      setPermissao(resultado);

      if (resultado === "granted") {
        mostrarToast("Notificações ativadas com sucesso 🔔", "ok");
        return true;
      }

      mostrarToast("Permissão de notificação não ativada ⚠️", "erro");
      return false;
    } catch (err) {
      console.error("Erro ao pedir permissão:", err);
      mostrarToast("Erro ao pedir permissão 😕", "erro");
      return false;
    }
  }

  async function garantirPermissao() {
    if (!("Notification" in window)) {
      mostrarToast("Este navegador não suporta notificações 😕", "erro");
      return false;
    }

    if (Notification.permission === "granted") {
      setPermissao("granted");
      return true;
    }

    return pedirPermissao();
  }

  async function enviarTeste() {
    const ok = await garantirPermissao();

    if (!ok) return;

    new Notification("Farmácia App", {
      body: "Notificação de teste funcionando 🔔",
      tag: "farmacia-teste",
    });

    mostrarToast("Teste enviado 🔔", "ok");
  }

  async function verificarAgora() {
    try {
      setProcessando(true);

      const ok = await garantirPermissao();

      if (!ok) return;

      if (alertas.length === 0) {
        mostrarToast("Nenhum alerta crítico agora. Tudo nos trilhos 💚", "ok");

        const novaConfig = {
          ...config,
          ultimaVerificacao: new Date().toISOString(),
        };

        localStorage.setItem(CONFIG_KEY, JSON.stringify(novaConfig));
        setConfig(novaConfig);

        return;
      }

      const limite = Math.min(alertas.length, 5);

      alertas.slice(0, limite).forEach((item) => {
        const nome = item.med.nome || "Medicamento";

        new Notification(`${item.titulo}: ${nome}`, {
          body: item.descricao,
          tag: `farmacia-alerta-${item.med.id || nome}-${item.status}`,
        });
      });

      if (alertas.length > limite) {
        new Notification("Farmácia App", {
          body: `Existem mais ${alertas.length - limite} alerta(s) no app.`,
          tag: "farmacia-alertas-extras",
        });
      }

      const novaConfig = {
        ...config,
        ultimaVerificacao: new Date().toISOString(),
      };

      localStorage.setItem(CONFIG_KEY, JSON.stringify(novaConfig));
      setConfig(novaConfig);

      mostrarToast(`${alertas.length} alerta(s) verificado(s) 🔔`, "ok");
    } catch (err) {
      console.error("Erro ao verificar alertas:", err);
      mostrarToast("Erro ao verificar alertas 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  function formatarData(data) {
    const d = normalizarData(data);

    if (!d) return "Sem data";

    return d.toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data) {
    if (!data) return "Nunca";

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) return "Nunca";

    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <div className="mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-700 to-slate-950 p-6 text-white shadow-2xl">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-amber-300/10" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              <BellRing size={34} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black">Notificações</h1>
              <p className="text-sm text-amber-100">
                Alertas de vencimento e remoção
              </p>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <ResumoTopo icon={Pill} valor={resumo.total} label="Meds" />
            <ResumoTopo icon={Bell} valor={resumo.alertas} label="Alertas" />
            <ResumoTopo icon={Skull} valor={resumo.vencidos} label="Vencidos" />
          </div>
        </div>

        {/* PERMISSÃO */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <ShieldCheck size={21} />
                Permissão do navegador
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Status atual:{" "}
                <span className="font-black">
                  {permissao === "granted"
                    ? "permitida"
                    : permissao === "denied"
                    ? "bloqueada"
                    : "pendente"}
                </span>
              </p>
            </div>

            <StatusPermissao permissao={permissao} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={pedirPermissao}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-600 font-bold text-white shadow-lg shadow-amber-600/20 transition active:scale-95"
            >
              <Bell size={19} />
              Ativar
            </button>

            <button
              type="button"
              onClick={enviarTeste}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 transition active:scale-95"
            >
              <BellRing size={19} />
              Teste
            </button>
          </div>
        </div>

        {/* RESUMO */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <CalendarClock size={21} />
                Painel de alertas
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última verificação: {formatarDataHora(config.ultimaVerificacao)}
              </p>
            </div>

            <button
              type="button"
              onClick={carregarMedicamentos}
              disabled={carregando || processando}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-white transition active:scale-95 disabled:opacity-60"
            >
              {carregando ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <RefreshCcw size={20} />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CardResumo
              icon={Skull}
              titulo="Vencidos"
              valor={resumo.vencidos}
              descricao="já passaram da validade"
              danger={resumo.vencidos > 0}
            />

            <CardResumo
              icon={AlertTriangle}
              titulo="Remover"
              valor={resumo.remover}
              descricao="atingiram data de remoção"
              warning={resumo.remover > 0}
            />

            <CardResumo
              icon={Clock3}
              titulo="Pré-alerta"
              valor={resumo.pre}
              descricao="entraram em pré-vencimento"
              warning={resumo.pre > 0}
            />

            <CardResumo
              icon={Bell}
              titulo="Próximos"
              valor={resumo.proximos}
              descricao="dentro do alerta geral"
            />
          </div>

          <button
            type="button"
            onClick={verificarAgora}
            disabled={processando || carregando}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-700/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            {processando ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <BellRing size={20} />
            )}
            Verificar e Notificar Agora
          </button>
        </div>

        {/* CONFIGURAÇÕES */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Settings size={21} />
              Regras de aviso
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Escolha o que entra na lista de notificações
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
              Avisar quando faltar até X dias para vencer
            </span>

            <input
              type="number"
              min="1"
              max="365"
              value={config.diasAlertaGeral}
              onChange={(e) =>
                atualizarConfig(
                  "diasAlertaGeral",
                  Math.max(1, Number(e.target.value || 1))
                )
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>

          <div className="mt-5 space-y-3">
            <ToggleLinha
              titulo="Notificar vencidos"
              descricao="Medicamentos que já passaram da validade"
              ativo={config.notificarVencidos}
              onClick={() =>
                atualizarConfig("notificarVencidos", !config.notificarVencidos)
              }
            />

            <ToggleLinha
              titulo="Notificar remoção"
              descricao="Medicamentos que chegaram na data de remover"
              ativo={config.notificarRemover}
              onClick={() =>
                atualizarConfig("notificarRemover", !config.notificarRemover)
              }
            />

            <ToggleLinha
              titulo="Notificar pré-vencimento"
              descricao="Aviso antecipado configurado no cadastro"
              ativo={config.notificarPreVencimento}
              onClick={() =>
                atualizarConfig(
                  "notificarPreVencimento",
                  !config.notificarPreVencimento
                )
              }
            />

            <ToggleLinha
              titulo="Notificar próximos"
              descricao="Alerta geral baseado nos dias acima"
              ativo={config.notificarProximos}
              onClick={() =>
                atualizarConfig("notificarProximos", !config.notificarProximos)
              }
            />
          </div>

          <button
            type="button"
            onClick={() => salvarConfig(config)}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 font-bold text-white shadow-lg shadow-amber-600/20 transition active:scale-[0.98]"
          >
            <Save size={20} />
            Salvar Regras
          </button>
        </div>

        {/* LISTA */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <BellRing size={21} />
              Lista de alertas
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Medicamentos que merecem atenção agora
            </p>
          </div>

          {carregando ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gray-100 p-8 text-center dark:bg-gray-700/60">
              <Loader2 size={32} className="mb-3 animate-spin text-amber-600" />
              <p className="font-bold">Carregando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="rounded-3xl bg-emerald-50 p-8 text-center text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="mx-auto mb-3" size={36} />
              <p className="font-black">Tudo tranquilo por aqui</p>
              <p className="mt-1 text-sm">
                Nenhum medicamento entrou nas regras de alerta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertas.map((item) => (
                <CardAlerta
                  key={`${item.med.id}-${item.status}`}
                  item={item}
                  formatarData={formatarData}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-800 shadow-xl dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <TriangleAlert size={22} />
            </div>

            <div>
              <p className="font-black">Sobre notificações</p>
              <p className="mt-1 text-sm">
                Esta versão notifica enquanto o app está aberto. A próxima fase
                pode ativar verificação em segundo plano usando service worker.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-gray-400">
          Alertas locais • radar de validade ligado 🔔
        </div>
      </div>
    </>
  );
}

function ResumoTopo({ icon: Icon, valor, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-1 text-amber-100" size={20} />
      <p className="text-xl font-black">{valor}</p>
      <p className="text-xs text-amber-100">{label}</p>
    </div>
  );
}

function StatusPermissao({ permissao }) {
  const ok = permissao === "granted";
  const bloqueada = permissao === "denied";

  return (
    <div
      className={`
        flex h-12 w-12 items-center justify-center rounded-2xl text-white
        ${ok ? "bg-emerald-600" : bloqueada ? "bg-red-600" : "bg-amber-600"}
      `}
    >
      {ok ? <CheckCircle2 size={23} /> : bloqueada ? <X size={23} /> : <Bell size={23} />}
    </div>
  );
}

function CardResumo({
  icon: Icon,
  titulo,
  valor,
  descricao,
  danger = false,
  warning = false,
}) {
  return (
    <div
      className={`
        rounded-2xl border p-4
        ${
          danger
            ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
            : warning
            ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
            : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700/60"
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
            danger
              ? "text-red-500"
              : warning
              ? "text-amber-500"
              : "text-emerald-600 dark:text-emerald-400"
          }
        />
      </div>

      <p
        className={`
          text-2xl font-black
          ${danger ? "text-red-500" : warning ? "text-amber-500" : ""}
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

function ToggleLinha({ titulo, descricao, ativo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gray-100 p-4 text-left transition active:scale-[0.98] dark:bg-gray-700/60"
    >
      <div>
        <p className="font-black text-gray-950 dark:text-white">{titulo}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{descricao}</p>
      </div>

      <div className={ativo ? "text-emerald-600" : "text-gray-400"}>
        {ativo ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
      </div>
    </button>
  );
}

function CardAlerta({ item, formatarData }) {
  const config = {
    vencido: {
      icon: Skull,
      cor: "bg-red-600",
      texto: "text-red-600 dark:text-red-300",
      fundo: "bg-red-50 dark:bg-red-500/10",
    },
    remover: {
      icon: AlertTriangle,
      cor: "bg-orange-600",
      texto: "text-orange-600 dark:text-orange-300",
      fundo: "bg-orange-50 dark:bg-orange-500/10",
    },
    pre: {
      icon: Clock3,
      cor: "bg-yellow-500",
      texto: "text-yellow-600 dark:text-yellow-300",
      fundo: "bg-yellow-50 dark:bg-yellow-500/10",
    },
    proximo: {
      icon: Bell,
      cor: "bg-blue-600",
      texto: "text-blue-600 dark:text-blue-300",
      fundo: "bg-blue-50 dark:bg-blue-500/10",
    },
  };

  const info = config[item.status] || config.proximo;
  const Icon = info.icon;

  return (
    <div className={`rounded-2xl p-4 ${info.fundo}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${info.cor}`}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`font-black ${info.texto}`}>{item.titulo}</p>
              <p className="truncate font-bold text-gray-950 dark:text-white">
                {item.med.nome || "Medicamento sem nome"}
              </p>
            </div>

            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
              x{item.med.quantidade || 1}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {item.descricao}
          </p>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Validade: {formatarData(item.validade || item.med.validade)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";

  return (
    <div className="fixed left-1/2 top-5 z-[100000] w-[92%] max-w-sm -translate-x-1/2">
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white
            ${erro ? "bg-red-500" : "bg-emerald-600"}
          `}
        >
          {erro ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
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

export default Notificacoes;