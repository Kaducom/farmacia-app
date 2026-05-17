export const SETORES_PRODUTOS = [
  "Medicamentos",
  "Alimentos",
  "Geladeira",
  "Perfumaria",
  "Higiene",
  "Estoque geral",
  "Outros",
];

export const QUALIDADES_FOTO = [
  {
    id: "economica",
    label: "Econômica",
    detalhe: "Mais leve para aparelhos antigos",
  },
  {
    id: "normal",
    label: "Normal",
    detalhe: "Boa para rotina",
  },
  {
    id: "boa",
    label: "Boa",
    detalhe: "Melhor visual neste aparelho",
  },
];

export const CONFIG_PRODUTOS_PADRAO = {
  setorPrincipal: "Medicamentos",
  usarSetorPrincipalAoCadastrar: true,
  focarSetorPrincipalNosBotoes: true,
  datasAutomaticasPorSetor: true,
  produtoJaPreVencimento: true,
  permitirDataRetiradaDireta: true,
  retiradaPadraoDias: 30,
  preVencimentoPadraoDias: "",
  qualidadeFotoLocal: "boa",
  qualidadeFotoNuvem: "compacta",
};

export function chaveConfigProdutos(uid) {
  return `avisai:config-produtos:${uid || "visitante"}`;
}

export function carregarConfigProdutos(uid) {
  if (typeof window === "undefined") return CONFIG_PRODUTOS_PADRAO;

  try {
    const salvo = window.localStorage.getItem(chaveConfigProdutos(uid));
    if (!salvo) return CONFIG_PRODUTOS_PADRAO;

    return {
      ...CONFIG_PRODUTOS_PADRAO,
      ...JSON.parse(salvo),
    };
  } catch {
    return CONFIG_PRODUTOS_PADRAO;
  }
}

export function salvarConfigProdutosLocal(uid, config) {
  if (typeof window === "undefined") return;

  const chave = chaveConfigProdutos(uid);
  window.localStorage.setItem(chave, JSON.stringify(config));

  window.dispatchEvent(
    new CustomEvent("avisai-config-produtos-change", {
      detail: config,
    })
  );
}

export function resetarConfigProdutosLocal(uid) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(chaveConfigProdutos(uid));

  window.dispatchEvent(
    new CustomEvent("avisai-config-produtos-change", {
      detail: CONFIG_PRODUTOS_PADRAO,
    })
  );
}
