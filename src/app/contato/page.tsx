"use client";

import { useState } from "react";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function ContatoPage() {
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    {/* TODO: integrar com Formspree quando disponível */}
    setEnviado(true);
  }

  return (
    <div className="bg-cream min-h-screen">

      {/* Hero */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-16 px-5 sm:px-8 text-center">
        <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-caramel font-semibold">
          Fale com a gente
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-espresso font-normal mt-3 leading-tight">
          Contato
        </h1>
        <div className="w-10 h-px bg-terracota/40 mx-auto mt-8" />
      </section>

      {/* Formulário */}
      <main className="max-w-lg mx-auto px-5 sm:px-8 pb-32">

        {enviado ? (
          <div className="text-center py-12 flex flex-col gap-4">
            <p className="font-serif text-2xl text-espresso font-normal">
              Mensagem enviada!
            </p>
            <p className="font-sans text-sm text-espresso/55">
              Obrigada pelo contato. Retornaremos em breve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label htmlFor="nome" className={labelCls}>Nome</label>
              <input
                id="nome"
                type="text"
                placeholder="Seu nome"
                required
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={labelCls}>E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="assunto" className={labelCls}>Assunto</label>
              <input
                id="assunto"
                type="text"
                placeholder="Sobre o que você quer falar?"
                required
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mensagem" className={labelCls}>Mensagem</label>
              <textarea
                id="mensagem"
                rows={6}
                placeholder="Escreva sua mensagem..."
                required
                className={`${inputCls} resize-none`}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-2 hover:bg-caramel transition-colors"
            >
              Enviar mensagem
            </button>

          </form>
        )}

      </main>
    </div>
  );
}
