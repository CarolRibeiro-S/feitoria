"use client";

import { useState, use, useEffect } from "react";
import {
  MapPin,
  Instagram,
  Phone,
  ChevronLeft,
  ArrowRight,
  Plus,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useCart } from "@/lib/cart-context";
import Image from "next/image";
import Link from "next/link";

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
  const [decorativeLogo, setDecorativeLogo] = useState<string | null>(null);

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

  // Check for decorative logo in storage (no DB column needed)
  useEffect(() => {
    if (!produtora) return;
    const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/produtoras/logos/${produtora.id}.jpeg`;
    fetch(logoUrl, { method: "HEAD" })
      .then((r) => { if (r.ok) setDecorativeLogo(logoUrl); })
      .catch(() => {});
  }, [produtora]);

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

  const instagramHandle = produtora.instagram
    ? produtora.instagram.startsWith("@")
      ? produtora.instagram
      : `@${produtora.instagram}`
    : null;

  const whatsappLink = produtora.whatsapp
    ? `https://wa.me/${produtora.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="bg-cream min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[65vh] sm:min-h-[75vh] overflow-hidden flex items-end">

        {/* Background photo */}
        {produtora.foto_perfil ? (
          <Image
            src={produtora.foto_perfil}
            alt={produtora.nome_marca}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-sand" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-transparent" />

        {/* Decorative logo — producers that have a logo uploaded to storage */}
        {decorativeLogo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img
              src={decorativeLogo}
              alt=""
              aria-hidden="true"
              className="w-[420px] sm:w-[520px] max-w-[75%] object-contain"
              style={{ opacity: 0.15, mixBlendMode: "luminosity" }}
            />
          </div>
        )}

        {/* Back link */}
        <div className="absolute top-0 inset-x-0 pt-20 sm:pt-24 lg:pt-32 px-5 sm:px-8">
          <Link
            href="/produtoras"
            className="inline-flex items-center gap-2 text-cream/55 hover:text-cream font-sans text-[0.68rem] tracking-widest uppercase transition-colors"
          >
            <ChevronLeft size={14} /> Todas as produtoras
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-12 sm:pb-16 lg:pb-24">
          <div className="max-w-2xl">
            <span className="font-sans text-[0.58rem] sm:text-[0.62rem] tracking-[0.35em] uppercase text-cream/45 font-semibold">
              Produtora
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-cream font-normal leading-[1.1] mt-2">
              {produtora.nome_marca}
            </h1>
            <div className="flex flex-wrap items-center gap-5 sm:gap-7 mt-4 sm:mt-5">
              <div className="flex items-center gap-1.5 text-cream/55">
                <MapPin size={13} strokeWidth={1.8} />
                <span className="font-sans text-[0.78rem] sm:text-[0.82rem]">
                  {produtora.cidade}, {produtora.estado}
                </span>
              </div>
              {instagramHandle && (
                <a
                  href={`https://instagram.com/${instagramHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cream/55 hover:text-cream transition-colors"
                >
                  <Instagram size={13} strokeWidth={1.8} />
                  <span className="font-sans text-[0.78rem] sm:text-[0.82rem]">
                    {instagramHandle}
                  </span>
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-cream/55 hover:text-cream transition-colors"
                >
                  <Phone size={13} strokeWidth={1.8} />
                  <span className="font-sans text-[0.78rem] sm:text-[0.82rem]">
                    WhatsApp
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20 lg:py-28">

        {/* ── NOSSA HISTÓRIA ───────────────────────────────────────────── */}
        {produtora.descricao && (
          <section className="max-w-3xl mb-20 sm:mb-24 lg:mb-32">
            <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
              Nossa história
            </span>
            <p className="font-serif text-xl sm:text-2xl text-espresso mt-5 leading-[1.7] font-normal">
              {produtora.descricao}
            </p>
          </section>
        )}

        {/* ── NOSSOS PRODUTOS ──────────────────────────────────────────── */}
        {produtos.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12 pb-6 border-b border-sand">
              <div>
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  Catálogo
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-espresso mt-2 font-normal">
                  Nossos Produtos
                </h2>
              </div>
              <Link
                href="/produtos"
                className="font-sans text-[0.65rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5 self-start sm:self-auto pb-1"
              >
                Ver catálogo completo <ArrowRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-6 lg:gap-6">
              {produtos.map((p) => (
                <div key={p.id} className="group flex flex-col bg-cream">
                  <div className="aspect-square overflow-hidden relative bg-[#DCC8B2] flex items-center justify-center">
                    {p.foto ? (
                      <Image
                        src={p.foto}
                        alt={p.nome}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-espresso/20" />
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

                  <div className="p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
                    <span className="font-sans text-[0.55rem] sm:text-[0.62rem] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-caramel/80 font-semibold">
                      {p.categoria}
                    </span>
                    <h3 className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2">
                      {p.nome}
                    </h3>
                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand">
                      <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso font-normal">
                        R$ {p.preco.toFixed(2).replace(".", ",")}
                      </span>
                      {p.variacoes?.length ? (
                        <Link
                          href={`/produtos/${p.id}?select_flavor=1`}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                          aria-label="Escolher sabor"
                        >
                          <Plus size={12} className="sm:size-[14px]" />
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
                          <Plus size={12} className="sm:size-[14px]" />
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
