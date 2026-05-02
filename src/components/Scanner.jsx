import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrowserMultiFormatReader,
} from "@zxing/browser";

export default function Scanner({
  onScan,
  onClose,
}) {

  // 🎥 referência do vídeo
  const videoRef = useRef(null);

  // 🧠 leitor ZXing
  const codeReader = useRef(null);

  // 📡 stream ativa
  const streamRef = useRef(null);

  // ⛔ trava múltiplas inicializações
  const startedRef = useRef(false);

  // 🔥 evita leitura duplicada
  const lastScanRef = useRef("");

  // ⏱ timeout leitura
  const timeoutRef = useRef(null);

  // 📱 estados
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [cameraAtiva, setCameraAtiva] = useState(false);

  // 🚀 inicia scanner
  useEffect(() => {

    iniciarScanner();

    // 🧹 cleanup TOTAL
    return () => {
      destruirScanner();
    };

  }, []);

  // 🔥 inicia câmera
  async function iniciarScanner() {

    // ⛔ impede duplicação React StrictMode
    if (startedRef.current) return;

    startedRef.current = true;

    try {

      setLoading(true);
      setErro("");

      // 🔎 verifica suporte
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {

        throw new Error(
          "Câmera não suportada"
        );
      }

      // 📷 lista dispositivos
      const devices =
        await BrowserMultiFormatReader.listVideoInputDevices();

      // 🚨 sem câmera
      if (!devices.length) {

        throw new Error(
          "Nenhuma câmera encontrada"
        );
      }

      // 🎯 prioriza traseira
      const traseira =
        devices.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("traseira")
        );

      const deviceId =
        traseira?.deviceId ||
        devices[0]?.deviceId;

      // 🧠 cria leitor
      codeReader.current =
        new BrowserMultiFormatReader();

      // 🚀 inicia decode
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,

        (result) => {

          if (!result) return;

          const codigo =
            result.getText();

          // 🔥 evita spam leitura
          if (
            lastScanRef.current === codigo
          ) return;

          lastScanRef.current = codigo;

          feedback();

          onScan(codigo);

          // ⏱ destrava leitura
          timeoutRef.current =
            setTimeout(() => {

              lastScanRef.current = "";

            }, 2000);
        }
      );

      // 🎥 pega stream real
      streamRef.current =
        videoRef.current?.srcObject;

      setCameraAtiva(true);
      setLoading(false);

    } catch (err) {

      console.error(err);

      setErro(
        err?.message ||
        "Erro ao abrir câmera"
      );

      setLoading(false);
    }
  }

  // 🧹 destruição TOTAL
  function destruirScanner() {

    try {

      // ⏱ limpa timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 🧠 reset ZXing
      if (codeReader.current) {
        codeReader.current.reset();
      }

      // 🎥 mata stream manualmente
      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach((track) => {

            track.stop();

          });
      }

      // 🎬 limpa vídeo
      if (videoRef.current) {

        videoRef.current.pause();

        videoRef.current.srcObject = null;
      }

      startedRef.current = false;

      setCameraAtiva(false);

    } catch (err) {

      console.error(
        "Erro cleanup scanner:",
        err
      );
    }
  }

  // 📳 feedback leitura
  function feedback() {

    // 📳 vibração
    if (navigator.vibrate) {

      navigator.vibrate([
        40,
        20,
        40,
      ]);
    }
  }

  // ❌ fechar scanner
  function fechar() {

    destruirScanner();

    onClose();
  }

  return (
    <div className="
      fixed inset-0
      bg-black
      z-[99999]
      overflow-hidden
    ">

      {/* 🎥 VIDEO */}
      <video
        ref={videoRef}

        autoPlay
        muted
        playsInline

        className="
          absolute inset-0
          w-full h-full
          object-cover
        "
      />

      {/* 🌑 OVERLAY */}
      <div className="
        absolute inset-0
        bg-black/40
        backdrop-blur-[2px]
      " />

      {/* 🎯 ÁREA SCAN */}
      <div className="
        absolute inset-0
        flex items-center
        justify-center
        pointer-events-none
      ">

        <div className="
          relative
          w-72 h-72
          rounded-3xl
          border
          border-green-400/40
          shadow-[0_0_40px_rgba(74,222,128,0.4)]
        ">

          {/* 🔥 cantos neon */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-2xl" />

          {/* ⚡ linha scanner */}
          <div className="
            absolute left-0 right-0
            h-1
            bg-green-400
            shadow-[0_0_20px_rgba(74,222,128,0.9)]
            animate-pulse
          " />
        </div>
      </div>

      {/* 🔝 TOPO */}
      <div className="
        absolute top-0 left-0 right-0
        p-4
        flex items-center
        justify-between
      ">

        <div className="text-white">

          <p className="font-semibold">
            Scanner Inteligente
          </p>

          <p className="
            text-xs text-gray-300
          ">
            Aponte para o código de barras
          </p>
        </div>

        {/* ❌ FECHAR */}
        <button
          onClick={fechar}

          className="
            w-12 h-12
            rounded-full
            bg-white/10
            backdrop-blur-md
            text-white
            text-xl
            border border-white/20
          "
        >
          ✕
        </button>
      </div>

      {/* ⏳ LOADING */}
      {loading && (

        <div className="
          absolute inset-0
          flex items-center
          justify-center
          bg-black/70
        ">

          <div className="text-center text-white">

            <div className="
              w-16 h-16
              border-4
              border-green-400/20
              border-t-green-400
              rounded-full
              animate-spin
              mx-auto mb-4
            " />

            <p>
              Abrindo câmera...
            </p>
          </div>
        </div>
      )}

      {/* 🚨 ERRO */}
      {erro && (

        <div className="
          absolute inset-0
          flex items-center
          justify-center
          p-6
        ">

          <div className="
            bg-red-500/10
            border border-red-500/30
            backdrop-blur-xl
            rounded-3xl
            p-6
            text-center
            text-white
            max-w-sm
          ">

            <p className="text-lg mb-2">
              ⚠️ Erro na câmera
            </p>

            <p className="
              text-sm text-gray-300
              mb-4
            ">
              {erro}
            </p>

            <button
              onClick={fechar}

              className="
                bg-white
                text-black
                px-5 py-2
                rounded-xl
                font-semibold
              "
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}