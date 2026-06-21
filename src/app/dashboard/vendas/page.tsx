"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface ItemRow { pedido_id: string; preco_unitario: number; quantidade: number }
interface PedidoRow { id: string; numero: string; total: number; status: string; criado_em: string }

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function DashboardVendasPage() {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [itens, setItens] = useState<ItemRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: produtos } = await supabase
        .from("produtos").select("id").eq("produtora_id", user.id);

      const productIds = (produtos ?? []).map((p: { id: string }) => p.id);
      if (productIds.length === 0) { setLoading(false); return; }

      const { data: itensData } = await supabase
        .from("itens_pedido")
        .select("pedido_id, preco_unitario, quantidade")
        .in("produto_id", productIds);

      const pedidoIds = [...new Set((itensData ?? []).map((i: ItemRow) => i.pedido_id))];
      if (pedidoIds.length === 0) { setLoading(false); return; }

      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("id, numero, total, status, criado_em")
        .in("id", pedidoIds)
        .order("criado_em", { ascending: false });

      setPedidos((pedidosData ?? []) as PedidoRow[]);
      setItens((itensData ?? []) as ItemRow[]);
      setLoading(false);
    }
    load();
  }, []);

  // ── Aggregações ──────────────────────────────────────────────────────────────
  const cancelledIds = new Set(pedidos.filter(p => p.status === "cancelado").map(p => p.id));

  // Receita = soma dos meus itens excluindo pedidos cancelados
  const receita = itens
    .filter(i => !cancelledIds.has(i.pedido_id))
    .reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);

  const totalPedidos = pedidos.length;
  const entregues = pedidos.filter(p => p.status === "entregue").length;
  const ativos = pedidos.filter(p => p.status !== "cancelado").length;
  const ticketMedio = ativos > 0 ? receita / ativos : 0;

  // ── Gráfico 7 dias ───────────────────────────────────────────────────────────
  const now = new Date();
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  // Use os itens para calcular receita por dia (mais preciso)
  const pedidoDateMap = new Map(pedidos.map(p => [p.id, p.criado_em.slice(0, 10)]));
  itens.forEach(i => {
    if (cancelledIds.has(i.pedido_id)) return;
    const date = pedidoDateMap.get(i.pedido_id);
    if (date && date in dayMap) dayMap[date] += i.preco_unitario * i.quantidade;
  });

  const chartEntries = Object.entries(dayMap);
  const maxVal = Math.max(...chartEntries.map(([, v]) => v), 1);
  const chartData = chartEntries.map(([date, total]) => ({
    day: DAYS_PT[new Date(date + "T12:00:00").getDay()],
    barPct: Math.max(Math.round((total / maxVal) * 92), total > 0 ? 4 : 2),
    total,
  }));

  const stats = [
    { label: "Minha Receita", value: fmtBRL(receita), icon: DollarSign },
    { label: "Total de Pedidos", value: String(totalPedidos), icon: ShoppingBag },
    { label: "Entregues", value: String(entregues), icon: Package },
    { label: "Ticket Médio", value: fmtBRL(ticketMedio), icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col gap-10">

      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">Finanças</p>
        <h1 className="font-serif text-3xl text-espresso font-normal">Minhas Vendas</h1>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-sand p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/45 font-semibold">{label}</span>
              <Icon size={15} strokeWidth={1.6} className="text-espresso/25" />
            </div>
            {loading
              ? <div className="h-8 w-24 bg-sand/40 animate-pulse" />
              : <p className="font-serif text-2xl text-espresso font-normal leading-none">{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Gráfico 7 dias */}
      <div className="bg-white border border-sand p-8">
        <h3 className="font-serif text-xl text-espresso mb-1">Receita (7 dias)</h3>
        <p className="font-sans text-xs text-espresso/40 mb-8">Sua receita diária dos últimos 7 dias</p>
        <div className="flex items-end justify-between gap-2 h-40">
          {loading
            ? [...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-sand/30 animate-pulse" style={{ height: `${35 + i * 9}%` }} />
                  <div className="h-2 w-5 bg-sand/30 animate-pulse" />
                </div>
              ))
            : chartData.map(item => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-3 group">
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
                  <span className="font-sans text-[0.6rem] uppercase tracking-tighter text-espresso/40 font-bold">{item.day}</span>
                </div>
              ))
          }
        </div>
      </div>

      {/* Transações recentes */}
      {!loading && pedidos.length === 0 ? (
        <div className="border border-sand py-16 text-center">
          <p className="font-serif text-lg text-espresso/30 italic">Nenhuma venda ainda.</p>
        </div>
      ) : !loading && (
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-xl text-espresso font-normal">Transações Recentes</h3>
          <div className="border border-sand overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-sand">
                  {["Pedido", "Valor do Pedido", "Status", "Data"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-espresso/35 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.slice(0, 10).map(p => (
                  <tr key={p.id} className={`border-b border-sand/50 last:border-0 hover:bg-sand/25 transition-colors ${p.status === "cancelado" ? "opacity-45" : ""}`}>
                    <td className="px-4 py-3.5 font-sans text-xs text-espresso/50">{p.numero}</td>
                    <td className="px-4 py-3.5 font-sans text-sm text-espresso font-medium">
                      R$ {p.total.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 border
                        ${p.status === "entregue"   ? "text-espresso bg-sand       border-sand" :
                          p.status === "confirmado" ? "text-olive    bg-olive/8    border-olive/20" :
                          p.status === "cancelado"  ? "text-wine     bg-wine/8     border-wine/20" :
                          p.status === "em_preparo" ? "text-blue-600 bg-blue-50    border-blue-200" :
                          "text-caramel bg-caramel/8 border-caramel/20"}`}>
                        {p.status === "em_preparo" ? "Em preparo" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans text-xs text-espresso/40 whitespace-nowrap">
                      {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
