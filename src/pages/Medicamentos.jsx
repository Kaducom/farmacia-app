import { useEffect, useState } from "react";
import { db } from "../db";
import Scanner from "../components/Scanner";
import Notificacao from "../components/Notificacao";

function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);

  const [imagem, setImagem] = useState(null);
  const [abrirModal, setAbrirModal] = useState(false);
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [diasRemover, setDiasRemover] = useState(7);
  const [diasPre, setDiasPre] = useState("");
  const [editando, setEditando] = useState(null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [notificacao, setNotificacao] = useState(null);

  async function carregar() {
    const dados = await db.medicamentos.toArray();
    setMedicamentos(dados);
    verificarVencimentos(dados);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function remover(id) {
    await db.medicamentos.delete(id);
    carregar();
  }

  async function buscarProduto(codigo) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`
      );

      const data = await res.json();

      if (data.status === 1) {
        const nomeProduto =
          data.product.product_name || "Produto não identificado";
        setNome(nomeProduto);
        alert("Produto encontrado 😄");
      } else {
        setNome("Produto não identificado");
        alert("Produto não encontrado 😢");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar produto");
    }
  }

  async function salvar() {
    if (!nome || !validade) {
      alert("Preenche tudo aí 😄");
      return;
    }

    try {
      const dados = {
        nome,
        validade,
        diasRemover: Number(diasRemover),
        diasPreVencido: diasPre ? Number(diasPre) : null,
        imagem,
      };

      if (editando) {
        await db.medicamentos.update(editando.id, dados);
      } else {
        await db.medicamentos.add(dados);
      }

      limparFormulario();
      setAbrirModal(false);
      carregar();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar 😢");
    }
  }

  function verificarVencimentos(lista) {
    const hoje = new Date();
    setNotificacao(null);

    for (let med of lista) {
      const validade = new Date(med.validade);
      const diff = Math.ceil(
        (validade - hoje) / (1000 * 60 * 60 * 24)
      );

      if (diff <= 1) {
        setNotificacao(`⚠️ ${med.nome} vence hoje ou amanhã!`);
        return;
      }
    }
  }

  function limparFormulario() {
    setNome("");
    setValidade("");
    setDiasRemover(7);
    setDiasPre("");
    setImagem(null);
    setEditando(null);
  }

  function abrirEdicao(med) {
    setEditando(med);
    setNome(med.nome);
    setValidade(med.validade);
    setDiasRemover(med.diasRemover);
    setDiasPre(med.diasPreVencido || "");
    setImagem(med.imagem || null);
    setAbrirModal(true);
  }

  function diasRestantes(data) {
    const hoje = new Date();
    const validade = new Date(data);

    const diff = Math.ceil(
      (validade - hoje) / (1000 * 60 * 60 * 24)
    );

    return diff < 0 ? 0 : diff;
  }

  function calcularStatus(med) {
    const hoje = new Date();
    const validade = new Date(med.validade);

    const remover = new Date(validade);
    remover.setDate(remover.getDate() - med.diasRemover);

    if (med.diasPreVencido) {
      const pre = new Date(validade);
      pre.setDate(pre.getDate() - med.diasPreVencido);

      if (hoje >= remover) return "remover";
      if (hoje >= pre) return "pre";
    }

    return "ok";
  }

  function handleImagem(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagem(reader.result);
    reader.readAsDataURL(file);
  }

  // 📷 SCANNER
  if (mostrarScanner) {
    return (
      <div className="p-4 dark:bg-gray-900 min-h-screen text-black dark:text-white">
        <button
          onClick={() => setMostrarScanner(false)}
          className="bg-red-500 text-white px-4 py-2 rounded-full shadow-md mb-4"
        >
          ⬅ Voltar
        </button>

        <Scanner
          onScan={(codigo) => {
            setMostrarScanner(false);
            buscarProduto(codigo);
          }}
        />
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 min-h-screen text-black dark:text-white p-2">

      {notificacao && (
        <Notificacao mensagem={notificacao} tipo="alerta" />
      )}

      {/* LISTA */}
      <div className="space-y-3">
        {medicamentos.map((m) => {
          const status = calcularStatus(m);
          const dias = diasRestantes(m.validade);

          return (
            <div
              key={m.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 flex gap-4 items-center"
            >
              {m.imagem && (
                <img
                  src={m.imagem}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold text-lg">{m.nome}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Vence em {dias} dias
                </p>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    status === "remover"
                      ? "bg-red-100 text-red-600"
                      : status === "pre"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {status === "remover"
                    ? "Remover"
                    : status === "pre"
                    ? "Pré-vencido"
                    : "Em dia"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => abrirEdicao(m)}
                  className="bg-blue-500 text-white px-4 py-1 rounded-full shadow-md text-sm"
                >
                  Editar
                </button>

                <button
                  onClick={() => setConfirmar(m)}
                  className="bg-red-500 text-white px-4 py-1 rounded-full shadow-md text-sm"
                >
                  X
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIRMAR DELETE */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center space-y-3">
            <p>Tem certeza que deseja excluir?</p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  remover(confirmar.id);
                  setConfirmar(null);
                }}
                className="bg-red-500 text-white p-2 rounded-full w-full shadow"
              >
                Sim
              </button>

              <button
                onClick={() => setConfirmar(null)}
                className="bg-gray-300 dark:bg-gray-600 p-2 rounded-full w-full"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTÃO + */}
      <button
        onClick={() => {
          limparFormulario();
          setAbrirModal(true);
        }}
        className="fixed bottom-20 right-4 bg-blue-500 text-white w-14 h-14 rounded-full shadow-xl text-2xl"
      >
        +
      </button>

      {/* MODAL */}
      {abrirModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md space-y-3">

            <h2 className="text-xl font-bold">
              {editando ? "Editar Medicamento" : "Adicionar Medicamento"}
            </h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border dark:border-gray-600 bg-white dark:bg-gray-700 p-2 w-full rounded-xl"
            />

            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="border dark:border-gray-600 bg-white dark:bg-gray-700 p-2 w-full rounded-xl"
            />

            <input
              type="number"
              value={diasRemover}
              onChange={(e) => setDiasRemover(e.target.value)}
              className="border dark:border-gray-600 bg-white dark:bg-gray-700 p-2 w-full rounded-xl"
            />

            <input
              type="number"
              value={diasPre}
              onChange={(e) => setDiasPre(e.target.value)}
              className="border dark:border-gray-600 bg-white dark:bg-gray-700 p-2 w-full rounded-xl"
            />

            <button
              onClick={() => setMostrarScanner(true)}
              className="bg-green-500 text-white p-2 rounded-full shadow-md w-full"
            >
              📷 Escanear código
            </button>

            <input
              type="file"
              accept="image/*"
              onChange={handleImagem}
              className="border dark:border-gray-600 p-2 w-full rounded-xl"
            />

            {imagem && (
              <img
                src={imagem}
                className="w-20 h-20 object-cover rounded-xl mx-auto"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={salvar}
                className="bg-blue-500 text-white p-2 rounded-full shadow-md w-full"
              >
                Salvar
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setAbrirModal(false);
                }}
                className="bg-gray-300 dark:bg-gray-600 p-2 rounded-full w-full"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Medicamentos;