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
  const [editando, setEditando] = useState(null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [notificacao, setNotificacao] = useState(null);
  const [erro, setErro] = useState("");
  const [preview, setPreview] = useState(null);

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
    setConfirmar(null);
    carregar();
  }

  async function salvar() {
    if (!nome || !validade) {
      setErro("⚠️ Preencha nome e validade");
      return;
    }

    const dados = { nome, validade, imagem };

    if (editando) {
      await db.medicamentos.update(editando.id, dados);
    } else {
      await db.medicamentos.add(dados);
    }

    limparFormulario();
    setAbrirModal(false);
    carregar();
  }

  function limparFormulario() {
    setNome("");
    setValidade("");
    setImagem(null);
    setEditando(null);
    setErro("");
  }

  function abrirEdicao(med) {
    setEditando(med);
    setNome(med.nome);
    setValidade(med.validade);
    setImagem(med.imagem || null);
    setAbrirModal(true);
  }

  function verificarVencimentos(lista) {
    const hoje = new Date();
    for (let med of lista) {
      const validade = new Date(med.validade);
      const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

      if (diff <= 1) {
        setNotificacao(`⚠️ ${med.nome} vence hoje ou amanhã!`);
        return;
      }
    }
  }

  function diasRestantes(data) {
    const hoje = new Date();
    const validade = new Date(data);
    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
  }

  function formatarData(data) {
    return new Date(data).toLocaleDateString();
  }

  function calcularStatus(dias) {
    if (dias <= 0) return "vencido";
    if (dias <= 5) return "alerta";
    return "ok";
  }

  function handleImagem(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagem(reader.result);
    reader.readAsDataURL(file);
  }

  if (mostrarScanner) {
    return (
      <div className="p-4">
        <button
          onClick={() => setMostrarScanner(false)}
          className="bg-red-500 text-white px-4 py-2 rounded-full mb-4"
        >
          ⬅ Voltar
        </button>

        <Scanner
          onScan={(codigo) => {
            setMostrarScanner(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-3 pb-28">

      {notificacao && <Notificacao mensagem={notificacao} tipo="alerta" />}

      {/* LISTA */}
      <div className="space-y-4">
        {medicamentos.map((m) => {
          const dias = diasRestantes(m.validade);
          const status = calcularStatus(dias);

          return (
            <div
              key={m.id}
              onClick={() => m.imagem && setPreview(m.imagem)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden"
            >
              {m.imagem && (
                <img
                  src={m.imagem}
                  className="w-full h-40 object-cover"
                />
              )}

              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">{m.nome}</p>

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      status === "vencido"
                        ? "bg-red-100 text-red-600"
                        : status === "alerta"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {status === "vencido"
                      ? "Vencido"
                      : status === "alerta"
                      ? "Atenção"
                      : "Em dia"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p>📅 Validade: {formatarData(m.validade)}</p>
                  <p>
                    ⏳ Vence em {dias} dias
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirEdicao(m);
                    }}
                    className="flex-1 bg-blue-500 text-white py-1 rounded-full text-sm"
                  >
                    Editar
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmar(m);
                    }}
                    className="flex-1 bg-red-500 text-white py-1 rounded-full text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      {!abrirModal && (
        <button
          onClick={() => {
            limparFormulario();
            setAbrirModal(true);
          }}
          className="fixed right-6 bottom-24 z-40 w-16 h-16 rounded-full bg-blue-500 text-white text-3xl shadow-lg"
        >
          +
        </button>
      )}

      {/* MODAL */}
      {abrirModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl w-full max-w-sm space-y-3">

            <h2 className="font-bold text-lg">
              {editando ? "Editar" : "Adicionar"}
            </h2>

            {erro && (
              <div className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">
                {erro}
              </div>
            )}

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="p-2 w-full rounded-xl border"
            />

            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="p-2 w-full rounded-xl border"
            />

            <input type="file" onChange={handleImagem} />

            {imagem && (
              <img src={imagem} className="w-20 h-20 rounded-xl mx-auto" />
            )}

            <div className="flex gap-2">
              <button
                onClick={salvar}
                className="bg-blue-500 text-white p-2 rounded-full w-full"
              >
                Salvar
              </button>

              <button
                onClick={() => setAbrirModal(false)}
                className="bg-gray-300 p-2 rounded-full w-full"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW IMAGEM */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        >
          <img src={preview} className="max-w-[90%] rounded-2xl" />
        </div>
      )}

      {/* CONFIRMAR DELETE */}
      {confirmar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center space-y-3">
            <p>Deseja Excluir o Item "{confirmar.nome}"?</p>

            <div className="flex gap-2">
              <button
                onClick={() => remover(confirmar.id)}
                className="bg-red-500 text-white p-2 rounded-full w-full"
              >
                Sim
              </button>

              <button
                onClick={() => setConfirmar(null)}
                className="bg-gray-300 p-2 rounded-full w-full"
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