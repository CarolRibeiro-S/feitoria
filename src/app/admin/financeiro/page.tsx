"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Wallet, TrendingUp, ArrowDownCircle, Percent, Download, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// ── Constants ────────────────────────────────────────────────────────────────
const COMMISSION = 0.18;
const PAYOUT     = 0.82;

// ── Types ────────────────────────────────────────────────────────────────────
interface Pedido {
  id: string;
  numero: string;
  total: number;
  status: string;
  criado_em: string;
  forma_pagamento: string;
  nome_cliente: string;
  itens_pedido: { produtor: string }[];
}

type DatePreset = "hoje" | "semana" | "mes" | "ano" | "custom";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMetodo(forma: string): { label: string; cls: string } {
  switch (forma) {
    case "pix":            return { label: "PIX",              cls: "border-olive/20 text-olive bg-olive/5" };
    case "cartao":
    case "cartao_credito": return { label: "Cartão Crédito",   cls: "border-espresso/15 text-espresso/60" };
    case "cartao_debito":  return { label: "Cartão Débito",    cls: "border-espresso/15 text-espresso/60" };
    case "ifood":          return { label: "iFood",            cls: "border-terracota/20 text-terracota bg-terracota/5" };
    case "vale":
    case "ticket":         return { label: "Vale Alimentação", cls: "border-olive/15 text-olive/70 bg-olive/5" };
    default:               return { label: forma ?? "—",       cls: "border-espresso/10 text-espresso/40" };
  }
}

function fmtStatus(status: string): string {
  switch (status) {
    case "pendente":   return "border-amber-200 text-amber-700 bg-amber-50";
    case "confirmado": return "border-olive/20 text-olive bg-olive/5";
    case "cancelado":  return "border-terracota/20 text-terracota/70 bg-terracota/5";
    case "entregue":   return "border-espresso/20 text-espresso/60";
    default:           return "border-espresso/10 text-espresso/40";
  }
}

function startOfDay(d: Date)   { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfWeek(d: Date)  { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d: Date)  { return new Date(d.getFullYear(), 0, 1); }

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "hoje",   label: "Hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "mes",    label: "Este mês" },
  { key: "ano",    label: "Este ano" },
  { key: "custom", label: "Personalizado" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminFinancial() {
  const [orders, setOrders]         = useState<Pedido[]>([]);
  const [loading, setLoading]       = useState(true);
  const [produtora, setProdutora]   = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("mes");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef                    = useRef<HTMLDivElement>(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, numero, total, status, criado_em, forma_pagamento, nome_cliente, itens_pedido(produtor)")
        .order("criado_em", { ascending: false });
      if (error) console.error("[AdminFinanceiro]", error);
      setOrders((data ?? []) as Pedido[]);
      setLoading(false);
    }
    load();
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    function handler(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const produtoras = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => o.itens_pedido?.forEach(i => { if (i.produtor) set.add(i.produtor); }));
    return Array.from(set).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    let to:   Date | null = now;

    if      (datePreset === "hoje")   { from = startOfDay(now); }
    else if (datePreset === "semana") { from = startOfWeek(now); }
    else if (datePreset === "mes")    { from = startOfMonth(now); }
    else if (datePreset === "ano")    { from = startOfYear(now); }
    else if (datePreset === "custom") {
      if (customFrom && customTo) {
        from = new Date(`${customFrom}T00:00:00`);
        to   = new Date(`${customTo}T23:59:59`);
      } else {
        from = null;
        to   = null;
      }
    }

    return orders.filter(o => {
      const d = new Date(o.criado_em);
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      if (produtora !== "all" && !o.itens_pedido?.some(i => i.produtor === produtora)) return false;
      return true;
    });
  }, [orders, datePreset, customFrom, customTo, produtora]);

  const nonCancelled = useMemo(() => filtered.filter(o => o.status !== "cancelado"), [filtered]);
  const totalVendas  = useMemo(() => filtered.reduce((s, o) => s + (o.total ?? 0), 0), [filtered]);
  const totalComis   = useMemo(() => nonCancelled.reduce((s, o) => s + (o.total ?? 0) * COMMISSION, 0), [nonCancelled]);
  const totalRepasse = useMemo(() => nonCancelled.reduce((s, o) => s + (o.total ?? 0) * PAYOUT, 0), [nonCancelled]);

  // ── Exports ────────────────────────────────────────────────────────────────
  function buildRows() {
    return filtered.map(o => {
      const c = o.status === "cancelado";
      return {
        "Data":                  new Date(o.criado_em).toLocaleDateString("pt-BR"),
        "Pedido":                o.numero,
        "Cliente":               o.nome_cliente,
        "Produtora":             o.itens_pedido?.[0]?.produtor ?? "—",
        "Venda (R$)":            o.total,
        "Comissão 18% (R$)":     c ? 0 : +(o.total * COMMISSION).toFixed(2),
        "Repasse 82% (R$)":      c ? 0 : +(o.total * PAYOUT).toFixed(2),
        "Método de Pagamento":   fmtMetodo(o.forma_pagamento).label,
        "Status":                o.status,
      };
    });
  }

  async function handleExportPDF() {
    setExportOpen(false);
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Relatório Financeiro — Feitoria", 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}   •   Comissão: 18%   •   ${filtered.length} pedido${filtered.length !== 1 ? "s" : ""}`,
      14, 28,
    );

    autoTable(doc, {
      startY: 36,
      head: [["Data", "Pedido", "Produtora", "Venda", "Comissão (18%)", "Repasse (82%)", "Método", "Status"]],
      foot: [["TOTAIS", `${filtered.length} pedidos`, "", fmtBRL(totalVendas), fmtBRL(totalComis), fmtBRL(totalRepasse), "", ""]],
      body: filtered.map(o => {
        const c = o.status === "cancelado";
        return [
          new Date(o.criado_em).toLocaleDateString("pt-BR"),
          o.numero,
          o.itens_pedido?.[0]?.produtor ?? "—",
          fmtBRL(o.total),
          c ? "—" : fmtBRL(o.total * COMMISSION),
          c ? "—" : fmtBRL(o.total * PAYOUT),
          fmtMetodo(o.forma_pagamento).label,
          o.status,
        ];
      }),
      headStyles: { fillColor: [42, 35, 28], textColor: 255, fontSize: 8, fontStyle: "bold" },
      footStyles: { fillColor: [232, 226, 216], textColor: [42, 35, 28], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 248, 245] },
    });

    doc.save(`feitoria-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function handleExportExcel() {
    setExportOpen(false);
    const XLSX = await import("xlsx");

    const rows = [
      ...buildRows(),
      {
        "Data":                "TOTAIS",
        "Pedido":              `${filtered.length} pedidos`,
        "Cliente":             "",
        "Produtora":           "",
        "Venda (R$)":          +totalVendas.toFixed(2),
        "Comissão 18% (R$)":   +totalComis.toFixed(2),
        "Repasse 82% (R$)":    +totalRepasse.toFixed(2),
        "Método de Pagamento": "",
        "Status":              "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, `feitoria-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-10">

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">

          {/* Date preset pills */}
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDatePreset(key)}
                className={`px-4 py-2 font-sans text-[0.68rem] font-bold tracking-[0.15em] uppercase border transition-colors ${
                  datePreset === key
                    ? "bg-espresso text-cream border-espresso"
                    : "bg-cream text-espresso/50 border-sand hover:border-espresso/30 hover:text-espresso/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right: produtora + export */}
          <div className="flex items-center gap-3">
            <select
              value={produtora}
              onChange={e => setProdutora(e.target.value)}
              className="bg-cream border border-sand px-4 py-2.5 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40 cursor-pointer"
            >
              <option value="all">Todas as produtoras</option>
              {produtoras.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen(v => !v)}
                className="inline-flex items-center gap-2 bg-espresso text-cream font-sans text-[0.68rem] font-bold tracking-[0.18em] uppercase px-5 py-3 hover:bg-espresso/90 transition-colors shadow-sm"
              >
                <Download size={14} />
                Exportar Relatório
                <ChevronDown size={13} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-cream border border-sand shadow-md z-20 min-w-[190px]">
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-5 py-3.5 font-sans text-[0.75rem] text-espresso hover:bg-sand/20 transition-colors border-b border-sand/30"
                  >
                    Exportar como PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-5 py-3.5 font-sans text-[0.75rem] text-espresso hover:bg-sand/20 transition-colors"
                  >
                    Exportar como Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom date pickers */}
        {datePreset === "custom" && (
          <div className="flex items-center gap-3">
            <span className="font-sans text-[0.68rem] tracking-[0.1em] uppercase text-espresso/40">De</span>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="bg-cream border border-sand px-3 py-2 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40"
            />
            <span className="font-sans text-[0.68rem] tracking-[0.1em] uppercase text-espresso/40">Até</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="bg-cream border border-sand px-3 py-2 font-sans text-[0.75rem] text-espresso/70 focus:outline-none focus:border-espresso/40"
            />
          </div>
        )}
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total de Vendas",  value: fmtBRL(totalVendas),   icon: Wallet,          color: "text-espresso" },
            { label: "Comissões (18%)",  value: fmtBRL(totalComis),    icon: Percent,         color: "text-olive"    },
            { label: "Repasses (82%)",   value: fmtBRL(totalRepasse),  icon: ArrowDownCircle, color: "text-terracota"},
            { label: "Total de Pedidos", value: String(filtered.length), icon: TrendingUp,    color: "text-espresso" },
          ].map(stat => (
            <div key={stat.label} className="bg-cream border border-sand p-7 flex flex-col gap-5 shadow-sm">
              <div className={`w-11 h-11 rounded-full bg-sand/30 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="font-sans text-[0.62rem] tracking-[0.15em] uppercase text-espresso/40 font-bold mb-1">
                  {stat.label}
                </p>
                {loading
                  ? <div className="h-8 w-28 bg-sand/50 animate-pulse" />
                  : <p className="font-serif text-2xl text-espresso font-medium">{stat.value}</p>
                }
              </div>
            </div>
          ))}
        </div>
        <p className="font-sans text-[0.65rem] text-espresso/35 tracking-wide mt-1">
          A comissão de 18% já inclui as taxas de processamento do Mercado Pago.
        </p>
      </div>

      {/* ── Transactions Table ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <h3 className="font-serif text-xl text-espresso">Transações</h3>

        <div className="bg-cream border border-sand shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand bg-sand/5">
                  {["Data", "Pedido", "Produtora", "Venda", "Comissão (18%)", "Repasse (82%)", "Método", "Status"].map(h => (
                    <th
                      key={h}
                      className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold whitespace-nowrap last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="font-sans text-[0.82rem]">
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-sand/30 last:border-0">
                        {[...Array(8)].map((__, j) => (
                          <td key={j} className="px-8 py-6">
                            <div className="h-4 bg-sand/40 animate-pulse rounded w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map(o => {
                      const cancelled = o.status === "cancelado";
                      const { label: metodoLabel, cls: metodoCls } = fmtMetodo(o.forma_pagamento);
                      return (
                        <tr
                          key={o.id}
                          className={`border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors ${cancelled ? "opacity-40" : ""}`}
                        >
                          <td className="px-8 py-6 text-espresso/50 font-medium whitespace-nowrap">
                            {new Date(o.criado_em).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-8 py-6 text-espresso font-medium text-[0.75rem] whitespace-nowrap">
                            {o.numero}
                          </td>
                          <td className="px-8 py-6 text-espresso font-semibold">
                            {o.itens_pedido?.[0]?.produtor ?? "—"}
                          </td>
                          <td className="px-8 py-6 text-espresso font-medium whitespace-nowrap">
                            {fmtBRL(o.total)}
                          </td>
                          <td className="px-8 py-6 text-olive font-bold whitespace-nowrap">
                            {cancelled ? "—" : `+ ${fmtBRL(o.total * COMMISSION)}`}
                          </td>
                          <td className="px-8 py-6 text-terracota font-medium whitespace-nowrap">
                            {cancelled ? "—" : `− ${fmtBRL(o.total * PAYOUT)}`}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-2 py-1 text-[0.6rem] font-bold uppercase tracking-tighter border whitespace-nowrap ${metodoCls}`}>
                              {metodoLabel}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`px-2 py-1 text-[0.6rem] font-bold uppercase tracking-tighter border ${fmtStatus(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>

              {/* ── Footer totals ───────────────────────────────────────────── */}
              {!loading && filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-sand bg-sand/10">
                    <td
                      colSpan={3}
                      className="px-8 py-5 font-sans text-[0.65rem] tracking-[0.15em] uppercase text-espresso/50 font-bold whitespace-nowrap"
                    >
                      Totais — {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-8 py-5 font-sans text-[0.82rem] text-espresso font-bold whitespace-nowrap">
                      {fmtBRL(totalVendas)}
                    </td>
                    <td className="px-8 py-5 font-sans text-[0.82rem] text-olive font-bold whitespace-nowrap">
                      + {fmtBRL(totalComis)}
                    </td>
                    <td className="px-8 py-5 font-sans text-[0.82rem] text-terracota font-bold whitespace-nowrap">
                      − {fmtBRL(totalRepasse)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-espresso/30 italic">
                Nenhuma transação no período selecionado.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
