"use client";

import { useState, use, useEffect } from "react";
import { MapPin, ExternalLink, Phone, ChevronLeft, ArrowRight, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useCart } from "@/lib/cart-context";
import Image from "next/image";
import Link from "next/link";

const logoSvgMap: Record<string, string> = {
  'Ju Fiche — Cozinha Artesanal': '/logo_jufiche.jpeg',
  "Cookie's Everest": '/logo_angela.jpeg',
  'Chef Koala': '/logo_koala.jpg',
}

interface Produtora {
  id: string;
  nome_marca: string;
  cidade: string;
  estado: string;
  descricao: string;
  foto_perfil: string | null;
  instagram: string | null;
  whatsapp?: string | null;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  foto: string | null;
  categoria: string;
  variacoes?: { sabor: string; preco: number }[] | null;
}

export default function ProdutoraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addItem } = useCart();

  const [produtora, setProdutora] = useState<Produtora | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: p, error: pErr } = await supabase
          .from("produtoras")
          .select("id, nome_marca, cidade, estado, descricao, foto_perfil, instagram, whatsapp")
          .eq("id", id)
          .single();

        if (pErr) throw pErr;
        setProdutora(p as any);

        const { data: prods } = await supabase
          .from("produtos")
          .select("id, nome, preco, foto, categoria, variacoes")
          .eq("produtora_id", id)
          .eq("disponivel", true)
          .order("criado_em", { ascending: false });

        if (prods) setProdutos(prods as any);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar produtora");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-cream min-h-screen pt-40 flex items-center justify-center">
        <Loader2 className="animate-spin text-terracota" size={40} />
      </div>
    );
  }

  if (error || !produtora) {
    return (
      <div className="bg-cream min-h-screen pt-40 px-5 text-center">
        <h1 className="font-serif text-2xl text-espresso mb-4">
          Produtora não encontrada
        </h1>
        <Link
          href="/produtoras"
          className="text-terracota font-sans uppercase tracking-widest text-xs font-semibold"
        >
          Ver todas as produtoras
        </Link>
      </div>
    );
  }

  const instagramUrl = produtora.instagram?.startsWith("http")
    ? produtora.instagram
    : produtora.instagram
      ? `https://instagram.com/${produtora.instagram.replace(/^@/, "")}`
      : null;
  const instagramLabel = produtora.instagram
    ? produtora.instagram.startsWith("http")
      ? `@${produtora.instagram.replace(/\/$/, "").split("/").pop()}`
      : produtora.instagram.startsWith("@")
        ? produtora.instagram
        : `@${produtora.instagram}`
    : null;

  const whatsappLink = produtora.whatsapp?.startsWith("http")
    ? produtora.whatsapp
    : produtora.whatsapp
      ? `https://wa.me/${produtora.whatsapp.replace(/\D/g, "")}`
      : null;

  const logoSvg = logoSvgMap[produtora.nome_marca];

  return (
    <div className="bg-cream min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row h-[400px] w-full">

        {/* Coluna esquerda — texto */}
        <div className="w-full sm:w-1/2 h-full p-8 sm:p-12 flex flex-col justify-center bg-[#E9E2D6]">
          {/* Back link — desktop only */}
          <Link
            href="/produtoras"
            className="hidden sm:inline-flex items-center gap-2 text-espresso/45 hover:text-espresso font-sans text-[0.65rem] tracking-widest uppercase transition-colors mb-8 self-start"
          >
            <ChevronLeft size={13} /> Todas as produtoras
          </Link>

          <div>
            <span className="font-sans text-[0.55rem] tracking-[0.38em] uppercase text-espresso/35 font-semibold">
              Produtora
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-espresso font-normal leading-tight mt-2">
              {produtora.nome_marca}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4">
              <div className="flex items-center gap-1.5 text-espresso/60">
                <MapPin size={12} strokeWidth={1.8} />
                <span className="font-sans text-[0.72rem] sm:text-[0.8rem]">
                  {produtora.cidade}, {produtora.estado}
                </span>
              </div>
              {instagramUrl && instagramLabel && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-espresso/60 hover:text-espresso transition-colors"
                >
                  <ExternalLink size={12} strokeWidth={1.8} />
                  <span className="font-sans text-[0.72rem] sm:text-[0.8rem]">
                    {instagramLabel}
                  </span>
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-espresso/60 hover:text-espresso transition-colors"
                >
                  <Phone size={12} strokeWidth={1.8} />
                  <span className="font-sans text-[0.72rem] sm:text-[0.8rem]">
                    WhatsApp
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita — logo */}
        <div className="w-full sm:w-1/2 h-full relative bg-[#E9E2D6] flex items-center justify-center p-12">
          {logoSvg ? (
            <Image
              src={logoSvg}
              alt={produtora.nome_marca}
              width={280}
              height={280}
              className="object-contain"
              unoptimized
            />
          ) : produtora.foto_perfil ? (
            <Image
              src={produtora.foto_perfil}
              alt={produtora.nome_marca}
              fill
              className="object-contain p-8"
              priority
              unoptimized={produtora.foto_perfil?.startsWith("/")}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span className="font-serif text-8xl text-espresso/10 select-none">
                {produtora.nome_marca.charAt(0)}
              </span>
            </div>
          )}
        </div>

      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="w-full px-5 sm:px-8 lg:px-12 py-12 sm:py-20 lg:py-24">

        {/* ── NOSSA HISTÓRIA ───────────────────────────────────────────── */}
        {produtora.descricao && (
          <section className="w-full mb-12 sm:mb-20 lg:mb-24">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-terracota font-normal">
              Nossa história
            </h2>
            <div className="mt-5 sm:mt-8 text-center">
              {produtora.descricao
                .split(/(?<=\.)\s+/)
                .filter(Boolean)
                .map((sentence, i) => (
                  <p key={i} className="font-serif text-base sm:text-lg lg:text-xl text-espresso leading-[1.8] font-normal mb-3 sm:mb-4 last:mb-0">
                    {sentence}
                  </p>
                ))}
            </div>
          </section>
        )}

        {/* ── NOSSOS PRODUTOS ──────────────────────────────────────────── */}
        {produtos.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-8 sm:mb-12 pb-5 sm:pb-6 border-b border-sand">
              <div>
                <span className="font-sans text-[0.58rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  Catálogo
                </span>
                <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl text-espresso mt-1.5 sm:mt-2 font-normal">
                  Nossos Produtos
                </h2>
              </div>
              <Link
                href="/produtos"
                className="font-sans text-[0.62rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5 self-start sm:self-auto pb-1"
              >
                Ver catálogo completo <ArrowRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8">
              {produtos.map((p) => (
                <div key={p.id} className="group flex flex-col bg-cream">
                  <div className="aspect-square overflow-hidden relative bg-[#DCC8B2] flex items-center justify-center">
                    {p.foto ? (
                      <Image
                        src={p.foto}
                        alt={p.nome}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-espresso/10" />
                    )}
                    <div className="absolute inset-0 bg-espresso/5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none lg:pointer-events-auto">
                      <Link
                        href={`/produtos/${p.id}`}
                        className="hidden lg:block bg-cream text-espresso font-sans text-[0.65rem] tracking-[0.2em] uppercase px-5 py-3 hover:bg-terracota hover:text-cream transition-colors"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 flex flex-col gap-1 sm:gap-1.5">
                    <span className="font-sans text-[0.52rem] sm:text-[0.6rem] tracking-[0.2em] uppercase text-caramel/80 font-semibold">
                      {p.categoria}
                    </span>
                    <h3 className="font-sans text-[0.78rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2">
                      {p.nome}
                    </h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-sand">
                      <span className="font-serif text-[0.95rem] sm:text-[1.1rem] text-espresso font-normal">
                        R$ {p.preco.toFixed(2).replace(".", ",")}
                      </span>
                      {p.variacoes?.length ? (
                        <Link
                          href={`/produtos/${p.id}?select_flavor=1`}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                          aria-label="Escolher sabor"
                        >
                          <Plus size={12} />
                        </Link>
                      ) : (
                        <button
                          aria-label="Adicionar ao carrinho"
                          onClick={() =>
                            addItem({
                              id: p.id,
                              name: p.nome,
                              producer: produtora.nome_marca,
                              price: p.preco,
                              quantity: 1,
                              image: p.foto,
                            })
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
