import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { db } from "../db";

import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Pill,
  Plus,
  RefreshCcw,
  Repeat,
  Save,
  Settings,
  ShieldCheck,
  Skull,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

const CONFIG_KEY = "farmaciaNotificacoes";
const LEMBRETES_KEY = "farmaciaLembretes";

const configInicial = {
  diasAlertaGeral: 30,
  notificarVencidos: true,
  notificarRemover: true,
  notificarPreVencimento: true,
  notificarProximos: true,
  ultimaVerificacao: null,
};

const lembreteInicial = {
  titulo: "Olhar seção",
  secao: "",
  observacao: "",
  repeticao: "diario",
  data: "",
  hora: "15:00",
  diaSemana: String(new Date().getDay()),
  ativo: true,
};

const diasSemana = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function Notificacoes() {
  const [aba, setAba] = useState("alertas");

  const [medicamentos, setMedicamentos] = useState([]);
  const [config, setConfig] = useState(configInicial);
  const [permissao, setPermissao] = useState("default");

  const [lembretes, setLembretes] = useState([]);
  const [novoLembrete, setNovoLembrete] = useState(lembreteInicial);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    carregarConfig();
    carregarLembretes();
    carregarMedicamentos();

    if ("Notification" in window) {
      setPermissao(Notification.permission);
    }
  }, []);

  function criarId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function mostrarToast(msg, tipo = "ok") {
    setToast({
      msg,
      tipo,
    });

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

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

  function carregarLembretes() {
    try {
      const salvo = localStorage.getItem(LEMBRETES_KEY);

      if (!salvo) {
        setLembretes([]);
        return;
      }

      const lista = JSON.parse(salvo);

      if (!Array.isArray(lista)) {
        setLembretes([]);
        return;
      }

      setLembretes(lista);
    } catch (err) {
      console.error("Erro ao carregar lembretes:", err);
      mostrarToast("Erro ao carregar lembretes 😕", "erro");
    }
  }

  function salvarLembretes(novaLista) {
    localStorage.setItem(LEMBRETES_KEY, JSON.stringify(novaLista));
    setLembretes(novaLista);
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
    const dataPre = diasPreVencido
      ? subtrairDias(dataRemover, diasPreVencido)
      : null;

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

  const lembretesVencidos = useMemo(() => {
    return lembretes.filter((lembrete) => {
      return analisarLembrete(lembrete).deveNotificar;
    });
  }, [lembretes]);

  const resumo = useMemo(() => {
    return {
      total: medicamentos.length,
      alertas: alertas.length,
      vencidos: analises.filter((item) => item.status === "vencido").length,
      remover: analises.filter((item) => item.status === "remover").length,
      pre: analises.filter((item) => item.status === "pre").length,
      proximos: analises.filter((item) => item.status === "proximo").length,
      lembretes: lembretes.length,
      lembretesVencidos: lembretesVencidos.length,
    };
  }, [
    medicamentos.length,
    alertas.length,
    analises,
    lembretes.length,
    lembretesVencidos.length,
  ]);

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

      const alertasMedicamentos = alertas;

      const lembretesParaNotificar = lembretes.filter((lembrete) => {
        return analisarLembrete(lembrete).deveNotificar;
      });

      if (
        alertasMedicamentos.length === 0 &&
        lembretesParaNotificar.length === 0
      ) {
        mostrarToast("Nenhum alerta crítico agora. Tudo nos trilhos 💚", "ok");
        atualizarUltimaVerificacao();
        return;
      }

      const limite = Math.min(alertasMedicamentos.length, 5);

      alertasMedicamentos.slice(0, limite).forEach((item) => {
        const nome = item.med.nome || "Medicamento";

        new Notification(`${item.titulo}: ${nome}`, {
          body: item.descricao,
          tag: `farmacia-alerta-${item.med.id || nome}-${item.status}`,
        });
      });

      if (alertasMedicamentos.length > limite) {
        new Notification("Farmácia App", {
          body: `Existem mais ${alertasMedicamentos.length - limite} alerta(s) de medicamentos no app.`,
          tag: "farmacia-alertas-extras",
        });
      }

      const lembretesAtualizados = lembretes.map((lembrete) => {
        const analise = analisarLembrete(lembrete);

        if (!analise.deveNotificar) {
          return lembrete;
        }

        new Notification(`Lembrete: ${lembrete.titulo}`, {
          body: montarDescricaoLembrete(lembrete),
          tag: `farmacia-lembrete-${lembrete.id}-${analise.chavePeriodo}`,
        });

        return {
          ...lembrete,
          ultimaNotificacaoChave: analise.chavePeriodo,
          ultimaNotificacaoEm: new Date().toISOString(),
        };
      });

      salvarLembretes(lembretesAtualizados);
      atualizarUltimaVerificacao();

      mostrarToast(
        `${alertasMedicamentos.length + lembretesParaNotificar.length} aviso(s) verificado(s) 🔔`,
        "ok"
      );
    } catch (err) {
      console.error("Erro ao verificar alertas:", err);
      mostrarToast("Erro ao verificar alertas 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  function atualizarUltimaVerificacao() {
    const novaConfig = {
      ...config,
      ultimaVerificacao: new Date().toISOString(),
    };

    localStorage.setItem(CONFIG_KEY, JSON.stringify(novaConfig));
    setConfig(novaConfig);
  }

  function adicionarLembrete() {
    const titulo = novoLembrete.titulo.trim();
    const secao = novoLembrete.secao.trim();

    if (!titulo) {
      mostrarToast("Digite o título do lembrete 😅", "erro");
      return;
    }

    if (!novoLembrete.hora) {
      mostrarToast("Escolha um horário", "erro");
      return;
    }

    if (novoLembrete.repeticao === "unico" && !novoLembrete.data) {
      mostrarToast("Escolha a data do lembrete único", "erro");
      return;
    }

    const lembrete = {
      ...novoLembrete,
      id: criarId(),
      titulo,
      secao,
      criadoEm: new Date().toISOString(),
      ultimaNotificacaoChave: null,
      ultimaNotificacaoEm: null,
      concluidoChave: null,
      concluidoEm: null,
    };

    const novaLista = [lembrete, ...lembretes];

    salvarLembretes(novaLista);
    setNovoLembrete(lembreteInicial);
    mostrarToast("Lembrete criado 📝", "ok");
  }

  function removerLembrete(id) {
    const novaLista = lembretes.filter((item) => item.id !== id);
    salvarLembretes(novaLista);
    mostrarToast("Lembrete removido 🗑️", "ok");
  }

  function alternarLembrete(id) {
    const novaLista = lembretes.map((item) => {
      if (item.id !== id) return item;

      return {
        ...item,
        ativo: !item.ativo,
      };
    });

    salvarLembretes(novaLista);
  }

  function marcarLembreteFeito(id) {
    const novaLista = lembretes.map((item) => {
      if (item.id !== id) return item;

      const analise = analisarLembrete(item);

      return {
        ...item,
        concluidoChave: analise.chavePeriodo,
        concluidoEm: new Date().toISOString(),
      };
    });

    salvarLembretes(novaLista);
    mostrarToast("Lembrete marcado como feito ✅", "ok");
  }

  function analisarLembrete(lembrete) {
    const agora = new Date();
    const hoje = dataIsoLocal(agora);
    const horaAtual = horaMinuto(agora);

    const chavePeriodo = gerarChavePeriodo(lembrete, agora);

    if (!lembrete.ativo) {
      return {
        deveNotificar: false,
        chavePeriodo,
        status: "pausado",
      };
    }

    if (lembrete.concluidoChave === chavePeriodo) {
      return {
        deveNotificar: false,
        chavePeriodo,
        status: "feito",
      };
    }

    if (lembrete.ultimaNotificacaoChave === chavePeriodo) {
      return {
        deveNotificar: false,
        chavePeriodo,
        status: "notificado",
      };
    }

    if (!lembrete.hora || horaAtual < lembrete.hora) {
      return {
        deveNotificar: false,
        chavePeriodo,
        status: "aguardando",
      };
    }

    if (lembrete.repeticao === "unico") {
      const deve = lembrete.data === hoje;

      return {
        deveNotificar: deve,
        chavePeriodo,
        status: deve ? "vencido" : "agendado",
      };
    }

    if (lembrete.repeticao === "semanal") {
      const diaAtual = String(agora.getDay());
      const deve = diaAtual === String(lembrete.diaSemana);

      return {
        deveNotificar: deve,
        chavePeriodo,
        status: deve ? "vencido" : "agendado",
      };
    }

    return {
      deveNotificar: true,
      chavePeriodo,
      status: "vencido",
    };
  }

  function gerarChavePeriodo(lembrete, dataBase = new Date()) {
    const hoje = dataIsoLocal(dataBase);

    if (lembrete.repeticao === "unico") {
      return `unico-${lembrete.data || hoje}`;
    }

    if (lembrete.repeticao === "semanal") {
      return `semanal-${getAnoSemana(dataBase)}-${lembrete.diaSemana}`;
    }

    return `diario-${hoje}`;
  }

  function montarDescricaoLembrete(lembrete) {
    const partes = [];

    if (lembrete.secao) {
      partes.push(`Seção: ${lembrete.secao}`);
    }

    if (lembrete.observacao) {
      partes.push(lembrete.observacao);
    }

    if (!partes.length) {
      partes.push("Hora de conferir essa tarefa no app.");
    }

    return partes.join(" • ");
  }

  function dataIsoLocal(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function horaMinuto(data = new Date()) {
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");

    return `${hora}:${minuto}`;
  }

  function getAnoSemana(data) {
    const copia = new Date(
      Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
    );

    const diaSemana = copia.getUTCDay() || 7;

    copia.setUTCDate(copia.getUTCDate() + 4 - diaSemana);

    const anoInicio = new Date(Date.UTC(copia.getUTCFullYear(), 0, 1));

    const semana = Math.ceil(
      (((copia - anoInicio) / 86400000) + 1) / 7
    );

    return `${copia.getUTCFullYear()}-${String(semana).padStart(2, "0")}`;
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
      {toast && (
        <Toast
          toast={toast}
          fechar={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-700 to-slate-950 p-6 text-white shadow-2xl">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-amber-300/10" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              <BellRing size={34} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black">
                Notificações
              </h1>

              <p className="text-sm text-amber-100">
                Alertas de validade e lembretes de seção
              </p>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-4 gap-3">
            <ResumoTopo
              icon={Pill}
              valor={resumo.total}
              label="Meds"
            />

            <ResumoTopo
              icon={Bell}
              valor={resumo.alertas}
              label="Alertas"
            />

            <ResumoTopo
              icon={ClipboardList}
              valor={resumo.lembretes}
              label="Lembretes"
            />

            <ResumoTopo
              icon={Clock3}
              valor={resumo.lembretesVencidos}
              label="Agora"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-3xl border border-gray-200 bg-white/90 p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900/90">
          <AbaBotao
            ativa={aba === "alertas"}
            onClick={() => setAba("alertas")}
            icon={BellRing}
            label="Alertas"
          />

          <AbaBotao
            ativa={aba === "lembretes"}
            onClick={() => setAba("lembretes")}
            icon={ClipboardList}
            label="Lembretes"
          />
        </div>

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

        {aba === "alertas" && (
          <AbaAlertas
            config={config}
            resumo={resumo}
            alertas={alertas}
            carregando={carregando}
            processando={processando}
            atualizarConfig={atualizarConfig}
            salvarConfig={salvarConfig}
            carregarMedicamentos={carregarMedicamentos}
            verificarAgora={verificarAgora}
            formatarData={formatarData}
            formatarDataHora={formatarDataHora}
          />
        )}

        {aba === "lembretes" && (
          <AbaLembretes
            lembretes={lembretes}
            novoLembrete={novoLembrete}
            setNovoLembrete={setNovoLembrete}
            adicionarLembrete={adicionarLembrete}
            removerLembrete={removerLembrete}
            alternarLembrete={alternarLembrete}
            marcarLembreteFeito={marcarLembreteFeito}
            analisarLembrete={analisarLembrete}
            montarDescricaoLembrete={montarDescricaoLembrete}
          />
        )}

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-800 shadow-xl dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <TriangleAlert size={22} />
            </div>

            <div>
              <p className="font-black">
                Sobre notificações
              </p>

              <p className="mt-1 text-sm">
                Esta fase verifica alertas quando o app está aberto ou quando você toca em verificar agora.
                Depois vamos evoluir para notificação real em segundo plano com service worker.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-gray-400">
          Alertas locais • radar de validade e seção ligado 🔔
        </div>
      </div>
    </>
  );
}

function AbaAlertas({
  config,
  resumo,
  alertas,
  carregando,
  processando,
  atualizarConfig,
  salvarConfig,
  carregarMedicamentos,
  verificarAgora,
  formatarData,
  formatarDataHora,
}) {
  return (
    <>
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
            {alertas.map((item, index) => (
              <CardAlerta
                key={`${item.med.id || item.med.nome || index}-${item.status}`}
                item={item}
                formatarData={formatarData}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AbaLembretes({
  lembretes,
  novoLembrete,
  setNovoLembrete,
  adicionarLembrete,
  removerLembrete,
  alternarLembrete,
  marcarLembreteFeito,
  analisarLembrete,
  montarDescricaoLembrete,
}) {
  return (
    <>
      <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Plus size={21} />
            Novo lembrete
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crie lembretes como olhar seção, conferir geladeira ou revisar prateleira
          </p>
        </div>

        <div className="space-y-3">
          <CampoTexto
            label="Título"
            value={novoLembrete.titulo}
            onChange={(v) =>
              setNovoLembrete((prev) => ({
                ...prev,
                titulo: v,
              }))
            }
            placeholder="Ex: Olhar seção"
          />

          <CampoTexto
            label="Seção"
            value={novoLembrete.secao}
            onChange={(v) =>
              setNovoLembrete((prev) => ({
                ...prev,
                secao: v,
              }))
            }
            placeholder="Ex: A-E, geladeira, infantil"
          />

          <CampoTexto
            label="Observação"
            value={novoLembrete.observacao}
            onChange={(v) =>
              setNovoLembrete((prev) => ({
                ...prev,
                observacao: v,
              }))
            }
            placeholder="Ex: conferir pré-vencidos e remoções"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                Repetição
              </span>

              <select
                value={novoLembrete.repeticao}
                onChange={(e) =>
                  setNovoLembrete((prev) => ({
                    ...prev,
                    repeticao: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="diario">Todo dia</option>
                <option value="semanal">Toda semana</option>
                <option value="unico">Uma vez</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                Horário
              </span>

              <input
                type="time"
                value={novoLembrete.hora}
                onChange={(e) =>
                  setNovoLembrete((prev) => ({
                    ...prev,
                    hora: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
          </div>

          {novoLembrete.repeticao === "semanal" && (
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                Dia da semana
              </span>

              <select
                value={novoLembrete.diaSemana}
                onChange={(e) =>
                  setNovoLembrete((prev) => ({
                    ...prev,
                    diaSemana: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-900"
              >
                {diasSemana.map((dia, index) => (
                  <option key={dia} value={String(index)}>
                    {dia}
                  </option>
                ))}
              </select>
            </label>
          )}

          {novoLembrete.repeticao === "unico" && (
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                Data
              </span>

              <input
                type="date"
                value={novoLembrete.data}
                onChange={(e) =>
                  setNovoLembrete((prev) => ({
                    ...prev,
                    data: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
          )}

          <button
            type="button"
            onClick={adicionarLembrete}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 font-bold text-white shadow-lg shadow-amber-600/20 transition active:scale-[0.98]"
          >
            <Plus size={20} />
            Criar lembrete
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <ClipboardList size={21} />
            Lembretes ativos
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tarefas de rotina para não deixar seção passar batido
          </p>
        </div>

        {lembretes.length === 0 ? (
          <div className="rounded-3xl bg-amber-50 p-8 text-center text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <ClipboardList className="mx-auto mb-3" size={36} />
            <p className="font-black">Nenhum lembrete ainda</p>
            <p className="mt-1 text-sm">
              Crie um lembrete para olhar seção, geladeira ou prateleira.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lembretes.map((lembrete) => {
              const analise = analisarLembrete(lembrete);

              return (
                <CardLembrete
                  key={lembrete.id}
                  lembrete={lembrete}
                  analise={analise}
                  descricao={montarDescricaoLembrete(lembrete)}
                  onToggle={() => alternarLembrete(lembrete.id)}
                  onDone={() => marcarLembreteFeito(lembrete.id)}
                  onRemove={() => removerLembrete(lembrete.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-900"
      />
    </label>
  );
}

function AbaBotao({
  ativa,
  onClick,
  icon: Icon,
  label,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex h-12 items-center justify-center gap-2 rounded-2xl font-black transition active:scale-95
        ${
          ativa
            ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }
      `}
    >
      <Icon size={19} />
      {label}
    </button>
  );
}

function ResumoTopo({
  icon: Icon,
  valor,
  label,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-1 text-amber-100" size={20} />

      <p className="text-xl font-black">
        {valor}
      </p>

      <p className="text-xs text-amber-100">
        {label}
      </p>
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
      {ok ? (
        <CheckCircle2 size={23} />
      ) : bloqueada ? (
        <X size={23} />
      ) : (
        <Bell size={23} />
      )}
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

function ToggleLinha({
  titulo,
  descricao,
  ativo,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gray-100 p-4 text-left transition active:scale-[0.98] dark:bg-gray-700/60"
    >
      <div>
        <p className="font-black text-gray-950 dark:text-white">
          {titulo}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {descricao}
        </p>
      </div>

      <div className={ativo ? "text-emerald-600" : "text-gray-400"}>
        {ativo ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
      </div>
    </button>
  );
}

function CardAlerta({
  item,
  formatarData,
}) {
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
              <p className={`font-black ${info.texto}`}>
                {item.titulo}
              </p>

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

function CardLembrete({
  lembrete,
  analise,
  descricao,
  onToggle,
  onDone,
  onRemove,
}) {
  const ativo = lembrete.ativo;
  const vencido = analise.status === "vencido";
  const feito = analise.status === "feito";

  return (
    <div
      className={`
        rounded-2xl border p-4
        ${
          !ativo
            ? "border-gray-200 bg-gray-100 opacity-75 dark:border-gray-700 dark:bg-gray-700/50"
            : vencido
            ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
            : feito
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
            : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700/60"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white
            ${
              !ativo
                ? "bg-gray-500"
                : vencido
                ? "bg-amber-600"
                : feito
                ? "bg-emerald-600"
                : "bg-blue-600"
            }
          `}
        >
          {feito ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-black text-gray-950 dark:text-white">
                {lembrete.titulo}
              </p>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                {descricao}
              </p>
            </div>

            <span
              className={`
                shrink-0 rounded-full px-3 py-1 text-xs font-black
                ${
                  !ativo
                    ? "bg-gray-200 text-gray-600"
                    : vencido
                    ? "bg-amber-600 text-white"
                    : feito
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                }
              `}
            >
              {!ativo ? "Pausado" : feito ? "Feito" : vencido ? "Agora" : "Ativo"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-gray-900/60">
              <Repeat size={13} className="mr-1 inline" />
              {lembrete.repeticao === "diario"
                ? "Todo dia"
                : lembrete.repeticao === "semanal"
                ? diasSemana[Number(lembrete.diaSemana)]
                : "Uma vez"}
            </span>

            <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-gray-900/60">
              <Clock3 size={13} className="mr-1 inline" />
              {lembrete.hora}
            </span>

            {lembrete.data && (
              <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-gray-900/60">
                {lembrete.data}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onDone}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-700 text-xs font-black text-white transition active:scale-95"
            >
              <Check size={15} />
              Feito
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 items-center justify-center rounded-xl bg-gray-700 text-xs font-black text-white transition active:scale-95"
            >
              {ativo ? "Pausar" : "Ativar"}
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-red-600 text-xs font-black text-white transition active:scale-95"
            >
              <Trash2 size={15} />
              Apagar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({
  toast,
  fechar,
}) {
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

export default Notificacoes;
