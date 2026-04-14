import { useEffect, useState } from "react";
import { db } from "../db";
import ToastStack from "../components/ToastStack";

function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [abrirModal, setAbrirModal] = useState(false);
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [diasPre, setDiasPre] = useState("");
  const [diasRemover, setDiasRemover] = useState(7);
  const [editando, setEditando] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busca, setBusca] = useState("");
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
     carregar();
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}, []);

  async function carregar() {
    const dados = await db.medicamentos.toArray();
    dados.sort((a, b) => new Date(a.validade) - new Date(b.validade));
    setMedicamentos(dados);
  }
  function notificarSistema(msg) {
  if (Notification.permission === "granted") {
    new Notification("FarmApp 💊", {
      body: msg,
    });
  }
}

function addToast(msg, tipo = "ok") {
  const id = Date.now();

  if (navigator.vibrate) navigator.vibrate(30);

  setToasts((prev) => [...prev, { id, msg, tipo }]);

  setTimeout(() => removerToast(id), 4000);
}

  function removerToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function salvar() {
    if (!nome || !validade) {
      addToast("Preencha os campos obrigatórios ⚠️");
      return;
      
    }
    if (navigator.vibrate) {
  navigator.vibrate(50);
}
    

    const dados = {
      nome,
      validade,
      imagem,
      diasRemover: Number(diasRemover),
      diasPreVencido: diasPre ? Number(diasPre) : null,
    };

    if (editando) {
      await db.medicamentos.update(editando.id, dados);
    } else {
      await db.medicamentos.add(dados);
    }

    limpar();
    setAbrirModal(false);
    carregar();
  }

  async function remover(id) {
    await db.medicamentos.delete(id);
    setConfirmar(null);
    carregar();
  }

  function limpar() {
    setNome("");
    setValidade("");
    setImagem(null);
    setDiasPre("");
    setDiasRemover(7);
    setEditando(null);
  }

  function handleImagem(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagem(reader.result);
    reader.readAsDataURL(file);
  }
  function gerarPreviewDatas() {
  if (!validade) return null;

  const validadeDate = new Date(validade);

  const removerDate = new Date(validadeDate);
  removerDate.setDate(removerDate.getDate() - Number(diasRemover || 0));

  let preDate = null;
  if (diasPre) {
    preDate = new Date(removerDate);
    preDate.setDate(preDate.getDate() - Number(diasPre));
  }

  return {
    validade: validadeDate,
    remover: removerDate,
    pre: preDate,
  };
}

  function calcularDatas(med) {
    const validade = new Date(med.validade);

    const remover = new Date(validade);
    remover.setDate(remover.getDate() - (med.diasRemover || 0));

    let pre = null;
    if (med.diasPreVencido) {
      pre = new Date(remover);
      pre.setDate(pre.getDate() - med.diasPreVencido);
    }

    return { validade, remover, pre };
  }

  function calcularStatus(med) {
    const hoje = new Date();
    const { validade, remover, pre } = calcularDatas(med);

    if (hoje >= validade) return "vencido";
    if (hoje >= remover) return "remover";
    if (pre && hoje >= pre) return "pre";
    return "ok";
  }

  function formatarData(data) {
    return new Date(data).toLocaleDateString();
  }

  const lista = medicamentos.filter((m) =>
    `${m.nome} ${m.validade}`.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 pb-28">

      <ToastStack notificacoes={toasts} remover={removerToast} />

      {/* 🔍 BUSCA */}
      <input
        placeholder="Buscar medicamento, data ou mg..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full mb-4 p-3 rounded-xl border bg-white dark:bg-gray-800 shadow"
      />

      {/* LISTA */}
      <div className="space-y-4">
        {lista.map((m) => {
          const status = calcularStatus(m);
          const { validade, remover, pre } = calcularDatas(m);

          return (
            <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">

              {m.imagem && (
                <img
                  src={m.imagem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(m.imagem);
                  }}
                  className="w-full h-40 object-cover cursor-pointer"
                />
              )}

              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="font-semibold">{m.nome}</p>

                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status === "vencido"
                      ? "bg-red-100 text-red-600"
                      : status === "remover"
                      ? "bg-orange-100 text-orange-600"
                      : status === "pre"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {status === "vencido"
                      ? "Vencido"
                      : status === "remover"
                      ? "Remover"
                      : status === "pre"
                      ? "Pré"
                      : "Em dia"}
                  </span>
                </div>

                <p>📅 Validade: {formatarData(validade)}</p>
                <p>🗑️ Remover em: {formatarData(remover)}</p>
                {pre && <p>⚠️ Pré-vencimento: {formatarData(pre)}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditando(m);
                      setNome(m.nome);
                      setValidade(m.validade);
                      setImagem(m.imagem);
                      setDiasPre(m.diasPreVencido || "");
                      setDiasRemover(m.diasRemover || 7);
                      setAbrirModal(true);
                    }}
                    className="flex-1 bg-blue-500 text-white py-1 rounded-full"
                  >
                    Editar
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmar(m);
                    }}
                    className="flex-1 bg-red-500 text-white py-1 rounded-full"
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
            limpar();
            setAbrirModal(true);
          }}
          className="fixed right-6 bottom-24 w-16 h-16 rounded-full bg-green-500 text-white text-3xl shadow-lg z-40"
        >
          +
        </button>
      )}

      {/* MODAL PREMIUM */}
      {abrirModal && (
  <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md flex items-center justify-center"
  >

    <div className="bg-[#0f172a] w-full max-w-md rounded-t-3xl p-6 space-y-5 shadow-2xl animate-slideUp">

      {/* TÍTULO */}
      <h2 className="text-xl font-semibold text-white">
        {editando ? "Editar Medicamento" : "Novo Medicamento"}
      </h2>

      {/* FOTO */}
      <label className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer hover:bg-white/5 transition">
        {imagem ? (
          <img
            src={imagem}
            className="w-24 h-24 mx-auto rounded-xl object-cover"
          />
        ) : (
          <div className="text-gray-400 text-sm">
            📷 Toque para adicionar foto
          </div>
        )}
        <input type="file" className="hidden" onChange={handleImagem} />
      </label>

      {/* NOME */}
      <div>
        <label className="text-sm text-gray-300">Nome do medicamento</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Dipirona 500mg"
          className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* VALIDADE */}
      <div>
        <label className="text-sm text-gray-300">Data de validade</label>
        <input
          type="date"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
          className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white"
        />
      </div>

      {/* REMOVER */}
      <div>
        <label className="text-sm text-gray-300">
          Dias para remover antes da validade
        </label>
        <input
          type="number"
          value={diasRemover}
          onChange={(e) => setDiasRemover(e.target.value)}
          placeholder="Ex: 7 dias"
          className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Produto deve sair da prateleira antes de vencer
        </p>
      </div>

      {/* PRE VENCIMENTO */}
      <div>
        <label className="text-sm text-gray-300">
          Pré-vencimento (opcional)
        </label>
        <input
          type="number"
          value={diasPre}
          onChange={(e) => setDiasPre(e.target.value)}
          placeholder="Ex: 15 dias antes da remoção"
          className="w-full mt-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Aviso antes da data de remoção
        </p>
      </div>
     {(() => {
  const preview = gerarPreviewDatas();
  if (!preview) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-300 space-y-1">
      <p>📅 Validade: {preview.validade.toLocaleDateString()}</p>
      <p>🗑️ Remover em: {preview.remover.toLocaleDateString()}</p>
      {preview.pre && (
        <p>⚠️ Pré-vencimento: {preview.pre.toLocaleDateString()}</p>
      )}
    </div>
  );
})()}

      {/* BOTÕES */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setAbrirModal(false)}
          className="flex-1 py-3 rounded-xl border border-white/20 text-white"
        >
          Cancelar
        </button>

        <button
          onClick={salvar}
          className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium shadow-lg active:scale-95 transition"
        >
          Salvar
        </button>
      </div>

    </div>
  </div>
)}

      {/* PREVIEW */}
      {preview && (
        <div onClick={() => setPreview(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <img src={preview} className="max-w-[90%] rounded-2xl" />
        </div>
      )}

      {/* CONFIRMAR */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center">
            <p>Excluir "{confirmar.nome}"?</p>

            <div className="flex gap-2 mt-3">
              <button onClick={() => remover(confirmar.id)} className="bg-red-500 text-white p-2 rounded-full w-full">
                Sim
              </button>

              <button onClick={() => setConfirmar(null)} className="bg-gray-300 p-2 rounded-full w-full">
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