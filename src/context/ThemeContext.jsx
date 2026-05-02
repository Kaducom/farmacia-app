import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {

  // 🔥 pega tema salvo imediatamente
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  // 🔥 aplica ANTES da tela pintar
  useLayoutEffect(() => {

    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);

  }, [theme]);

  function toggleTheme() {
    setTheme((prev) =>
      prev === "dark"
        ? "light"
        : "dark"
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}