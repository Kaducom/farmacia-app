import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  CalendarDays,
  Camera,
  CheckCircle2,
  ImageUp,
  Package,
  Pill,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Tags,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import FundoBolhas from "../../components/FundoBolhas";
import {
  CONFIG_PRODUTOS_PADRAO,
  QUALIDADES_FOTO,
  SETORES_PRODUTOS,
  carregarConfigProdutos,
  resetarConfigProdutosLocal,
  salvarConfigProdutosLocal,
} from "./configProdutos";
import { BackHeader, PageShell, SectionTitle, Toast } from "./components/MenuShared";

function MenuProdutosConfig({ setPagina }) {
  const { usuarioAtual, isVisitante } = useAuth();
  const toastTimerRef = useRef(null);
  const chaveUsuario = usuarioAtual?.uid || (isVisitante ? "visitante" : "anonimo");

  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState(() => carregarConfigProdutos(chaveUsuario));

  const qualidadeAtual = QUALIDADES_FOTO.find((q) => q.id === config.qualidadeFotoLocal) || QUALIDADES_FOTO[2];

  const retirada = Number(config.retiradaPadraoDias || 0) || 30;
  const pre = Number(config.preVencimentoPadraoDias || 0);
  const resumo = `${config.setorPrincipal} • retirar ${retirada} dias antes${pre ? ` • pré ${pre} dias` : ""}`;

  useEffect(() => {
    setConfig(carregarConfigProdutos(chaveUsuario));
  }, [chaveUsuario]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("avisai-config-produtos-change", {
        detail: config,
      })
    );
  }, [config]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
    if (navigator.vibrate) navigator.vibrate(30);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  function alterarConfig(campo, valor) {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  }

  function salvar() {
    try {
      salvarConfigProdutosLocal(chaveUsuario, config);
      mostrarToast("Preferências de produtos salvas ⚙️", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Não consegui salvar as preferências 😕", "erro");
    }
  }

  function resetar() {
    try {
      resetarConfigProdutosLocal(chaveUsuario);
      setConfig(CONFIG_PRODUTOS_PADRAO);
      mostrarToast("Configurações voltaram ao padrão ✨", "ok");
    } catch {
      setConfig(CONFIG_PRODUTOS_PADRAO);
      mostrarToast("Configurações voltaram ao padrão ✨", "ok");
    }
  }

  return (
    <PageShell>
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <BackHeader
        icon={SlidersHorizontal}
        title="Configurações de Produtos"
        description="Setor, datas, pré-vencimento, etiqueta e fotos"
        setPagina={setPagina}
      />

      <main className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 pb-32">
        <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle
              icon={SlidersHorizontal}
              title="Preferências de cadastro"
              description="Deixe o modal e scanner com a cara da sua seção."
              noMargin
            />

            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {resumo}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
                    <Tags size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-black">Setor principal</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      O app prioriza esse setor no cadastro e scanner.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SETORES_PRODUTOS.map((setor) => {
                    const ativo = config.setorPrincipal === setor;

                    return (
                      <button
                        key={setor}
                        type="button"
                        onClick={() => alterarConfig("setorPrincipal", setor)}
                        className={`rounded-2xl border px-3 py-3 text-left text-xs font-black transition active:scale-95 ${
                          ativo
                            ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {setor}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <ConfigMiniCard
                  icon={Pill}
                  titulo="Modo balcão"
                  texto="Medicamentos ficam como atalho principal quando esse for o setor principal."
                  ativo={config.usarSetorPrincipalAoCadastrar}
                />

                <ConfigMiniCard
                  icon={ImageUp}
                  titulo="Fotos locais"
                  texto={`${qualidadeAtual.label}: ${qualidadeAtual.detalhe}.`}
                  ativo
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white/10">
                    <CalendarDays size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-black">Datas inteligentes</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pré-vencimento, retirada e etiqueta pronta em um lugar só.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <NumberField
                    label="Retirar antes"
                    value={config.retiradaPadraoDias}
                    onChange={(valor) => alterarConfig("retiradaPadraoDias", valor)}
                    sufixo="dias"
                  />

                  <NumberField
                    label="Pré padrão"
                    value={config.preVencimentoPadraoDias}
                    onChange={(valor) => alterarConfig("preVencimentoPadraoDias", valor)}
                    placeholder="Opcional"
                    sufixo="dias"
                  />
                </div>

                <div className="mt-3 grid gap-2">
                  <TogglePreferencia
                    icon={Package}
                    titulo="Usar setor principal ao cadastrar"
                    texto="Ao abrir o modal, ele já entra no setor escolhido."
                    ativo={config.usarSetorPrincipalAoCadastrar}
                    onToggle={() => alterarConfig("usarSetorPrincipalAoCadastrar", !config.usarSetorPrincipalAoCadastrar)}
                  />

                  <TogglePreferencia
                    icon={Tags}
                    titulo="Mostrar só botões úteis"
                    texto="Reduz botões de setores que não fazem parte da sua rotina."
                    ativo={config.focarSetorPrincipalNosBotoes}
                    onToggle={() => alterarConfig("focarSetorPrincipalNosBotoes", !config.focarSetorPrincipalNosBotoes)}
                  />

                  <TogglePreferencia
                    icon={CalendarDays}
                    titulo="Datas automáticas por setor"
                    texto="Medicamentos, alimentos e outros podem ter regras diferentes."
                    ativo={config.datasAutomaticasPorSetor}
                    onToggle={() => alterarConfig("datasAutomaticasPorSetor", !config.datasAutomaticasPorSetor)}
                  />

                  <TogglePreferencia
                    icon={CheckCircle2}
                    titulo="Produto já em pré-vencimento"
                    texto="Libera atalho para cadastrar etiqueta que já chega separada."
                    ativo={config.produtoJaPreVencimento}
                    onToggle={() => alterarConfig("produtoJaPreVencimento", !config.produtoJaPreVencimento)}
                  />

                  <TogglePreferencia
                    icon={CalendarClock}
                    titulo="Tenho só a data de retirada"
                    texto="Quando a etiqueta informa a retirada sem precisar calcular."
                    ativo={config.permitirDataRetiradaDireta}
                    onToggle={() => alterarConfig("permitirDataRetiradaDireta", !config.permitirDataRetiradaDireta)}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
                    <Camera size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-black">Qualidade das fotos</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Foto neste aparelho bonita, nuvem compactada.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {QUALIDADES_FOTO.map((qualidade) => {
                    const ativo = config.qualidadeFotoLocal === qualidade.id;

                    return (
                      <button
                        key={qualidade.id}
                        type="button"
                        onClick={() => alterarConfig("qualidadeFotoLocal", qualidade.id)}
                        className={`rounded-2xl border px-2 py-3 text-xs font-black transition active:scale-95 ${
                          ativo
                            ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                        }`}
                      >
                        {qualidade.label}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Essa página mantém o evento avisai-config-produtos-change para o ModalMedicamento e o ModalScannerProduto.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resetar}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-black text-gray-700 transition active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <RotateCcw size={17} />
                  Resetar
                </button>

                <button
                  type="button"
                  onClick={salvar}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-95"
                >
                  <Save size={17} />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function ConfigMiniCard({ icon: Icon, titulo, texto, ativo }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${ativo ? "bg-emerald-700" : "bg-slate-500"}`}>
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <p className="font-black">{titulo}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{texto}</p>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder = "0", sufixo }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder={placeholder}
          className={`h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white ${sufixo ? "pr-14" : ""}`}
        />

        {sufixo && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-gray-400">
            {sufixo}
          </span>
        )}
      </div>
    </label>
  );
}

function TogglePreferencia({ icon: Icon, titulo, texto, ativo, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition active:scale-[0.99] dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${ativo ? "bg-emerald-700" : "bg-slate-500"}`}>
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black">{titulo}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {texto}
          </p>
        </div>
      </div>

      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-all ${ativo ? "justify-end bg-emerald-500" : "justify-start bg-gray-400"}`}>
        <span className="h-5 w-5 rounded-full bg-white shadow-md" />
      </span>
    </button>
  );
}

export default MenuProdutosConfig;
