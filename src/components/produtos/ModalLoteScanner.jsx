import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  Barcode,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Minus,
  PackageCheck,
  Pill,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

function ModalLoteScanner({
  dados,
  processando,
  formatarData,
  formatarValidadeDigitada,
  onFechar,
  onSomarLote,
  onNovaValidade,
}) {
  const [validadeRapida, setValidadeRapida] = useState("");
  const [quantidadeSomar, setQuantidadeSomar] = useState(
    Math.max(1, Number(dados?.quantidadeScanner || 1))
  );

  const produto = dados?.produto || {};
  const lotes = Array.isArray(dados?.lotes) ? dados.lotes : [];

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: true },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("app-overlay-change", {
          detail: { open: false },
        })
      );
    };
  }, []);

  function alterarQuantidade(delta) {
    setQuantidadeSomar((prev) => {
      const atual = Number(prev || 1);
      return Math.max(1, Math.min(999, atual + delta));
    });
  }

  function parseDataLocal(valor) {
    if (!valor) return null;

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      return valor;
    }

    const texto = String(valor).trim();

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split("/").map(Number);
      const data = new Date(ano, mes - 1, dia);

      if (
        data.getDate() !== dia ||
        data.getMonth() !== mes - 1 ||
        data.getFullYear() !== ano
      ) {
        return null;
      }

      return data;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [ano, mes, dia] = texto.split("-").map(Number);
      const data = new Date(ano, mes - 1, dia);

      if (
        data.getDate() !== dia ||
        data.getMonth() !== mes - 1 ||
        data.getFullYear() !== ano
      ) {
        return null;
      }

      return data;
    }

    const convertida = new Date(texto);

    if (Number.isNaN(convertida.getTime())) {
      return null;
    }

    return convertida;
  }

  function calcularDiasAte(valor) {
    const data = parseDataLocal(valor);

    if (!data) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alvo = new Date(data);
    alvo.setHours(0, 0, 0, 0);

    return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
  }

  function textoDias(valor) {
    const dias = calcularDiasAte(valor);

    if (dias === null) return "Sem cálculo";
    if (dias === 0) return "Hoje";
    if (dias === 1) return "Amanhã";
    if (dias < 0) return `${Math.abs(dias)} dias vencido`;

    return `Em ${dias} dias`;
  }

  function getStatusLote(valor) {
    const dias = calcularDiasAte(valor);

    if (dias === null) return "neutro";
    if (dias < 0) return "vencido";
    if (dias <= 30) return "alerta";

    return "ok";
  }

  const lotesOrdenados = [...lotes].sort((a, b) => {
    const dataA = parseDataLocal(a.validade);
    const dataB = parseDataLocal(b.validade);

    if (!dataA && !dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;

    return dataA - dataB;
  });

  const loteMaisProximo = lotesOrdenados[0] || null;

  const totalUnidades = lotesOrdenados.reduce(
    (total, lote) => total + Number(lote.quantidade || 1),
    0
  );

  function handleValidade(e) {
    const formatada = formatarValidadeDigitada(e.target.value);
    const digitos = formatada.replace(/\D/g, "");

    setValidadeRapida(formatada);

    const mesPossivel = Number(digitos.slice(0, 2));

    const validadeMesAno =
      digitos.length === 4 && mesPossivel >= 1 && mesPossivel <= 12;

    const validadeCompleta = digitos.length === 8;

    if (validadeMesAno || validadeCompleta) {
      onNovaValidade(formatada, quantidadeSomar);
      setValidadeRapida("");
    }
  }

  function fechar() {
    window.dispatchEvent(
      new CustomEvent("app-overlay-change", {
        detail: { open: false },
      })
    );

    onFechar();
  }

  return (
    <motion.div
      onClick={fechar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[2147483647] flex h-[100dvh] items-end justify-center
        overflow-hidden bg-slate-950/80 px-3
        pb-[calc(env(safe-area-inset-bottom)+0.85rem)]
        pt-[calc(env(safe-area-inset-top)+0.85rem)]
        backdrop-blur-md
        sm:items-center sm:p-4
      "
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 34, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 34, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
        className="
          relative flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.7rem)]
          w-full max-w-2xl flex-col overflow-hidden rounded-[2rem]
          border border-white/10 bg-white text-gray-950 shadow-2xl
          dark:bg-gray-950 dark:text-white
          sm:h-[92dvh]
        "
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-500/10 to-transparent" />

        {/* HEADER */}
        <div className="relative shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-emerald-700 via-emerald-900 to-slate-950 p-5 text-white">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-emerald-300/10" />

          <div className="relative mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/30 sm:hidden" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/15 shadow-xl backdrop-blur-md">
              {produto.imagem ? (
                <img
                  src={produto.imagem}
                  alt={produto.nome || "Produto"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Pill size={31} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-50">
                <Sparkles size={12} />
                Produto reconhecido
              </span>

              <p className="truncate text-xl font-black">
                {produto.nome || "Produto reconhecido"}
              </p>

              <p className="mt-1 flex items-center gap-1 truncate text-xs text-emerald-100">
                <Barcode size={14} />
                {dados?.codigo}
              </p>
            </div>

            <button
              type="button"
              onClick={fechar}
              className="
                flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                bg-white/15 text-white transition active:scale-95 hover:bg-white/20
              "
              aria-label="Fechar modal de lote"
            >
              <X size={21} />
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-4 gap-2">
            <MiniLoteInfo label="Lotes" valor={lotes.length} />
            <MiniLoteInfo label="Unid." valor={totalUnidades} />
            <MiniLoteInfo label="Somar" valor={`x${quantidadeSomar}`} />
            <MiniLoteInfo
              label="Próximo"
              valor={
                loteMaisProximo
                  ? formatarData(loteMaisProximo.validade)
                  : "Novo"
              }
            />
          </div>
        </div>

        {/* BODY */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-emerald-800 dark:text-emerald-300">
                  Quantidade para somar
                </p>

                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Ajuste uma vez e toque no lote certo.
                </p>
              </div>

              <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-black text-white">
                +{quantidadeSomar}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alterarQuantidade(-1)}
                disabled={processando}
                className="
                  flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                  bg-white text-emerald-700 shadow-sm transition active:scale-95
                  disabled:opacity-60 dark:bg-gray-950 dark:text-emerald-300
                "
              >
                <Minus size={19} />
              </button>

              <input
                value={quantidadeSomar}
                onChange={(e) => {
                  const valor = Number(e.target.value.replace(/\D/g, ""));
                  setQuantidadeSomar(Math.max(1, Math.min(999, valor || 1)));
                }}
                inputMode="numeric"
                disabled={processando}
                className="
                  h-12 min-w-0 flex-1 rounded-2xl border border-emerald-200
                  bg-white px-4 text-center text-xl font-black text-gray-950
                  outline-none transition
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20
                  disabled:opacity-60
                  dark:border-emerald-500/20 dark:bg-gray-950 dark:text-white
                "
              />

              <button
                type="button"
                onClick={() => alterarQuantidade(1)}
                disabled={processando}
                className="
                  flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                  bg-emerald-700 text-white shadow-lg shadow-emerald-700/20
                  transition active:scale-95 disabled:opacity-60
                "
              >
                <Plus size={19} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 5, 10, 20, 50].map((qtd) => (
                <button
                  key={qtd}
                  type="button"
                  disabled={processando}
                  onClick={() => setQuantidadeSomar(qtd)}
                  className={`
                    rounded-full px-3 py-1 text-xs font-black transition active:scale-95
                    disabled:opacity-60
                    ${
                      quantidadeSomar === qtd
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-gray-600 dark:bg-gray-950 dark:text-gray-300"
                    }
                  `}
                >
                  x{qtd}
                </button>
              ))}
            </div>
          </section>

          {lotesOrdenados.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-black">
                    <Clock3 size={18} className="text-emerald-600" />
                    Validades no estoque
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Toque na validade correta para somar +{quantidadeSomar}.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {lotesOrdenados.map((lote, index) => {
                  const destaque = index === 0;
                  const status = getStatusLote(lote.validade);

                  return (
                    <button
                      key={lote.id || `${lote.validade}-${index}`}
                      type="button"
                      disabled={processando}
                      onClick={() => onSomarLote(lote, quantidadeSomar)}
                      className={`
                        group flex w-full items-center gap-3 rounded-3xl border p-3 text-left
                        shadow-sm transition active:scale-[0.985] disabled:opacity-60
                        ${
                          destaque
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                            : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg
                          ${
                            status === "vencido"
                              ? "bg-red-600"
                              : status === "alerta"
                              ? "bg-yellow-500"
                              : destaque
                              ? "bg-emerald-700"
                              : "bg-slate-700 dark:bg-slate-600"
                          }
                        `}
                      >
                        <CalendarDays size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black">
                            {formatarData(lote.validade)}
                          </p>

                          {destaque && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              mais próxima
                            </span>
                          )}

                          {status === "vencido" && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              vencida
                            </span>
                          )}

                          {status === "alerta" && (
                            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              atenção
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {textoDias(lote.validade)} • quantidade atual: x
                          {lote.quantidade || 1}
                        </p>
                      </div>

                      <div className="flex h-12 min-w-16 items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3 font-black text-white shadow-lg shadow-emerald-600/20 transition group-active:scale-95">
                        {processando ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Plus size={18} />
                            {quantidadeSomar}
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <PackageCheck size={21} />
                </div>

                <div>
                  <p className="font-black">Produto aprendido na base</p>

                  <p className="mt-1 text-sm">
                    Ainda não há lote no estoque. Informe a primeira validade
                    para criar o card com x{quantidadeSomar}.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <PackageCheck size={20} />
              </div>

              <div>
                <p className="font-black text-blue-800 dark:text-blue-300">
                  Criar nova validade
                </p>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Use quando o mesmo produto chegou com outro vencimento.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 p-3 dark:bg-gray-950/40">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                Digite <strong>0427</strong> para 04/2027 ou{" "}
                <strong>15052027</strong> para 15/05/2027. A quantidade criada
                será x{quantidadeSomar}.
              </p>

              <input
                autoFocus
                value={validadeRapida}
                onChange={handleValidade}
                inputMode="numeric"
                maxLength={10}
                placeholder="mmaa ou ddmmaaaa"
                disabled={processando}
                className="
                  h-[52px] w-full rounded-2xl border border-blue-200 bg-white px-4
                  text-center text-lg font-black text-gray-950 outline-none transition
                  placeholder:text-gray-400
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20
                  disabled:opacity-60
                  dark:border-blue-500/20 dark:bg-gray-950 dark:text-white
                "
              />

              {processando && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm font-black text-blue-700 dark:text-blue-300">
                  <Loader2 size={17} className="animate-spin" />
                  Salvando lote...
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-gray-100 p-4 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p>
                Mesmo código com validade diferente vira outro card. Validade
                mês/ano usa o último dia do mês automaticamente.
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniLoteInfo({ label, valor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-2 text-center backdrop-blur-sm">
      <p className="truncate text-[10px] font-black uppercase tracking-wide text-emerald-100/75">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-white">{valor}</p>
    </div>
  );
}

export default ModalLoteScanner;