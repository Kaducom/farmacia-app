import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const lastCode = useRef(null);
  const timeoutRef = useRef(null);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    iniciarScanner();

    return () => pararScanner();
  }, []);

  async function iniciarScanner() {
    codeReader.current = new BrowserMultiFormatReader();

    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      const deviceId = devices[0]?.deviceId;

      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result && ativo) {
            const codigo = result.getText();

            // 🔥 evita leitura duplicada
            if (lastCode.current === codigo) return;

            lastCode.current = codigo;

            feedback();

            onScan(codigo);

            // pausa antes de permitir nova leitura
            setAtivo(false);

            timeoutRef.current = setTimeout(() => {
              lastCode.current = null;
              setAtivo(true);
            }, 2000);
          }
        }
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao acessar câmera 😢");
      onClose();
    }
  }

  function pararScanner() {
    if (codeReader.current) {
      codeReader.current.reset();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }

  function feedback() {
    // 🔊 som
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
    );
    audio.play().catch(() => {});

    // 📳 vibração
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">

      {/* HEADER */}
      <div className="p-4 text-white flex justify-between items-center">
        <span>📷 Escaneando...</span>
        <button onClick={onClose}>✕</button>
      </div>

      {/* VIDEO */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-4 border-green-400 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}