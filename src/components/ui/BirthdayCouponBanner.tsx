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
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2"
      style={{ backgroundColor: '#C55A3A' }}
    >
      <p className="font-sans text-xs text-cream/90 leading-none text-center flex-1">
        <span className="font-semibold text-cream">Feliz aniversário!</span>
        {' '}Seu cupom de 12%:{' '}
        <span
          className="font-semibold tracking-widest text-cream"
          style={{ letterSpacing: '0.12em' }}
        >
          {cupom}
        </span>
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-cream/50 hover:text-cream transition-colors"
        aria-label="Fechar"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
