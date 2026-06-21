"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, User, Store } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface Pedido {
  id: string;
  numero: string;
  nome_cliente: string;
  total: number;
  status: string;
  criado_em: string;
  itens_pedido: { produtor: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const FILTER_OPTIONS = ["Todos", "pendente", "confirmado", "em_preparo", "entregue", "cancelado"];

function statusColor(s: string) {
  if (s === "confirmado") return "bg-olive/10 text-olive";
  if (s === "em_preparo") return "bg-blue-50 text-blue-600";
  if (s === "entregue") return "bg-espresso/10 text-espresso";
  if (s === "cancelado") return "bg-terracota/10 text-terracota";
  return "bg-amber-100 text-amber-600";
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, numero, nome_cliente, total, status, criado_em, itens_pedido(produtor)")
      .order("criado_em", { ascending: false });

    if (error) console.error("[AdminPedidos] Erro:", error);
    setOrders((data ?? []) as Pedido[]);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    const { error } = await supabase.from("pedidos").update({ status: newStatus }).eq("id", id);
    if (error) {
      console.error("[AdminPedidos] Erro ao atualizar status:", error);
    } else {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
    setUpdating(null);
  }

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      o.numero.toLowerCase().includes(term) ||
      o.nome_cliente.toLowerCase().includes(term) ||
      (o.itens_pedido?.[0]?.produtor ?? "").toLowerCase().includes(term);
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
          {FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`
                flex-shrink-0 px-4 py-2 font-sans text-[0.65rem] font-bold uppercase tracking-widest border transition-all duration-200
                ${statusFilter === s
                  ? "bg-espresso text-cream border-espresso"
                  : "bg-cream text-espresso/40 border-sand hover:border-espresso/30"}
              `}
            >
              {s === "Todos" ? "Todos" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
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
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[0.82rem]">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-sand/30 last:border-0">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <td key={j} className="px-8 py-5">
                          <div className="h-4 bg-sand/40 animate-pulse rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((o) => (
                    <tr key={o.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-espresso font-semibold">{o.numero}</span>
                          <div className="flex items-center gap-1.5 text-[0.65rem] text-espresso/40 mt-1">
                            <Calendar size={10} />
                            {new Date(o.criado_em).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-espresso/70">
                          <User size={12} className="text-espresso/20" />
                          {o.nome_cliente}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-espresso/70">
                          <Store size={12} className="text-espresso/20" />
                          {o.itens_pedido?.[0]?.produtor ?? "—"}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-espresso font-medium">
                        R$ {o.total.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${statusColor(o.status)}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <select
                          value={o.status}
                          disabled={updating === o.id}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="bg-cream border border-sand font-sans text-[0.72rem] text-espresso px-2 py-1.5 focus:outline-none focus:border-espresso/40 disabled:opacity-40 cursor-pointer"
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-espresso/30 italic">Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>

    </div>
  );
}
