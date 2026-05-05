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
  PackageCheck,
  Pill,
  RefreshCcw,
  RotateCw,
  ScanLine,
  ShieldCheck,
  Trash2,
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

function Scanner({
  onClose,
  onScan,
  modoContinuo = false,
  itensPreview = [],
  onLimparPreview,
}) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);

  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const fechandoRef = useRef(false);

  const codigoBloqueadoRef = useRef("");
  const ultimoCodigoRef = useRef({ codigo: "", tempo: 0 });
  const iniciouComCameraEscolhidaRef = useRef(false);

  const [status, setStatus] = useState("iniciando");
  const [erro, setErro] = useState("");
  const [cameras, setCameras] = useState([]);
  const [cameraAtual, setCameraAtual] = useState("");

  const [codigoManual, setCodigoManual] = useState("");
  const [codigoLido, setCodigoLido] = useState("");
  const [codigoBloqueado, setCodigoBloqueado] = useState("");

  const [torchDisponivel, setTorchDisponivel] = useState(false);
  const [torchAtiva, setTorchAtiva] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    fechandoRef.current = false;

    iniciar();

    return () => {
      mountedRef.current = false;
      pararScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setSeguro(fn) {
    if (mountedRef.current && !fechandoRef.current) {
      fn();
    }
  }

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

  function limparBloqueio() {
    codigoBloqueadoRef.current = "";
    processingRef.current = false;

    setSeguro(() => {
      setCodigoBloqueado("");
      setCodigoLido("");
      setErro("");
      setStatus("lendo");
    });
  }

  function bloquearCodigo(codigo) {
    codigoBloqueadoRef.current = codigo;

    setSeguro(() => {
      setCodigoBloqueado(codigo);
      setCodigoLido("");
      setStatus("bloqueado");
    });
  }

  function ehCameraUltraWide(camera) {
    const label = String(camera?.label || "").toLowerCase();

    return (
      label.includes("ultra") ||
      label.includes("wide") ||
      label.includes("0.5") ||
      label.includes("0,5") ||
      label.includes("macro") ||
      label.includes("grande angular")
    );
  }

  function ehCameraTraseira(camera) {
    const label = String(camera?.label || "").toLowerCase();

    return (
      label.includes("back") ||
      label.includes("rear") ||
      label.includes("environment") ||
      label.includes("traseira") ||
      label.includes("ambiente")
    );
  }

  function escolherCameraPrincipal(lista = []) {
    if (!lista.length) return null;

    const traseiras = lista.filter(ehCameraTraseira);
    const candidatas = traseiras.length ? traseiras : lista;

    const principal =
      candidatas.find((cam) => !ehCameraUltraWide(cam)) ||
      candidatas[0] ||
      lista[0];

    return principal || null;
  }

  async function listarCamerasDisponiveis() {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];

      const dispositivos = await navigator.mediaDevices.enumerateDevices();

      const lista = dispositivos.filter(
        (device) => device.kind === "videoinput"
      );

      setCameras(lista);

      return lista;
    } catch (err) {
      console.warn("Não consegui listar câmeras:", err);
      return [];
    }
  }

  async function aplicarZoomPrincipal() {
    const stream = videoRef.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];

    if (!track?.getCapabilities) return;

    const capacidades = track.getCapabilities();

    if (!("zoom" in capacidades)) return;

    const min = Number(capacidades.zoom?.min || 1);
    const max = Number(capacidades.zoom?.max || 1);
    const zoomIdeal = Math.min(max, Math.max(min, 1));

    try {
      await track.applyConstraints({
        advanced: [{ zoom: zoomIdeal }],
      });
    } catch (err) {
      console.warn("Não consegui aplicar zoom 1x:", err);
    }
  }

  async function iniciar(deviceId = "") {
    try {
      setErro("");
      setCodigoLido("");
      setCodigoBloqueado("");
      setStatus("iniciando");

      processingRef.current = false;
      codigoBloqueadoRef.current = "";

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
        if (fechandoRef.current) return;

        if (controls && !controlsRef.current) {
          controlsRef.current = controls;
        }

        if (result) {
          const texto = String(result.getText() || "")
            .replace(/\s/g, "")
            .trim();

          if (!texto) return;

          const bloqueado = codigoBloqueadoRef.current;

          if (bloqueado && texto === bloqueado) {
            if (!processingRef.current) {
              setSeguro(() => {
                setStatus("bloqueado");
                setCodigoBloqueado(texto);
              });
            }

            return;
          }

          if (bloqueado && texto !== bloqueado) {
            codigoBloqueadoRef.current = "";

            setSeguro(() => {
              setCodigoBloqueado("");
              setStatus("lendo");
            });
          }

          await processarCodigo(texto);
          return;
        }

        if (err && erroIgnoravel(err)) {
          return;
        }

        if (err) {
          console.warn("Erro do leitor:", err);
        }
      };

      let controls;
      let deviceIdFinal = deviceId;

      if (!deviceIdFinal && !iniciouComCameraEscolhidaRef.current) {
        const lista = await listarCamerasDisponiveis();
        const principal = escolherCameraPrincipal(lista);

        if (principal?.deviceId) {
          deviceIdFinal = principal.deviceId;
          setCameraAtual(principal.deviceId);
          iniciouComCameraEscolhidaRef.current = true;
        }
      }

      if (deviceIdFinal) {
        controls = await reader.decodeFromVideoDevice(
          deviceIdFinal,
          video,
          callback
        );
      } else {
        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
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
        if (!fechandoRef.current) {
          listarCameras();
          prepararRecursosCamera();
          aplicarZoomPrincipal();
        }
      }, 500);
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
    const lista = await listarCamerasDisponiveis();

    if (!cameraAtual && lista.length > 0) {
      const principal = escolherCameraPrincipal(lista);

      if (principal?.deviceId) {
        setCameraAtual(principal.deviceId);
      }
    }
  }

  function prepararRecursosCamera() {
    const stream = videoRef.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];

    setTorchDisponivel(false);
    setTorchAtiva(false);

    if (!track?.getCapabilities) return;

    const capacidades = track.getCapabilities();

    if (capacidades.torch) {
      setTorchDisponivel(true);
    }
  }

  async function processarCodigo(codigo) {
    const codigoLimpo = String(codigo || "").replace(/\s/g, "").trim();

    if (!codigoLimpo || fechandoRef.current) return;

    if (processingRef.current) return;

    const agora = Date.now();
    const ultimo = ultimoCodigoRef.current;

    if (ultimo.codigo === codigoLimpo && agora - ultimo.tempo < 450) {
      return;
    }

    processingRef.current = true;

    ultimoCodigoRef.current = {
      codigo: codigoLimpo,
      tempo: agora,
    };

    setSeguro(() => {
      setCodigoLido(codigoLimpo);
      setStatus("lido");
    });

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
        if (!mountedRef.current || fechandoRef.current) return;

        processingRef.current = false;
        bloquearCodigo(codigoLimpo);
      }, 750);
    } catch (err) {
      console.error("Erro no onScan:", err);

      setSeguro(() => {
        setErro("Código lido, mas ocorreu erro ao processar.");
        setStatus("erro");
      });

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
      video.pause?.();
      video.srcObject = null;
      video.removeAttribute("src");
      video.load?.();
    }

    setTorchDisponivel(false);
    setTorchAtiva(false);
  }

  function pararScanner() {
    pararCamera();

    processingRef.current = false;
    codigoBloqueadoRef.current = "";
  }

  function fecharScanner() {
    if (fechandoRef.current) return;

    fechandoRef.current = true;

    pararScanner();
    onClose?.();
  }

  async function reiniciarScanner() {
    setErro("");
    setCodigoLido("");
    setCodigoBloqueado("");

    processingRef.current = false;
    codigoBloqueadoRef.current = "";
    iniciouComCameraEscolhidaRef.current = false;

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
    setCodigoBloqueado("");

    processingRef.current = false;
    codigoBloqueadoRef.current = "";
    iniciouComCameraEscolhidaRef.current = true;

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
    status === "lendo" ||
    status === "lido" ||
    status === "erro" ||
    status === "bloqueado";

  const lendo = status === "lendo";
  const lido = status === "lido";
  const bloqueado = status === "bloqueado";
  const iniciando = status === "iniciando";
  const emErro = status === "erro";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[99999]
        flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden
        bg-slate-950 text-white
      "
    >
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

      <div
        className="
          relative z-20 flex items-center justify-between gap-3
          px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-12 w-12 items-center justify-center rounded-2xl
              border border-white/10 bg-white/15 shadow-xl backdrop-blur-md
            "
          >
            <ScanLine size={25} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">Scanner</h2>

            <p className="truncate text-xs text-white/70">
              Mira segura, leitura rápida
            </p>
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fecharScanner();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fecharScanner();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fecharScanner();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="
            flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl
            bg-white text-slate-950 shadow-2xl shadow-black/30
            ring-1 ring-black/5 transition active:scale-95
          "
        >
          <X size={25} strokeWidth={3} />
        </button>
      </div>

      <div className="relative z-10 px-4">
        <StatusScanner
          iniciando={iniciando}
          lendo={lendo}
          lido={lido}
          bloqueado={bloqueado}
          emErro={emErro}
          codigoLido={codigoLido}
          codigoBloqueado={codigoBloqueado}
          erro={erro}
        />
      </div>

      <div
        className="
          relative z-10 flex min-h-[220px] shrink-0 items-center justify-center
          p-4 sm:min-h-[280px] sm:p-6
        "
      >
        <div className="relative h-[210px] w-full max-w-sm sm:h-[260px]">
          <div
            className={`
              absolute inset-0 rounded-[2rem] border-2
              ${
                lido
                  ? "border-emerald-400 shadow-[0_0_42px_rgba(52,211,153,0.35)]"
                  : bloqueado
                  ? "border-emerald-300/70 shadow-[0_0_42px_rgba(52,211,153,0.2)]"
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
              animate={{ y: 170, opacity: 1 }}
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
              {lido
                ? "Código capturado ✨"
                : bloqueado
                ? "Código já somado"
                : "Centralize o código aqui"}
            </div>
          </div>
        </div>
      </div>

      <div
        className="
          relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain
          px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]
        "
      >
        {codigoBloqueado ? (
          <button
            type="button"
            onClick={limparBloqueio}
            className="
              flex w-full items-center justify-center gap-2 rounded-3xl
              border border-emerald-400/20 bg-emerald-500/15 px-4 py-4
              text-sm font-black text-emerald-100 shadow-2xl backdrop-blur-md
              transition active:scale-[0.98]
            "
          >
            <ShieldCheck size={20} />
            Liberar mesmo código
          </button>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Crosshair size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">Câmera principal</p>
                <p className="text-xs text-white/60">
                  Tentando usar 1x e evitar ultra-wide 0,5x.
                </p>
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                1x
              </span>
            </div>
          </div>
        )}

        <MiniPreviewScanner itens={itensPreview} onLimpar={onLimparPreview} />

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
  bloqueado,
  emErro,
  codigoLido,
  codigoBloqueado,
  erro,
}) {
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

  if (bloqueado) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-emerald-100 backdrop-blur-md">
        <ShieldCheck size={23} />

        <div className="min-w-0">
          <p className="text-sm font-black">Já adicionado</p>
          <p className="truncate text-xs text-emerald-100/80">
            Para somar de novo, toque em liberar: {codigoBloqueado}
          </p>
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
            Leia um produto. Código repetido fica protegido.
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

function MiniPreviewScanner({ itens = [], onLimpar }) {
  if (!itens.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
            <PackageCheck size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">Itens escaneados</p>
            <p className="text-xs text-white/60">
              Os produtos somados aparecem aqui em tempo real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ultimo = itens[0];
  const restantes = itens.slice(1);

  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/15 p-3 text-emerald-50 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PackageCheck size={18} />
          <p className="text-sm font-black">Adicionado agora</p>
        </div>

        {onLimpar && (
          <button
            type="button"
            onClick={onLimpar}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition active:scale-95"
            title="Limpar preview"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-black/20 p-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
          {ultimo.imagem ? (
            <img
              src={ultimo.imagem}
              alt={ultimo.nome || "Medicamento"}
              className="h-full w-full object-cover"
            />
          ) : (
            <Pill size={24} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black">
            {ultimo.nome || "Medicamento"}
          </p>

          <p className="mt-0.5 truncate text-xs text-emerald-100/75">
            {ultimo.validade
              ? `Val: ${ultimo.validade}`
              : "Sem validade exibida"}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-center text-white shadow-lg shadow-emerald-500/20">
          <p className="text-[10px] font-bold leading-none">Qtd</p>
          <p className="text-xl font-black leading-none">
            {ultimo.quantidade || 1}
          </p>
        </div>
      </div>

      {restantes.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {restantes.map((item) => (
            <div
              key={item.id}
              className="flex min-w-[160px] items-center gap-2 rounded-2xl bg-black/20 p-2"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15">
                {item.imagem ? (
                  <img
                    src={item.imagem}
                    alt={item.nome || "Medicamento"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Pill size={18} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black">
                  {item.nome || "Medicamento"}
                </p>
                <p className="text-[11px] text-emerald-100/70">
                  x{item.quantidade || 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Scanner;