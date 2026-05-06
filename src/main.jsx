import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";
import App from "./App.jsx";

import { ThemeProvider } from "./context/ThemeContext";

// 🔥 aplica tema antes do React renderizar
const savedTheme =
  localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")).render(
 <ThemeProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</ThemeProvider>
);