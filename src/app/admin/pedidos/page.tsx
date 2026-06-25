"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Calendar, User, Store, ShoppingCart, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Pedido {
  id: string;
  numero: string;
  nome_cliente: string;
  total: number;
  status: string;
  canal_origem: string | null;
  criado_em: string;
  itens_pedido: { produtor: string }[];
}

interface CarrinhoAbandonado {
  id: string;
  email: string | null;
  itens: { nome: string; quantidade: number; preco: number }[];
  valor_total: number;
  ultima_atualizacao: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const FILTER_OPTIONS = ["Todos", "pendente", "confirmado", "em_preparo", "entregue", "cancelado"];

const DATE_RANGES = [
  { label: "Todos", value: "" },
  { label: "Hoje", value: "hoje" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Personalizado", value: "custom" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === "confirmado") return "bg-olive/10 text-olive";
  if (s === "em_preparo") return "bg-blue-50 text-blue-600";
  if (s === "entregue") return "bg-espresso/10 text-espresso";
  if (s === "cancelado") return "bg-terracota/10 text-terracota";
  return "bg-amber-100 text-amber-600";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h atrás`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d atrás`;
}

// ── Shared pill ──────────────────────────────────────────────────────────────

function FilterPill({
  label, active, onClick, accent = false,
}: { label: string; active: boolean; onClick: () => void; accent?: boolean }) {
  const baseActive = accent
    ? "bg-terracota text-cream border-terracota"
    : "bg-espresso text-cream border-espresso";
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-2 font-sans text-[0.65rem] font-bold uppercase tracking-widest border transition-all duration-200
        ${active ? baseActive : "bg-cream text-espresso/40 border-sand hover:border-espresso/30"}
      `}
    >
      {label}
    </button>
  );
}

// ── Pedidos tab ──────────────────────────────────────────────────────────────

function PedidosTab() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [onlyPending, setOnlyPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, numero, nome_cliente, total, status, canal_origem, criado_em, itens_pedido(produtor)")
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

  function handlePendingToggle() {
    if (onlyPending) {
      setOnlyPending(false);
    } else {
      setOnlyPending(true);
      setStatusFilter("Todos");
    }
  }

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setOnlyPending(false);
  }

  const pendingCount = orders.filter((o) => o.status === "pendente").length;

  const filtered = orders.filter((o) => {
    const effectiveStatus = onlyPending ? "pendente" : statusFilter;
    const matchesStatus = effectiveStatus === "Todos" || o.status === effectiveStatus;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      o.numero.toLowerCase().includes(term) ||
      o.nome_cliente.toLowerCase().includes(term) ||
      (o.itens_pedido?.[0]?.produtor ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">

      {/* Filters row */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {/* Quick: apenas pendentes */}
          <button
            onClick={handlePendingToggle}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-sans text-[0.65rem] font-bold uppercase tracking-widest border transition-all duration-200 whitespace-nowrap
              ${onlyPending
                ? "bg-terracota text-cream border-terracota"
                : "bg-cream text-terracota border-terracota/40 hover:border-terracota/70"
              }
            `}
          >
            Apenas Pendentes
            {pendingCount > 0 && (
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.6rem] font-bold ${onlyPending ? "bg-cream/20 text-cream" : "bg-terracota/10 text-terracota"}`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_OPTIONS.map((s) => (
            <FilterPill
              key={s}
              label={s === "Todos" ? "Todos" : STATUS_LABELS[s]}
              active={!onlyPending && statusFilter === s}
              onClick={() => handleStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-cream border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-sand/5">
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Pedido</th>
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Cliente</th>
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Produtora</th>
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Valor</th>
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Canal</th>
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Status</th>
                <th className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Alterar</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[0.82rem]">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-sand/30 last:border-0">
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-4 bg-sand/40 animate-pulse rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((o) => (
                    <tr key={o.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-espresso font-semibold">{o.numero}</span>
                          <div className="flex items-center gap-1.5 text-[0.65rem] text-espresso/40 mt-1">
                            <Calendar size={10} />
                            {new Date(o.criado_em).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-espresso/70">
                          <User size={12} className="text-espresso/20" />
                          {o.nome_cliente}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-espresso/70">
                          <Store size={12} className="text-espresso/20" />
                          {o.itens_pedido?.[0]?.produtor ?? "—"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-espresso font-medium">
                        R$ {o.total.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-6 py-5">
                        {(o.canal_origem === "ifood") ? (
                          <span className="inline-flex px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider bg-orange-50 text-orange-500 border border-orange-200">
                            iFood
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider bg-sand/60 text-espresso/50">
                            Site
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${statusColor(o.status)}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
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

// ── Carrinhos Abandonados tab ─────────────────────────────────────────────────

function CarrinhosAbandonadosTab() {
  const [carrinhos, setCarrinhos] = useState<CarrinhoAbandonado[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchCarrinhos = useCallback(async (r: string, from?: string, to?: string) => {
    setLoading(true);
    let url = "/api/admin/carrinhos-abandonados";
    if (r === "custom" && from && to) {
      url += `?from=${from}&to=${to}`;
    } else if (r && r !== "custom") {
      url += `?range=${r}`;
    }
    const res = await fetch(url);
    if (res.ok) setCarrinhos(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCarrinhos("7d"); }, [fetchCarrinhos]);

  function handleRangeChange(r: string) {
    setRange(r);
    if (r !== "custom") fetchCarrinhos(r);
  }

  function handleCustomSearch() {
    if (fromDate && toDate) fetchCarrinhos("custom", fromDate, toDate);
  }

  const valorTotal = carrinhos.reduce((s, c) => s + (c.valor_total ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {DATE_RANGES.map((dr) => (
          <FilterPill
            key={dr.value}
            label={dr.label}
            active={range === dr.value}
            onClick={() => handleRangeChange(dr.value)}
          />
        ))}
        {range === "custom" && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-cream border border-sand font-sans text-[0.78rem] text-espresso px-3 py-2 focus:outline-none focus:border-espresso/40"
            />
            <span className="font-sans text-[0.75rem] text-espresso/40">até</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-cream border border-sand font-sans text-[0.78rem] text-espresso px-3 py-2 focus:outline-none focus:border-espresso/40"
            />
            <button
              onClick={handleCustomSearch}
              disabled={!fromDate || !toDate}
              className="px-4 py-2 bg-espresso text-cream font-sans text-[0.65rem] font-bold uppercase tracking-widest hover:bg-caramel transition-colors disabled:opacity-40"
            >
              Buscar
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && carrinhos.length > 0 && (
        <div className="flex items-center gap-6 border border-sand px-6 py-4 bg-sand/10">
          <div>
            <p className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold mb-0.5">Carrinhos</p>
            <p className="font-serif text-2xl text-espresso">{carrinhos.length}</p>
          </div>
          <div className="w-px h-10 bg-sand" />
          <div>
            <p className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold mb-0.5">Valor potencial</p>
            <p className="font-serif text-2xl text-espresso">R$ {valorTotal.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="border border-sand px-6 py-5 flex flex-col gap-2">
              <div className="h-4 bg-sand/40 animate-pulse rounded w-40" />
              <div className="h-3 bg-sand/30 animate-pulse rounded w-64" />
            </div>
          ))
        ) : carrinhos.length === 0 ? (
          <div className="py-20 text-center border border-sand">
            <ShoppingCart size={32} className="mx-auto text-espresso/15 mb-4" strokeWidth={1.2} />
            <p className="font-serif text-xl text-espresso/30 italic">Nenhum carrinho abandonado no período.</p>
          </div>
        ) : (
          carrinhos.map((c) => {
            const nomes = (c.itens ?? []).map((i) => i.nome).filter(Boolean).join(", ");
            return (
              <div key={c.id} className="border border-sand px-6 py-5 hover:bg-sand/5 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-espresso/30 flex-shrink-0" />
                      <span className="font-sans text-[0.82rem] text-espresso font-medium">
                        {c.email ?? "Visitante"}
                      </span>
                    </div>
                    {nomes && (
                      <p className="font-sans text-[0.75rem] text-espresso/50 truncate max-w-lg pl-5">
                        {nomes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <span className="font-serif text-lg text-espresso">
                      R$ {(c.valor_total ?? 0).toFixed(2).replace(".", ",")}
                    </span>
                    <div className="flex items-center gap-1.5 font-sans text-[0.7rem] text-espresso/35">
                      <Clock size={11} />
                      {relativeTime(c.ultima_atualizacao)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Tab = "pedidos" | "carrinhos";

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState<Tab>("pedidos");

  return (
    <div className="flex flex-col gap-8">

      {/* Tab bar */}
      <div className="flex border-b border-sand gap-1">
        {([
          { id: "pedidos", label: "Pedidos" },
          { id: "carrinhos", label: "Carrinhos Abandonados" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-6 py-3.5 font-sans text-[0.65rem] font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors
              ${activeTab === tab.id
                ? "border-terracota text-terracota"
                : "border-transparent text-espresso/40 hover:text-espresso/70"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "pedidos"    && <PedidosTab />}
      {activeTab === "carrinhos" && <CarrinhosAbandonadosTab />}

    </div>
  );
}
