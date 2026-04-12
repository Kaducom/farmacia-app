function Notificacao({ mensagem, tipo = "alerta" }) {
  const cor =
    tipo === "alerta"
      ? "bg-yellow-500"
      : tipo === "erro"
      ? "bg-red-500"
      : "bg-green-500";

  return (
    <div className={`fixed top-4 right-4 ${cor} text-white px-4 py-3 rounded-xl shadow-lg animate-bounce z-50`}>
      {mensagem}
    </div>
  );
}

export default Notificacao;