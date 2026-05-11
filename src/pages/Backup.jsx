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
  HardDriveDownload,
  History,
  Info,
  Layers,
  Loader2,
  Package,
  Pill,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

const VERSAO_BACKUP = 2;

const resumoInicial = {
  totalRegistros: 0,
  totalUnidades: 0,
  tabelas: [],
  atualizadoEm: null,
};

const configTabelas = {
  medicamentos: {
    titulo: "Medicamentos",
    descricao: "itens no estoque",
    icon: Pill,
  },
  receitas: {
    titulo: "Receitas",
    descricao: "receitas salvas",
    icon: FileJson,
  },
  produtosCodigo: {
    titulo: "Base Local",
    descricao: "produtos aprendidos",
    icon: Package,
  },
  mapeamentos: {
    titulo: "Mapeamentos",
    descricao: "históricos salvos",
    icon: History,
  },
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
  const [mostrarDetalhes, setMostrarDetalhes] = useState(true);

  useEffect(() => {
    carregarResumo();
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(30);

    setTimeout(() => {
      setToast(null);
    }, 3400);
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

  function formatarTamanho(bytes) {
    if (!bytes && bytes !== 0) return "Tamanho desconhecido";

    if (bytes < 1024) return `${bytes} B`;

    const kb = bytes / 1024;

    if (kb < 1024) return `${kb.toFixed(1)} KB`;

    return `${(kb / 1024).toFixed(1)} MB`;
  }

  function obterConfigTabela(nome) {
    return (
      configTabelas[nome] || {
        titulo: nome,
        descricao: "tabela do banco local",
        icon: Database,
      }
    );
  }

  function somarUnidades(medicamentos = []) {
    return medicamentos.reduce((total, item) => {
      return total + Number(item.quantidade || 1);
    }, 0);
  }

  async function carregarResumo() {
    try {
      setCarregando(true);

      const tabelas = await Promise.all(
        db.tables.map(async (tabela) => {
          const registros = await tabela.count();

          return {
            nome: tabela.name,
            registros,
          };
        })
      );

      const tabelaMedicamentos = db.tables.find(
        (tabela) => tabela.name === "medicamentos"
      );

      const medicamentos = tabelaMedicamentos
        ? await tabelaMedicamentos.toArray()
        : [];

      const totalRegistros = tabelas.reduce((total, tabela) => {
        return total + Number(tabela.registros || 0);
      }, 0);

      setResumo({
        totalRegistros,
        totalUnidades: somarUnidades(medicamentos),
        tabelas,
        atualizadoEm: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Erro ao carregar resumo:", err);
      mostrarToast("Erro ao carregar resumo do banco 😕", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function montarBackup() {
    const tabelas = {};
    const resumoTabelas = [];

    for (const tabela of db.tables) {
      const dados = await tabela.toArray();

      tabelas[tabela.name] = dados;

      resumoTabelas.push({
        nome: tabela.name,
        registros: dados.length,
      });
    }

    const medicamentos = Array.isArray(tabelas.medicamentos)
      ? tabelas.medicamentos
      : [];

    const totalRegistros = resumoTabelas.reduce((total, tabela) => {
      return total + Number(tabela.registros || 0);
    }, 0);

    const agora = new Date();

    return {
      app: "Farmacia App",
      tipo: "backup-completo-dexie",
      versaoBackup: VERSAO_BACKUP,
      criadoEm: agora.toISOString(),
      banco: db.name,
      resumo: {
        totalRegistros,
        totalUnidades: somarUnidades(medicamentos),
        tabelas: resumoTabelas,
      },
      tabelas,
    };
  }

  async function exportarBackup() {
    try {
      setProcessando(true);

      const backup = await montarBackup();
      const agora = new Date();

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
      if (!arquivo.name.toLowerCase().endsWith(".json")) {
        throw new Error("O arquivo precisa ser JSON");
      }

      const texto = await arquivo.text();
      const dados = JSON.parse(texto);

      const validado = validarBackup(dados);

      setBackupSelecionado({
        nomeArquivo: arquivo.name,
        tamanho: arquivo.size,
        dados,
        validado,
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

    const tabelasBackup = dados.tabelas;
    const nomesAtuais = db.tables.map((tabela) => tabela.name);
    const nomesBackup = Object.keys(tabelasBackup);

    nomesBackup.forEach((nome) => {
      if (!Array.isArray(tabelasBackup[nome])) {
        throw new Error(`Tabela ${nome} inválida`);
      }
    });

    const tabelasReconhecidas = nomesAtuais.map((nome) => {
      const registros = Array.isArray(tabelasBackup[nome])
        ? tabelasBackup[nome].length
        : 0;

      return {
        nome,
        registros,
        presenteNoArquivo: Array.isArray(tabelasBackup[nome]),
      };
    });

    const tabelasIgnoradas = nomesBackup
      .filter((nome) => !nomesAtuais.includes(nome))
      .map((nome) => ({
        nome,
        registros: tabelasBackup[nome].length,
      }));

    const totalImportado = tabelasReconhecidas.reduce((total, tabela) => {
      return total + Number(tabela.registros || 0);
    }, 0);

    return {
      tabelasReconhecidas,
      tabelasIgnoradas,
      totalImportado,
    };
  }

  async function importarBackup() {
    if (!backupSelecionado?.dados) return;

    try {
      setProcessando(true);

      const tabelasBackup = backupSelecionado.dados.tabelas || {};

      await db.transaction("rw", ...db.tables, async () => {
        for (const tabela of db.tables) {
          await tabela.clear();

          const dados = Array.isArray(tabelasBackup[tabela.name])
            ? tabelasBackup[tabela.name]
            : [];

          if (dados.length > 0) {
            await tabela.bulkPut(dados);
          }
        }
      });

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

      await db.transaction("rw", ...db.tables, async () => {
        for (const tabela of db.tables) {
          await tabela.clear();
        }
      });

      setConfirmarLimpeza(false);

      mostrarToast("Banco local limpo com sucesso 🧹", "ok");
      await carregarResumo();
    } catch (err) {
      console.error("Erro ao limpar banco:", err);
      mostrarToast("Erro ao limpar banco 😕", "erro");
    } finally {
      setProcessando(false);
    }
  }

  const temDados = resumo.totalRegistros > 0;

  return (
    <>
      {toast && <Toast toast={toast} fechar={() => setToast(null)} />}

      <AnimatePresence>
        {confirmarImportacao && backupSelecionado && (
          <ModalImportar
            backupSelecionado={backupSelecionado}
            resumoAtual={resumo}
            processando={processando}
            formatarDataBR={formatarDataBR}
            formatarTamanho={formatarTamanho}
            obterConfigTabela={obterConfigTabela}
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
            obterConfigTabela={obterConfigTabela}
            cancelar={() => setConfirmarLimpeza(false)}
            confirmar={limparTudo}
          />
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-5xl overflow-hidden p-4 pb-32 text-gray-950 dark:text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 right-4 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute left-0 top-80 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-700 via-blue-800 to-slate-950 p-6 text-white shadow-2xl">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-cyan-300/10" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
                <ShieldCheck size={34} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                  Cofre local
                </p>

                <h1 className="mt-1 text-3xl font-black">Backup</h1>

                <p className="mt-1 text-sm text-blue-100">
                  Exporte, restaure ou limpe todos os dados locais do Dexie.
                </p>
              </div>

              <button
                type="button"
                onClick={carregarResumo}
                disabled={carregando || processando}
                className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/15 text-white backdrop-blur-md transition active:scale-95 disabled:opacity-60 sm:flex"
                title="Atualizar resumo"
              >
                {carregando ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <RefreshCcw size={21} />
                )}
              </button>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-3">
              <ResumoTopo
                icon={Database}
                valor={resumo.totalRegistros}
                label="Registros"
              />

              <ResumoTopo
                icon={Layers}
                valor={resumo.tabelas.length}
                label="Tabelas"
              />

              <ResumoTopo
                icon={Boxes}
                valor={resumo.totalUnidades}
                label="Unid."
              />
            </div>

            <div className="relative mt-5 rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-blue-50 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <Info size={20} className="mt-0.5 shrink-0" />

                <p>
                  Este backup salva os dados locais deste dispositivo. Ele não
                  substitui sincronização em nuvem, mas é perfeito para cópia de
                  segurança e migração manual.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-gray-200/70 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Archive size={21} />
                  Resumo do que será exportado
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Leitura atual do banco local IndexedDB.
                </p>
              </div>

              <button
                type="button"
                onClick={carregarResumo}
                disabled={carregando || processando}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition active:scale-95 disabled:opacity-60 sm:hidden"
              >
                {carregando ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <RefreshCcw size={21} />
                )}
              </button>
            </div>

            {carregando ? (
              <div className="mt-5 flex items-center justify-center rounded-3xl bg-gray-100 p-8 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                <Loader2 size={24} className="mr-3 animate-spin" />
                Conferindo o cofre local...
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {resumo.tabelas.map((tabela) => {
                    const config = obterConfigTabela(tabela.nome);

                    return (
                      <CardResumo
                        key={tabela.nome}
                        icon={config.icon}
                        titulo={config.titulo}
                        valor={tabela.registros}
                        descricao={config.descricao}
                      />
                    );
                  })}

                  <CardResumo
                    icon={Boxes}
                    titulo="Unidades"
                    valor={resumo.totalUnidades}
                    descricao="soma das quantidades"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarDetalhes((atual) => !atual)}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition active:scale-[0.99] dark:border-white/10 dark:bg-white/5"
                >
                  <div>
                    <p className="font-black">Detalhes técnicos</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ver nomes reais das tabelas do Dexie
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                    {mostrarDetalhes ? "Ocultar" : "Ver"}
                  </span>
                </button>

                <AnimatePresence>
                  {mostrarDetalhes && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-3 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10"
                    >
                      {resumo.tabelas.map((tabela) => (
                        <div
                          key={tabela.nome}
                          className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 last:border-b-0 dark:border-white/10 dark:bg-gray-950/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {tabela.nome}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              tabela local
                            </p>
                          </div>

                          <p className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-black dark:bg-white/10">
                            {tabela.registros}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-4 text-center text-xs text-gray-400">
                  Atualizado em {formatarDataBR(resumo.atualizadoEm)}
                </p>
              </>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <AcaoCard
              icon={Download}
              titulo="Exportar backup"
              descricao="Baixa um arquivo JSON com todas as tabelas do Dexie."
              botao="Exportar agora"
              cor="emerald"
              carregando={processando}
              desativado={processando || carregando}
              onClick={exportarBackup}
            />

            <AcaoCard
              icon={Upload}
              titulo="Importar backup"
              descricao="Restaura um arquivo JSON e substitui os dados atuais."
              botao="Escolher arquivo"
              cor="blue"
              desativado={processando}
              onClick={() => inputRef.current?.click()}
            />

            <AcaoCard
              icon={Trash2}
              titulo="Limpar dados"
              descricao="Apaga o banco local deste dispositivo com trava de segurança."
              botao="Abrir limpeza"
              cor="red"
              desativado={processando || !temDados}
              onClick={() => setConfirmarLimpeza(true)}
            />

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={selecionarArquivo}
              className="hidden"
            />
          </section>

          <section className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-xl backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <TriangleAlert size={23} />
              </div>

              <div>
                <p className="font-black">Aviso importante</p>

                <p className="mt-1 text-sm leading-relaxed">
                  Ao importar um backup, os dados atuais são substituídos. Antes
                  de testar importação ou limpeza, exporte um backup recente.
                  É o paraquedas do foguete 🚀
                </p>
              </div>
            </div>
          </section>

          <div className="pt-2 text-center text-xs text-gray-400">
            Backup local • modo cofre blindado 🛡️
          </div>
        </div>
      </div>
    </>
  );
}

function ResumoTopo({ icon: Icon, valor, label }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-md">
      <Icon className="mx-auto mb-1 text-blue-100" size={20} />
      <p className="text-xl font-black">{valor}</p>
      <p className="text-xs text-blue-100">{label}</p>
    </div>
  );
}

function CardResumo({ icon: Icon, titulo, valor, descricao }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {titulo}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <Icon size={18} />
        </div>
      </div>

      <p className="text-3xl font-black">{valor}</p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

function AcaoCard({
  icon: Icon,
  titulo,
  descricao,
  botao,
  cor,
  carregando = false,
  desativado = false,
  onClick,
}) {
  const estilos = {
    emerald: {
      card: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10",
      icon: "bg-emerald-600 text-white shadow-emerald-600/20",
      button:
        "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    blue: {
      card: "border-blue-200 bg-blue-50/80 dark:border-blue-500/20 dark:bg-blue-500/10",
      icon: "bg-blue-600 text-white shadow-blue-600/20",
      button: "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700",
      text: "text-blue-700 dark:text-blue-300",
    },
    red: {
      card: "border-red-200 bg-red-50/80 dark:border-red-500/20 dark:bg-red-500/10",
      icon: "bg-red-600 text-white shadow-red-600/20",
      button: "bg-red-600 text-white shadow-red-600/20 hover:bg-red-700",
      text: "text-red-700 dark:text-red-300",
    },
  };

  const estilo = estilos[cor];

  return (
    <div
      className={`rounded-[2rem] border p-5 shadow-xl backdrop-blur-xl ${estilo.card}`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg ${estilo.icon}`}
      >
        <Icon size={27} />
      </div>

      <h3 className={`text-lg font-black ${estilo.text}`}>{titulo}</h3>

      <p className="mt-2 min-h-[42px] text-sm text-gray-600 dark:text-gray-300">
        {descricao}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={desativado}
        className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-black shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${estilo.button}`}
      >
        {carregando ? <Loader2 size={18} className="animate-spin" /> : null}
        {botao}
      </button>
    </div>
  );
}

function ModalImportar({
  backupSelecionado,
  resumoAtual,
  processando,
  formatarDataBR,
  formatarTamanho,
  obterConfigTabela,
  cancelar,
  confirmar,
}) {
  const [codigo, setCodigo] = useState("");

  const dados = backupSelecionado.dados;
  const validado = backupSelecionado.validado;

  const podeImportar = codigo.trim().toUpperCase() === "IMPORTAR";

  return (
    <motion.div
      onClick={cancelar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 14, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-white/10 dark:bg-gray-950 dark:text-white"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <Upload size={31} />
        </div>

        <h2 className="text-center text-xl font-black">Importar backup?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Isso vai substituir os dados atuais pelos dados do arquivo escolhido.
        </p>

        <div className="mt-5 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="truncate text-sm font-black">
            {backupSelecionado.nomeArquivo}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <p>Criado: {formatarDataBR(dados.criadoEm)}</p>
            <p>Tamanho: {formatarTamanho(backupSelecionado.tamanho)}</p>
            <p>Versão: {dados.versaoBackup || "antiga"}</p>
            <p>Banco: {dados.banco || "não informado"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniResumo
            label="Atual no aparelho"
            valor={resumoAtual.totalRegistros}
          />

          <MiniResumo label="No backup" valor={validado.totalImportado} />
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10">
          {validado.tabelasReconhecidas.map((tabela) => {
            const config = obterConfigTabela(tabela.nome);
            const Icon = config.icon;

            return (
              <div
                key={tabela.nome}
                className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 last:border-b-0 dark:border-white/10 dark:bg-gray-900/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {config.titulo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tabela.presenteNoArquivo
                        ? "encontrada no arquivo"
                        : "ausente, ficará vazia"}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-black dark:bg-white/10">
                  {tabela.registros}
                </p>
              </div>
            );
          })}
        </div>

        {validado.tabelasIgnoradas.length > 0 && (
          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="flex items-center gap-2 text-sm font-black">
              <ShieldAlert size={18} />
              Tabelas ignoradas
            </p>

            <p className="mt-1 text-xs">
              O arquivo possui tabelas que não existem neste app. Elas não serão
              importadas.
            </p>
          </div>
        )}

        <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <p className="text-sm font-black">Trava de segurança</p>

          <p className="mt-1 text-xs">
            Digite <strong>IMPORTAR</strong> para liberar a restauração.
          </p>

          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Digite IMPORTAR"
            className="mt-3 h-12 w-full rounded-2xl border border-red-200 bg-white px-4 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-red-400 dark:border-red-500/20 dark:bg-gray-950"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            disabled={processando}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-black text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-white/10 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={processando || !podeImportar}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 font-black text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando && <Loader2 size={18} className="animate-spin" />}
            Importar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalLimpar({
  resumo,
  processando,
  obterConfigTabela,
  cancelar,
  confirmar,
}) {
  const [codigo, setCodigo] = useState("");

  const podeLimpar = codigo.trim().toUpperCase() === "LIMPAR";

  return (
    <motion.div
      onClick={cancelar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 14, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-gray-200 bg-white p-6 text-gray-950 shadow-2xl dark:border-white/10 dark:bg-gray-950 dark:text-white"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
          <Trash2 size={31} />
        </div>

        <h2 className="text-center text-xl font-black">Limpar tudo?</h2>

        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Essa ação apaga o banco local deste dispositivo. Só faça isso depois
          de exportar um backup.
        </p>

        <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-center text-red-600 dark:text-red-300">
          <p className="text-4xl font-black">{resumo.totalRegistros}</p>
          <p className="text-xs font-black uppercase tracking-wide">
            registros serão removidos
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10">
          {resumo.tabelas.map((tabela) => {
            const config = obterConfigTabela(tabela.nome);
            const Icon = config.icon;

            return (
              <div
                key={tabela.nome}
                className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 last:border-b-0 dark:border-white/10 dark:bg-gray-900/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {config.titulo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tabela.nome}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-black dark:bg-white/10">
                  {tabela.registros}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <p className="text-sm font-black">Trava de segurança</p>

          <p className="mt-1 text-xs">
            Digite <strong>LIMPAR</strong> para liberar a exclusão.
          </p>

          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Digite LIMPAR"
            className="mt-3 h-12 w-full rounded-2xl border border-red-200 bg-white px-4 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-red-400 dark:border-red-500/20 dark:bg-gray-950"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={cancelar}
            disabled={processando}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-gray-100 font-black text-gray-700 transition active:scale-95 disabled:opacity-60 dark:bg-white/10 dark:text-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={processando || !podeLimpar}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 font-black text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="rounded-3xl bg-gray-100 p-4 text-center dark:bg-white/10">
      <p className="text-3xl font-black">{valor}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";
  const aviso = toast.tipo === "aviso";

  return (
    <div className="fixed left-1/2 top-5 z-[100000] w-[92%] max-w-sm -translate-x-1/2">
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -14, scale: 0.98 }}
        className={`
          flex items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl
          ${
            erro
              ? "border-red-300 bg-red-50/95 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300"
              : aviso
              ? "border-amber-300 bg-amber-50/95 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300"
              : "border-emerald-300 bg-emerald-50/95 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300"
          }
        `}
      >
        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white
            ${erro ? "bg-red-500" : aviso ? "bg-amber-500" : "bg-emerald-600"}
          `}
        >
          {erro ? (
            <TriangleAlert size={20} />
          ) : aviso ? (
            <ShieldAlert size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
        </div>

        <p className="flex-1 text-sm font-black">{toast.msg}</p>

        <button
          type="button"
          onClick={fechar}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition active:scale-95 dark:bg-white/10"
        >
          <X size={17} />
        </button>
      </motion.div>
    </div>
  );
}

export default Backup;