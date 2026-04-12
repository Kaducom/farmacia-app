import { useEffect, useState } from "react";
import { db } from "../db";

function Receitas() {
  const [dataReceita, setDataReceita] = useState("");
  const [diasValidade, setDiasValidade] = useState("");
  const [resultado, setResultado] = useState(null);
  const [lista, setLista] = useState([]);
  const [tipo, setTipo] = useState("antibiotico");
  const [erro, setErro] = useState("");

  const tiposReceita = {
    antibiotico: 10,
    controlado: 30,
    popular: 180,
    outros: null,
  };

  async function carregar() {
    const dados = await db.receitas.toArray();
    setLista(dados.reverse());
  }

  useEffect(() => {
    carregar();
  }, []);

  function verificar() {
    setErro("");

    if (!dataReceita) {
      setErro("Selecione a data da receita");
      return;
    }

    let dias =
      tipo === "outros"
        ? Number(diasValidade)
        : tiposReceita[tipo];

    if (!dias || dias <= 0) {
      setErro("Informe os dias de validade");
      return;
    }

    const hoje = new Date();
    const data = new Date(dataReceita);

    const limite = new Date(data);
    limite.setDate(limite.getDate() + dias);

    const status = hoje <= limite ? "valida" : "vencida";

    setResultado({
      status,
      dataFinal: limite,
      dias,
    });
  }

  async function salvar() {
    if (!resultado) {
      setErro("Clique em verificar antes de salvar");
      return;
    }

    await db.receitas.add({
      dataReceita,
      diasValidade: resultado.dias,
      status: resultado.status,
    });

    setDataReceita("");
    setDiasValidade("");
    setResultado(null);
    setTipo("antibiotico");
    setErro("");

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

  const hojeFormatado = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl mx-auto text-black dark:text-white">

      <h1 className="text-2xl font-bold mb-4">Receitas 📄</h1>

      {/* ERRO BONITO */}
      {erro && (
        <div className="bg-red-100 text-red-600 p-3 rounded-xl text-center mb-3 animate-fadeIn">
          ⚠️ {erro}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md space-y-3">

        <input
          type="date"
          max={hojeFormatado}
          value={dataReceita}
          onChange={(e) => {
            setDataReceita(e.target.value);
            setErro("");
          }}
          className={`border p-2 w-full rounded-xl dark:bg-gray-700 dark:border-gray-600
            ${!dataReceita && erro ? "border-red-500" : ""}
          `}
        />

        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setErro("");
          }}
          className="border p-2 w-full rounded-xl dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="antibiotico">Antibiótico (10 dias)</option>
          <option value="controlado">Controlado (30 dias)</option>
          <option value="popular">Popular (180 dias)</option>
          <option value="outros">Outros</option>
        </select>

        {tipo === "outros" && (
          <input
            type="number"
            placeholder="Dias de validade"
            value={diasValidade}
            onChange={(e) => {
              setDiasValidade(e.target.value);
              setErro("");
            }}
            className={`border p-2 w-full rounded-xl dark:bg-gray-700 dark:border-gray-600
              ${erro && !diasValidade ? "border-red-500" : ""}
            `}
          />
        )}

        {/* RESULTADO */}
        {resultado && (
          <div className="text-center font-semibold text-sm">
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
          onClick={verificar}
          className="bg-blue-500 text-white p-2 rounded-full shadow-md w-full"
        >
          Verificar
        </button>

        <button
          onClick={salvar}
          className="bg-green-500 text-white p-2 rounded-full shadow-md w-full"
        >
          Salvar Receita
        </button>
      </div>

      {/* LISTA */}
      <div className="mt-6 space-y-2">
        {lista.map((r) => (
          <div
            key={r.id}
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl flex justify-between items-center"
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
              className="bg-red-500 text-white px-3 py-1 rounded-full"
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