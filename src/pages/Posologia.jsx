import { useState } from "react";

function Posologia() {
  const [dose, setDose] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  function calcular() {
    setErro("");

    if (!dose || !frequencia || !dias) {
      setErro("Preencha todos os campos ⚠️");
      return;
    }

    const total = Number(dose) * Number(frequencia) * Number(dias);
    setResultado(total);
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto text-black dark:text-white">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">
        ⚖️ Posologia
      </h1>

      {/* ERRO */}
      {erro && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-center mb-4 shadow">
          {erro}
        </div>
      )}

      {/* CARD */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-4">

        {/* DOSE */}
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Dose por vez
          </label>
          <input
            type="number"
            placeholder="Ex: 2 comprimidos"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* FREQUÊNCIA */}
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Vezes por dia
          </label>
          <input
            type="number"
            placeholder="Ex: 3 vezes ao dia"
            value={frequencia}
            onChange={(e) => setFrequencia(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* DIAS */}
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Dias de tratamento
          </label>
          <input
            type="number"
            placeholder="Ex: 7 dias"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* BOTÃO */}
        <button
          onClick={calcular}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow"
        >
          Calcular
        </button>

        {/* RESULTADO */}
        {resultado !== null && (
          <div className="text-center p-4 rounded-xl bg-black/5 dark:bg-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total necessário
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {resultado}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Posologia;