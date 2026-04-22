import { useEffect, useState } from "react";
import { db } from "../db";
import ToastStack from "../components/ToastStack";
import { motion } from "framer-motion";
import { useRef } from "react";

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
  const [fabOpen, setFabOpen] = useState(false);
  const topRef = useRef(null);

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

    const existente = medicamentos.find(
  (m) => m.nome.toLowerCase() === nome.toLowerCase()
);

if (existente && !editando) {
  addToast("Esse medicamento já existe ⚠️");
  return;
}
    if (!nome || !validade) {
      addToast("Preencha os campos obrigatórios ⚠️");
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);

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
    setFabOpen(false);
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

  async function iniciarScanner() {
    addToast("Abrindo scanner... 📷");

    const produtoFake = {
      nome: "Dipirona 500mg",
      validade: "",
    };

    setNome(produtoFake.nome);
    setValidade(produtoFake.validade || "");
    setAbrirModal(true);
    setFabOpen(false);
  }
  function scrollTopo() {
  topRef.current?.scrollIntoView({ behavior: "smooth" });
}

  return (
    <div ref={topRef} className="p-4 pb-28 max-w-5xl mx-auto">

      {/* 🔍 BUSCA */}
      <input
        placeholder="Buscar medicamento, data ou mg..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full mb-4 p-3 rounded-xl border bg-white dark:bg-gray-800 shadow"
      />
      {lista.length === 0 && (
  <div className="text-center mt-20 space-y-4">
    <p className="text-gray-500">Nenhum medicamento cadastrado 💊</p>

    <button
      onClick={() => {
        limpar();
        setAbrirModal(true);
        setFabOpen(false);

      }}
      className="bg-green-800 text-white px-6 py-3 rounded-full shadow-lg"
    >
      + Adicionar primeiro medicamento
    </button>
  </div>
)}

      {/* LISTA */}
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {lista.map((m) => {
          const status = calcularStatus(m);
          const { validade, remover, pre } = calcularDatas(m);

          return (
            <motion.div
              key={m.id}
              drag="x"
              dragConstraints={{ left: 0, right: 100 }}
              dragElastic={0.2}
              dragMomentum={false}
              onDragEnd={(e, info) => {
                if (info.offset.x > 120) {
                  setConfirmar(m);
                }
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden"
            >

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
                  <p onClick={scrollTopo} className="font-semibold cursor-pointer">
                  {m.nome}
                  </p>

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
                    onClick={() => {
                      setEditando(m);
                      setNome(m.nome);
                      setValidade(m.validade);
                      setImagem(m.imagem);
                      setDiasPre(m.diasPreVencido || "");
                      setDiasRemover(m.diasRemover || 7);
                      setAbrirModal(true);
                      setFabOpen(false);
                    }}
                    className="flex-1 bg-blue-500 text-white py-1 rounded-full"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => setConfirmar(m)}
                    className="flex-1 bg-red-500 text-white py-1 rounded-full"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    {/* FAB */}
   <div className="fixed right-6 bottom-24 z-50 flex flex-col items-end gap-3">

  {/* MENU */}
  <motion.div
  initial={false}
  animate={fabOpen ? "open" : "closed"}
  className="flex flex-col items-end gap-3"
>

  {/* 💊 NOVO MEDICAMENTO */}
  <motion.button
    variants={{
      open: { opacity: 1, y: 0, scale: 1 },
      closed: { opacity: 0, y: 10, scale: 0.9 }
    }}
    transition={{ duration: 0.1 }}
    onClick={() => {
      limpar();
      setAbrirModal(true);
      setFabOpen(false);
    }}
    className="bg-green-800 text-white px-4 py-2 rounded-full shadow-lg"
  >
    💊 Novo Item
  </motion.button>

  {/* 📷 SCANNER */}
  <motion.button
    variants={{
      open: { opacity: 1, y: 0, scale: 1 },
      closed: { opacity: 0, y: 10, scale: 0.9 }
    }}
    transition={{ duration: 0.15 }}
    onClick={() => {
      iniciarScanner();
      setFabOpen(false);
    }}
    className="bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg"
  >
    📷 Scanner
  </motion.button>

</motion.div>

  {/* FAB */}
  <motion.button
    onClick={() => {
      if (navigator.vibrate) navigator.vibrate(15);
      setFabOpen(!fabOpen);
    }}
    animate={{ rotate: fabOpen ? 45 : 0 }}
    transition={{ duration: 0.2 }}
    className="w-16 h-16 rounded-full bg-green-800 text-white text-3xl shadow-xl flex items-center justify-center"
  >
    +
  </motion.button>

</div>

{fabOpen && (
  <div
    onClick={() => setFabOpen(false)}
    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-auto"
  />
)}

      {/* MODAL */}
{abrirModal && (
  <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md flex items-center justify-center">

    <div className="
      overflow-y-auto overscroll-contain bg-[#0f172a] w-full max-w-md rounded-t-3xl p-6 space-y-5 shadow-2xl animate-slideUpmax-h-[90vh] pb-28">
        
    <ToastStack notificacoes={toasts} remover={removerToast} />

      {/* TÍTULO */}
      <h2 className="text-xl font-semibold text-white">
        {editando ? "Editar Medicamento" : "Novo Medicamento"}
      </h2>

      {/* FOTO */}
<div>
  <label className="text-sm text-gray-300">Foto do Produto</label>

  <div className="mt-2 relative">

    {!imagem ? (
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-green-400/40 rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition text-center">

        <div className="w-12 h-12 rounded-full bg-green-800/20 flex items-center justify-center text-green-400 text-xl">
          📷
        </div>

        <div className="text-sm text-gray-300">
          Toque para adicionar foto
        </div>

        <div className="text-xs text-gray-500">
          PNG, JPG até 5MB
        </div>

        <input type="file" className="hidden" onChange={handleImagem} />
      </label>
    ) : (
      <div className="relative">
        <img
          src={imagem}
          className="w-full h-40 object-cover rounded-2xl"
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 rounded-2xl">

          <label className="bg-white text-black px-3 py-1 rounded-lg text-sm cursor-pointer">
            Trocar
            <input type="file" className="hidden" onChange={handleImagem} />
          </label>

          <button
            onClick={() => setImagem(null)}
            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
          >
            ✕
          </button>

        </div>
      </div>
    )}

  </div>
</div>

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
      }
      
      )()}

      {/* BOTÕES */}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-[#0f172a] pb-3 z-10">   
        <button
          onClick={() => setAbrirModal(false)}
          className="flex-1 py-3 rounded-xl border border-white/20 text-white"
        >
          Cancelar
        </button>

        <button
          onClick={salvar}
          className="flex-1 py-3 rounded-xl bg-green-800 text-white font-medium shadow-lg active:scale-95 transition"
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