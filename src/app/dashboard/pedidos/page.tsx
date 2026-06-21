"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface ItemRow {
  pedido_id: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
}

interface PedidoRow {
  id: string;
  numero: string;
  nome_cliente: string;
  total: number;
  status: string;
  criado_em: string;
  itens: ItemRow[];
}

const STATUS_STYLES: Record<string, string> = {
  pendente:   "text-caramel  bg-caramel/8  border-caramel/20",
  confirmado: "text-olive    bg-olive/8    border-olive/20",
  em_preparo: "text-blue-600 bg-blue-50    border-blue-200",
  entregue:   "text-espresso bg-sand       border-sand",
  cancelado:  "text-wine     bg-wine/8     border-wine/20",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente", confirmado: "Confirmado",
  em_preparo: "Em preparo", entregue: "Entregue", cancelado: "Cancelado",
};

const FILTER_OPTIONS = ["Todos", "pendente", "confirmado", "em_preparo", "entregue", "cancelado"];

export default function DashboardPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. IDs dos produtos desta produtora
      const { data: produtos } = await supabase
        .from("produtos")
        .select("id")
        .eq("produtora_id", user.id);

      const productIds = (produtos ?? []).map((p: { id: string }) => p.id);
      if (productIds.length === 0) { setLoading(false); return; }

      // 2. Itens de pedido com esses produtos
      const { data: itens } = await supabase
        .from("itens_pedido")
        .select("pedido_id, nome_produto, quantidade, preco_unitario")
        .in("produto_id", productIds);

      const pedidoIds = [...new Set((itens ?? []).map((i: ItemRow) => i.pedido_id))];
      if (pedidoIds.length === 0) { setLoading(false); return; }

      // Agrupa itens por pedido
      const itensByPedido: Record<string, ItemRow[]> = {};
      (itens ?? []).forEach((i: ItemRow) => {
        if (!itensByPedido[i.pedido_id]) itensByPedido[i.pedido_id] = [];
        itensByPedido[i.pedido_id].push(i);
      });

      // 3. Pedidos
      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("id, numero, nome_cliente, total, status, criado_em")
        .in("id", pedidoIds)
        .order("criado_em", { ascending: false });

      setPedidos(
        (pedidosData ?? []).map((p: Omit<PedidoRow, "itens">) => ({
          ...p,
          itens: itensByPedido[p.id] ?? [],
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = pedidos.filter(p =>
    statusFilter === "Todos" || p.status === statusFilter
  );

  return (
    <div className="flex flex-col gap-8">

      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">Pedidos</p>
        <h1 className="font-serif text-3xl text-espresso font-normal">Meus Pedidos</h1>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_OPTIONS.map(s => (
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

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-sand/40 animate-pulse" />)}
        </div>
      ) : (
        <div className="border border-sand overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-sand">
                {["Pedido", "Cliente", "Produto(s)", "Valor", "Status", "Data"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-espresso/35 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="font-serif text-lg text-espresso/30 italic">Nenhum pedido encontrado.</p>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/25 transition-colors">
                  <td className="px-4 py-3.5 font-sans text-xs text-espresso/50 whitespace-nowrap">{p.numero}</td>
                  <td className="px-4 py-3.5 font-sans text-sm text-espresso/70 whitespace-nowrap">{p.nome_cliente}</td>
                  <td className="px-4 py-3.5 font-sans text-sm text-espresso">
                    {p.itens[0]?.nome_produto ?? "—"}
                    {p.itens.length > 1 && (
                      <span className="text-espresso/40 text-xs"> +{p.itens.length - 1} item{p.itens.length > 2 ? "s" : ""}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-sans text-sm text-espresso font-medium whitespace-nowrap">
                    R$ {p.total.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 border ${STATUS_STYLES[p.status] ?? ""}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
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
      )}

    </div>
  );
}
