"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";
import Link from "next/link";

interface Produtora {
  id: string;
  nome_marca: string;
  cidade: string;
  estado: string;
  descricao: string;
  foto_perfil: string | null;
}

export default function ProdutorasPage() {
  const [produtoras, setProdutoras] = useState<Produtora[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProdutoras() {
      const { data } = await supabase
        .from("produtoras")
        .select("id, nome_marca, cidade, estado, descricao, foto_perfil")
        .eq("ativo", true)
        .order("nome_marca");
      if (data) setProdutoras(data as any);
      setLoading(false);
    }
    fetchProdutoras();
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <main className="pt-24 sm:pt-32 lg:pt-44 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          {/* ── HEADER ───────────────────────────────────────────────────── */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
              As mãos por trás
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-espresso mt-2 font-normal">
              Descubra Quem Faz
            </h1>
            <p className="font-sans text-[0.88rem] sm:text-[0.95rem] text-espresso/50 mt-3 max-w-lg leading-relaxed">
              Conheça as pessoas por trás de cada produto
            </p>
          </div>

          {/* ── GRID ─────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-terracota" size={36} />
            </div>
          ) : produtoras.length === 0 ? (
            <p className="font-serif text-xl text-espresso/40 italic text-center py-24">
              Nenhuma produtora encontrada.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {produtoras.map((p) => (
                <Link
                  key={p.id}
                  href={`/produtoras/${p.id}`}
                  className="group flex flex-col bg-sand hover:bg-sand/70 transition-colors"
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] overflow-hidden relative bg-beige flex items-center justify-center">
                    {p.foto_perfil ? (
                      <Image
                        src={p.foto_perfil}
                        alt={p.nome_marca}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <span className="font-serif text-6xl text-espresso/10 select-none">
                        {p.nome_marca.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <div>
                      <h2 className="font-serif text-xl text-espresso font-normal leading-snug">
                        {p.nome_marca}
                      </h2>
                      <div className="flex items-center gap-1.5 text-espresso/40 mt-1.5">
                        <MapPin size={11} strokeWidth={1.8} />
                        <span className="font-sans text-[0.7rem]">
                          {p.cidade}, {p.estado}
                        </span>
                      </div>
                    </div>

                    {p.descricao && (
                      <p className="font-sans text-[0.82rem] text-espresso/60 leading-relaxed flex-1">
                        {p.descricao.length > 120
                          ? `${p.descricao.slice(0, 120)}…`
                          : p.descricao}
                      </p>
                    )}

                    <span className="font-sans text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-caramel group-hover:text-terracota transition-colors flex items-center gap-1.5 mt-1">
                      Conhecer história <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
