import { useState, useEffect } from "react";

function Menu({ setModoAuditoria, relatorioAuditoria = [] }) {
  const [dark, setDark] = useState(false);

  // 🔥 total de problemas
  const totalProblemas = relatorioAuditoria.filter(
    (i) => i.tipo !== "ok"
  ).length;

  // 🌙 aplicar dark mode
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  function toggleDark() {
    setDark((prev) => !prev);

    if (navigator.vibrate) navigator.vibrate(20);
  }

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto text-black dark:text-white space-y-4">

      {/* 👤 PERFIL */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg">
        <p className="font-semibold text-lg">👤 Usuário</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Não logado
        </p>

        <button className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl">
          Fazer Login
        </button>
      </div>

      {/* 🌙 DARK MODE */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex justify-between items-center">
        <span>🌙 Modo escuro</span>

        <button
          onClick={toggleDark}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
            dark ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
              dark ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {/* 📊 AUDITORIA */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-3">

        <div className="flex justify-between items-center">
          <p className="font-semibold">📊 Auditoria</p>

          {totalProblemas > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {totalProblemas}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verificar divergências no estoque
        </p>

        <button
          onClick={() => setModoAuditoria(true)}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-xl"
        >
          Abrir Auditoria
        </button>
      </div>

      {/* 📊 DASHBOARD */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-2">
        <p className="font-semibold">📊 Dashboard</p>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Visão geral dos medicamentos
        </p>

        <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl">
          Abrir Dashboard
        </button>
      </div>

      {/* ⚡ AÇÕES RÁPIDAS */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg space-y-3">
        <p className="font-semibold">⚡ Ações rápidas</p>

        <div className="grid grid-cols-2 gap-2">
          <button className="bg-green-600 text-white py-2 rounded-xl">
            + Medicamento
          </button>

          <button className="bg-purple-600 text-white py-2 rounded-xl">
            Scanner
          </button>

          <button className="bg-blue-600 text-white py-2 rounded-xl">
            Receitas
          </button>

          <button className="bg-gray-700 text-white py-2 rounded-xl">
            Posologia
          </button>
        </div>
      </div>

      {/* ⚙️ CONFIG */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg">
        <p className="font-semibold">⚙️ Configurações</p>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mais opções em breve...
        </p>
      </div>

    </div>
  );
}

export default Menu;