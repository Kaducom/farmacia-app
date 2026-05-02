import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

import {
  User,
  LayoutDashboard,
  Settings,
  Moon,
  Bell,
  Shield,
  Database,
  ChevronRight,
  LogOut,
  Pill,
} from "lucide-react";

function Menu() {

  const { theme, toggleTheme } = useTheme();

const dark = theme === "dark";

  // 🌙 aplica dark mode REAL OFICIAL DEFINITIVO ULTRA HD

  

  function CardOpcao({
    icon: Icon,
    titulo,
    descricao,
    danger = false,
  }) {

    return (

      <button
        className={`
          w-full
          flex items-center justify-between
          p-4
          rounded-2xl
          transition-all
          active:scale-[0.98]

          ${
            danger
              ? `
                bg-red-500/10
                hover:bg-red-500/20
                border border-red-500/20
              `
              : `
                bg-gray-100 dark:bg-gray-700/60
                hover:bg-gray-200 dark:hover:bg-gray-700
              `
          }
        `}
      >

        <div className="flex items-center gap-4">

          <div
            className={`
              w-11 h-11
              rounded-xl
              flex items-center justify-center

              ${
                danger
                  ? "bg-red-500 text-white"
                  : "bg-green-700 text-white"
              }
            `}
          >
            <Icon size={20} />
          </div>

          <div className="text-left">

            <p
              className={`
                font-semibold

                ${
                  danger
                    ? "text-red-500"
                    : "text-black dark:text-white"
                }
              `}
            >
              {titulo}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {descricao}
            </p>

          </div>
        </div>

        <ChevronRight
          size={18}
          className="text-gray-400"
        />

      </button>
    );
  }

  return (

    <div className="
      p-4
      pb-32
      max-w-4xl
      mx-auto
      space-y-5
      text-black
      dark:text-white
    ">

      {/* 👤 HEADER PERFIL */}
      <div className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-br
        from-green-700
        to-emerald-900
        p-6
        shadow-2xl
        text-white
      ">

        {/* brilho decorativo */}
        <div className="
          absolute
          -top-10
          -right-10
          w-40
          h-40
          bg-white/10
          rounded-full
        " />

        <div className="relative flex items-center gap-4">

          {/* avatar */}
          <div className="
            w-20 h-20
            rounded-2xl
            bg-white/20
            backdrop-blur-md
            border border-white/20
            flex items-center justify-center
            shadow-xl
          ">
            <User size={36} />
          </div>

          {/* infos */}
          <div className="flex-1">

            <p className="text-2xl font-bold">
              Usuário
            </p>

            <p className="text-sm text-green-100">
              Não conectado
            </p>

            <div className="flex gap-2 mt-3 flex-wrap">

              <span className="
                bg-white/15
                border border-white/10
                text-xs
                px-3 py-1
                rounded-full
                backdrop-blur-sm
              ">
                💊 Farmácia
              </span>

              <span className="
                bg-white/15
                border border-white/10
                text-xs
                px-3 py-1
                rounded-full
                backdrop-blur-sm
              ">
                📦 Estoque
              </span>

            </div>
          </div>
        </div>

        {/* botões */}
        <div className="grid grid-cols-2 gap-3 mt-6">

          <button className="
            bg-white
            text-green-800
            py-3
            rounded-2xl
            font-semibold
            shadow-lg
            active:scale-95
            transition
          ">
            Fazer Login
          </button>

          <button className="
            bg-white/10
            border border-white/20
            backdrop-blur-sm
            py-3
            rounded-2xl
            font-semibold
            active:scale-95
            transition
          ">
            Perfil
          </button>

        </div>
      </div>

      {/* 📊 DASHBOARD */}
      <div className="
        bg-white
        dark:bg-gray-800
        rounded-3xl
        shadow-xl
        p-5
        space-y-4
      ">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-lg font-bold flex items-center gap-2">
              <LayoutDashboard size={20} />
              Dashboard
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dados rápidos do estoque
            </p>

          </div>

          <div className="
            w-14 h-14
            rounded-2xl
            bg-green-700
            text-white
            flex items-center justify-center
            shadow-lg
          ">
            <Pill size={26} />
          </div>

        </div>

        {/* mini stats */}
        <div className="grid grid-cols-2 gap-3">

          <div className="
            bg-gray-100
            dark:bg-gray-700/60
            p-4
            rounded-2xl
          ">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Estoque
            </p>

            <p className="text-2xl font-bold mt-1">
              128
            </p>
          </div>

          <div className="
            bg-gray-100
            dark:bg-gray-700/60
            p-4
            rounded-2xl
          ">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Alertas
            </p>

            <p className="text-2xl font-bold mt-1 text-orange-500">
              4
            </p>
          </div>

        </div>

        <button className="
          w-full
          bg-purple-600
          hover:bg-purple-700
          text-white
          py-3
          rounded-2xl
          font-semibold
          transition
          active:scale-[0.98]
        ">
          Abrir Dashboard
        </button>

      </div>

      {/* ⚙️ CONFIGURAÇÕES */}
      <div className="
        bg-white
        dark:bg-gray-800
        rounded-3xl
        shadow-xl
        p-5
        space-y-3
      ">

        <div>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} />
            Configurações
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ajustes do aplicativo
          </p>

        </div>

        <CardOpcao
          icon={Bell}
          titulo="Notificações"
          descricao="Alertas e avisos"
        />

        <CardOpcao
          icon={Shield}
          titulo="Segurança"
          descricao="Privacidade e proteção"
        />

        <CardOpcao
          icon={Database}
          titulo="Backup"
          descricao="Salvar e restaurar dados"
        />

      </div>

      {/* 🌙 DARK MODE */}
      <div className="
        bg-white
        dark:bg-gray-800
        rounded-3xl
        shadow-xl
        p-5
        flex items-center justify-between
      ">

        <div className="flex items-center gap-3">

          <div className="
            w-12 h-12
            rounded-2xl
            bg-gray-100
            dark:bg-gray-700
            flex items-center justify-center
          ">
            <Moon size={20} />
          </div>

          <div>

            <p className="font-semibold">
              Modo Escuro
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Alternar aparência
            </p>

          </div>
        </div>

       <button
  onClick={toggleTheme}
  className={`
    w-14 h-7
    rounded-full
    transition-all
    flex items-center
    px-1

    ${
      dark
        ? "bg-green-500 justify-end"
        : "bg-gray-400 justify-start"
    }
  `}
>

          <div className="
            w-5 h-5
            rounded-full
            bg-white
            shadow-md
          " />

        </button>

      </div>

      {/* 🚪 SAIR */}
      <div className="
        bg-white
        dark:bg-gray-800
        rounded-3xl
        shadow-xl
        p-5
      ">

        <CardOpcao
          icon={LogOut}
          titulo="Sair da Conta"
          descricao="Encerrar sessão atual"
          danger
        />

      </div>

      {/* footer */}
      <div className="
        text-center
        text-xs
        text-gray-400
        pt-2
      ">
        Farmácia App • build turbo mega deluxe 🚀
      </div>

    </div>
  );
}

export default Menu;