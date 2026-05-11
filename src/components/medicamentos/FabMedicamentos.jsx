import { AnimatePresence, motion } from "framer-motion";

import {
  ClipboardPlus,
  Plus,
  ScanBarcode,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

function FabMedicamentos({
  fabOpen,
  setFabOpen,
  limpar,
  setAbrirModal,
  iniciarScanner,

  // Mantém compatibilidade com o pai.
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

  function alternarMenu() {
    setFabOpen(!fabOpen);
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
              bg-black/20 backdrop-blur-[2px]
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
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mb-4 flex w-[min(92vw,330px)] flex-col items-end gap-3"
            >
              <div
                className="
                  w-full overflow-hidden rounded-[2rem] border border-white/70
                  bg-white/90 p-3 shadow-2xl shadow-black/10 backdrop-blur-2xl
                  dark:border-white/10 dark:bg-gray-950/85 dark:shadow-black/30
                "
              >
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-black text-gray-950 dark:text-white">
                      <Sparkles size={16} className="text-emerald-600" />
                      Ação rápida
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Escolha como quer adicionar
                    </p>
                  </div>

                  <span
                    className="
                      rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black
                      uppercase tracking-wide text-emerald-700
                      dark:bg-emerald-500/15 dark:text-emerald-300
                    "
                  >
                    Estoque
                  </span>
                </div>

                <div className="space-y-2">
                  <OpcaoFab
                    icon={ScanBarcode}
                    titulo="Scanner"
                    descricao="Ler código de barras e somar lote"
                    onClick={abrirScanner}
                    destaque
                    delay={0}
                  />

                  <OpcaoFab
                    icon={ClipboardPlus}
                    titulo="Cadastro manual"
                    descricao="Adicionar medicamento preenchendo os dados"
                    onClick={abrirCadastroManual}
                    delay={0.04}
                  />
                </div>

                {setModoReposicao && (
                  <button
                    type="button"
                    onClick={() => setModoReposicao(!modoReposicao)}
                    className={`
                      mt-3 flex w-full items-center justify-between gap-3 rounded-2xl
                      border px-4 py-3 text-left transition active:scale-[0.98]
                      ${
                        modoReposicao
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                      }
                    `}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`
                          flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
                          ${
                            modoReposicao
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                          }
                        `}
                      >
                        <Zap size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black">Modo reposição</p>
                        <p className="truncate text-xs opacity-75">
                          {modoReposicao
                            ? "Ativado"
                            : "Opcional para fluxo rápido"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`
                        flex h-7 w-12 items-center rounded-full p-1 transition
                        ${modoReposicao ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-700"}
                      `}
                    >
                      <span
                        className={`
                          h-5 w-5 rounded-full bg-white shadow transition
                          ${modoReposicao ? "translate-x-5" : "translate-x-0"}
                        `}
                      />
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={fabOpen ? "Fechar opções" : "Abrir opções"}
          onClick={alternarMenu}
          whileTap={{ scale: 0.92 }}
          className="
            group relative flex h-[4.35rem] w-[4.35rem] items-center justify-center overflow-hidden
            rounded-[1.7rem]
            bg-gradient-to-br from-emerald-500 via-emerald-700 to-slate-950
            text-white shadow-2xl shadow-emerald-700/35
            ring-1 ring-white/20 transition
          "
        >
          <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/15" />
          <div className="absolute -bottom-6 -left-3 h-16 w-16 rounded-full bg-emerald-300/15" />
          <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-white/25" />

          {!fabOpen && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [1, 1.18, 1], opacity: 1 }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 1.4,
              }}
              className="
                absolute inset-2 rounded-[1.35rem] border border-white/20
              "
            />
          )}

          <motion.div
            animate={{ rotate: fabOpen ? 135 : 0 }}
            transition={{ duration: 0.2 }}
            className="
              relative flex h-12 w-12 items-center justify-center rounded-2xl
              bg-white/15 shadow-lg backdrop-blur-md
            "
          >
            {fabOpen ? (
              <X size={28} strokeWidth={3} />
            ) : (
              <Plus size={31} strokeWidth={3} />
            )}
          </motion.div>

        </motion.button>
      </div>
    </>
  );
}

function OpcaoFab({
  icon: Icon,
  titulo,
  descricao,
  onClick,
  destaque = false,
  delay = 0,
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: 18, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 18, scale: 0.96 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, delay }}
      className={`
        relative flex w-full items-center gap-3 overflow-hidden
        rounded-[1.45rem] px-4 py-3 text-left
        shadow-lg ring-1 transition
        ${
          destaque
            ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950 text-white shadow-emerald-700/25 ring-white/15"
            : "bg-gray-100 text-gray-950 shadow-black/5 ring-gray-200 dark:bg-white/10 dark:text-white dark:ring-white/10"
        }
      `}
    >
      {destaque && (
        <>
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-7 left-8 h-16 w-16 rounded-full bg-emerald-300/10" />
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
                ? "text-emerald-100/85"
                : "text-gray-500 dark:text-gray-400"
            }
          `}
        >
          {descricao}
        </p>
      </div>

      {destaque && (
        <span
          className="
            relative rounded-full bg-white/15 px-2.5 py-1 text-[10px]
            font-black uppercase tracking-wide text-white
          "
        >
          rápido
        </span>
      )}
    </motion.button>
  );
}

export default FabMedicamentos;