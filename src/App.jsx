import { useState, useEffect } from "react";
import Medicamentos from "./pages/Medicamentos";
import Receitas from "./pages/Receitas";
import Posologia from "./pages/Posologia";
import Doutor from "./pages/Doutor";

function App() {
  const [pagina, setPagina] = useState("medicamentos");
  const [menuAberto, setMenuAberto] = useState(false);

  // 🔥 já inicia correto (SEM useEffect bugado)
  const [dark, setDark] = useState(() => {
  const isDark = localStorage.getItem("tema") === "dark";

  // 👇 APLICA IMEDIATAMENTE (ANTES DO RENDER)
  if (isDark) {
    document.documentElement.classList.add("dark");
  }

  return isDark;
});

  // 🔥 sincroniza com HTML + salva
  useEffect(() => {
  const html = document.documentElement;

  if (dark) {
    html.classList.add("dark");
    localStorage.setItem("tema", "dark");
  } else {
    html.classList.remove("dark");
    localStorage.setItem("tema", "light");
  }
}, [dark]);

  function renderPagina() {
    if (pagina === "medicamentos") return <Medicamentos />;
    if (pagina === "receitas") return <Receitas />;
    if (pagina === "posologia") return <Posologia />;
    if (pagina === "doutor") return <Doutor />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">

      {/* TOPO estilo iPhone */}
      <div className="flex items-center p-4 backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-sm">
        <button
          onClick={() => setMenuAberto(true)}
          className="text-2xl"
        >
          ≡
        </button>

        <h1 className="ml-4 font-semibold text-lg capitalize">
          {pagina}
        </h1>
      </div>

      {/* MENU */}
      {menuAberto && (
        <div className="fixed inset-0 bg-black/40 flex">

          <div className="w-64 h-full bg-white dark:bg-gray-800 p-4 flex flex-col justify-between animate-slideIn">

            {/* LINKS */}
            <div className="flex flex-col gap-3">
              <h2 className="font-bold mb-2">Farmácia 💊</h2>

              {[
                { nome: "medicamentos", label: "Medicamentos" },
                { nome: "receitas", label: "Receitas" },
                { nome: "posologia", label: "Posologia" },
                { nome: "doutor", label: "Doutor" },
              ].map((item) => (
                <button
                  key={item.nome}
                  onClick={() => {
                    setPagina(item.nome);
                    setMenuAberto(false);
                  }}
                  className={`p-2 rounded-full shadow-md transition px-4 text-left
                    ${
                      pagina === item.nome
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 hover:scale-105"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* RODAPÉ */}
            <div>
              <button
  onClick={() => {
    const novoTema = !dark;
    setDark(novoTema);
  }}
  className="w-full p-2 rounded-full shadow-md bg-gray-200 dark:bg-gray-700 transition"
>
  {dark ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
</button>
            </div>
          </div>

          {/* FECHAR */}
          <div
            className="flex-1"
            onClick={() => setMenuAberto(false)}
          />
        </div>
      )}

      {/* CONTEÚDO */}
      <div className="p-4">{renderPagina()}</div>
    </div>
  );
}
export default App;