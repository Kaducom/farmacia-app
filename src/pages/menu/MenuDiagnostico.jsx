import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Boxes,
  CalendarClock,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  LayoutDashboard,
  Loader2,
  Package,
  RefreshCcw,
  Skull,
  Tags,
  TimerReset,
} from "lucide-react";

import FundoBolhas from "../../components/FundoBolhas";
import { db } from "../../db";
import { BackHeader, MetricPremium, PageShell, SectionTitle, Toast } from "./components/MenuShared";

const diagnosticoInicial = {
  totalProdutos: 0,
  totalUnidades: 0,
  vencidos: 0,
  emPre: 0,
  retirarAgora: 0,
  retirarHoje: 0,
  etiqueta: 0,
  pendentes: 0,
  locais: 0,
  nuvem: 0,
  produtosAprendidos: 0,
  mapeamentos: 0,
  ultimaSync: null,
};

function MenuDiagnostico({ setPagina }) {
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(diagnosticoInicial);

  useEffect(() => {
    carregarDiagnostico();
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

  async function carregarDiagnostico() {
    try {
      setCarregando(true);

      const [produtosBrutos, produtosAprendidos, mapeamentos] = await Promise.all([
        db.medicamentos.toArray(),
        db.produtosCodigo.count(),
        db.mapeamentos.count(),
      ]);

      const produtos = produtosBrutos.filter((p) => !p.deletado && !p.excluido);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const resultado = {
        ...diagnosticoInicial,
        totalProdutos: produtos.length,
        produtosAprendidos,
        mapeamentos,
      };

      produtos.forEach((produto) => {
        resultado.totalUnidades += Number(produto.quantidade || 1);

        if (produto.pendenteSync) resultado.pendentes += 1;
        if (produto.modoDataRetirada && produto.dataRetiradaInformada) resultado.etiqueta += 1;
        if (produto.sincronizadoEm || produto.cloudId) resultado.nuvem += 1;
        else resultado.locais += 1;

        const sync = Number(produto.sincronizadoEm || 0);
        if (sync && (!resultado.ultimaSync || sync > resultado.ultimaSync)) {
          resultado.ultimaSync = sync;
        }

        const status = calcularStatus(produto);
        const { remover } = calcularDatas(produto);
        const diasRetirada = calcularDiasAte(remover);

        if (status === "vencido") resultado.vencidos += 1;
        if (status === "pre") resultado.emPre += 1;
        if (status === "remover") resultado.retirarAgora += 1;
        if (diasRetirada === 0) resultado.retirarHoje += 1;
      });

      setDados(resultado);
      mostrarToast("Diagnóstico atualizado 🛰️", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar diagnóstico 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <PageShell>
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <BackHeader
        icon={LayoutDashboard}
        title="Diagnóstico AVISAI"
        description="Tudo que era pesado saiu da home e veio para cá"
        setPagina={setPagina}
        right={
          <button
            type="button"
            onClick={carregarDiagnostico}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition active:scale-95"
            aria-label="Atualizar diagnóstico"
          >
            {carregando ? <Loader2 size={21} className="animate-spin" /> : <RefreshCcw size={21} />}
          </button>
        }
      />

      <main className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 pb-32">
        <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
          <SectionTitle



            icon={Database}
            title="Raio-X do estoque"
            description="Leitura local deste aparelho, com status de validade e sincronização."
          />       

          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <MetricPremium icon={Package} titulo="Produtos" valor={dados.totalProdutos} descricao="lotes ativos" />
            <MetricPremium icon={Boxes} titulo="Unidades" valor={dados.totalUnidades} descricao="soma total" />
            <MetricPremium icon={Skull} titulo="Vencidos" valor={dados.vencidos} descricao="atenção" alerta={dados.vencidos > 0} />
            <MetricPremium icon={TimerReset} titulo="Retirar" valor={dados.retirarAgora} descricao="já saiu da prateleira" alerta={dados.retirarAgora > 0} />
            <MetricPremium icon={CalendarClock} titulo="Retirar hoje" valor={dados.retirarHoje} descricao="data bateu hoje" aviso={dados.retirarHoje > 0} />
            <MetricPremium icon={Tags} titulo="Em pré" valor={dados.emPre} descricao="pré-vencimento" aviso={dados.emPre > 0} />
            <MetricPremium icon={Tags} titulo="Etiqueta" valor={dados.etiqueta} descricao="retirada informada" />
            <MetricPremium icon={RefreshCcw} titulo="Pendentes" valor={dados.pendentes} descricao="sync aguardando" aviso={dados.pendentes > 0} />
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
          <SectionTitle
            icon={Cloud}
            title="Sincronização e base"
            description="Separação entre local, nuvem, produtos aprendidos e mapas."
          />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
            <MetricPremium icon={CloudOff} titulo="Locais" valor={dados.locais} descricao="sem nuvem ainda" aviso={dados.locais > 0} />
            <MetricPremium icon={Cloud} titulo="Nuvem" valor={dados.nuvem} descricao="com cloudId/sync" />
            <MetricPremium icon={CheckCircle2} titulo="Base" valor={dados.produtosAprendidos} descricao="scanner" />
            <MetricPremium icon={Database} titulo="Mapas" valor={dados.mapeamentos} descricao="históricos" />
            <MetricPremium
              icon={RefreshCcw}
              titulo="Última sync"
              valor={dados.ultimaSync ? "OK" : "--"}
              descricao={dados.ultimaSync ? new Date(dados.ultimaSync).toLocaleString("pt-BR") : "não encontrada"}
            />
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function parseDataSegura(data) {
  if (!data) return null;
  if (data instanceof Date && !Number.isNaN(data.getTime())) return data;

  const texto = String(data).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  const convertida = new Date(texto);
  return Number.isNaN(convertida.getTime()) ? null : convertida;
}

function calcularDatas(produto) {
  const validadeDate = parseDataSegura(produto.validade);
  if (!validadeDate || Number.isNaN(validadeDate.getTime())) {
    return { validade: null, remover: null, pre: null };
  }

  const retiradaInformada = parseDataSegura(produto.dataRetiradaInformada);
  const removerDate = produto.modoDataRetirada && retiradaInformada ? retiradaInformada : new Date(validadeDate);

  if (!produto.modoDataRetirada || !retiradaInformada) {
    removerDate.setDate(removerDate.getDate() - Number(produto.diasRemover || 0));
  }

  let preDate = null;

  if (produto.diasPreVencido) {
    preDate = new Date(removerDate);
    preDate.setDate(preDate.getDate() - Number(produto.diasPreVencido));
  }

  return { validade: validadeDate, remover: removerDate, pre: preDate };
}

function calcularStatus(produto) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const { validade, remover, pre } = calcularDatas(produto);
  if (!validade) return "ok";

  const validadeLimpa = new Date(validade);
  validadeLimpa.setHours(0, 0, 0, 0);

  const removerLimpa = remover ? new Date(remover) : null;
  if (removerLimpa) removerLimpa.setHours(0, 0, 0, 0);

  const preLimpa = pre ? new Date(pre) : null;
  if (preLimpa) preLimpa.setHours(0, 0, 0, 0);

  if (hoje >= validadeLimpa) return "vencido";
  if (removerLimpa && hoje >= removerLimpa) return "remover";
  if (Boolean(produto.produtoJaPre)) return "pre";
  if (preLimpa && hoje >= preLimpa) return "pre";
  return "ok";
}

function calcularDiasAte(data) {
  const dataFinal = parseDataSegura(data);
  if (!dataFinal || Number.isNaN(dataFinal.getTime())) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const alvo = new Date(dataFinal);
  alvo.setHours(0, 0, 0, 0);

  return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
}

export default MenuDiagnostico;
