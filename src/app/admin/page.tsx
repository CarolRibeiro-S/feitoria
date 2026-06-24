"use client";

import { useState, useEffect } from "react";
import {
  Users, ShoppingBag, TrendingUp, Wallet, MoreHorizontal,
  Award, Clock, BarChart2, UserCheck,
} from "lucide-react";
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

interface TopProduto {
  nome: string;
  quantidade: number;
}

interface EntregaTipo {
  tipo: string;
  count: number;
  pct: number;
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
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [naoCanceladosCount, setNaoCanceladosCount] = useState<number>(0);
  const [pedidosTotalCount, setPedidosTotalCount] = useState<number>(0);
  const [entregaTipos, setEntregaTipos] = useState<EntregaTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

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
        { data: itensPedido },
        { count: pedidosTotal },
        { data: entregaRows },
      ] = await Promise.all([
        supabase.from("produtoras").select("*", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("pedidos").select("*", { count: "exact", head: true }).gte("criado_em", todayStart).lt("criado_em", tomorrowStart),
        supabase.from("pedidos").select("total").gte("criado_em", monthStart).lt("criado_em", nextMonthStart),
        supabase.from("pedidos").select("total").neq("status", "cancelado"),
        supabase.from("pedidos").select("id, numero, nome_cliente, total, status, criado_em, itens_pedido(produtor)").order("criado_em", { ascending: false }).limit(5),
        supabase.from("pedidos").select("criado_em, total").gte("criado_em", sevenDaysAgo).order("criado_em", { ascending: true }),
        supabase.from("itens_pedido").select("quantidade, nome, produto_id, produtos(nome)"),
        supabase.from("pedidos").select("*", { count: "exact", head: true }),
        supabase.from("pedidos").select("tipo_entrega"),
      ]);

      setProdutorasAtivas(activeCount ?? 0);
      setPedidosHoje(todayCount ?? 0);
      setReceitaMes((monthRows ?? []).reduce((s, o) => s + (o.total ?? 0), 0));
      const nonCancelled = nonCancelledRows ?? [];
      setComissaoTotal(nonCancelled.reduce((s, o) => s + (o.total ?? 0) * 0.1, 0));
      setNaoCanceladosCount(nonCancelled.length);
      setPedidosTotalCount(pedidosTotal ?? 0);
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

      // Top produtos — aggregate by produto_id, fallback to denormalized nome
      const prodMap: Record<string, { nome: string; quantidade: number }> = {};
      for (const item of (itensPedido ?? [])) {
        const key = (item.produto_id as string) ?? (item.nome as string) ?? "desconhecido";
        if (!key) continue;
        const nomeFinal = (item.nome as string) ?? (item.produtos as any)?.nome ?? key;
        if (!prodMap[key]) prodMap[key] = { nome: nomeFinal, quantidade: 0 };
        prodMap[key].quantidade += (item.quantidade as number) ?? 1;
      }
      setTopProdutos(
        Object.values(prodMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5)
      );

      // Entrega tipos
      const tipoMap: Record<string, number> = {};
      for (const p of (entregaRows ?? [])) {
        const tipo = (p.tipo_entrega as string) ?? "Não informado";
        tipoMap[tipo] = (tipoMap[tipo] ?? 0) + 1;
      }
      const entregaTotal = Object.values(tipoMap).reduce((s, v) => s + v, 0);
      setEntregaTipos(
        Object.entries(tipoMap)
          .map(([tipo, count]) => ({ tipo, count, pct: entregaTotal > 0 ? Math.round((count / entregaTotal) * 100) : 0 }))
          .sort((a, b) => b.count - a.count)
      );
    } finally {
      setLoading(false);
    }
  }

  const taxaConversao = pedidosTotalCount > 0
    ? Math.round((naoCanceladosCount / pedidosTotalCount) * 100)
    : 0;

  const stats = [
    { label: "Produtoras Ativas",  value: String(produtorasAtivas), icon: Users,     color: "text-espresso" },
    { label: "Pedidos Hoje",       value: String(pedidosHoje),      icon: ShoppingBag, color: "text-terracota" },
    { label: "Receita do Mês",     value: fmtBRL(receitaMes),       icon: Wallet,    color: "text-olive" },
    { label: "Comissão Acumulada", value: fmtBRL(comissaoTotal),    icon: TrendingUp, color: "text-espresso" },
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

      {/* ── Insights ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Produtos Mais Vendidos */}
        <div className="col-span-1 sm:col-span-2 bg-cream border border-sand p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-terracota">
              <Award size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold">Produtos Mais Vendidos</p>
              <p className="font-sans text-[0.65rem] text-espresso/30 mt-0.5">Top 5 por quantidade</p>
            </div>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3 pt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-sand/40 animate-pulse" style={{ width: `${85 - i * 13}%` }} />
              ))}
            </div>
          ) : topProdutos.length > 0 ? (
            <ol className="flex flex-col gap-3">
              {topProdutos.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`font-sans text-[0.68rem] font-bold w-5 flex-shrink-0 ${i < 3 ? "text-terracota" : "text-espresso/25"}`}>
                    {i + 1}º
                  </span>
                  <span className="font-sans text-[0.82rem] text-espresso/75 flex-1 truncate">{p.nome}</span>
                  <span className="font-sans text-[0.72rem] text-espresso/40 flex-shrink-0 tabular-nums">{p.quantidade} un.</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-serif text-sm text-espresso/30 italic">Sem dados de vendas ainda.</p>
          )}
        </div>

        {/* Horários Mais Acessados */}
        <div className="bg-cream border border-sand p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-caramel">
              <Clock size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold">Horários de Acesso</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-6">
            <div className="w-8 h-px bg-sand" />
            <p className="font-sans text-[0.8rem] text-espresso/45 leading-relaxed">
              Coletando dados de acesso.
            </p>
            <p className="font-sans text-[0.65rem] text-espresso/25">
              Disponível em breve.
            </p>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-cream border border-sand p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-olive flex-shrink-0">
              <BarChart2 size={18} strokeWidth={2} />
            </div>
            <div className="flex items-start gap-1.5 min-w-0">
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold leading-snug">
                Taxa de Conversão
                <span className="block text-[0.58rem] normal-case tracking-normal text-espresso/25 font-normal mt-0.5">estimativa</span>
              </p>
              <div className="relative flex-shrink-0 mt-0.5">
                <button
                  className="w-4 h-4 rounded-full bg-sand/60 text-espresso/40 text-[0.6rem] font-bold flex items-center justify-center hover:bg-sand transition-colors"
                  onMouseEnter={() => setTooltipVisible(true)}
                  onMouseLeave={() => setTooltipVisible(false)}
                >
                  ?
                </button>
                {tooltipVisible && (
                  <div className="absolute right-0 top-6 z-10 w-56 bg-espresso text-cream text-[0.68rem] leading-relaxed p-3 shadow-lg pointer-events-none">
                    Proxy provisório: pedidos não cancelados ÷ total de pedidos. Será atualizado com tracking de cliques em "adicionar ao carrinho".
                  </div>
                )}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="h-14 w-24 bg-sand/40 animate-pulse" />
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="font-serif text-4xl text-espresso font-medium">
                {taxaConversao}<span className="text-2xl text-espresso/40">%</span>
              </p>
              <p className="font-sans text-[0.65rem] text-espresso/30 leading-relaxed">
                {naoCanceladosCount} de {pedidosTotalCount} pedidos concluídos
              </p>
            </div>
          )}
        </div>

        {/* Perfil de Clientes */}
        <div className="col-span-1 sm:col-span-2 bg-cream border border-sand p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-espresso">
              <UserCheck size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold">Perfil de Clientes</p>
              <p className="font-sans text-[0.65rem] text-espresso/30 mt-0.5">Tipo de entrega preferido</p>
            </div>
          </div>
          {/* TODO: gênero do cliente requer novo campo no cadastro de usuarios */}
          {loading ? (
            <div className="flex flex-col gap-4 max-w-sm">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 w-32 bg-sand/40 animate-pulse" />
                  <div className="h-2 w-full bg-sand/30 animate-pulse" />
                </div>
              ))}
            </div>
          ) : entregaTipos.length > 0 ? (
            <div className="flex flex-col gap-4 max-w-sm">
              {entregaTipos.map((t) => (
                <div key={t.tipo} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[0.78rem] text-espresso/70 capitalize">{t.tipo}</span>
                    <span className="font-sans text-[0.7rem] text-espresso/40 tabular-nums">{t.pct}% · {t.count}</span>
                  </div>
                  <div className="h-1.5 bg-sand/30 w-full">
                    <div
                      className="h-full bg-caramel/60 transition-all duration-700"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-serif text-sm text-espresso/30 italic">Sem dados de entregas ainda.</p>
          )}
        </div>

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
