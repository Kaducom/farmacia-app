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

function criarUsuarioVisitante() {
  return {
    uid: "visitante-local",
    nome: "Visitante",
    email: "modo.visitante@local",
    publicId: "VISITA",
    tipo: "visitante",
    farmaciaId: "local",
    visitante: true,
  };
}

export function AuthProvider({ children }) {
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const modoVisitante =
            localStorage.getItem("modoVisitante") === "true";

          setUsuarioAtual(
            modoVisitante
              ? criarUsuarioVisitante()
              : null
          );

          setLoading(false);
          return;
        }

        localStorage.removeItem("modoVisitante");

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
      } catch (err) {
        console.error(err);
        setUsuarioAtual(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function login(email, senha) {
    try {
      localStorage.removeItem("modoVisitante");

      await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        erro: traduzirErro(err.code),
      };
    }
  }

  async function logout() {
    localStorage.removeItem("modoVisitante");
    setUsuarioAtual(null);

    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  }

  async function entrarComoVisitante() {
    try {
      localStorage.setItem("modoVisitante", "true");

      try {
        await signOut(auth);
      } catch {
        // Sem problema se não houver usuário logado.
      }

      setUsuarioAtual(criarUsuarioVisitante());

      return { ok: true };
    } catch (err) {
      console.error(err);

      return {
        ok: false,
        erro: "Erro ao entrar como visitante",
      };
    }
  }

  async function gerarPublicIdUnico() {
    for (let i = 0; i < 10; i++) {
      const id = String(
        Math.floor(100000 + Math.random() * 900000)
      );

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
      const tipoSeguro =
        usuarioAtual?.tipo === "admin" && tipo === "admin"
          ? "admin"
          : "comum";

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
        tipo: tipoSeguro,
        farmaciaId: "farmacia-principal",
        criadoEm: Date.now(),
        criadoPor: usuarioAtual?.nome || "Cadastro próprio",
        criadoPorUid: usuarioAtual?.uid || null,
        permissaoAtualizadaEm: null,
        permissaoAtualizadaPor: null,
        permissaoAtualizadaPorUid: null,
      });

      try {
        await signOut(secondaryAuth);
      } catch {
        // Mantém silencioso. O auth secundário não deve atrapalhar o principal.
      }

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
      const atualizadoEm = Date.now();

      await updateDoc(doc(firestore, "usuarios", usuario.uid), {
        tipo: novoTipo,
        permissaoAtualizadaEm: atualizadoEm,
        permissaoAtualizadaPor: usuarioAtual.nome,
        permissaoAtualizadaPorUid: usuarioAtual.uid,
      });

      return {
        ok: true,
        usuario: {
          ...usuario,
          tipo: novoTipo,
          permissaoAtualizadaEm: atualizadoEm,
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
    if (!usuarioAtual?.uid || usuarioAtual?.visitante) {
      return null;
    }

    if (usuarioAtual?.publicId) {
      return usuarioAtual.publicId;
    }

    try {
      const novoId = await gerarPublicIdUnico();

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

  async function atualizarMeuPerfil({ nome }) {
    try {
      if (!usuarioAtual?.uid || usuarioAtual?.visitante) {
        return {
          ok: false,
          erro: "Visitante não salva perfil na nuvem",
        };
      }

      const nomeLimpo = String(nome || "").trim();

      if (!nomeLimpo) {
        return {
          ok: false,
          erro: "Informe um nome",
        };
      }

      const ref = doc(
        firestore,
        "usuarios",
        usuarioAtual.uid
      );

      await updateDoc(ref, {
        nome: nomeLimpo,
        perfilAtualizadoEm: Date.now(),
      });

      setUsuarioAtual((prev) => ({
        ...prev,
        nome: nomeLimpo,
        perfilAtualizadoEm: Date.now(),
      }));

      return { ok: true };
    } catch (err) {
      console.error(err);

      return {
        ok: false,
        erro: "Erro ao atualizar perfil",
      };
    }
  }

  const isAdmin = usuarioAtual?.tipo === "admin";
  const isVisitante =
    usuarioAtual?.tipo === "visitante" ||
    usuarioAtual?.visitante === true;

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        loading,
        isAdmin,
        isVisitante,
        login,
        logout,
        criarUsuario,
        entrarComoVisitante,
        garantirMeuPublicId,
        atualizarMeuPerfil,
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

    case "auth/missing-password":
      return "Digite a senha";

    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente daqui a pouco";

    default:
      return "Erro inesperado";
  }
}

export function useAuth() {
  return useContext(AuthContext);
}