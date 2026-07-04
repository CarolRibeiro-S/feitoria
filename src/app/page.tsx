import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import BirthdayCouponBanner from "@/components/ui/BirthdayCouponBanner";

// Conteúdo do hero mobile — centralizado vertical e horizontalmente
const mobileHeroContent = (
  <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm bg-black/35 backdrop-blur-[4px] rounded-2xl p-6 border border-white/10 gap-4">
    <span className="font-sans text-[0.58rem] tracking-widest uppercase text-cream/70 font-semibold drop-shadow-sm">
      Artesanal · Local · Singular
    </span>
    <h1 className="font-serif text-[2rem] text-cream font-normal leading-[1.06] drop-shadow-md">
      Descubra quem faz.
    </h1>
    <p className="font-sans text-[0.82rem] text-cream/80 tracking-wide drop-shadow-sm">
      Pequenos produtores. Grandes histórias.
    </p>
    <div className="flex flex-row gap-3 pt-1 w-full justify-center">
      <a
        href="/produtos"
        className="inline-flex items-center justify-center gap-2 bg-cream text-espresso font-sans text-[0.65rem] font-semibold tracking-[0.15em] uppercase px-4 py-3 hover:bg-sand transition-colors"
      >
        Explorar
        <ArrowRight size={12} />
      </a>
      <a
        href="/produtoras"
        className="inline-flex items-center justify-center gap-2 border border-cream/50 text-cream font-sans text-[0.65rem] font-semibold tracking-[0.15em] uppercase px-4 py-3 hover:border-cream hover:bg-cream/10 transition-colors"
      >
        Produtoras
      </a>
    </div>
  </div>
);

// Conteúdo do hero desktop — posicionado à direita com absolute
const desktopHeroContent = (
  <div className="absolute bottom-8 sm:bottom-auto sm:right-12 lg:right-16 sm:top-1/2 sm:-translate-y-1/2 flex flex-col items-end gap-5 max-w-sm lg:max-w-md text-right bg-black/35 backdrop-blur-[4px] rounded-2xl p-8 border border-white/10">
    <span className="font-sans text-[0.62rem] tracking-widest uppercase text-cream/70 font-semibold drop-shadow-sm">
      Artesanal · Local · Singular
    </span>
    <h1 className="font-serif text-5xl lg:text-[3.6rem] xl:text-[4.2rem] text-cream font-normal leading-[1.06] drop-shadow-md">
      Descubra quem faz.
    </h1>
    <p className="font-sans text-[0.9rem] text-cream/80 tracking-wide drop-shadow-sm">
      Pequenos produtores. Grandes histórias.
    </p>
    <div className="flex flex-row gap-3 pt-1 justify-end">
      <a
        href="/produtos"
        className="inline-flex items-center justify-center gap-2 bg-cream text-espresso font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-6 py-3.5 hover:bg-sand transition-colors"
      >
        Explorar
        <ArrowRight size={12} />
      </a>
      <a
        href="/produtoras"
        className="inline-flex items-center justify-center gap-2 border border-cream/50 text-cream font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-6 py-3.5 hover:border-cream hover:bg-cream/10 transition-colors"
      >
        Produtoras
      </a>
    </div>
  </div>
);

export default function Home() {

  return (
    <div className="bg-cream dark:bg-dark-bg min-h-screen">
      <BirthdayCouponBanner />
      <main>
        {/* ── HERO MOBILE ────────────────────────────────────────────────────── */}
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden sm:hidden">
          <Image
            src="/logo_mobile.jpeg"
            alt="FEITORIA"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
          {mobileHeroContent}
        </section>

        {/* ── HERO DESKTOP ───────────────────────────────────────────────────── */}
        <section className="relative w-full min-h-[100vh] overflow-hidden hidden sm:block">
          <Image
            src="/logo_nova.jpeg"
            alt="FEITORIA"
            fill
            className="object-cover object-[50%_30%] sm:object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          {desktopHeroContent}
        </section>

        {/* ── CATEGORIAS ─────────────────────────────────────────────────────── */}
        <section className="bg-sand dark:bg-dark-surface py-10 lg:py-16">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-lg lg:text-2xl text-espresso dark:text-cream">Explorar por categoria</h2>
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
                  <div className="w-[4.2rem] h-[4.2rem] sm:w-20 sm:h-20 lg:w-full bg-cream dark:bg-dark-bg group-hover:bg-beige/70 dark:group-hover:bg-espresso/40 transition-colors border border-beige/40 dark:border-espresso/40 flex items-center justify-center">
                    <Icon size={24} strokeWidth={1.4} className="text-olive/80 group-hover:text-olive transition-colors" />
                  </div>
                  <span className="font-sans text-[0.65rem] sm:text-[0.68rem] font-medium text-espresso/75 dark:text-cream/75 tracking-wide text-center w-[4.2rem] sm:w-20 lg:w-full leading-tight">
                    {name}
                  </span>
                </a>
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
