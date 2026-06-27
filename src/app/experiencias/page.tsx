"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useCart } from "@/lib/cart-context";

type ProdutoDegustacao = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  foto: string | null;
  categoria: string;
  produto_origem_id: string | null;
  produtoras: {
    id: string;
    nome_marca: string;
  };
};

export default function ExperienciasPage() {
  const { addItem } = useCart();
  const [produtos, setProdutos] = useState<ProdutoDegustacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchProdutos() {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, descricao, preco, foto, categoria, produto_origem_id, produtoras(id, nome_marca)")
        .eq("eh_degustacao", true)
        .eq("disponivel", true)
        .order("nome");

      if (data) {
        setProdutos(data as unknown as ProdutoDegustacao[]);
      }
      setLoading(false);
    }
    fetchProdutos();
  }, []);

  function handleAddItem(produto: ProdutoDegustacao) {
    addItem({
      id: produto.id,
      name: produto.nome,
      producer: produto.produtoras.nome_marca,
      price: produto.preco,
      quantity: 1,
      image: produto.foto,
      categoria: produto.categoria,
    });
    setAdicionados((prev) => new Set(prev).add(produto.id));
    setTimeout(() => {
      setAdicionados((prev) => {
        const next = new Set(prev);
        next.delete(produto.id);
        return next;
      });
    }, 1500);
  }

  // Strip the "Degustação — " prefix added by the SQL to show just the product name
  function displayName(nome: string) {
    return nome.replace(/^Degustação\s*[—\-]\s*/i, "");
  }

  return (
    <div className="bg-cream min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative bg-espresso overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_60%,_#d4a574_0%,_transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
          <span className="inline-block font-sans text-[0.58rem] tracking-[0.42em] uppercase text-caramel font-semibold mb-5">
            Experiências FEITORIA
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream font-normal leading-tight mb-6">
            Descubra novos sabores.
          </h1>
          <p className="font-sans text-[0.88rem] sm:text-[0.95rem] text-cream/50 leading-relaxed max-w-sm mx-auto">
            Porções especiais pensadas para provar sem compromisso.
          </p>
        </div>
      </section>

      {/* ── Intro strip ───────────────────────────────────────── */}
      <div className="bg-sand/40 border-b border-sand px-5 py-6 text-center">
        <p className="font-sans text-[0.78rem] text-espresso/55 leading-relaxed max-w-xl mx-auto">
          Cada item abaixo é uma versão degustação — aprox. 30% do tamanho original —
          ideal para conhecer antes de pedir a versão completa.
        </p>
      </div>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">

        {/* Section header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-sand" />
          <div className="text-center">
            <Sparkles size={13} className="text-caramel mx-auto mb-2" strokeWidth={1.6} />
            <span className="font-sans text-[0.55rem] tracking-[0.38em] uppercase text-caramel font-semibold">
              Menu Degustação
            </span>
          </div>
          <div className="flex-1 h-px bg-sand" />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-sand/30 h-96 animate-pulse" />
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-28">
            <p className="font-serif text-xl text-espresso/35 italic mb-6">
              Em breve, novos produtos de degustação.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 font-sans text-[0.72rem] tracking-[0.2em] uppercase text-caramel font-semibold hover:text-terracota transition-colors"
            >
              Explorar catálogo completo
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.map((produto) => (
              <article
                key={produto.id}
                className="group relative bg-cream border border-sand hover:border-espresso/20 transition-colors flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-beige flex-shrink-0">
                  {produto.foto ? (
                    <Image
                      src={produto.foto}
                      alt={displayName(produto.nome)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={36} className="text-espresso/12" />
                    </div>
                  )}

                  {/* Degustação badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-caramel/90 backdrop-blur-sm text-cream font-sans text-[0.52rem] tracking-[0.22em] uppercase font-semibold px-2.5 py-1 shadow-sm">
                      Degustação
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <div>
                    <Link href={`/produtos/${produto.id}`} className="block group/link">
                      <h3 className="font-serif text-[1.05rem] text-espresso leading-snug group-hover/link:text-terracota transition-colors">
                        {displayName(produto.nome)}
                      </h3>
                    </Link>
                    <p className="font-sans text-[0.68rem] text-espresso/38 mt-1">
                      por {produto.produtoras.nome_marca}
                    </p>
                  </div>

                  {produto.descricao && (
                    <p className="font-sans text-[0.75rem] text-espresso/55 leading-relaxed line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}

                  {produto.produto_origem_id && (
                    <Link
                      href={`/produtos/${produto.produto_origem_id}`}
                      className="inline-block font-sans text-[0.6rem] tracking-[0.15em] uppercase text-espresso/30 hover:text-terracota transition-colors underline underline-offset-2 w-fit"
                    >
                      Ver produto original
                    </Link>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-sand mt-auto">
                    <span className="font-serif text-[1.2rem] text-espresso">
                      R$ {produto.preco.toFixed(2).replace(".", ",")}
                    </span>
                    <button
                      onClick={() => handleAddItem(produto)}
                      className={`flex items-center gap-2 font-sans text-[0.62rem] tracking-[0.14em] uppercase font-semibold px-4 py-2.5 transition-colors ${
                        adicionados.has(produto.id)
                          ? "bg-olive/80 text-cream cursor-default"
                          : "bg-espresso text-cream hover:bg-terracota"
                      }`}
                    >
                      <ShoppingBag size={12} strokeWidth={1.8} />
                      {adicionados.has(produto.id) ? "Adicionado" : "Provar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && produtos.length > 0 && (
          <div className="text-center mt-20 pt-14 border-t border-sand">
            <p className="font-sans text-[0.8rem] text-espresso/40 mb-5">
              Gostou de um produto? Explore o catálogo completo.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-7 py-4 hover:bg-caramel transition-colors"
            >
              Ver todos os produtos
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
