import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import "./index.css";

function aplicarTemaInicial() {
  const savedTheme = localStorage.getItem("theme") || "dark";

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    return;
  }

  document.documentElement.classList.remove("dark");
}

aplicarTemaInicial();

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);