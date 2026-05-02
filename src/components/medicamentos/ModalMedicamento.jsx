import ToastStack from "../ToastStack";

import {
  ImagePlus,
  Pill,
  Package,
  CalendarDays,
  TriangleAlert,
  Save,
  X,
  Trash2,
} from "lucide-react";

function ModalMedicamento({
  abrirModal,
  setAbrirModal,
  editando,

  imagem,
  setImagem,

  nome,
  setNome,

  quantidade,
  setQuantidade,

  validade,
  setValidade,

  diasRemover,
  setDiasRemover,

  diasPre,
  setDiasPre,

  gerarPreviewDatas,
  salvar,
  handleImagem,

  toasts,
  removerToast,
}) {

  if (!abrirModal) return null;

  /* VALIDA DATA */
  function validarData(data) {

    if (!data || data.length !== 10) {
      return false;
    }

    const [dia, mes, ano] =
      data.split("/").map(Number);

    if (
      dia < 1 ||
      dia > 31 ||
      mes < 1 ||
      mes > 12 ||
      ano < 2024 ||
      ano > 2100
    ) {
      return false;
    }

    const dataObj =
      new Date(ano, mes - 1, dia);

    return (
      dataObj.getDate() === dia &&
      dataObj.getMonth() === mes - 1 &&
      dataObj.getFullYear() === ano
    );
  }

  const preview =
    validarData(validade)
      ? gerarPreviewDatas()
      : null;

  /* SALVAR */
  function handleSalvar() {

    if (!nome.trim()) {
      alert("Digite o nome do medicamento.");
      return;
    }

    if (!validarData(validade)) {
      alert("Digite uma data válida.");
      return;
    }

    salvar();
  }

  return (

    <div className="
      fixed
      inset-0
      z-[999]
      bg-black/50
      backdrop-blur-md
      flex
      items-center
      justify-center
      p-4
    ">

      <div className="
        relative
        w-full
        max-w-md
        max-h-[90vh]
        overflow-hidden
        flex
        flex-col
        rounded-3xl
        bg-white
        dark:bg-[#111827]
        shadow-2xl
      ">

        {/* TOAST */}
        <div className="
          absolute
          top-3
          left-1/2
          -translate-x-1/2
          z-50
          w-[90%]
        ">

          <ToastStack
            notificacoes={toasts}
            remover={removerToast}
          />

        </div>

        {/* HEADER */}
        <div className="
          p-5
          border-b
          border-gray-200
          dark:border-gray-700
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              w-12
              h-12
              rounded-2xl
              bg-green-700
              text-white
              flex
              items-center
              justify-center
              shadow-lg
            ">

              <Pill size={24} />

            </div>

            <div>

              <h2 className="
                text-xl
                font-bold
                text-black
                dark:text-white
              ">

                {editando
                  ? "Editar Medicamento"
                  : "Novo Medicamento"}

              </h2>

              <p className="
                text-sm
                text-gray-500
              ">
                Cadastro do estoque
              </p>

            </div>

          </div>

        </div>

        {/* BODY */}
        <div className="
          flex-1
          overflow-y-auto
          p-5
          space-y-5
        ">

          {/* FOTO */}
          <div>

            <div className="
              flex
              items-center
              gap-2
              mb-2
            ">

              <ImagePlus
                size={16}
                className="text-green-600"
              />

              <label className="
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
              ">
                Foto do Produto
              </label>

            </div>

            {!imagem ? (

              <label className="
                flex
                flex-col
                items-center
                justify-center
                gap-3
                border-2
                border-dashed
                border-green-500/40
                rounded-3xl
                p-8
                cursor-pointer
                bg-gray-50
                dark:bg-gray-800/50
                hover:bg-gray-100
                dark:hover:bg-gray-800
                transition
              ">

                <div className="
                  w-14
                  h-14
                  rounded-2xl
                  bg-green-700
                  text-white
                  flex
                  items-center
                  justify-center
                ">

                  <ImagePlus size={28} />

                </div>

                <div className="text-center">

                  <p className="
                    font-medium
                    text-black
                    dark:text-white
                  ">
                    Adicionar imagem
                  </p>

                  <p className="
                    text-sm
                    text-gray-500
                  ">
                    PNG ou JPG
                  </p>

                </div>

                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleImagem}
                />

              </label>

            ) : (

              <div className="relative">

                <img
                  src={imagem}
                  alt="preview"
                  className="
                    w-full
                    h-52
                    object-cover
                    rounded-3xl
                  "
                />

                <div className="
                  absolute
                  inset-0
                  bg-black/40
                  rounded-3xl
                  flex
                  items-center
                  justify-center
                  gap-3
                ">

                  <label className="
                    bg-white
                    text-black
                    px-4
                    py-2
                    rounded-2xl
                    text-sm
                    cursor-pointer
                    font-medium
                  ">

                    Trocar

                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={handleImagem}
                    />

                  </label>

                  <button
                    onClick={() =>
                      setImagem(null)
                    }

                    className="
                      bg-red-500
                      text-white
                      px-4
                      py-2
                      rounded-2xl
                      text-sm
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <Trash2 size={16} />

                    Remover

                  </button>

                </div>

              </div>

            )}

          </div>

          {/* NOME */}
          <div>

            <div className="
              flex
              items-center
              gap-2
              mb-2
            ">

              <Pill
                size={16}
                className="text-green-600"
              />

              <label className="
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
              ">
                Nome do medicamento
              </label>

            </div>

            <input
              type="text"
              value={nome}

              onChange={(e) =>
                setNome(e.target.value)
              }

              placeholder="Dipirona 500mg"

              maxLength={80}

              className="
                w-full
                p-4
                rounded-2xl
                bg-gray-100
                dark:bg-gray-800
                border
                border-transparent
                focus:border-green-500
                outline-none
                transition
                text-black
                dark:text-white
              "
            />

            <p className="
              mt-2
              text-xs
              text-gray-500
              dark:text-gray-400
            ">
              Nome exibido no estoque
            </p>

          </div>

          {/* QUANTIDADE */}
          <Campo
            icon={Package}
            label="Quantidade"
            type="number"
            value={quantidade}
            onChange={setQuantidade}
            min={1}
            max={9999}
            descricao="Quantidade disponível"
          />

          {/* VALIDADE */}
          <div>

            <div className="
              flex
              items-center
              gap-2
              mb-2
            ">

              <CalendarDays
                size={16}
                className="text-green-600"
              />

              <label className="
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
              ">
                Data de validade
              </label>

            </div>

            <input
              value={validade}

              onChange={(e) => {

                let valor =
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 8);

                if (valor.length >= 5) {

                  valor = valor.replace(
                    /(\d{2})(\d{2})(\d{1,4})/,
                    "$1/$2/$3"
                  );

                }

                else if (valor.length >= 3) {

                  valor = valor.replace(
                    /(\d{2})(\d{1,2})/,
                    "$1/$2"
                  );

                }

                setValidade(valor);
              }}

              placeholder="dd/mm/aaaa"

              className={`
                w-full
                p-4
                rounded-2xl
                outline-none
                transition
                bg-gray-100
                dark:bg-gray-800
                text-black
                dark:text-white

                ${
                  validade &&
                  !validarData(validade)

                    ? "border-2 border-red-500"

                    : `
                      border
                      border-transparent
                      focus:border-green-500
                    `
                }
              `}
            />

            <div className="
              mt-2
              text-xs
              space-y-1
            ">

              <p className="
                text-gray-500
                dark:text-gray-400
              ">
                Exemplo: 25/12/2026
              </p>

              {validade &&
                !validarData(validade) && (

                <p className="
                  text-red-500
                  flex
                  items-center
                  gap-1
                ">

                  <TriangleAlert size={14} />

                  Data inválida

                </p>

              )}

            </div>

          </div>

          {/* REMOVER */}
          <Campo
            icon={Trash2}
            label="Dias antes para remover"
            type="number"
            value={diasRemover}
            onChange={setDiasRemover}
            min={0}
            max={365}
            descricao="Produto sai antes da validade"
          />

          {/* PRE */}
          <Campo
            icon={TriangleAlert}
            label="Pré-vencimento"
            type="number"
            value={diasPre}
            onChange={setDiasPre}
            min={0}
            max={365}
            optional
            descricao="Aviso antecipado"
          />

          {/* PREVIEW */}
          {preview && (

            <div className="
              bg-gray-100
              dark:bg-gray-800
              rounded-3xl
              p-4
              text-sm
              space-y-3
            ">

              <h3 className="
                font-semibold
                text-black
                dark:text-white
              ">
                📅 Preview automático
              </h3>

              <div className="space-y-2">

                <p>
                  📦 Validade:
                  {" "}
                  {preview.validade.toLocaleDateString()}
                </p>

                <p>
                  🗑️ Remover:
                  {" "}
                  {preview.remover.toLocaleDateString()}
                </p>

                {preview.pre && (

                  <p>
                    ⚠️ Pré-vencimento:
                    {" "}
                    {preview.pre.toLocaleDateString()}
                  </p>

                )}

              </div>

            </div>

          )}

        </div>

        {/* FOOTER */}
        <div className="
          p-5
          border-t
          border-gray-200
          dark:border-gray-700
          flex
          gap-3
        ">

          <button
            onClick={() =>
              setAbrirModal(false)
            }

            className="
              flex-1
              py-3
              rounded-2xl
              border
              border-gray-300
              dark:border-gray-600
              font-medium
              flex
              items-center
              justify-center
              gap-2
            "
          >

            <X size={18} />

            Cancelar

          </button>

          <button
            onClick={handleSalvar}

            className="
              flex-1
              py-3
              rounded-2xl
              bg-green-700
              hover:bg-green-800
              text-white
              font-semibold
              transition
              flex
              items-center
              justify-center
              gap-2
            "
          >

            <Save size={18} />

            Salvar

          </button>

        </div>

      </div>

    </div>
  );
}

/* INPUT PADRÃO */
function Campo({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  optional = false,
  descricao,
}) {

  return (

    <div>

      <div className="
        flex
        items-center
        gap-2
        mb-2
      ">

        {Icon && (

          <Icon
            size={16}
            className="text-green-600"
          />

        )}

        <label className="
          text-sm
          font-medium
          text-gray-700
          dark:text-gray-300
        ">
          {label}
        </label>

        {optional && (

          <span className="
            text-[10px]
            px-2
            py-1
            rounded-full
            bg-gray-200
            dark:bg-gray-700
            text-gray-600
            dark:text-gray-300
          ">
            opcional
          </span>

        )}

      </div>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}

        onChange={(e) => {

          let valor = e.target.value;

          if (type === "number") {

            valor =
              valor.replace(/\D/g, "");

            if (valor === "") {
              onChange("");
              return;
            }

            valor = Number(valor);

            if (
              min !== undefined &&
              valor < min
            ) {
              valor = min;
            }

            if (
              max !== undefined &&
              valor > max
            ) {
              valor = max;
            }
          }

          onChange(valor);
        }}

        className="
          w-full
          p-4
          rounded-2xl
          bg-gray-100
          dark:bg-gray-800
          border
          border-transparent
          focus:border-green-500
          outline-none
          transition
          text-black
          dark:text-white
        "
      />

      {descricao && (

        <p className="
          mt-2
          text-xs
          text-gray-500
          dark:text-gray-400
        ">
          {descricao}
        </p>

      )}

    </div>
  );
}

export default ModalMedicamento;