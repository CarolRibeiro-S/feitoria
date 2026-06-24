"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Save, RefreshCw, KeyRound,
  TrendingUp, ShoppingBag, Package,
  Pencil, Trash2, Plus, Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";
import ImageUpload from "@/components/ui/ImageUpload";

type Aba = "info" | "acesso" | "mp" | "desempenho" | "produtos";

interface ChartDay {
  day: string;
  barPct: number;
  total: number;
}

interface TopProduto {
  nome: string;
  quantidade: number;
}

interface PerfState {
  totalVendas: number;
  pedidosPendentes: number;
  produtosAtivos: number;
  topProdutos: TopProduto[];
  chartData: ChartDay[];
}

interface ProdutoRow {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  foto: string | null;
  disponivel: boolean;
}

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

const ABAS: { key: Aba; label: string }[] = [
  { key: "info",       label: "Informações"  },
  { key: "acesso",     label: "Acesso"        },
  { key: "mp",         label: "Mercado Pago"  },
  { key: "produtos",   label: "Produtos"      },
  { key: "desempenho", label: "Desempenho"   },
];

export default function ProdutoraEditPage() {
  const { id } = useParams<{ id: string }>();
  const [aba, setAba] = useState<Aba>("info");
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Header
  const [nomeMarca, setNomeMarca] = useState("");

  // Info form
  const [form, setForm] = useState({
    nome_marca: "", descricao: "", cidade: "", estado: "",
    instagram: "", whatsapp: "", foto_perfil: "",
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Acesso
  const [email, setEmail] = useState("");
  const [ativo, setAtivo] = useState<boolean | null>(null);
  const [togglingAtivo, setTogglingAtivo] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Mercado Pago
  const [mp, setMp] = useState({ mp_access_token: "", mp_user_id: "", mp_conectado: false });
  const [savingMp, setSavingMp] = useState(false);
  const [mpMsg, setMpMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Produtos
  const [produtosTab, setProdutosTab] = useState<ProdutoRow[]>([]);
  const [produtosLoading, setProdutosLoading] = useState(false);
  const [produtosLoaded, setProdutosLoaded] = useState(false);
  const [togglingProdId, setTogglingProdId] = useState<string | null>(null);
  const [deletingProdId, setDeletingProdId] = useState<string | null>(null);

  // Desempenho
  const [perf, setPerf] = useState<PerfState>({
    totalVendas: 0, pedidosPendentes: 0, produtosAtivos: 0,
    topProdutos: [], chartData: [],
  });
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfLoaded, setPerfLoaded] = useState(false);

  useEffect(() => {
    if (id) fetchProdutora();
  }, [id]);

  async function fetchProdutora() {
    setPageLoading(true);
    const { data, error } = await supabase
      .from("produtoras")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("[ProdutoraEdit]", error);
      setNotFound(true);
      setPageLoading(false);
      return;
    }

    const p = data as any;
    setNomeMarca(p.nome_marca ?? "");
    setForm({
      nome_marca:  p.nome_marca  ?? "",
      descricao:   p.descricao   ?? "",
      cidade:      p.cidade      ?? "",
      estado:      p.estado      ?? "",
      instagram:   p.instagram   ?? "",
      whatsapp:    p.whatsapp    ?? "",
      foto_perfil: p.foto_perfil ?? "",
    });
    setEmail(p.email ?? "");
    setAtivo(p.ativo ?? null);
    setMp({
      mp_access_token: p.mp_access_token ?? "",
      mp_user_id:      p.mp_user_id      ?? "",
      mp_conectado:    p.mp_conectado    ?? false,
    });
    setPageLoading(false);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveInfo() {
    setSavingInfo(true);
    setInfoMsg(null);
    const { error } = await supabase.from("produtoras").update(form).eq("id", id);
    if (error) {
      setInfoMsg({ text: "Erro ao salvar. Tente novamente.", ok: false });
    } else {
      setNomeMarca(form.nome_marca);
      setInfoMsg({ text: "Alterações salvas.", ok: true });
      setTimeout(() => setInfoMsg(null), 3000);
    }
    setSavingInfo(false);
  }

  async function handleToggleAtivo() {
    const novoAtivo = !ativo;
    setTogglingAtivo(true);
    const { error } = await supabase.from("produtoras").update({ ativo: novoAtivo }).eq("id", id);
    if (!error) setAtivo(novoAtivo);
    else console.error("[ProdutoraEdit] toggle ativo:", error);
    setTogglingAtivo(false);
  }

  async function handleResetPassword() {
    if (!email) return;
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (!error) setResetSent(true);
    else console.error("[ProdutoraEdit] resetPassword:", error);
    setResetting(false);
  }

  async function handleSaveMp() {
    setSavingMp(true);
    setMpMsg(null);
    const mpConectado = !!(mp.mp_access_token && mp.mp_user_id);
    const { error } = await supabase
      .from("produtoras")
      .update({
        mp_access_token: mp.mp_access_token || null,
        mp_user_id:      mp.mp_user_id      || null,
        mp_conectado:    mpConectado,
      })
      .eq("id", id);
    if (error) {
      setMpMsg({ text: "Erro ao salvar credenciais.", ok: false });
    } else {
      setMp((prev) => ({ ...prev, mp_conectado: mpConectado }));
      setMpMsg({ text: "Credenciais salvas.", ok: true });
      setTimeout(() => setMpMsg(null), 3000);
    }
    setSavingMp(false);
  }

  async function fetchProdutos() {
    if (produtosLoaded) return;
    setProdutosLoading(true);
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, categoria, preco, foto, disponivel")
      .eq("produtora_id", id)
      .order("criado_em", { ascending: false });
    setProdutosTab((data ?? []) as ProdutoRow[]);
    setProdutosLoaded(true);
    setProdutosLoading(false);
  }

  async function toggleProdutoAtivo(prodId: string, atual: boolean) {
    setTogglingProdId(prodId);
    const { error } = await supabase
      .from("produtos")
      .update({ disponivel: !atual })
      .eq("id", prodId);
    if (!error) {
      setProdutosTab((prev) =>
        prev.map((p) => (p.id === prodId ? { ...p, disponivel: !atual } : p))
      );
    }
    setTogglingProdId(null);
  }

  async function deleteProduto(prod: ProdutoRow) {
    if (!confirm(`Tem certeza que deseja excluir "${prod.nome}"?`)) return;
    setDeletingProdId(prod.id);
    const { error } = await supabase.from("produtos").delete().eq("id", prod.id);
    if (!error) {
      setProdutosTab((prev) => prev.filter((p) => p.id !== prod.id));
    }
    setDeletingProdId(null);
  }

  async function fetchDesempenho() {
    if (perfLoaded) return;
    setPerfLoading(true);

    const now = new Date();
    const { data: prods } = await supabase
      .from("produtos")
      .select("id, nome, disponivel")
      .eq("produtora_id", id);

    const produtosAtivos = (prods ?? []).filter((p: any) => p.disponivel).length;
    const prodIds = (prods ?? []).map((p: any) => p.id as string);
    const prodNomeMap = Object.fromEntries((prods ?? []).map((p: any) => [p.id, p.nome as string]));

    if (prodIds.length === 0) {
      setPerf({ totalVendas: 0, pedidosPendentes: 0, produtosAtivos, topProdutos: [], chartData: [] });
      setPerfLoaded(true);
      setPerfLoading(false);
      return;
    }

    const { data: itens } = await supabase
      .from("itens_pedido")
      .select("quantidade, produto_id, pedido_id, nome")
      .in("produto_id", prodIds);

    const pedidoIds = [...new Set((itens ?? []).map((i: any) => i.pedido_id as string).filter(Boolean))];

    const prodMap: Record<string, { nome: string; quantidade: number }> = {};
    for (const item of (itens ?? [])) {
      const prodId = (item as any).produto_id as string;
      const nome = prodNomeMap[prodId] ?? (item as any).nome ?? "—";
      if (!prodMap[prodId]) prodMap[prodId] = { nome, quantidade: 0 };
      prodMap[prodId].quantidade += (item as any).quantidade ?? 1;
    }
    const topProdutos = Object.values(prodMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    if (pedidoIds.length === 0) {
      setPerf({ totalVendas: 0, pedidosPendentes: 0, produtosAtivos, topProdutos, chartData: [] });
      setPerfLoaded(true);
      setPerfLoading(false);
      return;
    }

    const { data: pedidosDados } = await supabase
      .from("pedidos")
      .select("id, total, status, criado_em")
      .in("id", pedidoIds);

    const totalVendas = (pedidosDados ?? [])
      .filter((p: any) => p.status !== "cancelado")
      .reduce((s: number, p: any) => s + (p.total ?? 0), 0);

    const pedidosPendentes = (pedidosDados ?? [])
      .filter((p: any) => p.status === "pendente").length;

    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    (pedidosDados ?? []).forEach((o: any) => {
      const date = (o.criado_em as string).slice(0, 10);
      if (date in dayMap) dayMap[date] += o.total ?? 0;
    });
    const entries = Object.entries(dayMap);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    const chartData: ChartDay[] = entries.map(([date, total]) => ({
      day: DAYS_PT[new Date(date + "T12:00:00").getDay()],
      barPct: Math.max(Math.round((total / maxVal) * 92), total > 0 ? 4 : 2),
      total,
    }));

    setPerf({ totalVendas, pedidosPendentes, produtosAtivos, topProdutos, chartData });
    setPerfLoaded(true);
    setPerfLoading(false);
  }

  function handleAbaChange(a: Aba) {
    setAba(a);
    if (a === "desempenho") fetchDesempenho();
    if (a === "produtos") fetchProdutos();
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  // ── Early states ──────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <p className="font-serif text-xl text-espresso/30 italic">Produtora não encontrada.</p>
        <Link
          href="/admin/produtoras"
          className="font-sans text-xs tracking-widest uppercase text-caramel hover:text-terracota transition-colors"
        >
          ← Voltar à listagem
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-5">
        <Link
          href="/admin/produtoras"
          className="text-espresso/35 hover:text-espresso transition-colors p-1 -ml-1"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <div>
          <p className="font-sans text-[0.58rem] tracking-[0.28em] uppercase text-espresso/35 font-semibold">Produtora</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-espresso leading-tight">{nomeMarca || "—"}</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand -mb-2 overflow-x-auto scrollbar-hide">
        {ABAS.map((a) => (
          <button
            key={a.key}
            onClick={() => handleAbaChange(a.key)}
            className={`flex-shrink-0 px-5 py-3 font-sans text-[0.68rem] font-semibold tracking-[0.14em] uppercase border-b-2 -mb-px transition-colors ${
              aba === a.key
                ? "border-terracota text-terracota"
                : "border-transparent text-espresso/40 hover:text-espresso"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA: INFORMAÇÕES ───────────────────────────────────────────────── */}
      {aba === "info" && (
        <div className="flex flex-col gap-6 pt-2 max-w-2xl">

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Nome da Marca</label>
              <input type="text" {...field("nome_marca")} className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Instagram</label>
              <input type="text" placeholder="@handle" {...field("instagram")} className={inputCls} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Descrição</label>
            <textarea rows={4} {...field("descricao")} className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Cidade</label>
              <input type="text" {...field("cidade")} className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Estado</label>
              <input
                type="text"
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value.toUpperCase() }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>WhatsApp</label>
            <input type="tel" placeholder="(61) 99999-9999" {...field("whatsapp")} className={inputCls} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelCls}>Foto de Perfil</label>
            <ImageUpload
              bucket="produtoras"
              path={`perfil-${id}`}
              onUpload={(url) => setForm((p) => ({ ...p, foto_perfil: url }))}
              defaultValue={form.foto_perfil || undefined}
            />
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-sand">
            <button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="flex items-center gap-2 bg-espresso text-cream font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase px-6 py-3 hover:bg-terracota transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              {savingInfo ? "Salvando..." : "Salvar alterações"}
            </button>
            {infoMsg && (
              <p className={`font-sans text-[0.78rem] ${infoMsg.ok ? "text-olive" : "text-wine"}`}>
                {infoMsg.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ABA: ACESSO ────────────────────────────────────────────────────── */}
      {aba === "acesso" && (
        <div className="flex flex-col gap-8 pt-2 max-w-2xl">

          <div className="flex flex-col gap-2">
            <label className={labelCls}>E-mail da conta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className={inputCls}
            />
            <p className="font-sans text-[0.65rem] text-espresso/35">
              Edite se necessário para enviar o link de redefinição.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-2 border-t border-sand">
            <p className="font-sans text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-espresso/40 pt-4">
              Redefinição de senha
            </p>
            {resetSent ? (
              <div className="bg-olive/5 border border-olive/20 px-5 py-4 flex items-center gap-3">
                <KeyRound size={14} className="text-olive flex-shrink-0" />
                <p className="font-sans text-[0.8rem] text-olive">
                  Link enviado para <span className="font-semibold">{email}</span>.
                </p>
              </div>
            ) : (
              <button
                onClick={handleResetPassword}
                disabled={resetting || !email}
                className="self-start flex items-center gap-2 bg-cream border border-sand text-espresso font-sans text-[0.7rem] font-semibold tracking-[0.15em] uppercase px-6 py-3 hover:border-espresso/40 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={13} className={resetting ? "animate-spin" : ""} />
                {resetting ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4 pt-2 border-t border-sand">
            <p className="font-sans text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-espresso/40 pt-4">
              Estado da conta
            </p>
            <div className="flex items-center justify-between max-w-sm bg-cream border border-sand px-5 py-4">
              <div>
                <p className="font-sans text-[0.82rem] font-semibold text-espresso">Conta ativa</p>
                <p className="font-sans text-[0.66rem] text-espresso/40 mt-0.5">
                  {ativo
                    ? "Produtora visível e operando no marketplace"
                    : "Produtora suspensa ou pendente de aprovação"}
                </p>
              </div>
              {togglingAtivo ? (
                <div className="w-11 h-6 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border border-espresso/30 border-t-espresso/60 rounded-full animate-spin" />
                </div>
              ) : (
                <button
                  onClick={handleToggleAtivo}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    ativo ? "bg-olive" : "bg-espresso/15"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    ativo ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── ABA: MERCADO PAGO ──────────────────────────────────────────────── */}
      {aba === "mp" && (
        <div className="flex flex-col gap-8 pt-2 max-w-2xl">

          <div className="bg-sand/20 border border-sand px-5 py-4">
            <p className="font-sans text-[0.78rem] text-espresso/60 leading-relaxed">
              Essas credenciais serão usadas para o split automático de pagamento via Mercado Pago.
              Cada produtora deve ter seu próprio Access Token para receber diretamente em sua conta.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${mp.mp_conectado ? "bg-olive" : "bg-espresso/20"}`} />
            <span className={`font-sans text-[0.7rem] font-semibold tracking-[0.12em] uppercase ${
              mp.mp_conectado ? "text-olive" : "text-espresso/40"
            }`}>
              {mp.mp_conectado ? "Conectado" : "Não conectado"}
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Access Token</label>
              <input
                type="password"
                placeholder="APP_USR-..."
                value={mp.mp_access_token}
                onChange={(e) => setMp((p) => ({ ...p, mp_access_token: e.target.value }))}
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>User ID</label>
              <input
                type="text"
                placeholder="123456789"
                value={mp.mp_user_id}
                onChange={(e) => setMp((p) => ({ ...p, mp_user_id: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-sand">
            <button
              onClick={handleSaveMp}
              disabled={savingMp}
              className="flex items-center gap-2 bg-espresso text-cream font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase px-6 py-3 hover:bg-terracota transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              {savingMp ? "Salvando..." : "Salvar credenciais"}
            </button>
            {mpMsg && (
              <p className={`font-sans text-[0.78rem] ${mpMsg.ok ? "text-olive" : "text-wine"}`}>
                {mpMsg.text}
              </p>
            )}
          </div>

        </div>
      )}

      {/* ── ABA: PRODUTOS ──────────────────────────────────────────────────── */}
      {aba === "produtos" && (
        <div className="flex flex-col gap-6 pt-2">

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="font-sans text-[0.65rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
              {produtosLoaded
                ? `${produtosTab.length} ${produtosTab.length === 1 ? "produto" : "produtos"}`
                : ""}
            </p>
            <Link
              href={`/admin/produtoras/${id}/produtos/novo`}
              className="flex items-center gap-2 bg-espresso text-cream font-sans text-[0.65rem] font-semibold tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-terracota transition-colors"
            >
              <Plus size={12} />
              Adicionar produto
            </Link>
          </div>

          {/* Loading */}
          {produtosLoading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!produtosLoading && produtosLoaded && produtosTab.length === 0 && (
            <p className="font-serif text-lg text-espresso/30 italic text-center py-16">
              Nenhum produto cadastrado para esta produtora.
            </p>
          )}

          {/* List */}
          {!produtosLoading && produtosTab.length > 0 && (
            <div className="bg-cream border border-sand divide-y divide-sand/50">
              {produtosTab.map((prod) => {
                const busyToggle = togglingProdId === prod.id;
                const busyDelete = deletingProdId === prod.id;
                return (
                  <div key={prod.id} className="flex items-center gap-4 px-5 py-4 hover:bg-sand/10 transition-colors group">

                    {/* Thumbnail */}
                    <div className="w-10 h-10 flex-shrink-0 bg-sand/30 overflow-hidden">
                      {prod.foto ? (
                        <Image
                          src={prod.foto}
                          alt={prod.nome}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={14} className="text-espresso/20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[0.82rem] font-medium text-espresso truncate group-hover:text-terracota transition-colors">
                        {prod.nome}
                      </p>
                      <p className="font-sans text-[0.65rem] text-espresso/40">
                        {prod.categoria} · R$ {prod.preco.toFixed(2).replace(".", ",")}
                      </p>
                    </div>

                    {/* Toggle disponível */}
                    <div className="flex-shrink-0">
                      {busyToggle ? (
                        <div className="w-9 h-5 flex items-center justify-center">
                          <div className="w-3 h-3 border border-espresso/30 border-t-espresso/60 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleProdutoAtivo(prod.id, prod.disponivel)}
                          title={prod.disponivel ? "Desativar" : "Ativar"}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                            prod.disponivel ? "bg-olive" : "bg-espresso/15"
                          }`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            prod.disponivel ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Link
                        href={`/admin/produtoras/${id}/produtos/${prod.id}`}
                        title="Editar produto"
                        className="p-2 text-espresso/35 hover:text-espresso hover:bg-sand/40 transition-colors"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => deleteProduto(prod)}
                        disabled={busyDelete}
                        title="Excluir produto"
                        className="p-2 text-espresso/35 hover:text-wine hover:bg-wine/5 transition-colors disabled:opacity-40"
                      >
                        {busyDelete ? (
                          <div className="w-3.5 h-3.5 border border-espresso/30 border-t-espresso/60 rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: DESEMPENHO ────────────────────────────────────────────────── */}
      {aba === "desempenho" && (
        <div className="flex flex-col gap-8 pt-2">
          {perfLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total de Vendas",    value: fmtBRL(perf.totalVendas),      icon: TrendingUp,  color: "text-olive"    },
                  { label: "Pedidos Pendentes",  value: String(perf.pedidosPendentes),  icon: ShoppingBag, color: "text-terracota" },
                  { label: "Produtos Ativos",    value: String(perf.produtosAtivos),    icon: Package,     color: "text-espresso" },
                ].map((c) => (
                  <div key={c.label} className="bg-cream border border-sand p-5 flex flex-col gap-4 shadow-sm">
                    <div className={`w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center ${c.color}`}>
                      <c.icon size={14} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-sans text-[0.6rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">{c.label}</p>
                      <p className="font-serif text-xl text-espresso font-medium">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {perf.topProdutos.length > 0 && (
                <div className="bg-cream border border-sand p-6 flex flex-col gap-4 shadow-sm">
                  <p className="font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">
                    Produtos Mais Vendidos
                  </p>
                  <ol className="flex flex-col gap-2.5">
                    {perf.topProdutos.map((p, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className={`font-sans text-[0.68rem] font-bold w-5 flex-shrink-0 ${
                          i < 3 ? "text-terracota" : "text-espresso/25"
                        }`}>
                          {i + 1}º
                        </span>
                        <span className="font-sans text-[0.82rem] text-espresso/75 flex-1 truncate">{p.nome}</span>
                        <span className="font-sans text-[0.72rem] text-espresso/40 flex-shrink-0 tabular-nums">
                          {p.quantidade} un.
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {perf.chartData.length > 0 && (
                <div className="bg-cream border border-sand p-6 flex flex-col gap-6 shadow-sm">
                  <div>
                    <p className="font-serif text-lg text-espresso">Vendas — últimos 7 dias</p>
                    <p className="font-sans text-xs text-espresso/40 mt-1">Receita diária desta produtora</p>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-36">
                    {perf.chartData.map((item) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          className="w-full bg-sand group-hover:bg-terracota transition-colors duration-300 relative"
                          style={{ height: `${item.barPct}%` }}
                        >
                          {item.total > 0 && (
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-espresso text-cream text-[0.6rem] px-1.5 py-0.5 pointer-events-none whitespace-nowrap">
                              {fmtBRL(item.total)}
                            </div>
                          )}
                        </div>
                        <span className="font-sans text-[0.58rem] uppercase tracking-tighter text-espresso/40 font-bold">
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {perf.topProdutos.length === 0 && perf.chartData.length === 0 && (
                <p className="font-serif text-lg text-espresso/30 italic text-center py-12">
                  Sem dados de desempenho ainda.
                </p>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
