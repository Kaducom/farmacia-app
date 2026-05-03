import { useEffect, useRef, useState } from "react";
import { db } from "../db";
import { AnimatePresence, motion } from "framer-motion";

import {
  BadgeCheck,
  Boxes,
  Camera,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Pencil,
  Pill,
  RotateCcw,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  TriangleAlert,
  User,
  X,
} from "lucide-react";

const PERFIL_KEY = "farmaciaPerfil";

const perfilInicial = {
  nome: "Usuário",
  farmacia: "Minha Farmácia",
  descricao: "Controle local de medicamentos",
  avatar: null,
  criadoEm: null,
  atualizadoEm: null,
};

const resumoInicial = {
  medicamentos: 0,
  unidades: 0,
  receitas: 0,
  produtosCodigo: 0,
  mapeamentos: 0,
};

function Perfil() {
  const inputAvatarRef = useRef(null);

  const [perfil, setPerfil] = useState(perfilInicial);
  const [resumo, setResumo] = useState(resumoInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmarReset, setConfirmarReset] = useState(false);

  useEffect(() => {
    carregarPerfil();
    carregarResumo();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function carregarPerfil() {
    try {
      const salvo = localStorage.getItem(PERFIL_KEY);

      if (!salvo) return;

      const dados = JSON.parse(salvo);

      setPerfil({
        ...perfilInicial,
        ...dados,
      });
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      mostrarToast("Erro ao carregar perfil 😕", "erro");
    }
  }

  async function carregarResumo() {
    try {
      setCarregando(true);

      const [medicamentos, receitas, produtosCodigo, mapeamentos] =
        await Promise.all([
          db.medicamentos.toArray(),
          db.receitas.count(),
          db.produtosCodigo.count(),
          db.mapeamentos.count(),
        ]);

      const unidades = medicamentos.reduce((total, item) => {
        return total + Number(item.quantidade || 1);
      }, 0);

      setResumo({
        medicamentos: medicamentos.length,
        unidades,
        receitas,
        produtosCodigo,
        mapeamentos,
      });
    } catch (err) {
      console.error("Erro ao carregar resumo:", err);
      mostrarToast("Erro ao carregar estatísticas 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setPerfil((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function escolherAvatar() {
    inputAvatarRef.current?.click();
  }

  function handleAvatar(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      mostrarToast("Escolha uma imagem válida ⚠️", "erro");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPerfil((prev) => ({
        ...prev,
        avatar: reader.result,
      }));

      mostrarToast("Avatar carregado ✨", "ok");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function salvarPerfil() {
    try {
      setSalvando(true);

      const agora = new Date().toISOString();

      const dados = {
        ...perfil,
        nome: perfil.nome.trim() || "Usuário",
        farmacia: perfil.farmacia.trim() || "Minha Farmácia",
        descricao: perfil.descricao.trim() || "Controle local de medicamentos",
        criadoEm: perfil.criadoEm || agora,
        atualizadoEm: agora,
      };

      localStorage.setItem(PERFIL_KEY, JSON.stringify(dados));

      setPerfil(dados);

      window.dispatchEvent(new Event("perfilFarmaciaAtualizado"));

      mostrarToast("Perfil salvo com sucesso 💚", "ok");
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      mostrarToast("Erro ao salvar perfil 😕", "erro");
    } finally {
      setSalvando(false);
    }
  }

  function removerAvatar() {
    setPerfil((prev) => ({
      ...prev,
      avatar: null,
    }));

    mostrarToast("Avatar removido 🧹", "ok");
  }

  function resetarPerfil() {
    localStorage.removeItem(PERFIL_KEY);

    setPerfil(perfilInicial);
    setConfirmarReset(false);

    window.dispatchEvent(new Event("perfilFarmaciaAtualizado"));

    mostrarToast("Perfil resetado com sucesso 🔄", "ok");
  }

  function formatarData(data) {
    if (!data) return "Ainda não salvo";

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) return "Ainda não salvo";

    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <AnimatePresence>
        {confirmarReset && (
          <ModalResetar
            cancelar={() => setConfirmarReset(false)}
            confirmar={resetarPerfil}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-6 text-white shadow-2xl">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-emerald-300/10" />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/15 shadow-2xl backdrop-blur-md">
                {perfil.avatar ? (
                  <img
                    src={perfil.avatar}
                    alt={perfil.nome || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </div>

              <button
                type="button"
                onClick={escolherAvatar}
                className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-xl transition active:scale-95"
              >
                <Camera size={20} />
              </button>

              <input
                ref={inputAvatarRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
            </div>

            <h1 className="mt-5 text-2xl font-black">
              {perfil.nome || "Usuário"}
            </h1>

            <p className="mt-1 flex items-center justify-center gap-2 text-sm text-emerald-100">
              <Store size={16} />
              {perfil.farmacia || "Minha Farmácia"}
            </p>

            <p className="mt-3 max-w-sm text-sm text-white/80">
              {perfil.descricao || "Controle local de medicamentos"}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Selo icon={ShieldCheck} texto="Dados locais" />
              <Selo icon={BadgeCheck} texto="PWA" />
              <Selo icon={Pill} texto="Farmácia" />
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <Pencil size={21} />
                Editar perfil
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personalize a identidade do app
              </p>
            </div>

            {perfil.avatar && (
              <button
                type="button"
                onClick={removerAvatar}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 transition active:scale-95"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <Campo
              label="Seu nome"
              value={perfil.nome}
              onChange={(valor) => atualizarCampo("nome", valor)}
              placeholder="Ex: Kadu"
              icon={User}
            />

            <Campo
              label="Nome da farmácia"
              value={perfil.farmacia}
              onChange={(valor) => atualizarCampo("farmacia", valor)}
              placeholder="Ex: Farmácia do Kadu"
              icon={Store}
            />

            <CampoTexto
              label="Descrição"
              value={perfil.descricao}
              onChange={(valor) => atualizarCampo("descricao", valor)}
              placeholder="Ex: Controle dos medicamentos de casa"
            />
          </div>

          <button
            type="button"
            onClick={salvarPerfil}
            disabled={salvando}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60"
          >
            {salvando ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Salvar Perfil
          </button>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <BadgeCheck size={21} />
                Estatísticas
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Resumo real dos dados do app
              </p>
            </div>

            <button
              type="button"
              onClick={carregarResumo}
              disabled={carregando}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white transition active:scale-95 disabled:opacity-60"
            >
              {carregando ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <RotateCcw size={20} />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CardResumo
              icon={Pill}
              titulo="Medicamentos"
              valor={resumo.medicamentos}
              descricao="itens cadastrados"
            />

            <CardResumo
              icon={Boxes}
              titulo="Unidades"
              valor={resumo.unidades}
              descricao="quantidade total"
            />

            <CardResumo
              icon={FileText}
              titulo="Receitas"
              valor={resumo.receitas}
              descricao="receitas salvas"
            />

            <CardResumo
              icon={Store}
              titulo="Base Local"
              valor={resumo.produtosCodigo}
              descricao="produtos aprendidos"
            />

            <CardResumo
              icon={History}
              titulo="Mapeamentos"
              valor={resumo.mapeamentos}
              descricao="históricos salvos"
              full
            />
          </div>
        </div>

        {/* DETALHES */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <ShieldCheck size={21} />
            Dados do perfil
          </h2>

          <div className="mt-4 space-y-3">
            <LinhaDetalhe
              label="Criado em"
              valor={formatarData(perfil.criadoEm)}
            />

            <LinhaDetalhe
              label="Atualizado em"
              valor={formatarData(perfil.atualizadoEm)}
            />

            <LinhaDetalhe
              label="Armazenamento"
              valor="Local neste dispositivo"
            />
          </div>
        </div>

        {/* RESET */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-600 transition active:scale-[0.98] dark:text-red-300"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                <RotateCcw size={20} />
              </div>

              <div className="text-left">
                <p className="font-black">Resetar Perfil</p>
                <p className="text-xs text-red-500 dark:text-red-300">
                  Voltar para os dados padrão
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-2 text-center text-xs text-gray-400">
          Perfil local • identidade da farmácia 💚
        </div>
      </div>
    </>
  );
}

function Selo({ icon: Icon, texto }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
      <Icon size={14} />
      {texto}
    </span>
  );
}

function Campo({ label, value, onChange, placeholder, icon: Icon }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
        <Icon size={17} />
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
    </label>
  );
}

function CampoTexto({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
        <Pencil size={17} />
        {label}
      </span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
    </label>
  );
}

function CardResumo({ icon: Icon, titulo, valor, descricao, full = false }) {
  return (
    <div
      className={`
        rounded-2xl border border-gray-200 bg-gray-100 p-4
        dark:border-gray-700 dark:bg-gray-700/60
        ${full ? "col-span-2" : ""}
      `}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {titulo}
        </p>

        <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      <p className="text-2xl font-black">{valor}</p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

function LinhaDetalhe({ label, valor }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-700/60">
      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="text-right text-sm font-black text-gray-900 dark:text-white">
        {valor}
      </p>
    </div>
  );
}

function ModalResetar({ cancelar, confirmar }) {
  return (
    <motion.div
      onClick={cancelar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 14, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <TriangleAlert size={28} />
        </div>

        <h2 className="text-center text-lg font-black">Resetar perfil?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Isso apaga nome, farmácia, descrição e avatar. Os medicamentos,
          receitas, backups e mapeamentos não serão apagados.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-red-600 font-bold text-white transition active:scale-95"
          >
            Resetar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";

  return (
    <div className="fixed left-1/2 top-5 z-[100000] w-[92%] max-w-sm -translate-x-1/2">
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white
            ${erro ? "bg-red-500" : "bg-emerald-600"}
          `}
        >
          {erro ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

export default Perfil;