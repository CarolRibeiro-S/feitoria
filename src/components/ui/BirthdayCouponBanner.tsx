'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { verificarCupomAniversario } from '@/app/actions/fidelidade'

export default function BirthdayCouponBanner() {
  const [cupom, setCupom] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const ano = new Date().getFullYear()
    const dismissKey = `feitoria-aniv-dismissed-${ano}`
    if (typeof window !== 'undefined' && localStorage.getItem(dismissKey)) return

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      try {
        const result = await verificarCupomAniversario(user.id)
        if (result) {
          setCupom(result.codigo)
          setVisible(true)
        }
      } catch {
        // Non-critical — silently ignore
      }
    })
  }, [])

  function dismiss() {
    setVisible(false)
    const ano = new Date().getFullYear()
    localStorage.setItem(`feitoria-aniv-dismissed-${ano}`, '1')
  }

  if (!visible || !cupom) return null

  return (
    <div className="bg-espresso text-cream px-5 sm:px-8 py-5 flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1.5 max-w-2xl">
        <p className="font-sans text-[0.58rem] tracking-[0.3em] uppercase text-cream/45 font-semibold">
          Presente FEITORIA
        </p>
        <p className="font-sans text-sm text-cream/85 leading-relaxed">
          Feliz aniversário! Para celebrar esse momento especial, preparamos um cupom de 12% para
          você usar onde mais gosta.{' '}
          <span className="font-semibold text-cream tracking-wide">Código: {cupom}</span>
        </p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-cream/35 hover:text-cream/70 transition-colors mt-0.5"
        aria-label="Fechar"
      >
        <X size={15} strokeWidth={1.8} />
      </button>
    </div>
  )
}
