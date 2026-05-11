import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { db } from "../db";

import {
  AlertTriangle,
  Archive,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Filter,
  History,
  Loader2,
  Package,
  PackageSearch,
  Pill,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

function Mapeamentos() {
  const [mapeamentos, setMapeamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [selecionado, setSelecionado] = useState(null);
  const [excluir, setExcluir] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    carregarMapeamentos();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    setTimeout(() => setToast(null), 2800);
  }

  function formatarData(data) {
    if (!data) return "Sem data";

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) {
      return "Sem data";
    }

    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarDataCurta(data) {
    if (!data) return "Sem data";

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) {
      return "Sem data";
    }

    return d.toLocaleDateString("pt-BR");
  }

  async function carregarMapeamentos() {
    try {
      setCarregando(true);

      const lista = await db.mapeamentos
        .orderBy("dataCriacao")
        .reverse()
        .toArray();

      setMapeamentos(lista);
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar mapeamentos 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function excluirMapeamento() {
    if (!excluir?.id) return;

    try {
      await db.mapeamentos.delete(excluir.id);

      if (selecionado?.id === excluir.id) {
        setSelecionado(null);
      }

      setExcluir(null);
      mostrarToast("Mapeamento excluído com sucesso 🧹", "ok");
      await carregarMapeamentos();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao excluir mapeamento 😕", "erro");
    }
  }

  async function copiarResumo(mapeamento) {
    const texto = [
      `Mapeamento: ${mapeamento.nome || "Mapeamento"}`,
      `Data: ${formatarData(mapeamento.dataCriacao)}`,
      `Itens: ${mapeamento.totalItens || 0}`,
      `Unidades: ${mapeamento.totalUnidades || 0}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast("Resumo copiado 📋", "ok");
    } catch {
      mostrarToast("Não consegui copiar o resumo 😕", "erro");
    }
  }

  function exportarMapeamento(mapeamento) {
    try {
      const conteudo = JSON.stringify(mapeamento, null, 2);
      const blob = new Blob([conteudo], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const nomeSeguro = String(mapeamento.nome || "mapeamento")
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/(^-|-$)/g, "");

      link.href = url;
      link.download = `${nomeSeguro || "mapeamento"}.json`;
      link.click();

      URL.revokeObjectURL(url);
      mostrarToast("Mapeamento exportado 📦", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao exportar 😕", "erro");
    }
  }

  const resumo = useMemo(() => {
    const totalMapas = mapeamentos.length;

    const totalItens = mapeamentos.reduce((total, item) => {
      return total + Number(item.totalItens || 0);
    }, 0);

    const totalUnidades = mapeamentos.reduce((total, item) => {
      return total + Number(item.totalUnidades || 0);
    }, 0);

    const maior = mapeamentos.reduce((atual, item) => {
      const unidades = Number(item.totalUnidades || 0);
      return unidades > atual ? unidades : atual;
    }, 0);

    return {
      totalMapas,
      totalItens,
      totalUnidades,
      maior,
    };
  }, [mapeamentos]);

  const mapeamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return mapeamentos.filter((mapeamento) => {
      const itens = Array.isArray(mapeamento.itens)
        ? mapeamento.itens
        : [];

      const textoItens = itens
        .map((item) => `${item.nome || ""} ${item.codigo || ""}`)
        .join(" ");

      const texto = `
        ${mapeamento.nome || ""}
        ${formatarData(mapeamento.dataCriacao)}
        ${formatarDataCurta(mapeamento.dataCriacao)}
        ${textoItens}
      `.toLowerCase();

      const bateBusca = !termo || texto.includes(termo);

      const bateFiltro =
        filtro === "todos" ||
        (filtro === "comItens" && itens.length > 0) ||
        (filtro === "vazios" && itens.length === 0) ||
        (filtro === "grandes" && Number(mapeamento.totalUnidades || 0) >= 20);

      return bateBusca && bateFiltro;
    });
  }, [mapeamentos, busca, filtro]);

  return (
    <>
      {toast && (
        <Toast
          toast={toast}
          fechar={() => setToast(null)}
        />
      )}

      {selecionado && (
        <ModalDetalhes
          mapeamento={selecionado}
          fechar={() => setSelecionado(null)}
          pedirExclusao={() => setExcluir(selecionado)}
          copiarResumo={() => copiarResumo(selecionado)}
          exportar={() => exportarMapeamento(selecionado)}
          formatarData={formatarData}
        />
      )}

      {excluir && (
        <ModalExcluir
          mapeamento={excluir}
          cancelar={() => setExcluir(null)}
          confirmar={excluirMapeamento}
        />
      )}

      <div className="mx-auto max-w-6xl space-y-5 p-4 pb-32 text-black dark:text-white">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-950 p-6 text-white shadow-2xl shadow-purple-950/25">
          <div className="absolute -right-14 -top-14 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-purple-300/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_35%)]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
                <History size={34} />
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-purple-100">
                  <Sparkles size={15} />
                  Histórico premium
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  Mapeamentos
                </h1>

                <p className="mt-1 text-sm text-purple-100">
                  Histórico das contagens e auditorias salvas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={carregarMapeamentos}
              disabled={carregando}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-purple-800 shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              {carregando ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <RefreshCcw size={20} />
              )}
              Atualizar
            </button>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <ResumoTopo
              icon={History}
              valor={resumo.totalMapas}
              label="Mapas"
            />

            <ResumoTopo
              icon={Package}
              valor={resumo.totalItens}
              label="Itens"
            />

            <ResumoTopo
              icon={Boxes}
              valor={resumo.totalUnidades}
              label="Unid."
            />

            <ResumoTopo
              icon={Archive}
              valor={resumo.maior}
              label="Maior"
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, data, item ou código..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950"
              />
            </div>

            <div className="relative md:w-56">
              <Filter
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-bold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950"
              >
                <option value="todos">Todos</option>
                <option value="comItens">Com itens</option>
                <option value="vazios">Vazios</option>
                <option value="grandes">20+ unidades</option>
              </select>
            </div>
          </div>

          {(busca || filtro !== "todos") && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltro("todos");
              }}
              className="mt-3 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
            >
              Limpar busca e filtro
            </button>
          )}
        </section>

        {carregando ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-10 text-center shadow-xl dark:bg-gray-800">
            <Loader2 className="mb-3 animate-spin text-purple-600" size={38} />
            <p className="font-bold">
              Carregando mapeamentos...
            </p>
          </div>
        ) : mapeamentosFiltrados.length === 0 ? (
          <EstadoVazio
            busca={busca}
            filtro={filtro}
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {mapeamentosFiltrados.map((mapeamento) => (
              <CardMapeamento
                key={mapeamento.id}
                mapeamento={mapeamento}
                formatarData={formatarData}
                verDetalhes={() => setSelecionado(mapeamento)}
                pedirExclusao={() => setExcluir(mapeamento)}
                copiarResumo={() => copiarResumo(mapeamento)}
              />
            ))}
          </section>
        )}
      </div>
    </>
  );
}

function ResumoTopo({
  icon: Icon,
  valor,
  label,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-1 text-purple-100" size={20} />

      <p className="text-xl font-black">
        {valor}
      </p>

      <p className="text-xs text-purple-100">
        {label}
      </p>
    </div>
  );
}

function EstadoVazio({
  busca,
  filtro,
}) {
  const filtrando = busca || filtro !== "todos";

  return (
    <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl dark:bg-gray-800">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
        {filtrando ? (
          <PackageSearch size={32} />
        ) : (
          <History size={32} />
        )}
      </div>

      <h2 className="text-xl font-black">
        {filtrando
          ? "Nenhum resultado encontrado"
          : "Nenhum mapeamento ainda"}
      </h2>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {filtrando
          ? "Tente ajustar a busca ou limpar os filtros."
          : "Quando você salvar uma contagem, o histórico aparece aqui."}
      </p>
    </div>
  );
}

function CardMapeamento({
  mapeamento,
  formatarData,
  verDetalhes,
  pedirExclusao,
  copiarResumo,
}) {
  const itens = Array.isArray(mapeamento.itens)
    ? mapeamento.itens
    : [];

  const primeiroItem = itens[0];

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-5 shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 text-purple-700 shadow-lg shadow-purple-600/10 dark:bg-purple-500/15 dark:text-purple-300">
          {primeiroItem?.imagem ? (
            <img
              src={primeiroItem.imagem}
              alt={primeiroItem.nome || "Item"}
              className="h-full w-full object-cover"
            />
          ) : (
            <History size={28} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-black">
            {mapeamento.nome || "Mapeamento"}
          </h2>

          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <CalendarDays size={15} />
            {formatarData(mapeamento.dataCriacao)}
          </p>

          <p className="mt-2 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
            {itens.length > 0
              ? `${itens.length} produto(s) salvos no histórico`
              : "Sem itens salvos neste histórico"}
          </p>
        </div>

        <ChevronRight
          size={20}
          className="mt-2 shrink-0 text-gray-300 transition group-hover:translate-x-1"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniInfo
          icon={Package}
          label="Itens"
          valor={mapeamento.totalItens || itens.length || 0}
        />

        <MiniInfo
          icon={Boxes}
          label="Unidades"
          valor={mapeamento.totalUnidades || 0}
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-3">
        <button
          type="button"
          onClick={verDetalhes}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-purple-600 font-bold text-white transition active:scale-95"
        >
          <Eye size={18} />
          Ver detalhes
        </button>

        <button
          type="button"
          onClick={copiarResumo}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition active:scale-95 dark:text-blue-300"
          aria-label="Copiar resumo"
        >
          <Copy size={19} />
        </button>

        <button
          type="button"
          onClick={pedirExclusao}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 transition active:scale-95"
          aria-label="Excluir mapeamento"
        >
          <Trash2 size={19} />
        </button>
      </div>
    </article>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  valor,
}) {
  return (
    <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-800/80">
      <div className="mb-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Icon size={16} />

        <p className="text-xs font-bold">
          {label}
        </p>
      </div>

      <p className="text-2xl font-black">
        {valor}
      </p>
    </div>
  );
}

function ModalDetalhes({
  mapeamento,
  fechar,
  pedirExclusao,
  copiarResumo,
  exportar,
  formatarData,
}) {
  const itens = Array.isArray(mapeamento.itens)
    ? mapeamento.itens
    : [];

  const [buscaItem, setBuscaItem] = useState("");

  const itensFiltrados = useMemo(() => {
    const termo = String(buscaItem || "").toLowerCase().trim();

    if (!termo) return itens;

    return itens.filter((item) => {
      const texto = `${item.nome || ""} ${item.codigo || ""} ${item.validade || ""}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [itens, buscaItem]);

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-[2rem] border border-gray-200 bg-white text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white">
        <div className="border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black">
                {mapeamento.nome || "Mapeamento"}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatarData(mapeamento.dataCriacao)}
              </p>
            </div>

            <button
              type="button"
              onClick={fechar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-100 transition active:scale-95 dark:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniInfo
              icon={Package}
              label="Itens"
              valor={mapeamento.totalItens || itens.length || 0}
            />

            <MiniInfo
              icon={Boxes}
              label="Unidades"
              valor={mapeamento.totalUnidades || 0}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={copiarResumo}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition active:scale-95"
            >
              <Copy size={17} />
              Copiar
            </button>

            <button
              type="button"
              onClick={exportar}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 font-bold text-white transition active:scale-95"
            >
              <Download size={17} />
              JSON
            </button>

            <button
              type="button"
              onClick={pedirExclusao}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 font-bold text-white transition active:scale-95"
            >
              <Trash2 size={17} />
              Excluir
            </button>
          </div>

          <div className="relative mt-4">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={buscaItem}
              onChange={(e) => setBuscaItem(e.target.value)}
              placeholder="Buscar item dentro deste mapeamento..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-950"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {itensFiltrados.length === 0 ? (
            <div className="rounded-2xl bg-gray-100 p-5 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {itens.length === 0
                ? "Esse mapeamento não possui itens salvos."
                : "Nenhum item encontrado nessa busca."}
            </div>
          ) : (
            itensFiltrados.map((item, index) => (
              <ItemMapeado
                key={`${item.id || item.codigo || item.nome}-${index}`}
                item={item}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ItemMapeado({ item }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-100 p-3 dark:bg-gray-800">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-gray-700">
        {item.imagem ? (
          <img
            src={item.imagem}
            alt={item.nome || "Medicamento"}
            className="h-full w-full object-cover"
          />
        ) : (
          <Pill size={21} className="text-purple-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {item.nome || "Medicamento sem nome"}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Qtd: {item.quantidade || 1}
          {item.validade ? ` • Val: ${item.validade}` : ""}
        </p>

        {item.codigo && (
          <p className="truncate text-xs text-gray-400">
            Código: {item.codigo}
          </p>
        )}
      </div>
    </div>
  );
}

function ModalExcluir({
  mapeamento,
  cancelar,
  confirmar,
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <Trash2 size={28} />
        </div>

        <h2 className="text-center text-lg font-black">
          Excluir mapeamento?
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          “{mapeamento.nome || "Mapeamento"}” será removido do histórico.
          Essa ação não mexe no estoque atual.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-red-600 font-bold text-white transition active:scale-95"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({
  toast,
  fechar,
}) {
  const erro = toast.tipo === "erro";

  return (
    <div className="fixed left-1/2 top-5 z-[100000] w-[92%] max-w-sm -translate-x-1/2">
      <div
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white
            ${erro ? "bg-red-500" : "bg-emerald-600"}
          `}
        >
          {erro ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>

        <p className="flex-1 text-sm font-bold">
          {toast.msg}
        </p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

export default Mapeamentos;
