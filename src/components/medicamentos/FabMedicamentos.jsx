import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pill,
  ScanBarcode,
  PackagePlus,
  X,
} from "lucide-react";

function FabMedicamentos({
  fabOpen,
  setFabOpen,
  limpar,
  setAbrirModal,
  iniciarScanner,
  modoReposicao,
  setModoReposicao,
}) {
  function vibrar(ms = 15) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function abrirNovo() {
    vibrar();
    limpar();
    setAbrirModal(true);
    setFabOpen(false);
  }

  function abrirScannerNormal() {
    vibrar();
    if (setModoReposicao) setModoReposicao(false);
    iniciarScanner();
    setFabOpen(false);
  }

  function abrirScannerReposicao() {
    vibrar();
    if (setModoReposicao) setModoReposicao(true);
    iniciarScanner();
    setFabOpen(false);
  }

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            onClick={() => setFabOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="fixed right-5 z-[60] bottom-[calc(env(safe-area-inset-bottom)+6.25rem)]">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="
                flex flex-col items-end gap-3 rounded-3xl border border-white/20
                bg-white/85 p-3 shadow-2xl backdrop-blur-xl
                dark:border-gray-800 dark:bg-gray-950/85
              "
            >
              <AcaoFab
                icon={Pill}
                label="Novo medicamento"
                descricao="Cadastrar manualmente"
                onClick={abrirNovo}
                className="bg-emerald-700 hover:bg-emerald-800"
              />

              <AcaoFab
                icon={ScanBarcode}
                label="Scanner"
                descricao="Ler código de barras"
                onClick={abrirScannerNormal}
                className="bg-violet-600 hover:bg-violet-700"
              />

              {setModoReposicao && (
                <AcaoFab
                  icon={PackagePlus}
                  label="Reposição rápida"
                  descricao="Somar +1 no estoque"
                  onClick={abrirScannerReposicao}
                  className={
                    modoReposicao
                      ? "bg-blue-700 hover:bg-blue-800"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => {
            vibrar();
            setFabOpen(!fabOpen);
          }}
          animate={{
            rotate: fabOpen ? 90 : 0,
            scale: fabOpen ? 0.96 : 1,
          }}
          whileTap={{ scale: 0.92 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 24,
          }}
          className="
            flex h-16 w-16 items-center justify-center rounded-3xl
            bg-emerald-700 text-white shadow-2xl shadow-emerald-700/30
            transition hover:bg-emerald-800
          "
          aria-label={fabOpen ? "Fechar menu de ações" : "Abrir menu de ações"}
        >
          {fabOpen ? <X size={30} /> : <Plus size={34} />}
        </motion.button>
      </div>
    </>
  );
}

function AcaoFab({ icon: Icon, label, descricao, onClick, className = "" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      whileTap={{ scale: 0.96 }}
      className={`
        flex min-w-[230px] items-center gap-3 rounded-2xl px-4 py-3
        text-left text-white shadow-xl transition
        ${className}
      `}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
        <Icon size={22} />
      </div>

      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-white/75">{descricao}</p>
      </div>
    </motion.button>
  );
}

export default FabMedicamentos;