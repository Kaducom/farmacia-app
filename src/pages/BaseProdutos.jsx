import { useEffect, useState } from "react";
import { db } from "../db";
import {
  Archive,
  Search,
  Trash2,
  Barcode,
  ImageIcon,
  PackageSearch,
} from "lucide-react";

function BaseProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const dados = await db.produtosCodigo.toArray();
    setProdutos(dados.reverse());
  }

  async function remover(id) {
    await db.produtosCodigo.delete(id);
    carregar();
  }

  const filtrados = produtos.filter((p) =>
    `${p.nome} ${p.codigo}`.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl p-4 pb-24 text-gray-950 dark:text-white">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
          <Archive size={24} />
        </div>

        <div>
          <h1 className="text-xl font-black">Base de Produtos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Produtos aprendidos pelo scanner.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-900">
        <Search size={18} className="text-gray-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código..."
          className="w-full bg-transparent outline-none"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <PackageSearch className="mx-auto mb-3 text-gray-400" size={42} />
          <h2 className="font-black">Nenhum produto aprendido ainda</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Escaneie e salve um produto para ele aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtrados.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xl shadow-black/5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-950">
                  {p.imagem ? (
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={28} className="text-gray-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-black">
                    {p.nome || "Produto sem nome"}
                  </h2>

                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Barcode size={14} />
                    {p.codigo}
                  </p>

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Remover: {p.diasRemover || 7} dias antes
                  </p>
                </div>

                <button
                  onClick={() => remover(p.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white transition active:scale-95"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BaseProdutos;