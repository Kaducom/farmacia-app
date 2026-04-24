import { useState } from "react";

function Doutor() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");

  function analisarSintomas(texto) {
    const t = texto.toLowerCase();

    // 🚨 sinais de alerta
    if (
      t.includes("falta de ar") ||
      t.includes("dor no peito") ||
      t.includes("convuls") ||
      t.includes("desmaio")
    ) {
      return {
        tipo: "grave",
        msg: "🚨 Sinais de alerta! Encaminhar imediatamente ao hospital.",
      };
    }

    // 🤒 febre / dor
    if (t.includes("febre") || t.includes("dor")) {
      return {
        tipo: "leve",
        msg: "💊 Pode considerar analgésicos ou antitérmicos (ex: dipirona, paracetamol).",
      };
    }

    // 🤧 gripe
    if (t.includes("gripe") || t.includes("resfriado") || t.includes("tosse")) {
      return {
        tipo: "leve",
        msg: "🌡️ Sintomas gripais: hidratação, repouso e sintomáticos podem ajudar.",
      };
    }

    // 🤢 estômago
    if (t.includes("enjoo") || t.includes("vomito") || t.includes("diarreia")) {
      return {
        tipo: "moderado",
        msg: "💧 Reposição de líquidos + antieméticos podem ser considerados.",
      };
    }

    return {
      tipo: "desconhecido",
      msg: "🤔 Não consegui identificar bem. Avalie melhor ou encaminhe para atendimento.",
    };
  }

  function responder() {
    setErro("");

    if (!pergunta.trim()) {
      setErro("Descreva os sintomas primeiro ⚠️");
      return;
    }

    const resultado = analisarSintomas(pergunta);
    setResposta(resultado);
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto text-black dark:text-white">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">
        🤖 Doutor Assistente
      </h1>

      {/* AVISO */}
      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 p-3 rounded-xl mb-4 text-sm">
        ⚠️ Assistente informativo. Não substitui avaliação médica.
      </div>

      {/* ERRO */}
      {erro && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-center">
          {erro}
        </div>
      )}

      {/* CARD */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-4">

        {/* INPUT */}
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Descreva os sintomas
          </label>
          <textarea
            rows={4}
            placeholder="Ex: febre, dor de cabeça, tosse..."
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* BOTÃO */}
        <button
          onClick={responder}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow"
        >
          Analisar
        </button>

        {/* RESPOSTA */}
        {resposta && (
          <div
            className={`p-4 rounded-xl text-sm ${
              resposta.tipo === "grave"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : resposta.tipo === "moderado"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {resposta.msg}
          </div>
        )}

      </div>
    </div>
  );
}

export default Doutor;