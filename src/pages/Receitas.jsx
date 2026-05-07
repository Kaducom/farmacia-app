import { useMemo, useState } from "react";
import FundoBolhas from "../components/FundoBolhas";

import {
  FileText,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  RotateCcw,
  X,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";

const tiposReceita = {
  controlado: {
    nome: "Controlado",
    dias: 30,
    desc: "Receitas de medicamentos controlados.",
  },
  antibiotico: {
    nome: "Antibiótico",
    dias: 10,
    desc: "Receitas de antibióticos.",
  },
  popular: {
    nome: "Uso contínuo / popular",
    dias: 180,
    desc: "Receitas com validade estendida.",
  },
  outros: {
    nome: "Outros",
    dias: null,
    desc: "Use uma validade personalizada.",
  },
};

function Receitas() {
  const [dataReceita, setDataReceita] = useState("");
  const [tipo, setTipo] = useState("controlado");
  const [diasValidade, setDiasValidade] = useState("");
  const [resultadoConfirmado, setResultadoConfirmado] = useState(null);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState(null);

  const hojeFormatado = new Date().toISOString().split("T")[0];

  const previa = useMemo(() => {
    return calcularResultado(dataReceita, tipo, diasValidade);
  }, [dataReceita, tipo, diasValidade]);

  const tipoAtual = tiposReceita[tipo];

  function confirmarValidade() {
    setErro("");

    if (!dataReceita) {
      setErro("Selecione a data da receita.");
      return;
    }

    if (tipo === "outros" && (!diasValidade || Number(diasValidade) <= 0)) {
      setErro("Informe a validade personalizada em dias.");
      return;
    }

    if (!previa) {
      setErro("Não foi possível calcular a validade.");
      return;
    }

    setResultadoConfirmado(previa);
    mostrarToast("Validade confirmada ✨", "ok");
  }

  function limpar() {
    setDataReceita("");
    setTipo("controlado");
    setDiasValidade("");
    setResultadoConfirmado(null);
    setErro("");
    mostrarToast("Consulta limpa 🧹", "info");
  }

  function alterarTipo(novoTipo) {
    setTipo(novoTipo);
    setDiasValidade("");
    setResultadoConfirmado(null);
    setErro("");
  }

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
    if (navigator.vibrate) navigator.vibrate(25);
    setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="blue" />

      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <div className="relative z-10 mx-auto max-w-5xl p-4 pb-28 text-gray-950 dark:text-white">
        <div className="mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 p-6 text-white shadow-2xl shadow-blue-950/25">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-xl backdrop-blur-md">
              <FileText size={28} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100/70">
                Consulta rápida
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight">
                Validade de Receita
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Prévia automática e resultado confirmado para usar rápido no balcão.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
            <div className="mb-5 flex gap-3 rounded-3xl bg-blue-50/90 p-4 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <Info size={20} className="shrink-0" />
              <p>
                A prévia aparece sozinha. Toque em confirmar para destacar o resultado oficial.
              </p>
            </div>

            {erro && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <AlertTriangle size={18} />
                {erro}
              </div>
            )}

            <Campo label="Data da receita" icon={CalendarDays}>
              <input
                type="date"
                max={hojeFormatado}
                value={dataReceita}
                onChange={(e) => {
                  setDataReceita(e.target.value);
                  setResultadoConfirmado(null);
                  setErro("");
                }}
                className="w-full rounded-2xl border border-gray-200 bg-gray-100 p-4 font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-800 dark:bg-gray-950"
              />
            </Campo>

            <div className="mt-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                <FileText size={16} className="text-blue-600 dark:text-blue-300" />
                Tipo de receita
              </label>

              <div className="grid grid-cols-2 gap-2">
                <BotaoTipo ativo={tipo === "controlado"} onClick={() => alterarTipo("controlado")} titulo="Controlado" subtitulo="30 dias" />
                <BotaoTipo ativo={tipo === "antibiotico"} onClick={() => alterarTipo("antibiotico")} titulo="Antibiótico" subtitulo="10 dias" />
                <BotaoTipo ativo={tipo === "popular"} onClick={() => alterarTipo("popular")} titulo="Popular" subtitulo="180 dias" />
                <BotaoTipo ativo={tipo === "outros"} onClick={() => alterarTipo("outros")} titulo="Outros" subtitulo="manual" />
              </div>
            </div>

            {tipo === "outros" && (
              <div className="mt-4">
                <Campo label="Validade personalizada" icon={Clock3}>
                  <input
                    inputMode="numeric"
                    placeholder="Ex: 60"
                    value={diasValidade}
                    onChange={(e) => {
                      setDiasValidade(e.target.value.replace(/\D/g, ""));
                      setResultadoConfirmado(null);
                      setErro("");
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-100 p-4 font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-800 dark:bg-gray-950"
                  />
                </Campo>
              </div>
            )}

            <div className="mt-5">
              <Previa previa={previa} formatarData={formatarData} />
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={confirmarValidade}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                <CheckCircle2 size={18} />
                Confirmar validade
              </button>

              <button
                type="button"
                onClick={limpar}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white font-black text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RotateCcw size={18} />
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {resultadoConfirmado ? (
              <Resultado resultado={resultadoConfirmado} formatarData={formatarData} />
            ) : (
              <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Sparkles size={30} />
                </div>

                <h2 className="mt-4 text-xl font-black">
                  Resultado confirmado aparece aqui
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  A prévia é discreta. Toque em confirmar para destacar a validade.
                </p>
              </div>
            )}

            <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
              <p className="text-sm font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Regra selecionada
              </p>

              <h3 className="mt-2 text-xl font-black">{tipoAtual.nome}</h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {tipoAtual.desc}
              </p>

              <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                <p className="text-sm font-bold">Validade usada</p>
                <p className="text-2xl font-black">
                  {tipo === "outros"
                    ? diasValidade
                      ? `${diasValidade} dias`
                      : "Personalizada"
                    : `${tipoAtual.dias} dias`}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 text-amber-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex gap-3">
                <ShieldCheck size={22} className="shrink-0" />
                <p className="text-sm">
                  Use como apoio rápido. Regras podem variar conforme norma, medicamento, legislação local e orientação do farmacêutico responsável.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calcularResultado(dataReceita, tipo, diasValidade) {
  if (!dataReceita) return null;

  const dias = tipo === "outros" ? Number(diasValidade) : tiposReceita[tipo]?.dias;
  if (!dias || dias <= 0) return null;

  const data = parseDataInput(dataReceita);
  const dataFinal = new Date(data);
  dataFinal.setDate(dataFinal.getDate() + dias);

  const diff = diferencaEmDias(dataFinal, new Date());

  let status = "valida";
  if (diff < 0) status = "vencida";
  else if (diff === 0) status = "venceHoje";
  else if (diff === 1) status = "venceAmanha";
  else if (diff <= 3) status = "venceLogo";

  return { status, dias, dataFinal, diff, tipo };
}

function Resultado({ resultado, formatarData }) {
  const item = pegarConfigResultado(resultado);
  const Icon = item.icon;

  return (
    <div className={`rounded-[2rem] border p-5 shadow-xl shadow-black/5 ${item.classes}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
          <Icon size={30} />
        </div>

        <div>
          <p className="text-sm font-bold opacity-70">Resultado confirmado</p>
          <h2 className="text-xl font-black">{item.titulo}</h2>
        </div>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <p className="text-6xl font-black leading-none">
          {Math.abs(resultado.diff)}
        </p>

        <div className="pb-2">
          <p className="text-sm font-black uppercase opacity-70">
            {resultado.diff < 0
              ? "dias vencida"
              : resultado.diff === 0
              ? "vence hoje"
              : "dias restantes"}
          </p>

          <p className="text-sm font-bold opacity-80">{item.texto}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <Mini label="Data final" valor={formatarData(resultado.dataFinal)} />
        <Mini label="Validade usada" valor={`${resultado.dias} dias`} />
      </div>
    </div>
  );
}

function Previa({ previa, formatarData }) {
  if (!previa) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950/70 dark:text-gray-400">
        A prévia aparece aqui quando a data e a regra estiverem completas.
      </div>
    );
  }

  const item = pegarConfigResultado(previa);

  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Prévia automática
          </p>

          <p className="mt-1 font-black">{item.titulo}</p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Final: {formatarData(previa.dataFinal)}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-black ${item.badge}`}>
          {previa.diff < 0
            ? `${Math.abs(previa.diff)}d vencida`
            : previa.diff === 0
            ? "hoje"
            : `${previa.diff}d`}
        </span>
      </div>
    </div>
  );
}

function pegarConfigResultado(resultado) {
  const configs = {
    valida: {
      icon: CheckCircle2,
      titulo: "Receita válida",
      texto: `Vence em ${resultado.diff} dia(s).`,
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
    venceAmanha: {
      icon: Clock3,
      titulo: "Vence amanhã",
      texto: "Atenção. Último dia útil próximo.",
      classes: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    },
    venceLogo: {
      icon: Clock3,
      titulo: "Últimos dias válidos",
      texto: `Vence em ${resultado.diff} dia(s).`,
      classes: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    },
    venceHoje: {
      icon: AlertTriangle,
      titulo: "Vence hoje",
      texto: "A validade termina hoje.",
      classes: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    },
    vencida: {
      icon: XCircle,
      titulo: "Receita vencida",
      texto: `Venceu há ${Math.abs(resultado.diff)} dia(s).`,
      classes: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
      badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
    },
  };

  return configs[resultado.status];
}

function BotaoTipo({ ativo, onClick, titulo, subtitulo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition active:scale-95 ${
        ativo
          ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
      }`}
    >
      <p className="font-black">{titulo}</p>
      <p className={`text-xs ${ativo ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
        {subtitulo}
      </p>
    </button>
  );
}

function Campo({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        <Icon size={16} className="text-blue-600 dark:text-blue-300" />
        {label}
      </label>
      {children}
    </div>
  );
}

function Mini({ label, valor }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 dark:bg-black/20">
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
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
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"}`}>
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

function parseDataInput(valor) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function diferencaEmDias(dataFinal, dataInicial) {
  const umDia = 1000 * 60 * 60 * 24;

  const inicio = new Date(dataInicial);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(dataFinal);
  fim.setHours(0, 0, 0, 0);

  return Math.ceil((fim - inicio) / umDia);
}

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

export default Receitas;