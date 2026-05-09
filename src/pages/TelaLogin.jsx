import { useState } from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  User,
  UserRoundCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const contaInicial = {
  nome: "",
  email: "",
  senha: "",
};

function TelaLogin() {
  const {
    login,
    criarUsuario,
    entrarComoVisitante,
  } = useAuth();

  const [modo, setModo] = useState("entrar");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [novaConta, setNovaConta] = useState(contaInicial);

  const [verSenhaLogin, setVerSenhaLogin] = useState(false);
  const [verSenhaCriar, setVerSenhaCriar] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("ok");
  const [carregando, setCarregando] = useState(false);

  function avisar(texto, tipo = "ok") {
    setMensagem(texto);
    setTipoMensagem(tipo);

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  }

  async function entrar() {
    setMensagem("");

    if (!email.trim() || !senha.trim()) {
      avisar("Informe email e senha", "erro");
      return;
    }

    setCarregando(true);

    const res = await login(
      email.trim(),
      senha
    );

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
    setMensagem("");

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
    setMensagem("");
    setCarregando(true);

    const res = await entrarComoVisitante();

    setCarregando(false);

    if (!res.ok) {
      avisar(res.erro || "Erro ao entrar como visitante", "erro");
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#020617] p-4 text-white">
      <div className="absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-80px] top-32 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-green-700/20 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.25),rgba(2,6,23,1))]" />

        <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rotate-12 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-sm" />
        <div className="absolute left-[15%] bottom-24 h-24 w-24 -rotate-12 rounded-3xl border border-white/10 bg-white/5" />
        <div className="absolute right-[12%] bottom-32 h-32 w-32 rounded-full border border-emerald-300/10 bg-emerald-300/5" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-4xl shadow-xl shadow-emerald-600/30">
            💊
          </div>

          <h1 className="text-center text-3xl font-black">
            Farmácia App
          </h1>

          <p className="mt-2 text-center text-sm text-gray-300">
            Controle, consulta e ferramentas rápidas em um só lugar
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            <AbaLogin
              ativa={modo === "entrar"}
              onClick={() => setModo("entrar")}
            >
              Entrar
            </AbaLogin>

            <AbaLogin
              ativa={modo === "criar"}
              onClick={() => setModo("criar")}
            >
              Criar
            </AbaLogin>

            <AbaLogin
              ativa={modo === "visitante"}
              onClick={() => setModo("visitante")}
            >
              Visitante
            </AbaLogin>
          </div>

          {mensagem && (
            <div
              className={`
                mt-4 rounded-2xl border p-3 text-center text-sm font-semibold
                ${
                  tipoMensagem === "erro"
                    ? "border-red-500/20 bg-red-500/15 text-red-200"
                    : "border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
                }
              `}
            >
              {mensagem}
            </div>
          )}

          {modo === "entrar" && (
            <div className="mt-6 space-y-3">
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

              <button
                type="button"
                onClick={entrar}
                disabled={carregando}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"
              >
                <LogIn size={19} />
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </div>
          )}

          {modo === "criar" && (
            <div className="mt-6 space-y-3">
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

              <button
                type="button"
                onClick={criarConta}
                disabled={carregando}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"
              >
                <UserRoundCheck size={19} />
                {carregando ? "Criando..." : "Criar conta"}
              </button>

              <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-gray-300">
                A conta criada entra como usuário comum. Depois um admin pode
                liberar permissões pelo ID público.
              </p>
            </div>
          )}

          {modo === "visitante" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600">
                    <Sparkles size={21} />
                  </div>

                  <div>
                    <p className="font-black text-emerald-100">
                      Entrar sem conta
                    </p>

                    <p className="mt-1 text-sm text-emerald-100/80">
                      Ideal para testar o app. Alguns dados ficam só no aparelho
                      e funções de nuvem podem ficar limitadas.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={entrarVisitante}
                disabled={carregando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-black text-emerald-900 shadow-lg transition active:scale-95 disabled:opacity-60"
              >
                Continuar como visitante
                <ArrowRight size={19} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AbaLogin({
  ativa,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-xl px-3 py-2 text-sm font-black transition active:scale-95
        ${
          ativa
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      {children}
    </button>
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
        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
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
          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 pr-12 font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
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

export default TelaLogin;