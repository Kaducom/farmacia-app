import {
  Bell,
  Brain,
  Crown,
  Download,
  Map,
  ScanBarcode,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import FundoBolhas from "../../components/FundoBolhas";
import { ActionCard, BackHeader, EmptyState, PageShell, SectionTitle } from "./components/MenuShared";

const ferramentasAdmin = [
  {
    titulo: "Base Produtos",
    descricao: "Produtos aprendidos pelo scanner e consulta global.",
    icon: ScanBarcode,
    pagina: "baseProdutos",
    destaque: "from-orange-600 to-amber-500",
  },
  {
    titulo: "Mapeamentos",
    descricao: "Histórico de contagens e conferências.",
    icon: Map,
    pagina: "mapeamentos",
    destaque: "from-slate-700 to-slate-500",
  },
  {
    titulo: "Notificações",
    descricao: "Alertas, lembretes e avisos futuros.",
    icon: Bell,
    pagina: "notificacoes",
    destaque: "from-pink-600 to-rose-500",
  },
  {
    titulo: "Backup",
    descricao: "Exportar dados locais e conferir segurança.",
    icon: Download,
    pagina: "backup",
    destaque: "from-green-700 to-lime-500",
  },
  {
    titulo: "Academia AMSI",
    descricao: "Área de estudo, treino e assistente interno.",
    icon: Brain,
    pagina: "doutor",
    destaque: "from-cyan-700 to-blue-500",
  },
];

function MenuMaster({ setPagina }) {
  const { isAdmin } = useAuth();

  return (
    <PageShell>
      <FundoBolhas variant="emerald" />

      <BackHeader
        icon={Crown}
        title="Central Master"
        description="Ferramentas administrativas em páginas separadas"
        setPagina={setPagina}
      />

      <main className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 pb-32">
        {!isAdmin ? (
          <EmptyState
            icon={ShieldAlert}
            title="Acesso restrito"
            description="Essa área aparece apenas para administradores."
          />
        ) : (
          <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
            <SectionTitle
              icon={Crown}
              title="Ferramentas do administrador"
              description="Acesso rápido às áreas de controle sem poluir o menu inicial."
            />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ferramentasAdmin.map((acao) => (
                <ActionCard
                  key={acao.pagina}
                  {...acao}
                  compact
                  onClick={() => setPagina(acao.pagina)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}

export default MenuMaster;
