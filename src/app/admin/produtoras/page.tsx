"use client";

import { useState, useEffect } from "react";
import { Search, Eye, MapPin, Pencil } from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { supabase } from "@/lib/supabase-client";

interface Produtora {
  id: string;
  nome_marca: string;
  cidade: string | null;
  estado: string | null;
  ativo: boolean | null;
  criado_em: string;
}

function resolveStatus(ativo: boolean | null): "Ativa" | "Suspensa" | "Pendente" {
  if (ativo === true) return "Ativa";
  if (ativo === false) return "Suspensa";
  return "Pendente";
}

function ToggleAtivo({
  ativo,
  busy,
  onToggle,
}: {
  ativo: boolean | null;
  busy: boolean;
  onToggle: () => void;
}) {
  const on = ativo === true;
  return busy ? (
    <div className="w-9 h-5 flex items-center justify-center">
      <div className="w-3 h-3 border border-espresso/30 border-t-espresso/60 rounded-full animate-spin" />
    </div>
  ) : (
    <button
      title={on ? "Desativar" : "Ativar"}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        on ? "bg-olive" : "bg-espresso/15"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AdminProducers() {
  const [produtoras, setProdutoras] = useState<Produtora[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchProdutoras(); }, []);

  async function fetchProdutoras() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtoras")
      .select("id, nome_marca, cidade, estado, ativo, criado_em")
      .order("criado_em", { ascending: false });

    if (error) console.error("[AdminProdutoras] Erro:", error);
    setProdutoras((data ?? []) as Produtora[]);
    setLoading(false);
  }

  async function toggleAtivo(id: string, ativoAtual: boolean | null) {
    const novoAtivo = !ativoAtual;
    setUpdating(id);
    const { error } = await supabase.from("produtoras").update({ ativo: novoAtivo }).eq("id", id);
    if (error) {
      console.error("[AdminProdutoras] Erro ao atualizar:", error);
    } else {
      setProdutoras((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: novoAtivo } : p)));
    }
    setUpdating(null);
  }

  const filtered = produtoras.filter((p) => {
    const status = resolveStatus(p.ativo);
    const matchesStatus = statusFilter === "Todas" || status === statusFilter;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      p.nome_marca.toLowerCase().includes(term) ||
      (p.cidade ?? "").toLowerCase().includes(term) ||
      (p.estado ?? "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8">

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar produtora..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cream border border-sand py-2.5 pl-10 pr-4 font-sans text-sm focus:outline-none focus:border-terracota transition-colors placeholder:text-espresso/30"
          />
          <Search className="absolute left-3 top-3 text-espresso/30" size={16} />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {["Todas", "Pendente", "Ativa", "Suspensa"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`
                flex-shrink-0 px-5 py-2 font-sans text-[0.7rem] font-bold uppercase tracking-widest border transition-all duration-200
                ${statusFilter === s
                  ? "bg-espresso text-cream border-espresso"
                  : "bg-cream text-espresso/40 border-sand hover:border-espresso/30"}
              `}
            >
              {s === "Todas" ? "Todas" : s + "s"}
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
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Produtora</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Localização</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Status</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Ativo</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[0.82rem]">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-sand/30 last:border-0">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-8 py-5">
                          <div className="h-4 bg-sand/40 animate-pulse rounded w-28" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((p) => {
                    const status = resolveStatus(p.ativo);
                    const busy = updating === p.id;
                    return (
                      <tr key={p.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sand flex-shrink-0">
                              <ImagePlaceholder className="w-full h-full opacity-40 scale-75" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-espresso font-semibold group-hover:text-terracota transition-colors">{p.nome_marca}</span>
                              <span className="text-[0.65rem] text-espresso/40">
                                Membro desde {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5 text-espresso/60">
                            <MapPin size={12} className="text-espresso/20" />
                            {[p.cidade, p.estado].filter(Boolean).join(", ") || "—"}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`
                            inline-flex px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider
                            ${status === "Ativa" ? "bg-olive/10 text-olive" :
                              status === "Pendente" ? "bg-amber-100 text-amber-600" :
                              "bg-terracota/10 text-terracota"}
                          `}>
                            {status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <ToggleAtivo
                            ativo={p.ativo}
                            busy={busy}
                            onToggle={() => toggleAtivo(p.id, p.ativo)}
                          />
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/admin/produtoras/${p.id}`}
                              title="Editar"
                              className="p-2 text-espresso/40 hover:text-espresso hover:bg-sand/40 transition-colors"
                            >
                              <Pencil size={16} />
                            </a>
                            <a
                              href={`/produtoras/${p.id}`}
                              title="Ver Perfil"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-espresso/40 hover:text-espresso hover:bg-sand/40 transition-colors"
                            >
                              <Eye size={16} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-espresso/30 italic">Nenhuma produtora encontrada.</p>
          </div>
        )}
      </div>

    </div>
  );
}
