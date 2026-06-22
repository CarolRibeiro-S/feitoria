"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const FAQS = [
  {
    pergunta: "Os produtos da FEITORIA têm conservantes?",
    resposta:
      "Não. Todos os produtos comercializados na FEITORIA são artesanais, produzidos sem conservantes ou aditivos industriais. Por isso, têm prazo de validade mais curto do que produtos industrializados — o que é um sinal de que são feitos de verdade. Recomendamos consumir dentro do prazo indicado por cada produtora e seguir as orientações de armazenamento de cada item.",
  },
  {
    pergunta: "Por que cada produto pode ser um pouco diferente do outro?",
    resposta:
      "Porque são feitos à mão. Pequenas variações de aparência, tamanho e textura são naturais e fazem parte da autenticidade do produto artesanal — cada peça é única. Diferente de um item de fábrica padronizado, o produto artesanal carrega marcas do processo manual e do cuidado de quem o faz. Isso não é um defeito; é o que o torna especial.",
  },
  {
    pergunta: "Qual o prazo de validade dos produtos?",
    resposta:
      "Varia de acordo com cada produtora e tipo de produto. A informação específica está descrita na página de cada item. Como não há conservantes, recomendamos consumir o quanto antes após o recebimento e armazenar conforme as instruções da produtora — geladeira, temperatura ambiente ou freezer, dependendo do produto.",
  },
  {
    pergunta: "Como funciona a entrega ou retirada?",
    resposta:
      "No momento do checkout, você escolhe entre duas opções: receber o pedido em casa — com cálculo de frete pelo seu CEP — ou retirar diretamente com a produtora, conforme a disponibilidade informada por ela. As datas e horários disponíveis para retirada são exibidos durante o processo de compra.",
  },
  {
    pergunta: "As produtoras da FEITORIA são verificadas?",
    resposta:
      "Sim. Cada produtora passa por uma curadoria antes de ser aprovada na plataforma. Avaliamos os produtos, a forma de produção e o alinhamento com os valores da FEITORIA — autenticidade, cuidado e qualidade. Nosso objetivo é garantir que o que você encontra aqui reflita o mesmo padrão que esperaríamos para nós mesmas.",
  },
];

function AccordionItem({
  pergunta,
  resposta,
  aberto,
  onToggle,
}: {
  pergunta: string;
  resposta: string;
  aberto: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-sand last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-6 py-6 text-left group"
        aria-expanded={aberto}
      >
        <span
          className={`font-serif text-lg sm:text-xl leading-snug transition-colors ${
            aberto ? "text-espresso" : "text-espresso/75 group-hover:text-espresso"
          }`}
        >
          {pergunta}
        </span>
        <span
          className={`flex-shrink-0 mt-1 w-6 h-6 flex items-center justify-center border transition-colors ${
            aberto
              ? "border-terracota text-terracota"
              : "border-espresso/20 text-espresso/35 group-hover:border-espresso/40 group-hover:text-espresso/55"
          }`}
        >
          {aberto ? <X size={13} strokeWidth={2} /> : <Plus size={13} strokeWidth={2} />}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          aberto ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="font-sans text-[0.9rem] sm:text-[0.95rem] text-espresso/60 leading-relaxed pb-6">
          {resposta}
        </p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [aberto, setAberto] = useState<number | null>(null);

  function toggle(i: number) {
    setAberto((prev) => (prev === i ? null : i));
  }

  return (
    <div className="bg-cream min-h-screen">

      {/* Hero */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-16 px-5 sm:px-8 text-center">
        <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-caramel font-semibold">
          Dúvidas
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-espresso font-normal mt-3 leading-tight">
          Perguntas Frequentes
        </h1>
        <p className="font-sans text-[0.88rem] sm:text-[0.92rem] text-espresso/50 mt-5 max-w-sm mx-auto leading-relaxed">
          Tudo o que você precisa saber sobre nossos produtos artesanais
        </p>
        <div className="w-10 h-px bg-terracota/40 mx-auto mt-8" />
      </section>

      {/* Accordion */}
      <main className="max-w-2xl mx-auto px-5 sm:px-8 pb-32">
        {FAQS.map((faq, i) => (
          <AccordionItem
            key={i}
            pergunta={faq.pergunta}
            resposta={faq.resposta}
            aberto={aberto === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </main>

    </div>
  );
}
