"use client";

import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Produtoras Ativas", value: "32", change: "+4", isUp: true, icon: Users, color: "text-espresso" },
  { label: "Pedidos Hoje", value: "12", change: "+15%", isUp: true, icon: ShoppingBag, color: "text-terracota" },
  { label: "Receita do Mês", value: "R$ 14.280,50", change: "+8%", isUp: true, icon: Wallet, color: "text-olive" },
  { label: "Comissão Acumulada", value: "R$ 2.142,00", change: "-2%", isUp: false, icon: TrendingUp, color: "text-espresso" },
];

const RECENT_ORDERS = [
  { id: "#1245", client: "Ana Beatriz", producer: "Ateliê das Flores", value: 89.0, status: "Confirmado", date: "31/05/2026" },
  { id: "#1244", client: "Carlos Eduardo", producer: "Grão Fermentado", value: 42.0, status: "Em preparo", date: "31/05/2026" },
  { id: "#1243", client: "Mariana Silva", producer: "Casa Mato Verde", value: 145.0, status: "Confirmado", date: "30/05/2026" },
  { id: "#1242", client: "João Pedro", producer: "Sítio Primavera", value: 54.0, status: "Entregue", date: "30/05/2026" },
  { id: "#1241", client: "Julia Costa", producer: "Ateliê das Flores", value: 12.0, status: "Cancelado", date: "29/05/2026" },
];

const SALES_CHART = [
  { day: "Seg", value: 40 },
  { day: "Ter", value: 65 },
  { day: "Qua", value: 45 },
  { day: "Qui", value: 80 },
  { day: "Sex", value: 95 },
  { day: "Sáb", value: 70 },
  { day: "Dom", value: 55 },
];

export default function AdminOverview() {
  return (
    <div className="flex flex-col gap-10">
      
      {/* ── Welcome ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-3xl text-espresso">Visão Geral</h2>
        <p className="font-sans text-sm text-espresso/45">Bem-vindo ao centro de controle da Feitoria.</p>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-cream border border-sand p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} strokeWidth={2} />
              </div>
              <div className={`flex items-center gap-1 font-sans text-[0.65rem] font-bold ${stat.isUp ? "text-olive" : "text-terracota"}`}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">{stat.label}</p>
              <p className="font-serif text-2xl text-espresso font-medium">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts & Main Area ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Sales Activity (Chart) */}
        <div className="lg:col-span-1 bg-cream border border-sand p-8 flex flex-col shadow-sm">
          <div className="mb-8">
            <h3 className="font-serif text-xl text-espresso">Vendas (7 dias)</h3>
            <p className="font-sans text-xs text-espresso/40 mt-1">Volume de transações diárias</p>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-48">
            {SALES_CHART.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-3 group">
                <div 
                  className="w-full bg-sand group-hover:bg-terracota transition-colors duration-300 relative"
                  style={{ height: `${item.value}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-espresso text-cream text-[0.6rem] px-1.5 py-0.5 pointer-events-none">
                    {item.value}
                  </div>
                </div>
                <span className="font-sans text-[0.6rem] uppercase tracking-tighter text-espresso/40 font-bold">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Table */}
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
                  <th className="px-8 py-4 font-sans text-[0.6rem] tracking-widest uppercase text-espresso/35 font-bold">ID</th>
                  <th className="px-8 py-4 font-sans text-[0.6rem] tracking-widest uppercase text-espresso/35 font-bold">Cliente</th>
                  <th className="px-8 py-4 font-sans text-[0.6rem] tracking-widest uppercase text-espresso/35 font-bold">Produtora</th>
                  <th className="px-8 py-4 font-sans text-[0.6rem] tracking-widest uppercase text-espresso/35 font-bold">Valor</th>
                  <th className="px-8 py-4 font-sans text-[0.6rem] tracking-widest uppercase text-espresso/35 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="font-sans text-[0.82rem]">
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors">
                    <td className="px-8 py-5 text-espresso font-medium">{order.id}</td>
                    <td className="px-8 py-5 text-espresso/70">{order.client}</td>
                    <td className="px-8 py-5 text-espresso/70">{order.producer}</td>
                    <td className="px-8 py-5 text-espresso font-medium">R$ {order.value.toFixed(2).replace(".", ",")}</td>
                    <td className="px-8 py-5">
                      <span className={`
                        inline-flex px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider
                        ${order.status === "Confirmado" ? "bg-olive/10 text-olive" : 
                          order.status === "Em preparo" ? "bg-sand-dark/10 text-espresso/60" :
                          order.status === "Entregue" ? "bg-espresso/10 text-espresso" :
                          "bg-terracota/10 text-terracota"}
                      `}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
