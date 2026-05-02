import { useState } from "react";

function Posologia() {
  const [dose, setDose] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [dias, setDias] = useState("");
  const [peso, setPeso] = useState("");
  const [usarPeso, setUsarPeso] = useState(false);
  const [mgPorKg, setMgPorKg] = useState("");
  const [mgPorComprimido, setMgPorComprimido] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  function calcular() {
    setErro("");

    let total = 0;

    // 🧠 modo por peso
    if (usarPeso) {
      if (!peso || !mgPorKg || !frequencia || !dias) {
        setErro("Preencha todos os campos ⚠️");
        return;
      }

      const dosePorVez = Number(peso) * Number(mgPorKg);
      total = dosePorVez * Number(frequencia) * Number(dias);

      setResultado({
        tipo: "peso",
        dosePorVez,
        totalMg: total,
      });

      return;
    }

    // 💊 modo normal
    if (!dose || !frequencia || !dias) {
      setErro("Preencha todos os campos ⚠️");
      return;
    }

    total = Number(dose) * Number(frequencia) * Number(dias);

    let comprimidos = null;

    if (mgPorComprimido) {
      comprimidos = Math.ceil(total / Number(mgPorComprimido));
    }

    setResultado({
      tipo: "normal",
      total,
      comprimidos,
    });
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto text-black dark:text-white">

      <h1 className="text-2xl font-bold mb-4">
        ⚖️ Posologia Inteligente
      </h1>

      {/* ERRO */}
      {erro && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-center">
          {erro}
        </div>
      )}

      {/* TOGGLE */}
      <div className="flex items-center justify-between mb-4">
        <span>Modo pediátrico (mg/kg)</span>
        <button
          onClick={() => setUsarPeso(!usarPeso)}
          className={`w-12 h-6 rounded-full ${usarPeso ? "bg-green-500" : "bg-gray-400"}`}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-4">

        {usarPeso ? (
          <>
            <input
              placeholder="Peso (kg)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-gray-700"
            />

            <input
              placeholder="mg por kg"
              value={mgPorKg}
              onChange={(e) => setMgPorKg(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-gray-700"
            />
          </>
        ) : (
          <>
            <input
              placeholder="Dose por vez"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-gray-700"
            />

            <input
              placeholder="mg por comprimido (opcional)"
              value={mgPorComprimido}
              onChange={(e) => setMgPorComprimido(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-gray-700"
            />
          </>
        )}

        <input
          placeholder="Vezes por dia"
          value={frequencia}
          onChange={(e) => setFrequencia(e.target.value)}
          className="w-full p-3 rounded-xl border dark:bg-gray-700"
        />

        <input
          placeholder="Dias"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
          className="w-full p-3 rounded-xl border dark:bg-gray-700"
        />

        <button
          onClick={calcular}
          className="w-full bg-blue-500 text-white py-3 rounded-xl"
        >
          Calcular
        </button>

        {/* RESULTADO */}
        {resultado && (
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl text-center space-y-2">

            {resultado.tipo === "peso" && (
              <>
                <p>Dose por vez:</p>
                <p className="text-xl font-bold text-blue-500">
                  {resultado.dosePorVez.toFixed(2)} mg
                </p>

                <p>Total do tratamento:</p>
                <p className="text-xl font-bold text-green-500">
                  {resultado.totalMg.toFixed(2)} mg
                </p>
              </>
            )}

            {resultado.tipo === "normal" && (
              <>
                <p>Total necessário:</p>
                <p className="text-xl font-bold text-green-500">
                  {resultado.total}
                </p>

                {resultado.comprimidos && (
                  <p className="text-sm text-blue-500">
                    ≈ {resultado.comprimidos} comprimidos
                  </p>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default Posologia;