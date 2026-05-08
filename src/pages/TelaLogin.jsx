import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

function TelaLogin() {
  const {
    login,
    criarUsuario,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const senhaRef = useRef(null);

  const mostrarCriarAdminInicial = import.meta.env.DEV;

  async function entrar() {
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Informe email e senha");
      return;
    }

    setCarregando(true);

    const res = await login(
      email.trim(),
      senha
    );

    setCarregando(false);

    if (!res.ok) {
      setErro(res.erro || "Email ou senha inválidos");
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  async function criarAdminInicial() {
    setErro("");
    setCarregando(true);

    const res = await criarUsuario({
      nome: "Kadu",
      email: "kadu@farmacia.com",
      senha: "123456",
      tipo: "admin",
    });

    setCarregando(false);

    if (!res.ok) {
      setErro(res.erro || "Erro ao criar admin");
      return;
    }

    setEmail("kadu@farmacia.com");
    setSenha("123456");
    setErro("Admin criado. Agora clique em Entrar ✨");
  }

  function handleEmailKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      senhaRef.current?.focus();
    }
  }

  function handleSenhaKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      entrar();
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
        <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-4xl shadow-xl shadow-emerald-600/30">
            💊
          </div>

          <h1 className="text-center text-3xl font-black">
            Farmácia App
          </h1>

          <p className="mt-2 text-center text-sm text-gray-300">
            Acesse com email e senha
          </p>

          {erro && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/15 p-3 text-center text-sm font-semibold text-emerald-200">
              {erro}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-300">
                Email
              </label>

              <input
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="exemplo@email.com"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-300">
                Senha
              </label>

              <input
                ref={senhaRef}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleSenhaKeyDown}
                placeholder="Digite sua senha"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="button"
              onClick={entrar}
              disabled={carregando}
              className="mt-2 w-full rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"
            >
              {carregando ? "Carregando..." : "Entrar"}
            </button>

            {mostrarCriarAdminInicial && (
              <button
                type="button"
                onClick={criarAdminInicial}
                disabled={carregando}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 active:scale-95 disabled:opacity-60"
              >
                Criar admin inicial
              </button>
            )}
          </div>

          {mostrarCriarAdminInicial && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-gray-400">
              Primeiro acesso: <strong>kadu@farmacia.com / 123456</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TelaLogin;