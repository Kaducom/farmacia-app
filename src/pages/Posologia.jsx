import { useState } from "react";
import FundoBolhas from "../components/FundoBolhas";

import {
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Info,
  Pill,
  RotateCcw,
  Scale,
  Syringe,
  Weight,
  X,
} from "lucide-react";

function Posologia() {
  const [modo, setModo] = useState("comprimido");

  const [dose, setDose] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [dias, setDias] = useState("");

  const [peso, setPeso] = useState("");
  const [mgPorKg, setMgPorKg] = useState("");

  const [mgPorComprimido, setMgPorComprimido] = useState("");
  const [mgPorMl, setMgPorMl] = useState("");
  const [gotasPorMl, setGotasPorMl] = useState("20");

  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [ajudaAberta, setAjudaAberta] = useState(false);

  const modos = [
    {
      id: "comprimido",
      label: "Comprimido",
      desc: "mg e quantidade",
      icon: Pill,
    },
    {
      id: "liquido",
      label: "Líquido",
      desc: "mg/ml",
      icon: Syringe,
    },
    {
      id: "gotas",
      label: "Gotas",
      desc: "ml em gotas",
      icon: Droplets,
    },
    {
      id: "peso",
      label: "Peso",
      desc: "mg/kg",
      icon: Weight,
    },
  ];

  function numero(valor) {
    return Number(String(valor).replace(",", "."));
  }

  function valorValido(valor) {
    return valor !== "" && !Number.isNaN(numero(valor)) && numero(valor) > 0;
  }

  function limparResultado() {
    setResultado(null);
    setErro("");
  }

  function resetar() {
    setDose("");
    setFrequencia("");
    setDias("");
    setPeso("");
    setMgPorKg("");
    setMgPorComprimido("");
    setMgPorMl("");
    setGotasPorMl("20");
    setResultado(null);
    setErro("");
  }

  function validarBase() {
    if (!valorValido(frequencia) || !valorValido(dias)) {
      setErro("Informe frequência e dias de tratamento.");
      return false;
    }

    return true;
  }

  function calcular() {
    setErro("");
    setResultado(null);

    if (!validarBase()) return;

    const freq = numero(frequencia);
    const totalDias = numero(dias);
    const tomadas = freq * totalDias;

    if (modo === "peso") {
      if (!valorValido(peso) || !valorValido(mgPorKg)) {
        setErro("Informe peso e mg/kg da receita.");
        return;
      }

      const dosePorVezMg = numero(peso) * numero(mgPorKg);
      const totalMg = dosePorVezMg * tomadas;

      setResultado({
        modo,
        tomadas,
        dosePorVezMg,
        totalMg,
      });

      return;
    }

    if (!valorValido(dose)) {
      setErro("Informe a dose por vez.");
      return;
    }

    const dosePorVez = numero(dose);
    const totalDose = dosePorVez * tomadas;

    if (modo === "comprimido") {
      let comprimidosPorVez = null;
      let totalComprimidos = null;

      if (valorValido(mgPorComprimido)) {
        comprimidosPorVez = dosePorVez / numero(mgPorComprimido);
        totalComprimidos = Math.ceil(totalDose / numero(mgPorComprimido));
      }

      setResultado({
        modo,
        tomadas,
        dosePorVezMg: dosePorVez,
        totalMg: totalDose,
        comprimidosPorVez,
        totalComprimidos,
      });

      return;
    }

    if (modo === "liquido") {
      if (!valorValido(mgPorMl)) {
        setErro("Informe a concentração em mg/ml.");
        return;
      }

      const mlPorVez = dosePorVez / numero(mgPorMl);
      const totalMl = totalDose / numero(mgPorMl);

      setResultado({
        modo,
        tomadas,
        dosePorVezMg: dosePorVez,
        totalMg: totalDose,
        mlPorVez,
        totalMl,
      });

      return;
    }

    if (modo === "gotas") {
      if (!valorValido(mgPorMl) || !valorValido(gotasPorMl)) {
        setErro("Informe mg/ml e gotas por ml.");
        return;
      }

      const mlPorVez = dosePorVez / numero(mgPorMl);
      const gotasPorVez = mlPorVez * numero(gotasPorMl);
      const totalMl = totalDose / numero(mgPorMl);
      const totalGotas = totalMl * numero(gotasPorMl);

      setResultado({
        modo,
        tomadas,
        dosePorVezMg: dosePorVez,
        totalMg: totalDose,
        mlPorVez,
        gotasPorVez,
        totalMl,
        totalGotas,
      });
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="violet" />

      <div className="relative z-10 mx-auto max-w-5xl p-4 pb-24 text-gray-950 dark:text-white">
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
              <Calculator size={24} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight">
                Posologia Inteligente
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Calculadora de apoio para dose, dias e quantidade.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAjudaAberta(true)}
            className="
              flex shrink-0 items-center gap-2 rounded-2xl
              border border-violet-200 bg-white/90 px-3 py-2
              text-xs font-black text-violet-700 shadow-lg shadow-black/5
              backdrop-blur-xl transition active:scale-95
              dark:border-violet-500/20 dark:bg-gray-900/90 dark:text-violet-300
            "
          >
            <Info size={16} />
            Como usar
          </button>
        </div>

        {/* AVISO */}
        <div className="mb-4 flex gap-3 rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-800 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={22} className="mt-0.5 shrink-0" />
          <p>
            Use apenas para calcular informações que já estão na receita. Não use
            esta tela para decidir dose por conta própria.
          </p>
        </div>

        {/* MODOS */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {modos.map((item) => {
            const Icon = item.icon;
            const ativo = modo === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setModo(item.id);
                  limparResultado();
                }}
                className={`
                  rounded-3xl border p-4 text-left shadow-sm backdrop-blur-xl transition active:scale-95
                  ${
                    ativo
                      ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                      : "border-gray-200 bg-white/90 text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-800"
                  }
                `}
              >
                <div
                  className={`
                    mb-3 flex h-10 w-10 items-center justify-center rounded-2xl
                    ${
                      ativo
                        ? "bg-white/15"
                        : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                    }
                  `}
                >
                  <Icon size={21} />
                </div>

                <p className="font-bold">{item.label}</p>
                <p
                  className={
                    ativo ? "text-xs text-white/75" : "text-xs text-gray-500"
                  }
                >
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* ERRO */}
        {erro && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle size={18} />
            {erro}
          </div>
        )}

        {/* CARD FORM */}
        <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div className="mb-4 rounded-3xl border border-violet-200 bg-violet-50/80 p-4 text-sm text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
            <div className="flex gap-3">
              <Info size={20} className="mt-0.5 shrink-0" />
              <p>
                Escolha o tipo, copie os dados que estão na receita e preencha
                frequência e duração. Depois toque em calcular.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {modo === "peso" ? (
              <>
                <Campo
                  icon={Scale}
                  label="Peso"
                  suffix="kg"
                  value={peso}
                  onChange={setPeso}
                  placeholder="Ex: 18"
                />

                <Campo
                  icon={Weight}
                  label="Dose da receita"
                  suffix="mg/kg por vez"
                  value={mgPorKg}
                  onChange={setMgPorKg}
                  placeholder="Ex: 10"
                />
              </>
            ) : (
              <>
                <Campo
                  icon={Pill}
                  label="Dose por vez"
                  suffix="mg"
                  value={dose}
                  onChange={setDose}
                  placeholder="Ex: 500"
                />

                {modo === "comprimido" && (
                  <Campo
                    icon={Pill}
                    label="Concentração do comprimido"
                    suffix="mg/comprimido"
                    value={mgPorComprimido}
                    onChange={setMgPorComprimido}
                    placeholder="Ex: 500"
                    optional
                  />
                )}

                {(modo === "liquido" || modo === "gotas") && (
                  <Campo
                    icon={Syringe}
                    label="Concentração"
                    suffix="mg/ml"
                    value={mgPorMl}
                    onChange={setMgPorMl}
                    placeholder="Ex: 50"
                  />
                )}

                {modo === "gotas" && (
                  <Campo
                    icon={Droplets}
                    label="Gotas por ml"
                    suffix="gotas/ml"
                    value={gotasPorMl}
                    onChange={setGotasPorMl}
                    placeholder="Ex: 20"
                  />
                )}
              </>
            )}

            <Campo
              icon={CalendarDays}
              label="Frequência"
              suffix="vezes ao dia"
              value={frequencia}
              onChange={setFrequencia}
              placeholder="Ex: 3"
            />

            <Campo
              icon={CalendarDays}
              label="Duração"
              suffix="dias"
              value={dias}
              onChange={setDias}
              placeholder="Ex: 7"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={calcular}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 active:scale-95"
            >
              <Calculator size={18} />
              Calcular
            </button>

            <button
              type="button"
              onClick={resetar}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white font-bold text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RotateCcw size={18} />
              Limpar
            </button>
          </div>

          {/* RESULTADO */}
          {resultado && (
            <div className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <h2 className="font-black">Resultado</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total de {resultado.tomadas} tomada(s) no tratamento.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {resultado.dosePorVezMg && (
                  <ResultadoItem
                    label="Dose por vez"
                    valor={`${resultado.dosePorVezMg.toFixed(2)} mg`}
                  />
                )}

                {resultado.totalMg && (
                  <ResultadoItem
                    label="Total em mg"
                    valor={`${resultado.totalMg.toFixed(2)} mg`}
                  />
                )}

                {resultado.comprimidosPorVez !== null &&
                  resultado.comprimidosPorVez !== undefined && (
                    <ResultadoItem
                      label="Comprimidos por vez"
                      valor={`${resultado.comprimidosPorVez.toFixed(2)} comp.`}
                    />
                  )}

                {resultado.totalComprimidos && (
                  <ResultadoItem
                    label="Total aproximado"
                    valor={`${resultado.totalComprimidos} comprimido(s)`}
                  />
                )}

                {resultado.mlPorVez && (
                  <ResultadoItem
                    label="Ml por vez"
                    valor={`${resultado.mlPorVez.toFixed(2)} ml`}
                  />
                )}

                {resultado.totalMl && (
                  <ResultadoItem
                    label="Total em ml"
                    valor={`${resultado.totalMl.toFixed(2)} ml`}
                  />
                )}

                {resultado.gotasPorVez && (
                  <ResultadoItem
                    label="Gotas por vez"
                    valor={`${Math.round(resultado.gotasPorVez)} gota(s)`}
                  />
                )}

                {resultado.totalGotas && (
                  <ResultadoItem
                    label="Total de gotas"
                    valor={`${Math.round(resultado.totalGotas)} gota(s)`}
                  />
                )}
              </div>

              <div className="mt-4 flex gap-2 rounded-2xl bg-white/70 p-3 text-xs text-gray-600 dark:bg-gray-950/50 dark:text-gray-300">
                <Info size={16} className="shrink-0" />
                <p>
                  Valores arredondados ajudam no planejamento, mas a administração
                  deve seguir exatamente a orientação da receita.
                </p>
              </div>
            </div>
          )}
        </div>

        {ajudaAberta && (
          <ModalAjudaPosologia fechar={() => setAjudaAberta(false)} />
        )}
      </div>
    </div>
  );
}

function ModalAjudaPosologia({ fechar }) {
  return (
    <div
      onClick={fechar}
      className="
        fixed inset-0 z-[99999] flex items-end justify-center
        bg-black/55 p-4 backdrop-blur-sm sm:items-center
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-lg overflow-hidden rounded-[2rem] border border-gray-200
          bg-white text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white
        "
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 to-slate-950 p-5 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-violet-300/10" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Calculator size={25} />
              </div>

              <h2 className="text-xl font-black">Como usar a Posologia</h2>
              <p className="mt-1 text-sm text-violet-100">
                Um guia rápido para não transformar mg/ml em sopa de números.
              </p>
            </div>

            <button
              type="button"
              onClick={fechar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 transition active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Passo
            numero="1"
            titulo="Escolha o tipo"
            texto="Use comprimido, líquido, gotas ou peso conforme está escrito na receita."
          />

          <Passo
            numero="2"
            titulo="Preencha a dose"
            texto="Dose por vez é quanto a pessoa toma em cada tomada. Exemplo: 500 mg por vez."
          />

          <Passo
            numero="3"
            titulo="Informe frequência e dias"
            texto="Frequência é quantas vezes por dia. Duração é por quantos dias o tratamento vai acontecer."
          />

          <Passo
            numero="4"
            titulo="Toque em calcular"
            texto="O app mostra total de tomadas, total em mg e, quando possível, comprimidos, ml ou gotas."
          />

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
            <h3 className="mb-3 font-black text-violet-800 dark:text-violet-200">
              Exemplos rápidos
            </h3>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <Exemplo
                titulo="Comprimido"
                texto="Receita: 500 mg, 3 vezes ao dia, 7 dias. Se o comprimido tem 500 mg, o resultado mostra 1 comprimido por vez e total aproximado."
              />

              <Exemplo
                titulo="Líquido"
                texto="Receita: 250 mg por vez. Frasco: 50 mg/ml. O app calcula quantos ml por vez."
              />

              <Exemplo
                titulo="Gotas"
                texto="Receita: 100 mg por vez. Frasco: 50 mg/ml e 20 gotas/ml. O app calcula ml e gotas por vez."
              />

              <Exemplo
                titulo="Peso"
                texto="Receita: 10 mg/kg por vez. Peso: 18 kg. O app calcula 180 mg por vez."
              />
            </div>
          </div>

          <div className="flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p>
              Essa tela ajuda a fazer conta. Ela não substitui receita,
              farmacêutico ou médico. Se a receita estiver confusa, melhor
              confirmar antes.
            </p>
          </div>

          <button
            type="button"
            onClick={fechar}
            className="
              flex w-full items-center justify-center gap-2 rounded-2xl
              bg-violet-600 py-3 font-black text-white shadow-lg
              shadow-violet-600/20 transition active:scale-95
            "
          >
            <CheckCircle2 size={18} />
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

function Passo({ numero, titulo, texto }) {
  return (
    <div className="flex gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/70">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-sm font-black text-white">
        {numero}
      </div>

      <div>
        <p className="font-black">{titulo}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{texto}</p>
      </div>
    </div>
  );
}

function Exemplo({ titulo, texto }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3 dark:bg-gray-950/50">
      <p className="font-black text-gray-950 dark:text-white">{titulo}</p>
      <p className="mt-1">{texto}</p>
    </div>
  );
}

function Campo({
  icon: Icon,
  label,
  suffix,
  value,
  onChange,
  placeholder,
  optional = false,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className="text-violet-600 dark:text-violet-300" />

        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {label}
        </label>

        {optional && (
          <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            opcional
          </span>
        )}
      </div>

      <div className="flex overflow-hidden rounded-2xl border border-transparent bg-gray-100 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/15 dark:bg-gray-950">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d,.]/g, ""))}
          inputMode="decimal"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent p-4 text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
        />

        {suffix && (
          <div className="flex items-center border-l border-gray-200 px-3 text-xs font-bold text-gray-500 dark:border-gray-800 dark:text-gray-400">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultadoItem({ label, valor }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 dark:bg-gray-950/50">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-gray-950 dark:text-white">
        {valor}
      </p>
    </div>
  );
}

export default Posologia;