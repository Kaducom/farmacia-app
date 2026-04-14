import { useState } from "react";

function Menu() {
  const [dark, setDark] = useState(false);

  function toggleDark() {
    setDark(!dark);

    document.documentElement.classList.toggle("dark");

    if (navigator.vibrate) navigator.vibrate(20);
  }

  return (
    <div className="p-4 space-y-4">

      {/* 👤 PERFIL */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
        <p className="font-semibold text-lg">👤 Usuário</p>
        <p className="text-sm text-gray-500">Não logado</p>

        <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded-xl">
          Fazer Login
        </button>
      </div>

      {/* 🌙 DARK MODE */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow flex justify-between items-center">
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

      {/* 📊 DASHBOARD */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
        <p className="font-semibold">📊 Dashboard</p>
        <p className="text-sm text-gray-500 mb-2">
          Visão geral dos medicamentos
        </p>

        <button className="w-full bg-purple-500 text-white py-2 rounded-xl">
          Abrir Dashboard
        </button>
      </div>

      {/* ⚙️ FUTURO */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
        <p className="font-semibold">⚙️ Configurações</p>
        <p className="text-sm text-gray-500">
          Mais opções em breve...
        </p>
      </div>

    </div>
  );
}

export default Menu;