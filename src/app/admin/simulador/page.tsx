"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingUp, DollarSign, Users } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const COMISSAO = 0.18;
const REPASSE  = 0.82;

type ProdutoRaw = {
  id: string;
  preco: number;
  produtoras: { id: string; nome_marca: string } | null;
};

type ProdutoraAgg = {
  id: string;
  nome_marca: string;
  total_venda: number;
  comissao: number;
  repasse: number;
  qtd_produtos: number;
};

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SimuladorPage() {
  const [loading,   setLoading]   = useState(true);
  const [produtoras, setProdutoras] = useState<ProdutoraAgg[]>([]);
  const [filtro,    setFiltro]    = useState<string>("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, preco, produtoras(id, nome_marca)")
        .eq("disponivel", true);

      if (error || !data) { setLoading(false); return; }

      const aggMap = new Map<string, ProdutoraAgg>();
      for (const p of data as unknown as ProdutoRaw[]) {
        if (!p.produtoras) continue;
        const { id, nome_marca } = p.produtoras;
        if (!aggMap.has(id)) {
          aggMap.set(id, { id, nome_marca, total_venda: 0, comissao: 0, repasse: 0, qtd_produtos: 0 });
        }
        const agg = aggMap.get(id)!;
        agg.total_venda   += p.preco;
        agg.comissao      += p.preco * COMISSAO;
        agg.repasse       += p.preco * REPASSE;
        agg.qtd_produtos  += 1;
      }

      setProdutoras(
        Array.from(aggMap.values()).sort((a, b) => b.total_venda - a.total_venda)
      );
      setLoading(false);
    }
    load();
  }, []);

  const visivel       = filtro ? produtoras.filter((p) => p.id === filtro) : produtoras;
  const totalVenda    = visivel.reduce((s, p) => s + p.total_venda, 0);
  const totalComissao = visivel.reduce((s, p) => s + p.comissao, 0);
  const totalRepasse  = visivel.reduce((s, p) => s + p.repasse, 0);

  return (
    <div className="flex flex-col gap-8">

      {/* ── Cabeçalho ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="font-sans text-[0.58rem] tracking-[0.3em] uppercase text-espresso/35 font-semibold">
          Administração
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl text-espresso">
          Simulador de Ganhos
        </h2>
        <p className="font-sans text-[0.8rem] text-espresso/50 leading-relaxed mt-1 max-w-2xl">
          Projeção de receita baseada no catálogo atual de produtos ativos.
          Considera 18% de comissão FEITORIA e 82% de repasse às produtoras, cobrindo a taxa do Mercado Pago.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Filtro por produtora ──────────────────────────────────────── */}
          {produtoras.length > 1 && (
            <div className="flex items-center gap-3 max-w-xs">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full bg-cream border border-sand px-4 py-2.5 font-sans text-[0.8rem] text-espresso outline-none focus:border-espresso/45 transition-colors cursor-pointer"
              >
                <option value="">Todas as produtoras</option>
                {produtoras.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_marca}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Valor de venda (catálogo)",
                value: fmtBRL(totalVenda),
                sub:   `${visivel.reduce((s, p) => s + p.qtd_produtos, 0)} produtos ativos`,
                icon:  DollarSign,
                color: "text-espresso",
                bg:    "bg-sand/30",
              },
              {
                label: "Repasse às produtoras (82%)",
                value: fmtBRL(totalRepasse),
                sub:   "Líquido após comissão",
                icon:  TrendingUp,
                color: "text-olive",
                bg:    "bg-olive/10",
              },
              {
                label: "Comissão FEITORIA (18%)",
                value: fmtBRL(totalComissao),
                sub:   "Inclui taxa Mercado Pago",
                icon:  Calculator,
                color: "text-terracota",
                bg:    "bg-terracota/8",
              },
            ].map((c) => (
              <div key={c.label} className="bg-cream border border-sand p-5 flex flex-col gap-4 shadow-sm">
                <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center ${c.color}`}>
                  <c.icon size={14} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-sans text-[0.6rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">
                    {c.label}
                  </p>
                  <p className="font-serif text-xl text-espresso font-medium">{c.value}</p>
                  <p className="font-sans text-[0.62rem] text-espresso/35 mt-1">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tabela por produtora ──────────────────────────────────────── */}
          {visivel.length > 0 ? (
            <div className="bg-cream border border-sand shadow-sm">
              <div className="px-5 py-4 border-b border-sand flex items-center gap-2">
                <Users size={14} className="text-espresso/40" strokeWidth={1.8} />
                <p className="font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                  {filtro
                    ? visivel[0].nome_marca
                    : `${visivel.length} produtora${visivel.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-sand/20 border-b border-sand">
                    <tr>
                      {["Produtora", "Produtos", "Catálogo (100%)", "Repasse (82%)", "Comissão (18%)"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={`px-5 py-3 font-sans text-[0.57rem] tracking-[0.22em] uppercase text-espresso/40 font-bold ${
                              i === 0 ? "text-left" : "text-right"
                            }`}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/40">
                    {visivel.map((p) => (
                      <tr key={p.id} className="hover:bg-sand/10 transition-colors">
                        <td className="px-5 py-4 font-sans text-[0.82rem] font-medium text-espresso">
                          {p.nome_marca}
                        </td>
                        <td className="px-5 py-4 text-right font-sans text-[0.78rem] text-espresso/50 tabular-nums">
                          {p.qtd_produtos}
                        </td>
                        <td className="px-5 py-4 text-right font-serif text-[0.9rem] text-espresso tabular-nums">
                          {fmtBRL(p.total_venda)}
                        </td>
                        <td className="px-5 py-4 text-right font-serif text-[0.9rem] text-olive tabular-nums">
                          {fmtBRL(p.repasse)}
                        </td>
                        <td className="px-5 py-4 text-right font-serif text-[0.9rem] text-terracota tabular-nums">
                          {fmtBRL(p.comissao)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {visivel.length > 1 && (
                    <tfoot className="bg-sand/20 border-t border-sand">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-5 py-3 font-sans text-[0.65rem] font-bold tracking-[0.15em] uppercase text-espresso/55"
                        >
                          Total
                        </td>
                        <td className="px-5 py-3 text-right font-serif text-[0.95rem] text-espresso font-medium tabular-nums">
                          {fmtBRL(totalVenda)}
                        </td>
                        <td className="px-5 py-3 text-right font-serif text-[0.95rem] text-olive font-medium tabular-nums">
                          {fmtBRL(totalRepasse)}
                        </td>
                        <td className="px-5 py-3 text-right font-serif text-[0.95rem] text-terracota font-medium tabular-nums">
                          {fmtBRL(totalComissao)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            <p className="font-serif text-lg text-espresso/30 italic text-center py-12">
              Nenhum produto ativo no momento.
            </p>
          )}
        </>
      )}

    </div>
  );
}
