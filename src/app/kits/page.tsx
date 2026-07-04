'use client'

import { useState } from 'react'
import { Gift } from 'lucide-react'

export default function KitsPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)

    try {
      const res = await fetch('https://formspree.io/f/xvzjgdaw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Interesse em Kits — FEITORIA',
          nome,
          email,
        }),
      })

      if (res.ok) {
        setEnviado(true)
        setNome('')
        setEmail('')
      } else {
        setErro('Algo deu errado. Tente novamente em instantes.')
      }
    } catch {
      setErro('Algo deu errado. Tente novamente em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-32">
        <div className="flex flex-col items-center text-center gap-8 max-w-lg w-full">

          {/* Eyebrow */}
          <div className="flex flex-col items-center gap-3">
            <Gift size={20} className="text-terracota" strokeWidth={1.5} />
            <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-caramel font-semibold">
              Kits &amp; Presentes
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.2rem] text-espresso font-normal leading-tight">
            Em breve.
          </h1>

          {/* Divider */}
          <div className="w-10 h-px bg-terracota/40" />

          {/* Body text */}
          <div className="flex flex-col gap-3 max-w-sm">
            <p className="font-sans text-[0.92rem] text-espresso/70 leading-relaxed">
              Estamos preparando combinações especiais de produtos artesanais para momentos únicos.
            </p>
            <p className="font-sans text-[0.85rem] text-espresso/50 leading-relaxed">
              Em breve você poderá presentear com o melhor da gastronomia artesanal, em kits
              cuidadosamente curados pela FEITORIA.
            </p>
          </div>

          {/* Form */}
          <div className="w-full max-w-sm mt-2">
            {enviado ? (
              <div className="border border-terracota/30 bg-terracota/5 px-6 py-5">
                <p className="font-sans text-[0.88rem] text-espresso/80 leading-relaxed">
                  Ótimo! Você será um dos primeiros a saber quando os kits estiverem disponíveis.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full border border-espresso/20 bg-transparent px-4 py-3 font-sans text-sm text-espresso placeholder-espresso/35 focus:outline-none focus:border-terracota/60 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-espresso/20 bg-transparent px-4 py-3 font-sans text-sm text-espresso placeholder-espresso/35 focus:outline-none focus:border-terracota/60 transition-colors"
                />
                {erro && (
                  <p className="font-sans text-[0.78rem] text-wine/80 text-left">{erro}</p>
                )}
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-6 py-4 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {enviando ? 'Enviando…' : 'Quero ser avisado'}
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
