"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { CATEGORIES } from "@/lib/constants";
import { Package } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type DatePreset = "semana" | "mes" | "ano" | "inicio" | "custom";

interface FlatItem {
  criado_em: string;
  pedido_id: string;
  produto_id: string | null;
  nome_produto: string;
  produtor: string;
  categoria: string | null;
  foto: string | null;
  preco_unitario: number;
  quantidade: number;
  receita: number;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTH_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DAY_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function applyDate(items: FlatItem[], preset: DatePreset, from: string, to: string): FlatItem[] {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  if (preset === "semana") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.getFullYear(), now.getMonth(), diff);
    end = now;
  } else if (preset === "mes") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = now;
  } else if (preset === "ano") {
    start = new Date(now.getFullYear(), 0, 1);
    end = now;
  } else if (preset === "inicio") {
    return items;
  } else if (preset === "custom" && from && to) {
    start = new Date(from + "T00:00:00");
    end = new Date(to + "T23:59:59");
  } else {
    return items;
  }

  return items.filter(i => {
    const d = new Date(i.criado_em);
    return (!start || d >= start) && (!end || d <= end);
  });
}

function buildBuckets(
  items: FlatItem[],
  preset: DatePreset,
  customFrom: string,
  customTo: string,
): { label: string; value: number }[] {
  const now = new Date();

  if (preset === "semana") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        label: DAY_PT[d.getDay()],
        value: items.filter(x => x.criado_em.slice(0, 10) === key).reduce((s, x) => s + x.receita, 0),
      };
    });
  }

  if (preset === "mes") {
    const result: { label: string; value: number }[] = [];
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    let ws = new Date(ms);
    let wn = 1;
    while (ws.getMonth() === now.getMonth() && ws <= now) {
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      result.push({
        label: `Sem ${wn}`,
        value: items
          .filter(x => { const d = new Date(x.criado_em); return d >= ws && d <= we; })
          .reduce((s, x) => s + x.receita, 0),
      });
      ws.setDate(ws.getDate() + 7);
      wn++;
    }
    return result;
  }

  if (preset === "ano") {
    return MONTH_PT.map((label, m) => ({
      label,
      value: items
        .filter(x => {
          const d = new Date(x.criado_em);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === m;
        })
        .reduce((s, x) => s + x.receita, 0),
    }));
  }

  if (preset === "custom" && customFrom && customTo) {
    const startD = new Date(customFrom + "T00:00:00");
    const endD   = new Date(customTo   + "T23:59:59");
    const diff   = Math.ceil((endD.getTime() - startD.getTime()) / 86400000);

    if (diff <= 14) {
      return Array.from({ length: diff + 1 }, (_, i) => {
        const d = new Date(startD);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return {
          label: `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`,
          value: items.filter(x => x.criado_em.slice(0, 10) === key).reduce((s, x) => s + x.receita, 0),
        };
      });
    }

    const result: { label: string; value: number }[] = [];
    let curr = new Date(startD.getFullYear(), startD.getMonth(), 1);
    while (curr <= endD) {
      const yr = curr.getFullYear(); const mn = curr.getMonth();
      result.push({
        label: `${MONTH_PT[mn]}/${String(yr).slice(2)}`,
        value: items
          .filter(x => { const xd = new Date(x.criado_em); return xd.getFullYear() === yr && xd.getMonth() === mn; })
          .reduce((s, x) => s + x.receita, 0),
      });
      curr.setMonth(curr.getMonth() + 1);
    }
    return result;
  }

  // "inicio" — rolling 12 months
  return Array.from({ length: 12 }, (_, i) => {
    const idx = 11 - i;
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    const yr = d.getFullYear(); const mn = d.getMonth();
    return {
      label: idx === 0 ? MONTH_PT[mn] : `${MONTH_PT[mn]}/${String(yr).slice(2)}`,
      value: items
        .filter(x => { const xd = new Date(x.criado_em); return xd.getFullYear() === yr && xd.getMonth() === mn; })
        .reduce((s, x) => s + x.receita, 0),
    };
  });
}

function computeAllTimeStats(items: FlatItem[]) {
  const totalReceita  = items.reduce((s, i) => s + i.receita, 0);
  const uniquePedidos = new Set(items.map(i => i.pedido_id)).size;
  const ticketMedio   = uniquePedidos > 0 ? totalReceita / uniquePedidos : 0;

  const prodMap = new Map<string, { nome: string; qty: number }>();
  const catMap  = new Map<string, number>();
  const pfMap   = new Map<string, number>();

  for (const i of items) {
    const key = i.produto_id ?? i.nome_produto;
    if (!prodMap.has(key)) prodMap.set(key, { nome: i.nome_produto, qty: 0 });
    prodMap.get(key)!.qty += i.quantidade;

    if (i.categoria) catMap.set(i.categoria, (catMap.get(i.categoria) ?? 0) + i.quantidade);
    if (i.produtor)  pfMap.set(i.produtor,   (pfMap.get(i.produtor)   ?? 0) + i.receita);
  }

  const topProd     = Array.from(prodMap.values()).sort((a,b) => b.qty - a.qty)[0] ?? null;
  const topCat      = Array.from(catMap.entries()).sort((a,b) => b[1] - a[1])[0] ?? null;
  const topProdutora= Array.from(pfMap.entries()).sort((a,b) => b[1] - a[1])[0] ?? null;

  return { totalReceita, uniquePedidos, ticketMedio, topProd, topCat, topProdutora };
}

function computeProductsTable(items: FlatItem[]) {
  const totalReceita = items.reduce((s, i) => s + i.receita, 0);
  const map = new Map<string, { nome: string; produtor: string; categoria: string | null; foto: string | null; qty: number; receita: number }>();

  for (const i of items) {
    const key = i.produto_id ?? i.nome_produto;
    if (!map.has(key)) map.set(key, { nome: i.nome_produto, produtor: i.produtor, categoria: i.categoria, foto: i.foto, qty: 0, receita: 0 });
    const row = map.get(key)!;
    row.qty += i.quantidade;
    row.receita += i.receita;
  }

  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .map(row => ({ ...row, pct: totalReceita > 0 ? (row.receita / totalReceita) * 100 : 0 }));
}

function computeCategories(items: FlatItem[]) {
  const totalReceita = items.reduce((s, i) => s + i.receita, 0);
  const map = new Map<string, { qty: number; receita: number }>();
  for (const i of items) {
    const cat = i.categoria ?? "Outros";
    if (!map.has(cat)) map.set(cat, { qty: 0, receita: 0 });
    map.get(cat)!.qty     += i.quantidade;
    map.get(cat)!.receita += i.receita;
  }
  return CATEGORIES
    .map(c => {
      const d = map.get(c.name) ?? { qty: 0, receita: 0 };
      return { name: c.name, Icon: c.Icon, qty: d.qty, receita: d.receita, pct: totalReceita > 0 ? (d.receita / totalReceita) * 100 : 0 };
    })
    .filter(c => c.qty > 0);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "semana", label: "Esta semana"    },
  { key: "mes",    label: "Este mês"       },
  { key: "ano",    label: "Este ano"       },
  { key: "inicio", label: "Desde o início" },
  { key: "custom", label: "Personalizado"  },
];

const labelCls = "font-sans text-[0.6rem] tracking-[0.2em] uppercase font-semibold text-espresso/40";
const pillCls  = (active: boolean) =>
  `px-4 py-2 font-sans text-[0.68rem] font-bold tracking-[0.15em] uppercase border transition-colors ${
    active
      ? "bg-espresso text-cream border-espresso"
      : "bg-cream text-espresso/50 border-sand hover:border-espresso/30 hover:text-espresso/70"
  }`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [allItems, setAllItems]         = useState<FlatItem[]>([]);
  const [produtorasList, setProdutorasList] = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);

  const [preset, setPreset]             = useState<DatePreset>("mes");
  const [customFrom, setCustomFrom]     = useState("");
  const [customTo, setCustomTo]         = useState("");
  const [filterProdutora, setFilterProdutora] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select(`
          id, criado_em,
          itens_pedido(produto_id, nome_produto, produtor, preco_unitario, quantidade, produtos(nome, categoria, foto))
        `)
        .neq("status", "cancelado")
        .order("criado_em", { ascending: true });

      if (error) { console.error("[AdminAnalytics]", error); setLoading(false); return; }

      const flat: FlatItem[] = [];
      const pfSet = new Set<string>();

      for (const pedido of (pedidos ?? []) as any[]) {
        for (const item of (pedido.itens_pedido ?? [])) {
          const qty   = Number(item.quantidade) || 1;
          const preco = Number(item.preco_unitario) || 0;
          flat.push({
            criado_em:     pedido.criado_em,
            pedido_id:     pedido.id,
            produto_id:    item.produto_id ?? null,
            nome_produto:  item.nome_produto ?? item.nome ?? "Produto",
            produtor:      item.produtor ?? "",
            categoria:     item.produtos?.categoria ?? null,
            foto:          item.produtos?.foto ?? null,
            preco_unitario: preco,
            quantidade:    qty,
            receita:       preco * qty,
          });
          if (item.produtor) pfSet.add(item.produtor);
        }
      }

      setAllItems(flat);
      setProdutorasList(Array.from(pfSet).sort());
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const allTimeStats = useMemo(() => computeAllTimeStats(allItems), [allItems]);

  const filteredItems = useMemo(() => {
    let items = applyDate(allItems, preset, customFrom, customTo);
    if (filterProdutora !== "all") items = items.filter(i => i.produtor === filterProdutora);
    if (filterCategoria !== "all") items = items.filter(i => i.categoria === filterCategoria);
    return items;
  }, [allItems, preset, customFrom, customTo, filterProdutora, filterCategoria]);

  const productsTable = useMemo(() => computeProductsTable(filteredItems), [filteredItems]);
  const categoriesData= useMemo(() => computeCategories(filteredItems), [filteredItems]);
  const chartBuckets  = useMemo(() => buildBuckets(filteredItems, preset, customFrom, customTo), [filteredItems, preset, customFrom, customTo]);
  const chartMax      = useMemo(() => Math.max(...chartBuckets.map(b => b.value), 1), [chartBuckets]);

  const filteredReceita  = filteredItems.reduce((s, i) => s + i.receita, 0);
  const filteredPedidos  = new Set(filteredItems.map(i => i.pedido_id)).size;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-sand/40 border border-sand animate-pulse" />)}
        </div>
        <div className="h-40 bg-sand/30 border border-sand animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">

      {/* ── All-time stats ──────────────────────────────────────────────────── */}
      <div>
        <p className={`${labelCls} mb-4`}>Métricas gerais — todos os tempos</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              label: "Total de Vendas",
              value: fmtBRL(allTimeStats.totalReceita),
              sub:   "desde o início",
            },
            {
              label: "Total de Pedidos",
              value: String(allTimeStats.uniquePedidos),
              sub:   "pedidos realizados",
            },
            {
              label: "Ticket Médio",
              value: fmtBRL(allTimeStats.ticketMedio),
              sub:   "por pedido",
            },
            {
              label: "Produto Mais Vendido",
              value: allTimeStats.topProd?.nome ?? "—",
              sub:   allTimeStats.topProd ? `${allTimeStats.topProd.qty} unidades` : "",
            },
            {
              label: "Categoria Mais Vendida",
              value: allTimeStats.topCat?.[0] ?? "—",
              sub:   allTimeStats.topCat ? `${allTimeStats.topCat[1]} unidades` : "",
            },
            {
              label: "Produtora com Mais Vendas",
              value: allTimeStats.topProdutora?.[0] ?? "—",
              sub:   allTimeStats.topProdutora ? fmtBRL(allTimeStats.topProdutora[1]) : "",
            },
          ].map(stat => (
            <div key={stat.label} className="bg-cream border border-sand p-6 flex flex-col gap-2 shadow-sm">
              <p className={labelCls}>{stat.label}</p>
              <p className="font-serif text-[1.2rem] text-espresso font-medium leading-tight truncate">{stat.value}</p>
              {stat.sub && <p className="font-sans text-[0.65rem] text-espresso/35">{stat.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-cream border border-sand p-6 flex flex-col gap-5 shadow-sm">
        <p className={labelCls}>Filtros — afetam produtos, categorias e gráfico abaixo</p>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ key, label }) => (
            <button key={key} onClick={() => setPreset(key)} className={pillCls(preset === key)}>
              {label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className={labelCls}>De</span>
            <input
              type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="bg-cream border border-sand px-3 py-2 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40"
            />
            <span className={labelCls}>Até</span>
            <input
              type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="bg-cream border border-sand px-3 py-2 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <select
            value={filterProdutora} onChange={e => setFilterProdutora(e.target.value)}
            className="bg-cream border border-sand px-4 py-2.5 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40 cursor-pointer"
          >
            <option value="all">Todas as produtoras</option>
            {produtorasList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
            className="bg-cream border border-sand px-4 py-2.5 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40 cursor-pointer"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {filteredPedidos > 0 && (
          <p className="font-sans text-[0.72rem] text-espresso/50">
            {filteredPedidos} pedido{filteredPedidos !== 1 ? "s" : ""} · {fmtBRL(filteredReceita)} no período selecionado
          </p>
        )}
      </div>

      {/* ── Products table ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <h3 className="font-serif text-xl text-espresso">Produtos</h3>
        <div className="bg-cream border border-sand shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-sand bg-sand/5">
                  {["", "Produto", "Produtora", "Categoria", "Vendido", "Receita", "% total"].map((h, i) => (
                    <th key={i} className="px-5 py-4 font-sans text-[0.58rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productsTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center font-serif text-lg text-espresso/30 italic">
                      Nenhum dado no período selecionado.
                    </td>
                  </tr>
                ) : productsTable.map((row, idx) => (
                  <tr
                    key={`${row.nome}-${idx}`}
                    className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      {row.foto ? (
                        <img src={row.foto} alt={row.nome} className="w-9 h-9 object-cover bg-sand/30 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-sand/40 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-espresso/20" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-[0.82rem] text-espresso font-medium">{row.nome}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-terracota/10 text-terracota font-sans text-[0.54rem] font-bold tracking-wide uppercase whitespace-nowrap">
                            Mais vendido
                          </span>
                        )}
                        {idx === productsTable.length - 1 && productsTable.length > 1 && (
                          <span className="px-1.5 py-0.5 bg-sand text-espresso/40 font-sans text-[0.54rem] font-bold tracking-wide uppercase whitespace-nowrap">
                            Menos vendido
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-sans text-[0.78rem] text-espresso/60 whitespace-nowrap">{row.produtor || "—"}</td>
                    <td className="px-5 py-4 font-sans text-[0.78rem] text-espresso/60 whitespace-nowrap">{row.categoria || "—"}</td>
                    <td className="px-5 py-4 font-sans text-[0.82rem] text-espresso font-medium tabular-nums whitespace-nowrap">{row.qty} un.</td>
                    <td className="px-5 py-4 font-sans text-[0.82rem] text-espresso font-medium tabular-nums whitespace-nowrap">{fmtBRL(row.receita)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-sand/40 w-16 flex-shrink-0">
                          <div className="h-full bg-caramel/70" style={{ width: `${Math.min(row.pct, 100)}%` }} />
                        </div>
                        <span className="font-sans text-[0.7rem] text-espresso/50 tabular-nums whitespace-nowrap">{row.pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Categories ──────────────────────────────────────────────────────── */}
      {categoriesData.length > 0 && (
        <div className="flex flex-col gap-5">
          <h3 className="font-serif text-xl text-espresso">Categorias</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {categoriesData.map(cat => (
              <div key={cat.name} className="bg-cream border border-sand p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <cat.Icon size={15} strokeWidth={1.7} className="text-caramel flex-shrink-0" />
                  <span className="font-sans text-[0.75rem] font-semibold text-espresso leading-tight">{cat.name}</span>
                </div>
                <div>
                  <p className="font-serif text-2xl text-espresso">{cat.qty}</p>
                  <p className={`${labelCls} mt-0.5`}>unidades</p>
                </div>
                <div className="pt-3 border-t border-sand flex flex-col gap-1">
                  <p className="font-sans text-[0.82rem] text-espresso font-medium">{fmtBRL(cat.receita)}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-sand/40">
                      <div className="h-full bg-caramel/60" style={{ width: `${Math.min(cat.pct, 100)}%` }} />
                    </div>
                    <span className={`${labelCls} whitespace-nowrap`}>{cat.pct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sales evolution chart ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <h3 className="font-serif text-xl text-espresso">Evolução de Vendas</h3>
        <div className="bg-cream border border-sand p-8 shadow-sm">
          {chartBuckets.every(b => b.value === 0) ? (
            <div className="h-48 flex items-center justify-center">
              <p className="font-serif text-lg text-espresso/30 italic">Sem dados no período selecionado.</p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-48">
                {chartBuckets.map(({ label, value }) => {
                  const pct = Math.max(Math.round((value / chartMax) * 92), value > 0 ? 4 : 2);
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-2.5 group min-w-0">
                      <div
                        className="w-full bg-sand/70 group-hover:bg-terracota transition-colors duration-300 relative"
                        style={{ height: `${pct}%` }}
                      >
                        {value > 0 && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-espresso text-cream text-[0.58rem] px-1.5 py-0.5 pointer-events-none whitespace-nowrap z-10">
                            {fmtBRL(value)}
                          </div>
                        )}
                      </div>
                      <span className="font-sans text-[0.52rem] sm:text-[0.58rem] uppercase tracking-tight text-espresso/40 font-bold text-center truncate w-full px-0.5">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-sand flex items-center justify-between">
                <p className={labelCls}>Receita por período (hover para ver valor)</p>
                <p className="font-sans text-[0.72rem] text-espresso/60 font-medium">{fmtBRL(filteredReceita)} total</p>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
