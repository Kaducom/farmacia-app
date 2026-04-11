import { useState } from "react";

function Doutor() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  function responder() {
    if (!pergunta) return;

    // Simples por enquanto
    setResposta("Procure um analgésico ou antitérmico 💊");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Doutor 🤖</h1>

      <textarea
        placeholder="Descreva os sintomas..."
        value={pergunta}
        onChange={(e) => setPergunta(e.target.value)}
        className="border p-2 w-full rounded-xl mb-3"
      />

      <button
        onClick={responder}
        className="bg-blue-500 text-white p-2 rounded-xl w-full"
      >
        Perguntar
      </button>

      {resposta && (
        <p className="mt-4">{resposta}</p>
      )}
    </div>
  );
}

export default Doutor;