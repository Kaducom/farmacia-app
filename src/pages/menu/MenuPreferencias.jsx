import { Moon, Settings, SunMedium } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import FundoBolhas from "../../components/FundoBolhas";
import { BackHeader, PageShell, SectionTitle } from "./components/MenuShared";

function MenuPreferencias({ setPagina }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <PageShell>
      <FundoBolhas variant="emerald" />

      <BackHeader
        icon={Settings}
        title="Preferências"
        description="Visual, tema e ajustes rápidos do app"
        setPagina={setPagina}
      />

      <main className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 pb-32">
        <section className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
          <SectionTitle
            icon={Settings}
            title="Visual"
            description="Controle rápido do tema. O resto do menu fica leve aqui."
          />

          <div className="rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-white dark:bg-white/10">
                  {dark ? <Moon size={21} /> : <SunMedium size={21} />}
                </div>

                <div className="min-w-0">
                  <p className="font-black">Modo Escuro</p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {dark ? "Visual noturno ativo" : "Visual claro ativo"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-8 w-16 shrink-0 items-center rounded-full px-1 transition-all ${dark ? "justify-end bg-green-500" : "justify-start bg-gray-400"}`}
                aria-label="Alternar tema"
              >
                <div className="h-6 w-6 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          <p className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            Próximos ajustes podem entrar aqui: som do scanner, vibração, tamanho dos cards, ícone do app e preferências de notificação.
          </p>
        </section>
      </main>
    </PageShell>
  );
}

export default MenuPreferencias;
