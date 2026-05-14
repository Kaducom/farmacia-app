import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  Barcode,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Edit3,
  ImageIcon,
  Loader2,
  Minus,
  Package,
  PackagePlus,
  Plus,
  Save,
  ScanBarcode,
  Settings2,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

const SETORES_PADRAO = [
  "Medicamentos",
  "Alimentos",
  "Geladeira",
  "Perfumaria",
  "Higiene",
  "Estoque geral",
  "Outros",
];

function ModalScannerProduto({
  dados,
  processando = false,
  formatarData,
  formatarValidadeDigitada,
  onFechar,
  onSomarLote,
  onNovaValidade,
  onAtualizarProduto,
  onAtualizarLote,
}) {
  const produtoBase = dados?.produto || {};
  const lotes = Array.isArray(dados?.lotes) ? dados.lotes : [];
  const inputImagemRef = useRef(null);

  const [produtoLocal, setProdutoLocal] = useState(() => ({
    ...produtoBase,
  }));

  const [quantidade, setQuantidade] = useState(
    Math.max(1, Number(dados?.quantidadeScanner || 1))
  );

  const [validadeNova, setValidadeNova] = useState("");
  const [abrirLotes, setAbrirLotes] = useState(true);
  const [abrirEdicao, setAbrirEdicao] = useState(false);
  const [ultimaAcao, setUltimaAcao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [edicaoProduto, setEdicaoProduto] = useState(() => ({
    nome: produtoBase.nome || "",
    setor: produtoBase.setor || "Medicamentos",
    diasRemover: String(produtoBase.diasRemover || 7),
    diasPreVencido: produtoBase.diasPreVencido
      ? String(produtoBase.diasPreVencido)
      : "",
    imagem: produtoBase.imagem || null,
  }));

  const setoresDisponiveis =
    Array.isArray(dados?.setores) && dados.setores.length > 0
      ? dados.setores
      : SETORES_PADRAO;

  const temLotes = lotes.length > 0;

  const origemTexto = useMemo(() => {
    if (dados?.origem === "nuvem") return "Encontrado na nuvem";
    if (dados?.origem === "base") return "Encontrado na base";
    if (dados?.origem === "estoque") return "Já existe no estoque";
    return "Produto encontrado";
  }, [dados?.origem]);

  function alterarQuantidade(delta) {
    setQuantidade((prev) => {
      const atual = Number(prev || 1);
      return Math.max(1, Math.min(999, atual + delta));
    });
  }

  function definirQuantidade(valor) {
    const numero = Number(String(valor || "").replace(/\D/g, ""));
    setQuantidade(Math.max(1, Math.min(999, numero || 1)));
  }

  function definirAtalho(valor) {
    setQuantidade(Math.max(1, Math.min(999, Number(valor || 1))));
  }

  function alterarCampoProduto(campo, valor) {
    setEdicaoProduto((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function escolherImagem(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    const reader = new FileReader();

    reader.onload = () => {
      alterarCampoProduto("imagem", reader.result);
    };

    reader.readAsDataURL(arquivo);

    e.target.value = "";
  }

  function removerImagem() {
    alterarCampoProduto("imagem", null);
  }

  function digitarValidade(valor) {
    const formatada = formatarValidadeDigitada
      ? formatarValidadeDigitada(valor)
      : valor;

    setValidadeNova(formatada);
  }

  async function criarNovaValidade() {
    if (!validadeNova.trim() || processando) return;

    const validadeUsada = validadeNova;

    await Promise.resolve(
      onNovaValidade?.(validadeUsada, quantidade, {
        manterAberto: true,
      })
    );

    setUltimaAcao({
      tipo: "nova-validade",
      texto: `Adicionado x${quantidade} em ${validadeUsada}`,
    });

    setValidadeNova("");
    setAbrirLotes(true);
  }

  async function somarNoLote(lote) {
    if (!lote || processando) return;

    await Promise.resolve(
      onSomarLote?.(lote, quantidade, {
        manterAberto: true,
      })
    );

    const validadeTexto = formatarData
      ? formatarData(lote.validade)
      : lote.validade;

    setUltimaAcao({
      tipo: "lote",
      texto: `Somado x${quantidade} em ${validadeTexto}`,
    });
  }

  async function atualizarLote(lote, alteracoes) {
    if (!lote || processando) return;

    await Promise.resolve(
      onAtualizarLote?.(lote, alteracoes, {
        manterAberto: true,
      })
    );

    setUltimaAcao({
      tipo: "editar-lote",
      texto: "Validade atualizada com sucesso",
    });

    setAbrirLotes(true);
  }

  async function salvarEdicaoProduto() {
    if (salvandoEdicao || processando) return;

    const nomeLimpo = String(edicaoProduto.nome || "").trim();

    if (!nomeLimpo) {
      setUltimaAcao({
        tipo: "erro",
        texto: "Informe um nome para o produto",
      });
      return;
    }

    const payload = {
      ...produtoLocal,
      codigo: dados?.codigo || produtoLocal.codigo || null,
      nome: nomeLimpo,
      setor: edicaoProduto.setor || "Medicamentos",
      diasRemover: Number(edicaoProduto.diasRemover || 7),
      diasPreVencido: edicaoProduto.diasPreVencido
        ? Number(edicaoProduto.diasPreVencido)
        : null,
      imagem: edicaoProduto.imagem || null,
    };

    try {
      setSalvandoEdicao(true);

      await Promise.resolve(
        onAtualizarProduto?.(payload, {
          manterAberto: true,
        })
      );

      setProdutoLocal(payload);
      setAbrirEdicao(false);

      setUltimaAcao({
        tipo: "produto",
        texto: "Produto atualizado",
      });
    } finally {
      setSalvandoEdicao(false);
    }
  }

  if (!dados) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-[99995] flex items-end justify-center
        bg-slate-950/76 p-0 backdrop-blur-md
        sm:items-center sm:p-4
      "
    >
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 26, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="
          flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden
          rounded-t-[2rem] border border-white/10 bg-[#07111f]
          text-white shadow-2xl shadow-black/50
          sm:max-h-[88dvh] sm:rounded-[2rem]
        "
      >
        {/* HEADER COMPACTO */}
        <div
          className="
            relative shrink-0 overflow-hidden border-b border-white/10
            bg-gradient-to-br from-emerald-700 via-emerald-900 to-slate-950
            p-4
          "
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden
                  rounded-2xl border border-white/15 bg-black/25 shadow-xl
                "
              >
                {produtoLocal.imagem ? (
                  <img
                    src={produtoLocal.imagem}
                    alt={produtoLocal.nome || "Produto"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={26} className="text-white/75" />
                )}
              </div>

              <div className="min-w-0">
                <div
                  className="
                    mb-1 inline-flex items-center gap-1 rounded-full
                    border border-white/10 bg-white/12 px-2 py-0.5
                    text-[10px] font-black uppercase tracking-wide text-emerald-100
                  "
                >
                  <ScanBarcode size={11} />
                  Scanner
                </div>

                <h2 className="truncate text-xl font-black">
                  {produtoLocal.nome || "Produto encontrado"}
                </h2>

                <p className="truncate text-xs font-semibold text-emerald-100/80">
                  {origemTexto}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="
                flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                bg-white text-slate-950 shadow-xl transition active:scale-95
              "
              aria-label="Fechar"
            >
              <X size={22} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {ultimaAcao && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                rounded-[1.35rem] border p-3
                ${
                  ultimaAcao.tipo === "erro"
                    ? "border-red-400/20 bg-red-500/12 text-red-100"
                    : "border-emerald-400/20 bg-emerald-500/12 text-emerald-100"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <p className="text-sm font-black">{ultimaAcao.texto}</p>
              </div>

              {ultimaAcao.tipo !== "erro" && (
                <p className="mt-1 text-xs text-emerald-100/70">
                  Pode ajustar mais coisas ou voltar manualmente para o scanner.
                </p>
              )}
            </motion.div>
          )}

          <ResumoProduto
            produto={produtoLocal}
            codigo={dados.codigo}
            onEditar={() => setAbrirEdicao((prev) => !prev)}
            editando={abrirEdicao}
          />

          {abrirEdicao && (
            <EditarProdutoBox
              edicao={edicaoProduto}
              setores={setoresDisponiveis}
              salvando={salvandoEdicao}
              processando={processando}
              inputImagemRef={inputImagemRef}
              onImagem={escolherImagem}
              onRemoverImagem={removerImagem}
              onChange={alterarCampoProduto}
              onSalvar={salvarEdicaoProduto}
            />
          )}

          <QuantidadeBox
            quantidade={quantidade}
            setQuantidade={definirQuantidade}
            alterarQuantidade={alterarQuantidade}
            definirAtalho={definirAtalho}
          />

          <section
            className="
              rounded-[1.6rem] border border-white/10 bg-white/[0.06]
              p-3 shadow-lg backdrop-blur-xl
            "
          >
            <button
              type="button"
              onClick={() => setAbrirLotes((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                  <CalendarDays size={21} />
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-sm font-black">
                    {temLotes ? "Escolher ou editar validade" : "Nenhum lote ainda"}
                  </p>

                  <p className="truncate text-xs text-white/55">
                    {temLotes
                      ? `${lotes.length} validade${lotes.length > 1 ? "s" : ""} encontrada${lotes.length > 1 ? "s" : ""}`
                      : "Crie uma validade para adicionar ao estoque"}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={18}
                className={`shrink-0 text-white/55 transition ${
                  abrirLotes ? "rotate-180" : ""
                }`}
              />
            </button>

            {abrirLotes && temLotes && (
              <div className="mt-3 space-y-2">
                {lotes.map((lote) => (
                  <LoteCard
                    key={lote.id || `${lote.codigo}-${lote.validade}`}
                    lote={lote}
                    quantidade={quantidade}
                    processando={processando}
                    formatarData={formatarData}
                    formatarValidadeDigitada={formatarValidadeDigitada}
                    onSomar={() => somarNoLote(lote)}
                    onAtualizar={(alteracoes) => atualizarLote(lote, alteracoes)}
                  />
                ))}
              </div>
            )}
          </section>

          <section
            className="
              rounded-[1.6rem] border border-emerald-400/15
              bg-emerald-500/10 p-3 shadow-lg backdrop-blur-xl
            "
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-100">
                <PackagePlus size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black text-emerald-50">
                  Adicionar outra validade
                </p>

                <p className="text-xs text-emerald-100/65">
                  Ideal para o mesmo item com data diferente
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={validadeNova}
                onChange={(e) => digitarValidade(e.target.value)}
                placeholder="mmaa ou ddmmaaaa"
                inputMode="numeric"
                maxLength={10}
                className="
                  h-12 min-w-0 flex-1 rounded-2xl border border-white/10
                  bg-black/25 px-4 text-center text-base font-black
                  text-white outline-none placeholder:text-white/35
                  focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
                "
              />

              <button
                type="button"
                onClick={criarNovaValidade}
                disabled={processando || !validadeNova.trim()}
                className="
                  flex h-12 shrink-0 items-center justify-center gap-2
                  rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white
                  shadow-lg shadow-emerald-600/25 transition active:scale-95
                  disabled:cursor-not-allowed disabled:opacity-45
                "
              >
                {processando ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}

                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>
          </section>

          <section
            className="
              rounded-[1.6rem] border border-white/10 bg-white/[0.045]
              p-3 text-xs text-white/55
            "
          >
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-300" />
              <p>
                Esse painel agora é a central pós-scan: soma lote, cria validade,
                edita produto, troca foto e volta para a câmera só quando você quiser.
              </p>
            </div>
          </section>
        </div>

        {/* RODAPÉ */}
        <div className="shrink-0 border-t border-white/10 bg-slate-950/86 p-3">
          <button
            type="button"
            onClick={onFechar}
            className="
              flex h-12 w-full items-center justify-center rounded-2xl
              border border-white/10 bg-white/[0.06] text-sm font-black
              text-white transition active:scale-95
            "
          >
            Voltar para o scanner
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResumoProduto({ produto, codigo, onEditar, editando }) {
  return (
    <section
      className="
        rounded-[1.6rem] border border-white/10 bg-white/[0.06]
        p-3 shadow-lg backdrop-blur-xl
      "
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
            <Package size={20} />
          </div>

          <div>
            <p className="text-sm font-black">Resumo do produto</p>
            <p className="text-xs text-white/55">Dados principais do item</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditar}
          className={`
            flex h-10 items-center gap-1.5 rounded-2xl px-3 text-xs font-black
            transition active:scale-95
            ${
              editando
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white/10 text-white"
            }
          `}
        >
          <Edit3 size={15} />
          Editar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoChip icon={Barcode} label="Código" value={codigo || "Sem código"} />
        <InfoChip icon={Tag} label="Setor" value={produto.setor || "Medicamentos"} />
        <InfoChip
          icon={Settings2}
          label="Retirar"
          value={`${Number(produto.diasRemover || 7)} dias antes`}
        />
        <InfoChip
          icon={CalendarDays}
          label="Pré"
          value={
            produto.diasPreVencido
              ? `${Number(produto.diasPreVencido)} dias antes`
              : "Não definido"
          }
        />
      </div>
    </section>
  );
}

function EditarProdutoBox({
  edicao,
  setores,
  salvando,
  processando,
  inputImagemRef,
  onImagem,
  onRemoverImagem,
  onChange,
  onSalvar,
}) {
  return (
    <section
      className="
        rounded-[1.6rem] border border-emerald-400/15
        bg-emerald-500/10 p-3 shadow-lg backdrop-blur-xl
      "
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-100">
          <Edit3 size={21} />
        </div>

        <div>
          <p className="text-sm font-black text-emerald-50">
            Editar produto
          </p>
          <p className="text-xs text-emerald-100/65">
            Altera nome, foto, setor e regras do item
          </p>
        </div>
      </div>

      <input
        ref={inputImagemRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImagem}
      />

      <div className="mb-3 flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
          {edicao.imagem ? (
            <img
              src={edicao.imagem}
              alt="Foto do produto"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={25} className="text-white/55" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Foto do produto</p>
          <p className="text-xs text-white/55">
            Use câmera ou galeria do celular
          </p>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputImagemRef.current?.click()}
              className="
                flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3
                text-xs font-black text-white transition active:scale-95
              "
            >
              <Camera size={14} />
              Trocar
            </button>

            {edicao.imagem && (
              <button
                type="button"
                onClick={onRemoverImagem}
                className="
                  flex h-9 items-center rounded-xl bg-red-500/15 px-3
                  text-xs font-black text-red-100 transition active:scale-95
                "
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <CampoTexto
          label="Nome"
          value={edicao.nome}
          onChange={(valor) => onChange("nome", valor)}
          placeholder="Nome do produto"
        />

        <div>
          <label className="mb-1 block text-xs font-black text-white/70">
            Setor
          </label>

          <select
            value={edicao.setor}
            onChange={(e) => onChange("setor", e.target.value)}
            className="
              h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4
              text-sm font-black text-white outline-none
              focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
            "
          >
            {setores.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CampoTexto
            label="Retirar antes"
            value={edicao.diasRemover}
            onChange={(valor) =>
              onChange("diasRemover", valor.replace(/\D/g, ""))
            }
            placeholder="7"
            inputMode="numeric"
            sufixo="dias"
          />

          <CampoTexto
            label="Pré-vencimento"
            value={edicao.diasPreVencido}
            onChange={(valor) =>
              onChange("diasPreVencido", valor.replace(/\D/g, ""))
            }
            placeholder="Opcional"
            inputMode="numeric"
            sufixo="dias"
          />
        </div>

        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando || processando}
          className="
            mt-1 flex h-12 w-full items-center justify-center gap-2
            rounded-2xl bg-emerald-600 text-sm font-black text-white
            shadow-lg shadow-emerald-600/25 transition active:scale-95
            disabled:cursor-not-allowed disabled:opacity-45
          "
        >
          {salvando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Salvar alterações
        </button>
      </div>
    </section>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
  sufixo,
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black text-white/70">
        {label}
      </label>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`
            h-12 w-full rounded-2xl border border-white/10 bg-black/25
            px-4 text-sm font-black text-white outline-none
            placeholder:text-white/35
            focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
            ${sufixo ? "pr-14" : ""}
          `}
        />

        {sufixo && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-white/40">
            {sufixo}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/18 p-3 backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-100/70">
        <Icon size={12} />
        {label}
      </div>

      <p className="truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

function QuantidadeBox({
  quantidade,
  setQuantidade,
  alterarQuantidade,
  definirAtalho,
}) {
  const atalhos = [1, 5, 10, 20, 50];

  return (
    <section
      className="
        rounded-[1.6rem] border border-white/10 bg-white/[0.06]
        p-3 shadow-lg backdrop-blur-xl
      "
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">Quantidade da ação</p>
          <p className="text-xs text-white/55">
            Soma essa quantidade na validade escolhida
          </p>
        </div>

        <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-200">
          x{quantidade}
        </div>
      </div>

      <div className="grid grid-cols-[46px_minmax(0,1fr)_46px] gap-2">
        <button
          type="button"
          onClick={() => alterarQuantidade(-1)}
          className="
            flex h-12 w-12 items-center justify-center rounded-2xl
            bg-white/10 text-white transition active:scale-95
          "
          aria-label="Diminuir quantidade"
        >
          <Minus size={18} />
        </button>

        <input
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          inputMode="numeric"
          className="
            h-12 min-w-0 rounded-2xl border border-white/10 bg-black/25
            text-center text-xl font-black text-white outline-none
            focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15
          "
          aria-label="Quantidade"
        />

        <button
          type="button"
          onClick={() => alterarQuantidade(1)}
          className="
            flex h-12 w-12 items-center justify-center rounded-2xl
            bg-emerald-600 text-white shadow-lg shadow-emerald-600/25
            transition active:scale-95
          "
          aria-label="Aumentar quantidade"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {atalhos.map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => definirAtalho(valor)}
            className={`
              rounded-2xl px-2 py-2 text-[11px] font-black transition active:scale-95
              ${
                Number(quantidade) === valor
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/10 text-white/72"
              }
            `}
          >
            x{valor}
          </button>
        ))}
      </div>
    </section>
  );
}

function LoteCard({
  lote,
  quantidade,
  processando,
  formatarData,
  formatarValidadeDigitada,
  onSomar,
  onAtualizar,
}) {
  const validadeTexto = formatarData ? formatarData(lote.validade) : lote.validade;
  const estoqueAtual = Number(lote.quantidade || 1);
  const estoqueFinal = estoqueAtual + Number(quantidade || 1);

  const [editando, setEditando] = useState(false);
  const [validadeEditada, setValidadeEditada] = useState(validadeTexto || "");
  const [quantidadeEditada, setQuantidadeEditada] = useState(String(estoqueAtual));

  function alterarValidade(valor) {
    const formatada = formatarValidadeDigitada
      ? formatarValidadeDigitada(valor)
      : valor;

    setValidadeEditada(formatada);
  }

  function salvarEdicaoLote() {
    onAtualizar?.({
      validade: validadeEditada,
      quantidade: Number(quantidadeEditada || 1),
    });

    setEditando(false);
  }

  return (
    <div
      className="
        rounded-[1.35rem] border border-white/10 bg-black/20 p-3
      "
    >
      {!editando ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white/55">Validade</p>

            <p className="mt-0.5 truncate text-base font-black text-white">
              {validadeTexto}
            </p>

            <p className="mt-1 text-xs text-white/50">
              Atual{" "}
              <span className="font-black text-white">x{estoqueAtual}</span>
              {"  "}→{"  "}
              <span className="font-black text-emerald-200">x{estoqueFinal}</span>
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="
                flex h-11 w-11 items-center justify-center rounded-2xl
                bg-white/10 text-white transition active:scale-95
              "
              aria-label="Editar validade"
            >
              <Edit3 size={16} />
            </button>

            <button
              type="button"
              onClick={onSomar}
              disabled={processando}
              className="
                flex h-11 shrink-0 items-center justify-center gap-1.5
                rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white
                shadow-lg shadow-emerald-600/20 transition active:scale-95
                disabled:cursor-not-allowed disabled:opacity-45
              "
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              +{quantidade}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
            <CampoTexto
              label="Validade"
              value={validadeEditada}
              onChange={alterarValidade}
              placeholder="mmaa ou ddmmaaaa"
              inputMode="numeric"
            />

            <CampoTexto
              label="Qtd"
              value={quantidadeEditada}
              onChange={(valor) =>
                setQuantidadeEditada(valor.replace(/\D/g, ""))
              }
              placeholder="1"
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="
                h-10 rounded-2xl border border-white/10 bg-white/[0.06]
                text-xs font-black text-white transition active:scale-95
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvarEdicaoLote}
              disabled={processando}
              className="
                flex h-10 items-center justify-center gap-1.5 rounded-2xl
                bg-emerald-600 text-xs font-black text-white
                transition active:scale-95 disabled:opacity-45
              "
            >
              <Save size={15} />
              Salvar lote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModalScannerProduto;