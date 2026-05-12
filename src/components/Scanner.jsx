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
  Keyboard,
  Lightbulb,
  LightbulbOff,
  Loader2,
  Minus,
  PackageCheck,
  Pill,
  Plus,
  RefreshCcw,
  RotateCw,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
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
  const [quantidadeScanner, setQuantidadeScanner] = useState(1);

  useEffect(() => {
    mountedRef.current = true;
    fechandoRef.current = false;

    liberarTravasAntigas();

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: true },
      })
    );

    iniciar();

    return () => {
      mountedRef.current = false;
      pararScanner();

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );

      setTimeout(liberarTravasAntigas, 80);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function liberarTravasAntigas() {
    const main = document.querySelector("main");

    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.touchAction = "";
    document.body.style.overscrollBehavior = "";

    document.documentElement.style.overflow = "";
    document.documentElement.style.position = "";
    document.documentElement.style.touchAction = "";
    document.documentElement.style.overscrollBehavior = "";

    if (main) {
      main.style.overflow = "";
      main.style.position = "";
      main.style.touchAction = "";
      main.style.overscrollBehavior = "";
    }
  }

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

  function alterarQuantidade(delta) {
    setQuantidadeScanner((prev) => {
      const atual = Number(prev || 1);
      return Math.max(1, Math.min(999, atual + delta));
    });
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

    return (
      candidatas.find((cam) => !ehCameraUltraWide(cam)) ||
      candidatas[0] ||
      lista[0] ||
      null
    );
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

        if (err && erroIgnoravel(err)) return;

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
          quantidade: quantidadeScanner,
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
      }, 700);
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

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: false },
      })
    );

    onClose?.();

    setTimeout(liberarTravasAntigas, 80);
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
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.18 }}
      className="
        fixed inset-0 z-[99990]
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
            h-full w-full object-cover transition duration-300
            ${cameraLigada ? "opacity-100" : "opacity-25"}
          `}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/5 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.92),transparent_58%)]" />
      </div>

      {/* TOPO */}
      <div
        className="
          relative z-20 shrink-0 px-4
          pt-[calc(env(safe-area-inset-top)+0.85rem)]
        "
      >
        <div
          className="
            flex items-center justify-between gap-3 rounded-[1.75rem]
            border border-white/10 bg-slate-950/45 p-3 shadow-2xl
            backdrop-blur-xl
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/20
              "
            >
              <ScanLine size={25} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-black">Scanner</h2>

              <p className="truncate text-xs text-white/65">
                Leitura rápida com quantidade por scan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fecharScanner}
            className="
              flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
              bg-white text-slate-950 shadow-xl shadow-black/25
              transition active:scale-95
            "
            aria-label="Fechar scanner"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* MIRA */}
      <div
        className="
          relative z-10 flex min-h-0 flex-1 items-center justify-center
          px-4 py-4
        "
      >
        <div
          className="
            relative h-[min(52dvh,410px)] w-full max-w-md
            sm:h-[430px]
          "
        >
          <div
            className={`
              absolute inset-0 rounded-[2.25rem] border-2 backdrop-blur-[1px]
              ${
                lido
                  ? "border-emerald-400 shadow-[0_0_58px_rgba(52,211,153,0.5)]"
                  : bloqueado
                  ? "border-emerald-300/70 shadow-[0_0_42px_rgba(52,211,153,0.25)]"
                  : emErro
                  ? "border-red-400 shadow-[0_0_42px_rgba(248,113,113,0.25)]"
                  : "border-white/75 shadow-[0_0_42px_rgba(255,255,255,0.12)]"
              }
            `}
          />

          <div className="absolute -left-1 -top-1 h-14 w-14 rounded-tl-[2.25rem] border-l-4 border-t-4 border-emerald-400" />
          <div className="absolute -right-1 -top-1 h-14 w-14 rounded-tr-[2.25rem] border-r-4 border-t-4 border-emerald-400" />
          <div className="absolute -bottom-1 -left-1 h-14 w-14 rounded-bl-[2.25rem] border-b-4 border-l-4 border-emerald-400" />
          <div className="absolute -bottom-1 -right-1 h-14 w-14 rounded-br-[2.25rem] border-b-4 border-r-4 border-emerald-400" />

          {lendo && (
            <motion.div
              initial={{ top: "12%" }}
              animate={{ top: "82%" }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="
                absolute left-7 right-7 h-1 rounded-full
                bg-emerald-400 shadow-[0_0_26px_rgba(52,211,153,0.95)]
              "
            />
          )}

          <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-black text-white/80 backdrop-blur-md">
            Qtd por leitura: x{quantidadeScanner}
          </div>

          {(lido || bloqueado || emErro || iniciando) && (
            <div className="pointer-events-none absolute bottom-5 left-5 right-5">
              <StatusScanner
                iniciando={iniciando}
                lendo={false}
                lido={lido}
                bloqueado={bloqueado}
                emErro={emErro}
                codigoLido={codigoLido}
                codigoBloqueado={codigoBloqueado}
                erro={erro}
                compacto
              />
            </div>
          )}
        </div>
      </div>

      {/* PAINEL */}
      <div
        className="
          relative z-20 shrink-0 px-4
          pb-[calc(env(safe-area-inset-bottom)+0.9rem)]
        "
      >
        <div
          className="
            max-h-[44dvh] overflow-y-auto overscroll-contain rounded-[2rem]
            border border-white/10 bg-slate-950/78 p-3 shadow-2xl
            backdrop-blur-2xl
            sm:mx-auto sm:max-h-[42dvh] sm:max-w-3xl
          "
        >
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <QuantidadeScanner
                quantidade={quantidadeScanner}
                diminuir={() => alterarQuantidade(-1)}
                aumentar={() => alterarQuantidade(1)}
                setQuantidade={setQuantidadeScanner}
              />

              {codigoBloqueado ? (
                <button
                  type="button"
                  onClick={limparBloqueio}
                  className="
                    flex min-w-[98px] flex-col items-center justify-center rounded-3xl
                    border border-emerald-400/20 bg-emerald-500/15 px-3 py-3
                    text-xs font-black text-emerald-100 shadow-xl backdrop-blur-md
                    transition active:scale-[0.98]
                  "
                >
                  <ShieldCheck size={21} />
                  Liberar
                </button>
              ) : (
                <StatusPill
                  iniciando={iniciando}
                  lendo={lendo}
                  lido={lido}
                  bloqueado={bloqueado}
                  emErro={emErro}
                />
              )}
            </div>

            <MiniPreviewScanner
              itens={itensPreview}
              onLimpar={onLimparPreview}
            />

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
                Entrada manual
              </div>

              <div className="flex gap-2">
                <input
                  value={codigoManual}
                  onChange={(e) =>
                    setCodigoManual(e.target.value.replace(/\D/g, ""))
                  }
                  inputMode="numeric"
                  placeholder="Digite o código"
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
        </div>
      </div>
    </motion.div>
  );
}

function QuantidadeScanner({
  quantidade,
  diminuir,
  aumentar,
  setQuantidade,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2 text-xs font-black text-white/70">
        <SlidersHorizontal size={15} />
        Quantidade por leitura
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={diminuir}
          className="
            flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
            bg-white/10 text-white transition active:scale-95
          "
        >
          <Minus size={18} />
        </button>

        <input
          value={quantidade}
          onChange={(e) => {
            const valor = Number(e.target.value.replace(/\D/g, ""));
            setQuantidade(Math.max(1, Math.min(999, valor || 1)));
          }}
          inputMode="numeric"
          className="
            h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25
            text-center text-xl font-black text-white outline-none
            focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
          "
        />

        <button
          type="button"
          onClick={aumentar}
          className="
            flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
            bg-emerald-600 text-white shadow-lg shadow-emerald-600/25
            transition active:scale-95
          "
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function StatusPill({ iniciando, lendo, lido, bloqueado, emErro }) {
  let texto = "Ativo";
  let Icon = Camera;
  let classe = "border-white/10 bg-white/10 text-white";

  if (iniciando) {
    texto = "Abrindo";
    Icon = Loader2;
    classe = "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (lido) {
    texto = "Lido";
    Icon = CheckCircle2;
    classe = "border-emerald-400/25 bg-emerald-500/15 text-emerald-100";
  }

  if (bloqueado) {
    texto = "Protegido";
    Icon = ShieldCheck;
    classe = "border-emerald-400/25 bg-emerald-500/15 text-emerald-100";
  }

  if (emErro) {
    texto = "Erro";
    Icon = AlertTriangle;
    classe = "border-red-400/25 bg-red-500/15 text-red-100";
  }

  return (
    <div
      className={`
        flex min-w-[98px] flex-col items-center justify-center rounded-3xl
        border px-3 py-3 text-xs font-black shadow-xl backdrop-blur-md
        ${classe}
      `}
    >
      <Icon size={21} className={iniciando ? "animate-spin" : ""} />
      {texto}
    </div>
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
  compacto = false,
}) {
  if (iniciando) {
    return (
      <StatusBox
        icon={Loader2}
        titulo="Abrindo câmera..."
        texto="Preparando leitura"
        variant="info"
        loading
        compacto={compacto}
      />
    );
  }

  if (lido) {
    return (
      <StatusBox
        icon={CheckCircle2}
        titulo="Código lido"
        texto={codigoLido}
        variant="success"
        compacto={compacto}
      />
    );
  }

  if (bloqueado) {
    return (
      <StatusBox
        icon={ShieldCheck}
        titulo="Já adicionado"
        texto={`Toque em liberar para ler de novo: ${codigoBloqueado}`}
        variant="success"
        compacto={compacto}
      />
    );
  }

  if (emErro) {
    return (
      <StatusBox
        icon={AlertTriangle}
        titulo="Scanner em segurança"
        texto={erro}
        variant="danger"
        compacto={compacto}
      />
    );
  }

  if (lendo) {
    return (
      <StatusBox
        icon={Camera}
        titulo="Scanner ativo"
        texto="Leitura protegida contra repetição."
        variant="default"
        compacto={compacto}
      />
    );
  }

  return (
    <StatusBox
      icon={CameraOff}
      titulo="Câmera pausada"
      texto="Use reiniciar ou digite manualmente."
      variant="default"
      compacto={compacto}
    />
  );
}

function StatusBox({
  icon: Icon,
  titulo,
  texto,
  variant = "default",
  loading,
  compacto = false,
}) {
  const estilos = {
    default: "border-white/10 bg-black/35 text-white",
    info: "border-emerald-400/20 bg-emerald-500/15 text-emerald-50",
    success: "border-emerald-400/30 bg-emerald-500/20 text-emerald-100",
    danger: "border-red-400/30 bg-red-500/20 text-red-100",
  };

  return (
    <div
      className={`
        flex items-center gap-3 rounded-3xl border shadow-xl backdrop-blur-xl
        ${compacto ? "p-3" : "p-3.5"}
        ${estilos[variant] || estilos.default}
      `}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12">
        <Icon
          size={21}
          className={loading ? "animate-spin text-emerald-300" : ""}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{titulo}</p>
        <p className="truncate text-xs opacity-75">{texto}</p>
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
        flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl
        border border-white/10 bg-white/10 px-2 py-3 text-xs font-black
        text-white backdrop-blur-md transition active:scale-95
        disabled:cursor-not-allowed disabled:opacity-35
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            <PackageCheck size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">Itens escaneados</p>
            <p className="text-xs text-white/60">
              Produtos somados aparecem aqui em tempo real.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ultimo = itens[0];
  const restantes = itens.slice(1);

  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/15 p-3 text-emerald-50 shadow-xl backdrop-blur-md">
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
