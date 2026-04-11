import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Medicamentos from "./pages/Medicamentos";
import Receitas from "./pages/Receitas";
import Posologia from "./pages/Posologia";
import Doutor from "./pages/Doutor";

function App() {
  const [pagina, setPagina] = useState("medicamentos");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar setPagina={setPagina} />


  <div className="flex-1 p-4 md:p-6 overflow-auto">
    {pagina === "medicamentos" && <Medicamentos />}
    {pagina === "receitas" && <Receitas />}
    {pagina === "posologia" && <Posologia />}
    {pagina === "doutor" && <Doutor />}
  </div>
</div>
  );
}

export default App;