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
  RefreshCcw,
  RotateCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  X,
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
  const fechandoRef = useRef(false);

  const codigoBloqueadoRef = useRef("");
  const ultimoCodigoRef = useRef({ codigo: "", tempo: 0 });
  const iniciouComCameraEscolhidaRef = useRef(false);

  const onScanRef = useRef(onScan);
  const modoContinuoRef = useRef(modoContinuo);
  const cameraAtualRef = useRef("");
  const permissaoRef = useRef(null);

  const [status, setStatus] = useState("iniciando");
  const [erro, setErro] = useState("");
  const [permissaoCamera, setPermissaoCamera] = useState("checando");

  const [cameras, setCameras] = useState([]);
  const [cameraAtual, setCameraAtual] = useState("");

  const [codigoManual, setCodigoManual] = useState("");
  const [codigoLido, setCodigoLido] = useState("");
  const [codigoBloqueado, setCodigoBloqueado] = useState("");

  const [torchDisponivel, setTorchDisponivel] = useState(false);
  const [torchAtiva, setTorchAtiva] = useState(false);
  const [manualAberto, setManualAberto] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    modoContinuoRef.current = modoContinuo;
  }, [modoContinuo]);

  useEffect(() => {
    cameraAtualRef.current = cameraAtual;
  }, [cameraAtual]);

  useEffect(() => {
    mountedRef.current = true;
    fechandoRef.current = false;

    liberarTravasAntigas();

    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: true },
      })
    );

    iniciarFluxo();

    return () => {
      mountedRef.current = false;
      pararScanner();

      if (permissaoRef.current) {
        permissaoRef.current.onchange = null;
      }

      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );

      setTimeout(liberarTravasAntigas, 80);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciarFluxo() {
    await checarPermissaoCamera();
    await iniciar();
  }

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

  function traduzirPermissao(state) {
    if (state === "granted") return "liberada";
    if (state === "denied") return "bloqueada";
    if (state === "prompt") return "perguntar";
    return "desconhecida";
  }

  async function checarPermissaoCamera() {
    try {
      if (!navigator.permissions?.query) {
        setSeguro(() => setPermissaoCamera("desconhecida"));
        return "desconhecida";
      }

      const permissao = await navigator.permissions.query({
        name: "camera",
      });

      permissaoRef.current = permissao;

      const estado = traduzirPermissao(permissao.state);

      setSeguro(() => setPermissaoCamera(estado));

      permissao.onchange = () => {
        const novoEstado = traduzirPermissao(permissao.state);
        setSeguro(() => setPermissaoCamera(novoEstado));
      };

      return estado;
    } catch {
      setSeguro(() => setPermissaoCamera("desconhecida"));
      return "desconhecida";
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

      setSeguro(() => setCameras(lista));

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

  async function aplicarMelhoriasCamera() {
  const stream = videoRef.current?.srcObject;
  const track = stream?.getVideoTracks?.()[0];

  if (!track?.getCapabilities) return;

  const capacidades = track.getCapabilities();
  const advanced = {};

  if (
    Array.isArray(capacidades.focusMode) &&
    capacidades.focusMode.includes("continuous")
  ) {
    advanced.focusMode = "continuous";
  }

  if (
    Array.isArray(capacidades.exposureMode) &&
    capacidades.exposureMode.includes("continuous")
  ) {
    advanced.exposureMode = "continuous";
  }

  if (
    Array.isArray(capacidades.whiteBalanceMode) &&
    capacidades.whiteBalanceMode.includes("continuous")
  ) {
    advanced.whiteBalanceMode = "continuous";
  }

  if ("zoom" in capacidades) {
    const min = Number(capacidades.zoom?.min || 1);
    const max = Number(capacidades.zoom?.max || 1);
    advanced.zoom = Math.min(max, Math.max(min, 1.08));
  }

  if (!Object.keys(advanced).length) return;

  try {
    await track.applyConstraints({
      advanced: [advanced],
    });
  } catch (err) {
    console.warn("Não consegui aplicar melhorias da câmera:", err);
  }
}

  async function iniciar(deviceId = "") {
    try {
      setSeguro(() => {
        setErro("");
        setCodigoLido("");
        setCodigoBloqueado("");
        setStatus("iniciando");
      });

      processingRef.current = false;
      codigoBloqueadoRef.current = "";

      if (!navigator.mediaDevices?.getUserMedia) {
        setSeguro(() => {
          setErro("Este navegador não liberou acesso à câmera.");
          setStatus("erro");
        });
        return;
      }

      const permissaoAtual = await checarPermissaoCamera();

      if (permissaoAtual === "bloqueada") {
        setSeguro(() => {
          setErro(
            "A câmera está bloqueada. Libere a permissão no navegador e toque em reiniciar."
          );
          setStatus("erro");
        });
        return;
      }

      pararCamera();

      const video = videoRef.current;

      if (!video) {
        setSeguro(() => {
          setErro("Elemento de vídeo não encontrado.");
          setStatus("erro");
        });
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

        if (principal?.deviceId && principal?.label) {
          deviceIdFinal = principal.deviceId;
          setSeguro(() => setCameraAtual(principal.deviceId));
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
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 60 },
            aspectRatio: { ideal: 1.7777778 },
          },
          },
          video,
          callback
        );
      }

      controlsRef.current = controls;

      setSeguro(() => {
        setStatus("lendo");
        setErro("");
      });

      setTimeout(() => {
        if (fechandoRef.current) return;

        listarCameras();
        prepararRecursosCamera();
        aplicarZoomPrincipal();
        aplicarMelhoriasCamera();
        checarPermissaoCamera();
      }, 500);
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);

      let msg = "Não consegui abrir a câmera. Use a entrada manual.";

      if (err?.name === "NotAllowedError") {
        msg =
          "Permissão da câmera negada. Libere a câmera no navegador e toque em reiniciar.";
        setSeguro(() => setPermissaoCamera("bloqueada"));
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

    if (!cameraAtualRef.current && lista.length > 0) {
      const principal = escolherCameraPrincipal(lista);

      if (principal?.deviceId) {
        setSeguro(() => setCameraAtual(principal.deviceId));
      }
    }
  }

  function prepararRecursosCamera() {
    const stream = videoRef.current?.srcObject;
    const track = stream?.getVideoTracks?.()[0];

    setSeguro(() => {
      setTorchDisponivel(false);
      setTorchAtiva(false);
    });

    if (!track?.getCapabilities) return;

    const capacidades = track.getCapabilities();

    if (capacidades.torch) {
      setSeguro(() => setTorchDisponivel(true));
    }
  }

  async function processarCodigo(codigo) {
    const codigoLimpo = String(codigo || "").replace(/\s/g, "").trim();

    if (!codigoLimpo || fechandoRef.current) return;
    if (processingRef.current) return;

    if (codigoBloqueadoRef.current === codigoLimpo) {
      setSeguro(() => {
        setStatus("bloqueado");
        setCodigoBloqueado(codigoLimpo);
      });
      return;
    }

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
      const modoAtual = modoContinuoRef.current;

      const resposta = await Promise.resolve(
        onScanRef.current?.(codigoLimpo, {
          modoContinuo: modoAtual,
          origem: "scanner",
          quantidade: 1,
        })
      );

      const deveFechar =
        resposta === "fechar" ||
        resposta?.fecharScanner === true ||
        resposta?.abrirModal === true ||
        modoAtual === false;

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

    setSeguro(() => {
      setTorchDisponivel(false);
      setTorchAtiva(false);
    });
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
    setSeguro(() => {
      setErro("");
      setCodigoLido("");
      setCodigoBloqueado("");
      setStatus("iniciando");
    });

    processingRef.current = false;
    codigoBloqueadoRef.current = "";
    iniciouComCameraEscolhidaRef.current = false;

    await iniciar(cameraAtualRef.current);
  }

  async function trocarCamera() {
    const lista = cameras.length ? cameras : await listarCamerasDisponiveis();

    if (lista.length <= 1) {
      setSeguro(() => {
        setErro("Só encontrei uma câmera neste dispositivo.");
        setStatus("erro");
      });
      return;
    }

    const indiceAtual = lista.findIndex(
      (camera) => camera.deviceId === cameraAtualRef.current
    );

    const proxima = lista[(indiceAtual + 1 + lista.length) % lista.length];

    if (!proxima?.deviceId) return;

    setSeguro(() => {
      setCameraAtual(proxima.deviceId);
      setErro("");
      setCodigoLido("");
      setCodigoBloqueado("");
      setStatus("iniciando");
    });

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

      setSeguro(() => setTorchAtiva((prev) => !prev));
    } catch (err) {
      console.warn("Lanterna indisponível:", err);

      setSeguro(() => {
        setErro("Lanterna não disponível nesta câmera.");
        setStatus("erro");
      });
    }
  }

  async function enviarManual(e) {
    e.preventDefault();

    const codigo = codigoManual.replace(/\D/g, "").trim();

    if (!codigo) {
      setSeguro(() => {
        setErro("Digite um código válido.");
        setStatus("erro");
      });
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
  const permissaoBloqueada = permissaoCamera === "bloqueada";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.18 }}
      className="
        fixed inset-0 z-[99990] h-[100dvh] overflow-hidden
        bg-[#020814] text-white
      "
    >
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`
          absolute inset-0 h-full w-full object-cover transition duration-300
          [filter:brightness(1.18)_contrast(1.08)_saturate(1.08)]
          ${cameraLigada ? "opacity-100" : "opacity-35"}
        `}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_34%),linear-gradient(to_bottom,rgba(2,8,20,0.16),rgba(2,8,20,0.08),rgba(2,8,20,0.24))]" />
        <div className="absolute inset-0 bg-black/[0.04]" />
      </div>

      <div
        className="
          relative z-20 mx-auto flex h-full w-full max-w-md flex-col
          px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]
          pt-[calc(env(safe-area-inset-top)+0.75rem)]
        "
      >
        <header
          className="
            shrink-0 rounded-[1.6rem] border border-white/10
            bg-slate-950/62 p-2.5 shadow-2xl shadow-black/30
            backdrop-blur-2xl
          "
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                  bg-emerald-500/18 text-emerald-200 ring-1 ring-emerald-300/15
                "
              >
                <ScanLine size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-base font-black">Scanner</h2>

                <p className="truncate text-[11px] font-semibold text-white/60">
                  {modoContinuo ? "Modo contínuo" : "Leitura única"} · câmera
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fecharScanner}
              className="
                flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                bg-white text-slate-950 shadow-xl shadow-black/20
                transition active:scale-95
              "
              aria-label="Fechar scanner"
            >
              <X size={22} strokeWidth={3} />
            </button>
          </div>
        </header>

        <main className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <section
            className="
              relative min-h-0 flex-1 overflow-hidden rounded-[2rem]
              border border-emerald-400/22 bg-black/[0.04]
              shadow-[0_20px_60px_rgba(0,0,0,0.28)]
            "
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,8,20,0.04),rgba(2,8,20,0),rgba(2,8,20,0.10))]" />

            <div className="pointer-events-none absolute inset-0 z-20 p-3">
              <div
                className={`
                  relative h-full w-full rounded-[1.8rem] border
                  ${
                    lido
                      ? "border-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.30)]"
                      : bloqueado
                      ? "border-emerald-300/80 shadow-[0_0_28px_rgba(52,211,153,0.18)]"
                      : emErro
                      ? "border-red-400/70 shadow-[0_0_28px_rgba(248,113,113,0.16)]"
                      : "border-emerald-400/55 shadow-[0_0_28px_rgba(16,185,129,0.18)]"
                  }
                `}
              >
                <div className="absolute -left-[1px] -top-[1px] h-10 w-10 rounded-tl-[1.5rem] border-l-[3px] border-t-[3px] border-emerald-400" />
                <div className="absolute -right-[1px] -top-[1px] h-10 w-10 rounded-tr-[1.5rem] border-r-[3px] border-t-[3px] border-emerald-400" />
                <div className="absolute -bottom-[1px] -left-[1px] h-10 w-10 rounded-bl-[1.5rem] border-b-[3px] border-l-[3px] border-emerald-400" />
                <div className="absolute -bottom-[1px] -right-[1px] h-10 w-10 rounded-br-[1.5rem] border-b-[3px] border-r-[3px] border-emerald-400" />

                {lendo && (
                  <motion.div
                    initial={{ top: "14%" }}
                    animate={{ top: "82%" }}
                    transition={{
                      duration: 1.15,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                    className="
                      absolute left-5 right-5 h-[3px] rounded-full
                      bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.95)]
                    "
                  />
                )}
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-4">
              <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-black text-white/80 backdrop-blur-md">
                {modoContinuo ? "Contínuo" : "Único"}
              </div>

              <PermissaoPill permissao={permissaoCamera} />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-30 space-y-2 p-4">
              {!lendo && (
                <StatusScanner
                  iniciando={iniciando}
                  lido={lido}
                  bloqueado={bloqueado}
                  emErro={emErro}
                  codigoLido={codigoLido}
                  codigoBloqueado={codigoBloqueado}
                  erro={erro}
                  permissaoBloqueada={permissaoBloqueada}
                />
              )}

              {lendo && (
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
                  <p className="text-[11px] font-semibold text-white/72">
                    Aponte para o código de barras
                  </p>
                </div>
              )}
            </div>
          </section>

          <section
            className="
              shrink-0 rounded-[1.7rem] border border-white/10
              bg-slate-950/72 p-2.5 shadow-2xl shadow-black/35
              backdrop-blur-2xl
            "
          >
            {codigoBloqueado ? (
              <button
                type="button"
                onClick={limparBloqueio}
                className="
                  mb-2 flex h-12 w-full items-center justify-center gap-2
                  rounded-2xl border border-emerald-400/20 bg-emerald-500/12
                  text-sm font-black text-emerald-100 transition active:scale-[0.98]
                "
              >
                <ShieldCheck size={18} />
                Liberar para ler novamente
              </button>
            ) : null}

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
                icon={Keyboard}
                label="Manual"
                onClick={() => setManualAberto((prev) => !prev)}
                active={manualAberto}
              />
            </div>

            {manualAberto && (
              <motion.form
                onSubmit={enviarManual}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="
                  mt-2 rounded-[1.35rem] border border-white/10
                  bg-white/[0.06] p-2.5
                "
              >
                <div className="flex gap-2">
                  <input
                    value={codigoManual}
                    onChange={(e) =>
                      setCodigoManual(e.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    placeholder="Digite o código"
                    className="
                      h-12 min-w-0 flex-1 rounded-2xl border border-white/10
                      bg-black/25 px-4 text-sm font-bold text-white outline-none
                      placeholder:text-white/35
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
                    aria-label="Enviar código manual"
                  >
                    <Barcode size={21} />
                  </button>
                </div>
              </motion.form>
            )}
          </section>
        </main>
      </div>
    </motion.div>
  );
}

function PermissaoPill({ permissao }) {
  let texto = "Permissão";
  let classe = "border-white/10 bg-black/35 text-white/75";
  let Icon = ShieldCheck;

  if (permissao === "checando") {
    texto = "Checando";
    Icon = Loader2;
    classe = "border-emerald-400/20 bg-emerald-500/12 text-emerald-100";
  }

  if (permissao === "liberada") {
    texto = "Liberada";
    Icon = ShieldCheck;
    classe = "border-emerald-400/20 bg-emerald-500/12 text-emerald-100";
  }

  if (permissao === "perguntar") {
    texto = "Solicitar";
    Icon = Camera;
    classe = "border-yellow-300/25 bg-yellow-400/12 text-yellow-100";
  }

  if (permissao === "bloqueada") {
    texto = "Bloqueada";
    Icon = ShieldAlert;
    classe = "border-red-400/25 bg-red-500/16 text-red-100";
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-3 py-1
        text-[10px] font-black shadow-lg backdrop-blur-md
        ${classe}
      `}
    >
      <Icon size={12} className={permissao === "checando" ? "animate-spin" : ""} />
      {texto}
    </div>
  );
}

function StatusScanner({
  iniciando,
  lido,
  bloqueado,
  emErro,
  codigoLido,
  codigoBloqueado,
  erro,
  permissaoBloqueada,
}) {
  if (iniciando) {
    return (
      <StatusBox
        icon={Loader2}
        titulo="Abrindo câmera"
        texto="Preparando leitura"
        variant="info"
        loading
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
      />
    );
  }

  if (bloqueado) {
    return (
      <StatusBox
        icon={ShieldCheck}
        titulo="Código protegido"
        texto={`Toque em liberar para ler novamente: ${codigoBloqueado}`}
        variant="success"
      />
    );
  }

  if (emErro) {
    return (
      <StatusBox
        icon={permissaoBloqueada ? ShieldAlert : AlertTriangle}
        titulo={permissaoBloqueada ? "Câmera bloqueada" : "Scanner em segurança"}
        texto={erro}
        variant="danger"
      />
    );
  }

  return (
    <StatusBox
      icon={CameraOff}
      titulo="Câmera pausada"
      texto="Use reiniciar ou digite manualmente."
      variant="default"
    />
  );
}

function StatusBox({
  icon: Icon,
  titulo,
  texto,
  variant = "default",
  loading = false,
}) {
  const estilos = {
    default: "border-white/10 bg-black/35 text-white",
    info: "border-emerald-400/18 bg-emerald-500/10 text-emerald-50",
    success: "border-emerald-400/18 bg-emerald-500/10 text-emerald-100",
    danger: "border-red-400/20 bg-red-500/12 text-red-100",
  };

  return (
    <div
      className={`
        rounded-[1.35rem] border p-3 shadow-lg backdrop-blur-xl
        ${estilos[variant] || estilos.default}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon
            size={20}
            className={loading ? "animate-spin text-emerald-300" : ""}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{titulo}</p>
          <p className="mt-0.5 break-words text-xs opacity-80">{texto}</p>
        </div>
      </div>
    </div>
  );
}

function BotaoControle({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-16 min-w-0 flex-col items-center justify-center gap-1
        rounded-[1.2rem] border px-1 text-[10px] font-black
        shadow-lg backdrop-blur-md transition active:scale-95
        disabled:cursor-not-allowed disabled:opacity-35
        ${
          active
            ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-100"
            : "border-white/10 bg-white/[0.06] text-white"
        }
      `}
    >
      <Icon size={19} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default Scanner;