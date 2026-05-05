import { useMemo, useState } from "react";
import FundoBolhas from "../components/FundoBolhas";

import {
  AlertTriangle,
  BadgeDollarSign,
  Bot,
  CheckCircle2,
  ClipboardList,
  Pill,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBasket,
  Stethoscope,
} from "lucide-react";

const produtosMock = [
  {
    id: 1,
    nome: "Paracetamol 750mg",
    categoria: "dor_febre",
    tipo: "MIP",
    estoque: 12,
    preco: 12.9,
    comissao: 1.8,
    scoreClinico: 9,
    obs: "Dor e febre. Verificar restrições hepáticas.",
  },
  {
    id: 2,
    nome: "Dipirona 500mg",
    categoria: "dor_febre",
    tipo: "MIP",
    estoque: 18,
    preco: 8.9,
    comissao: 1.2,
    scoreClinico: 9,
    obs: "Dor e febre. Conferir alergias e histórico.",
  },
  {
    id: 3,
    nome: "Soro nasal spray",
    categoria: "gripe_resfriado",
    tipo: "Suporte",
    estoque: 20,
    preco: 18.5,
    comissao: 2.1,
    scoreClinico: 8,
    obs: "Auxilia em congestão nasal.",
  },
  {
    id: 4,
    nome: "Pastilha para garganta",
    categoria: "garganta",
    tipo: "MIP",
    estoque: 9,
    preco: 15.9,
    comissao: 2.4,
    scoreClinico: 7,
    obs: "Alívio sintomático. Conferir idade mínima.",
  },
  {
    id: 5,
    nome: "Sais de reidratação oral",
    categoria: "gastro",
    tipo: "Suporte",
    estoque: 7,
    preco: 6.9,
    comissao: 0.9,
    scoreClinico: 10,
    obs: "Útil em vômito/diarreia para hidratação.",
  },
  {
    id: 6,
    nome: "Antialérgico exemplo",
    categoria: "alergia",
    tipo: "MIP",
    estoque: 6,
    preco: 22.9,
    comissao: 3.2,
    scoreClinico: 8,
    obs: "Pode causar sonolência. Conferir contraindicações.",
  },
];

function Doutor() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  function analisar() {
    setErro("");

    if (!texto.trim()) {
      setErro("Descreva o que o paciente relatou.");
      return;
    }

    const t = texto.toLowerCase();

    const alerta =
      t.includes("falta de ar") ||
      t.includes("dor no peito") ||
      t.includes("convuls") ||
      t.includes("desmaio") ||
      t.includes("sangramento") ||
      t.includes("lábios roxos") ||
      t.includes("labios roxos");

    if (alerta) {
      setResultado({
        nivel: "grave",
        titulo: "Sinal de alerta detectado",
        mensagem:
          "Não seguir com recomendação de produto. Orientar atendimento urgente.",
        categorias: [],
      });
      return;
    }

    const categorias = [];

    if (
      t.includes("febre") ||
      t.includes("dor de cabeça") ||
      t.includes("dor no corpo") ||
      t.includes("dor")
    ) {
      categorias.push("dor_febre");
    }

    if (
      t.includes("gripe") ||
      t.includes("resfriado") ||
      t.includes("tosse") ||
      t.includes("coriza") ||
      t.includes("nariz")
    ) {
      categorias.push("gripe_resfriado");
    }

    if (
      t.includes("garganta") ||
      t.includes("rouquidão") ||
      t.includes("rouquidao")
    ) {
      categorias.push("garganta");
    }

    if (
      t.includes("enjoo") ||
      t.includes("náusea") ||
      t.includes("nausea") ||
      t.includes("vomito") ||
      t.includes("vômito") ||
      t.includes("diarreia")
    ) {
      categorias.push("gastro");
    }

    if (
      t.includes("alergia") ||
      t.includes("coceira") ||
      t.includes("urticária") ||
      t.includes("urticaria") ||
      t.includes("mancha")
    ) {
      categorias.push("alergia");
    }

    if (!categorias.length) {
      setResultado({
        nivel: "indefinido",
        titulo: "Não identifiquei uma categoria clara",
        mensagem: "Faça perguntas extras antes de sugerir qualquer produto.",
        categorias: [],
      });
      return;
    }

    setResultado({
      nivel: "ok",
      titulo: "Categorias possíveis encontradas",
      mensagem:
        "Confira as perguntas de segurança antes de indicar qualquer opção.",
      categorias: [...new Set(categorias)],
    });
  }

  const produtosSugeridos = useMemo(() => {
    if (!resultado?.categorias?.length) return [];

    return produtosMock
      .filter((p) => resultado.categorias.includes(p.categoria))
      .filter((p) => p.estoque > 0)
      .sort((a, b) => {
        if (b.scoreClinico !== a.scoreClinico) {
          return b.scoreClinico - a.scoreClinico;
        }

        return b.comissao - a.comissao;
      });
  }, [resultado]);

  function limpar() {
    setTexto("");
    setResultado(null);
    setErro("");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="rose" />

      <div className="relative z-10 mx-auto max-w-5xl p-4 pb-24 text-gray-950 dark:text-white">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
            <Bot size={24} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight">
              Assistente Farmacêutico
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Triagem, categorias e apoio ao atendimento.
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-3 rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-800 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={22} className="mt-0.5 shrink-0" />
          <p>
            Use como apoio de atendimento. Segurança, receita, contraindicações
            e orientação profissional sempre vêm antes da comissão.
          </p>
        </div>

        {erro && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 shadow-lg shadow-black/5 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle size={18} />
            {erro}
          </div>
        )}

        <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
            <ClipboardList size={17} className="text-cyan-600" />
            Relato do paciente/cliente
          </label>

          <textarea
            rows={5}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex: cliente com febre, dor no corpo e garganta irritada..."
            className="w-full resize-none rounded-3xl border border-transparent bg-gray-100 p-4 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 dark:bg-gray-950 dark:text-white"
          />

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={analisar}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 active:scale-95"
            >
              <Search size={18} />
              Analisar atendimento
            </button>

            <button
              type="button"
              onClick={limpar}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white font-bold text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RotateCcw size={18} />
              Limpar
            </button>
          </div>

          {resultado && (
            <div
              className={`
                mt-5 rounded-3xl border p-4
                ${
                  resultado.nivel === "grave"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    : resultado.nivel === "indefinido"
                    ? "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                }
              `}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
                  {resultado.nivel === "grave" ? (
                    <ShieldAlert size={22} />
                  ) : (
                    <Stethoscope size={22} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase opacity-70">
                    Resultado
                  </p>
                  <h2 className="text-lg font-black">{resultado.titulo}</h2>
                </div>
              </div>

              <p className="text-sm font-medium">{resultado.mensagem}</p>

              {resultado.categorias.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {resultado.categorias.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold dark:bg-black/20"
                    >
                      {nomeCategoria(cat)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {resultado?.nivel === "ok" && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <Checklist />

            <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                  <ShoppingBasket size={22} />
                </div>

                <div>
                  <h2 className="font-black">Opções encontradas</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ordenado por adequação clínica, depois comissão.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {produtosSugeridos.map((p) => (
                  <ProdutoCard key={p.id} produto={p} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Checklist() {
  const itens = [
    "Tem alergia a algum medicamento?",
    "É gestante, lactante, criança, idoso ou paciente crônico?",
    "Usa remédio contínuo?",
    "Sintomas há quantos dias?",
    "Tem febre alta, falta de ar, dor no peito ou piora rápida?",
    "Existe receita médica para medicamento tarjado/controlado?",
  ];

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <CheckCircle2 size={22} />
        </div>

        <div>
          <h2 className="font-black">Checklist antes de oferecer</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Perguntas rápidas de segurança.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {itens.map((item) => (
          <div
            key={item}
            className="flex gap-2 rounded-2xl bg-gray-50/90 p-3 text-sm dark:bg-gray-950"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-blue-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProdutoCard({ produto }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 shadow-lg shadow-black/5 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-1 text-[11px] font-bold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
            <Pill size={13} />
            {produto.tipo}
          </div>

          <h3 className="font-black">{produto.nome}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {produto.obs}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-100 px-3 py-2 text-right text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <p className="text-[11px] font-bold">Comissão</p>
          <p className="font-black">R$ {produto.comissao.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <InfoMini label="Estoque" valor={produto.estoque} />
        <InfoMini label="Preço" valor={`R$ ${produto.preco.toFixed(2)}`} />
        <InfoMini label="Score" valor={`${produto.scoreClinico}/10`} />
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
        <BadgeDollarSign size={16} className="shrink-0 text-emerald-500" />
        Comissão visível, mas segurança e adequação vêm primeiro.
      </div>
    </div>
  );
}

function InfoMini({ label, valor }) {
  return (
    <div className="rounded-2xl bg-white p-3 dark:bg-gray-900">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-black">{valor}</p>
    </div>
  );
}

function nomeCategoria(cat) {
  const nomes = {
    dor_febre: "Dor / febre",
    gripe_resfriado: "Gripe / resfriado",
    garganta: "Garganta",
    gastro: "Gastrointestinal",
    alergia: "Alergia",
  };

  return nomes[cat] || cat;
}

export default Doutor;