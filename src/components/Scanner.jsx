import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  ChecksumException,
  DecodeHintType,
  FormatException,
  NotFoundException,
} from "@zxing/library";

import {
  AlertTriangle,
  Barcode,
  Camera,
  CameraOff,
  CheckCircle2,
  Crosshair,
  Keyboard,
  Lightbulb,
  LightbulbOff,
  Loader2,
  RefreshCcw,
  RotateCw,
  ScanLine,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";

const FORMATOS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
];

function criarHints() {
  const hints = new Map();

  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATOS);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return hints;
}

function Scanner({ onClose, onScan, modoContinuo = false }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const ultimoCodigoRef = useRef({ codigo: "", tempo: 0 });

  const [status, setStatus] = useState("iniciando");
  const [erro, setErro] = useState("");
  const [cameras, setCameras] = useState([]);
  const [cameraAtual, setCameraAtual] = useState("");
  const [codigoManual, setCodigoManual] = useState("");
  const [codigoLido, setCodigoLido] = useState("");

  const [torchDisponivel, setTorchDisponivel] = useState(false);
  const [torchAtiva, setTorchAtiva] = useState(false);

  const [zoomDisponivel, setZoomDisponivel] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(1);
  const [zoomStep, setZoomStep] = useState(0.1);

  useEffect(() => {
    mountedRef.current = true;
    iniciar();

    return () => {
      mountedRef.current = false;
      pararScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function erroIgnoravel(err) {
    return (
      err instanceof NotFoundException ||
      err instanceof ChecksumException ||
      err instanceof FormatException ||
      err?.name === "NotFoundException" ||
      err?.name === "ChecksumException" ||
      err?.name === "FormatException"
    );
  }

  function setSeguro(fn) {
    if (mountedRef.current) fn();
  }

  async function iniciar(deviceId = "") {
    try {
      setErro("");
      setCodigoLido("");
      setStatus("iniciando");
      processingRef.current = false;

      if (!navigator.mediaDevices?.getUserMedia) {
        setErro("Este navegador não liberou acesso à câmera.");
        setStatus("erro");
        return;
      }

      pararCamera();

      const video = videoRef.current;

      if (!video) {
        setErro("Elemento de vídeo não encontrado.");
        setStatus("erro");
        return;
      }

      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;

      const reader = new BrowserMultiFormatReader(criarHints());
      readerRef.current = reader;

      const callback = async (result, err, controls) => {
        if (controls && !controlsRef.current) {
          controlsRef.current = controls;
        }

        if (result) {
          await processarCodigo(result.getText());
          return;
        }

        if (err && !erroIgnoravel(err)) {
          console.warn("Erro do leitor:", err);
        }
      };

      let controls;

      if (deviceId) {
        controls = await reader.decodeFromVideoDevice(
          deviceId,
          video,
          callback
        );
      } else {
        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          video,
          callback
        );
      }

      controlsRef.current = controls;

      setSeguro(() => {
        setStatus("lendo");
      });

      setTimeout(() => {
        listarCameras();
        prepararRecursosCamera();
      }, 450);
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);

      let msg = "Não consegui abrir a câmera. Use a entrada manual.";

      if (err?.name === "NotAllowedError") {
        msg = "Permissão da câmera bloqueada. Libere a câmera no navegador.";
      }

      if (err?.name === "NotFoundError") {
        msg = "Nenhuma câmera foi encontrada neste dispositivo.";
      }

      if (err?.name === "NotReadableError") {
        msg = "A câmera está ocupada por outro app ou aba.";
      }

      if (err?.name === "OverconstrainedError") {
        msg = "Essa câmera não aceitou as configurações. Tente trocar a câmera.";
      }

      setSeguro(() => {
        setErro(msg);
        setStatus("erro");
      });
    }
  }

  async function listarCameras() {
    try {
      const dispositivos = await navigator.mediaDevices.enumerateDevices();

      const lista = dispositivos.filter(
        (device) => device.kind === "videoinput"
      );

      setCameras(lista);

      if (!cameraAtual && lista.length > 0) {
        const traseira =
          lista.find((cam) =>
            /back|rear|environment|traseira|ambiente/i.test(cam.label || "")
          ) || lista[0];

        setCameraAtual(traseira.deviceId);
      }
    } catch (err) {
      console.warn("Não consegui listar câmeras:", err);
    }
  }

  function prepararRecursosCamera() {
    const stream = videoRef.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];

    setTorchDisponivel(false);
    setTorchAtiva(false);
    setZoomDisponivel(false);

    if (!track?.getCapabilities) return;

    const capacidades = track.getCapabilities();

    if (capacidades.torch) {
      setTorchDisponivel(true);
    }

    if ("zoom" in capacidades) {
      const min = Number(capacidades.zoom?.min || 1);
      const max = Number(capacidades.zoom?.max || 1);
      const step = Number(capacidades.zoom?.step || 0.1);

      setZoomMin(min);
      setZoomMax(max);
      setZoomStep(step);
      setZoom(min);
      setZoomDisponivel(max > min);
    }
  }

  async function processarCodigo(codigo) {
    const codigoLimpo = String(codigo || "").replace(/\s/g, "").trim();

    if (!codigoLimpo) return;

    if (processingRef.current) return;

    const agora = Date.now();
    const ultimo = ultimoCodigoRef.current;

    if (ultimo.codigo === codigoLimpo && agora - ultimo.tempo < 1400) {
      return;
    }

    processingRef.current = true;

    ultimoCodigoRef.current = {
      codigo: codigoLimpo,
      tempo: agora,
    };

    setCodigoLido(codigoLimpo);
    setStatus("lido");

    tocarBip();

    if (navigator.vibrate) {
      navigator.vibrate([35, 25, 35]);
    }

    try {
      const resposta = await Promise.resolve(
        onScan?.(codigoLimpo, {
          modoContinuo,
          origem: "scanner",
        })
      );

      const deveFechar =
        resposta === "fechar" ||
        resposta?.fecharScanner === true ||
        resposta?.abrirModal === true ||
        modoContinuo === false;

      if (deveFechar) {
        setTimeout(() => {
          fecharScanner();
        }, 180);

        return;
      }

      setTimeout(() => {
        if (!mountedRef.current) return;

        setCodigoLido("");
        setStatus("lendo");
        processingRef.current = false;
      }, 650);
    } catch (err) {
      console.error("Erro no onScan:", err);

      setErro("Código lido, mas ocorreu erro ao processar.");
      setStatus("erro");
      processingRef.current = false;
    }
  }

  function tocarBip() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const contexto = new AudioContext();
      const oscillator = contexto.createOscillator();
      const gain = contexto.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 920;
      gain.gain.value = 0.045;

      oscillator.connect(gain);
      gain.connect(contexto.destination);

      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        contexto.close();
      }, 80);
    } catch {
      // Alguns navegadores bloqueiam áudio sem gesto do usuário.
    }
  }

  function pararCamera() {
    try {
      controlsRef.current?.stop?.();
    } catch (err) {
      console.warn("Erro ao parar controls:", err);
    }

    controlsRef.current = null;

    try {
      readerRef.current?.reset?.();
    } catch {
      // Algumas versões não expõem reset. Sem problema.
    }

    readerRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject;

    if (stream?.getTracks) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (video) {
      video.srcObject = null;
    }

    setTorchDisponivel(false);
    setTorchAtiva(false);
    setZoomDisponivel(false);
  }

  function pararScanner() {
    pararCamera();
    processingRef.current = false;
  }

  function fecharScanner() {
    pararScanner();
    onClose?.();
  }

  async function reiniciarScanner() {
    setErro("");
    setCodigoLido("");
    processingRef.current = false;
    await iniciar(cameraAtual);
  }

  async function trocarCamera() {
    if (cameras.length <= 1) {
      setErro("Só encontrei uma câmera neste dispositivo.");
      setStatus("erro");
      return;
    }

    const indiceAtual = cameras.findIndex(
      (camera) => camera.deviceId === cameraAtual
    );

    const proxima = cameras[(indiceAtual + 1) % cameras.length];

    if (!proxima?.deviceId) return;

    setCameraAtual(proxima.deviceId);
    setErro("");
    setCodigoLido("");
    processingRef.current = false;

    await iniciar(proxima.deviceId);
  }

  async function alternarLanterna() {
    const stream = videoRef.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];

    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchAtiva }],
      });

      setTorchAtiva((prev) => !prev);
    } catch (err) {
      console.warn("Lanterna indisponível:", err);
      setErro("Lanterna não disponível nesta câmera.");
      setStatus("erro");
    }
  }

  async function aplicarZoom(valor) {
    const novoZoom = Number(valor);
    setZoom(novoZoom);

    const stream = videoRef.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];

    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ zoom: novoZoom }],
      });
    } catch (err) {
      console.warn("Zoom indisponível:", err);
    }
  }

  async function enviarManual(e) {
    e.preventDefault();

    const codigo = codigoManual.replace(/\D/g, "").trim();

    if (!codigo) {
      setErro("Digite um código válido.");
      setStatus("erro");
      return;
    }

    setCodigoManual("");
    await processarCodigo(codigo);
  }

  const cameraLigada =
    status === "lendo" || status === "lido" || status === "erro";

  const lendo = status === "lendo";
  const lido = status === "lido";
  const iniciando = status === "iniciando";
  const emErro = status === "erro";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[99999]
        flex flex-col overflow-hidden
        bg-slate-950 text-white
      "
    >
      {/* VIDEO */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`
            h-full w-full object-cover transition
            ${cameraLigada ? "opacity-100" : "opacity-20"}
          `}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/10 to-black/85" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/15 shadow-xl backdrop-blur-md">
            <ScanLine size={25} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">Scanner Blindado</h2>

            <p className="truncate text-xs text-white/70">
              Mire no código de barras
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fecharScanner}
          className="
            flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
            bg-white text-slate-950 shadow-xl transition active:scale-95
          "
        >
          <X size={23} />
        </button>
      </div>

      {/* STATUS */}
      <div className="relative z-10 px-4">
        <StatusScanner
          iniciando={iniciando}
          lendo={lendo}
          lido={lido}
          emErro={emErro}
          codigoLido={codigoLido}
          erro={erro}
        />
      </div>

      {/* MIRA */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="relative h-[230px] w-full max-w-sm">
          <div
            className={`
              absolute inset-0 rounded-[2rem] border-2
              ${
                lido
                  ? "border-emerald-400 shadow-[0_0_42px_rgba(52,211,153,0.35)]"
                  : emErro
                  ? "border-red-400 shadow-[0_0_42px_rgba(248,113,113,0.25)]"
                  : "border-white/70 shadow-[0_0_42px_rgba(255,255,255,0.12)]"
              }
            `}
          />

          <div className="absolute -left-1 -top-1 h-12 w-12 rounded-tl-[2rem] border-l-4 border-t-4 border-emerald-400" />
          <div className="absolute -right-1 -top-1 h-12 w-12 rounded-tr-[2rem] border-r-4 border-t-4 border-emerald-400" />
          <div className="absolute -bottom-1 -left-1 h-12 w-12 rounded-bl-[2rem] border-b-4 border-l-4 border-emerald-400" />
          <div className="absolute -bottom-1 -right-1 h-12 w-12 rounded-br-[2rem] border-b-4 border-r-4 border-emerald-400" />

          {lendo && (
            <motion.div
              initial={{ y: 10, opacity: 0.7 }}
              animate={{ y: 190, opacity: 1 }}
              transition={{
                duration: 1.25,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="
                absolute left-5 right-5 top-3 h-1 rounded-full
                bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.95)]
              "
            />
          )}

          <div className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 items-center justify-center">
            <div className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-bold text-white/85 backdrop-blur-md">
              {lido ? "Código capturado ✨" : "Centralize o código aqui"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="relative z-10 space-y-3 p-4 pb-5">
        {zoomDisponivel && (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Crosshair size={17} />
                Zoom
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min={zoomMin}
              max={zoomMax}
              step={zoomStep}
              value={zoom}
              onChange={(e) => aplicarZoom(e.target.value)}
              className="w-full accent-emerald-400"
            />
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          <BotaoControle
            icon={RefreshCcw}
            label="Reiniciar"
            onClick={reiniciarScanner}
          />

          <BotaoControle
            icon={RotateCw}
            label="Câmera"
            onClick={trocarCamera}
            disabled={cameras.length <= 1}
          />

          <BotaoControle
            icon={torchAtiva ? LightbulbOff : Lightbulb}
            label={torchAtiva ? "Apagar" : "Luz"}
            onClick={alternarLanterna}
            disabled={!torchDisponivel}
          />

          <BotaoControle
            icon={modoContinuo ? Zap : ShieldCheck}
            label={modoContinuo ? "Contínuo" : "Único"}
            disabled
          />
        </div>

        {/* MANUAL */}
        <form
          onSubmit={enviarManual}
          className="rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur-md"
        >
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/75">
            <Keyboard size={16} />
            Entrada manual, para PC ou câmera teimosa
          </div>

          <div className="flex gap-2">
            <input
              value={codigoManual}
              onChange={(e) =>
                setCodigoManual(e.target.value.replace(/\D/g, ""))
              }
              inputMode="numeric"
              placeholder="Digite o código de barras"
              className="
                min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3
                text-sm font-bold text-white outline-none placeholder:text-white/35
                focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
              "
            />

            <button
              type="submit"
              className="
                flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                bg-emerald-600 text-white shadow-lg shadow-emerald-600/25
                transition active:scale-95
              "
            >
              <Barcode size={22} />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function StatusScanner({ iniciando, lendo, lido, emErro, codigoLido, erro }) {
  if (iniciando) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <Loader2 size={22} className="animate-spin text-emerald-300" />

        <div>
          <p className="text-sm font-black">Abrindo câmera...</p>
          <p className="text-xs text-white/65">
            Preparando o radar farmacêutico
          </p>
        </div>
      </div>
    );
  }

  if (lido) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-emerald-100 backdrop-blur-md">
        <CheckCircle2 size={23} />

        <div className="min-w-0">
          <p className="text-sm font-black">Código lido</p>
          <p className="truncate text-xs text-emerald-100/80">{codigoLido}</p>
        </div>
      </div>
    );
  }

  if (emErro) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-red-400/30 bg-red-500/15 p-4 text-red-100 backdrop-blur-md">
        <AlertTriangle size={23} className="mt-0.5 shrink-0" />

        <div>
          <p className="text-sm font-black">Scanner em modo segurança</p>
          <p className="text-xs text-red-100/80">{erro}</p>
        </div>
      </div>
    );
  }

  if (lendo) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <Camera size={22} className="text-emerald-300" />

        <div>
          <p className="text-sm font-black">Scanner ativo</p>
          <p className="text-xs text-white/65">
            Leu, processou, libera. Modo esteira de farmácia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
      <CameraOff size={22} />

      <div>
        <p className="text-sm font-black">Câmera pausada</p>
        <p className="text-xs text-white/65">
          Use reiniciar ou digite manualmente.
        </p>
      </div>
    </div>
  );
}

function BotaoControle({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl
        border border-white/10 bg-white/10 px-2 py-3 text-xs font-bold
        text-white backdrop-blur-md transition active:scale-95
        disabled:cursor-not-allowed disabled:opacity-40
      "
    >
      <Icon size={20} />
      {label}
    </button>
  );
}

export default Scanner;