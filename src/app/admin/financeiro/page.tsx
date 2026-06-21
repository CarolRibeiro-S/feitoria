"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, ArrowDownCircle, Percent, Download, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface Pedido {
  id: string;
  numero: string;
  total: number;
  status: string;
  criado_em: string;
  forma_pagamento: string;
  itens_pedido: { produtor: string }[];
}

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminFinancial() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, numero, total, status, criado_em, forma_pagamento, itens_pedido(produtor)")
        .order("criado_em", { ascending: false });

      if (error) console.error("[AdminFinanceiro] Erro:", error);
      setOrders((data ?? []) as Pedido[]);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const nonCancelled = orders.filter((o) => o.status !== "cancelado");
  const receitaTotal = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const comissoes = nonCancelled.reduce((s, o) => s + (o.total ?? 0) * 0.1, 0);
  const repasses = nonCancelled.reduce((s, o) => s + (o.total ?? 0) * 0.9, 0);

  const stats = [
    { label: "Receita Total", value: fmtBRL(receitaTotal), icon: Wallet, color: "text-espresso" },
    { label: "Comissões (10%)", value: fmtBRL(comissoes), icon: TrendingUp, color: "text-olive" },
    { label: "Repasses (90%)", value: fmtBRL(repasses), icon: ArrowDownCircle, color: "text-terracota" },
    { label: "Taxa de Comissão", value: "10.0%", icon: Percent, color: "text-espresso" },
  ];

  const now = new Date();

  return (
    <div className="flex flex-col gap-10">

      {/* ── Action Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-cream border border-sand px-4 py-2 shadow-sm">
          <Calendar size={16} className="text-espresso/30" />
          <span className="font-sans text-sm text-espresso/70">
            {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </span>
        </div>
        <button className="inline-flex items-center gap-2.5 bg-espresso text-cream font-sans text-[0.68rem] font-bold tracking-[0.18em] uppercase px-6 py-3.5 hover:bg-espresso/90 transition-colors shadow-sm">
          <Download size={15} />
          Exportar Relatório
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-cream border border-sand p-7 flex flex-col gap-5 shadow-sm">
            <div className={`w-11 h-11 rounded-full bg-sand/30 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">{stat.label}</p>
              {loading
                ? <div className="h-8 w-28 bg-sand/50 animate-pulse" />
                : <p className="font-serif text-2xl text-espresso font-medium">{stat.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Transactions Table ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <h3 className="font-serif text-xl text-espresso">Transações</h3>

        <div className="bg-cream border border-sand shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand bg-sand/5">
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Data</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Pedido</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Produtora</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Venda</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Comissão</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Repasse</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Método</th>
                </tr>
              </thead>
              <tbody className="font-sans text-[0.82rem]">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-sand/30 last:border-0">
                        {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                          <td key={j} className="px-8 py-6">
                            <div className="h-4 bg-sand/40 animate-pulse rounded w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : orders.map((o) => {
                      const cancelled = o.status === "cancelado";
                      const commission = o.total * 0.1;
                      const payout = o.total * 0.9;
                      return (
                        <tr
                          key={o.id}
                          className={`border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors ${cancelled ? "opacity-40" : ""}`}
                        >
                          <td className="px-8 py-6 text-espresso/50 font-medium">
                            {new Date(o.criado_em).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-8 py-6 text-espresso font-medium font-sans text-[0.75rem]">
                            {o.numero}
                          </td>
                          <td className="px-8 py-6 text-espresso font-semibold">
                            {o.itens_pedido?.[0]?.produtor ?? "—"}
                          </td>
                          <td className="px-8 py-6 text-espresso font-medium">
                            R$ {o.total.toFixed(2).replace(".", ",")}
                          </td>
                          <td className="px-8 py-6 text-olive font-bold">
                            {cancelled ? "—" : `+ R$ ${commission.toFixed(2).replace(".", ",")}`}
                          </td>
                          <td className="px-8 py-6 text-terracota font-medium">
                            {cancelled ? "—" : `- R$ ${payout.toFixed(2).replace(".", ",")}`}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`
                              px-2 py-1 text-[0.6rem] font-bold uppercase tracking-tighter border
                              ${o.forma_pagamento === "pix" ? "border-olive/20 text-olive bg-olive/5" : "border-espresso/10 text-espresso/50"}
                            `}>
                              {o.forma_pagamento === "pix" ? "PIX" : "Cartão"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
          {!loading && orders.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-espresso/30 italic">Nenhuma transação ainda.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
