import Dexie from "dexie";

export const db = new Dexie("farmaciaDB");

db.version(2).stores({
  medicamentos: "++id,nome,validade,codigo",
  receitas: "++id,dataReceita,tipo",
  produtosCodigo: "++id,codigo,nome,imagem,diasRemover,diasPreVencido"
});