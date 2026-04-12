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

  // 🔥 recalcula automático (sem botão)
  useEffect(() => {
    if (!dataReceita) {
      setResultado(null);
      return;
    }

    const hoje = new Date();
    const data = new Date(dataReceita);

    const limite = new Date(data);
    limite.setDate(limite.getDate() + Number(diasValidade));

    const status = hoje <= limite ? "valida" : "vencida";

    setResultado({
      status,
      dataFinal: limite,
    });
  }, [dataReceita, diasValidade]);

  async function salvar() {
    if (!resultado) {
      alert("Preenche a data primeiro 😄");
      return;
    }

    await db.receitas.add({
      dataReceita,
      diasValidade: Number(diasValidade),
      status: resultado.status,
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

  function formatarData(data) {
    return new Date(data).toLocaleDateString();
  }

  function calcularDataFinal(r) {
    const data = new Date(r.dataReceita);
    data.setDate(data.getDate() + r.diasValidade);
    return formatarData(data);
  }

  // 🔥 hoje formatado pra bloquear datas futuras
  const hojeFormatado = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl mx-auto text-black dark:text-white">

      <h1 className="text-2xl font-bold mb-4">Receitas 📄</h1>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md space-y-3 transition">

        <input
          type="date"
          max={hojeFormatado}
          value={dataReceita}
          onChange={(e) => setDataReceita(e.target.value)}
          className="border dark:border-gray-600 bg-white dark:bg-gray-700 p-2 w-full rounded-xl"
        />

        <input
          type="number"
          value={diasValidade}
          onChange={(e) => setDiasValidade(e.target.value)}
          className="border dark:border-gray-600 bg-white dark:bg-gray-700 p-2 w-full rounded-xl"
        />

        {/* 🔥 RESULTADO EM TEMPO REAL */}
        {resultado && (
          <div className="text-center font-semibold text-sm mt-2">
            {resultado.status === "valida" ? (
              <p className="text-green-600 dark:text-green-400">
                ✅ Receita válida até {formatarData(resultado.dataFinal)}
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400">
                ❌ Receita venceu em {formatarData(resultado.dataFinal)}
              </p>
            )}
          </div>
        )}

        <button
          onClick={salvar}
          className="bg-green-500 text-white p-2 rounded-full shadow-md w-full hover:scale-105 transition"
        >
          Salvar Receita
        </button>
      </div>

      {/* LISTA */}
      <div className="mt-6 space-y-2">
        {lista.map((r) => (
          <div
            key={r.id}
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl flex justify-between items-center transition"
          >
            <div>
              <p className="text-sm">
                📅 {formatarData(r.dataReceita)}
              </p>

              <p className="text-xs">
                {r.status === "valida"
                  ? `✅ Válida até ${calcularDataFinal(r)}`
                  : `❌ Venceu em ${calcularDataFinal(r)}`}
              </p>
            </div>

            <button
              onClick={() => remover(r.id)}
              className="bg-red-500 text-white px-3 py-1 rounded-full shadow"
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