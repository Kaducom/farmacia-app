import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const USERS_KEY = "farmaciaUsuarios";
const CURRENT_KEY = "farmaciaUsuarioAtual";

const usuarioAdminPadrao = {
  id: "admin-kadu",
  nome: "Kadu",
  pin: "123",
  tipo: "admin",
};

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  useEffect(() => {
    carregarAuth();
  }, []);

  function carregarAuth() {
    const salvos = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

    const existeAdmin = salvos.some((u) => u.id === usuarioAdminPadrao.id);
    const lista = existeAdmin ? salvos : [usuarioAdminPadrao, ...salvos];

    localStorage.setItem(USERS_KEY, JSON.stringify(lista));
    setUsuarios(lista);

    const atual = JSON.parse(localStorage.getItem(CURRENT_KEY) || "null");
    if (atual) setUsuarioAtual(atual);
  }

  function login(nome, pin) {
    const usuario = usuarios.find(
      (u) =>
        u.nome.toLowerCase() === nome.trim().toLowerCase() &&
        u.pin === pin.trim()
    );

    if (!usuario) return false;

    setUsuarioAtual(usuario);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(usuario));
    return true;
  }

  function logout() {
    setUsuarioAtual(null);
    localStorage.removeItem(CURRENT_KEY);
  }

  function criarUsuario({ nome, pin, tipo = "comum" }) {
    if (!nome.trim() || !pin.trim()) return false;

    const novo = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      pin: pin.trim(),
      tipo,
    };

    const novaLista = [...usuarios, novo];
    setUsuarios(novaLista);
    localStorage.setItem(USERS_KEY, JSON.stringify(novaLista));

    return true;
  }

  const isAdmin = usuarioAtual?.tipo === "admin";

  return (
    <AuthContext.Provider
      value={{
        usuarios,
        usuarioAtual,
        isAdmin,
        login,
        logout,
        criarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}