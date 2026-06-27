"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Mail, Phone, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface Cliente {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  criado_em: string;
  total_gasto: number;
  qtd_pedidos: number;
}

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminClientes() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    async function load() {
      const [usuariosRes, pedidosRes] = await Promise.all([
        supabase
          .from("usuarios")
          .select("id, nome, email, telefone, cidade, estado, criado_em, tipo")
          .eq("tipo", "cliente")
          .order("criado_em", { ascending: false }),
        supabase
          .from("pedidos")
          .select("usuario_id, total, status"),
      ]);

      console.log("[admin/clientes] usuarios query result:", {
        data: usuariosRes.data,
        error: usuariosRes.error,
        count: usuariosRes.data?.length ?? 0,
      });

      if (usuariosRes.error) {
        console.error("[admin/clientes] RLS ou erro na query:", usuariosRes.error.message, usuariosRes.error.details);
      }

      // diagnóstico extra: busca sem filtro para ver se o problema é RLS ou filtro
      const { data: allUsuarios, error: allError } = await supabase
        .from("usuarios")
        .select("id, tipo, email")
        .limit(20);
      console.log("[admin/clientes] todos os usuarios (sem filtro, limit 20):", {
        data: allUsuarios,
        error: allError,
        count: allUsuarios?.length ?? 0,
      });

      const statsMap = new Map<string, { total: number; count: number }>();
      for (const p of (pedidosRes.data ?? []) as any[]) {
        if (p.status === "cancelado" || !p.usuario_id) continue;
        if (!statsMap.has(p.usuario_id)) statsMap.set(p.usuario_id, { total: 0, count: 0 });
        const s = statsMap.get(p.usuario_id)!;
        s.total += p.total ?? 0;
        s.count += 1;
      }

      console.log("[admin/clientes] statsMap entries:", statsMap.size, "pedidos agrupados");
      setClientes(
        ((usuariosRes.data ?? []) as any[]).map((u) => ({
          id:          u.id,
          nome:        u.nome,
          email:       u.email,
          telefone:    u.telefone,
          cidade:      u.cidade,
          estado:      u.estado,
          criado_em:   u.criado_em,
          total_gasto: statsMap.get(u.id)?.total ?? 0,
          qtd_pedidos: statsMap.get(u.id)?.count ?? 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = clientes.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.nome ?? "").toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.telefone ?? "").includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-8">

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream border border-sand py-2.5 pl-10 pr-4 font-sans text-sm focus:outline-none focus:border-terracota transition-colors placeholder:text-espresso/30"
          />
          <Search className="absolute left-3 top-3 text-espresso/30" size={16} />
        </div>

        {!loading && (
          <p className="font-sans text-[0.65rem] tracking-[0.2em] uppercase text-espresso/35 font-semibold">
            {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-cream border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="border-b border-sand bg-sand/5">
                {["Cliente", "Contato", "Localização", "Cadastro", "Pedidos", "Total gasto", ""].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-5 font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-sans text-[0.82rem]">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-sand/30 last:border-0">
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-4 bg-sand/40 animate-pulse rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/admin/clientes/${c.id}`)}
                      className="border-b border-sand/30 last:border-0 hover:bg-sand/10 transition-colors cursor-pointer group"
                    >
                      {/* Nome */}
                      <td className="px-6 py-5">
                        <span className="font-medium text-espresso group-hover:text-terracota transition-colors">
                          {c.nome ?? <span className="italic text-espresso/35">sem nome</span>}
                        </span>
                      </td>

                      {/* Contato */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1 text-espresso/55">
                          <div className="flex items-center gap-1.5">
                            <Mail size={11} className="text-espresso/25 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{c.email}</span>
                          </div>
                          {c.telefone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={11} className="text-espresso/25 flex-shrink-0" />
                              {c.telefone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Localização */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-espresso/55">
                          <MapPin size={12} className="text-espresso/20 flex-shrink-0" />
                          {[c.cidade, c.estado].filter(Boolean).join(", ") || "—"}
                        </div>
                      </td>

                      {/* Cadastro */}
                      <td className="px-6 py-5 text-espresso/40 tabular-nums">
                        {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                      </td>

                      {/* Pedidos */}
                      <td className="px-6 py-5">
                        <span className={`font-medium ${c.qtd_pedidos > 0 ? "text-espresso" : "text-espresso/30"}`}>
                          {c.qtd_pedidos}
                        </span>
                      </td>

                      {/* Total gasto */}
                      <td className="px-6 py-5">
                        <span className={`font-serif ${c.total_gasto > 0 ? "text-espresso" : "text-espresso/30"}`}>
                          {c.total_gasto > 0 ? fmtBRL(c.total_gasto) : "—"}
                        </span>
                      </td>

                      {/* Seta */}
                      <td className="px-4 py-5 text-right">
                        <ChevronRight
                          size={14}
                          className="text-espresso/20 group-hover:text-espresso/50 transition-colors inline-block"
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-xl text-espresso/30 italic">
              {search ? "Nenhum cliente encontrado." : "Ainda não há clientes cadastrados."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
