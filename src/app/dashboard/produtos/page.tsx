"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  foto: string | null;
  disponivel: boolean;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, categoria, preco, foto, disponivel")
        .eq("produtora_id", user.id)
        .order("criado_em", { ascending: false });

      if (error) console.error("[DashProdutos] Erro:", error);
      setProdutos((data ?? []) as Produto[]);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleDisponivel(id: string, atual: boolean) {
    if (!userId) return;
    const { error } = await supabase
      .from("produtos")
      .update({ disponivel: !atual })
      .eq("id", id)
      .eq("produtora_id", userId);

    if (!error) {
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, disponivel: !atual } : p));
    }
  }

  const ativos = produtos.filter(p => p.disponivel).length;
  const inativos = produtos.length - ativos;

  return (
    <div className="flex flex-col gap-8">

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">Catálogo</p>
          <h1 className="font-serif text-3xl text-espresso font-normal">Meus Produtos</h1>
        </div>
        <Link
          href="/dashboard/produtos/novo"
          className="flex-shrink-0 flex items-center gap-2 bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-5 py-3 hover:bg-caramel transition-colors"
        >
          <Plus size={14} />
          Adicionar produto
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-sand/40 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="border border-sand overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-sand">
                  {["Foto", "Nome", "Categoria", "Preço", "Status", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-espresso/35 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <p className="font-serif text-lg text-espresso/30 italic">Nenhum produto cadastrado ainda.</p>
                    </td>
                  </tr>
                ) : produtos.map(p => (
                  <tr key={p.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/25 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 bg-beige flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.foto ? (
                          <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 64 64" fill="none" className="text-espresso/20">
                            <rect x="8" y="8" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="2" />
                            <circle cx="22" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 44L20 32L30 42L42 28L56 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-espresso max-w-[240px]">
                      <span className="block truncate">{p.nome}</span>
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-espresso/55 whitespace-nowrap">{p.categoria}</td>
                    <td className="px-4 py-3 font-sans text-sm text-espresso font-medium whitespace-nowrap">
                      R$ {p.preco.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleDisponivel(p.id, p.disponivel)}
                        className="focus:outline-none"
                        title={p.disponivel ? "Clique para pausar" : "Clique para ativar"}
                      >
                        {p.disponivel ? (
                          <span className="font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 text-olive bg-olive/8 border border-olive/20 hover:bg-olive/15 transition-colors">
                            Ativo
                          </span>
                        ) : (
                          <span className="font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 text-espresso/40 bg-sand border border-sand hover:border-espresso/20 transition-colors">
                            Inativo
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button title="Editar" className="p-2 text-espresso/35 hover:text-espresso transition-colors">
                          <Pencil size={14} strokeWidth={1.7} />
                        </button>
                        <button title="Excluir" className="p-2 text-espresso/35 hover:text-wine transition-colors">
                          <Trash2 size={14} strokeWidth={1.7} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {produtos.length > 0 && (
            <p className="font-sans text-xs text-espresso/35">
              {ativos} produto{ativos !== 1 ? "s" : ""} ativo{ativos !== 1 ? "s" : ""} · {inativos} inativo{inativos !== 1 ? "s" : ""}
            </p>
          )}
        </>
      )}

    </div>
  );
}
