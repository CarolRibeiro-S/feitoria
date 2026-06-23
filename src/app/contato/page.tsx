"use client";

import { useState } from "react";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData();
    formData.append("_subject", `Contato FEITORIA: ${assunto}`);
    formData.append("nome", nome);
    formData.append("email", email);
    formData.append("assunto", assunto);
    formData.append("mensagem", mensagem);

    try {
      const response = await fetch("https://formspree.io/f/xvzjgdaw", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      if (response.ok) {
        setNome("");
        setEmail("");
        setAssunto("");
        setMensagem("");
        setEnviado(true);
      } else {
        setErro("Não foi possível enviar. Tente novamente ou fale conosco pelo WhatsApp.");
      }
    } catch (err) {
      console.error("Formspree error:", err);
      setErro("Não foi possível enviar. Tente novamente ou fale conosco pelo WhatsApp.");
    } finally {
      setLoading(false);
    }
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
          <div className="text-center py-12 flex flex-col gap-4 border border-sand px-8">
            <p className="font-serif text-2xl text-espresso font-normal">
              Mensagem enviada!
            </p>
            <p className="font-sans text-sm text-espresso/55 leading-relaxed">
              Responderemos em breve.
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
                value={nome}
                onChange={(e) => setNome(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
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
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            {erro && (
              <p className="font-sans text-[0.8rem] text-wine text-center">{erro}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-2 hover:bg-caramel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar mensagem"}
            </button>

          </form>
        )}

      </main>
    </div>
  );
}
