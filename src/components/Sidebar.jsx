function Sidebar({ setPagina }) {
  return (
    <div className="w-60 h-full bg-white shadow-lg p-4 rounded-r-2xl hidden md:block">
      <h2 className="text-xl font-bold mb-6">Farmácia 💊</h2>

      <nav className="space-y-3">
        <button onClick={() => setPagina("medicamentos")} className="w-full text-left p-2 rounded-xl hover:bg-gray-100">💊 Medicamentos</button>
        <button onClick={() => setPagina("receitas")} className="w-full text-left p-2 rounded-xl hover:bg-gray-100">📄 Receitas</button>
        <button onClick={() => setPagina("posologia")} className="w-full text-left p-2 rounded-xl hover:bg-gray-100">⚖️ Posologia</button>
        <button onClick={() => setPagina("doutor")} className="w-full text-left p-2 rounded-xl hover:bg-gray-100">🤖 Doutor</button>
      </nav>
    </div>
  );
}

export default Sidebar;