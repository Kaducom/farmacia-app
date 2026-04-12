import { useState, useEffect } from "react";
import Medicamentos from "./pages/Medicamentos";
import Receitas from "./pages/Receitas";
import Posologia from "./pages/Posologia";
import Doutor from "./pages/Doutor";

function App() {
  const [pagina, setPagina] = useState("medicamentos");
  const [menuAberto, setMenuAberto] = useState(false);
  const [animando, setAnimando] = useState(false);
  const [startX, setStartX] = useState(0);

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

    <div className="min-h-screen flex justify-center bg-black">
  <div className="w-full max-w-md min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">

    <div
  className="p-4 flex-1 pb-20"
  onTouchStart={(e) => setStartX(e.touches[0].clientX)}
  onTouchEnd={(e) => {
    const endX = e.changedTouches[0].clientX;

    if (endX - startX > 80) {
      // swipe → volta pra medicamentos
      setPagina("medicamentos");
    }
  }}
>
  {renderPagina()}
</div>

      {/* TOPO estilo iPhone */}
      <div className="flex items-center px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm">
  <button
    onClick={() => setMenuAberto(true)}
    className="text-xl z-10"
  >
    ☰
  </button>

  <h1 className="flex-1 text-center font-semibold text-lg capitalize">
    {pagina}
  </h1>

  <div className="w-6" />
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
                    setAnimando(true);

setTimeout(() => {
  setPagina(item.nome);
  setAnimando(false);
}, 150);
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
        <div
  className={`p-4 flex-1 ${
    animando ? "animate-exit" : "animate-enter"
  }`}
>
  {renderPagina()}
</div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 flex justify-center">
  <div className="w-full max-w-md bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around py-2">

    {[
      { nome: "medicamentos", icon: "💊" },
      { nome: "receitas", icon: "📄" },
      { nome: "posologia", icon: "⚖️" },
      { nome: "doutor", icon: "🤖" },
    ].map((item) => (
      <button
        key={item.nome}
        onClick={() => setPagina(item.nome)}
        className={`flex flex-col items-center text-xs transition
          ${pagina === item.nome ? "text-blue-500 scale-110" : "text-gray-400"}
        `}
      >
        <span className="text-xl">{item.icon}</span>
        {item.nome}
      </button>
    ))}

  </div>
</div>
    </div>
  );
}
export default App;