import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🔥 APLICA TEMA ANTES DE TUDO
const tema = localStorage.getItem("tema");
if (tema === "dark") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
