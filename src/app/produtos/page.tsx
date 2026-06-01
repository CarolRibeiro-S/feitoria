"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_PRODUCTS = [
  { id: 1, name: "Geleia de Damasco com Cardamomo", producer: "Casa Mato Verde", price: 34.9, category: "Empório", image: null },
  { id: 2, name: "Torta de Lavanda e Limão Siciliano", producer: "Ateliê das Flores", price: 89.0, category: "Confeitaria", image: null },
  { id: 3, name: "Pão de Centeio com Nozes", producer: "Grão Fermentado", price: 28.0, category: "Padaria", image: null },
  { id: 4, name: "Kit Café da Manhã Especial", producer: "Casa Mato Verde", price: 145.0, category: "Kits", image: null },
  { id: 5, name: "Brigadeiro de Pistache", producer: "Ateliê das Flores", price: 12.0, category: "Confeitaria", image: null },
  { id: 6, name: "Focaccia de Ervas e Azeite", producer: "Grão Fermentado", price: 42.0, category: "Padaria", image: null },
  { id: 7, name: "Café Especial Torra Média", producer: "Sítio Primavera", price: 54.0, category: "Cafés", image: null },
  { id: 8, name: "Vinho Artesanal de Jabuticaba", producer: "Vinícola Velha", price: 78.0, category: "Bebidas", image: null },
  { id: 9, name: "Lasanha Artesanal Congelada", producer: "Massa & Cia", price: 45.0, category: "Congelados", image: null },
  { id: 10, name: "Biscoitos Amanteigados", producer: "Ateliê das Flores", price: 22.0, category: "Confeitaria", image: null },
  { id: 11, name: "Azeite Aromatizado com Alecrim", producer: "Casa Mato Verde", price: 48.0, category: "Empório", image: null },
  { id: 12, name: "Pão de Queijo de Canastra", producer: "Grão Fermentado", price: 32.0, category: "Padaria", image: null },
];

export default function ProdutosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.producer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group flex flex-col bg-cream">
                      <div className="aspect-square overflow-hidden relative">
                        <ImagePlaceholder className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
                        {/* Overlay to show "Ver Detalhes" on hover - Hidden on mobile, handled by click if preferred */}
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
                          {product.category}
                        </span>
                        <h3 className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2 h-10 sm:h-auto">
                          {product.name}
                        </h3>
                        <span className="font-sans text-[0.65rem] sm:text-[0.75rem] text-espresso/45">
                          por {product.producer}
                        </span>
                        <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand">
                          <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso font-normal">
                            R$ {product.price.toFixed(2).replace(".", ",")}
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
              ) : (
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
