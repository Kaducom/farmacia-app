import { useMemo, useState } from "react";
import FundoBolhas from "../components/FundoBolhas";

import {
  Calculator,
  Pill,
  Droplets,
  Syringe,
  Package,
  Clock3,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

function Posologia() {
  const [modo, setModo] = useState("liquido");

  const [medicamento, setMedicamento] = useState("");

  const [dose, setDose] = useState("");
  const [intervalo, setIntervalo] = useState("8");
  const [dias, setDias] = useState("");

  const [frasco, setFrasco] = useState("");

  const [erro, setErro] = useState("");

  const resultado = useMemo(() => {
    return calcular();
  }, [modo, dose, intervalo, dias, frasco]);

  function numero(v) {
    return Number(String(v).replace(",", "."));
  }

  function calcular() {
    if (!dose || !intervalo || !dias) return null;

    const doseNum = numero(dose);
    const intervaloNum = numero(intervalo);
    const diasNum = numero(dias);

    if (
      !doseNum ||
      !intervaloNum ||
      !diasNum
    ) {
      return null;
    }

    const tomadasPorDia = 24 / intervaloNum;

    const total = doseNum * tomadasPorDia * diasNum;

    let frascos = null;
    let sobra = null;

    if (frasco) {
      const frascoNum = numero(frasco);

      frascos = Math.ceil(total / frascoNum);

      sobra =
        frascos * frascoNum - total;
    }

    return {
      tomadasPorDia,
      total,
      frascos,
      sobra,
    };
  }

  function limpar() {
    setMedicamento("");
    setDose("");
    setIntervalo("8");
    setDias("");
    setFrasco("");
    setErro("");
  }

  const modos = [
    {
      id: "liquido",
      label: "Líquido",
      icon: Syringe,
      unidade: "mL",
      embalagem: "Frasco",
    },
    {
      id: "gotas",
      label: "Gotas",
      icon: Droplets,
      unidade: "gotas",
      embalagem: "Frasco",
    },
    {
      id: "comprimido",
      label: "Comprimido",
      icon: Pill,
      unidade: "comprimidos",
      embalagem: "Cartela",
    },
  ];

  const modoAtual =
    modos.find((m) => m.id === modo);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="violet" />

      <div className="relative z-10 mx-auto max-w-5xl p-4 pb-28 text-gray-950 dark:text-white">

        {/* HEADER */}
        <div className="
          mb-5 overflow-hidden rounded-[2rem]
          bg-gradient-to-br from-violet-700
          via-fuchsia-700 to-slate-950
          p-6 text-white shadow-2xl
        ">
          <div className="flex items-start gap-4">

            <div className="
              flex h-14 w-14 shrink-0
              items-center justify-center
              rounded-2xl bg-white/15
              backdrop-blur-md
            ">
              <Calculator size={30} />
            </div>

            <div>
              <p className="
                text-xs font-black uppercase
                tracking-[0.25em]
                text-violet-100/70
              ">
                Calculadora inteligente
              </p>

              <h1 className="
                mt-1 text-3xl font-black
                tracking-tight
              ">
                Posologia Premium
              </h1>

              <p className="
                mt-2 max-w-2xl
                text-sm text-violet-100
              ">
                Descubra rapidamente quanto será necessário
                para o tratamento completo 💊
              </p>
            </div>
          </div>
        </div>

        {/* AVISO */}
        <div className="
          mb-5 flex gap-3 rounded-3xl
          border border-violet-200
          bg-violet-50/90 p-4 text-sm
          text-violet-800 shadow-lg
          backdrop-blur-xl
          dark:border-violet-500/20
          dark:bg-violet-500/10
          dark:text-violet-200
        ">
          <Info size={20} className="shrink-0" />

          <p>
            Ideal para calcular quantidade total
            de tratamento, frascos necessários,
            comprimidos e sobra aproximada.
          </p>
        </div>

        {/* MODOS */}
        <div className="
          mb-5 grid grid-cols-3 gap-3
        ">
          {modos.map((item) => {
            const Icon = item.icon;

            const ativo =
              modo === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setModo(item.id)}
                className={`
                  rounded-3xl border p-4
                  transition active:scale-95
                  ${
                    ativo
                      ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                      : "border-gray-200 bg-white/90 text-gray-800 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-200"
                  }
                `}
              >
                <div className="
                  mb-3 flex h-11 w-11
                  items-center justify-center
                  rounded-2xl
                  bg-white/15
                ">
                  <Icon size={22} />
                </div>

                <p className="font-black">
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* CARD */}
        <div className="
          rounded-[2rem]
          border border-gray-200
          bg-white/90 p-5
          shadow-xl shadow-black/5
          backdrop-blur-xl
          dark:border-gray-800
          dark:bg-gray-900/90
        ">

          {/* NOME */}
          <Campo
            label="Medicamento"
            placeholder="Ex: Amoxicilina 250mg/5mL"
            value={medicamento}
            onChange={setMedicamento}
          />

          {/* DOSE */}
          <div className="mt-4">
            <Campo
              label={`Dose por vez (${modoAtual.unidade})`}
              placeholder={
                modo === "liquido"
                  ? "Ex: 5,5"
                  : modo === "gotas"
                  ? "Ex: 20"
                  : "Ex: 1"
              }
              value={dose}
              onChange={setDose}
            />
          </div>

          {/* INTERVALO */}
          <div className="mt-4">
            <label className="
              mb-2 block text-sm font-bold
              text-gray-700 dark:text-gray-300
            ">
              Intervalo
            </label>

            <div className="
              grid grid-cols-4 gap-2
            ">
              {["6", "8", "12", "24"].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setIntervalo(h)}
                  className={`
                    rounded-2xl py-3
                    font-black transition
                    active:scale-95
                    ${
                      intervalo === h
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-950"
                    }
                  `}
                >
                  {h}/{h}h
                </button>
              ))}
            </div>
          </div>

          {/* DIAS */}
          <div className="mt-4">
            <Campo
              label="Dias de tratamento"
              placeholder="Ex: 7"
              value={dias}
              onChange={setDias}
            />
          </div>

          {/* EMBALAGEM */}
          <div className="mt-4">
            <Campo
              label={`${modoAtual.embalagem} (${modoAtual.unidade})`}
              placeholder={
                modo === "comprimido"
                  ? "Ex: 21"
                  : "Ex: 100"
              }
              value={frasco}
              onChange={setFrasco}
            />
          </div>

          {/* BOTÕES */}
          <div className="
            mt-5 flex flex-col gap-3
            md:flex-row
          ">
            <button
              type="button"
              className="
                flex h-[52px] flex-1
                items-center justify-center
                gap-2 rounded-2xl
                bg-violet-600 font-black
                text-white shadow-lg
                shadow-violet-600/20
              "
            >
              <CheckCircle2 size={18} />
              Calculando automático
            </button>

            <button
              type="button"
              onClick={limpar}
              className="
                flex h-[52px] flex-1
                items-center justify-center
                gap-2 rounded-2xl
                border border-gray-300
                bg-white font-black
                text-gray-700
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-200
              "
            >
              <RotateCcw size={18} />
              Limpar
            </button>
          </div>

          {/* RESULTADO */}
          {resultado && (
            <div className="
              mt-5 rounded-[2rem]
              border border-violet-200
              bg-violet-50 p-5
              dark:border-violet-500/20
              dark:bg-violet-500/10
            ">
              <div className="
                mb-4 flex items-center gap-3
              ">
                <div className="
                  flex h-12 w-12
                  items-center justify-center
                  rounded-2xl
                  bg-violet-600 text-white
                ">
                  <Package size={24} />
                </div>

                <div>
                  <h2 className="
                    text-xl font-black
                  ">
                    Resultado
                  </h2>

                  <p className="
                    text-sm text-gray-500
                    dark:text-gray-400
                  ">
                    Quantidade total do tratamento
                  </p>
                </div>
              </div>

              <div className="
                grid gap-3 md:grid-cols-2
              ">

                <Resultado
                  titulo="Tomadas por dia"
                  valor={
                    `${resultado.tomadasPorDia}x`
                  }
                />

                <Resultado
                  titulo="Total necessário"
                  valor={
                    `${resultado.total.toFixed(1)} ${modoAtual.unidade}`
                  }
                />

                {resultado.frascos && (
                  <>
                    <Resultado
                      titulo={`${modoAtual.embalagem}s necessárias`}
                      valor={
                        `${resultado.frascos}`
                      }
                    />

                    <Resultado
                      titulo="Sobra aproximada"
                      valor={
                        `${resultado.sobra.toFixed(1)} ${modoAtual.unidade}`
                      }
                    />
                  </>
                )}
              </div>

              {/* ALERTA */}
              {resultado.frascos === 1 &&
                resultado.sobra <= 5 &&
                modo !== "comprimido" && (
                <div className="
                  mt-4 flex gap-3
                  rounded-2xl
                  bg-amber-100 p-4
                  text-sm text-amber-700
                  dark:bg-amber-500/10
                  dark:text-amber-200
                ">
                  <AlertTriangle
                    size={18}
                    className="shrink-0"
                  />

                  <p>
                    Atenção: sobra muito pequena.
                    Pode valer conferir se um frasco será suficiente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="
        mb-2 block text-sm
        font-bold text-gray-700
        dark:text-gray-300
      ">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="
          w-full rounded-2xl
          border border-gray-200
          bg-gray-100 p-4
          font-bold outline-none
          transition
          focus:border-violet-500
          focus:ring-4
          focus:ring-violet-500/15
          dark:border-gray-800
          dark:bg-gray-950
        "
      />
    </div>
  );
}

function Resultado({
  titulo,
  valor,
}) {
  return (
    <div className="
      rounded-2xl
      bg-white/80 p-4
      dark:bg-gray-950/50
    ">
      <p className="
        text-xs font-medium
        text-gray-500
        dark:text-gray-400
      ">
        {titulo}
      </p>

      <p className="
        mt-1 text-2xl
        font-black
      ">
        {valor}
      </p>
    </div>
  );
}

export default Posologia;