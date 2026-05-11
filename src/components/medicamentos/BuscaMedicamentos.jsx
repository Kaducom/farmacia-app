import { PackageSearch, Search, Sparkles, X } from "lucide-react";

function BuscaMedicamentos({ busca, setBusca, quantidadeFiltrada = 0 }) {
  const temBusca = busca.trim().length > 0;

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 pb-3 pt-3 backdrop-blur-xl">
      <div
        className="
          overflow-hidden rounded-[2rem] border border-white/70 bg-white/85
          shadow-xl shadow-black/5 backdrop-blur-2xl
          dark:border-white/10 dark:bg-gray-950/70 dark:shadow-black/20
        "
      >
        {/* HEADER */}
        <div className="relative overflow-hidden p-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-500/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="
                    inline-flex items-center gap-1.5 rounded-full
                    bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase
                    tracking-wide text-emerald-700
                    dark:bg-emerald-500/15 dark:text-emerald-300
                  "
                >
                  <Sparkles size={13} />
                  Estoque
                </span>

                {temBusca && (
                  <span
                    className="
                      rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black
                      text-blue-700 dark:bg-blue-500/15 dark:text-blue-300
                    "
                  >
                    filtro ativo
                  </span>
                )}
              </div>

              <h1 className="mt-2 truncate text-2xl font-black text-gray-950 dark:text-white">
                Medicamentos
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {quantidadeFiltrada === 1
                  ? "1 medicamento encontrado"
                  : `${quantidadeFiltrada} medicamentos encontrados`}
              </p>
            </div>

            <div
              className="
                flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl
                bg-gradient-to-br from-emerald-600 to-emerald-800 text-white
                shadow-lg shadow-emerald-700/20
              "
            >
              <PackageSearch size={28} />
            </div>
          </div>
        </div>

        {/* BUSCA */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search
              size={19}
              className="
                absolute left-4 top-1/2 -translate-y-1/2
                text-gray-400 dark:text-gray-500
              "
            />

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, validade ou código..."
              className="
                h-14 w-full rounded-2xl border border-gray-200 bg-gray-100/90
                py-3 pl-12 pr-12 text-sm font-semibold text-gray-950
                outline-none transition
                placeholder:text-gray-400
                focus:border-emerald-500 focus:bg-white
                focus:ring-4 focus:ring-emerald-500/15
                dark:border-white/10 dark:bg-white/10 dark:text-white
                dark:placeholder:text-gray-500 dark:focus:border-emerald-400
                dark:focus:bg-gray-950/70
              "
            />

            {temBusca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="
                  absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2
                  items-center justify-center rounded-2xl bg-white text-gray-500
                  shadow-sm transition hover:text-gray-900 active:scale-95
                  dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white
                "
                title="Limpar busca"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
              {temBusca
                ? `Buscando por “${busca}”`
                : "Dica: busque pelo nome, validade ou código de barras."}
            </p>

            <span
              className="
                shrink-0 rounded-full border border-emerald-200 bg-emerald-50
                px-3 py-1 text-xs font-black text-emerald-700
                dark:border-emerald-500/20 dark:bg-emerald-500/10
                dark:text-emerald-300
              "
            >
              {quantidadeFiltrada}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuscaMedicamentos;