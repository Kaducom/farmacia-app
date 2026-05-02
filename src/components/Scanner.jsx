import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

import {
  AlertTriangle,
  Barcode,
  Camera,
  CameraOff,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  Keyboard,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ScanLine,
  X,
} from "lucide-react";

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const lendoRef = useRef(false);
  const iniciandoRef = useRef(false);
  const timeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [codigoLido, setCodigoLido] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    iniciarScanner(0);

    return () => {
      mountedRef.current = false;
      destruirScanner();
    };
  }, []);

  function setSeguro(callback) {
    if (mountedRef.current) callback();
  }

  function destruirScanner() {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      lendoRef.current = false;
      iniciandoRef.current = false;
    } catch (err) {
      console.error("Erro ao destruir scanner:", err);
    }
  }

  async function listarCameras() {
    const lista = await BrowserMultiFormatReader.listVideoInputDevices();

    const ordenada = [...lista].sort((a, b) => {
      const aBack = /back|rear|traseira|environment/i.test(a.label);
      const bBack = /back|rear|traseira|environment/i.test(b.label);

      if (aBack && !bBack) return -1;
      if (!aBack && bBack) return 1;

      return 0;
    });

    setSeguro(() => setDevices(ordenada));

    return ordenada;
  }

  async function iniciarScanner(index = 0) {
    if (iniciandoRef.current) return;

    iniciandoRef.current = true;

    try {
      setSeguro(() => {
        setLoading(true);
        setErro("");
        setCodigoLido("");
        setTorchOn(false);
        setTorchAvailable(false);
      });

      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error(
          "A câmera só funciona em HTTPS ou localhost. No celular, abra pelo PWA publicado em HTTPS."
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Este navegador não suporta câmera.");
      }

      let lista = devices;

      if (!lista.length) {
        lista = await listarCameras();
      }

      if (!lista.length) {
        throw new Error("Nenhuma câmera encontrada.");
      }

      const camera = lista[index] || lista[0];

      const constraints = {
        audio: false,
        video: {
          deviceId: camera?.deviceId ? { exact: camera.deviceId } : undefined,
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const reader = new BrowserMultiFormatReader();

      controlsRef.current = await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result) => {
          if (!result) return;

          const codigo = result.getText();

          if (!codigo || lendoRef.current) return;

          lendoRef.current = true;

          setSeguro(() => setCodigoLido(codigo));

          if (navigator.vibrate) navigator.vibrate([50, 20, 50]);

onScan(codigo);
fechar();
        }
      );

      const stream = videoRef.current?.srcObject;
      streamRef.current = stream;

      await melhorarCamera();

      setSeguro(() => setLoading(false));
    } catch (err) {
      console.error("Erro no scanner:", err);

      destruirScanner();

      setSeguro(() => {
        setErro(
          err?.message ||
            "Não consegui abrir a câmera. Verifique a permissão do navegador."
        );
        setLoading(false);
      });
    } finally {
      iniciandoRef.current = false;
    }
  }

  async function melhorarCamera() {
    const stream = videoRef.current?.srcObject;
    if (!stream) return;

    const [track] = stream.getVideoTracks();
    if (!track) return;

    const caps = track.getCapabilities?.() || {};
    const advanced = [];

    setSeguro(() => setTorchAvailable(Boolean(caps.torch)));

    if (caps.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    if (caps.exposureMode?.includes("continuous")) {
      advanced.push({ exposureMode: "continuous" });
    }

    if (caps.whiteBalanceMode?.includes("continuous")) {
      advanced.push({ whiteBalanceMode: "continuous" });
    }

    if (caps.zoom) {
      advanced.push({
        zoom: Math.min(caps.zoom.max || 1, Math.max(caps.zoom.min || 1, 1.4)),
      });
    }

    if (advanced.length) {
      try {
        await track.applyConstraints({ advanced });
      } catch {
        // navegador não aceitou, segue o baile
      }
    }

    try {
      await videoRef.current.play();
    } catch {
      // autoplay mobile pode ignorar
    }
  }

  async function trocarCamera() {
    if (devices.length <= 1) return;

    const next = deviceIndex + 1 >= devices.length ? 0 : deviceIndex + 1;

    destruirScanner();
    setDeviceIndex(next);

    setTimeout(() => {
      iniciarScanner(next);
    }, 250);
  }

  async function alternarLanterna() {
    try {
      const [track] = streamRef.current?.getVideoTracks?.() || [];
      if (!track) return;

      await track.applyConstraints({
        advanced: [{ torch: !torchOn }],
      });

      setTorchOn((prev) => !prev);
    } catch {
      setErro("Lanterna não suportada neste dispositivo.");
    }
  }

  function tentarNovamente() {
    destruirScanner();

    setSeguro(() => {
      setErro("");
      setLoading(true);
    });

    setTimeout(() => iniciarScanner(deviceIndex), 250);
  }

  function fechar() {
    mountedRef.current = false;
    destruirScanner();
    onClose();
  }

  function enviarManual() {
    const codigo = codigoManual.replace(/\D/g, "").trim();

    if (!codigo) return;

    if (navigator.vibrate) navigator.vibrate(30);

    onScan(codigo);

    setCodigoManual("");
    setManualOpen(false);
    fechar();
  }

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="relative h-72 w-72 rounded-[2rem] border border-emerald-400/40 shadow-[0_0_60px_rgba(52,211,153,0.35)]">
          <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-[1.5rem] border-l-4 border-t-4 border-emerald-400" />
          <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-[1.5rem] border-r-4 border-t-4 border-emerald-400" />
          <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[1.5rem] border-b-4 border-l-4 border-emerald-400" />
          <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[1.5rem] border-b-4 border-r-4 border-emerald-400" />

          <div className="absolute left-4 right-4 top-1/2 h-1 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.95)] animate-pulse" />

          <div className="absolute -bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-xs text-white/80 backdrop-blur-md">
            <ScanLine size={15} />
            Aproxime e mantenha firme
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between p-4">
        <div className="rounded-3xl bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Barcode size={20} className="text-emerald-400" />
            <p className="font-black">Scanner Inteligente</p>
          </div>

          <p className="mt-1 text-xs text-white/70">
            Mire no código de barras
          </p>
        </div>

        <button
          type="button"
          onClick={fechar}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition active:scale-95"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-50 p-4">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-3xl border border-white/10 bg-black/50 p-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={trocarCamera}
            disabled={devices.length <= 1}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-bold transition active:scale-95 disabled:opacity-40"
          >
            <RefreshCcw size={18} />
            Câmera
          </button>

          <button
            type="button"
            onClick={alternarLanterna}
            disabled={!torchAvailable}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-bold transition active:scale-95 disabled:opacity-40"
          >
            {torchOn ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
            Luz
          </button>

          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Keyboard size={18} />
            Manual
          </button>
        </div>
      </div>

      {codigoLido && (
        <div className="absolute left-1/2 top-28 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-xl">
          <CheckCircle2 size={18} />
          Código lido
        </div>
      )}

      {loading && (
        <TelaCentro>
          <Loader2 className="mx-auto mb-4 animate-spin text-emerald-400" size={54} />
          <p className="font-black">Abrindo câmera...</p>
          <p className="mt-2 text-sm text-white/60">
            Permita o acesso quando o navegador pedir.
          </p>
        </TelaCentro>
      )}

      {erro && (
        <TelaCentro>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
            <AlertTriangle size={30} />
          </div>

          <h2 className="text-lg font-black">Erro na câmera</h2>

          <p className="mt-2 text-sm text-white/70">{erro}</p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={tentarNovamente}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-black transition active:scale-95"
            >
              <RotateCcw size={18} />
              Tentar
            </button>

            <button
              type="button"
              onClick={fechar}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black text-white transition active:scale-95"
            >
              <CameraOff size={18} />
              Fechar
            </button>
          </div>
        </TelaCentro>
      )}

      {manualOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-6 text-center text-gray-950 shadow-2xl dark:bg-gray-900 dark:text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Camera size={30} />
            </div>

            <h2 className="text-lg font-black">Digitar código</h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Use quando a câmera não conseguir ler.
            </p>

            <input
              autoFocus
              inputMode="numeric"
              value={codigoManual}
              onChange={(e) =>
                setCodigoManual(e.target.value.replace(/\D/g, "").slice(0, 32))
              }
              placeholder="Código de barras"
              className="mt-5 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={enviarManual}
                className="h-12 flex-1 rounded-2xl bg-emerald-700 text-sm font-black text-white transition active:scale-95"
              >
                Confirmar
              </button>

              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-black text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TelaCentro({ children }) {
  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}