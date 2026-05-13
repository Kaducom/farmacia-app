import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CheckCircle2,
  ChevronDown,
  Filter,
  PackageCheck,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const OPCOES_ORDENACAO = [
  { id: "validade-proxima", label: "Validade próxima" },
  { id: "validade-distante", label: "Validade distante" },
  { id: "nome-az", label: "Nome A-Z" },
  { id: "nome-za", label: "Nome Z-A" },
  { id: "quantidade-maior", label: "Qtd maior" },
  { id: "quantidade-menor", label: "Qtd menor" },
  { id: "codigo", label: "Código" },
];

const SETORES_PADRAO = [
  "Todos",
  "Medicamentos",
  "Alimentos",
  "Geladeira",
  "Perfumaria",
  "Higiene",
  "Estoque geral",
  "Outros",
];

function BuscaProdutos({
  busca,
  setBusca,
  ordenacao,
  setOrdenacao,
  setorFiltro = "Todos",
  setSetorFiltro = () => {},
  quantidadeFiltrada,
  quantidadeTotal,
  setores = SETORES_PADRAO,
  mostrarFiltroSetor = true,
}) {
  const containerRef = useRef(null);
  const [menuAberto, setMenuAberto] = useState(null);

  const opcaoAtual =
    OPCOES_ORDENACAO.find((opcao) => opcao.id === ordenacao) ||
    OPCOES_ORDENACAO[0];

  const setorAtual = setorFiltro || "Todos";

  useEffect(() => {
    function fecharAoClicarFora(e) {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(e.target)) {
        setMenuAberto(null);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("touchstart", fecharAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("touchstart", fecharAoClicarFora);
    };
  }, []);

  useEffect(() => {
    if (!mostrarFiltroSetor && menuAberto === "setor") {
      setMenuAberto(null);
    }
  }, [mostrarFiltroSetor, menuAberto]);

  function alternarMenu(nome) {
    setMenuAberto((atual) => (atual === nome ? null : nome));
  }

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-visible rounded-[1.45rem] border border-white/10
        bg-slate-950/72 p-2 shadow-xl shadow-black/35
        backdrop-blur-2xl
        ${menuAberto ? "z-[9999]" : "z-30"}
      `}
    >
      <div
        className={`
          grid gap-2 sm:items-center
          ${
            mostrarFiltroSetor
              ? "sm:grid-cols-[minmax(0,1fr)_170px_210px_86px]"
              : "sm:grid-cols-[minmax(0,1fr)_210px_86px]"
          }
        `}
      >
        {/* BUSCA */}
        <div
          className="
            flex h-10 items-center gap-2.5 rounded-[1.15rem]
            border border-white/10 bg-white/[0.065] px-3
            transition
            focus-within:border-emerald-400/70
            focus-within:bg-white/[0.09]
            focus-within:ring-4 focus-within:ring-emerald-400/10
          "
        >
          <Search size={17} className="shrink-0 text-emerald-300" />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="
              min-w-0 flex-1 bg-transparent text-[13px] font-black
              text-white outline-none placeholder:text-white/38
            "
          />

          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="
                flex h-7 w-7 shrink-0 items-center justify-center rounded-xl
                bg-white/10 text-white/80 transition hover:bg-white/15
                active:scale-95
              "
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* SETOR, invisível quando usuário só tem uma seção */}
        {mostrarFiltroSetor && (
          <DropdownPremium
            aberto={menuAberto === "setor"}
            onToggle={() => alternarMenu("setor")}
            icon={Filter}
            label={setorAtual}
            ariaLabel="Filtrar por setor"
          >
            {setores.map((setor) => {
              const ativo = setorAtual === setor;

              return (
                <OpcaoDropdown
                  key={setor}
                  ativo={ativo}
                  label={setor}
                  onClick={() => {
                    setSetorFiltro(setor);
                    setMenuAberto(null);
                  }}
                />
              );
            })}
          </DropdownPremium>
        )}

        {/* ORDENAÇÃO */}
        <DropdownPremium
          aberto={menuAberto === "ordenacao"}
          onToggle={() => alternarMenu("ordenacao")}
          icon={SlidersHorizontal}
          label={opcaoAtual.label}
          ariaLabel="Ordenar produtos"
        >
          {OPCOES_ORDENACAO.map((opcao) => {
            const ativo = ordenacao === opcao.id;

            return (
              <OpcaoDropdown
                key={opcao.id}
                ativo={ativo}
                label={opcao.label}
                onClick={() => {
                  setOrdenacao(opcao.id);
                  setMenuAberto(null);
                }}
              />
            );
          })}
        </DropdownPremium>

        {/* CONTADOR */}
        <div
          className="
            flex h-10 items-center justify-center rounded-[1.15rem]
            border border-emerald-300/20
            bg-gradient-to-br from-emerald-400/18 via-emerald-500/10 to-white/[0.045]
            px-3 text-[12px] font-black text-emerald-200
            shadow-inner shadow-emerald-950/20
          "
          title={`${quantidadeFiltrada} de ${quantidadeTotal} produtos`}
        >
          <PackageCheck size={15} className="mr-1.5 text-emerald-200/80" />

          <span className="text-sm text-emerald-100">
            {quantidadeFiltrada}
          </span>

          <span className="mx-1 text-emerald-300/45">/</span>

          <span className="text-emerald-200/65">{quantidadeTotal}</span>
        </div>
      </div>
    </motion.div>
  );
}

function DropdownPremium({
  aberto,
  onToggle,
  icon: Icon,
  label,
  ariaLabel,
  children,
}) {
  return (
    <div className="relative overflow-visible">
      <button
        type="button"
        onClick={onToggle}
        aria-label={ariaLabel}
        aria-expanded={aberto}
        className="
          flex h-10 w-full items-center gap-2 rounded-[1.15rem]
          border border-white/10 bg-white/[0.065] px-3 text-left
          transition hover:bg-white/[0.09] active:scale-[0.99]
        "
      >
        <Icon size={16} className="shrink-0 text-white/50" />

        <span className="min-w-0 flex-1 truncate text-[13px] font-black text-white/90">
          {label}
        </span>

        <ChevronDown
          size={16}
          className={`
            shrink-0 text-white/45 transition-transform
            ${aberto ? "rotate-180" : ""}
          `}
        />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="
              absolute left-0 right-0 top-full z-[99999]
              max-h-72 overflow-y-auto rounded-2xl border border-white/10
              bg-slate-950 p-1.5 shadow-2xl shadow-black/70
              ring-1 ring-white/10
            "
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OpcaoDropdown({ ativo, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex h-9 w-full items-center justify-between rounded-xl px-3
        text-left text-[13px] font-black transition
        ${
          ativo
            ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
            : "text-white/78 hover:bg-white/10"
        }
      `}
    >
      <span className="truncate">{label}</span>
      {ativo && <CheckCircle2 size={15} />}
    </button>
  );
}

export default BuscaProdutos;