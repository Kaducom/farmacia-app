export const SETORES_PRODUTOS = [
  "Medicamentos",
  "Alimentos",
  "Geladeira",
  "Perfumaria",
  "Higiene",
  "Estoque geral",
  "Outros",
];

export const CARGOS_PRODUTOS = {
  ADMIN: "admin",
  GERENTE: "gerente",
  BALCONISTA: "balconista",
  CAIXA: "caixa",
  VISITANTE: "visitante",
};

export const SETOR_PADRAO_PRODUTOS = "Medicamentos";

export function normalizarCargo(usuario) {
  return String(
    usuario?.cargo ||
      usuario?.role ||
      usuario?.perfil ||
      usuario?.tipo ||
      ""
  )
    .trim()
    .toLowerCase();
}

export function usuarioEhAdminProdutos(usuario) {
  const cargo = normalizarCargo(usuario);

  return (
    cargo === CARGOS_PRODUTOS.ADMIN ||
    cargo === CARGOS_PRODUTOS.GERENTE ||
    usuario?.admin === true ||
    usuario?.isAdmin === true
  );
}

export function obterSetoresDoUsuario(usuario) {
  if (!usuario) return [];

  if (usuarioEhAdminProdutos(usuario)) {
    return SETORES_PRODUTOS;
  }

  if (Array.isArray(usuario.setoresProdutos) && usuario.setoresProdutos.length) {
    return usuario.setoresProdutos.filter(Boolean);
  }

  if (Array.isArray(usuario.setores) && usuario.setores.length) {
    return usuario.setores.filter(Boolean);
  }

  if (usuario.setorProduto) {
    return [usuario.setorProduto];
  }

  if (usuario.setor) {
    return [usuario.setor];
  }

  // Enquanto o perfil/cargos não estiver pronto,
  // deixa Medicamentos como padrão para não quebrar o app.
  return [SETOR_PADRAO_PRODUTOS];
}

export function obterEscopoProdutos(usuario) {
  const setoresPermitidos = obterSetoresDoUsuario(usuario);
  const admin = usuarioEhAdminProdutos(usuario);

  return {
    admin,
    setoresPermitidos,
    setorPrincipal: setoresPermitidos[0] || SETOR_PADRAO_PRODUTOS,

    // Admin vê tudo. Usuário comum só vê filtro se tiver mais de uma seção própria.
    mostrarFiltroSetor: admin || setoresPermitidos.length > 1,

    // Só admin deve ver "Todos".
    podeVerTodos: admin,
  };
}

export function produtoEstaNoEscopo(produto, usuario) {
  const escopo = obterEscopoProdutos(usuario);

  if (escopo.admin) return true;

  const setorProduto = produto?.setor || SETOR_PADRAO_PRODUTOS;

  return escopo.setoresPermitidos.includes(setorProduto);
}

export function filtrarProdutosPorEscopo(produtos, usuario) {
  if (!Array.isArray(produtos)) return [];

  return produtos.filter((produto) => produtoEstaNoEscopo(produto, usuario));
}

export function obterSetoresParaFiltro(usuario) {
  const escopo = obterEscopoProdutos(usuario);

  if (escopo.podeVerTodos) {
    return ["Todos", ...SETORES_PRODUTOS];
  }

  return escopo.setoresPermitidos;
}

export function obterSetorInicialFiltro(usuario) {
  const escopo = obterEscopoProdutos(usuario);

  if (escopo.podeVerTodos) return "Todos";

  return escopo.setorPrincipal;
}