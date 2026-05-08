import { useMemo, useState } from "react";
import FundoBolhas from "../components/FundoBolhas";

import {
  Calculator,
  Pill,
  Droplets,
  Syringe,
  Package,
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

  const [intervaloManual, setIntervaloManual] = useState("");

  const [dias, setDias] = useState("");

  const [frasco, setFrasco] = useState("");

  const [gotasPorMl, setGotasPorMl] = useState("20");

  const intervalosRapidos = [
    "2",
    "3",
    "4",
    "6",
    "8",
    "12",
    "24",
  ];

  const resultado = useMemo(() => {
    return calcular();
  }, [
    modo,
    dose,
    intervalo,
    dias,
    frasco,
    gotasPorMl,
  ]);

  function numero(v) {
    return Number(
      String(v).replace(",", ".")
    );
  }

  function formatarNumero(n) {
    return Number(n).toLocaleString(
      "pt-BR",
      {
        maximumFractionDigits: 2,
      }
    );
  }

  function interpretarIntervalo(texto) {

    const limpo =
      String(texto)
        .toLowerCase()
        .trim();

    const matchBarra =
      limpo.match(
        /(\d+(?:[,.]\d+)?)\s*\/\s*(\d+(?:[,.]\d+)?)/
      );

    if (matchBarra) {
      return matchBarra[1];
    }

    const matchHoras =
      limpo.match(
        /(\d+(?:[,.]\d+)?)\s*h/
      );

    if (matchHoras) {
      return matchHoras[1];
    }

    const matchVezes =
      limpo.match(
        /(\d+(?:[,.]\d+)?)\s*(x|vez|vezes)/
      );

    if (matchVezes) {

      const vezes =
        numero(matchVezes[1]);

      if (vezes > 0) {

        return String(
          Number(
            (24 / vezes).toFixed(2)
          )
        ).replace(".", ",");

      }
    }

    return "";
  }

  function aplicarIntervaloManual(valor) {

    setIntervaloManual(valor);

    const interpretado =
      interpretarIntervalo(valor);

    if (interpretado) {
      setIntervalo(interpretado);
    }
  }

  function calcular() {

    if (
      !dose ||
      !intervalo ||
      !dias
    ) {
      return null;
    }

    const doseNum =
      numero(dose);

    const intervaloNum =
      numero(intervalo);

    const diasNum =
      numero(dias);

    const tomadasPorDia =
      24 / intervaloNum;

    const total =
      doseNum *
      tomadasPorDia *
      diasNum;

    let capacidade = null;

    let totalGotasFrasco =
      null;

    if (modo === "gotas") {

      const ml =
        numero(frasco);

      const gotasMl =
        numero(gotasPorMl);

      totalGotasFrasco =
        ml * gotasMl;

      capacidade =
        totalGotasFrasco;

    } else {

      capacidade =
        numero(frasco);

    }

    let frascos = null;

    let sobra = null;

    let diasPorFrasco =
      null;

    if (capacidade) {

      frascos =
        Math.ceil(
          total / capacidade
        );

      sobra =
        frascos *
          capacidade -
        total;

      diasPorFrasco =
        capacidade /
        (
          doseNum *
          tomadasPorDia
        );
    }

    return {
      tomadasPorDia,
      total,
      frascos,
      sobra,
      totalGotasFrasco,
      diasPorFrasco,
    };
  }

  function limpar() {

    setMedicamento("");

    setDose("");

    setIntervalo("8");

    setIntervaloManual("");

    setDias("");

    setFrasco("");

    setGotasPorMl("20");
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
    modos.find(
      (m) => m.id === modo
    );

  return (
    <div className="relative min-h-screen overflow-hidden">

      <FundoBolhas variant="violet" />

      <div className="
        relative z-10
        mx-auto max-w-5xl
        p-4 pb-28
        text-gray-950
        dark:text-white
      ">

        {/* HEADER */}
        <div className="
          mb-5 overflow-hidden
          rounded-[2rem]
          bg-gradient-to-br
          from-violet-700
          via-fuchsia-700
          to-slate-950
          p-6 text-white
          shadow-2xl
        ">

          <div className="
            flex items-start gap-4
          ">

            <div className="
              flex h-14 w-14
              shrink-0 items-center
              justify-center
              rounded-2xl
              bg-white/15
            ">
              <Calculator size={30} />
            </div>

            <div>

              <p className="
                text-xs font-black
                uppercase tracking-[0.25em]
                text-violet-100/70
              ">
                calculadora inteligente
              </p>

              <h1 className="
                mt-1 text-3xl
                font-black
              ">
                Posologia Premium
              </h1>

              <p className="
                mt-2 text-sm
                text-violet-100
              ">
                Cálculo automático de
                gotas, frascos,
                comprimidos e duração
                do tratamento 💊
              </p>

            </div>
          </div>
        </div>

        {/* AVISO */}
        <div className="
          mb-5 flex gap-3
          rounded-3xl
          border border-violet-200
          bg-violet-50/90
          p-4 text-sm
          text-violet-800
          shadow-lg
          dark:border-violet-500/20
          dark:bg-violet-500/10
          dark:text-violet-200
        ">

          <Info
            size={20}
            className="shrink-0"
          />

          <p>
            O modo gotas calcula
            automaticamente quantas
            gotas existem no frasco
            e quantos dias ele dura.
          </p>

        </div>

        {/* MODOS */}
        <div className="
          mb-5 grid
          grid-cols-3 gap-3
        ">

          {modos.map((item) => {

            const Icon =
              item.icon;

            const ativo =
              modo === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setModo(item.id);
                  limpar();
                }}
                className={`
                  rounded-3xl
                  border p-4
                  transition
                  active:scale-95
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
          dark:border-gray-800
          dark:bg-gray-900/90
        ">

          {/* MEDICAMENTO */}
          <div>

            <div className="
              mb-2 flex
              items-center gap-2
            ">

              <label className="
                text-sm font-bold
                text-gray-700
                dark:text-gray-300
              ">
                Nome do medicamento
              </label>

              <span className="
                rounded-full
                bg-violet-100
                px-2 py-0.5
                text-[10px]
                font-black uppercase
                text-violet-700
                dark:bg-violet-500/20
                dark:text-violet-200
              ">
                opcional
              </span>

            </div>

            <input
              value={medicamento}
              onChange={(e) =>
                setMedicamento(
                  e.target.value
                )
              }
              placeholder="Digite o nome do medicamento"
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

          {/* DOSE */}
          <div className="mt-4">

            <Campo
              label={`Dose por vez (${modoAtual.unidade})`}
              placeholder={
                modo === "gotas"
                  ? "10"
                  : modo === "comprimido"
                  ? "1"
                  : "5,5"
              }
              value={dose}
              onChange={setDose}
            />

          </div>

          {/* INTERVALO */}
          <div className="mt-4">

            <label className="
              mb-2 block text-sm
              font-bold
              text-gray-700
              dark:text-gray-300
            ">
              Intervalo inteligente
            </label>

            <div className="
              grid grid-cols-4
              gap-2 md:grid-cols-7
            ">

              {intervalosRapidos.map(
                (h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setIntervalo(h);
                      setIntervaloManual("");
                    }}
                    className={`
                      rounded-2xl py-3
                      font-black
                      transition
                      active:scale-95
                      ${
                        intervalo === h &&
                        !intervaloManual
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 dark:bg-gray-950"
                      }
                    `}
                  >
                    {h}/{h}h
                  </button>
                )
              )}
            </div>

            <input
              value={intervaloManual}
              onChange={(e) =>
                aplicarIntervaloManual(
                  e.target.value
                )
              }
              placeholder="3/3h, 2x ao dia..."
              className="
                mt-3 w-full
                rounded-2xl
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

            <p className="
              mt-2 text-xs
              text-gray-500
              dark:text-gray-400
            ">
              Interpretado como:
              de {intervalo}/{intervalo}h
            </p>

          </div>

          {/* DIAS */}
          <div className="mt-4">

            <Campo
              label="Dias de tratamento"
              placeholder="7"
              value={dias}
              onChange={setDias}
            />

          </div>

          {/* GOTAS */}
          {modo === "gotas" ? (
            <>
              <div className="mt-4">

                <Campo
                  label="Volume do frasco (mL)"
                  placeholder="20"
                  value={frasco}
                  onChange={setFrasco}
                />

              </div>

              <div className="mt-4">

                <Campo
                  label="Gotas por mL"
                  placeholder="20"
                  value={gotasPorMl}
                  onChange={setGotasPorMl}
                />

              </div>
            </>
          ) : (
            <div className="mt-4">

              <Campo
                label={`${modoAtual.embalagem} (${modoAtual.unidade})`}
                placeholder={
                  modo === "comprimido"
                    ? "21"
                    : "100"
                }
                value={frasco}
                onChange={setFrasco}
              />

            </div>
          )}

          {/* BOTÕES */}
          <div className="
            mt-5 flex flex-col
            gap-3 md:flex-row
          ">

            <button
              type="button"
              className="
                flex h-[52px]
                flex-1 items-center
                justify-center gap-2
                rounded-2xl
                bg-violet-600
                font-black text-white
                shadow-lg
              "
            >
              <CheckCircle2 size={18} />
              Calculando automático
            </button>

            <button
              type="button"
              onClick={limpar}
              className="
                flex h-[52px]
                flex-1 items-center
                justify-center gap-2
                rounded-2xl
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
                mb-4 flex
                items-center gap-3
              ">

                <div className="
                  flex h-12 w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-600
                  text-white
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
                    Quantidade total
                    do tratamento
                  </p>

                </div>
              </div>

              <div className="
                grid gap-3
                md:grid-cols-2
              ">

                <Resultado
                  titulo="Tomadas por dia"
                  valor={`${formatarNumero(resultado.tomadasPorDia)}x`}
                />

                <Resultado
                  titulo="Total necessário"
                  valor={`${formatarNumero(resultado.total)} ${modoAtual.unidade}`}
                />

                {modo === "gotas" &&
                  resultado.totalGotasFrasco && (

                  <Resultado
                    titulo="Gotas no frasco"
                    valor={`${formatarNumero(resultado.totalGotasFrasco)} gotas`}
                  />
                )}

                {resultado.diasPorFrasco && (

                  <Resultado
                    titulo="Duração da embalagem"
                    valor={`${formatarNumero(resultado.diasPorFrasco)} dias`}
                  />
                )}

                {resultado.frascos && (
                  <>
                    <Resultado
                      titulo={`${modoAtual.embalagem}s necessárias`}
                      valor={`${resultado.frascos}`}
                    />

                    <Resultado
                      titulo="Sobra aproximada"
                      valor={`${formatarNumero(resultado.sobra)} ${modoAtual.unidade}`}
                    />
                  </>
                )}

              </div>

              {resultado.frascos === 1 &&
                resultado.sobra <= 5 && (

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
                    Atenção:
                    sobra muito pequena.
                    Pode valer conferir
                    se uma embalagem
                    será suficiente.
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
        font-bold
        text-gray-700
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