import Dexie from "dexie";

export const db = new Dexie("farmaciaDB");

db.version(1).stores({
  medicamentos: "++id, nome, validade, diasRemover, diasPreVencido,imagem",
  receitas: "++id, dataReceita, diasValidade, status"
});