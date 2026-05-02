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
  const lastScanRef = useRef("");
  const timeoutRef = useRef(null);
  const initializingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [lido, setLido] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
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

  function safeSet(fn) {
    if (mountedRef.current) fn();
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

      lastScanRef.current = "";
      initializingRef.current = false;
    } catch (err) {
      console.error("Erro ao limpar scanner:", err);
    }
  }

  function feedback() {
    if (navigator.vibrate) {
      navigator.vibrate([50, 25, 50]);
    }
  }

  function finalizarLeitura(codigo) {
    const codigoLimpo = String(codigo || "").trim();

    if (!codigoLimpo) return;
    if (lastScanRef.current === codigoLimpo) return;

    lastScanRef.current = codigoLimpo;

    safeSet(() => {
      setLido(codigoLimpo);
    });

    feedback();
    onScan(codigoLimpo);

    timeoutRef.current = setTimeout(() => {
      lastScanRef.current = "";

      safeSet(() => {
        setLido("");
      });
    }, 1800);
  }

  async function carregarDispositivos() {
    const lista = await BrowserMultiFormatReader.listVideoInputDevices();

    const ordenada = [...lista].sort((a, b) => {
      const aBack = /back|rear|traseira|environment/i.test(a.label);
      const bBack = /back|rear|traseira|environment/i.test(b.label);

      if (aBack && !bBack) return -1;
      if (!aBack && bBack) return 1;

      return 0;
    });

    safeSet(() => {
      setDevices(ordenada);
    });

    return ordenada;
  }

  async function aplicarMelhoriasCamera() {
    const video = videoRef.current;
    const stream = video?.srcObject;

    if (!stream) return;

    streamRef.current = stream;

    const [track] = stream.getVideoTracks();

    if (!track) return;

    const capabilities = track.getCapabilities?.() || {};
    const advanced = [];

    safeSet(() => {
      setTorchAvailable(Boolean(capabilities.torch));
    });

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    if (capabilities.exposureMode?.includes("continuous")) {
      advanced.push({ exposureMode: "continuous" });
    }

    if (capabilities.whiteBalanceMode?.includes("continuous")) {
      advanced.push({ whiteBalanceMode: "continuous" });
    }

    if (capabilities.zoom) {
      const zoomIdeal = Math.min(
        capabilities.zoom.max || 1,
        Math.max(capabilities.zoom.min || 1, 1.4)
      );

      advanced.push({ zoom: zoomIdeal });
    }

    if (advanced.length) {
      try {
        await track.applyConstraints({ advanced });
      } catch {
        // Nem todo navegador aceita foco/zoom automático.
      }
    }

    try {
      await video.play();
    } catch {
      // Alguns navegadores já iniciam o play sozinhos.
    }
  }

  async function iniciarScanner(indexDesejado = deviceIndex) {
    if (initializingRef.current) return;

    initializingRef.current = true;

    try {
      safeSet(() => {
        setLoading(true);
        setErro("");
        setTorchOn(false);
        setTorchAvailable(false);
      });

      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error(
          "A câmera só funciona em HTTPS ou localhost. No celular, use o PWA publicado em HTTPS."
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Este navegador não tem suporte à câmera.");
      }

      let lista = devices;

      if (!lista.length) {
        lista = await carregarDispositivos();
      }

      if (!lista.length) {
        throw new Error("Nenhuma câmera encontrada neste dispositivo.");
      }

      const device = lista[indexDesejado] || lista[0];

      const constraints = {
        video: {
          deviceId: device?.deviceId ? { exact: device.deviceId } : undefined,
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const reader = new BrowserMultiFormatReader();

      controlsRef.current = await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result) => {
          if (!result) return;
          finalizarLeitura(result.getText());
        }
      );

      await aplicarMelhoriasCamera();

      safeSet(() => {
        setLoading(false);
      });
    } catch (err) {
      console.error("Erro no scanner:", err);

      destruirScanner();

      safeSet(() => {
        setErro(
          err?.message ||
            "Não consegui abrir a câmera. Verifique a permissão do navegador."
        );
        setLoading(false);
      });
    } finally {
      initializingRef.current = false;
    }
  }

  async function trocarCamera() {
    if (devices.length <= 1) return;

    const nextIndex = deviceIndex + 1 >= devices.length ? 0 : deviceIndex + 1;

    destruirScanner();

    setDeviceIndex(nextIndex);

    setTimeout(() => {
      iniciarScanner(nextIndex);
    }, 250);
  }

  async function alternarLanterna() {
    try {
      const stream = streamRef.current;
      const [track] = stream?.getVideoTracks?.() || [];

      if (!track) return;

      await track.applyConstraints({
        advanced: [{ torch: !torchOn }],
      });

      setTorchOn((prev) => !prev);
    } catch {
      setErro("Lanterna não suportada neste dispositivo.");
    }
  }

  function fechar() {
    mountedRef.current = false;
    destruirScanner();

    setTimeout(() => {
      onClose();
    }, 50);
  }

  function tentarNovamente() {
    destruirScanner();

    safeSet(() => {
      setErro("");
      setLoading(true);
    });

    setTimeout(() => {
      iniciarScanner(deviceIndex);
    }, 250);
  }

  function enviarManual() {
    const codigo = codigoManual.replace(/\D/g, "").trim();

    if (!codigo) return;

    finalizarLeitura(codigo);
    setCodigoManual("");
    setManualOpen(false);
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

          <div className="absolute -bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs text-white/80 backdrop-blur-md">
            <ScanLine size={15} />
            Aproxime e mantenha firme
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <div className="rounded-3xl bg-black/35 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Barcode size={20} className="text-emerald-400" />
            <p className="font-bold">Scanner Inteligente</p>
          </div>

          <p className="mt-1 text-xs text-white/70">
            Mire no código de barras do produto
          </p>
        </div>

        <button
          type="button"
          onClick={fechar}
          className="relative z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition active:scale-95"
          aria-label="Fechar scanner"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-3xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={trocarCamera}
            disabled={devices.length <= 1}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-semibold transition active:scale-95 disabled:opacity-40"
          >
            <RefreshCcw size={18} />
            Câmera
          </button>

          <button
            type="button"
            onClick={alternarLanterna}
            disabled={!torchAvailable}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-semibold transition active:scale-95 disabled:opacity-40"
          >
            {torchOn ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
            Luz
          </button>

          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Keyboard size={18} />
            Manual
          </button>
        </div>
      </div>

      {lido && (
        <div className="absolute left-1/2 top-28 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-xl">
          <CheckCircle2 size={18} />
          Código lido
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
          <div className="text-center">
            <Loader2
              className="mx-auto mb-4 animate-spin text-emerald-400"
              size={54}
            />

            <p className="font-semibold">Abrindo câmera...</p>

            <p className="mt-2 text-sm text-white/60">
              Permita o acesso à câmera quando o navegador pedir.
            </p>
          </div>
        </div>
      )}

      {erro && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/25 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
              <AlertTriangle size={30} />
            </div>

            <h2 className="text-lg font-bold">Erro na câmera</h2>

            <p className="mt-2 text-sm text-white/70">{erro}</p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={tentarNovamente}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-black transition active:scale-95"
              >
                <RotateCcw size={18} />
                Tentar
              </button>

              <button
                type="button"
                onClick={fechar}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white transition active:scale-95"
              >
                <CameraOff size={18} />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {manualOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-6 text-center text-gray-950 shadow-2xl dark:bg-gray-900 dark:text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Camera size={30} />
            </div>

            <h2 className="text-lg font-bold">Digitar código</h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Use isso quando a câmera não conseguir ler.
            </p>

            <input
              autoFocus
              inputMode="numeric"
              value={codigoManual}
              onChange={(e) =>
                setCodigoManual(e.target.value.replace(/\D/g, "").slice(0, 32))
              }
              placeholder="Código de barras"
              className="mt-5 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-800 dark:bg-gray-950"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={enviarManual}
                className="h-12 flex-1 rounded-2xl bg-emerald-700 text-sm font-bold text-white transition active:scale-95"
              >
                Confirmar
              </button>

              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-gray-200"
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