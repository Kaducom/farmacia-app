import {
  Search,
  PackageSearch,
  X,
} from "lucide-react";

function BuscaMedicamentos({
  busca,
  setBusca,
  quantidadeFiltrada = 0,
}) {

  return (

    <div className="
      sticky
      top-0
      z-20
      backdrop-blur-xl
      bg-white/80
      dark:bg-[#0f172a]/80
      border-b
      border-gray-200
      dark:border-gray-800
      p-4
    ">

      {/* HEADER */}
      <div className="
        flex
        items-center
        justify-between
        mb-4
      ">

        <div>

          <h1 className="
            text-2xl
            font-bold
            text-black
            dark:text-white
          ">
            Medicamentos
          </h1>

          <p className="
            text-sm
            text-gray-500
            dark:text-gray-400
          ">
            Gerencie o estoque da farmácia
          </p>

        </div>

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-green-700
          text-white
          flex
          items-center
          justify-center
          shadow-lg
        ">

          <PackageSearch size={28} />

        </div>

      </div>

      {/* BUSCA */}
      <div className="relative">

        <Search
          size={18}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-gray-400
          "
        />

        <input
          type="text"

          value={busca}

          onChange={(e) =>
            setBusca(e.target.value)
          }

          placeholder="Buscar medicamento..."

          className="
            w-full
            pl-12
            pr-12
            py-4
            rounded-2xl
            border
            border-gray-200
            dark:border-gray-700
            bg-gray-100
            dark:bg-gray-800
            text-black
            dark:text-white
            placeholder:text-gray-400
            outline-none
            focus:border-green-500
            transition
          "
        />

        {busca && (

          <button
            onClick={() =>
              setBusca("")
            }

            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2

              w-8
              h-8

              rounded-xl

              bg-gray-200
              dark:bg-gray-700

              flex
              items-center
              justify-center

              hover:scale-105
              active:scale-95

              transition
            "
          >

            <X size={16} />

          </button>

        )}

      </div>

      {/* RESULTADO */}
      <div className="
        mt-3
        flex
        items-center
        justify-between
      ">

        <p className="
          text-sm
          text-gray-500
          dark:text-gray-400
        ">

          {quantidadeFiltrada}
          {" "}
          medicamento(s) encontrado(s)

        </p>

        {busca && (

          <span className="
            text-xs
            px-3
            py-1
            rounded-full
            bg-green-100
            dark:bg-green-900/40
            text-green-700
            dark:text-green-300
            border
            border-green-200
            dark:border-green-800
          ">

            filtro ativo

          </span>

        )}

      </div>

    </div>
  );
}

export default BuscaMedicamentos;