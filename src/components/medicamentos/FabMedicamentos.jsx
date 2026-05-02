import { motion } from "framer-motion";

function FabMedicamentos({
  fabOpen,
  setFabOpen,
  limpar,
  setAbrirModal,
  iniciarScanner,
}) {

  return (
    <>

      {/* FAB AREA */}
      <div className="
        fixed
        right-6
        bottom-24
        z-50
        flex
        flex-col
        items-end
        gap-3
      ">

        {/* MENU */}
        <motion.div
          initial={false}
          animate={fabOpen ? "open" : "closed"}
          className="
            flex
            flex-col
            items-end
            gap-3
          "
        >

          {/* NOVO */}
          <motion.button
            variants={{
              open: {
                opacity: 1,
                y: 0,
                scale: 1,
              },

              closed: {
                opacity: 0,
                y: 10,
                scale: 0.9,
              },
            }}

            transition={{
              duration: 0.15,
            }}

            onClick={() => {
              limpar();
              setAbrirModal(true);
              setFabOpen(false);
            }}

            className="
              bg-green-700
              hover:bg-green-800
              text-white
              px-5
              py-3
              rounded-2xl
              shadow-2xl
              font-medium
              transition
              active:scale-[0.96]
            "
          >
            💊 Novo Item
          </motion.button>

          {/* SCANNER */}
          <motion.button
            variants={{
              open: {
                opacity: 1,
                y: 0,
                scale: 1,
              },

              closed: {
                opacity: 0,
                y: 10,
                scale: 0.9,
              },
            }}

            transition={{
              duration: 0.2,
            }}

            onClick={() => {
              iniciarScanner();
              setFabOpen(false);
            }}

            className="
              bg-purple-600
              hover:bg-purple-700
              text-white
              px-5
              py-3
              rounded-2xl
              shadow-2xl
              font-medium
              transition
              active:scale-[0.96]
            "
          >
            📷 Scanner
          </motion.button>

        </motion.div>

        {/* BOTÃO + */}
        <motion.button
          onClick={() => {
            if (navigator.vibrate) {
              navigator.vibrate(15);
            }

            setFabOpen(!fabOpen);
          }}

          animate={{
            rotate: fabOpen ? 45 : 0,
          }}

          transition={{
            duration: 0.2,
          }}

          className="
            w-16
            h-16
            rounded-3xl
            bg-green-700
            hover:bg-green-800
            text-white
            text-3xl
            shadow-2xl
            flex
            items-center
            justify-center
            transition
          "
        >
          +
        </motion.button>

      </div>

      {/* OVERLAY */}
      {fabOpen && (

        <div
          onClick={() => setFabOpen(false)}
          className="
            fixed
            inset-0
            bg-black/30
            backdrop-blur-sm
            z-40
          "
        />

      )}

    </>
  );
}

export default FabMedicamentos;