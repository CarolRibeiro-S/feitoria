"use client";

import { 
  Wallet, 
  TrendingUp, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Percent,
  Download,
  Calendar
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const FINANCIAL_STATS = [
  { label: "Receita Total", value: "R$ 48.250,00", icon: Wallet, color: "text-espresso" },
  { label: "Comissões (15%)", value: "R$ 7.237,50", icon: TrendingUp, color: "text-olive" },
  { label: "Repasses", value: "R$ 41.012,50", icon: ArrowDownCircle, color: "text-terracota" },
  { label: "Taxa Média", value: "15.0%", icon: Percent, color: "text-espresso" },
];

const TRANSACTIONS = [
  { id: 1, date: "31/05/2026", producer: "Ateliê das Flores", saleValue: 89.0, commission: 13.35, payout: 75.65, method: "PIX" },
  { id: 2, date: "31/05/2026", producer: "Grão Fermentado", saleValue: 42.0, commission: 6.30, payout: 35.70, method: "Cartão" },
  { id: 3, date: "30/05/2026", producer: "Casa Mato Verde", saleValue: 145.0, commission: 21.75, payout: 123.25, method: "PIX" },
  { id: 4, date: "30/05/2026", producer: "Sítio Primavera", saleValue: 54.0, commission: 8.10, payout: 45.90, method: "Cartão" },
  { id: 5, date: "29/05/2026", producer: "Ateliê das Flores", saleValue: 12.0, commission: 1.80, payout: 10.20, method: "PIX" },
];

export default function AdminFinancial() {
  return (
    <div className="flex flex-col gap-10">
      
      {/* ── Action Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-cream border border-sand px-4 py-2 shadow-sm">
          <Calendar size={16} className="text-espresso/30" />
          <span className="font-sans text-sm text-espresso/70">Maio, 2026</span>
        </div>
        <button className="inline-flex items-center gap-2.5 bg-espresso text-cream font-sans text-[0.68rem] font-bold tracking-[0.18em] uppercase px-6 py-3.5 hover:bg-espresso/90 transition-colors shadow-sm">
          <Download size={15} />
          Exportar Relatório
        </button>
      </div>

      {/* ── Financial Stats ─────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FINANCIAL_STATS.map((stat) => (
          <div key={stat.label} className="bg-cream border border-sand p-7 flex flex-col gap-5 shadow-sm">
            <div className={`w-11 h-11 rounded-full bg-sand/30 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">{stat.label}</p>
              <p className="font-serif text-2xl text-espresso font-medium">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Transactions Table ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-espresso">Transações Recentes</h3>
        </div>

        <div className="bg-cream border border-sand shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand bg-sand/5">
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Data</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Produtora</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Venda</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Comissão</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Repasse</th>
                  <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Método</th>
                </tr>
              </thead>
              <tbody className="font-sans text-[0.82rem]">
                {TRANSACTIONS.map((t) => (
                  <tr key={t.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors group">
                    <td className="px-8 py-6 text-espresso/50 font-medium">{t.date}</td>
                    <td className="px-8 py-6 text-espresso font-semibold">{t.producer}</td>
                    <td className="px-8 py-6 text-espresso font-medium">R$ {t.saleValue.toFixed(2).replace(".", ",")}</td>
                    <td className="px-8 py-6 text-olive font-bold">+ R$ {t.commission.toFixed(2).replace(".", ",")}</td>
                    <td className="px-8 py-6 text-terracota font-medium">- R$ {t.payout.toFixed(2).replace(".", ",")}</td>
                    <td className="px-8 py-6 text-right">
                      <span className={`
                        px-2 py-1 text-[0.6rem] font-bold uppercase tracking-tighter border
                        ${t.method === "PIX" ? "border-olive/20 text-olive bg-olive/5" : "border-espresso/10 text-espresso/50"}
                      `}>
                        {t.method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
