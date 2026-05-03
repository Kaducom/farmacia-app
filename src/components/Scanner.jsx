import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

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

const FORMATOS_CODIGO = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
];

function Scanner({ onClose, onScan, modoContinuo = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);
  const rafRef = useRef(null);
  const ultimaTentativaRef = useRef(0);
  const ultimoCodigoRef = useRef({ codigo: "", tempo: 0 });

  const [status, setStatus] = useState("iniciando");
  const [erro, setErro] = useState("");
  const [cameras, setCameras] = useState([]);
  const [cameraAtual, setCameraAtual] = useState("");
  const [codigoManual, setCodigoManual] = useState("");
  const [codigoLido, setCodigoLido] = useState("");
  const [leitorDisponivel, setLeitorDisponivel] = useState(true);

  const [torchDisponivel, setTorchDisponivel] = useState(false);
  const [torchAtiva, setTorchAtiva] = useState(false);

  const [zoomDisponivel, setZoomDisponivel] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(1);
  const [zoomStep, setZoomStep] = useState(0.1);

  useEffect(() => {
    iniciar();

    return () => {
      pararScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciar(cameraId = "") {
    setErro("");
    setStatus("iniciando");

    if (!window.isSecureContext) {
      setErro(
        "A câmera precisa de HTTPS ou localhost. No PC, rode pelo localhost do Vite."
      );
      setStatus("erro");
      setLeitorDisponivel(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErro("Este navegador não liberou acesso à câmera.");
      setStatus("erro");
      setLeitorDisponivel(false);
      return;
    }

    const temBarcodeDetector = "BarcodeDetector" in window;
    setLeitorDisponivel(temBarcodeDetector);

    if (!temBarcodeDetector) {
      setErro(
        "Seu navegador não suporta leitura automática nativa. Use a digitação manual por enquanto."
      );
    }

    try {
      await abrirCamera(cameraId);
      await listarCameras();

      if (temBarcodeDetector) {
        criarDetector();
        iniciarLoopLeitura();
      } else {
        setStatus("manual");
      }
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);

      if (err?.name === "NotAllowedError") {
        setErro("Permissão da câmera bloqueada. Libere a câmera no navegador.");
      } else if (err?.name === "NotFoundError") {
        setErro("Nenhuma câmera foi encontrada neste dispositivo.");
      } else if (err?.name === "NotReadableError") {
        setErro("A câmera está ocupada por outro app ou aba.");
      } else {
        setErro("Não consegui abrir a câmera. Use a entrada manual.");
      }

      setStatus("erro");
    }
  }

  async function abrirCamera(cameraId = "") {
    pararCamera();

    const constraints = {
      audio: false,
      video: cameraId
        ? {
            deviceId: { exact: cameraId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        : {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;

    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;

    await video.play();

    prepararRecursosCamera(stream);

    setStatus(leitorDisponivel ? "lendo" : "manual");
  }

  async function listarCameras() {
    try {
      const dispositivos = await navigator.mediaDevices.enumerateDevices();

      const listaCameras = dispositivos.filter(
        (device) => device.kind === "videoinput"
      );

      setCameras(listaCameras);

      if (!cameraAtual && listaCameras[0]?.deviceId) {
        setCameraAtual(listaCameras[0].deviceId);
      }
    } catch (err) {
      console.warn("Não consegui listar câmeras:", err);
    }
  }

  function criarDetector() {
    try {
      detectorRef.current = new window.BarcodeDetector({
        formats: FORMATOS_CODIGO,
      });
    } catch (err) {
      console.warn("Detector com formatos falhou, usando detector padrão:", err);

      try {
        detectorRef.current = new window.BarcodeDetector();
      } catch (erroDetector) {
        console.error("BarcodeDetector indisponível:", erroDetector);
        detectorRef.current = null;
        setLeitorDisponivel(false);
        setStatus("manual");
      }
    }
  }

  function prepararRecursosCamera(stream) {
    const track = stream.getVideoTracks?.()[0];

    if (!track?.getCapabilities) {
      setTorchDisponivel(false);
      setZoomDisponivel(false);
      return;
    }

    const capacidades = track.getCapabilities();

    const temTorch = Boolean(capacidades.torch);
    setTorchDisponivel(temTorch);
    setTorchAtiva(false);

    if ("zoom" in capacidades) {
      const min = Number(capacidades.zoom?.min || 1);
      const max = Number(capacidades.zoom?.max || 1);
      const step = Number(capacidades.zoom?.step || 0.1);

      setZoomDisponivel(max > min);
      setZoomMin(min);
      setZoomMax(max);
      setZoomStep(step);
      setZoom(min);
    } else {
      setZoomDisponivel(false);
      setZoom(1);
    }
  }

  function iniciarLoopLeitura() {
    if (!detectorRef.current) return;

    scanningRef.current = true;
    setStatus("lendo");

    async function loop() {
      if (!scanningRef.current) return;

      rafRef.current = requestAnimationFrame(loop);

      const agora = Date.now();

      if (agora - ultimaTentativaRef.current < 220) return;

      ultimaTentativaRef.current = agora;

      const video = videoRef.current;
      const detector = detectorRef.current;

      if (!video || !detector || video.readyState < 2) return;

      try {
        const codigos = await detector.detect(video);

        if (!codigos?.length) return;

        const bruto =
          codigos[0]?.rawValue ||
          codigos[0]?.rawValueText ||
          codigos[0]?.displayValue ||
          "";

        if (bruto) {
          await processarCodigo(bruto);
        }
      } catch (err) {
        console.warn("Falha momentânea na leitura:", err);
      }
    }

    loop();
  }

  async function processarCodigo(codigo) {
    const codigoLimpo = String(codigo || "").replace(/\s/g, "").trim();

    if (!codigoLimpo) return;

    const agora = Date.now();
    const ultimo = ultimoCodigoRef.current;

    if (ultimo.codigo === codigoLimpo && agora - ultimo.tempo < 1800) {
      return;
    }

    ultimoCodigoRef.current = {
      codigo: codigoLimpo,
      tempo: agora,
    };

    setCodigoLido(codigoLimpo);
    setStatus("lido");

    tocarBip();

    if (navigator.vibrate) {
      navigator.vibrate([45, 35, 45]);
    }

    try {
      await Promise.resolve(onScan?.(codigoLimpo, { modoContinuo }));
    } catch (err) {
      console.error("Erro no onScan:", err);
      setErro("Código lido, mas ocorreu erro ao processar.");
      setStatus("erro");
      return;
    }

    setTimeout(() => {
      if (modoContinuo) {
        setCodigoLido("");
        setStatus(leitorDisponivel ? "lendo" : "manual");
      }
    }, 1200);
  }

  function tocarBip() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const contexto = new AudioContext();
      const oscillator = contexto.createOscillator();
      const gain = contexto.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;

      oscillator.connect(gain);
      gain.connect(contexto.destination);

      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        contexto.close();
      }, 90);
    } catch {
      // Sem drama se o navegador bloquear áudio.
    }
  }

  function pararCamera() {
    scanningRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    detectorRef.current = null;
    setTorchAtiva(false);
    setTorchDisponivel(false);
    setZoomDisponivel(false);
  }

  function pararScanner() {
    pararCamera();
  }

  function fecharScanner() {
    pararScanner();
    onClose?.();
  }

  async function reiniciarScanner() {
    setErro("");
    setCodigoLido("");
    await iniciar(cameraAtual);
  }

  async function trocarCamera() {
    if (cameras.length <= 1) {
      setErro("Só encontrei uma câmera neste dispositivo.");
      return;
    }

    const indiceAtual = cameras.findIndex(
      (camera) => camera.deviceId === cameraAtual
    );

    const proxima = cameras[(indiceAtual + 1) % cameras.length];

    if (!proxima?.deviceId) return;

    setCameraAtual(proxima.deviceId);
    setCodigoLido("");
    await iniciar(proxima.deviceId);
  }

  async function alternarLanterna() {
    const track = streamRef.current?.getVideoTracks?.()[0];

    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchAtiva }],
      });

      setTorchAtiva((prev) => !prev);
    } catch (err) {
      console.warn("Lanterna indisponível:", err);
      setErro("Lanterna não disponível nesta câmera.");
    }
  }

  async function aplicarZoom(valor) {
    const novoZoom = Number(valor);
    setZoom(novoZoom);

    const track = streamRef.current?.getVideoTracks?.()[0];

    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ zoom: novoZoom }],
      });
    } catch (err) {
      console.warn("Zoom indisponível:", err);
    }
  }

  function enviarManual(e) {
    e.preventDefault();

    const codigo = codigoManual.replace(/\D/g, "").trim();

    if (!codigo) {
      setErro("Digite um código válido.");
      return;
    }

    setCodigoManual("");
    processarCodigo(codigo);
  }

  const cameraLigada = status === "lendo" || status === "lido" || status === "manual";
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

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/80" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/15 shadow-xl backdrop-blur-md">
            <ScanLine size={25} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">
              Scanner Blindado
            </h2>

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
          leitorDisponivel={leitorDisponivel}
          codigoLido={codigoLido}
          erro={erro}
        />
      </div>

      {/* ÁREA DE MIRA */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="relative h-[230px] w-full max-w-sm">
          <div
            className={`
              absolute inset-0 rounded-[2rem] border-2
              ${
                lido
                  ? "border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.35)]"
                  : emErro
                  ? "border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.25)]"
                  : "border-white/70 shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              }
            `}
          />

          <div className="absolute -left-1 -top-1 h-12 w-12 rounded-tl-[2rem] border-l-4 border-t-4 border-emerald-400" />
          <div className="absolute -right-1 -top-1 h-12 w-12 rounded-tr-[2rem] border-r-4 border-t-4 border-emerald-400" />
          <div className="absolute -bottom-1 -left-1 h-12 w-12 rounded-bl-[2rem] border-b-4 border-l-4 border-emerald-400" />
          <div className="absolute -bottom-1 -right-1 h-12 w-12 rounded-br-[2rem] border-b-4 border-r-4 border-emerald-400" />

          {lendo && (
            <motion.div
              initial={{ y: 10, opacity: 0.6 }}
              animate={{ y: 190, opacity: 1 }}
              transition={{
                duration: 1.35,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="
                absolute left-5 right-5 top-3 h-1 rounded-full
                bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.95)]
              "
            />
          )}

          <div className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 items-center justify-center">
            <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-bold text-white/85 backdrop-blur-md">
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

function StatusScanner({
  iniciando,
  lendo,
  lido,
  emErro,
  leitorDisponivel,
  codigoLido,
  erro,
}) {
  if (iniciando) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <Loader2 size={22} className="animate-spin text-emerald-300" />
        <div>
          <p className="text-sm font-black">Abrindo câmera...</p>
          <p className="text-xs text-white/65">Preparando o radar farmacêutico</p>
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

  if (!leitorDisponivel) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-amber-400/30 bg-amber-500/15 p-4 text-amber-100 backdrop-blur-md">
        <Keyboard size={23} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-black">Leitura automática indisponível</p>
          <p className="text-xs text-amber-100/80">
            A câmera pode abrir, mas este navegador precisa da entrada manual.
          </p>
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
            Boa luz, código reto e câmera firme. O resto é feitiçaria óptica.
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
        <p className="text-xs text-white/65">Use reiniciar ou digite manualmente.</p>
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