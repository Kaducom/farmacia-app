import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Pill,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  UserRoundCheck,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const contaInicial = {
  nome: "",
  email: "",
  senha: "",
};

const abas = [
  {
    id: "entrar",
    label: "Entrar",
    icon: LogIn,
  },
  {
    id: "criar",
    label: "Criar",
    icon: UserPlus,
  },
  {
    id: "visitante",
    label: "Visitante",
    icon: Sparkles,
  },
];

function TelaLogin() {
  const { login, criarUsuario, entrarComoVisitante } = useAuth();

  const [modo, setModo] = useState("entrar");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [novaConta, setNovaConta] = useState(contaInicial);

  const [verSenhaLogin, setVerSenhaLogin] = useState(false);
  const [verSenhaCriar, setVerSenhaCriar] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("ok");
  const [carregando, setCarregando] = useState(false);

  const tituloModo = useMemo(() => {
    if (modo === "criar") return "Crie sua conta";
    if (modo === "visitante") return "Use agora, sem cadastro";
    return "Bem-vindo de volta";
  }, [modo]);

  const textoModo = useMemo(() => {
    if (modo === "criar") {
      return "Salve seu perfil e prepare o app para recursos de nuvem.";
    }

    if (modo === "visitante") {
      return "Perfeito para consulta rápida: Receitas e Posologia liberadas na hora.";
    }

    return "Entre para acessar suas ferramentas e continuar o trabalho.";
  }, [modo]);

  function avisar(texto, tipo = "ok") {
    setMensagem(texto);
    setTipoMensagem(tipo);

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  }

  function limparMensagem() {
    setMensagem("");
  }

  function trocarModo(novoModo) {
    setModo(novoModo);
    limparMensagem();
  }

  async function entrar() {
    limparMensagem();

    if (!email.trim() || !senha.trim()) {
      avisar("Informe email e senha", "erro");
      return;
    }

    setCarregando(true);

    const res = await login(email.trim(), senha);

    setCarregando(false);

    if (!res.ok) {
      avisar(res.erro || "Erro ao entrar", "erro");
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate(35);
    }
  }

  async function criarConta() {
    limparMensagem();

    if (
      !novaConta.nome.trim() ||
      !novaConta.email.trim() ||
      !novaConta.senha.trim()
    ) {
      avisar("Preencha nome, email e senha", "erro");
      return;
    }

    if (novaConta.senha.trim().length < 6) {
      avisar("A senha precisa ter no mínimo 6 caracteres", "erro");
      return;
    }

    setCarregando(true);

    const res = await criarUsuario({
      nome: novaConta.nome.trim(),
      email: novaConta.email.trim(),
      senha: novaConta.senha,
      tipo: "comum",
    });

    setCarregando(false);

    if (!res.ok) {
      avisar(res.erro || "Erro ao criar conta", "erro");
      return;
    }

    setEmail(novaConta.email.trim());
    setSenha(novaConta.senha);
    setNovaConta(contaInicial);
    setModo("entrar");

    avisar(
      res.publicId
        ? `Conta criada ✨ Seu ID: ${res.publicId}. Agora é só entrar.`
        : "Conta criada ✨ Agora é só entrar.",
      "ok"
    );
  }

  async function entrarVisitante() {
    limparMensagem();
    setCarregando(true);

    const res = await entrarComoVisitante();

    setCarregando(false);

    if (!res.ok) {
      avisar(res.erro || "Erro ao entrar como visitante", "erro");
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#020617] text-white">
      <FundoLogin />

      <div
        className="
          relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl
          items-center justify-center px-4 py-6
          sm:px-6 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:gap-8
        "
      >
        <HeroLogin />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="
            w-full max-w-md overflow-hidden rounded-[2.2rem]
            border border-white/10 bg-white/10 shadow-2xl shadow-black/40
            backdrop-blur-2xl
          "
        >
          <div className="relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />

            <div className="relative">
              <div
                className="
                  mx-auto mb-5 flex h-20 w-20 items-center justify-center
                  rounded-[1.7rem] border border-white/15
                  bg-gradient-to-br from-emerald-500 via-emerald-700 to-slate-950
                  text-4xl shadow-xl shadow-emerald-600/25
                "
              >
                💊
              </div>

              <div className="text-center">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-100">
                  <Sparkles size={13} />
                  Farmácia App
                </div>

                <h1 className="text-3xl font-black tracking-tight">
                  {tituloModo}
                </h1>

                <p className="mx-auto mt-2 max-w-xs text-sm text-gray-300">
                  {textoModo}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
                {abas.map((aba) => (
                  <AbaLogin
                    key={aba.id}
                    ativa={modo === aba.id}
                    onClick={() => trocarModo(aba.id)}
                    icon={aba.icon}
                  >
                    {aba.label}
                  </AbaLogin>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {mensagem && (
                  <Mensagem
                    key={mensagem}
                    mensagem={mensagem}
                    tipo={tipoMensagem}
                    fechar={limparMensagem}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {modo === "entrar" && (
                  <motion.div
                    key="entrar"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                    className="mt-6 space-y-3"
                  >
                    <CampoLogin
                      icon={Mail}
                      label="Email"
                      value={email}
                      onChange={setEmail}
                      placeholder="seu@email.com"
                      type="email"
                      autoFocus
                    />

                    <CampoSenha
                      label="Senha"
                      value={senha}
                      onChange={setSenha}
                      placeholder="Digite sua senha"
                      visivel={verSenhaLogin}
                      setVisivel={setVerSenhaLogin}
                      onEnter={entrar}
                    />

                    <BotaoPrincipal
                      onClick={entrar}
                      carregando={carregando}
                      icon={LogIn}
                      texto={carregando ? "Entrando..." : "Entrar"}
                    />

                    <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-gray-300">
                      Use sua conta para acessar perfil, dados na nuvem e recursos liberados.
                    </p>
                  </motion.div>
                )}

                {modo === "criar" && (
                  <motion.div
                    key="criar"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                    className="mt-6 space-y-3"
                  >
                    <CampoLogin
                      icon={User}
                      label="Nome"
                      value={novaConta.nome}
                      onChange={(v) =>
                        setNovaConta((prev) => ({
                          ...prev,
                          nome: v,
                        }))
                      }
                      placeholder="Seu nome"
                      autoFocus
                    />

                    <CampoLogin
                      icon={Mail}
                      label="Email"
                      value={novaConta.email}
                      onChange={(v) =>
                        setNovaConta((prev) => ({
                          ...prev,
                          email: v,
                        }))
                      }
                      placeholder="seu@email.com"
                      type="email"
                    />

                    <CampoSenha
                      label="Senha"
                      value={novaConta.senha}
                      onChange={(v) =>
                        setNovaConta((prev) => ({
                          ...prev,
                          senha: v,
                        }))
                      }
                      placeholder="Mínimo 6 caracteres"
                      visivel={verSenhaCriar}
                      setVisivel={setVerSenhaCriar}
                      onEnter={criarConta}
                    />

                    <BotaoPrincipal
                      onClick={criarConta}
                      carregando={carregando}
                      icon={UserRoundCheck}
                      texto={carregando ? "Criando..." : "Criar conta"}
                    />

                    <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-gray-300">
                      A conta entra como usuário comum. Depois um admin pode liberar permissões pelo ID público.
                    </p>
                  </motion.div>
                )}

                {modo === "visitante" && (
                  <motion.div
                    key="visitante"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="rounded-[1.7rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
                          <Sparkles size={22} />
                        </div>

                        <div>
                          <p className="font-black text-emerald-100">
                            Consulta rápida liberada
                          </p>

                          <p className="mt-1 text-sm text-emerald-100/80">
                            Entre sem conta para usar Receitas e Posologia na hora. Ideal para testar ou consultar rápido.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniRecurso
                        icon={FileText}
                        titulo="Receitas"
                        texto="Validade rápida"
                      />

                      <MiniRecurso
                        icon={Calculator}
                        titulo="Posologia"
                        texto="Gotas e frascos"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={entrarVisitante}
                      disabled={carregando}
                      className="
                        flex w-full items-center justify-center gap-2 rounded-2xl
                        bg-white py-3 font-black text-emerald-900 shadow-lg
                        transition active:scale-95 disabled:opacity-60
                      "
                    >
                      {carregando ? (
                        <>
                          <Loader2 size={19} className="animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          Continuar como visitante
                          <ArrowRight size={19} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      Visitante não salva perfil na nuvem, mas consegue usar as ferramentas rápidas.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FundoLogin() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute right-[-80px] top-32 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-green-700/20 blur-3xl" />
      <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rotate-12 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-sm" />
      <div className="absolute left-[15%] bottom-24 h-24 w-24 -rotate-12 rounded-3xl border border-white/10 bg-white/5" />
      <div className="absolute right-[12%] bottom-32 h-32 w-32 rounded-full border border-emerald-300/10 bg-emerald-300/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.25),rgba(2,6,23,1))]" />
    </div>
  );
}

function HeroLogin() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="hidden lg:block"
    >
      <div className="max-w-lg">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-emerald-100 backdrop-blur-xl">
          <ShieldCheck size={18} />
          Seu balcão digital
        </div>

        <h2 className="text-5xl font-black leading-tight tracking-tight">
          Farmácia App com cara de ferramenta profissional.
        </h2>

        <p className="mt-5 text-base leading-7 text-gray-300">
          Entrou, usou. Receita, posologia, AMSI, estoque e rotinas da farmácia em um app só, com visual limpo e fluxo rápido.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <CardHero icon={FileText} titulo="Receitas" texto="Validade em segundos" />
          <CardHero icon={Calculator} titulo="Posologia" texto="Gotas, frascos e doses" />
          <CardHero icon={Pill} titulo="Estoque" texto="Controle inteligente" />
          <CardHero icon={Sparkles} titulo="Visitante" texto="Uso rápido sem conta" />
        </div>
      </div>
    </motion.div>
  );
}

function CardHero({ icon: Icon, titulo, texto }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
        <Icon size={21} />
      </div>

      <p className="font-black">{titulo}</p>
      <p className="mt-1 text-sm text-gray-400">{texto}</p>
    </div>
  );
}

function AbaLogin({ ativa, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-1.5 rounded-xl px-2 py-2
        text-xs font-black transition active:scale-95 sm:text-sm
        ${
          ativa
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

function Mensagem({ mensagem, tipo, fechar }) {
  const erro = tipo === "erro";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`
        mt-4 flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold
        ${
          erro
            ? "border-red-500/20 bg-red-500/15 text-red-200"
            : "border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
        }
      `}
    >
      <div
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white
          ${erro ? "bg-red-500" : "bg-emerald-600"}
        `}
      >
        {erro ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      </div>

      <p className="flex-1">{mensagem}</p>

      <button
        type="button"
        onClick={fechar}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 transition active:scale-95"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

function CampoLogin({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus = false,
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-300">
        <Icon size={16} />
        {label}
      </label>

      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={type === "email" ? "email" : "name"}
        className="
          w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3
          font-semibold text-white outline-none transition
          placeholder:text-gray-500
          focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20
        "
      />
    </div>
  );
}

function CampoSenha({
  label,
  value,
  onChange,
  placeholder,
  visivel,
  setVisivel,
  onEnter,
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-300">
        <Lock size={16} />
        {label}
      </label>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          placeholder={placeholder}
          type={visivel ? "text" : "password"}
          autoComplete="current-password"
          className="
            w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 pr-12
            font-semibold text-white outline-none transition
            placeholder:text-gray-500
            focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20
          "
        />

        <button
          type="button"
          onClick={() => setVisivel((prev) => !prev)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-white/5 text-gray-300 transition active:scale-95"
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        >
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function BotaoPrincipal({ onClick, carregando, icon: Icon, texto }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className="
        mt-2 flex w-full items-center justify-center gap-2 rounded-2xl
        bg-emerald-700 py-3 font-black text-white
        shadow-lg shadow-emerald-700/25 transition
        hover:bg-emerald-800 active:scale-95 disabled:opacity-60
      "
    >
      {carregando ? (
        <Loader2 size={19} className="animate-spin" />
      ) : (
        <Icon size={19} />
      )}
      {texto}
    </button>
  );
}

function MiniRecurso({ icon: Icon, titulo, texto }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
        <Icon size={19} />
      </div>

      <p className="font-black">{titulo}</p>
      <p className="text-xs text-gray-400">{texto}</p>
    </div>
  );
}

export default TelaLogin;
