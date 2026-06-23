"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

type Solicitacao = {
  id: string;
  nome_completo: string;
  nome_marca: string;
  whatsapp: string;
  email: string;
  cidade: string | null;
  estado: string | null;
  categoria: string | null;
  descricao_negocio: string | null;
  status: "pendente" | "em_contato" | "aprovada" | "recusada";
  criado_em: string;
};

const STATUS_LABEL: Record<Solicitacao["status"], string> = {
  pendente:    "Pendente",
  em_contato:  "Em contato",
  aprovada:    "Aprovada",
  recusada:    "Recusada",
};

const STATUS_COLOR: Record<Solicitacao["status"], string> = {
  pendente:   "bg-caramel/15 text-caramel",
  em_contato: "bg-olive/15 text-olive",
  aprovada:   "bg-terracota/15 text-terracota",
  recusada:   "bg-wine/10 text-wine",
};

const FILTROS = [
  { label: "Todas",       value: ""           },
  { label: "Pendente",    value: "pendente"    },
  { label: "Em contato",  value: "em_contato"  },
  { label: "Aprovada",    value: "aprovada"    },
  { label: "Recusada",    value: "recusada"    },
];

export default function SolicitacoesPage() {
  const [rows, setRows] = useState<Solicitacao[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchRows() {
    let q = supabase
      .from("solicitacoes_produtoras")
      .select("*")
      .order("criado_em", { ascending: false });

    if (filtro) q = q.eq("status", filtro);

    const { data } = await q;
    setRows((data as Solicitacao[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    fetchRows();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function handleStatusChange(id: string, novoStatus: Solicitacao["status"]) {
    await supabase
      .from("solicitacoes_produtoras")
      .update({ status: novoStatus })
      .eq("id", id);

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: novoStatus } : r))
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-espresso font-normal">Solicitações de Produtoras</h2>
          <p className="font-sans text-[0.78rem] text-espresso/45 mt-1">
            {rows.length} resultado{rows.length !== 1 ? "s" : ""}
            {filtro ? ` · filtro: ${STATUS_LABEL[filtro as Solicitacao["status"]]}` : ""}
          </p>
        </div>

        {/* Filtro */}
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltro(value)}
              className={`font-sans text-[0.68rem] font-semibold tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${
                filtro === value
                  ? "bg-espresso text-cream border-espresso"
                  : "bg-transparent text-espresso/50 border-sand hover:border-espresso/30 hover:text-espresso/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <p className="font-sans text-sm text-espresso/40 py-12 text-center">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="font-sans text-sm text-espresso/40 py-12 text-center">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="overflow-x-auto border border-sand bg-cream">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-sand/20">
                {["Marca", "Nome", "WhatsApp", "E-mail", "Local", "Categoria", "Status", "Data"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/10 transition-colors">

                  <td className="px-4 py-4 font-sans text-[0.82rem] font-semibold text-espresso whitespace-nowrap">
                    {r.nome_marca}
                  </td>

                  <td className="px-4 py-4 font-sans text-[0.82rem] text-espresso/70 whitespace-nowrap">
                    {r.nome_completo}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <a
                      href={`https://wa.me/55${r.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-[0.82rem] text-terracota hover:text-caramel transition-colors underline underline-offset-2"
                    >
                      {r.whatsapp}
                    </a>
                  </td>

                  <td className="px-4 py-4 font-sans text-[0.82rem] text-espresso/60 whitespace-nowrap">
                    {r.email}
                  </td>

                  <td className="px-4 py-4 font-sans text-[0.82rem] text-espresso/60 whitespace-nowrap">
                    {[r.cidade, r.estado].filter(Boolean).join(", ") || "—"}
                  </td>

                  <td className="px-4 py-4 font-sans text-[0.82rem] text-espresso/60 whitespace-nowrap">
                    {r.categoria || "—"}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        handleStatusChange(r.id, e.target.value as Solicitacao["status"])
                      }
                      className={`font-sans text-[0.72rem] font-semibold tracking-wide px-3 py-1.5 border-0 outline-none cursor-pointer ${STATUS_COLOR[r.status]}`}
                    >
                      {(Object.keys(STATUS_LABEL) as Solicitacao["status"][]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-4 font-sans text-[0.78rem] text-espresso/40 whitespace-nowrap">
                    {formatDate(r.criado_em)}
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
