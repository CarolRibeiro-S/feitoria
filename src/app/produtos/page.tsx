"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  Heart,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import { trackEvent } from "@/lib/track-event";
import Image from "next/image";
import Link from "next/link";

interface ProductWithProducer {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  foto: string | null;
  categoria: string;
  disponivel: boolean;
  variacoes?: { sabor: string; preco: number }[] | null;
  produtoras: {
    id: string;
    nome_marca: string;
    cidade: string;
    estado: string;
  };
}

export default function ProdutosPage() {
  const { addItem } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Favorites
  const [userId, setUserId] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  // Read ?categoria= from URL on mount
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("categoria");
    if (cat) setSelectedCategory(cat);
  }, []);

  useEffect(() => { trackEvent("pageview", "/produtos"); }, []);

  // Load products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const { data, error } = await supabase
          .from("produtos")
          .select(`
            id,
            nome,
            descricao,
            preco,
            foto,
            categoria,
            disponivel,
            variacoes,
            produtoras (
              id,
              nome_marca,
              cidade,
              estado
            )
          `)
          .eq("disponivel", true)
          .order("criado_em", { ascending: false });

        if (error) {
          setErrorMessage(`Erro ao carregar produtos: ${error.message}`);
          return;
        }
        setProducts((data as any) || []);
      } catch (err: any) {
        setErrorMessage("Ocorreu um erro inesperado ao carregar os produtos.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Load user + favorites
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        supabase
          .from("favoritos")
          .select("produto_id")
          .eq("usuario_id", user.id)
          .then(({ data }) => {
            setFavoritos(new Set(data?.map((f: any) => f.produto_id) ?? []));
          });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      if (u) {
        supabase
          .from("favoritos")
          .select("produto_id")
          .eq("usuario_id", u.id)
          .then(({ data }) => {
            setFavoritos(new Set(data?.map((f: any) => f.produto_id) ?? []));
          });
      } else {
        setFavoritos(new Set());
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function toggleFavorite(e: React.MouseEvent, produtoId: string) {
    e.stopPropagation();
    e.preventDefault();
    if (!userId) {
      router.push("/login");
      return;
    }
    if (favoritos.has(produtoId)) {
      setFavoritos((prev) => { const s = new Set(prev); s.delete(produtoId); return s; });
      await supabase.from("favoritos").delete().eq("usuario_id", userId).eq("produto_id", produtoId);
    } else {
      setFavoritos((prev) => new Set([...prev, produtoId]));
      await supabase.from("favoritos").insert({ usuario_id: userId, produto_id: produtoId });
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.produtoras?.nome_marca?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? product.categoria === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const getDisplayCategory = (cat: string) => {
    if (cat === "Confeitaria") return "Cozinha Artesanal";
    return cat;
  };

  return (
    <div className="bg-cream dark:bg-dark-bg min-h-screen">
      <main className="pt-24 sm:pt-32 lg:pt-44 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          {/* ── PAGE TITLE & SEARCH ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-12">
            <div>
              <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                Nossa Curadoria
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-espresso dark:text-cream mt-2 font-normal">
                Catálogo de Sabores
              </h1>
            </div>

            <div className="relative w-full md:max-w-sm">
              <input
                type="text"
                placeholder="Buscar por produto ou produtora..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-sand/40 dark:bg-espresso/20 border-b border-espresso/10 dark:border-cream/10 py-3 pl-2 pr-10 font-sans text-sm text-espresso dark:text-cream focus:outline-none focus:border-terracota transition-colors placeholder:text-espresso/30 dark:placeholder:text-cream/30"
              />
              <Search className="absolute right-2 top-3 text-espresso/30 dark:text-cream/30" size={18} />
            </div>
          </div>

          {/* ── CATEGORY PILLS ────────────────────────────────────────────── */}
          <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0 mb-10 sm:mb-12">
            <div className="flex sm:flex-wrap sm:justify-center gap-2.5 sm:gap-3 min-w-max sm:min-w-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-sans text-sm border transition-colors ${
                  selectedCategory === null
                    ? "bg-terracota border-terracota text-cream"
                    : "bg-transparent border-espresso/25 dark:border-cream/25 text-espresso dark:text-cream hover:border-espresso/60 dark:hover:border-cream/60"
                }`}
              >
                Ver Tudo
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full font-sans text-sm border transition-colors ${
                    selectedCategory === cat.name
                      ? "bg-terracota border-terracota text-cream"
                      : "bg-transparent border-espresso/25 dark:border-cream/25 text-espresso dark:text-cream hover:border-espresso/60 dark:hover:border-cream/60"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── PRODUCT GRID ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-8">
              {errorMessage && (
                <div className="bg-wine/5 border border-wine/20 p-6 flex flex-col items-center gap-4 text-center">
                  <AlertCircle className="text-wine/60" size={32} />
                  <div>
                    <p className="font-serif text-lg text-espresso">{errorMessage}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 text-terracota font-sans text-xs uppercase tracking-widest font-semibold hover:text-caramel transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              {!errorMessage && loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col animate-pulse">
                      <div className="aspect-square bg-sand/50 dark:bg-espresso/30" />
                      <div className="p-4 flex flex-col gap-2">
                        <div className="h-2 w-16 bg-sand/60 dark:bg-espresso/30" />
                        <div className="h-4 w-full bg-sand/60 dark:bg-espresso/30" />
                        <div className="h-3 w-2/3 bg-sand/60 dark:bg-espresso/30" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !errorMessage && filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group flex flex-col bg-cream dark:bg-dark-surface">
                      <div className="aspect-square overflow-hidden relative bg-[#DCC8B2] flex items-center justify-center">
                        {product.foto ? (
                          <Image
                            src={product.foto}
                            alt={product.nome}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-espresso/20">
                            <ImageIcon size={32} strokeWidth={1.2} />
                          </div>
                        )}
                        {/* Favorites button */}
                        <button
                          aria-label={favoritos.has(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          onClick={(e) => toggleFavorite(e, product.id)}
                          className="absolute top-2 right-2 z-10 w-8 h-8 bg-cream/85 dark:bg-dark-surface/85 flex items-center justify-center hover:bg-cream dark:hover:bg-dark-surface transition-colors shadow-sm"
                        >
                          <Heart
                            size={15}
                            strokeWidth={1.5}
                            className={favoritos.has(product.id) ? "fill-terracota text-terracota" : "text-espresso/50"}
                          />
                        </button>
                        <div className="absolute inset-0 bg-espresso/5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none lg:pointer-events-auto">
                          <a
                            href={`/produtos/${product.id}`}
                            className="hidden lg:block bg-cream text-espresso font-sans text-[0.65rem] tracking-[0.2em] uppercase px-5 py-3 hover:bg-terracota hover:text-cream transition-colors"
                          >
                            Ver Detalhes
                          </a>
                        </div>
                      </div>
                      <div className="p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
                        <span className="font-sans text-[0.55rem] sm:text-[0.62rem] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-caramel/80 font-semibold">
                          {getDisplayCategory(product.categoria)}
                        </span>
                        <Link
                          href={`/produtos/${product.id}`}
                          className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso dark:text-cream leading-snug line-clamp-2 h-10 sm:h-auto hover:underline underline-offset-2 decoration-espresso/20 dark:decoration-cream/20"
                        >
                          {product.nome}
                        </Link>
                        <Link
                          href={`/produtoras/${product.produtoras?.id}`}
                          className="font-sans text-[0.65rem] sm:text-[0.7rem] text-espresso/50 dark:text-cream/50 tracking-tight hover:text-espresso dark:hover:text-cream hover:underline underline-offset-2 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          por {product.produtoras?.nome_marca}
                        </Link>
                        <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand dark:border-espresso/40">
                          <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso dark:text-cream font-normal">
                            R$ {product.preco?.toFixed(2).replace(".", ",")}
                          </span>
                          <button
                            aria-label={product.variacoes?.length ? "Ver opções" : "Adicionar ao carrinho"}
                            onClick={() => {
                              if (product.variacoes?.length) {
                                router.push(`/produtos/${product.id}?select_flavor=1`);
                              } else {
                                addItem({
                                  id: product.id,
                                  name: product.nome,
                                  producer: product.produtoras?.nome_marca,
                                  price: product.preco,
                                  quantity: 1,
                                  image: product.foto,
                                  categoria: product.categoria,
                                });
                              }
                            }}
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                          >
                            <Plus size={12} className="sm:size-[14px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !errorMessage && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="font-serif text-xl text-espresso/40 dark:text-cream/40 italic">
                    Nenhum produto encontrado para sua busca.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                    className="mt-4 text-caramel font-sans text-sm underline underline-offset-4"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>

        </div>
      </main>
    </div>
  );
}
