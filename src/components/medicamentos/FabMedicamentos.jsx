import { AnimatePresence, motion } from "framer-motion";
import { Camera, Pill, Plus, X } from "lucide-react";

function FabMedicamentos({
  fabOpen,
  setFabOpen,
  limpar,
  setAbrirModal,
  iniciarScanner,

  // Mantém compatibilidade com o pai, mas não usa mais reposição.
  modoReposicao,
  setModoReposicao,
}) {
  function abrirCadastroManual() {
    limpar();
    setAbrirModal(true);
    setFabOpen(false);
  }

  function abrirScanner() {
    setFabOpen(false);
    iniciarScanner();
  }

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.button
            type="button"
            aria-label="Fechar menu rápido"
            onClick={() => setFabOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-[60]
              bg-black/10 backdrop-blur-[1px]
            "
          />
        )}
      </AnimatePresence>

      <div
        className="
          fixed right-4 z-[70]
          bottom-[calc(env(safe-area-inset-bottom)+6.75rem)]
          flex flex-col items-end
        "
      >
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mb-3 flex flex-col items-end gap-3"
            >
              <OpcaoFab
                icon={Pill}
                titulo="Adicionar"
                descricao="Cadastrar manualmente"
                onClick={abrirCadastroManual}
              />

              <OpcaoFab
                icon={Camera}
                titulo="Scanner"
                descricao="Ler código de barras"
                onClick={abrirScanner}
                destaque
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={fabOpen ? "Fechar opções" : "Abrir opções"}
          onClick={() => setFabOpen(!fabOpen)}
          whileTap={{ scale: 0.94 }}
          className="
            relative flex h-16 w-16 items-center justify-center overflow-hidden
            rounded-[1.45rem]
            bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950
            text-white shadow-2xl shadow-emerald-700/35
            ring-1 ring-white/15
            transition
          "
        >
          <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-white/14" />
          <div className="absolute -bottom-5 -left-2 h-14 w-14 rounded-full bg-emerald-300/12" />
          <div className="absolute left-3 top-3 h-3 w-3 rounded-full bg-white/20" />

          <motion.div
            animate={{ rotate: fabOpen ? 90 : 0 }}
            transition={{ duration: 0.18 }}
            className="
              relative flex h-11 w-11 items-center justify-center rounded-2xl
              bg-white/15 shadow-lg backdrop-blur-md
            "
          >
            {fabOpen ? (
              <X size={26} strokeWidth={3} />
            ) : (
              <Plus size={29} strokeWidth={3} />
            )}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}

function OpcaoFab({ icon: Icon, titulo, descricao, onClick, destaque = false }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: 16, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.96 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.16 }}
      className={`
        relative flex min-w-[225px] items-center gap-3 overflow-hidden
        rounded-[1.45rem] px-4 py-3 text-left
        shadow-2xl backdrop-blur-xl ring-1 transition
        ${
          destaque
            ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 text-white shadow-emerald-700/25 ring-white/15"
            : "bg-white/95 text-gray-950 shadow-black/10 ring-gray-200 dark:bg-gray-900/95 dark:text-white dark:ring-gray-700"
        }
      `}
    >
      {destaque && (
        <>
          <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 left-6 h-14 w-14 rounded-full bg-emerald-300/10" />
        </>
      )}

      <div
        className={`
          relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
          ${
            destaque
              ? "bg-white/15 text-white"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <Icon size={23} strokeWidth={2.6} />
      </div>

      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-black">{titulo}</p>

        <p
          className={`
            truncate text-xs font-semibold
            ${
              destaque
                ? "text-emerald-100/80"
                : "text-gray-500 dark:text-gray-400"
            }
          `}
        >
          {descricao}
        </p>
      </div>
    </motion.button>
  );
}

export default FabMedicamentos;