export default function NossaHistoriaPage() {
  return (
    <div className="bg-cream min-h-screen">

      {/* Hero */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-20 px-5 sm:px-8 text-center">
        <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-caramel font-semibold">
          Quem somos
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-espresso font-normal mt-3 leading-tight">
          Nossa História
        </h1>
        <div className="w-10 h-px bg-terracota/40 mx-auto mt-8" />
      </section>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-5 sm:px-8 pb-32">
        <p className="font-serif text-lg sm:text-xl text-espresso/40 italic text-center leading-relaxed">
          [Texto sobre a história da FEITORIA será inserido aqui]
        </p>
      </main>

    </div>
  );
}
