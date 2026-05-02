import { useState } from "react";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Info,
  LifeBuoy,
  RotateCcw,
  Search,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";

function Doutor() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState("");

  const sinaisGraves = [
    "falta de ar",
    "dor no peito",
    "convuls",
    "desmaio",
    "confusão",
    "lábios roxos",
    "sangramento intenso",
    "rigidez na nuca",
    "fraqueza em um lado",
    "perda de consciência",
  ];

  const categorias = [
    {
      tipo: "grave",
      titulo: "Sinais de alerta",
      palavras: sinaisGraves,
      icon: ShieldAlert,
      mensagem:
        "Procure atendimento urgente. Alguns sintomas descritos podem indicar risco e precisam de avaliação presencial.",
      acoes: [
        "Não espere os sintomas piorarem.",
        "Evite automedicação.",
        "Procure pronto atendimento ou serviço de emergência.",
      ],
    },
    {
      tipo: "moderado",
      titulo: "Sintomas gastrointestinais",
      palavras: ["enjoo", "náusea", "vomito", "vômito", "diarreia", "dor abdominal"],
      icon: LifeBuoy,
      mensagem:
        "Pode haver risco de desidratação, principalmente em crianças, idosos ou se houver vômitos repetidos.",
      acoes: [
        "Observe hidratação e frequência dos sintomas.",
        "Procure atendimento se houver sangue, febre alta, dor forte ou piora.",
        "Siga apenas medicamentos orientados por profissional ou receita.",
      ],
    },
    {
      tipo: "leve",
      titulo: "Sintomas gripais",
      palavras: ["gripe", "resfriado", "tosse", "coriza", "nariz entupido", "espirro"],
      icon: HeartPulse,
      mensagem:
        "Sintomas respiratórios leves costumam melhorar com cuidados gerais, mas precisam de atenção se evoluírem.",
      acoes: [
        "Repouso e hidratação ajudam bastante.",
        "Observe febre persistente, falta de ar ou piora.",
        "Evite misturar remédios sem orientação.",
      ],
    },
    {
      tipo: "leve",
      titulo: "Febre ou dor",
      palavras: ["febre", "dor", "dor de cabeça", "dor no corpo", "mal estar"],
      icon: Stethoscope,
      mensagem:
        "Febre e dor podem ter várias causas. Acompanhe intensidade, duração e outros sintomas.",
      acoes: [
        "Meça a temperatura, se possível.",
        "Procure atendimento se a febre for alta, persistente ou vier com sinais de alerta.",
        "Use medicamentos apenas conforme orientação segura/receita.",
      ],
    },
    {
      tipo: "moderado",
      titulo: "Possível alergia",
      palavras: ["alergia", "coceira", "urticária", "inchaço", "manchas"],
      icon: AlertTriangle,
      mensagem:
        "Sintomas alérgicos merecem atenção, principalmente se houver inchaço no rosto, língua ou dificuldade para respirar.",
      acoes: [
        "Se houver falta de ar ou inchaço importante, procure urgência.",
        "Anote possíveis alimentos, remédios ou produtos usados recentemente.",
        "Evite repetir algo que possa ter causado a reação.",
      ],
    },
  ];

  function analisarSintomas(texto) {
    const t = texto.toLowerCase();

    const encontrados = categorias.filter((cat) =>
      cat.palavras.some((p) => t.includes(p))
    );

    if (encontrados.some((c) => c.tipo === "grave")) {
      return encontrados.find((c) => c.tipo === "grave");
    }

    if (encontrados.some((c) => c.tipo === "moderado")) {
      return encontrados.find((c) => c.tipo === "moderado");
    }

    if (encontrados.length > 0) {
      return encontrados[0];
    }

    return {
      tipo: "desconhecido",
      titulo: "Não identificado com segurança",
      icon: Info,
      mensagem:
        "Não consegui identificar um padrão claro. Descreva melhor os sintomas ou procure avaliação profissional.",
      acoes: [
        "Informe idade, duração dos sintomas e intensidade.",
        "Diga se existe febre, dor, vômitos, alergia ou falta de ar.",
        "Em caso de dúvida ou piora, procure atendimento.",
      ],
    };
  }

  function responder() {
    setErro("");

    if (!pergunta.trim()) {
      setErro("Descreva os sintomas primeiro.");
      return;
    }

    setResposta(analisarSintomas(pergunta));
  }

  function limpar() {
    setPergunta("");
    setResposta(null);
    setErro("");
  }

  const RespostaIcon = resposta?.icon;

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24 text-gray-950 dark:text-white">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
          <Bot size={24} />
        </div>

        <div>
          <h1 className="text-xl font-black tracking-tight">
            Doutor Assistente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Triagem informativa por sintomas.
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle size={22} className="mt-0.5 shrink-0" />
        <p>
          Este assistente não substitui médico, farmacêutico ou atendimento de
          urgência. Ele apenas organiza sinais e orientações gerais.
        </p>
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle size={18} />
          {erro}
        </div>
      )}

      <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-xl shadow-black/5 dark:border-gray-800 dark:bg-gray-900">
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
          <ClipboardList size={17} className="text-cyan-600" />
          Descreva os sintomas
        </label>

        <textarea
          rows={5}
          placeholder="Ex: febre há 2 dias, tosse, dor no corpo..."
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          className="w-full resize-none rounded-3xl border border-transparent bg-gray-100 p-4 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 dark:bg-gray-950 dark:text-white"
        />

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={responder}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 active:scale-95"
          >
            <Search size={18} />
            Analisar
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

        {resposta && (
          <div
            className={`
              mt-5 rounded-3xl border p-4
              ${
                resposta.tipo === "grave"
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                  : resposta.tipo === "moderado"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
                  : resposta.tipo === "leve"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
              }
            `}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
                <RespostaIcon size={22} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase opacity-70">
                  Resultado informativo
                </p>
                <h2 className="text-lg font-black">{resposta.titulo}</h2>
              </div>
            </div>

            <p className="text-sm font-medium">{resposta.mensagem}</p>

            <div className="mt-4 space-y-2">
              {resposta.acoes.map((acao) => (
                <div key={acao} className="flex gap-2 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{acao}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Doutor;