"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Package, Truck, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemPedido = {
  id: string;
  nome_produto: string;
  produtor: string;
  preco_unitario: number;
  quantidade: number;
};

type Pedido = {
  id: string;
  numero: string;
  criado_em: string;
  status: string;
  tipo_entrega: string;
  forma_pagamento: string;
  subtotal: number;
  frete: number;
  total: number;
  itens_pedido: ItemPedido[];
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string }> = {
  pendente:   { label: "Pendente",   cls: "text-caramel   border-caramel/30   bg-caramel/8"   },
  confirmado: { label: "Confirmado", cls: "text-olive     border-olive/30     bg-olive/8"     },
  em_preparo: { label: "Em preparo", cls: "text-terracota border-terracota/30 bg-terracota/8" },
  entregue:   { label: "Entregue",   cls: "text-espresso  border-espresso/20  bg-sand"        },
  cancelado:  { label: "Cancelado",  cls: "text-wine      border-wine/30      bg-wine/8"      },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      fetchPedidos(user.id);
    });
  }, [router]);

  async function fetchPedidos(userId: string) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, itens_pedido(*)")
      .eq("usuario_id", userId)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("[Pedidos] Erro ao buscar pedidos:", error);
    }

    setPedidos((data as Pedido[]) ?? []);
    setLoading(false);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-cream min-h-screen pt-28 lg:pt-40">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-sand/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (pedidos.length === 0) {
    return (
      <div className="bg-cream min-h-screen pt-28 lg:pt-40">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 flex flex-col items-center text-center gap-8 py-20">
          <Package size={40} strokeWidth={1.2} className="text-espresso/20" />
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-2xl text-espresso font-normal">
              Você ainda não fez nenhum pedido
            </h1>
            <p className="font-sans text-sm text-espresso/50 max-w-xs">
              Quando você finalizar uma compra, seus pedidos aparecerão aqui.
            </p>
          </div>
          <Link
            href="/produtos"
            className="font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase bg-terracota text-cream px-8 py-4 hover:bg-caramel transition-colors"
          >
            Explorar produtos
          </Link>
        </div>
      </div>
    );
  }

  // ── Orders list ───────────────────────────────────────────────────────────
  return (
    <div className="bg-cream min-h-screen pt-28 lg:pt-40 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="mb-10">
          <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
            Histórico
          </p>
          <h1 className="font-serif text-3xl text-espresso font-normal">Meus Pedidos</h1>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido) => {
            const expanded = expandedIds.has(pedido.id);
            const status = STATUS[pedido.status] ?? {
              label: pedido.status,
              cls: "text-espresso/50 border-sand bg-sand",
            };

            return (
              <div key={pedido.id} className="border border-sand bg-cream">

                {/* Order summary row */}
                <button
                  onClick={() => toggleExpand(pedido.id)}
                  className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-sand/20 transition-colors"
                >
                  {/* Number + date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-sans text-sm font-semibold text-espresso">
                        {pedido.numero}
                      </span>
                      <span
                        className={`font-sans text-[0.62rem] font-semibold tracking-[0.18em] uppercase px-2.5 py-1 border ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-espresso/45 mt-1">
                      {formatDate(pedido.criado_em)}
                    </p>
                  </div>

                  {/* Delivery type */}
                  <div className="hidden sm:flex items-center gap-1.5 text-espresso/50 flex-shrink-0">
                    {pedido.tipo_entrega === "entrega" ? (
                      <Truck size={13} strokeWidth={1.6} />
                    ) : (
                      <MapPin size={13} strokeWidth={1.6} />
                    )}
                    <span className="font-sans text-xs">
                      {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}
                    </span>
                  </div>

                  {/* Total + chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0">
                    <span className="font-serif text-lg text-espresso">
                      R$ {fmt(pedido.total)}
                    </span>
                    <div className="flex items-center gap-1 text-espresso/40">
                      <span className="font-sans text-[0.65rem] tracking-wide uppercase">
                        {expanded ? "Fechar" : "Ver detalhes"}
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.8}
                        className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded items */}
                {expanded && (
                  <div className="border-t border-sand">

                    {/* Items */}
                    <div className="divide-y divide-sand/60">
                      {pedido.itens_pedido.length > 0 ? (
                        pedido.itens_pedido.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                            <div className="w-9 h-9 bg-beige flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-sm text-espresso font-medium leading-snug truncate">
                                {item.nome_produto}
                              </p>
                              <p className="font-sans text-xs text-espresso/45">
                                {item.produtor}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-sans text-sm text-espresso font-medium">
                                R$ {fmt(item.preco_unitario * item.quantidade)}
                              </p>
                              <p className="font-sans text-xs text-espresso/40">
                                {item.quantidade} × R$ {fmt(item.preco_unitario)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="px-5 py-4 font-sans text-xs text-espresso/40">
                          Detalhes dos itens indisponíveis.
                        </p>
                      )}
                    </div>

                    {/* Totals + metadata */}
                    <div className="border-t border-sand px-5 py-4 bg-sand/20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="flex items-center gap-4 text-espresso/50">
                        {pedido.tipo_entrega === "entrega" ? (
                          <Truck size={13} strokeWidth={1.6} />
                        ) : (
                          <MapPin size={13} strokeWidth={1.6} />
                        )}
                        <span className="font-sans text-xs">
                          {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}
                          {" · "}
                          {pedido.forma_pagamento === "pix" ? "Pix" : "Cartão de crédito"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex justify-between gap-8 w-full sm:w-auto">
                          <span className="font-sans text-xs text-espresso/50">Subtotal</span>
                          <span className="font-sans text-xs text-espresso">R$ {fmt(pedido.subtotal)}</span>
                        </div>
                        <div className="flex justify-between gap-8 w-full sm:w-auto">
                          <span className="font-sans text-xs text-espresso/50">Frete</span>
                          <span className={`font-sans text-xs ${pedido.frete === 0 ? "text-olive" : "text-espresso"}`}>
                            {pedido.frete === 0 ? "Grátis" : `R$ ${fmt(pedido.frete)}`}
                          </span>
                        </div>
                        <div className="flex justify-between gap-8 w-full sm:w-auto pt-1 border-t border-sand mt-1">
                          <span className="font-sans text-xs text-espresso font-semibold">Total</span>
                          <span className="font-serif text-base text-espresso">R$ {fmt(pedido.total)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
