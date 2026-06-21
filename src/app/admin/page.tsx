"use client";

import { useState, useEffect } from "react";
import { Users, ShoppingBag, TrendingUp, Wallet, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface RecentOrder {
  id: string;
  numero: string;
  nome_cliente: string;
  total: number;
  status: string;
  criado_em: string;
  itens_pedido: { produtor: string }[];
}

interface ChartDay {
  day: string;
  barPct: number;
  total: number;
}

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function statusColor(s: string) {
  if (s === "confirmado") return "bg-olive/10 text-olive";
  if (s === "em_preparo") return "bg-blue-50 text-blue-600";
  if (s === "entregue") return "bg-espresso/10 text-espresso";
  if (s === "cancelado") return "bg-terracota/10 text-terracota";
  return "bg-amber-100 text-amber-600";
}

export default function AdminOverview() {
  const [produtorasAtivas, setProdutorasAtivas] = useState<number>(0);
  const [pedidosHoje, setPedidosHoje] = useState<number>(0);
  const [receitaMes, setReceitaMes] = useState<number>(0);
  const [comissaoTotal, setComissaoTotal] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();

      const [
        { count: activeCount },
        { count: todayCount },
        { data: monthRows },
        { data: nonCancelledRows },
        { data: recentRows },
        { data: weekRows },
      ] = await Promise.all([
        supabase.from("produtoras").select("*", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("pedidos").select("*", { count: "exact", head: true }).gte("criado_em", todayStart).lt("criado_em", tomorrowStart),
        supabase.from("pedidos").select("total").gte("criado_em", monthStart).lt("criado_em", nextMonthStart),
        supabase.from("pedidos").select("total").neq("status", "cancelado"),
        supabase.from("pedidos").select("id, numero, nome_cliente, total, status, criado_em, itens_pedido(produtor)").order("criado_em", { ascending: false }).limit(5),
        supabase.from("pedidos").select("criado_em, total").gte("criado_em", sevenDaysAgo).order("criado_em", { ascending: true }),
      ]);

      setProdutorasAtivas(activeCount ?? 0);
      setPedidosHoje(todayCount ?? 0);
      setReceitaMes((monthRows ?? []).reduce((s, o) => s + (o.total ?? 0), 0));
      setComissaoTotal((nonCancelledRows ?? []).reduce((s, o) => s + (o.total ?? 0) * 0.1, 0));
      setRecentOrders((recentRows ?? []) as RecentOrder[]);

      // Build 7-day chart
      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      (weekRows ?? []).forEach((o) => {
        const date = (o.criado_em as string).slice(0, 10);
        if (date in dayMap) dayMap[date] += o.total ?? 0;
      });
      const entries = Object.entries(dayMap);
      const maxVal = Math.max(...entries.map(([, v]) => v), 1);
      setChartData(
        entries.map(([date, total]) => ({
          day: DAYS_PT[new Date(date + "T12:00:00").getDay()],
          barPct: Math.max(Math.round((total / maxVal) * 92), total > 0 ? 4 : 2),
          total,
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: "Produtoras Ativas", value: String(produtorasAtivas), icon: Users, color: "text-espresso" },
    { label: "Pedidos Hoje", value: String(pedidosHoje), icon: ShoppingBag, color: "text-terracota" },
    { label: "Receita do Mês", value: fmtBRL(receitaMes), icon: Wallet, color: "text-olive" },
    { label: "Comissão Acumulada", value: fmtBRL(comissaoTotal), icon: TrendingUp, color: "text-espresso" },
  ];

  return (
    <div className="flex flex-col gap-10">

      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-3xl text-espresso">Visão Geral</h2>
        <p className="font-sans text-sm text-espresso/45">Bem-vindo ao centro de controle da Feitoria.</p>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-cream border border-sand p-6 flex flex-col gap-5 shadow-sm">
            <div className={`w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">{stat.label}</p>
              {loading
                ? <div className="h-8 w-24 bg-sand/50 animate-pulse" />
                : <p className="font-serif text-2xl text-espresso font-medium">{stat.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart + Recent Orders ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Bar chart */}
        <div className="lg:col-span-1 bg-cream border border-sand p-8 flex flex-col shadow-sm">
          <div className="mb-8">
            <h3 className="font-serif text-xl text-espresso">Vendas (7 dias)</h3>
            <p className="font-sans text-xs text-espresso/40 mt-1">Receita diária em reais</p>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 h-48">
            {loading
              ? [...Array(7)].map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full bg-sand/30 animate-pulse" style={{ height: `${40 + i * 8}%` }} />
                    <div className="h-2 w-5 bg-sand/30 animate-pulse" />
                  </div>
                ))
              : chartData.map((item) => (
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

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-cream border border-sand flex flex-col shadow-sm">
          <div className="p-8 border-b border-sand flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl text-espresso">Últimos Pedidos</h3>
              <p className="font-sans text-xs text-espresso/40 mt-1">Atividade recente do marketplace</p>
            </div>
            <button className="text-espresso/30 hover:text-espresso transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand/50 bg-sand/5">
                  {["ID", "Cliente", "Produtora", "Valor", "Status"].map((h) => (
                    <th key={h} className="px-8 py-4 font-sans text-[0.6rem] tracking-widest uppercase text-espresso/35 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-sans text-[0.82rem]">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-sand/30 last:border-0">
                        {[1,2,3,4,5].map((j) => (
                          <td key={j} className="px-8 py-5">
                            <div className="h-3 bg-sand/40 animate-pulse rounded w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors">
                        <td className="px-8 py-5 text-espresso font-medium">{o.numero}</td>
                        <td className="px-8 py-5 text-espresso/70">{o.nome_cliente}</td>
                        <td className="px-8 py-5 text-espresso/70">{o.itens_pedido?.[0]?.produtor ?? "—"}</td>
                        <td className="px-8 py-5 text-espresso font-medium">R$ {o.total.toFixed(2).replace(".", ",")}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${statusColor(o.status)}`}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {!loading && recentOrders.length === 0 && (
            <div className="py-12 text-center">
              <p className="font-serif text-lg text-espresso/30 italic">Nenhum pedido ainda.</p>
            </div>
          )}

          <div className="p-5 text-center border-t border-sand">
            <a href="/admin/pedidos" className="font-sans text-[0.65rem] tracking-[0.15em] uppercase text-caramel font-bold hover:text-terracota transition-colors">
              Ver todos os pedidos
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
