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
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function calcularDataFinal(r) {
    const data = new Date(r.dataReceita);
    data.setDate(data.getDate() + r.diasValidade);
    return formatarData(data);
  }

  const hojeFormatado = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto text-black dark:text-white">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">
        📄 Receitas
      </h1>

      {/* ERRO */}
      {erro && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-center mb-4 shadow">
          ⚠️ {erro}
        </div>
      )}

      {/* CARD FORM */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-4">

        {/* DATA */}
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Data da receita
          </label>
          <input
            type="date"
            max={hojeFormatado}
            value={dataReceita}
            onChange={(e) => {
              setDataReceita(e.target.value);
              setErro("");
            }}
            className={`w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600
              ${!dataReceita && erro ? "border-red-500" : ""}
            `}
          />
        </div>

        {/* TIPO */}
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Tipo de receita
          </label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setErro("");
            }}
            className="w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="antibiotico">Antibiótico (10 dias)</option>
            <option value="controlado">Controlado (30 dias)</option>
            <option value="popular">Popular (180 dias)</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {/* OUTROS */}
        {tipo === "outros" && (
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">
              Dias de validade
            </label>
            <input
              type="number"
              placeholder="Ex: 45"
              value={diasValidade}
              onChange={(e) => {
                setDiasValidade(e.target.value);
                setErro("");
              }}
              className={`w-full mt-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600
                ${erro && !diasValidade ? "border-red-500" : ""}
              `}
            />
          </div>
        )}

        {/* RESULTADO */}
        {resultado && (
          <div className="text-center font-semibold text-sm p-3 rounded-xl bg-black/5 dark:bg-white/5">
            {resultado.status === "valida" ? (
              <p className="text-green-600 dark:text-green-400">
                ✅ Válida até {formatarData(resultado.dataFinal)}
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400">
                ❌ Venceu em {formatarData(resultado.dataFinal)}
              </p>
            )}
          </div>
        )}

        {/* BOTÕES */}
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={verificar}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl shadow"
          >
            Verificar
          </button>

          <button
            onClick={salvar}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="mt-6 space-y-3">
        {lista.map((r) => (
          <div
            key={r.id}
            className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex justify-between items-center shadow"
          >
            <div>
              <p className="font-medium">
                📅 {formatarData(r.dataReceita)}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {r.status === "valida"
                  ? `✅ Válida até ${calcularDataFinal(r)}`
                  : `❌ Venceu em ${calcularDataFinal(r)}`}
              </p>
            </div>

            <button
              onClick={() => remover(r.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-full"
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