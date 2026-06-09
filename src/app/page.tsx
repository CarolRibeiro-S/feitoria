"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Plus,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { supabase } from "@/lib/supabase-client";

interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  foto: string | null;
  produtoras: {
    nome_marca: string;
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: productsData, error: productsError } = await supabase
          .from("produtos")
          .select(`
            id,
            nome,
            preco,
            categoria,
            foto,
            produtoras (
              nome_marca
            )
          `)
          .eq("disponivel", true)
          .order("criado_em", { ascending: false })
          .limit(6);

        if (productsError) console.error("[Home] Erro produtos:", productsError);
        if (productsData) setProducts(productsData as any);
      } catch (err) {
        console.error("[Home] Erro inesperado:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <main>
        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="relative w-full min-h-[100vh] overflow-hidden">

          {/* Imagem de fundo */}
          <Image
            src="/logo_nova.jpeg"
            alt="FEITORIA"
            fill
            className="object-cover object-[50%_30%] sm:object-center"
            priority
          />

          {/* Overlay gradiente esquerda → transparente */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

          {/* Conteúdo — bottom no mobile, direita-centro no desktop */}
          <div className="absolute bottom-8 inset-x-4 sm:inset-x-auto sm:bottom-auto sm:right-12 lg:right-16 sm:top-1/2 sm:-translate-y-1/2 flex flex-col items-center sm:items-end gap-4 sm:gap-5 max-w-full sm:max-w-sm lg:max-w-md text-center sm:text-right bg-black/35 backdrop-blur-[4px] rounded-2xl p-6 sm:p-8 border border-white/10">

            <span className="font-sans text-[0.58rem] sm:text-[0.62rem] tracking-widest uppercase text-cream/70 font-semibold drop-shadow-sm">
              Artesanal · Local · Singular
            </span>

            <h1 className="font-serif text-[2rem] sm:text-5xl lg:text-[3.6rem] xl:text-[4.2rem] text-cream font-normal leading-[1.06] drop-shadow-md">
              Descubra quem faz.
            </h1>

            <p className="font-sans text-[0.82rem] sm:text-[0.9rem] text-cream/80 tracking-wide drop-shadow-sm">
              Pequenos produtores. Grandes histórias.
            </p>

            <div className="flex flex-row sm:flex-row gap-3 pt-1 w-full sm:w-auto justify-center sm:justify-end">
              <a
                href="/produtos"
                className="inline-flex items-center justify-center gap-2 bg-cream text-espresso font-sans text-[0.65rem] sm:text-[0.72rem] font-semibold tracking-[0.15em] sm:tracking-[0.18em] uppercase px-4 sm:px-6 py-3 sm:py-3.5 hover:bg-sand transition-colors"
              >
                Explorar
                <ArrowRight size={12} />
              </a>
              <a
                href="/produtoras"
                className="inline-flex items-center justify-center gap-2 border border-cream/50 text-cream font-sans text-[0.65rem] sm:text-[0.72rem] font-semibold tracking-[0.15em] sm:tracking-[0.18em] uppercase px-4 sm:px-6 py-3 sm:py-3.5 hover:border-cream hover:bg-cream/10 transition-colors"
              >
                Produtoras
              </a>
            </div>

          </div>

        </section>

        {/* ── CATEGORIAS ─────────────────────────────────────────────────────── */}
        <section className="bg-sand py-10 lg:py-16">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-lg lg:text-2xl text-espresso">Explorar por categoria</h2>
              <a
                href="/produtos"
                className="font-sans text-[0.62rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5"
              >
                Ver todas <ArrowRight size={11} />
              </a>
            </div>
            <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 scrollbar-hide -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-7">
              {CATEGORIES.map(({ name, Icon }) => (
                <a
                  key={name}
                  href={`/produtos?categoria=${name}`}
                  className="flex flex-col items-center gap-2.5 flex-shrink-0 group lg:flex-shrink"
                >
                  <div className="w-[4.2rem] h-[4.2rem] sm:w-20 sm:h-20 lg:w-full bg-cream group-hover:bg-beige/70 transition-colors border border-beige/40 flex items-center justify-center">
                    <Icon size={24} strokeWidth={1.4} className="text-olive/80 group-hover:text-olive transition-colors" />
                  </div>
                  <span className="font-sans text-[0.65rem] sm:text-[0.68rem] font-medium text-espresso/75 tracking-wide text-center w-[4.2rem] sm:w-20 lg:w-full leading-tight">
                    {name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUTOS EM DESTAQUE ───────────────────────────────────────────── */}
        <section className="bg-sand py-14 lg:py-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 lg:mb-12">
              <div>
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  Selecionados com cuidado
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-espresso mt-2 font-normal">
                  Produtos em Destaque
                </h2>
              </div>
              <a
                href="/produtos"
                className="font-sans text-[0.65rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5 self-start sm:self-auto pb-1"
              >
                Ver todos <ArrowRight size={11} />
              </a>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-6 lg:gap-6">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col bg-cream animate-pulse">
                    <div className="aspect-square bg-sand/40" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-2 w-16 bg-sand/60" />
                      <div className="h-4 w-full bg-sand/60" />
                      <div className="h-3 w-2/3 bg-sand/60" />
                    </div>
                  </div>
                ))
              ) : products.map((product) => (
                <div key={product.id} className="group flex flex-col bg-cream">
                  <div className="aspect-square overflow-hidden relative">
                    {product.foto ? (
                      <Image
                        src={product.foto}
                        alt={product.nome}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <ImagePlaceholder className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
                    )}
                  </div>
                  <div className="p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
                    <span className="font-sans text-[0.55rem] sm:text-[0.62rem] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-caramel/80 font-semibold">
                      {product.categoria}
                    </span>
                    <h3 className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2 h-10 sm:h-auto">
                      {product.nome}
                    </h3>
                    <span className="font-sans text-[0.65rem] sm:text-[0.75rem] text-espresso/45">
                      por {product.produtoras?.nome_marca}
                    </span>
                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand">
                      <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso font-normal">
                        R$ {product.preco.toFixed(2).replace(".", ",")}
                      </span>
                      <button
                        aria-label="Adicionar ao carrinho"
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                      >
                        <Plus size={12} className="sm:size-[14px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── BANNER ─────────────────────────────────────────────────────────── */}
        <section className="bg-terracota py-16 sm:py-20 lg:py-32">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center flex flex-col items-center gap-6 sm:gap-8">
            <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-cream/35 font-semibold">
              Nossa missão
            </span>
            <blockquote className="font-serif text-[1.5rem] sm:text-4xl lg:text-5xl xl:text-[3.4rem] text-cream font-normal italic leading-[1.2] sm:leading-[1.18]">
              "Cada produto carrega<br className="hidden sm:block" /> uma história única."
            </blockquote>
            <a
              href="/produtos"
              className="inline-flex items-center justify-center gap-2 border border-cream/25 text-cream font-sans text-[0.68rem] sm:text-[0.72rem] font-semibold tracking-[0.2em] uppercase px-7 sm:px-8 py-4 hover:bg-cream/8 transition-colors mt-2"
            >
              Descubra Quem Faz
              <ArrowRight size={13} />
            </a>
          </div>
        </section>

      </main>
    </div>
  );
}
