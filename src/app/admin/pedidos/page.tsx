"use client";

import { useState } from "react";
import { 
  Search, 
  MoreHorizontal,
  ChevronDown,
  Calendar,
  User,
  Store
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_ORDERS = [
  { id: "#1245", client: "Ana Beatriz", producer: "Ateliê das Flores", product: "Torta de Lavanda", value: 89.0, status: "Confirmado", date: "31/05/2026" },
  { id: "#1244", client: "Carlos Eduardo", producer: "Grão Fermentado", product: "Pão de Centeio", value: 42.0, status: "Em preparo", date: "31/05/2026" },
  { id: "#1243", client: "Mariana Silva", producer: "Casa Mato Verde", product: "Kit Café Especial", value: 145.0, status: "Pendente", date: "30/05/2026" },
  { id: "#1242", client: "João Pedro", producer: "Sítio Primavera", product: "Café Especial", value: 54.0, status: "Entregue", date: "30/05/2026" },
  { id: "#1241", client: "Julia Costa", producer: "Ateliê das Flores", product: "Brigadeiro Pistache", value: 12.0, status: "Cancelado", date: "29/05/2026" },
  { id: "#1240", client: "Ricardo Gomes", producer: "Massa & Cia", product: "Lasanha Artesanal", value: 45.0, status: "Entregue", date: "28/05/2026" },
];

const STATUS_OPTIONS = ["Todos", "Pendente", "Confirmado", "Em preparo", "Entregue", "Cancelado"];

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = ALL_ORDERS.filter(o => {
    const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.producer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8">
      
      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por ID, cliente ou produtora..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cream border border-sand py-2.5 pl-10 pr-4 font-sans text-sm focus:outline-none focus:border-terracota transition-colors placeholder:text-espresso/30"
          />
          <Search className="absolute left-3 top-3 text-espresso/30" size={16} />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                flex-shrink-0 px-4 py-2 font-sans text-[0.65rem] font-bold uppercase tracking-widest border transition-all duration-200
                ${statusFilter === status 
                  ? "bg-espresso text-cream border-espresso" 
                  : "bg-cream text-espresso/40 border-sand hover:border-espresso/30"}
              `}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders Table ────────────────────────────────────────────────────── */}
      <div className="bg-cream border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-sand/5">
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Pedido</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Cliente</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Produtora</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Valor</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Status</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[0.82rem]">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-espresso font-semibold">{o.id}</span>
                      <div className="flex items-center gap-1.5 text-[0.65rem] text-espresso/40 mt-1">
                        <Calendar size={10} />
                        {o.date}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-espresso/70">
                      <User size={12} className="text-espresso/20" />
                      {o.client}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-espresso/70">
                      <Store size={12} className="text-espresso/20" />
                      {o.producer}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-espresso font-medium">
                    R$ {o.value.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      inline-flex px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider
                      ${o.status === "Confirmado" ? "bg-olive/10 text-olive" : 
                        o.status === "Pendente" ? "bg-amber-100 text-amber-600" :
                        o.status === "Em preparo" ? "bg-blue-50 text-blue-600" :
                        o.status === "Entregue" ? "bg-espresso/10 text-espresso" :
                        "bg-terracota/10 text-terracota"}
                    `}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-espresso/30 hover:text-espresso transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-espresso/30 italic">Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>

    </div>
  );
}
