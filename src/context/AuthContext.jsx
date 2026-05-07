import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { auth, firestore } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [usuarioAtual, setUsuarioAtual] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {
          setUsuarioAtual(null);
          setLoading(false);
          return;
        }

        const ref = doc(
          firestore,
          "usuarios",
          user.uid
        );

        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setUsuarioAtual(null);
          setLoading(false);
          return;
        }

        setUsuarioAtual({
          uid: user.uid,
          email: user.email,
          ...snap.data(),
        });

        setLoading(false);
      }
    );

    return unsubscribe;

  }, []);

  async function login(email, senha) {

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      return {
        ok: true
      };

    } catch (err) {

      return {
        ok: false,
        erro: traduzirErro(err.code)
      };

    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function criarUsuario({
    nome,
    email,
    senha,
    tipo = "comum",
  }) {

    try {

      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );

      await setDoc(
        doc(
          firestore,
          "usuarios",
          cred.user.uid
        ),
        {
          nome,
          email,
          tipo,
          farmaciaId: "farmacia-principal",
          criadoEm: Date.now(),
        }
      );

      return {
        ok: true
      };

    } catch (err) {

      return {
        ok: false,
        erro: traduzirErro(err.code)
      };

    }
  }

  const isAdmin =
    usuarioAtual?.tipo === "admin";

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        loading,
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

function traduzirErro(code) {

  switch (code) {

    case "auth/email-already-in-use":
      return "Email já utilizado";

    case "auth/invalid-email":
      return "Email inválido";

    case "auth/weak-password":
      return "Senha muito fraca";

    case "auth/invalid-credential":
      return "Email ou senha inválidos";

    default:
      return "Erro inesperado";
  }
}

export function useAuth() {
  return useContext(AuthContext);
}