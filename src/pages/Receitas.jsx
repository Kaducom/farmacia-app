import { useEffect, useState } from "react";
import { db } from "../db";

function Receitas() {
  const [dataReceita, setDataReceita] = useState("");
  const [diasValidade, setDiasValidade] = useState(30);
  const [resultado, setResultado] = useState(null);
  const [lista, setLista] = useState([]);

  async function carregar() {
    const dados = await db.receitas.toArray();
    setLista(dados.reverse());
  }

  useEffect(() => {
    carregar();
  }, []);

  function verificar() {
    if (!dataReceita) {
      alert("Coloca a data da receita 😄");
      return;
    }

    const hoje = new Date();
    const data = new Date(dataReceita);

    const limite = new Date(data);
    limite.setDate(limite.getDate() + Number(diasValidade));

    const status = hoje <= limite ? "valida" : "vencida";

    setResultado(status);
  }

  async function salvar() {
    if (!resultado) {
      alert("Verifica primeiro 😄");
      return;
    }

    await db.receitas.add({
      dataReceita,
      diasValidade: Number(diasValidade),
      status: resultado
    });

    setDataReceita("");
    setDiasValidade(30);
    setResultado(null);

    carregar();
  }

  async function remover(id) {
    await db.receitas.delete(id);
    carregar();
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Receitas 📄</h1>

      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <input
          type="date"
          value={dataReceita}
          onChange={(e) => setDataReceita(e.target.value)}
          className="border p-2 w-full rounded-xl"
        />

        <input
          type="number"
          value={diasValidade}
          onChange={(e) => setDiasValidade(e.target.value)}
          className="border p-2 w-full rounded-xl"
        />

        <button
          onClick={verificar}
          className="bg-blue-500 text-white p-2 rounded-xl w-full"
        >
          Verificar
        </button>

        {resultado && (
          <div className="text-center font-bold">
            {resultado === "valida" ? (
              <p className="text-green-600">✅ Válida</p>
            ) : (
              <p className="text-red-600">❌ Vencida</p>
            )}
          </div>
        )}

        <button
          onClick={salvar}
          className="bg-green-500 text-white p-2 rounded-xl w-full"
        >
          Salvar Receita
        </button>
      </div>

      {/* LISTA */}
      <div className="mt-6 space-y-2">
        {lista.map((r) => (
          <div
            key={r.id}
            className="bg-gray-100 p-3 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="text-sm">
                📅 {r.dataReceita}
              </p>
              <p className="text-xs">
                {r.status === "valida" ? "✅ Válida" : "❌ Vencida"}
              </p>
            </div>

            <button
              onClick={() => remover(r.id)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Receitas;