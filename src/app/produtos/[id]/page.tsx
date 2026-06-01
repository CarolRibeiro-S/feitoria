"use client";

import { useState, use, useMemo } from "react";
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
} from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useCart } from "@/lib/cart-context";

// ─── Mock data (Same as catalog for consistency) ─────────────────────────────

const ALL_PRODUCTS = [
  { id: 1, name: "Geleia de Damasco com Cardamomo", producer: "Casa Mato Verde", price: 34.9, category: "Empório", description: "Uma combinação sofisticada e aromática. Nossa geleia é produzida em pequenos lotes, usando damascos selecionados e cardamomo moído na hora. Perfeita para acompanhar queijos maturados ou torradas de fermentação natural.", city: "Belo Horizonte, MG" },
  { id: 2, name: "Torta de Lavanda e Limão Siciliano", producer: "Ateliê das Flores", price: 89.0, category: "Confeitaria", description: "Uma sobremesa delicada e surpreendente. A base amanteigada sustenta um creme aveludado de limão siciliano com o toque floral da lavanda orgânica. Decorada com flores comestíveis do nosso jardim.", city: "São Paulo, SP" },
  { id: 3, name: "Pão de Centeio com Nozes", producer: "Grão Fermentado", price: 28.0, category: "Padaria", description: "Pão de fermentação natural (levain) com 48h de maturação. O centeio traz notas terrosas que harmonizam perfeitamente com a crocância das nozes chilenas.", city: "Florianópolis, SC" },
  { id: 4, name: "Kit Café da Manhã Especial", producer: "Casa Mato Verde", price: 145.0, category: "Kits", description: "Uma seleção de nossos melhores produtos para um despertar inesquecível. Inclui pão artesanal, geleia da estação, granola da casa e café especial.", city: "Belo Horizonte, MG" },
  { id: 5, name: "Brigadeiro de Pistache", producer: "Ateliê das Flores", price: 12.0, category: "Confeitaria", description: "Brigadeiro gourmet feito com pistache italiano e chocolate branco belga. Textura impecável e sabor marcante.", city: "São Paulo, SP" },
  { id: 6, name: "Focaccia de Ervas e Azeite", producer: "Grão Fermentado", price: 42.0, category: "Padaria", description: "Massa leve e aerada, generosamente regada com azeite extra virgem e finalizada com flor de sal e alecrim fresco.", city: "Florianópolis, SC" },
  { id: 7, name: "Café Especial Torra Média", producer: "Sítio Primavera", price: 54.0, category: "Cafés", description: "Café arábica de altitude com notas de caramelo e chocolate. Torra média que preserva a doçura natural do grão.", city: "Espírito Santo do Pinhal, SP" },
  { id: 8, name: "Vinho Artesanal de Jabuticaba", producer: "Vinícola Velha", price: 78.0, category: "Bebidas", description: "Fermentado de jabuticaba produzido seguindo tradições familiares. Sabor frutado, equilibrado e com final persistente.", city: "Bento Gonçalves, RS" },
  { id: 9, name: "Lasanha Artesanal Congelada", producer: "Massa & Cia", price: 45.0, category: "Congelados", description: "Massa fresca produzida com ovos caipiras e farinha italiana. Molho de tomate artesanal e queijos selecionados.", city: "Curitiba, PR" },
];

export default function ProdutoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  // CEP States
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<any>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");

  const product = ALL_PRODUCTS.find((p) => p.id === Number(id)) || ALL_PRODUCTS[0];
  
  const relatedProducts = useMemo(() => {
    return ALL_PRODUCTS
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [product]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      producer: product.producer,
      price: product.price,
      quantity: quantity,
      image: null
    });
  };

  const handleCepSearch = async () => {
    if (cep.length < 8) {
      setCepError("CEP inválido");
      return;
    }

    setLoadingCep(true);
    setCepError("");
    setAddress(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
      } else {
        setAddress(data);
      }
    } catch (error) {
      setCepError("Erro ao consultar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      <main className="pt-28 lg:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          {/* Breadcrumbs & Back */}
          <div className="flex items-center justify-between py-6">
            <a 
              href="/produtos" 
              className="flex items-center gap-2 text-espresso/50 hover:text-espresso font-sans text-[0.7rem] tracking-widest uppercase transition-colors"
            >
              <ChevronLeft size={14} /> Voltar para o catálogo
            </a>
            <button className="text-espresso/40 hover:text-espresso transition-colors">
              <Share2 size={18} />
            </button>
          </div>

          {/* ── PRODUCT MAIN ─────────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-24 py-6 sm:py-8 lg:py-12">
            
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <div className="aspect-[4/5] bg-sand overflow-hidden">
                <ImagePlaceholder className="w-full h-full" />
              </div>
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-sand/50 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <ImagePlaceholder className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6 sm:gap-8">
              <div>
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  {product.category}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-espresso mt-2 sm:mt-3 font-normal leading-[1.15] sm:leading-tight">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 sm:mt-6">
                  <span className="font-serif text-2xl sm:text-3xl text-espresso font-normal">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="hidden sm:block text-espresso/20">|</span>
                  <div className="flex items-center gap-1.5 text-espresso/45">
                    <MapPin size={14} />
                    <span className="font-sans text-[0.75rem] sm:text-[0.8rem]">{product.city}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-sans text-[0.9rem] sm:text-[0.95rem] text-espresso/70 leading-relaxed">
                  {product.description}
                </p>
                <div className="pt-2 sm:pt-4 flex flex-col gap-1.5 sm:gap-2">
                  <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                    Produtora
                  </span>
                  <a href="#" className="font-serif text-lg sm:text-xl text-espresso hover:text-terracota transition-colors underline underline-offset-4 decoration-espresso/10 hover:decoration-terracota">
                    {product.producer}
                  </a>
                </div>
              </div>

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
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
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

                {address && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-sand/50">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-olive mt-0.5" />
                      <div className="flex flex-col">
                        <span className="font-sans text-[0.75rem] text-espresso font-medium">
                          {address.logradouro}, {address.bairro}
                        </span>
                        <span className="font-sans text-[0.7rem] text-espresso/50">
                          {address.localidade} - {address.uf}
                        </span>
                      </div>
                    </div>
                    <div className="bg-olive/10 border border-olive/10 p-3 mt-1">
                      <p className="font-sans text-[0.7rem] text-olive font-semibold tracking-wide uppercase">
                        Entrega em 3 a 5 dias úteis
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RELATED PRODUCTS ─────────────────────────────────────────────── */}
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
              <a
                href="/produtos"
                className="font-sans text-[0.65rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5 self-start sm:self-auto pb-1"
              >
                Ver todos <ArrowRight size={11} />
              </a>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-6 lg:gap-6">
              {relatedProducts.map((p) => (
                <div key={p.id} className="group flex flex-col bg-cream">
                  <div className="aspect-square overflow-hidden relative">
                    <ImagePlaceholder className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
                    <div className="absolute inset-0 bg-espresso/5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none lg:pointer-events-auto">
                      <a 
                        href={`/produtos/${p.id}`}
                        className="hidden lg:block bg-cream text-espresso font-sans text-[0.65rem] tracking-[0.2em] uppercase px-5 py-3 hover:bg-terracota hover:text-cream transition-colors"
                      >
                        Ver Detalhes
                      </a>
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
                    <span className="font-sans text-[0.55rem] sm:text-[0.62rem] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-caramel/80 font-semibold">
                      {p.category}
                    </span>
                    <h3 className="font-sans text-[0.8rem] sm:text-[0.88rem] font-medium text-espresso leading-snug line-clamp-2 h-10 sm:h-auto">
                      {p.name}
                    </h3>
                    <span className="font-sans text-[0.65rem] sm:text-[0.75rem] text-espresso/45">
                      por {p.producer}
                    </span>
                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sand">
                      <span className="font-serif text-[1rem] sm:text-[1.15rem] text-espresso font-normal">
                        R$ {p.price.toFixed(2).replace(".", ",")}
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
          </section>

        </div>
      </main>
    </div>
  );
}
