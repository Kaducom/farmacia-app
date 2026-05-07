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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  auth,
  firestore,
  secondaryAuth,
} from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuarioAtual(null);
        setLoading(false);
        return;
      }

      const ref = doc(firestore, "usuarios", user.uid);
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
    });

    return unsubscribe;
  }, []);

  async function login(email, senha) {
    try {
      await signInWithEmailAndPassword(auth, email, senha);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        erro: traduzirErro(err.code),
      };
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function gerarPublicIdUnico() {
    for (let i = 0; i < 10; i++) {
      const id = String(Math.floor(100000 + Math.random() * 900000));

      const q = query(
        collection(firestore, "usuarios"),
        where("publicId", "==", id)
      );

      const snap = await getDocs(q);

      if (snap.empty) return id;
    }

    return String(Date.now()).slice(-6);
  }

  async function criarUsuario({
    nome,
    email,
    senha,
    tipo = "comum",
  }) {
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        senha
      );

      const publicId = await gerarPublicIdUnico();

      await setDoc(doc(firestore, "usuarios", cred.user.uid), {
        nome,
        email,
        publicId,
        tipo,
        farmaciaId: "farmacia-principal",
        criadoEm: Date.now(),
        criadoPor: usuarioAtual?.nome || "Sistema",
        criadoPorUid: usuarioAtual?.uid || null,
        permissaoAtualizadaEm: null,
        permissaoAtualizadaPor: null,
        permissaoAtualizadaPorUid: null,
      });

      return {
        ok: true,
        publicId,
      };
    } catch (err) {
      return {
        ok: false,
        erro: traduzirErro(err.code),
      };
    }
  }

  async function buscarUsuarioPorId(publicId) {
    try {
      const idLimpo = String(publicId).trim();

      if (!idLimpo) {
        return {
          ok: false,
          erro: "Informe um ID",
        };
      }

      const q = query(
        collection(firestore, "usuarios"),
        where("publicId", "==", idLimpo)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        return {
          ok: false,
          erro: "Usuário não encontrado",
        };
      }

      const docSnap = snap.docs[0];

      return {
        ok: true,
        usuario: {
          uid: docSnap.id,
          ...docSnap.data(),
        },
      };
    } catch (err) {
      console.error(err);

      return {
        ok: false,
        erro: "Erro ao buscar usuário",
      };
    }
  }

  async function alterarTipoPorId(publicId, novoTipo) {
    try {
      if (!usuarioAtual || usuarioAtual.tipo !== "admin") {
        return {
          ok: false,
          erro: "Ação não permitida",
        };
      }

      const encontrado = await buscarUsuarioPorId(publicId);

      if (!encontrado.ok) return encontrado;

      const usuario = encontrado.usuario;

      await updateDoc(doc(firestore, "usuarios", usuario.uid), {
        tipo: novoTipo,
        permissaoAtualizadaEm: Date.now(),
        permissaoAtualizadaPor: usuarioAtual.nome,
        permissaoAtualizadaPorUid: usuarioAtual.uid,
      });

      return {
        ok: true,
        usuario: {
          ...usuario,
          tipo: novoTipo,
          permissaoAtualizadaEm: Date.now(),
          permissaoAtualizadaPor: usuarioAtual.nome,
          permissaoAtualizadaPorUid: usuarioAtual.uid,
        },
      };
    } catch (err) {
      console.error(err);

      return {
        ok: false,
        erro: "Erro ao alterar permissão",
      };
    }
  }

  async function garantirMeuPublicId() {

  if (!usuarioAtual?.uid) {
    return;
  }

  if (usuarioAtual?.publicId) {
    return;
  }

  try {

    const novoId =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    const ref = doc(
      firestore,
      "usuarios",
      usuarioAtual.uid
    );

    await updateDoc(ref, {
      publicId: novoId,
    });

    setUsuarioAtual((prev) => ({
      ...prev,
      publicId: novoId,
    }));

    return novoId;

  } catch (err) {

    console.error(err);

    return null;
  }
}

  const isAdmin = usuarioAtual?.tipo === "admin";

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        loading,
        isAdmin,
        login,
        logout,
        criarUsuario,
        garantirMeuPublicId,
        buscarUsuarioPorId,
        alterarTipoPorId,
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