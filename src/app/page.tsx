import Image from "next/image";
import {
  MapPin,
  ArrowRight,
  Plus,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PRODUCERS = [
  {
    id: 1,
    name: "Ateliê das Flores",
    city: "São Paulo, SP",
    category: "Confeitaria",
    bio: "Doces artesanais feitos com amor e flores comestíveis colhidas da própria horta.",
  },
  {
    id: 2,
    name: "Casa Mato Verde",
    city: "Belo Horizonte, MG",
    category: "Empório",
    bio: "Conservas, geleias e especiarias produzidas com ingredientes de pequenos agricultores.",
  },
  {
    id: 3,
    name: "Grão Fermentado",
    city: "Florianópolis, SC",
    category: "Padaria",
    bio: "Pães de fermentação natural com grãos locais e métodos ancestrais.",
  },
];

const PRODUCTS = [
  { id: 1, name: "Geleia de Damasco com Cardamomo", producer: "Casa Mato Verde", price: 34.9, category: "Empório" },
  { id: 2, name: "Torta de Lavanda e Limão Siciliano", producer: "Ateliê das Flores", price: 89.0, category: "Confeitaria" },
  { id: 3, name: "Pão de Centeio com Nozes", producer: "Grão Fermentado", price: 28.0, category: "Padaria" },
  { id: 4, name: "Kit Café da Manhã Especial", producer: "Casa Mato Verde", price: 145.0, category: "Kits" },
  { id: 5, name: "Brigadeiro de Pistache", producer: "Ateliê das Flores", price: 12.0, category: "Confeitaria" },
  { id: 6, name: "Focaccia de Ervas e Azeite", producer: "Grão Fermentado", price: 42.0, category: "Padaria" },
];

export default function Home() {
  return (
    <div className="bg-cream min-h-screen">
      <main>
        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="pt-16 sm:pt-20 lg:pt-28 bg-cream">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-10 xl:gap-20 items-center min-h-[85vh] py-12 lg:py-0">

              {/* Copy */}
              <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 order-2 lg:order-1">
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  Artesanal · Local · Singular
                </span>
                <div className="flex flex-col gap-4">
                  <h1 className="font-serif text-[2.2rem] sm:text-5xl lg:text-[3.4rem] xl:text-[4rem] text-espresso leading-[1.1] sm:leading-[1.08] font-normal">
                    Curadoria de sabores, marcas e histórias.
                  </h1>
                  <p className="font-serif text-lg sm:text-2xl text-espresso/55 italic font-normal">
                    Descubra quem faz.
                  </p>
                </div>
                <p className="font-sans text-[0.88rem] sm:text-[0.92rem] text-espresso/65 leading-relaxed max-w-sm">
                  Uma plataforma que conecta você a pequenos produtores de alimentos artesanais do Brasil — cada produto com um rosto, uma história, um propósito.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="/produtos"
                    className="inline-flex items-center justify-center gap-2 bg-terracota text-cream font-sans text-[0.7rem] sm:text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-7 py-4 hover:bg-caramel transition-colors"
                  >
                    Explorar Produtos
                    <ArrowRight size={14} />
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-2 border border-espresso/25 text-espresso font-sans text-[0.7rem] sm:text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-7 py-4 hover:border-espresso/60 transition-colors"
                  >
                    Conheça as Produtoras
                  </a>
                </div>
              </div>

              {/* Image */}
              <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[280px] sm:max-w-sm lg:max-w-none">
                  <div className="aspect-[4/5] overflow-hidden">
                    <ImagePlaceholder className="w-full h-full" />
                  </div>
                  {/* Decorative accents */}
                  <div className="absolute -bottom-3 -left-3 w-16 h-16 sm:w-20 sm:h-20 bg-sand -z-10" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 sm:w-14 sm:h-14 bg-beige/50 -z-10" />
                </div>
              </div>

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
                    <Icon size={24} strokeWidth={1.4} className="text-espresso/70 group-hover:text-espresso transition-colors" />
                  </div>
                  <span className="font-sans text-[0.65rem] sm:text-[0.68rem] font-medium text-espresso/75 tracking-wide text-center w-[4.2rem] sm:w-20 lg:w-full leading-tight">
                    {name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── DESCUBRA QUEM FAZ ──────────────────────────────────────────────── */}
        <section className="bg-cream py-14 lg:py-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 lg:mb-12">
              <div>
                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-caramel font-semibold">
                  As mãos por trás
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-espresso mt-2 font-normal">
                  Descubra Quem Faz
                </h2>
              </div>
              <a
                href="#"
                className="font-sans text-[0.65rem] sm:text-[0.68rem] text-caramel tracking-[0.2em] uppercase font-semibold hover:text-terracota transition-colors flex items-center gap-1.5 self-start sm:self-auto pb-1"
              >
                Ver todas as produtoras <ArrowRight size={11} />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
              {PRODUCERS.map((p) => (
                <div key={p.id} className="group flex flex-col bg-sand hover:bg-sand/70 transition-colors">
                  <div className="aspect-[3/2] overflow-hidden">
                    <ImagePlaceholder className="w-full h-full group-hover:scale-[1.02] transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <span className="font-sans text-[0.6rem] sm:text-[0.62rem] tracking-[0.28em] uppercase text-caramel font-semibold">
                        {p.category}
                      </span>
                      <h3 className="font-serif text-[1.15rem] sm:text-[1.25rem] text-espresso mt-1 font-normal">{p.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-espresso/45">
                      <MapPin size={11} strokeWidth={1.8} />
                      <span className="font-sans text-[0.7rem] sm:text-[0.72rem]">{p.city}</span>
                    </div>
                    <p className="font-sans text-[0.8rem] sm:text-[0.83rem] text-espresso/65 leading-relaxed flex-1">
                      {p.bio}
                    </p>
                    <a
                      href="#"
                      className="font-sans text-[0.65rem] sm:text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-espresso border-b border-espresso/25 pb-px self-start hover:border-terracota hover:text-terracota transition-colors mt-1"
                    >
                      Conhecer →
                    </a>
                  </div>
                </div>
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
              {PRODUCTS.map((product) => (
                <div key={product.id} className="group flex flex-col bg-cream">
                  <div className="aspect-square overflow-hidden">
                    <ImagePlaceholder className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500" />
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

          </div>
        </section>

        {/* ── BANNER ─────────────────────────────────────────────────────────── */}
        <section className="bg-espresso py-16 sm:py-20 lg:py-32">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center flex flex-col items-center gap-6 sm:gap-8">
            <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.35em] uppercase text-cream/35 font-semibold">
              Nossa missão
            </span>
            <blockquote className="font-serif text-[1.5rem] sm:text-4xl lg:text-5xl xl:text-[3.4rem] text-cream font-normal italic leading-[1.2] sm:leading-[1.18]">
              "Cada produto carrega<br className="hidden sm:block" /> uma história única."
            </blockquote>
            <a
              href="#"
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
