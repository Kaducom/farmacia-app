import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  Briefcase,
  Camera,
  CheckCircle2,
  Clipboard,
  Cloud,
  CloudOff,
  Copy,
  ImagePlus,
  LogOut,
  Mail,
  Moon,
  Pencil,
  ReceiptText,
  Save,
  Shield,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
  X,
} from "lucide-react";

import FundoBolhas from "../components/FundoBolhas";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/ThemeContext";

function Perfil() {
  const {
    usuarioAtual,
    isAdmin,
    isVisitante,
    logout,
    atualizarMeuPerfil,
    garantirMeuPublicId,
  } = useAuth();

  const { theme, toggleTheme } = useTheme();

  const fotoInputRef = useRef(null);

  const [nome, setNome] = useState(usuarioAtual?.nome || "");
  const [fotoPerfil, setFotoPerfil] = useState(usuarioAtual?.fotoPerfil || null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmarSair, setConfirmarSair] = useState(false);

  const dark = theme === "dark";

  const nomeExibido =
    usuarioAtual?.nome ||
    (isVisitante ? "Visitante" : usuarioAtual?.email || "Usuário");

  const nomePreview = editando ? nome || nomeExibido : nomeExibido;

  const cargoExibido = formatarCargoUsuario(usuarioAtual, {
    isAdmin,
    isVisitante,
  });

  const setoresExibidos = formatarSetoresUsuario(usuarioAtual, {
    isAdmin,
    isVisitante,
  });

  const statusConta = isVisitante
    ? "Visitante"
    : isAdmin
    ? "Administrador"
    : "Conta ativa";

  const sincronizacao = isVisitante ? "Local" : "Nuvem ativa";

  useEffect(() => {
    if (!editando) {
      setNome(usuarioAtual?.nome || "");
      setFotoPerfil(usuarioAtual?.fotoPerfil || null);
    }
  }, [usuarioAtual?.nome, usuarioAtual?.fotoPerfil, editando]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: confirmarSair },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );
    };
  }, [confirmarSair]);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }

    setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  async function escolherFoto(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      mostrarToast("Escolha uma imagem válida", "erro");
      return;
    }

    try {
      const compactada = await compactarImagemPerfil(file);
      setFotoPerfil(compactada);
      mostrarToast("Foto preparada 📸", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Não consegui carregar a imagem", "erro");
    }
  }

  function abrirSeletorFoto() {
    if (!editando || isVisitante) return;
    fotoInputRef.current?.click();
  }

  function removerFoto() {
    if (!editando || isVisitante) return;

    setFotoPerfil(null);
    mostrarToast("Foto removida", "info");
  }

  async function salvarPerfil() {
    if (isVisitante) {
      mostrarToast(
        "Visitante usa Receitas e Posologia sem conta. Para salvar perfil na nuvem, crie uma conta.",
        "info"
      );
      return;
    }

    if (!nome.trim()) {
      mostrarToast("Digite seu nome", "erro");
      return;
    }

    setSalvando(true);

    const res = await atualizarMeuPerfil({
      nome: nome.trim(),
      fotoPerfil,
    });

    setSalvando(false);

    if (!res.ok) {
      mostrarToast(res.erro || "Erro ao salvar perfil", "erro");
      return;
    }

    setEditando(false);
    mostrarToast("Perfil atualizado ✨", "ok");
  }

  function cancelarEdicao() {
    setNome(usuarioAtual?.nome || "");
    setFotoPerfil(usuarioAtual?.fotoPerfil || null);
    setEditando(false);
  }

  async function copiarId() {
    const id = usuarioAtual?.publicId;

    if (!id || isVisitante) {
      mostrarToast("Conta visitante não tem ID público fixo", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(id);
      mostrarToast("ID copiado 📋", "ok");
    } catch {
      mostrarToast("Não foi possível copiar o ID", "erro");
    }
  }

  async function gerarId() {
    if (isVisitante) {
      mostrarToast("Visitante não gera ID público", "info");
      return;
    }

    const id = await garantirMeuPublicId();

    if (!id) {
      mostrarToast("Não foi possível gerar ID", "erro");
      return;
    }

    mostrarToast(`ID pronto: ${id}`, "ok");
  }

  async function confirmarLogout() {
    setConfirmarSair(false);
    await logout();
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarSair && (
          <ModalConfirmarSair
            isVisitante={isVisitante}
            onCancel={() => setConfirmarSair(false)}
            onConfirm={confirmarLogout}
          />
        )}
      </AnimatePresence>

      <input
        ref={fotoInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/*"
        className="hidden"
        onClick={(e) => {
          e.currentTarget.value = "";
        }}
        onChange={escolherFoto}
      />

      <div className="relative z-10 mx-auto max-w-5xl space-y-5 p-4 pb-32 text-gray-950 dark:text-white">
        {/* HERO */}
        <section
          className="
            relative overflow-hidden rounded-[2.3rem]
            bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950
            p-5 text-white shadow-2xl shadow-emerald-950/30 sm:p-6
          "
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 left-6 h-52 w-52 rounded-full bg-emerald-300/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%)]" />

          <div className="relative mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
                <Sparkles size={14} />
                Minha conta
              </p>

              <h1 className="mt-0.5 truncate text-xl font-black sm:text-2xl">
                Perfil
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setConfirmarSair(true)}
              className="
                flex h-11 shrink-0 items-center gap-2 rounded-2xl
                border border-red-200/20 bg-red-500/20 px-3 text-sm font-black
                text-white shadow-lg backdrop-blur-md transition hover:bg-red-500/30
                active:scale-95 sm:px-4
              "
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarPerfil
              foto={fotoPerfil}
              nome={nomePreview}
              editando={editando && !isVisitante}
              onClick={abrirSeletorFoto}
            />

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Chip>
                  <Sparkles size={13} />
                  {isVisitante ? "Uso rápido" : "Conta ativa"}
                </Chip>

                <Chip>
                  <BadgeCheck size={13} />
                  {cargoExibido}
                </Chip>

                <Chip>
                  {isVisitante ? <CloudOff size={13} /> : <Cloud size={13} />}
                  {sincronizacao}
                </Chip>
              </div>

              <p className="truncate text-3xl font-black tracking-tight sm:text-4xl">
                {nomePreview}
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-emerald-100">
                {isVisitante
                  ? "Modo visitante local"
                  : usuarioAtual?.email || "Conta Firebase"}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <HeroMiniCard
                  icon={Briefcase}
                  label="Cargo"
                  value={cargoExibido}
                />

                <HeroMiniCard
                  icon={Boxes}
                  label="Área"
                  value={setoresExibidos}
                />

                <HeroMiniCard
                  icon={isVisitante ? CloudOff : Cloud}
                  label="Nuvem"
                  value={sincronizacao}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:w-36">
              {!editando ? (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  disabled={isVisitante}
                  className="
                    flex h-12 items-center justify-center gap-2 rounded-2xl
                    bg-white px-4 font-black text-emerald-800 shadow-lg
                    transition hover:bg-emerald-50 active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  <Pencil size={18} />
                  Editar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  className="
                    flex h-12 items-center justify-center gap-2 rounded-2xl
                    border border-white/20 bg-white/10 px-4 font-black text-white
                    backdrop-blur-md transition hover:bg-white/15 active:scale-95
                  "
                >
                  <X size={18} />
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {editando && !isVisitante && (
              <motion.div
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 12, height: 0 }}
                transition={{ duration: 0.22 }}
                className="relative mt-5 overflow-hidden"
              >
                <div
                  className="
                    rounded-[2rem] border border-white/15 bg-white/12 p-4
                    shadow-inner backdrop-blur-md
                  "
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-black">
                        <Pencil size={18} />
                        Editar perfil
                      </p>

                      <p className="mt-1 text-sm text-emerald-100">
                        Altere nome e foto direto no cartão principal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removerFoto}
                      disabled={!fotoPerfil}
                      className="
                        flex h-10 shrink-0 items-center gap-2 rounded-2xl
                        bg-red-500/20 px-3 text-xs font-black text-white
                        transition active:scale-95 disabled:opacity-40
                      "
                    >
                      <Trash2 size={15} />
                      Foto
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-black text-emerald-100">
                        <User size={16} />
                        Nome
                      </label>

                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        className="
                          h-[52px] w-full rounded-2xl border border-white/15
                          bg-white/15 px-4 font-black text-white outline-none
                          placeholder:text-white/45
                          focus:border-white/35 focus:ring-4 focus:ring-white/10
                        "
                      />
                    </div>

                    <button
                      type="button"
                      onClick={abrirSeletorFoto}
                      className="
                        flex h-[52px] items-center justify-center gap-2 rounded-2xl
                        bg-white/15 px-4 font-black text-white transition
                        hover:bg-white/20 active:scale-95
                      "
                    >
                      <ImagePlus size={18} />
                      Trocar foto
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={salvarPerfil}
                      disabled={salvando}
                      className="
                        flex h-12 items-center justify-center gap-2 rounded-2xl
                        bg-white font-black text-emerald-800 shadow-lg
                        transition hover:bg-emerald-50 active:scale-95
                        disabled:opacity-60
                      "
                    >
                      <Save size={19} />
                      {salvando ? "Salvando..." : "Salvar alterações"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelarEdicao}
                      className="
                        h-12 rounded-2xl border border-white/20 bg-white/10
                        font-black text-white transition hover:bg-white/15
                        active:scale-95
                      "
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* VISITANTE */}
        {isVisitante && (
          <section className="rounded-[2rem] border border-blue-200 bg-blue-50/90 p-5 text-blue-800 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Sparkles size={24} />
              </div>

              <div>
                <h2 className="text-xl font-black">Modo visitante</h2>

                <p className="mt-1 text-sm">
                  Ideal para usar na hora, sem criar conta. O visitante pode usar
                  Receitas e Posologia normalmente. Para salvar perfil, nuvem,
                  histórico compartilhado ou recursos avançados, basta criar uma
                  conta.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniAcesso
                    icon={ReceiptText}
                    titulo="Receitas"
                    texto="Calcule validade de receita sem cadastro."
                  />

                  <MiniAcesso
                    icon={Stethoscope}
                    titulo="Posologia"
                    texto="Calcule frascos, gotas e tratamento rápido."
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CONTA */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
          <div className="border-b border-gray-200/80 p-5 dark:border-white/10">
            <SectionHeader
              icon={Shield}
              title="Conta"
              subtitle="Identificação, acesso e sincronização"
            />
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoRow
                icon={isVisitante ? CloudOff : Cloud}
                label="Acesso"
                value={statusConta}
              />

              <InfoRow icon={Briefcase} label="Função" value={cargoExibido} />

              <InfoRow
                icon={Cloud}
                label="Sincronização"
                value={sincronizacao}
              />
            </div>

            <div
              className="
                rounded-[2rem] border border-gray-200 bg-gray-50/90 p-4
                dark:border-white/10 dark:bg-white/5
              "
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-white">
                    <Clipboard size={20} />
                  </div>

                  <div>
                    <p className="font-black">ID público</p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Usado para admin encontrar sua conta
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="min-w-0 flex-1 truncate rounded-2xl border border-gray-200 bg-white px-4 py-3 font-black dark:border-white/10 dark:bg-gray-950/60">
                  {isVisitante
                    ? "Visitante sem ID fixo"
                    : usuarioAtual?.publicId || "Sem ID"}
                </div>

                <button
                  type="button"
                  onClick={usuarioAtual?.publicId ? copiarId : gerarId}
                  disabled={isVisitante}
                  className="
                    flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                    bg-emerald-700 text-white transition hover:bg-emerald-800
                    active:scale-95 disabled:opacity-60
                  "
                  aria-label="Copiar ou gerar ID"
                >
                  {usuarioAtual?.publicId ? (
                    <Copy size={19} />
                  ) : (
                    <Save size={19} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* APARÊNCIA */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
          <div className="border-b border-gray-200/80 p-5 dark:border-white/10">
            <SectionHeader
              icon={Moon}
              title="Aparência"
              subtitle="Ajuste rápido do tema visual"
            />
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between rounded-2xl bg-gray-100/90 p-4 dark:bg-white/5">
              <div>
                <p className="font-black">Modo Escuro</p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tema atual: {dark ? "escuro" : "claro"}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-8 w-16 items-center rounded-full px-1 transition-all ${
                  dark ? "justify-end bg-green-500" : "justify-start bg-gray-400"
                }`}
                aria-label="Alternar tema"
              >
                <div className="h-6 w-6 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AvatarPerfil({ foto, nome, editando, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden
        rounded-[2.2rem] border border-white/20 bg-white/20 shadow-xl
        backdrop-blur-md transition active:scale-95
      "
      aria-label="Foto de perfil"
    >
      {foto ? (
        <img
          src={foto}
          alt={nome || "Foto de perfil"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-4xl font-black text-white">
          {obterIniciais(nome)}
        </span>
      )}

      {editando && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
          <Camera size={30} />
        </div>
      )}
    </button>
  );
}

function HeroMiniCard({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/12 p-3 backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-100/80">
        <Icon size={13} />
        {label}
      </div>

      <p className="truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
        <Icon size={21} />
      </div>

      <div>
        <h2 className="text-xl font-black">{title}</h2>

        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-gray-100/90 p-4 dark:bg-white/5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <p className="truncate font-black">{value}</p>
      </div>
    </div>
  );
}

function MiniAcesso({ icon: Icon, titulo, texto }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 dark:bg-black/20">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={18} />
        <p className="font-black">{titulo}</p>
      </div>

      <p className="text-sm opacity-80">{texto}</p>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
      {children}
    </span>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="
        fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)]
        z-[99999] flex justify-center px-3
        pointer-events-none
      "
    >
      <div
        className={`
          pointer-events-auto flex w-full max-w-[calc(100vw-1.5rem)] items-center gap-3
          rounded-3xl border p-4 shadow-2xl backdrop-blur-xl sm:max-w-md
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : info
              ? "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${
            erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="min-w-0 flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
          aria-label="Fechar aviso"
        >
          <X size={17} />
        </button>
      </div>
    </motion.div>
  );
}

function ModalConfirmarSair({ isVisitante, onCancel, onConfirm }) {
  return (
    <motion.div
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[2147483647] flex items-center justify-center
        bg-slate-950/75 p-4 backdrop-blur-md
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 22, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="
          w-full max-w-sm rounded-[2rem] border border-white/10
          bg-white p-6 text-gray-950 shadow-2xl dark:bg-gray-950 dark:text-white
        "
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600 text-white shadow-lg shadow-red-600/25">
          <LogOut size={30} />
        </div>

        <h2 className="text-center text-xl font-black">Sair da conta?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {isVisitante
            ? "Você vai sair do modo visitante e voltar para a tela inicial."
            : "Sua sessão será encerrada e o app voltará para a tela de login."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              h-12 rounded-2xl bg-gray-100 font-black text-gray-700
              transition active:scale-95 dark:bg-white/10 dark:text-white
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="
              flex h-12 items-center justify-center gap-2 rounded-2xl
              bg-red-600 font-black text-white shadow-lg shadow-red-600/20
              transition hover:bg-red-700 active:scale-95
            "
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatarCargoUsuario(usuario, { isAdmin, isVisitante }) {
  if (isVisitante) return "Visitante";

  const cargo = String(usuario?.cargo || "").trim();

  if (cargo) {
    const nomes = {
      admin: "Administrador",
      gerente: "Gerente",
      balconista: "Balconista",
      caixa: "Caixa",
      repositor: "Repositor",
    };

    return nomes[cargo.toLowerCase()] || cargo;
  }

  if (isAdmin) return "Administrador";

  return "Usuário";
}

function formatarSetoresUsuario(usuario, { isAdmin, isVisitante }) {
  if (isVisitante) return "Receitas e Posologia";
  if (isAdmin) return "Todas as áreas";

  const setores =
    Array.isArray(usuario?.setoresProdutos) && usuario.setoresProdutos.length
      ? usuario.setoresProdutos
      : Array.isArray(usuario?.setores) && usuario.setores.length
      ? usuario.setores
      : usuario?.setor
      ? [usuario.setor]
      : ["Medicamentos"];

  if (setores.length >= 5) {
    return "Todas as áreas";
  }

  return setores.join(", ");
}

function obterIniciais(nome) {
  const partes = String(nome || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) return "U";

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function compactarImagemPerfil(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Erro ao ler imagem"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Erro ao carregar imagem"));

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const tamanhoMaximo = 420;

        const proporcao = Math.min(
          tamanhoMaximo / img.width,
          tamanhoMaximo / img.height,
          1
        );

        canvas.width = Math.max(1, Math.round(img.width * proporcao));
        canvas.height = Math.max(1, Math.round(img.height * proporcao));

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas indisponível"));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };

      img.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });
}

export default Perfil;