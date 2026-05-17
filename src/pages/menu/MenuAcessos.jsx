import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Copy,
  Crown,
  Loader2,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  UserRoundCog,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";

import { useAuth } from "../../context/useAuth";
import FundoBolhas from "../../components/FundoBolhas";
import { firestore } from "../../firebase";
import {
  BackHeader,
  EmptyState,
  PageShell,
  SectionTitle,
  Toast,
  obterIniciais,
} from "./components/MenuShared";

function MenuAcessos({ setPagina }) {
  const {
    isAdmin,
    buscarUsuarioPorId,
    alterarTipoPorId,
  } = useAuth();

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [buscaId, setBuscaId] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [buscaAdmin, setBuscaAdmin] = useState("");
  const [carregandoAdmins, setCarregandoAdmins] = useState(false);

  const adminsFiltrados = useMemo(() => {
    const termo = buscaAdmin.trim().toLowerCase();
    if (!termo) return admins;

    return admins.filter((admin) => {
      const nome = String(admin.nome || "").toLowerCase();
      const email = String(admin.email || "").toLowerCase();
      const publicId = String(admin.publicId || "").toLowerCase();
      return nome.includes(termo) || email.includes(termo) || publicId.includes(termo);
    });
  }, [admins, buscaAdmin]);

  useEffect(() => {
    if (isAdmin) carregarAdmins();
  }, [isAdmin]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function mostrarToast(msg, tipo = "ok") {
    setToast({ msg, tipo });
    if (navigator.vibrate) navigator.vibrate(30);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function carregarAdmins() {
    if (!isAdmin) return;

    try {
      setCarregandoAdmins(true);

      const q = query(collection(firestore, "usuarios"), where("tipo", "==", "admin"));
      const snap = await getDocs(q);

      const lista = snap.docs
        .map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"));

      setAdmins(lista);
    } catch (err) {
      console.error(err);
      mostrarToast("Não consegui carregar os admins 😕", "erro");
    } finally {
      setCarregandoAdmins(false);
    }
  }

  async function buscarPorId() {
    if (!buscaId.trim()) {
      mostrarToast("Digite um ID 😅", "erro");
      return;
    }

    try {
      setLoadingBusca(true);
      const res = await buscarUsuarioPorId(buscaId.trim());

      if (!res.ok) {
        mostrarToast(res.erro, "erro");
        setUsuarioEncontrado(null);
        return;
      }

      setUsuarioEncontrado(res.usuario);
      mostrarToast("Usuário encontrado 🔍", "ok");
    } catch (err) {
      console.error(err);
      mostrarToast("Erro ao buscar usuário", "erro");
    } finally {
      setLoadingBusca(false);
    }
  }

  async function alterarPermissao(tipo) {
    if (!usuarioEncontrado) return;

    const res = await alterarTipoPorId(usuarioEncontrado.publicId, tipo);

    if (!res.ok) {
      mostrarToast(res.erro, "erro");
      return;
    }

    setUsuarioEncontrado(res.usuario);
    mostrarToast(tipo === "admin" ? "Usuário promovido 👑" : "Usuário rebaixado 👤", "ok");
    carregarAdmins();
  }

  async function copiarTexto(texto, label = "Texto") {
    if (!texto) {
      mostrarToast("Nada para copiar 😅", "erro");
      return;
    }

    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast(`${label} copiado 📋`, "ok");
    } catch {
      mostrarToast("Não foi possível copiar", "erro");
    }
  }

  return (
    <PageShell>
      <FundoBolhas variant="emerald" />

      <AnimatePresence>
        {toast && <Toast toast={toast} fechar={() => setToast(null)} />}
      </AnimatePresence>

      <BackHeader
        icon={Shield}
        title="Gerenciar Acessos"
        description="Permissões, administradores e ID público"
        setPagina={setPagina}
      />

      <main className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 pb-32">
        {!isAdmin ? (
          <EmptyState
            icon={ShieldAlert}
            title="Acesso restrito"
            description="Essa tela aparece apenas para administradores."
          />
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.8rem] border border-gray-200 bg-white/85 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
              <SectionTitle
                icon={UserRoundCog}
                title="Editar permissão"
                description="Busque pelo ID público para promover ou rebaixar um usuário."
              />

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    value={buscaId}
                    onChange={(e) => setBuscaId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarPorId();
                    }}
                    placeholder="ID do usuário"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <button
                  type="button"
                  onClick={buscarPorId}
                  disabled={loadingBusca}
                  className="h-12 rounded-2xl bg-emerald-700 px-5 font-bold text-white shadow-lg shadow-emerald-700/15 transition active:scale-95 disabled:opacity-60"
                >
                  {loadingBusca ? <Loader2 size={20} className="animate-spin" /> : "Buscar"}
                </button>
              </div>

              {usuarioEncontrado ? (
                <UsuarioEncontrado
                  usuario={usuarioEncontrado}
                  onAdmin={() => alterarPermissao("admin")}
                  onComum={() => alterarPermissao("comum")}
                  onCopyId={() => copiarTexto(usuarioEncontrado.publicId, "ID")}
                />
              ) : (
                <div className="mt-4">
                  <EmptyState
                    icon={Search}
                    title="Nenhum usuário selecionado"
                    description="Digite o ID público para abrir o cartão de permissão."
                  />
                </div>
              )}

              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="flex items-start gap-2 font-bold">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  Use com calma: admin mexe em áreas sensíveis do app.
                </p>
              </div>
            </div>

            <AreaMaster
              admins={adminsFiltrados}
              totalAdmins={admins.length}
              buscaAdmin={buscaAdmin}
              setBuscaAdmin={setBuscaAdmin}
              carregandoAdmins={carregandoAdmins}
              onRefresh={carregarAdmins}
              onCopyId={(id) => copiarTexto(id, "ID")}
            />
          </section>
        )}
      </main>
    </PageShell>
  );
}

function UsuarioEncontrado({ usuario, onAdmin, onComum, onCopyId }) {
  return (
    <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50/90 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-black">{usuario.nome}</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {usuario.email || "Email não informado"}
          </p>

          <button
            type="button"
            onClick={onCopyId}
            className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-300"
          >
            ID: {usuario.publicId}
            <Copy size={14} />
          </button>
        </div>

        <CargoBadge tipo={usuario.tipo} />
      </div>

      {(usuario.permissaoAtualizadaPor || usuario.criadoPor) && (
        <div className="mt-4 rounded-2xl bg-black/5 p-3 text-sm dark:bg-white/5">
          <p>
            👤 Última alteração por:
            <span className="font-bold"> {usuario.permissaoAtualizadaPor || usuario.criadoPor}</span>
          </p>

          {usuario.permissaoAtualizadaEm && (
            <p className="mt-1 text-xs text-gray-500">
              {new Date(usuario.permissaoAtualizadaEm).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onAdmin}
          className="rounded-2xl bg-yellow-500 py-3 text-sm font-black text-black transition active:scale-95 sm:text-base"
        >
          👑 Admin
        </button>

        <button
          type="button"
          onClick={onComum}
          className="rounded-2xl bg-blue-600 py-3 text-sm font-black text-white transition active:scale-95 sm:text-base"
        >
          👤 Comum
        </button>
      </div>
    </div>
  );
}

function AreaMaster({
  admins,
  totalAdmins,
  buscaAdmin,
  setBuscaAdmin,
  carregandoAdmins,
  onRefresh,
  onCopyId,
}) {
  return (
    <div className="rounded-[1.8rem] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-800 to-slate-950 p-4 text-white shadow-2xl shadow-emerald-950/20 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 sm:h-12 sm:w-12">
            <Crown size={23} />
          </div>

          <p className="text-2xl font-black">Admins ativos</p>
          <p className="mt-1 text-sm text-emerald-100">
            {buscaAdmin.trim()
              ? `${admins.length} de ${totalAdmins} admins`
              : totalAdmins === 1
              ? "1 administrador ativo"
              : `${totalAdmins} administradores ativos`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 transition active:scale-95"
          aria-label="Atualizar admins"
        >
          {carregandoAdmins ? <Loader2 size={21} className="animate-spin" /> : <RefreshCcw size={21} />}
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/70" />

        <input
          value={buscaAdmin}
          onChange={(e) => setBuscaAdmin(e.target.value)}
          placeholder="Buscar nome, email ou ID"
          className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 font-semibold text-white outline-none placeholder:text-emerald-100/50 focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10"
        />
      </div>

      <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">
        {admins.length === 0 && !carregandoAdmins && (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-100">
            {buscaAdmin.trim() ? "Nenhum admin encontrado nessa busca." : "Nenhum admin encontrado ainda."}
          </div>
        )}

        {carregandoAdmins && (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-100">
            Carregando administradores...
          </div>
        )}

        {admins.map((admin) => (
          <AdminRow key={admin.uid || admin.publicId} admin={admin} onCopyId={() => onCopyId(admin.publicId)} />
        ))}
      </div>
    </div>
  );
}

function AdminRow({ admin, onCopyId }) {
  const nome = admin.nome || "Admin sem nome";
  const inicial = obterIniciais(nome).slice(0, 1);

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-sm transition hover:bg-white/15">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-emerald-800 shadow-md">
          {inicial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-black">{nome}</p>
            <span className="shrink-0 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-black">
              Admin
            </span>
          </div>

          <p className="truncate text-xs text-emerald-100/80">
            {admin.email || "Email não informado"}
          </p>

          <button
            type="button"
            onClick={onCopyId}
            className="mt-1 flex max-w-full items-center gap-1 text-xs font-bold text-emerald-100/90 transition hover:text-white active:scale-95"
          >
            <span className="truncate">ID: {admin.publicId || "sem ID"}</span>
            <Copy size={12} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CargoBadge({ tipo }) {
  const admin = tipo === "admin";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${admin ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"}`}>
      {admin ? "Admin" : "Comum"}
    </span>
  );
}

export default MenuAcessos;
