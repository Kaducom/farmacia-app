import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FundoBolhas from "../components/FundoBolhas";

import {
  AlertTriangle,
  Bot,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  Copy,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  LibraryBig,
  Lightbulb,
  Pill,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShoppingBasket,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

const baseClinica = [
  {
    id: "tosse_seca",
    titulo: "Tosse seca",
    grupo: "Respiratório",
    cor: "cyan",
    sintomas: [
      "tosse seca",
      "tosse sem catarro",
      "tosse irritativa",
      "garganta arranhando",
      "tosse à noite",
      "tosse a noite",
    ],
    resumo:
      "Tosse sem muco, geralmente ligada a irritação de vias aéreas, alergias, fumaça, poeira ou quadro viral.",
    anamnese: [
      "Está expelindo muco ou secreção ao tossir?",
      "A tosse ocorre mais à noite ou ao acordar?",
      "Teve resfriado, gripe ou exposição a poeira, fumaça ou alergênicos?",
      "A tosse vem com dor ou sensação de arranhado na garganta?",
    ],
    sinaisAlerta: [
      "Falta de ar",
      "Febre alta",
      "Dor no peito",
      "Tosse por mais de 7 dias",
      "Piora rápida",
    ],
    indicacoes: [
      "Antitussígenos",
      "Anti-histamínicos quando houver perfil alérgico",
      "Itens de suporte para garganta",
    ],
    posologia: [
      "Dropropizina 3mg/mL: 10 mL VO 4x/dia.",
      "Cloperastina 3,54mg/mL: 10 mL VO 3x/dia.",
      "Loratadina 1mg/mL: 10 mL VO 1x/dia.",
      "Pastilha: a cada 2 a 3 horas, respeitando limite do fabricante.",
    ],
    orientacoes: [
      "Aumentar ingestão de líquidos.",
      "Evitar fumaça, poeira e produtos irritantes.",
      "Manter o ambiente úmido.",
      "Se persistir por mais de uma semana ou vier com sintomas graves, encaminhar.",
    ],
    vendas: [
      "Pastilhas para garganta",
      "Lenços de papel",
      "Umidificador",
      "Chás de gengibre e própolis",
      "Suplementos vitamínicos",
    ],
  },
  {
    id: "tosse_cheia",
    titulo: "Tosse cheia",
    grupo: "Respiratório",
    cor: "emerald",
    sintomas: [
      "tosse cheia",
      "catarro",
      "muco",
      "secreção",
      "secrecao",
      "tosse produtiva",
      "peito carregado",
    ],
    resumo:
      "Tosse com muco, quando o organismo tenta eliminar secreções das vias respiratórias.",
    anamnese: [
      "Está expelindo muco? Qual a cor e consistência?",
      "A tosse acontece mais de dia ou também à noite?",
      "Tem falta de ar, chiado ou dor no peito?",
      "Teve gripe, resfriado ou infecção respiratória recente?",
    ],
    sinaisAlerta: [
      "Falta de ar",
      "Chiado intenso",
      "Dor no peito",
      "Sangue no muco",
      "Febre alta",
      "Tosse por mais de 7 dias",
    ],
    indicacoes: [
      "Expectorantes",
      "Mucolíticos",
      "Hidratação e suporte respiratório",
    ],
    posologia: [
      "Acetilcisteína 40mg/mL: adulto 10 mL até 3x/dia.",
      "Ambroxol 30mg/5mL: adulto 5 mL VO 3x/dia.",
      "Xarope de guaco: 5 mL VO 8/8h.",
      "Guaifenesina 200mg/15mL: 15 mL VO de 4/4h.",
    ],
    orientacoes: [
      "Aumentar ingestão de líquidos.",
      "Evitar fumaça, poeira e irritantes.",
      "Observar cor do muco.",
      "Encaminhar se houver febre alta, falta de ar, sangue ou piora.",
    ],
    vendas: [
      "Lenços de papel",
      "Nebulizador",
      "Soro fisiológico",
      "Pomada descongestionante",
      "Pastilhas",
    ],
  },
  {
    id: "gripe_resfriado",
    titulo: "Gripe / resfriado",
    grupo: "Respiratório",
    cor: "blue",
    sintomas: [
      "gripe",
      "resfriado",
      "coriza",
      "espirro",
      "febre",
      "dor no corpo",
      "calafrio",
      "fadiga",
      "nariz escorrendo",
      "nariz entupido",
      "adulto gripado",
      "adulto com gripe",
    ],
    resumo:
      "Resfriado tende a ser mais local e gradual. Gripe costuma ter início súbito, febre, dores no corpo e fadiga intensa.",
    anamnese: [
      "Quais sintomas principais?",
      "Quando começaram?",
      "Teve febre acima de 37,8°C?",
      "Tem dor no corpo, calafrios ou fadiga intensa?",
      "É criança, gestante, idoso, hipertenso, diabético ou usa medicamento contínuo?",
    ],
    sinaisAlerta: [
      "Febre alta persistente",
      "Falta de ar",
      "Dor no peito",
      "Confusão mental",
      "Piora rápida",
      "Grupo de risco",
    ],
    indicacoes: [
      "Antigripais conforme sintomas",
      "Analgésicos e antitérmicos",
      "Descongestionantes e soro fisiológico",
    ],
    posologia: [
      "Cimegripe: 1 cápsula ou comprimido VO de 4/4h.",
      "Benegripe: 2 comprimidos VO de 8/8h.",
      "Apracur: 1 a 2 comprimidos VO 3x/dia.",
      "Decongex Plus: conforme apresentação e bula.",
    ],
    orientacoes: [
      "Aumentar líquidos.",
      "Repouso.",
      "Reforçar vacinação.",
      "Sugerir teste rápido COVID-19 quando fizer sentido.",
      "Usar máscara durante sintomas respiratórios.",
    ],
    vendas: [
      "Soro fisiológico",
      "Lenços",
      "Termômetro",
      "Álcool 70%",
      "Nebulizador",
      "Suplementos",
    ],
  },
  {
    id: "rinite",
    titulo: "Rinite",
    grupo: "Respiratório",
    cor: "sky",
    sintomas: [
      "rinite",
      "espirros",
      "coceira no nariz",
      "nariz entupido",
      "coriza clara",
      "alergia nasal",
      "lacrimejamento",
    ],
    resumo:
      "Quadro nasal frequentemente associado a alergênicos, com espirros, coriza clara, obstrução e coceira.",
    anamnese: [
      "Os sintomas aparecem em contato com poeira, perfume, mofo ou pelo de animal?",
      "A secreção é clara ou espessa/colorida?",
      "Tem coceira no nariz, olhos ou garganta?",
      "É recorrente ou começou agora?",
    ],
    sinaisAlerta: [
      "Febre alta",
      "Dor facial forte",
      "Secreção purulenta persistente",
      "Falta de ar",
    ],
    indicacoes: [
      "Anti-histamínicos",
      "Soro fisiológico nasal",
      "Corticoide nasal quando indicado",
    ],
    posologia: [
      "Loratadina 10mg: 10 mg/dia VO.",
      "Fexofenadina: 120 ou 180 mg VO 1x/dia ou 60 mg VO 2x/dia.",
      "Dexclorfeniramina 2mg: 2 mg VO 3 a 4x/dia.",
      "Soro hipertônico 3%: 1 a 2 instilações várias vezes ao dia.",
    ],
    orientacoes: [
      "Evitar poeira, mofo, fumaça e perfumes fortes.",
      "Lavar nariz com soro.",
      "Manter ambiente limpo e ventilado.",
    ],
    vendas: [
      "Soro fisiológico",
      "Lenços",
      "Umidificador",
      "Lavador nasal",
      "Pomada descongestionante",
    ],
  },
  {
    id: "sinusite",
    titulo: "Sinusite",
    grupo: "Respiratório",
    cor: "indigo",
    sintomas: [
      "sinusite",
      "dor no rosto",
      "pressão no rosto",
      "dor na testa",
      "dor nos olhos",
      "secreção amarela",
      "secrecao amarela",
      "secreção verde",
      "secrecao verde",
      "nariz entupido",
    ],
    resumo:
      "Inflamação ou infecção dos seios da face, podendo ocorrer após resfriado, alergia ou irritação.",
    anamnese: [
      "Sente dor ou pressão na testa, olhos ou bochechas?",
      "A secreção é espessa e amarelada/esverdeada ou clara?",
      "Teve resfriado recente que piorou depois de alguns dias?",
      "Tem dor de cabeça persistente, cansaço ou febre baixa?",
    ],
    sinaisAlerta: [
      "Febre alta",
      "Dor facial intensa",
      "Inchaço ao redor dos olhos",
      "Rigidez na nuca",
      "Piora importante",
    ],
    indicacoes: [
      "Soro fisiológico para lavagem nasal",
      "Anti-inflamatórios quando apropriado",
      "Descongestionantes conforme avaliação",
      "Antibiótico somente com orientação médica",
    ],
    posologia: [
      "Ibuprofeno gotas 100mg/mL: conforme idade/peso e bula.",
      "Soro fisiológico: lavagem nasal conforme necessidade.",
      "Mometasona spray nasal: conforme orientação profissional/bula.",
    ],
    orientacoes: [
      "Evitar mudanças bruscas de temperatura.",
      "Evitar substâncias irritantes.",
      "Fazer inalação/lavagem com soro fisiológico se necessário.",
      "Encaminhar se quadro for forte, recorrente ou com sinais sistêmicos.",
    ],
    vendas: [
      "Soro fisiológico",
      "Lenços",
      "Nebulizador",
      "Lavador nasal",
      "Suplementos",
      "Pomada descongestionante",
    ],
  },
  {
    id: "alergia_pele",
    titulo: "Alergias de pele",
    grupo: "Pele e mucosas",
    cor: "rose",
    sintomas: [
      "alergia na pele",
      "coceira",
      "vermelhidão",
      "urticária",
      "urticaria",
      "irritação",
      "irritacao",
      "mancha vermelha",
      "pele coçando",
    ],
    resumo:
      "Reações inflamatórias da pele ligadas a alimentos, medicamentos, produtos químicos, picadas, cosméticos ou tecidos.",
    anamnese: [
      "Há quanto tempo percebeu a reação?",
      "Teve contato com produto, alimento, medicamento, tecido ou substância diferente?",
      "Piora com calor, frio, sol ou em algum horário?",
      "Tem inchaço, falta de ar ou sintomas em outras partes do corpo?",
    ],
    sinaisAlerta: [
      "Falta de ar",
      "Inchaço em face, boca ou garganta",
      "Urticária extensa",
      "Sinais sistêmicos",
      "Reação após medicamento",
    ],
    indicacoes: [
      "Anti-histamínicos orais ou tópicos",
      "Hidratantes e regeneradores",
      "Sabonetes neutros",
    ],
    posologia: [
      "Hidroxizina 25mg: 25 mg VO de 6/6h ou 8/8h por até 10 dias.",
      "Dexclorfeniramina 2mg: 2 mg VO 3 a 4x/dia ou 6 mg VO 2x/dia.",
      "Cetirizina 10mg: 10 mg/dia VO.",
      "Crianças: avaliar idade, peso, apresentação e bula.",
    ],
    orientacoes: [
      "Evitar produtos irritantes e materiais de limpeza.",
      "Usar hidratantes e sabonetes neutros.",
      "Evitar banho quente.",
      "Manter hidratação.",
    ],
    vendas: [
      "Hidratantes",
      "Sabonetes neutros",
      "Produtos hipoalergênicos",
      "Regeneradores",
    ],
  },
  {
    id: "herpes_labial",
    titulo: "Herpes labial",
    grupo: "Pele e mucosas",
    cor: "red",
    sintomas: [
      "herpes",
      "herpes labial",
      "bolha na boca",
      "ferida na boca",
      "ardência no lábio",
      "ardencia no labio",
      "formigamento no lábio",
    ],
    resumo:
      "Infecção viral com bolhas dolorosas na região da boca ou ao redor dela, contagiosa e recorrente.",
    anamnese: [
      "Quando as lesões apareceram e como começaram?",
      "Começou com coceira, ardência ou formigamento?",
      "São bolhas agrupadas com líquido que viram feridas?",
      "Teve febre, dor ou mal-estar?",
      "Já teve episódios semelhantes?",
    ],
    sinaisAlerta: [
      "Lesões extensas",
      "Imunidade baixa",
      "Lesão próxima aos olhos",
      "Febre importante",
      "Criança pequena",
    ],
    indicacoes: [
      "Antivirais tópicos",
      "Analgésico/antitérmico se houver dor ou febre",
      "Hidratação labial",
    ],
    posologia: [
      "Aciclovir tópico: aplicar sobre lesões 5x/dia, de 4/4h, suspendendo no período noturno.",
      "Penciclovir tópico: pequena quantidade na área afetada em intervalos de aproximadamente 2h por 4 dias.",
      "Aciclovir 200mg: 200 a 400 mg VO 4x/dia conforme orientação/bula.",
    ],
    orientacoes: [
      "Evitar exposição ao sol.",
      "Evitar compartilhar copos, batons e itens de contato com a boca.",
      "Evitar tocar nas lesões.",
      "Lavar as mãos após contato.",
    ],
    vendas: [
      "Protetor labial com FPS",
      "Hidratante labial",
      "Itens de limpeza da região",
      "Suplementos para imunidade",
    ],
  },
  {
    id: "queimadura_solar",
    titulo: "Queimadura solar",
    grupo: "Pele e mucosas",
    cor: "orange",
    sintomas: [
      "queimadura solar",
      "queimou no sol",
      "pele vermelha",
      "ardência na pele",
      "ardencia na pele",
      "bolha de sol",
      "insolação",
      "insolacao",
    ],
    resumo:
      "Lesão por exposição solar, com vermelhidão, sensibilidade, coceira, calor local e, em casos graves, bolhas.",
    anamnese: [
      "Quanto tempo ficou no sol e em qual horário?",
      "A pele está só vermelha ou surgiram bolhas?",
      "Tem ardência, dor ao tocar ou coceira?",
      "Tem dor de cabeça, febre ou calafrios?",
    ],
    sinaisAlerta: [
      "Bolhas extensas",
      "Febre",
      "Calafrios",
      "Dor de cabeça importante",
      "Sinais de insolação",
      "Criança pequena",
    ],
    indicacoes: [
      "Hidratantes e pós-sol",
      "Analgésicos/antitérmicos",
      "Cremes/loções para aliviar irritação conforme avaliação",
    ],
    posologia: [
      "Hidrocortisona 1%: camada fina 3 a 4x/dia até melhora, se apropriado.",
      "Paracetamol 750mg: 1 comprimido VO 3x/dia.",
      "Pomadas: aplicar camada fina conforme bula/orientação.",
    ],
    orientacoes: [
      "Manter hidratação.",
      "Compressas frias.",
      "Não estourar bolhas.",
      "Banhos frios.",
      "Evitar nova exposição solar.",
    ],
    vendas: [
      "Pós-sol",
      "Hidratante",
      "Protetor solar",
      "Bolsa térmica",
      "Água termal",
    ],
  },
  {
    id: "candidiase",
    titulo: "Candidíase vaginal",
    grupo: "Pele e mucosas",
    cor: "fuchsia",
    sintomas: [
      "candidíase",
      "candidiase",
      "coceira vaginal",
      "corrimento branco",
      "corrimento espesso",
      "ardência ao urinar",
      "ardencia ao urinar",
      "dor na relação",
    ],
    resumo:
      "Infecção causada por Candida, com coceira intensa, inflamação e corrimento branco espesso.",
    anamnese: [
      "Há coceira intensa?",
      "O corrimento é branco e espesso?",
      "Tem dor ao urinar ou durante relação sexual?",
      "É recorrente?",
      "Está gestante ou imunossuprimida?",
    ],
    sinaisAlerta: [
      "Gestante",
      "Dor pélvica",
      "Febre",
      "Corrimento com mau cheiro intenso",
      "Sangramento",
      "Recorrência frequente",
    ],
    indicacoes: [
      "Antifúngicos ginecológicos",
      "Fluconazol conforme avaliação e restrições",
      "Encaminhar em casos de alerta",
    ],
    posologia: [
      "Nistatina ginecológica: conforme apresentação e bula.",
      "Miconazol ginecológico: conforme apresentação e bula.",
      "Clotrimazol ginecológico: conforme apresentação e bula.",
      "Fluconazol 150mg: uso conforme avaliação e restrições.",
    ],
    orientacoes: [
      "Evitar relações sexuais durante tratamento.",
      "Evitar absorventes por tempo prolongado.",
      "Evitar excesso de açúcar.",
      "Sugerir testes de IST quando indicado.",
    ],
    vendas: [
      "Produtos de higiene íntima",
      "Probióticos",
      "Suplementos para imunidade",
    ],
  },
];

const sinaisGlobais = [
  "falta de ar",
  "dor no peito",
  "convuls",
  "desmaio",
  "lábios roxos",
  "labios roxos",
  "sangue",
  "sangramento",
  "febre alta",
  "rigidez na nuca",
  "confusão mental",
  "confusao mental",
  "inchaço na garganta",
  "inchaco na garganta",
  "gestante",
  "bebe",
  "bebê",
  "criança pequena",
  "crianca pequena",
];

function gerarQuiz() {
  const perguntasSintomas = baseClinica.map((item, index) => {
    const erradas = baseClinica
      .filter((outro) => outro.id !== item.id)
      .slice(index % 3, index % 3 + 3)
      .map((outro) => outro.titulo);

    const opcoes = embaralhar([item.titulo, ...erradas]).slice(0, 4);

    return {
      id: `sintoma-${item.id}`,
      tipo: "Identificação",
      pergunta: `Cliente relata: "${item.sintomas.slice(0, 3).join(", ")}". Qual situação combina melhor?`,
      resposta: item.titulo,
      opcoes,
      explicacao: item.resumo,
    };
  });

  const perguntasAlerta = baseClinica.map((item, index) => {
    const resposta = item.sinaisAlerta[0];
    const distratores = [
      "Beber água",
      "Coriza clara isolada",
      "Leve coceira sem piora",
      "Sintoma leve há poucas horas",
      "Ambiente seco",
    ];

    const opcoes = embaralhar([
      resposta,
      distratores[index % distratores.length],
      distratores[(index + 1) % distratores.length],
      distratores[(index + 2) % distratores.length],
    ]);

    return {
      id: `alerta-${item.id}`,
      tipo: "Segurança",
      pergunta: `Em ${item.titulo}, qual item é sinal de alerta para encaminhar?`,
      resposta,
      opcoes,
      explicacao: `Sinais de alerta: ${item.sinaisAlerta.join(", ")}.`,
    };
  });

  return embaralhar([...perguntasSintomas, ...perguntasAlerta]);
}

function Doutor() {
  const [modo, setModo] = useState("amsi");
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("resumo");
  const [toast, setToast] = useState(null);

  const [quiz, setQuiz] = useState(() => gerarQuiz());
  const [quizIndex, setQuizIndex] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState("");
  const [quizRespondido, setQuizRespondido] = useState(false);
  const [acertos, setAcertos] = useState(0);

  const condicoesFiltradas = useMemo(() => {
    const t = normalizar(texto);

    if (!t) return baseClinica;

    return baseClinica
      .map((item) => ({
        ...item,
        score: calcularScore(t, item),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [texto]);

  const perguntaAtual = quiz[quizIndex];

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });

    if (navigator.vibrate) navigator.vibrate(25);

    setTimeout(() => setToast(null), 2600);
  }

  function analisar() {
    setErro("");
    setAba("resumo");

    if (!texto.trim()) {
      setErro("Descreva o que o cliente relatou ou toque em uma situação rápida.");
      return;
    }

    const t = normalizar(texto);
    const alertas = sinaisGlobais.filter((s) => t.includes(normalizar(s)));

    if (alertas.length > 0) {
      setResultado({
        nivel: "grave",
        titulo: "Sinal de alerta detectado",
        mensagem:
          "Não seguir com recomendação de produto. Orientar atendimento médico urgente ou avaliação farmacêutica responsável.",
        alertas,
        condicoes: condicoesFiltradas.slice(0, 3),
      });
      return;
    }

    if (!condicoesFiltradas.length) {
      setResultado({
        nivel: "indefinido",
        titulo: "Categoria não identificada",
        mensagem:
          "Faça perguntas extras antes de sugerir qualquer produto. Use o modo estudo para consultar situações comuns.",
        alertas: [],
        condicoes: [],
      });
      return;
    }

    setResultado({
      nivel: "ok",
      titulo: "Possíveis situações encontradas",
      mensagem:
        "Use anamnese, confira sinais de alerta e avalie opções de balcão conforme perfil do cliente, bula e orientação profissional.",
      alertas: [],
      condicoes: condicoesFiltradas.slice(0, 3),
    });
  }

  function analisarRapido(item) {
    setTexto(item.titulo);
    setResultado({
      nivel: "ok",
      titulo: "Modo estudo aberto",
      mensagem:
        "Use esse card para estudar anamnese, opções de balcão, posologia, orientações e vendas adicionais.",
      alertas: [],
      condicoes: [item],
    });
    setAba("resumo");
    setModo("amsi");
  }

  function limpar() {
    setTexto("");
    setResultado(null);
    setErro("");
    setAba("resumo");
  }

  async function copiarOrientacao() {
    const condicao = resultado?.condicoes?.[0];

    if (!condicao) {
      mostrarToast("Abra uma situação antes de copiar 😅", "erro");
      return;
    }

    const textoCopiar = montarOrientacao(condicao);

    try {
      await navigator.clipboard.writeText(textoCopiar);
      mostrarToast("Orientação copiada 📋", "ok");
    } catch {
      mostrarToast("Não consegui copiar automaticamente 😕", "erro");
    }
  }

  function responderQuiz(opcao) {
    if (quizRespondido) return;

    setRespostaSelecionada(opcao);
    setQuizRespondido(true);

    if (opcao === perguntaAtual.resposta) {
      setAcertos((prev) => prev + 1);
      mostrarToast("Acertou, chef 🧠", "ok");
    } else {
      mostrarToast("Quase! Olha a explicação 👀", "erro");
    }
  }

  function proximaPergunta() {
    if (quizIndex >= quiz.length - 1) {
      reiniciarQuiz();
      return;
    }

    setQuizIndex((prev) => prev + 1);
    setRespostaSelecionada("");
    setQuizRespondido(false);
  }

  function reiniciarQuiz() {
    setQuiz(gerarQuiz());
    setQuizIndex(0);
    setRespostaSelecionada("");
    setQuizRespondido(false);
    setAcertos(0);
  }

  const condicaoPrincipal = resultado?.condicoes?.[0];
  const progressoQuiz = quiz.length ? Math.round(((quizIndex + 1) / quiz.length) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FundoBolhas variant="rose" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl p-4 pb-32 text-gray-950 dark:text-white">
        <HeaderAmsi
          modo={modo}
          setModo={setModo}
          totalCasos={baseClinica.length}
          acertos={acertos}
          quizIndex={quizIndex}
        />

        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/90 p-4 text-amber-800 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex gap-3">
            <AlertTriangle size={22} className="shrink-0" />
            <p className="text-sm">
              A AMSI é apoio de estudo e balcão. Não substitui avaliação profissional, prescrição, protocolos internos, bula ou encaminhamento quando houver sinal de alerta.
            </p>
          </div>
        </div>

        {modo === "amsi" && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
              <label className="mb-2 flex items-center gap-2 text-sm font-black text-gray-700 dark:text-gray-300">
                <ClipboardList size={17} className="text-cyan-600" />
                Pergunte ou descreva o relato
              </label>

              <textarea
                rows={5}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setResultado(null);
                  setErro("");
                }}
                placeholder="Ex: qual medicamento é ideal para gripe em adulto? / tosse cheia com catarro / coceira na pele..."
                className="w-full resize-none rounded-3xl border border-transparent bg-gray-100 p-4 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 dark:bg-white/5 dark:text-white"
              />

              <AnimatePresence>
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300"
                  >
                    <AlertTriangle size={18} />
                    {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={analisar}
                  className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-black text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 active:scale-95 md:col-span-2"
                >
                  <Send size={18} />
                  Analisar com AMSI
                </button>

                <button
                  type="button"
                  onClick={limpar}
                  className="flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white font-black text-gray-700 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
                >
                  <RotateCcw size={18} />
                  Limpar
                </button>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-black text-gray-600 dark:text-gray-300">
                  Situações rápidas
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {baseClinica.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => analisarRapido(item)}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:scale-[1.01] active:scale-95 dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="font-black">{item.titulo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.grupo}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              {!resultado && <CardVazio />}

              {resultado && <PainelResultado resultado={resultado} />}

              {condicaoPrincipal && (
                <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      ["resumo", "Resumo"],
                      ["anamnese", "Anamnese"],
                      ["indicacoes", "Opções"],
                      ["orientacoes", "Orientações"],
                      ["estudo", "Estudo"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAba(id)}
                        className={`rounded-full px-4 py-2 text-xs font-black transition active:scale-95 ${
                          aba === id
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <ConteudoCondicao condicao={condicaoPrincipal} aba={aba} />

                  <button
                    type="button"
                    onClick={copiarOrientacao}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-black text-white shadow-lg shadow-cyan-600/20 transition active:scale-95"
                  >
                    <Copy size={18} />
                    Copiar orientação
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}

        {modo === "quiz" && (
          <QuizAmsi
            pergunta={perguntaAtual}
            quizIndex={quizIndex}
            total={quiz.length}
            progresso={progressoQuiz}
            acertos={acertos}
            respondido={quizRespondido}
            selecionada={respostaSelecionada}
            responder={responderQuiz}
            proxima={proximaPergunta}
            reiniciar={reiniciarQuiz}
          />
        )}

        {modo === "biblioteca" && (
          <BibliotecaAmsi
            itens={baseClinica}
            pesquisar={texto}
            setPesquisar={setTexto}
            filtrados={condicoesFiltradas}
            abrir={analisarRapido}
          />
        )}

        {resultado?.nivel === "ok" && resultado.condicoes?.length > 1 && modo === "amsi" && (
          <div className="mt-5 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
            <h2 className="mb-3 text-lg font-black">Outras possibilidades encontradas</h2>

            <div className="grid gap-3 md:grid-cols-2">
              {resultado.condicoes.slice(1).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => analisarRapido(item)}
                  className="rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:scale-[1.01] dark:border-white/10 dark:bg-white/5"
                >
                  <p className="font-black">{item.titulo}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.resumo}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderAmsi({ modo, setModo, totalCasos, acertos, quizIndex }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-black/5 backdrop-blur-2xl dark:border-white/10 dark:bg-gray-950/75">
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-blue-800 to-slate-950 p-6 text-white">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-cyan-300/10" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
            <Brain size={34} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-50">
              <Sparkles size={13} />
              AMSI
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              Assistente + Quiz
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-cyan-100">
              Busque situações, estude medicamentos e treine decisões de balcão com segurança primeiro.
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <ResumoTopo label="Casos" valor={totalCasos} />
          <ResumoTopo label="Quiz" valor={`${acertos}/${quizIndex}`} />
          <ResumoTopo label="Modo" valor={modo === "amsi" ? "AMSI" : modo === "quiz" ? "Quiz" : "Base"} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-2">
        <ModoBotao
          ativo={modo === "amsi"}
          onClick={() => setModo("amsi")}
          icon={Bot}
          label="AMSI"
        />

        <ModoBotao
          ativo={modo === "quiz"}
          onClick={() => setModo("quiz")}
          icon={Gamepad2}
          label="Quiz"
        />

        <ModoBotao
          ativo={modo === "biblioteca"}
          onClick={() => setModo("biblioteca")}
          icon={LibraryBig}
          label="Base"
        />
      </div>
    </div>
  );
}

function ModoBotao({ ativo, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex h-12 items-center justify-center gap-2 rounded-2xl font-black transition active:scale-95
        ${
          ativo
            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        }
      `}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function PainelResultado({ resultado }) {
  const grave = resultado.nivel === "grave";
  const indefinido = resultado.nivel === "indefinido";

  return (
    <div
      className={`rounded-[2rem] border p-5 shadow-xl shadow-black/5 ${
        grave
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          : indefinido
          ? "border-gray-200 bg-white/90 text-gray-700 dark:border-white/10 dark:bg-gray-950/75 dark:text-gray-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
          {grave ? <ShieldAlert size={26} /> : <Stethoscope size={26} />}
        </div>

        <div>
          <p className="text-xs font-black uppercase opacity-70">Resultado</p>
          <h2 className="text-xl font-black">{resultado.titulo}</h2>
        </div>
      </div>

      <p className="text-sm font-bold">{resultado.mensagem}</p>

      {resultado.alertas?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resultado.alertas.map((a) => (
            <span
              key={a}
              className="rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-black/20"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {resultado.condicoes?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resultado.condicoes.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-black/20"
            >
              {c.titulo}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ConteudoCondicao({ condicao, aba }) {
  if (aba === "anamnese") {
    return (
      <Secao
        titulo="Perguntas de anamnese"
        icon={HelpCircle}
        itens={condicao.anamnese}
      />
    );
  }

  if (aba === "indicacoes") {
    return (
      <div className="space-y-4">
        <Secao titulo="Opções/classes de balcão" icon={Pill} itens={condicao.indicacoes} />
        <Secao titulo="Posologias de referência" icon={ClipboardList} itens={condicao.posologia} />
      </div>
    );
  }

  if (aba === "orientacoes") {
    return (
      <div className="space-y-4">
        <Secao titulo="Orientações farmacêuticas" icon={Lightbulb} itens={condicao.orientacoes} />
        <Secao titulo="Venda complementar" icon={ShoppingBasket} itens={condicao.vendas} />
      </div>
    );
  }

  if (aba === "estudo") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl bg-cyan-50 p-4 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen size={20} />
            <h3 className="font-black">Como estudar esse caso</h3>
          </div>

          <p className="text-sm">
            Identifique o padrão dos sintomas, faça anamnese, procure sinais de alerta e só depois avalie opções de suporte conforme perfil do cliente e bula.
          </p>
        </div>

        <Secao titulo="Sinais de alerta" icon={ShieldAlert} itens={condicao.sinaisAlerta} />
        <Secao titulo="Resumo clínico" icon={Sparkles} itens={[condicao.resumo]} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gray-50 p-4 dark:bg-white/5">
        <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {condicao.grupo}
        </p>

        <h2 className="mt-1 text-2xl font-black">{condicao.titulo}</h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {condicao.resumo}
        </p>
      </div>

      <Secao titulo="Antes de indicar, descarte sinais de alerta" icon={ShieldAlert} itens={condicao.sinaisAlerta} />
    </div>
  );
}

function QuizAmsi({
  pergunta,
  quizIndex,
  total,
  progresso,
  acertos,
  respondido,
  selecionada,
  responder,
  proxima,
  reiniciar,
}) {
  if (!pergunta) return null;

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
              {pergunta.tipo}
            </p>

            <h2 className="mt-1 text-xl font-black">
              Pergunta {quizIndex + 1} de {total}
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white">
            <Gamepad2 size={23} />
          </div>
        </div>

        <div className="mb-5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-600 transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <div className="rounded-3xl bg-gray-50 p-4 dark:bg-white/5">
          <p className="text-lg font-black">{pergunta.pergunta}</p>
        </div>

        <div className="mt-4 grid gap-3">
          {pergunta.opcoes.map((opcao) => {
            const correta = opcao === pergunta.resposta;
            const marcada = opcao === selecionada;

            return (
              <button
                key={opcao}
                type="button"
                onClick={() => responder(opcao)}
                disabled={respondido}
                className={`
                  rounded-2xl border p-4 text-left font-black transition active:scale-[0.98]
                  ${
                    respondido && correta
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : respondido && marcada && !correta
                      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  }
                `}
              >
                {opcao}
              </button>
            );
          })}
        </div>

        {respondido && (
          <div className="mt-5 rounded-3xl bg-cyan-50 p-4 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
            <p className="font-black">Explicação</p>
            <p className="mt-1 text-sm">{pergunta.explicacao}</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={proxima}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-black text-white shadow-lg shadow-cyan-600/20 transition active:scale-95"
          >
            <Target size={18} />
            Próxima
          </button>

          <button
            type="button"
            onClick={reiniciar}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gray-100 font-black text-gray-700 transition active:scale-95 dark:bg-white/10 dark:text-gray-200"
          >
            <RefreshCcw size={18} />
            Reiniciar
          </button>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
          <Trophy size={30} />
        </div>

        <h2 className="mt-4 text-xl font-black">Placar AMSI</h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniPlacar label="Acertos" valor={acertos} />
          <MiniPlacar label="Pergunta" valor={quizIndex + 1} />
          <MiniPlacar label="Total" valor={total} />
          <MiniPlacar label="Progresso" valor={`${progresso}%`} />
        </div>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          A ideia é brincar e aprender: errar aqui é barato, acertar no balcão é ouro.
        </p>
      </aside>
    </div>
  );
}

function BibliotecaAmsi({ pesquisar, setPesquisar, filtrados, abrir }) {
  return (
    <div className="mt-5 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <LibraryBig size={22} />
            Biblioteca AMSI
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pesquise sintomas, situações ou temas para estudar.
          </p>
        </div>

        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
          {filtrados.length}
        </span>
      </div>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

        <input
          value={pesquisar}
          onChange={(e) => setPesquisar(e.target.value)}
          placeholder="Buscar: gripe, tosse, alergia, herpes..."
          className="h-13 h-[52px] w-full rounded-2xl border border-gray-200 bg-gray-100 pl-12 pr-4 font-bold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtrados.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => abrir(item)}
            className="rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:scale-[1.01] active:scale-95 dark:border-white/10 dark:bg-white/5"
          >
            <p className="text-xs font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
              {item.grupo}
            </p>

            <h3 className="mt-1 text-lg font-black">{item.titulo}</h3>

            <p className="mt-2 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
              {item.resumo}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Secao({ titulo, icon: Icon, itens }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-600 text-white">
          <Icon size={18} />
        </div>

        <h3 className="font-black">{titulo}</h3>
      </div>

      <div className="space-y-2">
        {itens.map((item, i) => (
          <div
            key={`${item}-${i}`}
            className="flex gap-2 rounded-2xl bg-gray-50 p-3 text-sm dark:bg-white/5"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-cyan-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardVazio() {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/75">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
        <Sparkles size={30} />
      </div>

      <h2 className="mt-4 text-xl font-black">Pronto para estudar ou atender</h2>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Digite uma pergunta, descreva o relato do cliente ou escolha uma situação rápida.
      </p>
    </div>
  );
}

function MiniPlacar({ label, valor }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 text-center dark:bg-white/5">
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function ResumoTopo({ label, valor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <p className="truncate text-lg font-black">{valor}</p>
      <p className="text-xs text-cyan-100">{label}</p>
    </div>
  );
}

function Toast({ toast, fechar }) {
  const erro = toast.tipo === "erro";

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="fixed left-1/2 top-5 z-[99999] w-[92%] max-w-sm -translate-x-1/2"
    >
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
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${
            erro ? "bg-red-500" : "bg-emerald-600"
          }`}
        >
          {erro ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
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
    </motion.div>
  );
}

function calcularScore(texto, item) {
  let score = 0;

  item.sintomas.forEach((s) => {
    if (texto.includes(normalizar(s))) score += 3;
  });

  if (texto.includes(normalizar(item.titulo))) score += 5;
  if (texto.includes(normalizar(item.grupo))) score += 1;

  const palavras = normalizar(item.titulo).split(/\s+/);

  palavras.forEach((palavra) => {
    if (palavra.length > 3 && texto.includes(palavra)) score += 1;
  });

  return score;
}

function montarOrientacao(condicao) {
  return [
    `AMSI - ${condicao.titulo}`,
    "",
    `Resumo: ${condicao.resumo}`,
    "",
    "Perguntas importantes:",
    ...condicao.anamnese.map((item) => `- ${item}`),
    "",
    "Sinais de alerta:",
    ...condicao.sinaisAlerta.map((item) => `- ${item}`),
    "",
    "Opções/classes de balcão:",
    ...condicao.indicacoes.map((item) => `- ${item}`),
    "",
    "Posologias de referência:",
    ...condicao.posologia.map((item) => `- ${item}`),
    "",
    "Orientações:",
    ...condicao.orientacoes.map((item) => `- ${item}`),
    "",
    "Observação: usar como apoio. Conferir perfil do cliente, contraindicações, bula e orientação profissional.",
  ].join("\n");
}

function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function embaralhar(lista) {
  return [...lista]
    .map((valor) => ({ valor, ordem: Math.random() }))
    .sort((a, b) => a.ordem - b.ordem)
    .map((item) => item.valor);
}

export default Doutor;
