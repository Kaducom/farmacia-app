import { useEffect, useState } from "react";
import { db } from "../db";
import Scanner from "../components/Scanner";

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

  async function carregar() {
    const dados = await db.medicamentos.toArray();
    setMedicamentos(dados);
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
      return false;
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

      return true;
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar 😢");
      return false;
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
    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
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

  // 🔥 SCANNER COMO TELA SEPARADA (ANTI BUG)
  if (mostrarScanner) {
    return (
      <div className="p-4">
        <button
          onClick={() => setMostrarScanner(false)}
          className="bg-red-500 text-white p-2 rounded-xl mb-4"
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Medicamentos 💊</h1>

      {/* LISTA */}
      <div className="space-y-3">
        {medicamentos.map((m) => {
          const status = calcularStatus(m);
          const dias = diasRestantes(m.validade);

          const cor =
            status === "remover"
              ? "bg-red-200"
              : status === "pre"
              ? "bg-yellow-200"
              : "bg-green-200";

          return (
            <div
              key={m.id}
              className={`p-4 rounded-2xl shadow-md ${cor} flex justify-between items-center`}
            >
              <div>
                {m.imagem && (
                  <img
                    src={m.imagem}
                    className="w-16 h-16 object-cover rounded-xl mb-2"
                  />
                )}

                <p className="font-bold text-lg">{m.nome}</p>
                <p className="text-sm text-gray-600">
                  Validade: {m.validade}
                </p>

                <p className="text-xs font-semibold mt-1">
                  {status === "remover" && `⚠️ Remover em ${dias} dias`}
                  {status === "pre" && `🟡 Pré-vencido`}
                  {status === "ok" && `🟢 Vence em ${dias} dias`}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => abrirEdicao(m)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-xl"
                >
                  Editar
                </button>

                <button
                  onClick={() => {
                    if (confirm("Tem certeza?")) remover(m.id);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  X
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTÃO + */}
      <button
        onClick={() => {
          limparFormulario();
          setAbrirModal(true);
        }}
        className="fixed bottom-6 right-6 bg-blue-500 text-white text-3xl w-14 h-14 rounded-full shadow-lg"
      >
        +
      </button>

      {/* MODAL */}
      {abrirModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            className="bg-white p-6 rounded-2xl w-full max-w-md space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">
              {editando ? "Editar Medicamento" : "Adicionar Medicamento"}
            </h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border p-2 w-full rounded-xl"
            />

            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="border p-2 w-full rounded-xl"
            />

            <input
              type="number"
              value={diasRemover}
              onChange={(e) => setDiasRemover(e.target.value)}
              className="border p-2 w-full rounded-xl"
              placeholder="Dias para remover"
            />

            <input
              type="number"
              value={diasPre}
              onChange={(e) => setDiasPre(e.target.value)}
              className="border p-2 w-full rounded-xl"
              placeholder="Pré-vencido (opcional)"
            />

            <button
              onClick={() => setMostrarScanner(true)}
              className="bg-green-500 text-white p-2 rounded-xl w-full"
            >
              📷 Escanear código
            </button>

            <input
              type="file"
              accept="image/*"
              onChange={handleImagem}
              className="border p-2 w-full rounded-xl"
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
                className="bg-blue-500 text-white p-2 rounded-xl w-full"
              >
                Salvar
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setAbrirModal(false);
                }}
                className="bg-gray-200 p-2 rounded-xl w-full"
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