import { useEffect, useState } from "react";

export default function ToastStack({ notificacoes, remover }) {
  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2">
      {notificacoes.map((n) => (
        <Toast key={n.id} data={n} remover={remover} />
      ))}
    </div>
  );
}

function Toast({ data, remover }) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => fechar(), 4000);
    return () => clearTimeout(timer);
  }, []);

  function fechar() {
    setSaindo(true);
    setTimeout(() => remover(data.id), 300);
  }

  return (
    <div
      onClick={fechar}
      className={`px-4 py-3 rounded-xl shadow-lg text-white cursor-pointer
        transition-all duration-300
        ${data.tipo === "erro" ? "bg-red-500" : "bg-yellow-500"}
        ${saindo ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      {data.msg}
    </div>
  );
}