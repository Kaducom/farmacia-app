import { useEffect, useState } from "react";
import { db } from "../db";

import {
  History,
  Package,
  Boxes,
  CalendarDays,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Pill,
} from "lucide-react";

function Mapeamentos() {
  const [mapeamentos, setMapeamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState(null);
  const [excluir, setExcluir] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    carregarMapeamentos();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => setToast(null), 2800);
  }

  function formatarData(data) {
    if (!data) return "Sem data";

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) return "Sem data";

    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

      setExcluir(null);
      setSelecionado(null);

      mostrarToast("Mapeamento excluído com sucesso 🧹", "ok");
      await carregarMapeamentos();
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao excluir mapeamento 😕", "erro");
    }
  }

  return (
    <>
      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      {selecionado && (
        <ModalDetalhes
          mapeamento={selecionado}
          fechar={() => setSelecionado(null)}
          pedirExclusao={() => setExcluir(selecionado)}
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

      <div className="mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-950 p-6 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-purple-300/10" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              <History size={32} />
            </div>

            <div>
              <h1 className="text-2xl font-black">Mapeamentos</h1>
              <p className="text-sm text-purple-100">
                Histórico das contagens salvas
              </p>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <ResumoTopo
              icon={History}
              valor={mapeamentos.length}
              label="Mapas"
            />

            <ResumoTopo
              icon={Package}
              valor={mapeamentos.reduce(
                (total, item) => total + Number(item.totalItens || 0),
                0
              )}
              label="Itens"
            />

            <ResumoTopo
              icon={Boxes}
              valor={mapeamentos.reduce(
                (total, item) => total + Number(item.totalUnidades || 0),
                0
              )}
              label="Unid."
            />
          </div>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-xl dark:bg-gray-800">
            <Loader2 className="mb-3 animate-spin text-purple-600" size={34} />
            <p className="font-bold">Carregando mapeamentos...</p>
          </div>
        ) : mapeamentos.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-gray-800">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
              <History size={32} />
            </div>

            <h2 className="text-xl font-black">Nenhum mapeamento ainda</h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Vá no Menu e toque em “Novo Mapeamento” para salvar o estoque
              atual e começar uma nova contagem.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mapeamentos.map((mapeamento) => (
              <CardMapeamento
                key={mapeamento.id}
                mapeamento={mapeamento}
                formatarData={formatarData}
                verDetalhes={() => setSelecionado(mapeamento)}
                pedirExclusao={() => setExcluir(mapeamento)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ResumoTopo({ icon: Icon, valor, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-1 text-purple-100" size={20} />
      <p className="text-xl font-black">{valor}</p>
      <p className="text-xs text-purple-100">{label}</p>
    </div>
  );
}

function CardMapeamento({
  mapeamento,
  formatarData,
  verDetalhes,
  pedirExclusao,
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
          <History size={26} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-black">
            {mapeamento.nome || "Mapeamento"}
          </h2>

          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <CalendarDays size={15} />
            {formatarData(mapeamento.dataCriacao)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniInfo
          icon={Package}
          label="Itens"
          valor={mapeamento.totalItens || 0}
        />

        <MiniInfo
          icon={Boxes}
          label="Unidades"
          valor={mapeamento.totalUnidades || 0}
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={verDetalhes}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 font-bold text-white transition active:scale-95"
        >
          <Eye size={18} />
          Ver
        </button>

        <button
          type="button"
          onClick={pedirExclusao}
          className="flex h-12 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 transition active:scale-95"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

function MiniInfo({ icon: Icon, label, valor }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700/60">
      <div className="mb-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Icon size={16} />
        <p className="text-xs font-bold">{label}</p>
      </div>

      <p className="text-2xl font-black">{valor}</p>
    </div>
  );
}

function ModalDetalhes({ mapeamento, fechar, pedirExclusao, formatarData }) {
  const itens = Array.isArray(mapeamento.itens) ? mapeamento.itens : [];

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl border border-gray-200 bg-white text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-black">
              {mapeamento.nome || "Mapeamento"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatarData(mapeamento.dataCriacao)}
            </p>
          </div>

          <button
            type="button"
            onClick={fechar}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 transition active:scale-95 dark:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <MiniInfo
            icon={Package}
            label="Itens"
            valor={mapeamento.totalItens || 0}
          />

          <MiniInfo
            icon={Boxes}
            label="Unidades"
            valor={mapeamento.totalUnidades || 0}
          />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-5">
          {itens.length === 0 ? (
            <div className="rounded-2xl bg-gray-100 p-5 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Esse mapeamento não possui itens salvos.
            </div>
          ) : (
            itens.map((item, index) => (
              <div
                key={`${item.id || item.codigo || item.nome}-${index}`}
                className="flex items-center gap-3 rounded-2xl bg-gray-100 p-3 dark:bg-gray-800"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-gray-700">
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
            ))
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-5 dark:border-gray-800">
          <button
            type="button"
            onClick={fechar}
            className="h-12 flex-1 rounded-2xl bg-gray-100 font-bold text-gray-700 transition active:scale-95 dark:bg-gray-800 dark:text-gray-200"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={pedirExclusao}
            className="flex h-12 w-14 items-center justify-center rounded-2xl bg-red-500 text-white transition active:scale-95"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalExcluir({ mapeamento, cancelar, confirmar }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <Trash2 size={28} />
        </div>

        <h2 className="text-center text-lg font-black">
          Excluir mapeamento?
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          “{mapeamento.nome || "Mapeamento"}” será removido do histórico. Essa
          ação não mexe no estoque atual.
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

function Toast({ toast, fechar }) {
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

        <p className="flex-1 text-sm font-bold">{toast.msg}</p>

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