import { useEffect, useRef, useState } from "react";
import { db } from "../db";
import { AnimatePresence, motion } from "framer-motion";

import {
  Archive,
  Boxes,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  History,
  Loader2,
  Package,
  Pill,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

const resumoInicial = {
  medicamentos: 0,
  unidades: 0,
  receitas: 0,
  produtosCodigo: 0,
  mapeamentos: 0,
};

function Backup() {
  const inputRef = useRef(null);

  const [resumo, setResumo] = useState(resumoInicial);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [toast, setToast] = useState(null);

  const [backupSelecionado, setBackupSelecionado] = useState(null);
  const [confirmarImportacao, setConfirmarImportacao] = useState(false);
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);

  useEffect(() => {
    carregarResumo();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  function formatarDataArquivo(data = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");

    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(
      data.getDate()
    )}_${pad(data.getHours())}-${pad(data.getMinutes())}`;
  }

  function formatarDataBR(data) {
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

  async function carregarResumo() {
    try {
      setCarregando(true);

      const [medicamentos, receitas, produtosCodigo, mapeamentos] =
        await Promise.all([
          db.medicamentos.toArray(),
          db.receitas.count(),
          db.produtosCodigo.count(),
          db.mapeamentos.count(),
        ]);

      const unidades = medicamentos.reduce((total, item) => {
        return total + Number(item.quantidade || 1);
      }, 0);

      setResumo({
        medicamentos: medicamentos.length,
        unidades,
        receitas,
        produtosCodigo,
        mapeamentos,
      });
    } catch (err) {
      console.error("Erro ao carregar resumo:", err);
      mostrarToast("Erro ao carregar resumo do banco 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function exportarBackup() {
    try {
      setProcessando(true);

      const [medicamentos, receitas, produtosCodigo, mapeamentos] =
        await Promise.all([
          db.medicamentos.toArray(),
          db.receitas.toArray(),
          db.produtosCodigo.toArray(),
          db.mapeamentos.toArray(),
        ]);

      const agora = new Date();

      const backup = {
        app: "Farmacia App",
        tipo: "backup-completo",
        versaoBackup: 1,
        criadoEm: agora.toISOString(),
        resumo: {
          medicamentos: medicamentos.length,
          unidades: medicamentos.reduce((total, item) => {
            return total + Number(item.quantidade || 1);
          }, 0),
          receitas: receitas.length,
          produtosCodigo: produtosCodigo.length,
          mapeamentos: mapeamentos.length,
        },
        tabelas: {
          medicamentos,
          receitas,
          produtosCodigo,
          mapeamentos,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `farmacia-backup-${formatarDataArquivo(agora)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      mostrarToast("Backup exportado com sucesso 🛡️", "ok");
    } catch (err) {
      console.error("Erro ao exportar backup:", err);
      mostrarToast("Erro ao exportar backup 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  async function selecionarArquivo(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    try {
      const texto = await arquivo.text();
      const dados = JSON.parse(texto);

      validarBackup(dados);

      setBackupSelecionado({
        nomeArquivo: arquivo.name,
        dados,
      });

      setConfirmarImportacao(true);
    } catch (err) {
      console.error("Arquivo de backup inválido:", err);
      mostrarToast("Arquivo de backup inválido ⚠️", "erro");
    } finally {
      e.target.value = "";
    }
  }

  function validarBackup(dados) {
    if (!dados || typeof dados !== "object") {
      throw new Error("Backup vazio ou inválido");
    }

    if (!dados.tabelas || typeof dados.tabelas !== "object") {
      throw new Error("Backup sem tabelas");
    }

    const tabelas = dados.tabelas;

    const campos = [
      "medicamentos",
      "receitas",
      "produtosCodigo",
      "mapeamentos",
    ];

    campos.forEach((campo) => {
      if (tabelas[campo] && !Array.isArray(tabelas[campo])) {
        throw new Error(`Tabela ${campo} inválida`);
      }
    });
  }

  async function importarBackup() {
    if (!backupSelecionado?.dados) return;

    try {
      setProcessando(true);

      const tabelas = backupSelecionado.dados.tabelas || {};

      const medicamentos = Array.isArray(tabelas.medicamentos)
        ? tabelas.medicamentos
        : [];

      const receitas = Array.isArray(tabelas.receitas) ? tabelas.receitas : [];

      const produtosCodigo = Array.isArray(tabelas.produtosCodigo)
        ? tabelas.produtosCodigo
        : [];

      const mapeamentos = Array.isArray(tabelas.mapeamentos)
        ? tabelas.mapeamentos
        : [];

      await db.transaction(
        "rw",
        db.medicamentos,
        db.receitas,
        db.produtosCodigo,
        db.mapeamentos,
        async () => {
          await Promise.all([
            db.medicamentos.clear(),
            db.receitas.clear(),
            db.produtosCodigo.clear(),
            db.mapeamentos.clear(),
          ]);

          if (medicamentos.length > 0) {
            await db.medicamentos.bulkAdd(medicamentos);
          }

          if (receitas.length > 0) {
            await db.receitas.bulkAdd(receitas);
          }

          if (produtosCodigo.length > 0) {
            await db.produtosCodigo.bulkAdd(produtosCodigo);
          }

          if (mapeamentos.length > 0) {
            await db.mapeamentos.bulkAdd(mapeamentos);
          }
        }
      );

      setConfirmarImportacao(false);
      setBackupSelecionado(null);

      mostrarToast("Backup importado com sucesso ✨", "ok");
      await carregarResumo();
    } catch (err) {
      console.error("Erro ao importar backup:", err);
      mostrarToast("Erro ao importar backup 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  async function limparTudo() {
    try {
      setProcessando(true);

      await db.transaction(
        "rw",
        db.medicamentos,
        db.receitas,
        db.produtosCodigo,
        db.mapeamentos,
        async () => {
          await Promise.all([
            db.medicamentos.clear(),
            db.receitas.clear(),
            db.produtosCodigo.clear(),
            db.mapeamentos.clear(),
          ]);
        }
      );

      setConfirmarLimpeza(false);
      mostrarToast("Banco limpo com sucesso 🧹", "ok");
      await carregarResumo();
    } catch (err) {
      console.error("Erro ao limpar banco:", err);
      mostrarToast("Erro ao limpar banco 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  const totalRegistros =
    resumo.medicamentos +
    resumo.receitas +
    resumo.produtosCodigo +
    resumo.mapeamentos;

  return (
    <>
      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <AnimatePresence>
        {confirmarImportacao && backupSelecionado && (
          <ModalImportar
            backupSelecionado={backupSelecionado}
            processando={processando}
            formatarDataBR={formatarDataBR}
            cancelar={() => {
              setConfirmarImportacao(false);
              setBackupSelecionado(null);
            }}
            confirmar={importarBackup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarLimpeza && (
          <ModalLimpar
            resumo={resumo}
            processando={processando}
            cancelar={() => setConfirmarLimpeza(false)}
            confirmar={limparTudo}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-4xl space-y-5 p-4 pb-32 text-black dark:text-white">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 via-blue-800 to-slate-950 p-6 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-cyan-300/10" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
              <ShieldCheck size={34} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black">Backup</h1>
              <p className="text-sm text-blue-100">
                Exportar, importar e proteger seus dados
              </p>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <ResumoTopo
              icon={Database}
              valor={totalRegistros}
              label="Registros"
            />

            <ResumoTopo
              icon={Pill}
              valor={resumo.medicamentos}
              label="Meds"
            />

            <ResumoTopo
              icon={Boxes}
              valor={resumo.unidades}
              label="Unid."
            />
          </div>
        </div>

        {/* STATUS */}
        <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <Archive size={21} />
                Resumo do banco
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dados salvos localmente neste dispositivo
              </p>
            </div>

            <button
              type="button"
              onClick={carregarResumo}
              disabled={carregando || processando}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition active:scale-95 disabled:opacity-60"
            >
              {carregando ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <RefreshCcw size={21} />
              )}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <CardResumo
              icon={Pill}
              titulo="Medicamentos"
              valor={resumo.medicamentos}
              descricao="itens no estoque"
            />

            <CardResumo
              icon={Boxes}
              titulo="Unidades"
              valor={resumo.unidades}
              descricao="quantidade total"
            />

            <CardResumo
              icon={FileJson}
              titulo="Receitas"
              valor={resumo.receitas}
              descricao="receitas salvas"
            />

            <CardResumo
              icon={Package}
              titulo="Base Local"
              valor={resumo.produtosCodigo}
              descricao="produtos aprendidos"
            />

            <CardResumo
              icon={History}
              titulo="Mapeamentos"
              valor={resumo.mapeamentos}
              descricao="históricos salvos"
              full
            />
          </div>
        </div>

        {/* AÇÕES */}
        <div className="space-y-3 rounded-3xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Database size={21} />
              Ações de backup
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Guarde um arquivo JSON seguro ou restaure seus dados
            </p>
          </div>

          <button
            type="button"
            onClick={exportarBackup}
            disabled={processando || carregando}
            className="
              flex w-full items-center justify-between rounded-2xl bg-emerald-600 p-4
              text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]
              disabled:opacity-60
            "
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                {processando ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <Download size={22} />
                )}
              </div>

              <div className="text-left">
                <p className="font-black">Exportar Backup</p>
                <p className="text-xs text-emerald-50">
                  Baixar tudo em arquivo JSON
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={processando}
            className="
              flex w-full items-center justify-between rounded-2xl bg-blue-600 p-4
              text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98]
              disabled:opacity-60
            "
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Upload size={22} />
              </div>

              <div className="text-left">
                <p className="font-black">Importar Backup</p>
                <p className="text-xs text-blue-50">
                  Restaurar dados de um arquivo JSON
                </p>
              </div>
            </div>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={selecionarArquivo}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setConfirmarLimpeza(true)}
            disabled={processando}
            className="
              flex w-full items-center justify-between rounded-2xl border border-red-500/20
              bg-red-500/10 p-4 text-red-600 transition active:scale-[0.98]
              disabled:opacity-60 dark:text-red-300
            "
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
                <Trash2 size={22} />
              </div>

              <div className="text-left">
                <p className="font-black">Limpar Tudo</p>
                <p className="text-xs text-red-500 dark:text-red-300">
                  Apagar banco local deste dispositivo
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* AVISO */}
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <TriangleAlert size={22} />
            </div>

            <div>
              <p className="font-black">Importante</p>
              <p className="mt-1 text-sm">
                O backup é um arquivo local. Guarde em um lugar seguro. Ao
                importar, os dados atuais serão substituídos pelos dados do
                arquivo escolhido.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-gray-400">
          Backup local • modo cofre blindado 🛡️
        </div>
      </div>
    </>
  );
}

function ResumoTopo({ icon: Icon, valor, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-1 text-blue-100" size={20} />
      <p className="text-xl font-black">{valor}</p>
      <p className="text-xs text-blue-100">{label}</p>
    </div>
  );
}

function CardResumo({ icon: Icon, titulo, valor, descricao, full = false }) {
  return (
    <div
      className={`
        rounded-2xl border border-gray-200 bg-gray-100 p-4
        dark:border-gray-700 dark:bg-gray-700/60
        ${full ? "col-span-2" : ""}
      `}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {titulo}
        </p>

        <Icon size={18} className="text-blue-600 dark:text-blue-400" />
      </div>

      <p className="text-2xl font-black">{valor}</p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

function ModalImportar({
  backupSelecionado,
  processando,
  formatarDataBR,
  cancelar,
  confirmar,
}) {
  const dados = backupSelecionado.dados;
  const resumo = dados.resumo || {};
  const tabelas = dados.tabelas || {};

  const medicamentos = Array.isArray(tabelas.medicamentos)
    ? tabelas.medicamentos.length
    : resumo.medicamentos || 0;

  const receitas = Array.isArray(tabelas.receitas)
    ? tabelas.receitas.length
    : resumo.receitas || 0;

  const produtosCodigo = Array.isArray(tabelas.produtosCodigo)
    ? tabelas.produtosCodigo.length
    : resumo.produtosCodigo || 0;

  const mapeamentos = Array.isArray(tabelas.mapeamentos)
    ? tabelas.mapeamentos.length
    : resumo.mapeamentos || 0;

  return (
    <motion.div
      onClick={cancelar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 14, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <Upload size={28} />
        </div>

        <h2 className="text-center text-lg font-black">Importar backup?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Os dados atuais serão substituídos pelo conteúdo deste arquivo.
        </p>

        <div className="mt-5 rounded-2xl bg-gray-100 p-4 dark:bg-gray-800">
          <p className="truncate text-sm font-black">
            {backupSelecionado.nomeArquivo}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Criado em: {formatarDataBR(dados.criadoEm)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniResumo label="Meds" valor={medicamentos} />
          <MiniResumo label="Receitas" valor={receitas} />
          <MiniResumo label="Base" valor={produtosCodigo} />
          <MiniResumo label="Mapas" valor={mapeamentos} />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            disabled={processando}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={processando}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {processando && <Loader2 size={18} className="animate-spin" />}
            Importar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalLimpar({ resumo, processando, cancelar, confirmar }) {
  const total =
    resumo.medicamentos +
    resumo.receitas +
    resumo.produtosCodigo +
    resumo.mapeamentos;

  return (
    <motion.div
      onClick={cancelar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 14, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <Trash2 size={28} />
        </div>

        <h2 className="text-center text-lg font-black">Limpar tudo?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Isso vai apagar medicamentos, receitas, base aprendida e mapeamentos
          deste dispositivo.
        </p>

        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-red-600 dark:text-red-300">
          <p className="text-3xl font-black">{total}</p>
          <p className="text-xs font-bold">registros serão removidos</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            disabled={processando}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={processando}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {processando && <Loader2 size={18} className="animate-spin" />}
            Limpar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniResumo({ label, valor }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-3 text-center dark:bg-gray-800">
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
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
          {erro ? <TriangleAlert size={20} /> : <CheckCircle2 size={20} />}
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

export default Backup;