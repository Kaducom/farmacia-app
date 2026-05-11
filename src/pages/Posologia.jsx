import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FundoBolhas from "../components/FundoBolhas";

import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Clock3,
  Copy,
  Droplets,
  Info,
  Package,
  Pill,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Syringe,
  X,
  XCircle,
} from "lucide-react";

const intervalosRapidos = ["2", "3", "4", "6", "8", "12", "24"];

const modos = [
  {
    id: "liquido",
    label: "Líquido",
    icon: Syringe,
    unidade: "mL",
    embalagem: "Frasco",
    descricao: "Dose em mL por horário.",
  },
  {
    id: "gotas",
    label: "Gotas",
    icon: Droplets,
    unidade: "gotas",
    embalagem: "Frasco",
    descricao: "Descubra se o frasco dá para o tratamento.",
  },
  {
    id: "comprimido",
    label: "Comprimido",
    icon: Pill,
    unidade: "comprimidos",
    embalagem: "Cartela",
    descricao: "Comprimidos, cápsulas ou unidades.",
  },
];

function Posologia() {
  const [modo, setModo] = useState("gotas");
  const [modoGotas, setModoGotas] = useState("porDia");

  const [medicamento, setMedicamento] = useState("");

  const [dose, setDose] = useState("");
  const [gotasPorDia, setGotasPorDia] = useState("");

  const [intervalo, setIntervalo] = useState("8");
  const [intervaloManual, setIntervaloManual] = useState("");

  const [dias, setDias] = useState("");

  const [frasco, setFrasco] = useState("");
  const [gotasPorMl, setGotasPorMl] = useState("20");

  const [toast, setToast] = useState(null);

  const modoAtual = modos.find((item) => item.id === modo) || modos[0];

  const resultado = useMemo(() => {
    return calcularResultado({
      modo,
      modoGotas,
      dose,
      gotasPorDia,
      intervalo,
      dias,
      frasco,
      gotasPorMl,
    });
  }, [modo, modoGotas, dose, gotasPorDia, intervalo, dias, frasco, gotasPorMl]);

  function numero(v) {
    return Number(String(v || "").replace(",", "."));
  }

  function formatarNumero(n) {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return "--";

    return Number(n).toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    });
  }

  function interpretarIntervalo(texto) {
    const limpo = String(texto).toLowerCase().trim();

    const matchBarra = limpo.match(/(\d+(?:[,.]\d+)?)\s*\/\s*(\d+(?:[,.]\d+)?)/);

    if (matchBarra) return matchBarra[1];

    const matchHoras = limpo.match(/(\d+(?:[,.]\d+)?)\s*h/);

    if (matchHoras) return matchHoras[1];

    const matchVezes = limpo.match(/(\d+(?:[,.]\d+)?)\s*(x|vez|vezes)/);

    if (matchVezes) {
      const vezes = numero(matchVezes[1]);

      if (vezes > 0) {
        return String(Number((24 / vezes).toFixed(2))).replace(".", ",");
      }
    }

    return "";
  }

  function aplicarIntervaloManual(valor) {
    setIntervaloManual(valor);

    const interpretado = interpretarIntervalo(valor);

    if (interpretado) {
      setIntervalo(interpretado);
    }
  }

  function trocarModo(novoModo) {
    setModo(novoModo);
    setModoGotas(novoModo === "gotas" ? "porDia" : "porDose");
    limparCampos(false);
  }

  function limparCampos(limparModo = true) {
    if (limparModo) {
      setModo("gotas");
      setModoGotas("porDia");
    }

    setMedicamento("");
    setDose("");
    setGotasPorDia("");
    setIntervalo("8");
    setIntervaloManual("");
    setDias("");
    setFrasco("");
    setGotasPorMl("20");
  }

  function limpar() {
    limparCampos(true);
    mostrarToast("Calculadora limpa 🧹", "info");
  }

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(25);

    setTimeout(() => setToast(null), 2600);
  }

  async function copiarResumo() {
    if (!resultado) {
      mostrarToast("Preencha os dados para gerar o resumo 😅", "erro");
      return;
    }

    const texto = montarResumo({
      medicamento,
      modo,
      modoGotas,
      modoAtual,
      resultado,
      formatarNumero,
    });

    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast("Resumo copiado 📋", "ok");
    } catch {
      mostrarToast("Não consegui copiar automaticamente 😕", "erro");
    }
  }

  const precisaAtenção =
    resultado &&
    resultado.temCapacidade &&
    resultado.frascosNecessarios === 1 &&
    resultado.sobraPercentual <= 10;

  const faltaProduto =
    resultado &&
    resultado.temCapacidade &&
    resultado.frascosNecessarios > 1;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="violet" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl p-4 pb-32 text-gray-950 dark:text-white">
        <HeaderPosologia resultado={resultado} modoAtual={modoAtual} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.03fr_0.97fr]">
          <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
            <Aviso />

            <div className="mt-5 grid grid-cols-3 gap-3">
              {modos.map((item) => {
                const Icon = item.icon;
                const ativo = modo === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => trocarModo(item.id)}
                    className={`
                      rounded-3xl border p-3 text-left transition active:scale-95 sm:p-4
                      ${
                        ativo
                          ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                          : "border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                      }
                    `}
                  >
                    <div
                      className={`
                        mb-3 flex h-11 w-11 items-center justify-center rounded-2xl
                        ${ativo ? "bg-white/15" : "bg-white/70 dark:bg-white/10"}
                      `}
                    >
                      <Icon size={22} />
                    </div>

                    <p className="font-black">{item.label}</p>
                    <p
                      className={`mt-1 hidden text-xs sm:block ${
                        ativo ? "text-violet-100" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {item.descricao}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Campo label="Nome do medicamento" opcional>
                <input
                  value={medicamento}
                  onChange={(e) => setMedicamento(e.target.value)}
                  placeholder="Digite o nome do medicamento"
                  className={inputClasses()}
                />
              </Campo>
            </div>

            {modo === "gotas" && (
              <div className="mt-5 rounded-3xl border border-violet-200 bg-violet-50/90 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                <div className="mb-3">
                  <p className="font-black text-violet-800 dark:text-violet-200">
                    Como quer calcular as gotas?
                  </p>
                  <p className="mt-1 text-sm text-violet-700/80 dark:text-violet-200/80">
                    Para sua ideia, use “gotas por dia”: ele responde se o frasco serve.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoGotas("porDia");
                      setDose("");
                      setIntervaloManual("");
                      setIntervalo("8");
                    }}
                    className={botaoSegmentadoClasses(modoGotas === "porDia")}
                  >
                    Gotas por dia
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModoGotas("porDose");
                      setGotasPorDia("");
                    }}
                    className={botaoSegmentadoClasses(modoGotas === "porDose")}
                  >
                    Por dose
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {modo === "gotas" && modoGotas === "porDia" ? (
                <Campo label="Total de gotas por dia">
                  <input
                    value={gotasPorDia}
                    onChange={(e) => setGotasPorDia(apenasNumerosVirgula(e.target.value))}
                    inputMode="decimal"
                    placeholder="Ex: 30"
                    className={inputClasses()}
                  />
                </Campo>
              ) : (
                <Campo label={`Dose por vez (${modoAtual.unidade})`}>
                  <input
                    value={dose}
                    onChange={(e) => setDose(apenasNumerosVirgula(e.target.value))}
                    inputMode="decimal"
                    placeholder={modo === "comprimido" ? "1" : modo === "gotas" ? "10" : "5,5"}
                    className={inputClasses()}
                  />
                </Campo>
              )}

              <Campo label="Dias de tratamento">
                <input
                  value={dias}
                  onChange={(e) => setDias(apenasNumerosVirgula(e.target.value))}
                  inputMode="decimal"
                  placeholder="Ex: 7"
                  className={inputClasses()}
                />
              </Campo>
            </div>

            {(modo !== "gotas" || modoGotas === "porDose") && (
              <div className="mt-5">
                <IntervaloBox
                  intervalo={intervalo}
                  setIntervalo={setIntervalo}
                  intervaloManual={intervaloManual}
                  setIntervaloManual={setIntervaloManual}
                  aplicarIntervaloManual={aplicarIntervaloManual}
                />
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Campo
                label={
                  modo === "gotas"
                    ? "Volume do frasco (mL)"
                    : `${modoAtual.embalagem} (${modoAtual.unidade})`
                }
              >
                <input
                  value={frasco}
                  onChange={(e) => setFrasco(apenasNumerosVirgula(e.target.value))}
                  inputMode="decimal"
                  placeholder={modo === "gotas" ? "Ex: 20" : modo === "comprimido" ? "Ex: 21" : "Ex: 100"}
                  className={inputClasses()}
                />
              </Campo>

              {modo === "gotas" && (
                <Campo label="Gotas por mL">
                  <input
                    value={gotasPorMl}
                    onChange={(e) => setGotasPorMl(apenasNumerosVirgula(e.target.value))}
                    inputMode="decimal"
                    placeholder="20"
                    className={inputClasses()}
                  />
                </Campo>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={copiarResumo}
                className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-violet-600 font-black text-white shadow-lg shadow-violet-600/20 transition active:scale-95 sm:col-span-2"
              >
                <Copy size={18} />
                Copiar orientação
              </button>

              <button
                type="button"
                onClick={limpar}
                className="flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white font-black text-gray-700 transition active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
              >
                <RotateCcw size={18} />
                Limpar
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <ResultadoPrincipal
              resultado={resultado}
              modo={modo}
              modoGotas={modoGotas}
              modoAtual={modoAtual}
              medicamento={medicamento}
              formatarNumero={formatarNumero}
              precisaAtencao={precisaAtenção}
              faltaProduto={faltaProduto}
            />

            {resultado && (
              <DetalhesResultado
                resultado={resultado}
                modo={modo}
                modoAtual={modoAtual}
                formatarNumero={formatarNumero}
              />
            )}

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 text-amber-800 shadow-xl backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex gap-3">
                <ShieldCheck size={22} className="shrink-0" />
                <p className="text-sm">
                  Use como apoio de cálculo. Confirme posologia, concentração, dose prescrita e orientação do farmacêutico responsável antes de orientar o cliente.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function HeaderPosologia({ resultado, modoAtual }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-black/5 backdrop-blur-2xl dark:border-white/10 dark:bg-gray-950/75">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-700 to-slate-950 p-6 text-white">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-fuchsia-300/10" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
            <Calculator size={34} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-violet-50">
              <Sparkles size={13} />
              Calculadora inteligente
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              Posologia Premium
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-violet-100">
              Calcule se frasco, cartela ou volume servem para o tratamento completo.
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <ResumoTopo label="Modo" valor={modoAtual.label} />
          <ResumoTopo
            label="Necessário"
            valor={resultado ? resultado.resumoCurto : "--"}
          />
          <ResumoTopo
            label="Embalagens"
            valor={resultado?.temCapacidade ? resultado.frascosNecessarios : "--"}
          />
        </div>
      </div>
    </div>
  );
}

function Aviso() {
  return (
    <div className="flex gap-3 rounded-3xl border border-violet-200 bg-violet-50/90 p-4 text-sm text-violet-800 shadow-lg dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
      <Info size={20} className="shrink-0" />

      <p>
        No modo gotas, escolha “gotas por dia” para saber se um frasco com certo volume vai durar todo o tratamento.
      </p>
    </div>
  );
}

function IntervaloBox({
  intervalo,
  setIntervalo,
  intervaloManual,
  setIntervaloManual,
  aplicarIntervaloManual,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-gray-700 dark:text-gray-300">
        Intervalo inteligente
      </label>

      <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
        {intervalosRapidos.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => {
              setIntervalo(h);
              setIntervaloManual("");
            }}
            className={`
              rounded-2xl py-3 font-black transition active:scale-95
              ${
                intervalo === h && !intervaloManual
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-200"
              }
            `}
          >
            {h}/{h}h
          </button>
        ))}
      </div>

      <input
        value={intervaloManual}
        onChange={(e) => aplicarIntervaloManual(e.target.value)}
        placeholder="3/3h, 2x ao dia..."
        className={`${inputClasses()} mt-3`}
      />

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Interpretado como: de {intervalo}/{intervalo}h
      </p>
    </div>
  );
}

function ResultadoPrincipal({
  resultado,
  modo,
  modoGotas,
  modoAtual,
  medicamento,
  formatarNumero,
  precisaAtencao,
  faltaProduto,
}) {
  if (!resultado) {
    return (
      <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
          <Package size={30} />
        </div>

        <h2 className="mt-4 text-xl font-black">Resultado aparece aqui</h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Preencha dose, dias e embalagem para o app calcular tudo.
        </p>
      </div>
    );
  }

  const suficiente = resultado.temCapacidade && resultado.frascosNecessarios <= 1;
  const Icon = suficiente ? CheckCircle2 : XCircle;

  const titulo =
    modo === "gotas" && modoGotas === "porDia"
      ? suficiente
        ? "O frasco serve"
        : "Um frasco não serve"
      : suficiente
      ? "Uma embalagem serve"
      : "Precisa de mais embalagens";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-[2rem] border p-5 shadow-xl backdrop-blur-xl
        ${
          suficiente
            ? "border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
            : "border-amber-200 bg-amber-50/95 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
          <Icon size={30} />
        </div>

        <div>
          <p className="text-sm font-bold opacity-75">
            {medicamento || "Tratamento"}
          </p>
          <h2 className="text-xl font-black">{titulo}</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniResultado
          label="Total necessário"
          valor={`${formatarNumero(resultado.totalNecessario)} ${modoAtual.unidade}`}
        />

        <MiniResultado
          label={`${modoAtual.embalagem}s`}
          valor={
            resultado.temCapacidade
              ? `${resultado.frascosNecessarios}`
              : "Informe"
          }
        />

        {resultado.temCapacidade && (
          <>
            <MiniResultado
              label="Dura por"
              valor={`${formatarNumero(resultado.diasPorEmbalagem)} dias`}
            />

            <MiniResultado
              label={resultado.sobra >= 0 ? "Sobra" : "Falta"}
              valor={`${formatarNumero(Math.abs(resultado.sobra))} ${modoAtual.unidade}`}
            />
          </>
        )}
      </div>

      {precisaAtencao && (
        <AvisoResultado
          tipo="warning"
          texto="Vai servir, mas com sobra pequena. Vale conferir margem de segurança, desperdício e orientação do farmacêutico."
        />
      )}

      {faltaProduto && (
        <AvisoResultado
          tipo="warning"
          texto={`Para completar o tratamento, provavelmente serão necessárias ${resultado.frascosNecessarios} embalagens.`}
        />
      )}
    </motion.div>
  );
}

function DetalhesResultado({ resultado, modo, modoAtual, formatarNumero }) {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Calculator size={24} />
        </div>

        <div>
          <h2 className="text-xl font-black">Detalhes do cálculo</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quantidade total do tratamento
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ResultadoItem
          titulo="Uso por dia"
          valor={`${formatarNumero(resultado.consumoPorDia)} ${modoAtual.unidade}`}
        />

        <ResultadoItem
          titulo="Total do tratamento"
          valor={`${formatarNumero(resultado.totalNecessario)} ${modoAtual.unidade}`}
        />

        {modo === "gotas" && (
          <ResultadoItem
            titulo="Gotas no frasco"
            valor={
              resultado.totalGotasFrasco
                ? `${formatarNumero(resultado.totalGotasFrasco)} gotas`
                : "Informe o frasco"
            }
          />
        )}

        <ResultadoItem
          titulo="Tomadas por dia"
          valor={`${formatarNumero(resultado.tomadasPorDia)}x`}
        />

        {resultado.temCapacidade && (
          <>
            <ResultadoItem
              titulo="Duração da embalagem"
              valor={`${formatarNumero(resultado.diasPorEmbalagem)} dias`}
            />

            <ResultadoItem
              titulo="Sobra aproximada"
              valor={`${formatarNumero(resultado.sobra)} ${modoAtual.unidade}`}
            />
          </>
        )}
      </div>
    </div>
  );
}

function AvisoResultado({ texto }) {
  return (
    <div className="mt-4 flex gap-3 rounded-2xl bg-white/60 p-4 text-sm font-bold dark:bg-black/20">
      <AlertTriangle size={18} className="shrink-0" />
      <p>{texto}</p>
    </div>
  );
}

function Campo({ label, children, opcional = false }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label className="block text-sm font-black text-gray-700 dark:text-gray-300">
          {label}
        </label>

        {opcional && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
            opcional
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function ResultadoItem({ titulo, valor }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 dark:bg-white/5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}

function MiniResultado({ label, valor }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 dark:bg-black/20">
      <p className="text-xs font-bold opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}

function ResumoTopo({ label, valor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <p className="truncate text-lg font-black">{valor}</p>
      <p className="text-xs text-violet-100">{label}</p>
    </div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const info = toast.tipo === "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="fixed left-1/2 top-5 z-[99999] w-[92%] max-w-sm -translate-x-1/2"
    >
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : info
              ? "border-blue-300 bg-blue-50/95 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${erro ? "bg-red-500" : info ? "bg-blue-500" : "bg-emerald-600"}`}>
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="flex-1 text-sm font-bold">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>
    </motion.div>
  );
}

function calcularResultado({
  modo,
  modoGotas,
  dose,
  gotasPorDia,
  intervalo,
  dias,
  frasco,
  gotasPorMl,
}) {
  const diasNum = numero(dias);

  if (!diasNum || diasNum <= 0) return null;

  const intervaloNum = numero(intervalo);
  const doseNum = numero(dose);
  const gotasPorDiaNum = numero(gotasPorDia);
  const frascoNum = numero(frasco);
  const gotasPorMlNum = numero(gotasPorMl) || 20;

  let tomadasPorDia = 0;
  let consumoPorDia = 0;
  let totalNecessario = 0;
  let capacidade = null;
  let totalGotasFrasco = null;

  if (modo === "gotas" && modoGotas === "porDia") {
    if (!gotasPorDiaNum || gotasPorDiaNum <= 0) return null;

    tomadasPorDia = 1;
    consumoPorDia = gotasPorDiaNum;
    totalNecessario = gotasPorDiaNum * diasNum;

    if (frascoNum > 0 && gotasPorMlNum > 0) {
      totalGotasFrasco = frascoNum * gotasPorMlNum;
      capacidade = totalGotasFrasco;
    }
  } else {
    if (!doseNum || doseNum <= 0 || !intervaloNum || intervaloNum <= 0) {
      return null;
    }

    tomadasPorDia = 24 / intervaloNum;
    consumoPorDia = doseNum * tomadasPorDia;
    totalNecessario = consumoPorDia * diasNum;

    if (modo === "gotas") {
      if (frascoNum > 0 && gotasPorMlNum > 0) {
        totalGotasFrasco = frascoNum * gotasPorMlNum;
        capacidade = totalGotasFrasco;
      }
    } else if (frascoNum > 0) {
      capacidade = frascoNum;
    }
  }

  const temCapacidade = Boolean(capacidade && capacidade > 0);

  let frascosNecessarios = null;
  let sobra = null;
  let diasPorEmbalagem = null;
  let sobraPercentual = null;

  if (temCapacidade) {
    frascosNecessarios = Math.ceil(totalNecessario / capacidade);
    sobra = frascosNecessarios * capacidade - totalNecessario;
    diasPorEmbalagem = capacidade / consumoPorDia;
    sobraPercentual = capacidade ? (sobra / capacidade) * 100 : null;
  }

  return {
    tomadasPorDia,
    consumoPorDia,
    totalNecessario,
    resumoCurto: `${formatarCompacto(totalNecessario)}`,
    temCapacidade,
    capacidade,
    frascosNecessarios,
    sobra,
    sobraPercentual,
    diasPorEmbalagem,
    totalGotasFrasco,
  };
}

function montarResumo({
  medicamento,
  modo,
  modoGotas,
  modoAtual,
  resultado,
  formatarNumero,
}) {
  const linhas = [];

  linhas.push("Orientação de posologia");
  linhas.push(`Medicamento: ${medicamento || "não informado"}`);
  linhas.push(`Modo: ${modoAtual.label}`);

  if (modo === "gotas" && modoGotas === "porDia") {
    linhas.push(`Uso por dia: ${formatarNumero(resultado.consumoPorDia)} gotas`);
  } else {
    linhas.push(`Uso por dia: ${formatarNumero(resultado.consumoPorDia)} ${modoAtual.unidade}`);
  }

  linhas.push(`Total necessário: ${formatarNumero(resultado.totalNecessario)} ${modoAtual.unidade}`);

  if (resultado.temCapacidade) {
    linhas.push(`${modoAtual.embalagem}s necessárias: ${resultado.frascosNecessarios}`);
    linhas.push(`Duração de uma embalagem: ${formatarNumero(resultado.diasPorEmbalagem)} dias`);
    linhas.push(`Sobra aproximada: ${formatarNumero(resultado.sobra)} ${modoAtual.unidade}`);
  }

  return linhas.join("\n");
}

function numero(v) {
  return Number(String(v || "").replace(",", "."));
}

function formatarCompacto(n) {
  if (!n || Number.isNaN(Number(n))) return "--";

  if (Number(n) >= 1000) {
    return Number(n).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
      notation: "compact",
    });
  }

  return Number(n).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
}

function apenasNumerosVirgula(valor) {
  return String(valor || "")
    .replace(/[^\d,.]/g, "")
    .replace(".", ",");
}

function inputClasses() {
  return `
    w-full rounded-2xl border border-gray-200 bg-gray-100 p-4
    font-bold text-gray-950 outline-none transition
    focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15
    dark:border-white/10 dark:bg-white/5 dark:text-white
    placeholder:text-gray-400
  `;
}

function botaoSegmentadoClasses(ativo) {
  return `
    h-12 rounded-2xl font-black transition active:scale-95
    ${
      ativo
        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
        : "bg-white/80 text-violet-700 dark:bg-black/20 dark:text-violet-200"
    }
  `;
}

export default Posologia;
