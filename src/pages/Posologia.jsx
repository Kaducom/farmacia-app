import { useState } from "react";

function Posologia() {
  const [dose, setDose] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [dias, setDias] = useState("");
  const [resultado, setResultado] = useState(null);

  function calcular() {
    if (!dose || !frequencia || !dias) {
      alert("Preenche tudo 😄");
      return;
    }

    const total = dose * frequencia * dias;
    setResultado(total);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Posologia ⚖️</h1>

      <input
        type="number"
        placeholder="Dose por vez"
        value={dose}
        onChange={(e) => setDose(e.target.value)}
        className="border p-2 w-full rounded-xl mb-3"
      />

      <input
        type="number"
        placeholder="Vezes por dia"
        value={frequencia}
        onChange={(e) => setFrequencia(e.target.value)}
        className="border p-2 w-full rounded-xl mb-3"
      />

      <input
        type="number"
        placeholder="Dias de tratamento"
        value={dias}
        onChange={(e) => setDias(e.target.value)}
        className="border p-2 w-full rounded-xl mb-3"
      />

      <button
        onClick={calcular}
        className="bg-blue-500 text-white p-2 rounded-xl w-full"
      >
        Calcular
      </button>

      {resultado && (
        <p className="mt-4 text-lg font-bold">
          Total necessário: {resultado}
        </p>
      )}
    </div>
  );
}

export default Posologia;