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

import {
  SETORES_PRODUTOS,
  SETOR_PADRAO_PRODUTOS,
} from "../config/acessoProdutos";

export const AuthContext = createContext();

function criarUsuarioVisitante() {
  return {
    uid: "visitante-local",
    nome: "Visitante",
    email: "modo.visitante@local",
    publicId: "VISITA",
    tipo: "visitante",
    cargo: "visitante",
    setoresProdutos: [],
    farmaciaId: "local",
    visitante: true,
  };
}

function normalizarSetoresProdutos(setores) {
  if (!Array.isArray(setores)) {
    return [SETOR_PADRAO_PRODUTOS];
  }

  const limpos = setores
    .map((setor) => String(setor || "").trim())
    .filter(Boolean)
    .filter((setor) => SETORES_PRODUTOS.includes(setor));

  return limpos.length ? [...new Set(limpos)] : [SETOR_PADRAO_PRODUTOS];
}

function obterSetoresPadraoPorTipo(tipo, cargo) {
  if (tipo === "admin" || cargo === "gerente" || cargo === "admin") {
    return SETORES_PRODUTOS;
  }

  return [SETOR_PADRAO_PRODUTOS];
}

function normalizarCargo(cargo, tipo = "comum") {
  if (tipo === "admin") return "admin";

  return String(cargo || "balconista")
    .trim()
    .toLowerCase();
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

          setUsuarioAtual(modoVisitante ? criarUsuarioVisitante() : null);
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

        const dados = snap.data() || {};

        const tipo = dados.tipo || "comum";
        const cargo = dados.cargo || (tipo === "admin" ? "admin" : "balconista");

        setUsuarioAtual({
          uid: user.uid,
          email: user.email,
          ...dados,
          tipo,
          cargo,
          setoresProdutos: normalizarSetoresProdutos(
            dados.setoresProdutos ||
              obterSetoresPadraoPorTipo(tipo, cargo)
          ),
        });

        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
        setUsuarioAtual(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function login(email, senha) {
    try {
      localStorage.removeItem("modoVisitante");

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
    localStorage.removeItem("modoVisitante");
    setUsuarioAtual(null);

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao sair:", err);
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
      console.error("Erro ao entrar como visitante:", err);

      return {
        ok: false,
        erro: "Erro ao entrar como visitante",
      };
    }
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
    cargo = "balconista",
    setoresProdutos,
  }) {
    try {
      const tipoSeguro =
        usuarioAtual?.tipo === "admin" && tipo === "admin"
          ? "admin"
          : "comum";

      const cargoSeguro = normalizarCargo(cargo, tipoSeguro);

      const setoresSeguros = normalizarSetoresProdutos(
        setoresProdutos || obterSetoresPadraoPorTipo(tipoSeguro, cargoSeguro)
      );

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
        cargo: cargoSeguro,
        setoresProdutos: setoresSeguros,
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
        // O auth secundário não deve atrapalhar o principal.
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
      const idLimpo = String(publicId || "").trim();

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
      console.error("Erro ao buscar usuário:", err);

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
      console.error("Erro ao alterar permissão:", err);

      return {
        ok: false,
        erro: "Erro ao alterar permissão",
      };
    }
  }

  async function alterarAcessoProdutosPorId(publicId, dadosAcesso) {
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

      const tipoSeguro =
        dadosAcesso?.tipo === "admin" ? "admin" : usuario.tipo || "comum";

      const cargoSeguro = normalizarCargo(
        dadosAcesso?.cargo || usuario.cargo,
        tipoSeguro
      );

      const setoresSeguros = normalizarSetoresProdutos(
        dadosAcesso?.setoresProdutos ||
          usuario.setoresProdutos ||
          obterSetoresPadraoPorTipo(tipoSeguro, cargoSeguro)
      );

      await updateDoc(doc(firestore, "usuarios", usuario.uid), {
        tipo: tipoSeguro,
        cargo: cargoSeguro,
        setoresProdutos: setoresSeguros,
        permissaoAtualizadaEm: atualizadoEm,
        permissaoAtualizadaPor: usuarioAtual.nome,
        permissaoAtualizadaPorUid: usuarioAtual.uid,
      });

      return {
        ok: true,
        usuario: {
          ...usuario,
          tipo: tipoSeguro,
          cargo: cargoSeguro,
          setoresProdutos: setoresSeguros,
          permissaoAtualizadaEm: atualizadoEm,
          permissaoAtualizadaPor: usuarioAtual.nome,
          permissaoAtualizadaPorUid: usuarioAtual.uid,
        },
      };
    } catch (err) {
      console.error("Erro ao alterar acesso de produtos:", err);

      return {
        ok: false,
        erro: "Erro ao alterar acesso de produtos",
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

      const ref = doc(firestore, "usuarios", usuarioAtual.uid);

      await updateDoc(ref, {
        publicId: novoId,
      });

      setUsuarioAtual((prev) => ({
        ...prev,
        publicId: novoId,
      }));

      return novoId;
    } catch (err) {
      console.error("Erro ao gerar ID público:", err);
      return null;
    }
  }

async function atualizarMeuPerfil({ nome, fotoPerfil }) {
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

    const agora = Date.now();
    const ref = doc(firestore, "usuarios", usuarioAtual.uid);

    const payload = {
      nome: nomeLimpo,
      perfilAtualizadoEm: agora,
    };

    if (fotoPerfil !== undefined) {
      payload.fotoPerfil = fotoPerfil || null;
    }

    await updateDoc(ref, payload);

    setUsuarioAtual((prev) => ({
      ...prev,
      ...payload,
    }));

    return { ok: true };
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);

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
        alterarAcessoProdutosPorId,
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