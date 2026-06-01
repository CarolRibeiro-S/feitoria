"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  MoreVertical,
  MapPin,
  ChevronDown
} from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_PRODUCERS = [
  { id: 1, name: "Ateliê das Flores", city: "São Paulo, SP", category: "Confeitaria", status: "Ativa", date: "12/03/2025" },
  { id: 2, name: "Casa Mato Verde", city: "Belo Horizonte, MG", category: "Empório", status: "Ativa", date: "15/03/2025" },
  { id: 3, name: "Grão Fermentado", city: "Florianópolis, SC", category: "Padaria", status: "Pendente", date: "20/05/2026" },
  { id: 4, name: "Sítio Primavera", city: "Pinhal, SP", category: "Cafés", status: "Ativa", date: "05/04/2025" },
  { id: 5, name: "Massa & Cia", city: "Curitiba, PR", category: "Congelados", status: "Suspensa", date: "10/01/2025" },
  { id: 6, name: "Quitutes da Vovó", city: "Ouro Preto, MG", category: "Confeitaria", status: "Pendente", date: "28/05/2026" },
];

export default function AdminProducers() {
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducers = ALL_PRODUCERS.filter(p => {
    const matchesStatus = statusFilter === "Todas" || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8">
      
      {/* ── Header & Filters ────────────────────────────────────────────────── */}
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
          {["Todas", "Pendente", "Ativa", "Suspensa"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                flex-shrink-0 px-5 py-2 font-sans text-[0.7rem] font-bold uppercase tracking-widest border transition-all duration-200
                ${statusFilter === status 
                  ? "bg-espresso text-cream border-espresso" 
                  : "bg-cream text-espresso/40 border-sand hover:border-espresso/30"}
              `}
            >
              {status === "Todas" ? "Todas" : status + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Producers Table ─────────────────────────────────────────────────── */}
      <div className="bg-cream border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-sand/5">
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Produtora</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Localização</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Categoria</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold">Status</th>
                <th className="px-8 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[0.82rem]">
              {filteredProducers.map((p) => (
                <tr key={p.id} className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-sand flex-shrink-0">
                        <ImagePlaceholder className="w-full h-full opacity-40 scale-75" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-espresso font-semibold group-hover:text-terracota transition-colors">{p.name}</span>
                        <span className="text-[0.65rem] text-espresso/40">Membro desde {p.date}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-1.5 text-espresso/60">
                      <MapPin size={12} className="text-espresso/20" />
                      {p.city}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-espresso/60">{p.category}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`
                      inline-flex px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider
                      ${p.status === "Ativa" ? "bg-olive/10 text-olive" : 
                        p.status === "Pendente" ? "bg-amber-100 text-amber-600" :
                        "bg-terracota/10 text-terracota"}
                    `}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "Pendente" && (
                        <button title="Aprovar" className="p-2 text-olive hover:bg-olive/5 transition-colors">
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      {p.status === "Ativa" && (
                        <button title="Suspender" className="p-2 text-terracota/60 hover:text-terracota hover:bg-terracota/5 transition-colors">
                          <XCircle size={18} />
                        </button>
                      )}
                      <button title="Ver Perfil" className="p-2 text-espresso/40 hover:text-espresso hover:bg-sand/40 transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-espresso/20 hover:text-espresso">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducers.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-espresso/30 italic">Nenhuma produtora encontrada.</p>
          </div>
        )}
      </div>

    </div>
  );
}
