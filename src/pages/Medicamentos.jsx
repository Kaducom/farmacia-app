import { useEffect, useState, useRef } from "react";
import { db } from "../db";
import ToastStack from "../components/ToastStack";
import Scanner from "../components/Scanner";
import { motion } from "framer-motion";
import CardMedicamento from "../components/medicamentos/CardMedicamento";
import BuscaMedicamentos from "../components/medicamentos/BuscaMedicamentos";
import FabMedicamentos from "../components/medicamentos/FabMedicamentos";
import ModalMedicamento from "../components/medicamentos/ModalMedicamento";

// =============================
// 💊 COMPONENTE PRINCIPAL
// =============================

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
  const [quantidade, setQuantidade] = useState(1);
  const [abrirScanner, setAbrirScanner] = useState(false);
  const [modoReposicao, setModoReposicao] = useState(false);
  const [inputValidadeRapida, setInputValidadeRapida] = useState(null); 

  
  // =============================
  // 🚀 INICIALIZAÇÃO
  // =============================

  useEffect(() => {
    carregar();
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  
  // =============================
  // 🔎 SCANNER / API
  // =============================

  async function buscarProdutoPorCodigo(codigo) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`);
    const data = await res.json();

    if (data.status === 1) {
      return {
        nome: data.product.product_name || "Produto desconhecido",
        marca: data.product.brands || "",
      };
    }

    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

  
  // =============================
  // 📦 BANCO DE DADOS
  // =============================

  async function carregar() {
    const dados = await db.medicamentos.toArray();
    dados.sort((a, b) => new Date(a.validade) - new Date(b.validade));
    dados.forEach((m) => {
  if (!m.quantidade) m.quantidade = 1;
});
    setMedicamentos(dados);
  }

  
  // =============================
  // 🔔 TOASTS
  // =============================

  function addToast(msg, tipo = "ok") {
    const id = Date.now();

    if (navigator.vibrate) navigator.vibrate(30);

    setToasts((prev) => [...prev, { id, msg, tipo }]);
    setTimeout(() => removerToast(id), 4000);
  }

  function removerToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  
  // =============================
  // 💾 SALVAR / EDITAR
  // =============================

  async function salvar() {
  const dataValida = parseDataSegura(validade);
  if (!dataValida || isNaN(dataValida.getTime())) {
  addToast("Data inválida ⚠️");
  return;
}

    const existente = medicamentos.find(
  (m) => m.nome.toLowerCase() === nome.toLowerCase()
);

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
    quantidade: Number(quantidade) || 1,
    };

    if (editando) {
  await db.medicamentos.update(editando.id, dados);
  } else if (existente) {
  await db.medicamentos.update(existente.id, {
    quantidade: (existente.quantidade || 1) + Number(quantidade || 1),
  });

  addToast("Quantidade atualizada 📦");
  } else {
  await db.medicamentos.add(dados);
  }

    limpar();
    setAbrirModal(false);
    setFabOpen(false);
    carregar();
    setQuantidade(1);
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

    const validadeDate = parseDataSegura(validade);

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
   const validade = parseDataSegura(med.validade);

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
  
  // =============================
  // 📅 DATAS
  // =============================

  function parseDataSegura(data) {
  if (!data) return null;

  // formato yyyy-mm-dd (input date)
 if (data.includes("/")) {
  const [dia, mes, ano] = data.split("/");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

  // fallback
  return new Date(data);
}

  const lista = medicamentos.filter((m) =>
    `${m.nome} ${m.validade}`.toLowerCase().includes(busca.toLowerCase())
  );

 async function iniciarScanner() {
  setAbrirScanner(true);
}

  // =============================
  // 📷 FLUXO DO SCANNER
  // =============================

  async function aoEscanear(codigo) {
  const produto = await buscarProdutoPorCodigo(codigo);
   if (!produto) {
    addToast("Não reconhecido 😕");
    return;
  }

  const nomeCompleto = `${produto.nome} ${produto.marca}`;
  const existente = medicamentos.find(
    (m) => m.nome.toLowerCase() === nomeCompleto.toLowerCase()
  );

  // 🔥 MODO REPOSIÇÃO ATIVO
  if (modoReposicao) {
    if (existente) {
      await db.medicamentos.update(existente.id, {
        quantidade: (existente.quantidade || 1) + 1,
      });

      addToast("📦 +1 somado");
      carregar();
      return;
    }

    // 🆕 novo produto → pede validade rápida
    setInputValidadeRapida({
      nome: nomeCompleto,
      codigo
    });

    return;
  }

  // 🧠 MODO NORMAL (seu fluxo antigo)
  setAbrirScanner(false);

  if (existente) {
    await db.medicamentos.update(existente.id, {
      quantidade: (existente.quantidade || 1) + 1,
    });

    addToast("Quantidade aumentada 📦");
    carregar();
    return;
  }

  setNome(nomeCompleto);
  setAbrirModal(true);
}

async function salvarRapido(validade) {
  const dataValida = parseDataSegura(validade);

  if (!dataValida || isNaN(dataValida.getTime())) {
    addToast("Data inválida ⚠️");
    return;
  }

  await db.medicamentos.add({
    nome: inputValidadeRapida.nome,
    validade,
    quantidade: 1,
    diasRemover: 7,
  });

  addToast("✨ Produto adicionado");

  setInputValidadeRapida(null);
  carregar();
}

  
  // =============================
  // 🎨 RENDER
  // =============================

  return (
    <div ref={topRef} className="p-4 pb-28 max-w-5xl mx-auto">

      {/* 🔍 BUSCA */}
     <BuscaMedicamentos
  busca={busca}
  setBusca={setBusca}
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
       Adicionar primeiro medicamento
    </button>
  </div>
)}
{/* LISTA */}
<div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">

  {lista.map((m) => (

    <CardMedicamento
      key={m.id}
      m={m}
      calcularStatus={calcularStatus}
      calcularDatas={calcularDatas}
      formatarData={formatarData}
      setPreview={setPreview}
      setConfirmar={setConfirmar}
      setEditando={setEditando}
      setNome={setNome}
      setValidade={setValidade}
      setImagem={setImagem}
      setDiasPre={setDiasPre}
      setDiasRemover={setDiasRemover}
      setAbrirModal={setAbrirModal}
      setFabOpen={setFabOpen}
    />
  ))}
</div>

<FabMedicamentos
  fabOpen={fabOpen}
  setFabOpen={setFabOpen}
  limpar={limpar}
  setAbrirModal={setAbrirModal}
  iniciarScanner={iniciarScanner}
/>

{/* MODAL */}
<ModalMedicamento
  abrirModal={abrirModal}
  setAbrirModal={setAbrirModal}
  editando={editando}
  imagem={imagem}
  setImagem={setImagem}
  nome={nome}
  setNome={setNome}
  quantidade={quantidade}
  setQuantidade={setQuantidade}
  validade={validade}
  setValidade={setValidade}
  diasRemover={diasRemover}
  setDiasRemover={setDiasRemover}
  diasPre={diasPre}
  setDiasPre={setDiasPre}
  gerarPreviewDatas={gerarPreviewDatas}
  salvar={salvar}
  handleImagem={handleImagem}
  toasts={toasts}
  removerToast={removerToast}
  ToastStack={ToastStack}
/>

      {/* PREVIEW */}
      {preview && (
        <div onClick={() => setPreview(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <img src={preview} className="max-w-[90%] rounded-2xl" />
        </div>
      )}

      {/* CONFIRMAR */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="
bg-white text-black
dark:bg-gray-800 dark:text-white
p-6 rounded-2xl text-center
">
            <p>Excluir "{confirmar.nome}"?</p>

            <div className="flex gap-2 mt-3">
              <button onClick={() => remover(confirmar.id)} className="bg-red-500 text-white p-2 rounded-full w-full">
                Sim
              </button>

              <button onClick={() => setConfirmar(null)} className="
bg-gray-300 text-black
dark:bg-gray-700 dark:text-white
p-2 rounded-full w-full
">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

  {inputValidadeRapida && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
    <div className="
bg-white text-black
dark:bg-gray-800 dark:text-white
p-6 rounded-2xl w-[90%] max-w-sm text-center space-y-4">
    <h2 className="font-semibold">
        📅 Validade rápida
      </h2>
      <p className="text-sm text-gray-500">
        {inputValidadeRapida.nome}
      </p>
      <input
        autoFocus
        placeholder="ddmmaaaa"
        onChange={(e) => {
          let v = e.target.value.replace(/\D/g, "").slice(0, 8);

          if (v.length === 8) {
            const formatada = v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");

            salvarRapido(formatada);
          }
        }}
        className="
w-full p-3 border rounded-xl text-center text-lg
bg-white text-black border-gray-300
dark:bg-gray-900 dark:text-white dark:border-gray-700
"
      />
      <button
        onClick={() => setInputValidadeRapida(null)}
        className="text-sm text-gray-400"
      >
        cancelar
      </button>

    </div>
  </div>
)}

{abrirScanner && (
  <Scanner
    onClose={() => setAbrirScanner(false)}
    onScan={aoEscanear}
  />)}
    </div>
  
);}

export default Medicamentos;