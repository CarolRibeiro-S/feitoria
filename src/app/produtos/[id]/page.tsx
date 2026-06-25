"use client";

import { useState, use, useEffect } from "react";
import {
  Heart,
  ShoppingBag,
  Plus,
  ArrowRight,
  MapPin,
  ChevronLeft,
  Share2,
  Minus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";
import Link from "next/link";

interface Variacao {
  sabor: string;
  preco: number;
}

interface ProductDetail {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  foto: string | null;
  categoria: string;
  variacoes?: Variacao[] | null;
  produtoras: {
    id: string;
    nome_marca: string;
    descricao: string;
    cidade: string;
    estado: string;
  };
}

interface RelatedProduct {
  id: string;
  nome: string;
  preco: number;
  foto: string | null;
  categoria: string;
  produtoras: {
    id: string;
    nome_marca: string;
  };
}

export default function ProdutoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariation, setSelectedVariation] = useState<Variacao | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [selectFlavorBanner, setSelectFlavorBanner] = useState(false);

  // CEP States
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<any>(null);
  const [frete, setFrete] = useState<number | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");

  useEffect(() => {
    async function fetchProductData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Busca produto principal com join de produtora
        const { data: produto, error: produtoError } = await supabase
          .from("produtos")
          .select("*, produtoras(id, nome_marca, descricao, cidade, estado)")
          .eq("id", id)
          .single();

        if (produtoError) throw produtoError;
        if (!produto) throw new Error("Produto não encontrado");

        setProduct(produto as any);

        // 2. Busca produtos relacionados (mesma categoria, exceto o atual)
        const { data: relacionados, error: relacionadosError } = await supabase
          .from("produtos")
          .select("*, produtoras(id, nome_marca)")
          .eq("categoria", produto.categoria)
          .neq("id", id)
          .eq("disponivel", true)
          .limit(3);

        if (!relacionadosError && relacionados) {
          setRelatedProducts(relacionados as any);
        }

      } catch (err: any) {
        console.error("[ProdutoDetalhe] Erro:", err);
        setError(err.message || "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("select_flavor") === "1") {
      setSelectFlavorBanner(true);
      const t = setTimeout(() => setSelectFlavorBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const hasVariacoes = (product?.variacoes?.length ?? 0) > 0;
  const displayPrice = selectedVariation?.preco ?? product?.preco ?? 0;

  const variationNote = (variacoes: Variacao[]) => {
    const prices = [...new Set(variacoes.map((v) => v.preco))].sort((a, b) => a - b);
    if (prices.length < 2) return null;
    const low = prices[0];
    const high = prices[prices.length - 1];
    const lowSabores = variacoes.filter((v) => v.preco === low).map((v) => v.sabor);
    const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
    if (lowSabores.includes("Tradicional")) {
      return `Sabor Tradicional ${fmt(low)} · Demais sabores ${fmt(high)}`;
    }
    return `A partir de ${fmt(low)}`;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (hasVariacoes && !selectedVariation) {
      setCartNotice("Por favor, selecione um sabor antes de adicionar ao carrinho.");
      const t = setTimeout(() => setCartNotice(null), 4000);
      return;
    }
    addItem({
      id: product.id,
      name: selectedVariation ? `${product.nome} — ${selectedVariation.sabor}` : product.nome,
      producer: product.produtoras.nome_marca,
      price: displayPrice,
      quantity: quantity,
      image: product.foto,
    });
  };

  function calcFrete(uf: string): number {
    if (uf === "SP") return 9.90;
    if (["RJ","MG","ES","PR","SC","RS"].includes(uf)) return 15.90;
    return 22.90;
  }

  const handleCepSearch = async () => {
    if (cep.length < 8) {
      setCepError("CEP inválido");
      return;
    }

    setLoadingCep(true);
    setCepError("");
    setAddress(null);
    setFrete(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
      } else {
        setAddress(data);
        setFrete(calcFrete(data.uf));
      }
    } catch (error) {
      setCepError("Erro ao consultar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  // Mapeamento de categorias para exibição no front-end
  const getDisplayCategory = (cat: string) => {
    if (cat === "Confeitaria") return "Cozinha Artesanal";
    return cat;
  };

  if (loading) {
    return (
      <div className="bg-cream min-h-screen pt-40 flex items-center justify-center">
        <Loader2 className="animate-spin text-terracota" size={40} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-cream min-h-screen pt-40 px-5 text-center">
        <h1 className="font-serif text-2xl text-espresso mb-4">Ops! {error || "Produto não encontrado"}</h1>
        <Link href="/produtos" className="text-terracota font-sans uppercase tracking-widest text-xs font-semibold">
          Voltar para o catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <main className="pt-28 lg:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          {/* Breadcrumbs & Back */}
          <div className="flex items-center justify-between py-6">
            <Link 
              href="/produtos" 
              className="flex items-center gap-2 text-espresso/50 hover:text-espresso font-sans text-[0.7rem] tracking-widest uppercase transition-colors"
            >
              <ChevronLeft size={14} /> Voltar para o catálogo
            </Link>
            <button className="text-espresso/40 hover:text-espresso transition-colors">
              <Share2 size={18} />
            </button>
          </div>

          {/* ── PRODUCT MAIN ─────────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-24 py-6 sm:py-8 lg:py-12">
            
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <div className="aspect-[4/5] bg-[#DCC8B2] overflow-hidden relative flex items-center justify-center">
                {product.foto ? (
                  <Image 
                    src={product.foto} 
                    alt={product.nome}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <ImageIcon size={48} className="text-espresso/20" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6 sm:gap-8">
              <div>
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  {getDisplayCategory(product.categoria)}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-espresso mt-2 sm:mt-3 font-normal leading-[1.15] sm:leading-tight">
                  {product.nome}
                </h1>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 sm:mt-6">
                  <span className="font-serif text-2xl sm:text-3xl text-espresso font-normal">
                    R$ {displayPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="hidden sm:block text-espresso/20">|</span>
                  <div className="flex items-center gap-1.5 text-espresso/45">
                    <MapPin size={14} />
                    <span className="font-sans text-[0.75rem] sm:text-[0.8rem]">{product.produtoras.cidade}, {product.produtoras.estado}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[0.9rem] sm:text-[0.95rem] text-espresso/70 leading-relaxed whitespace-pre-line">
                  {product.descricao}
                </p>
                <div className="pt-2 sm:pt-4 flex flex-col gap-1.5 sm:gap-2">
                  <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                    Produtora
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-serif text-lg sm:text-xl text-espresso font-normal">
                      <Link
                        href={`/produtoras/${product.produtoras.id}`}
                        className="hover:text-terracota transition-colors underline decoration-espresso/20 underline-offset-4 hover:decoration-terracota"
                      >
                        {product.produtoras.nome_marca}
                      </Link>
                    </h3>
                    <p className="font-sans text-sm text-espresso/60 italic leading-relaxed">
                      {product.produtoras.descricao}
                    </p>
                  </div>
                </div>
              </div>

              {/* Select-flavor banner — shown when redirected from catalog */}
              {selectFlavorBanner && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-sand border border-caramel/30">
                  <span className="w-1 h-4 bg-caramel flex-shrink-0" />
                  <p className="font-sans text-[0.78rem] text-espresso/75 tracking-wide">
                    Selecione um sabor para continuar.
                  </p>
                </div>
              )}

              {/* Variation selector */}
              {hasVariacoes && product.variacoes && (
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                    Escolha o sabor
                  </label>
                  <div className="relative">
                    <select
                      value={selectedVariation?.sabor ?? ""}
                      onChange={(e) => {
                        const v = product.variacoes!.find((v) => v.sabor === e.target.value) ?? null;
                        setSelectedVariation(v);
                        setCartNotice(null);
                      }}
                      className="w-full appearance-none bg-sand/30 border border-espresso/10 px-4 py-3 font-sans text-[0.85rem] text-espresso focus:outline-none focus:border-caramel transition-colors cursor-pointer pr-10"
                    >
                      <option value="" disabled>Selecione um sabor...</option>
                      {product.variacoes.map((v) => (
                        <option key={v.sabor} value={v.sabor}>{v.sabor}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso/30">
                      ▾
                    </span>
                  </div>
                  {variationNote(product.variacoes) && (
                    <p className="font-sans text-[0.68rem] text-espresso/40 tracking-wide">
                      {variationNote(product.variacoes)}
                    </p>
                  )}
                </div>
              )}

              {/* Cart notice */}
              {cartNotice && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-terracota/5 border border-terracota/20">
                  <span className="w-1 h-4 bg-terracota flex-shrink-0" />
                  <p className="font-sans text-[0.78rem] text-terracota tracking-wide">
                    {cartNotice}
                  </p>
                </div>
              )}

              <div className="pt-6 sm:pt-8 border-t border-sand flex flex-col sm:flex-row items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-espresso/10 bg-sand/20 h-12 sm:h-14 w-full sm:w-auto">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 sm:w-12 h-full flex items-center justify-center text-espresso/30 hover:text-espresso transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-sans font-medium text-espresso">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 sm:w-12 h-full flex items-center justify-center text-espresso/30 hover:text-espresso transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 h-12 sm:h-14 bg-terracota text-cream font-sans text-[0.7rem] sm:text-[0.75rem] font-semibold tracking-[0.2em] uppercase hover:bg-caramel transition-colors flex items-center justify-center gap-3 w-full"
                >
                  Adicionar ao Carrinho
                  <ShoppingBag size={18} />
                </button>

                <button className="h-12 w-full sm:w-14 border border-espresso/10 flex items-center justify-center text-espresso/40 hover:text-espresso transition-colors">
                  <Heart size={20} />
                </button>
              </div>

              {/* Shipping Estimate */}
              <div className="mt-2 p-5 bg-sand/30 border border-sand flex flex-col gap-4">
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.15em] uppercase text-espresso/50 font-semibold">
                  Calcular Entrega
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Seu CEP"
                    value={cep}
                    onChange={(e) => { setCep(e.target.value.replace(/\D/g, "").slice(0, 8)); setAddress(null); setFrete(null); }}
                    className="flex-1 bg-cream border border-espresso/10 px-4 py-2 text-sm font-sans focus:outline-none focus:border-terracota min-w-0"
                  />
                  <button 
                    onClick={handleCepSearch}
                    disabled={loadingCep}
                    className="bg-espresso text-cream px-4 sm:px-6 py-2 text-[0.6rem] sm:text-[0.65rem] uppercase font-sans tracking-widest font-semibold hover:bg-terracota transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px] sm:min-w-[80px]"
                  >
                    {loadingCep ? <Loader2 size={14} className="animate-spin" /> : "OK"}
                  </button>
                </div>

                {cepError && (
                  <div className="flex items-center gap-2 text-terracota font-sans text-[0.7rem]">
                    <AlertCircle size={14} />
                    {cepError}
                  </div>
                )}

                {address && frete !== null && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-sand/50">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-olive mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-sans text-[0.75rem] text-espresso font-medium">
                          {address.logradouro}, {address.bairro}
                        </span>
                        <span className="font-sans text-[0.7rem] text-espresso/50">
                          {address.localidade} — {address.uf}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 bg-sand/40 p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[0.72rem] text-espresso/60">Valor do produto</span>
                        <span className="font-sans text-[0.78rem] text-espresso font-medium">
                          R$ {displayPrice.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[0.72rem] text-espresso/60">Taxa de entrega (estimativa)</span>
                        <span className="font-sans text-[0.78rem] text-espresso font-medium">
                          R$ {frete.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                    <p className="font-sans text-[0.65rem] text-espresso/40 italic">
                      Entrega em 3 a 5 dias úteis. O frete será confirmado ao finalizar o pedido.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RELATED PRODUCTS ─────────────────────────────────────────────── */}
          {relatedProducts.length > 0 && (
            <section className="py-16 lg:py-32 border-t border-sand mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
                <div>
                  <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                    Você também pode gostar
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-espresso mt-2 font-normal">
                    Produtos Relacionados
                  </h2>
                </div>
                <Link
                  href="/produtos"
                  className="font-sans text-[0.65rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5 self-start sm:self-auto pb-1"
                >
                  Ver todos <ArrowRight size={11} />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-6 lg:gap-6">
                {relatedProducts.map((p) => (
                  <div key={p.id} className="group flex flex-col bg-cream">
                    <div className="aspect-square overflow-hidden relative bg-[#DCC8B2] flex items-center justify-center">
                      {p.foto ? (
                        <Image
                          src={p.foto}
                          alt={p.nome}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
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
                        {getDisplayCategory(p.categoria)}
                      </span>
                      <Link
                        href={`/produtos/${p.id}`}
                        className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2 h-10 sm:h-auto hover:underline underline-offset-2 decoration-espresso/20"
                      >
                        {p.nome}
                      </Link>
                      <Link
                        href={`/produtoras/${p.produtoras?.id}`}
                        className="font-sans text-[0.65rem] sm:text-[0.75rem] text-espresso/45 hover:text-espresso hover:underline underline-offset-2 transition-colors"
                      >
                        por {p.produtoras?.nome_marca}
                      </Link>
                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand">
                        <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso font-normal">
                          R$ {p.preco.toFixed(2).replace(".", ",")}
                        </span>
                        <button
                          aria-label="Adicionar ao carrinho"
                          onClick={() => addItem({
                            id: p.id,
                            name: p.nome,
                            producer: p.produtoras?.nome_marca,
                            price: p.preco,
                            quantity: 1,
                            image: p.foto,
                          })}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                        >
                          <Plus size={12} className="sm:size-[14px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
