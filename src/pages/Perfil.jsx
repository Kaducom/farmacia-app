import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Camera,
  Save,
  Trash2,
  Building2,
  BadgeCheck,
  Layers3,
  ShieldCheck,
  X,
  Copy,
  Fingerprint,
} from "lucide-react";
import FundoBolhas from "../components/FundoBolhas";

const PERFIL_KEY = "farmaciaPerfil";

const perfilPadrao = {
  nome: "Usuário",
  farmacia: "Painel local do estoque",
  cargo: "Auxiliar",
  secao: "Geral",
  avatar: null,
};

function Perfil() {
  const [perfil, setPerfil] = useState(perfilPadrao);
  const [toast, setToast] = useState(null);
  const { usuarioAtual, garantirMeuPublicId } = useAuth();

  useEffect(() => {
    carregarPerfil();
  }, []);

  function carregarPerfil() {
    try {
      const salvo = localStorage.getItem(PERFIL_KEY);

      if (!salvo) {
        setPerfil(perfilPadrao);
        return;
      }

      setPerfil({
        ...perfilPadrao,
        ...JSON.parse(salvo),
      });
    } catch (err) {
      console.error(err);
      setPerfil(perfilPadrao);
    }
  }

  function atualizarCampo(campo, valor) {
    setPerfil((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function salvarPerfil() {
    const dados = {
      ...perfil,
      nome: perfil.nome.trim() || "Usuário",
      farmacia: perfil.farmacia.trim() || "Painel local do estoque",
      cargo: perfil.cargo || "Auxiliar",
      secao: perfil.secao || "Geral",
      atualizadoEm: new Date().toISOString(),
    };

    localStorage.setItem(PERFIL_KEY, JSON.stringify(dados));
    window.dispatchEvent(new Event("perfilFarmaciaAtualizado"));

    setPerfil(dados);
    mostrarToast("Perfil salvo com sucesso ✨", "ok");
  }

  function removerPerfil() {
    localStorage.removeItem(PERFIL_KEY);
    window.dispatchEvent(new Event("perfilFarmaciaAtualizado"));

    setPerfil(perfilPadrao);
    mostrarToast("Perfil resetado 🧹", "info");
  }

  function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      mostrarToast("Imagem muito grande. Use até 2MB ⚠️", "erro");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      atualizarCampo("avatar", reader.result);
    };

    reader.readAsDataURL(file);
  }

  function copiarId() {
    if (!usuarioAtual?.publicId) return;

    navigator.clipboard.writeText(usuarioAtual.publicId);
    mostrarToast("ID copiado 📋", "ok");

    if (navigator.vibrate) navigator.vibrate(20);
  }

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(25);

    setTimeout(() => setToast(null), 2800);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <div className="relative z-10 mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-emerald-800 to-emerald-950 p-6 text-white shadow-2xl shadow-emerald-950/25">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-emerald-300/10" />

          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/20 shadow-xl backdrop-blur-md">
                {perfil.avatar ? (
                  <img
                    src={perfil.avatar}
                    alt={perfil.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-lg transition active:scale-95">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatar}
                  className="hidden"
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-3xl font-black">
                {perfil.nome || usuarioAtual?.nome || "Usuário"}
              </p>

              <p className="mt-1 text-sm text-green-100">
                {perfil.farmacia || "Painel local do estoque"}
              </p>

<div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
  <Chip>{perfil.cargo || "Auxiliar"}</Chip>
  <Chip>Seção {perfil.secao || "Geral"}</Chip>

  <Chip>
    {usuarioAtual?.tipo === "admin"
      ? "👑 Admin"
      : "👤 Usuário"}
  </Chip>

  <Chip>Firebase ativo</Chip>
</div>

{/* 🔥 ID PÚBLICO */}
{/* 🔥 ID PÚBLICO */}
<div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">

  <div className="flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-green-100/50">
        ID
      </p>

      {usuarioAtual?.publicId ? (
        <p className="mt-1 text-lg font-black tracking-[0.18em] text-white">
          {usuarioAtual.publicId}
        </p>
      ) : (
        <p className="mt-1 text-sm text-yellow-200">
          Nenhum ID gerado
        </p>
      )}
    </div>

    {usuarioAtual?.publicId && (
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(usuarioAtual.publicId);

          if (navigator.vibrate) navigator.vibrate(20);

          mostrarToast("ID copiado ✨");
        }}
        className="
          flex h-10 w-10 items-center justify-center
          rounded-2xl bg-white/90 text-emerald-700
          shadow-lg transition active:scale-90
        "
      >
        <Copy size={18} />
      </button>
    )}
  </div>

  {!usuarioAtual?.publicId && (
    <button
      type="button"
      onClick={async () => {
        const novoId = await garantirMeuPublicId();

        if (novoId) {
          mostrarToast("ID gerado ✨");
        } else {
          mostrarToast("Erro ao gerar ID ⚠️", "erro");
        }
      }}
      className="
        mt-4 w-full rounded-2xl
        bg-gradient-to-r from-yellow-400 to-amber-500
        py-2.5 text-sm font-black text-black
        shadow-lg transition active:scale-95
      "
    >
      ✨ Gerar ID
    </button>
  )}

</div>

            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <h2 className="mb-1 text-lg font-black">Dados do perfil</h2>

          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Essas informações ficam salvas neste dispositivo e aparecem no Menu.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              icon={User}
              label="Nome"
              value={perfil.nome}
              placeholder="Ex: Kadu"
              onChange={(v) => atualizarCampo("nome", v)}
            />

            <CampoTexto
              icon={Building2}
              label="Farmácia / unidade"
              value={perfil.farmacia}
              placeholder="Ex: Farmácia Central"
              onChange={(v) => atualizarCampo("farmacia", v)}
            />

            <CampoSelect
              icon={BadgeCheck}
              label="Cargo"
              value={perfil.cargo}
              onChange={(v) => atualizarCampo("cargo", v)}
              options={[
                "Auxiliar",
                "Atendente",
                "Farmacêutico",
                "Responsável",
                "Admin",
              ]}
            />

            <CampoSelect
              icon={Layers3}
              label="Seção responsável"
              value={perfil.secao}
              onChange={(v) => atualizarCampo("secao", v)}
              options={[
                "Geral",
                "A-E",
                "F-J",
                "K-O",
                "P-T",
                "U-Z",
                "Controlados",
                "Geladeira",
                "Balcão",
                "Estoque",
              ]}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={salvarPerfil}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-95"
            >
              <Save size={20} />
              Salvar perfil
            </button>

            <button
              type="button"
              onClick={removerPerfil}
              className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 active:scale-95"
            >
              <Trash2 size={20} />
              Resetar
            </button>
          </div>
        </div>

        {/* CARD INFO */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-black">Conta e perfil</p>
              <p className="mt-1 text-sm">
                O login já está na nuvem. Este perfil visual ainda fica salvo neste aparelho.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampoTexto({ icon: Icon, label, value, placeholder, onChange }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
        <Icon size={16} />
        {label}
      </label>

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      />
    </div>
  );
}

function CampoSelect({ icon: Icon, label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
        <Icon size={16} />
        {label}
      </label>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      >
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
      {children}
    </span>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <div className="fixed left-1/2 top-5 z-[99999] w-[92%] max-w-sm -translate-x-1/2">
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : info
              ? "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
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