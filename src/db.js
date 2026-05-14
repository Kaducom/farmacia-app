import Dexie from "dexie";

export const db = new Dexie("farmaciaDB");

db.version(3).stores({
  medicamentos: "++id,nome,validade,codigo",
  receitas: "++id,dataReceita,tipo",
  produtosCodigo: "++id,codigo,nome,imagem,diasRemover,diasPreVencido,criadoEm",
  mapeamentos: "++id,nome,dataCriacao,totalItens,totalUnidades,itens",
});

db.version(4)
  .stores({
    medicamentos:
      "++id,nome,validade,codigo,cloudId,atualizadoEmLocal,sincronizadoEm,pendenteSync",
    receitas: "++id,dataReceita,tipo",
    produtosCodigo:
      "++id,codigo,nome,imagem,diasRemover,diasPreVencido,criadoEm",
    mapeamentos: "++id,nome,dataCriacao,totalItens,totalUnidades,itens",
  })
  .upgrade(async (tx) => {
    const agora = Date.now();

    await tx
      .table("medicamentos")
      .toCollection()
      .modify((produto) => {
        produto.atualizadoEmLocal = produto.atualizadoEmLocal || agora;
        produto.sincronizadoEm = produto.sincronizadoEm || null;
        produto.pendenteSync = produto.pendenteSync ?? true;
        produto.setor = produto.setor || "Medicamentos";
        produto.quantidade = Number(produto.quantidade || 1);
      });
  });