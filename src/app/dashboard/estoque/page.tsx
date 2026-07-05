"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { AlertCircle, Package, Save } from "lucide-react";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
}

interface EstoqueItem {
  produto: Produto;
  quantidade: string;
  data_fabricacao: string;
  data_validade: string;
  saved_quantidade: string;
  saved_fabricacao: string;
  saved_validade: string;
  saving: boolean;
  error: string | null;
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function getStatus(item: EstoqueItem): "esgotado" | "vencendo" | "disponivel" {
  if ((parseInt(item.quantidade) || 0) === 0) return "esgotado";
  if (item.data_validade) {
    const days = daysUntil(item.data_validade);
    if (days !== null && days >= 0 && days <= 3) return "vencendo";
  }
  return "disponivel";
}

const BADGE: Record<string, string> = {
  disponivel: "bg-olive/10 text-olive border border-olive/20",
  vencendo:   "bg-amber-50 text-amber-700 border border-amber-200",
  esgotado:   "bg-red-50 text-red-600 border border-red-200",
};
const LABEL: Record<string, string> = {
  disponivel: "Disponível",
  vencendo:   "Vencendo",
  esgotado:   "Esgotado",
};

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/40 outline-none px-3 py-2 font-sans text-sm text-espresso transition-colors";

export default function EstoquePage() {
  const router = useRouter();
  const [produtoraId, setProdutoraId] = useState<string | null>(null);
  const [items, setItems] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: produtora } = await supabase
        .from("produtoras")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!produtora) {
        setLoadError("Produtora não encontrada. Complete seu perfil para acessar o estoque.");
        setLoading(false);
        return;
      }
      setProdutoraId(produtora.id);

      const [produtosRes, estoqueRes] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, nome, categoria")
          .eq("produtora_id", user.id)
          .order("nome"),
        supabase
          .from("estoque_produtos")
          .select("produto_id, quantidade, data_fabricacao, data_validade")
          .eq("produtora_id", produtora.id),
      ]);

      if (produtosRes.error) {
        setLoadError("Erro ao carregar produtos.");
        setLoading(false);
        return;
      }

      const estoqueMap = new Map<string, any>(
        (estoqueRes.data ?? []).map((e: any) => [e.produto_id, e])
      );

      setItems(
        (produtosRes.data ?? []).map((p: any) => {
          const e = estoqueMap.get(p.id);
          const qty = String(e?.quantidade ?? 0);
          const fab = e?.data_fabricacao ?? "";
          const val = e?.data_validade ?? "";
          return {
            produto: p,
            quantidade: qty,
            data_fabricacao: fab,
            data_validade: val,
            saved_quantidade: qty,
            saved_fabricacao: fab,
            saved_validade: val,
            saving: false,
            error: null,
          };
        })
      );
      setLoading(false);
    }
    load();
  }, [router]);

  function update(
    id: string,
    field: "quantidade" | "data_fabricacao" | "data_validade",
    val: string
  ) {
    setItems(prev => prev.map(i => (i.produto.id === id ? { ...i, [field]: val } : i)));
  }

  function isDirty(item: EstoqueItem) {
    return (
      item.quantidade !== item.saved_quantidade ||
      item.data_fabricacao !== item.saved_fabricacao ||
      item.data_validade !== item.saved_validade
    );
  }

  async function save(produtoId: string) {
    if (!produtoraId) return;
    setItems(prev =>
      prev.map(i => (i.produto.id === produtoId ? { ...i, saving: true, error: null } : i))
    );

    const item = items.find(i => i.produto.id === produtoId)!;
    const { error } = await supabase.from("estoque_produtos").upsert(
      {
        produto_id: produtoId,
        produtora_id: produtoraId,
        quantidade: parseInt(item.quantidade) || 0,
        data_fabricacao: item.data_fabricacao || null,
        data_validade: item.data_validade || null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "produto_id" }
    );

    setItems(prev =>
      prev.map(i => {
        if (i.produto.id !== produtoId) return i;
        if (error) return { ...i, saving: false, error: "Erro ao salvar. Tente novamente." };
        return {
          ...i,
          saving: false,
          saved_quantidade: i.quantidade,
          saved_fabricacao: i.data_fabricacao,
          saved_validade: i.data_validade,
          error: null,
        };
      })
    );
  }

  const totalQty = items.reduce((s, i) => s + (parseInt(i.quantidade) || 0), 0);
  const vencendoCount = items.filter(i => getStatus(i) === "vencendo").length;
  const esgotadosCount = items.filter(i => getStatus(i) === "esgotado").length;

  return (
    <div className="flex flex-col gap-8">

      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
          Inventário
        </p>
        <h1 className="font-serif text-3xl text-espresso font-normal">Estoque</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-sand bg-sand/30 px-5 py-4">
          <p className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold mb-1">
            Total em estoque
          </p>
          <p className="font-serif text-3xl text-espresso">{totalQty}</p>
          <p className="font-sans text-[0.62rem] text-espresso/35 mt-0.5">unidades</p>
        </div>
        <div className="border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-amber-600/70 font-semibold mb-1">
            Vencendo
          </p>
          <p className="font-serif text-3xl text-amber-700">{vencendoCount}</p>
          <p className="font-sans text-[0.62rem] text-amber-600/50 mt-0.5">produtos</p>
        </div>
        <div className="border border-red-200 bg-red-50 px-5 py-4">
          <p className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-red-500/70 font-semibold mb-1">
            Esgotados
          </p>
          <p className="font-serif text-3xl text-red-600">{esgotadosCount}</p>
          <p className="font-sans text-[0.62rem] text-red-500/50 mt-0.5">produtos</p>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 bg-wine/5 border border-wine/20 p-4">
          <AlertCircle size={16} className="text-wine/60 flex-shrink-0" />
          <p className="font-sans text-sm text-espresso">{loadError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-sand/40 border border-sand animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 && !loadError ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-sand">
          <Package size={32} strokeWidth={1.2} className="text-espresso/20 mb-3" />
          <p className="font-serif text-lg text-espresso/40 italic">Nenhum produto cadastrado.</p>
          <Link
            href="/dashboard/produtos/novo"
            className="mt-4 font-sans text-sm text-caramel hover:text-terracota transition-colors underline underline-offset-4"
          >
            Adicionar produto
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1">

          {/* Desktop table header */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_110px_148px_148px_106px_86px] gap-4 px-4 py-2.5 border-b border-sand">
            {["Produto", "Qtd.", "Fabricação", "Validade", "Status", ""].map(h => (
              <span
                key={h}
                className="font-sans text-[0.58rem] tracking-[0.22em] uppercase text-espresso/35 font-semibold"
              >
                {h}
              </span>
            ))}
          </div>

          {items.map(item => {
            const status = getStatus(item);
            const dirty = isDirty(item);
            return (
              <div
                key={item.produto.id}
                className={`border transition-colors ${
                  dirty ? "border-caramel/50" : "border-sand"
                } bg-cream`}
              >
                {/* Desktop row */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_110px_148px_148px_106px_86px] gap-4 items-center px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-sans text-[0.82rem] font-medium text-espresso truncate">
                      {item.produto.nome}
                    </p>
                    <p className="font-sans text-[0.62rem] text-espresso/40 mt-0.5">
                      {item.produto.categoria}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={item.quantidade}
                    onChange={e => update(item.produto.id, "quantidade", e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="date"
                    value={item.data_fabricacao}
                    onChange={e => update(item.produto.id, "data_fabricacao", e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="date"
                    value={item.data_validade}
                    onChange={e => update(item.produto.id, "data_validade", e.target.value)}
                    className={inputCls}
                  />
                  <span
                    className={`inline-flex items-center justify-center px-2 py-1 font-sans text-[0.58rem] tracking-wide font-semibold uppercase ${BADGE[status]}`}
                  >
                    {LABEL[status]}
                  </span>
                  <button
                    disabled={!dirty || item.saving}
                    onClick={() => save(item.produto.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-terracota text-cream font-sans text-[0.6rem] tracking-wide uppercase font-semibold hover:bg-caramel transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Save size={11} />
                    {item.saving ? "..." : "Salvar"}
                  </button>
                </div>

                {/* Mobile card */}
                <div className="lg:hidden p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-sans text-[0.82rem] font-medium text-espresso leading-tight">
                        {item.produto.nome}
                      </p>
                      <p className="font-sans text-[0.62rem] text-espresso/40 mt-0.5">
                        {item.produto.categoria}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 font-sans text-[0.56rem] tracking-wide font-semibold uppercase ${BADGE[status]}`}
                    >
                      {LABEL[status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[0.56rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                        Qtd.
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.quantidade}
                        onChange={e => update(item.produto.id, "quantidade", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[0.56rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                        Fabricação
                      </span>
                      <input
                        type="date"
                        value={item.data_fabricacao}
                        onChange={e => update(item.produto.id, "data_fabricacao", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-[0.56rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                        Validade
                      </span>
                      <input
                        type="date"
                        value={item.data_validade}
                        onChange={e => update(item.produto.id, "data_validade", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  {item.error && (
                    <p className="font-sans text-[0.72rem] text-wine">{item.error}</p>
                  )}
                  {dirty && (
                    <button
                      disabled={item.saving}
                      onClick={() => save(item.produto.id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-terracota text-cream font-sans text-[0.68rem] tracking-[0.18em] uppercase font-semibold hover:bg-caramel transition-colors disabled:opacity-50"
                    >
                      <Save size={12} />
                      {item.saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                  )}
                </div>

                {/* Desktop error */}
                {item.error && (
                  <p className="hidden lg:block px-4 pb-3 font-sans text-[0.72rem] text-wine">
                    {item.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
