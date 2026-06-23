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
      <main className="max-w-2xl mx-auto px-5 sm:px-8 pb-32 flex flex-col gap-6">
        <p className="font-sans text-[0.95rem] sm:text-[1.05rem] text-espresso/75 leading-relaxed text-center sm:text-left">
          A FEITORIA nasce como uma plataforma colaborativa de produtores autorais — reunindo gastronomia artesanal, pequenos negócios e histórias reais em um ambiente cuidadosamente curado.
        </p>
        <p className="font-sans text-[0.95rem] sm:text-[1.05rem] text-espresso/75 leading-relaxed text-center sm:text-left">
          O nome vem de uma palavra antiga da língua portuguesa: <em>feitoria</em>. Historicamente, as feitorias eram pontos de encontro entre produtores e trocas — lugares onde produtos eram produzidos, reunidos, negociados e distribuídos. Resgatamos esse sentido para criar algo novo: um espaço onde quem produz com as próprias mãos encontra visibilidade, e quem compra encontra origem, autoria e conexão.
        </p>
        <p className="font-sans text-[0.95rem] sm:text-[1.05rem] text-espresso/75 leading-relaxed text-center sm:text-left">
          Mais do que um marketplace, a FEITORIA é um ecossistema de descoberta. Cada produto carrega uma história — de quem fez, de como foi feito, do tempo e do cuidado por trás de cada receita. Acreditamos que comprar de pequenos produtores é também uma forma de valorizar quem faz diferente.
        </p>
        <p className="font-sans text-[0.95rem] sm:text-[1.05rem] text-espresso/75 leading-relaxed text-center sm:text-left">
          Por isso, nossa proposta vai além da venda. Queremos contar quem está por trás de cada marca, mostrar os bastidores, a região, a especialidade — e transformar a experiência de compra em uma experiência de conhecer pessoas e suas trajetórias.
        </p>
        <p className="font-serif text-xl sm:text-2xl text-espresso font-normal italic leading-relaxed text-center sm:text-left">
          A FEITORIA é, antes de tudo, um convite: descubra quem faz.
        </p>
      </main>

    </div>
  );
}
