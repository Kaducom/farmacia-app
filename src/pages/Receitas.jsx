import { useEffect, useState } from "react";
import { db } from "../db";

import {
  FileText,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";

function Receitas() {
  const [dataReceita, setDataReceita] = useState("");
  const [tipo, setTipo] = useState("controlado");
  const [diasValidade, setDiasValidade] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState(null);
  const [historico, setHistorico] = useState([]);

  const tiposReceita = {
    controlado: 30,
    antibiotico: 10,
    popular: 180,
    outros: null,
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    const dados = await db.receitas.toArray();
    setHistorico(dados.reverse());
  }

  function mostrarToast(msg, tipo = "ok") {
    const id = Date.now();
    setToast({ id, msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      setToast(null);
    }, 2800);
  }

  const hojeFormatado = new Date().toISOString().split("T")[0];

  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function calcularDiferencaDias(dataFinal) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const final = new Date(dataFinal);
    final.setHours(0, 0, 0, 0);

    return Math.ceil((final - hoje) / (1000 * 60 * 60 * 24));
  }

  function verificar() {
    setErro("");
    setResultado(null);

    if (!dataReceita) {
      setErro("Selecione a data da receita.");
      return;
    }

    const dias =
      tipo === "outros" ? Number(diasValidade) : tiposReceita[tipo];

    if (!dias || dias <= 0) {
      setErro("Informe uma validade válida em dias.");
      return;
    }

    const data = new Date(`${dataReceita}T00:00:00`);
    const dataFinal = new Date(data);
    dataFinal.setDate(dataFinal.getDate() + dias);

    const diff = calcularDiferencaDias(dataFinal);

    let status = "valida";

    if (diff < 0) status = "vencida";
    else if (diff === 0) status = "venceHoje";
    else if (diff <= 3) status = "venceLogo";

    setResultado({
      status,
      dias,
      dataFinal,
      diff,
    });
  }

  async function salvarConsulta() {
    if (!resultado) {
      setErro("Verifique a validade antes de salvar.");
      return;
    }

    try {
      await db.receitas.add({
        nome: `Consulta rápida - ${nomeTipo(tipo)}`,
        dataReceita,
        diasValidade: resultado.dias,
        status: resultado.status === "vencida" ? "vencida" : "valida",
        tipo,
        criadoEm: new Date().toISOString(),
      });

      await carregarHistorico();

      mostrarToast("Receita salva com sucesso ✨", "ok");
      setErro("");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao salvar receita 😕", "erro");
    }
  }

  async function remover(id) {
    try {
      await db.receitas.delete(id);
      await carregarHistorico();
      mostrarToast("Receita removida 🗑️", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao remover receita 😕", "erro");
    }
  }

  function limpar() {
    setDataReceita("");
    setTipo("controlado");
    setDiasValidade("");
    setResultado(null);
    setErro("");
  }

  function calcularFinalHistorico(r) {
    const data = new Date(`${r.dataReceita}T00:00:00`);
    data.setDate(data.getDate() + Number(r.diasValidade || 0));
    return data;
  }

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24 text-gray-950 dark:text-white">
      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <FileText size={24} />
        </div>

        <div>
          <h1 className="text-xl font-black tracking-tight">
            Validade de Receita
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Veja rapidamente se a receita ainda vale.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-xl shadow-black/5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 rounded-3xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          Informe a data da receita e o tipo. O app calcula se ainda está
          válida, se vence hoje, em quantos dias vence ou há quantos dias
          venceu.
        </div>

        {erro && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle size={18} />
            {erro}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Campo label="Data da receita" icon={CalendarDays}>
            <input
              type="date"
              max={hojeFormatado}
              value={dataReceita}
              onChange={(e) => {
                setDataReceita(e.target.value);
                setResultado(null);
                setErro("");
              }}
              className="w-full rounded-2xl bg-gray-100 p-4 outline-none focus:ring-4 focus:ring-blue-500/15 dark:bg-gray-950"
            />
          </Campo>

          <Campo label="Tipo de receita" icon={FileText}>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setResultado(null);
                setErro("");
              }}
              className="w-full rounded-2xl bg-gray-100 p-4 outline-none focus:ring-4 focus:ring-blue-500/15 dark:bg-gray-950"
            >
              <option value="controlado">Controlado (30 dias)</option>
              <option value="antibiotico">Antibiótico (10 dias)</option>
              <option value="popular">Popular (180 dias)</option>
              <option value="outros">Outros</option>
            </select>
          </Campo>

          {tipo === "outros" && (
            <Campo label="Validade personalizada" icon={Clock3}>
              <input
                inputMode="numeric"
                placeholder="Ex: 60"
                value={diasValidade}
                onChange={(e) => {
                  setDiasValidade(e.target.value.replace(/\D/g, ""));
                  setResultado(null);
                  setErro("");
                }}
                className="w-full rounded-2xl bg-gray-100 p-4 outline-none focus:ring-4 focus:ring-blue-500/15 dark:bg-gray-950"
              />
            </Campo>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={verificar}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
          >
            <CheckCircle2 size={18} />
            Ver validade
          </button>

          <button
            type="button"
            onClick={limpar}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white font-bold text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RotateCcw size={18} />
            Limpar
          </button>
        </div>

        {resultado && (
          <>
            <Resultado resultado={resultado} formatarData={formatarData} />

            <button
              type="button"
              onClick={salvarConsulta}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95"
            >
              <Save size={18} />
              Salvar consulta, se precisar
            </button>
          </>
        )}
      </div>

      {historico.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Histórico salvo
          </h2>

          <div className="space-y-3">
            {historico.map((r) => {
              const final = calcularFinalHistorico(r);
              const diff = calcularDiferencaDias(final);
              const vencida = diff < 0;

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-lg shadow-black/5 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div>
                    <p className="font-black">{r.nome || "Receita"}</p>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Receita: {formatarData(`${r.dataReceita}T00:00:00`)}
                    </p>

                    <p
                      className={`mt-1 text-sm font-bold ${
                        vencida
                          ? "text-red-500"
                          : diff <= 3
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {vencida
                        ? `Venceu há ${Math.abs(diff)} dia(s)`
                        : diff === 0
                        ? "Vence hoje"
                        : `Vence em ${diff} dia(s)`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remover(r.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";

  return (
    <div className="fixed left-1/2 top-5 z-[99999] w-[92%] max-w-sm -translate-x-1/2">
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

function Resultado({ resultado, formatarData }) {
  const config = {
    valida: {
      icon: CheckCircle2,
      titulo: "Receita válida",
      texto: `Vence em ${resultado.diff} dia(s).`,
      cor: "emerald",
    },
    venceLogo: {
      icon: Clock3,
      titulo: "Receita quase vencendo",
      texto: `Vence em ${resultado.diff} dia(s).`,
      cor: "amber",
    },
    venceHoje: {
      icon: AlertTriangle,
      titulo: "Vence hoje",
      texto: "A validade termina hoje.",
      cor: "amber",
    },
    vencida: {
      icon: XCircle,
      titulo: "Receita vencida",
      texto: `Venceu há ${Math.abs(resultado.diff)} dia(s).`,
      cor: "red",
    },
  };

  const item = config[resultado.status];
  const Icon = item.icon;

  const cores = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    red:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  };

  return (
    <div className={`mt-5 rounded-3xl border p-5 ${cores[item.cor]}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
          <Icon size={30} />
        </div>

        <div>
          <p className="text-sm font-bold opacity-70">Resultado</p>
          <h2 className="text-xl font-black">{item.titulo}</h2>
        </div>
      </div>

      <p className="mt-4 text-lg font-bold">{item.texto}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Mini label="Data final" valor={formatarData(resultado.dataFinal)} />
        <Mini label="Validade usada" valor={`${resultado.dias} dias`} />
      </div>
    </div>
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

function nomeTipo(tipo) {
  const nomes = {
    controlado: "Controlado",
    antibiotico: "Antibiótico",
    popular: "Popular",
    outros: "Outros",
  };

  return nomes[tipo] || "Receita";
}

export default Receitas;