import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { db } from "../db";

import {
  Archive,
  Barcode,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Filter,
  ImageIcon,
  Loader2,
  Package,
  PackageSearch,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

const produtoVazio = {
  id: null,
  nome: "",
  codigo: "",
  imagem: "",
  diasRemover: "7",
  diasPreVencido: "",
};

function BaseProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [toast, setToast] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(produtoVazio);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({
      msg,
      tipo,
    });

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function carregar() {
    try {
      setCarregando(true);

      const dados = await db.produtosCodigo.toArray();

      const ordenados = dados.sort((a, b) => {
        const dataA = Number(a.criadoEm || a.id || 0);
        const dataB = Number(b.criadoEm || b.id || 0);

        return dataB - dataA;
      });

      setProdutos(ordenados);
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao carregar base de produtos 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  const resumo = useMemo(() => {
    return {
      total: produtos.length,
      comImagem: produtos.filter((p) => !!p.imagem).length,
      comPre: produtos.filter((p) => Number(p.diasPreVencido || p.diasPre || 0) > 0).length,
      semCodigo: produtos.filter((p) => !p.codigo).length,
    };
  }, [produtos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((p) => {
      const texto = `${p.nome || ""} ${p.codigo || ""}`.toLowerCase();

      const bateBusca = !termo || texto.includes(termo);

      const bateFiltro =
        filtro === "todos" ||
        (filtro === "comImagem" && !!p.imagem) ||
        (filtro === "semImagem" && !p.imagem) ||
        (filtro === "comPre" && Number(p.diasPreVencido || p.diasPre || 0) > 0) ||
        (filtro === "semCodigo" && !p.codigo);

      return bateBusca && bateFiltro;
    });
  }, [produtos, busca, filtro]);

  function abrirEditar(produto) {
    setForm({
      id: produto.id,
      nome: produto.nome || "",
      codigo: produto.codigo || "",
      imagem: produto.imagem || "",
      diasRemover: String(produto.diasRemover || "7"),
      diasPreVencido: String(produto.diasPreVencido || produto.diasPre || ""),
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setForm(produtoVazio);
  }

  async function salvarEdicao() {
    if (!form.id) {
      mostrarToast("Produto inválido 😅", "erro");
      return;
    }

    if (!form.nome.trim()) {
      mostrarToast("Digite o nome do produto", "erro");
      return;
    }

    const diasRemover = Number(form.diasRemover || 7);
    const diasPreVencido = Number(form.diasPreVencido || 0);

    if (diasRemover < 0 || diasPreVencido < 0) {
      mostrarToast("Os dias não podem ser negativos", "erro");
      return;
    }

    try {
      await db.produtosCodigo.update(form.id, {
        nome: form.nome.trim(),
        codigo: form.codigo.trim(),
        imagem: form.imagem || "",
        diasRemover,
        diasPreVencido,
        atualizadoEm: Date.now(),
      });

      mostrarToast("Produto atualizado ✨", "ok");
      fecharModal();
      carregar();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao salvar produto 😕", "erro");
    }
  }

  async function removerProduto(id) {
    try {
      await db.produtosCodigo.delete(id);

      setConfirmarExclusao(null);
      mostrarToast("Produto removido da base 🗑️", "ok");
      carregar();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao remover produto 😕", "erro");
    }
  }

  function limparBusca() {
    setBusca("");
    setFiltro("todos");
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-5 p-4 pb-32 text-gray-950 dark:text-white">
      {toast && (
        <Toast
          toast={toast}
          fechar={() => setToast(null)}
        />
      )}

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/25">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-emerald-300/10" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              <Archive size={34} />
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-100">
                <Sparkles size={15} />
                Scanner inteligente
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Base de Produtos
              </h1>

              <p className="mt-1 text-sm text-emerald-100">
                Produtos aprendidos pelo scanner para preencher automaticamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-emerald-800 shadow-lg transition active:scale-95 disabled:opacity-60"
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
          <ResumoCard
            icon={Package}
            valor={resumo.total}
            label="Produtos"
          />

          <ResumoCard
            icon={ImageIcon}
            valor={resumo.comImagem}
            label="Com imagem"
          />

          <ResumoCard
            icon={CalendarClock}
            valor={resumo.comPre}
            label="Com pré"
          />

          <ResumoCard
            icon={Barcode}
            valor={resumo.semCodigo}
            label="Sem código"
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
              placeholder="Buscar por nome ou código..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950"
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
              className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="todos">Todos</option>
              <option value="comImagem">Com imagem</option>
              <option value="semImagem">Sem imagem</option>
              <option value="comPre">Com pré-vencimento</option>
              <option value="semCodigo">Sem código</option>
            </select>
          </div>
        </div>

        {(busca || filtro !== "todos") && (
          <button
            type="button"
            onClick={limparBusca}
            className="mt-3 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
          >
            Limpar busca e filtro
          </button>
        )}
      </section>

      {carregando ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <Loader2 className="mx-auto mb-3 animate-spin text-emerald-600" size={42} />
          <h2 className="font-black">
            Carregando base...
          </h2>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <PackageSearch className="mx-auto mb-3 text-gray-400" size={48} />

          <h2 className="font-black">
            Nenhum produto encontrado
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Escaneie e salve um produto, ou ajuste a busca/filtro.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {filtrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onEditar={() => abrirEditar(produto)}
              onRemover={() => setConfirmarExclusao(produto)}
            />
          ))}
        </section>
      )}

      {modalAberto && (
        <ModalEditar
          form={form}
          setForm={setForm}
          onClose={fecharModal}
          onSave={salvarEdicao}
        />
      )}

      {confirmarExclusao && (
        <ModalConfirmar
          produto={confirmarExclusao}
          onCancel={() => setConfirmarExclusao(null)}
          onConfirm={() => removerProduto(confirmarExclusao.id)}
        />
      )}
    </div>
  );
}

function ResumoCard({
  icon: Icon,
  valor,
  label,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-4 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-2 text-emerald-100" size={22} />

      <p className="text-2xl font-black">
        {valor}
      </p>

      <p className="text-xs font-bold text-emerald-100">
        {label}
      </p>
    </div>
  );
}

function ProdutoCard({
  produto,
  onEditar,
  onRemover,
}) {
  const diasRemover = produto.diasRemover || 7;
  const diasPre = produto.diasPreVencido || produto.diasPre || "";

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-4 shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-950">
          {produto.imagem ? (
            <img
              src={produto.imagem}
              alt={produto.nome || "Produto"}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={32} className="text-gray-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-black">
            {produto.nome || "Produto sem nome"}
          </h2>

          <p className="mt-1 flex items-center gap-1 truncate text-xs font-bold text-gray-500 dark:text-gray-400">
            <Barcode size={14} />
            {produto.codigo || "Sem código"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>
              Remover {diasRemover} dia(s) antes
            </Badge>

            <Badge>
              {diasPre ? `Pré ${diasPre} dia(s)` : "Sem pré"}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onEditar}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white transition active:scale-95"
            aria-label="Editar produto"
          >
            <Edit3 size={18} />
          </button>

          <button
            type="button"
            onClick={onRemover}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500 text-white transition active:scale-95"
            aria-label="Remover produto"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
      {children}
    </span>
  );
}

function ModalEditar({
  form,
  setForm,
  onClose,
  onSave,
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-lg rounded-[2rem] border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Edit3 size={22} />
              Editar produto
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajuste os dados aprendidos pelo scanner.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 transition active:scale-95 dark:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <CampoModal
            label="Nome"
            value={form.nome}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                nome: v,
              }))
            }
            placeholder="Nome do produto"
          />

          <CampoModal
            label="Código de barras"
            value={form.codigo}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                codigo: v,
              }))
            }
            placeholder="Código"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <CampoModal
              label="Dias para remover"
              type="number"
              value={form.diasRemover}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  diasRemover: v,
                }))
              }
              placeholder="7"
            />

            <CampoModal
              label="Dias de pré-vencimento"
              type="number"
              value={form.diasPreVencido}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  diasPreVencido: v,
                }))
              }
              placeholder="Opcional"
            />
          </div>

          <CampoModal
            label="Imagem"
            value={form.imagem}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                imagem: v,
              }))
            }
            placeholder="URL/base64 da imagem"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 font-black text-white shadow-lg shadow-emerald-700/20 transition active:scale-95"
          >
            <Save size={18} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function CampoModal({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950"
      />
    </label>
  );
}

function ModalConfirmar({
  produto,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-5 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500 text-white">
          <TriangleAlert size={32} />
        </div>

        <h2 className="text-xl font-black">
          Remover produto?
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Isso vai apagar o produto{" "}
          <span className="font-black">
            {produto.nome || "sem nome"}
          </span>{" "}
          da base aprendida pelo scanner.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-gray-100 py-3 font-black text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-red-600 py-3 font-black text-white transition active:scale-95"
          >
            Remover
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
    <div className="fixed left-1/2 top-5 z-[10000] w-[92%] max-w-sm -translate-x-1/2">
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
          {erro ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
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

export default BaseProdutos;