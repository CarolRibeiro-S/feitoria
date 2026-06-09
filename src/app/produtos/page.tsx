"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  SlidersHorizontal,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";

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

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setErrorMessage(null);
        
        console.log("[ProdutosPage] Buscando produtos...");
        
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
              nome_marca,
              cidade,
              estado
            )
          `)
          .eq("disponivel", true)
          .order("criado_em", { ascending: false });

        if (error) {
          console.error("[ProdutosPage] Erro Supabase:", error);
          setErrorMessage(`Erro ao carregar produtos: ${error.message}`);
          return;
        }

        console.log("[ProdutosPage] Dados recebidos:", data);
        setProducts((data as any) || []);
      } catch (err: any) {
        console.error("[ProdutosPage] Erro inesperado:", err);
        setErrorMessage("Ocorreu um erro inesperado ao carregar os produtos.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = 
        product.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.produtoras?.nome_marca?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? product.categoria === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  // Mapeamento de categorias para exibição no front-end
  const getDisplayCategory = (cat: string) => {
    if (cat === "Confeitaria") return "Cozinha Artesanal";
    return cat;
  };

  return (
    <div className="bg-cream min-h-screen">
      <main className="pt-24 sm:pt-32 lg:pt-44 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          {/* ── PAGE TITLE & SEARCH ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-12">
            <div>
              <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                Nossa Curadoria
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-espresso mt-2 font-normal">
                Catálogo de Sabores
              </h1>
            </div>

            <div className="relative w-full md:max-w-sm">
              <input
                type="text"
                placeholder="Buscar por produto ou produtora..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-sand/40 border-b border-espresso/10 py-3 pl-2 pr-10 font-sans text-sm focus:outline-none focus:border-terracota transition-colors placeholder:text-espresso/30"
              />
              <Search className="absolute right-2 top-3 text-espresso/30" size={18} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[240px_1fr] gap-10 lg:gap-12">
            
            {/* ── FILTERS (Desktop) ─────────────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-10">
              <div>
                <h3 className="font-sans text-[0.6rem] tracking-[0.32em] uppercase text-espresso/40 mb-6 font-semibold flex items-center gap-2">
                  <SlidersHorizontal size={12} /> Categorias
                </h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`font-sans text-[0.85rem] text-left py-1.5 transition-colors ${
                      selectedCategory === null ? "text-terracota font-medium" : "text-espresso/65 hover:text-espresso"
                    }`}
                  >
                    Ver Tudo
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`font-sans text-[0.85rem] text-left py-1.5 transition-colors flex items-center justify-between group ${
                        selectedCategory === cat.name ? "text-terracota font-medium" : "text-espresso/65 hover:text-espresso"
                      }`}
                    >
                      {cat.name}
                      <cat.Icon size={14} className={selectedCategory === cat.name ? "text-terracota" : "text-espresso/20 group-hover:text-espresso/40"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-sand">
                <p className="font-serif text-sm text-espresso/50 italic leading-relaxed">
                  Cada item em nosso catálogo é produzido de forma artesanal, respeitando o tempo e a natureza.
                </p>
              </div>
            </aside>

            {/* ── MOBILE CATEGORIES ─────────────────────────────────────────── */}
            <div className="lg:hidden flex gap-2.5 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 font-sans text-[0.65rem] sm:text-[0.7rem] tracking-wider uppercase border transition-colors ${
                  selectedCategory === null 
                  ? "bg-espresso text-cream border-espresso" 
                  : "bg-cream text-espresso border-espresso/10"
                }`}
              >
                Tudo
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 font-sans text-[0.65rem] sm:text-[0.7rem] tracking-wider uppercase border transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.name 
                    ? "bg-espresso text-cream border-espresso" 
                    : "bg-cream text-espresso border-espresso/10"
                  }`}
                >
                  <cat.Icon size={13} />
                  {cat.name}
                </button>
              ))}
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
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col animate-pulse">
                      <div className="aspect-square bg-sand/50" />
                      <div className="p-4 flex flex-col gap-2">
                        <div className="h-2 w-16 bg-sand/60" />
                        <div className="h-4 w-full bg-sand/60" />
                        <div className="h-3 w-2/3 bg-sand/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !errorMessage && filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group flex flex-col bg-cream">
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
                        <h3 className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2 h-10 sm:h-auto">
                          {product.nome}
                        </h3>
                        <span className="font-sans text-[0.65rem] sm:text-[0.7rem] text-espresso/50 tracking-tight">
                          por {product.produtoras?.nome_marca}
                        </span>
                        <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand">
                          <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso font-normal">
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
                  <p className="font-serif text-xl text-espresso/40 italic">
                    Nenhum produto encontrado para sua busca.
                  </p>
                  <button 
                    onClick={() => {setSearchQuery(""); setSelectedCategory(null);}}
                    className="mt-4 text-caramel font-sans text-sm underline underline-offset-4"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
