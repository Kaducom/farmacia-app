function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex min-w-[58px] flex-col items-center justify-center gap-1
        rounded-2xl px-3 py-2
        text-xs font-bold transition active:scale-95
        ${
          active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }
      `}
    >
      <Icon size={21} />
      {label}
    </button>
  );
}

export default TabButton;
