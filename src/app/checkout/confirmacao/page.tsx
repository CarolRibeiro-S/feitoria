"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { CartItem } from "@/lib/cart-context";

type OrderSummary = {
  numero: string;
  items: CartItem[];
  subtotal: number;
  frete: number;
  total: number;
};

function fmt(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function ConfirmacaoPage() {
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("feitoria-last-order");
      if (raw) {
        setOrder(JSON.parse(raw));
        localStorage.removeItem("feitoria-last-order");
      }
    } catch {
      // Dados indisponíveis — mostra confirmação genérica
    }
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-14 lg:py-20 flex flex-col gap-10">

        {/* Success message */}
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 bg-olive/10 border border-olive/25 flex items-center justify-center">
            <CheckCircle size={28} strokeWidth={1.4} className="text-olive" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold">
              Confirmado
            </p>
            <h1 className="font-serif text-3xl lg:text-4xl text-espresso font-normal">
              Pedido realizado com sucesso!
            </h1>
            {order?.numero && (
              <p className="font-sans text-sm text-espresso/55 mt-1">
                Número do pedido:{" "}
                <span className="font-semibold text-espresso">{order.numero}</span>
              </p>
            )}
          </div>
          <p className="font-sans text-sm text-espresso/55 leading-relaxed max-w-md">
            Você receberá um e-mail com os detalhes do pedido e as próximas etapas. Obrigada por comprar na Feitoria.
          </p>
        </div>

        {/* Order summary */}
        {order && order.items.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-serif text-lg text-espresso font-normal">O que você pediu</h2>

            <div className="border border-sand">
              <div className="flex flex-col divide-y divide-sand">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 bg-beige flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-espresso font-medium leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="font-sans text-xs text-espresso/45">{item.producer}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-sans text-sm text-espresso font-medium">
                        R$ {fmt(item.price * item.quantity)}
                      </p>
                      <p className="font-sans text-xs text-espresso/40">× {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-sand px-5 py-3 flex flex-col gap-2 bg-sand/20">
                <div className="flex justify-between">
                  <span className="font-sans text-xs text-espresso/55">Subtotal</span>
                  <span className="font-sans text-xs text-espresso">R$ {fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-xs text-espresso/55">Frete</span>
                  <span className={`font-sans text-xs ${order.frete === 0 ? "text-olive" : "text-espresso"}`}>
                    {order.frete === 0 ? "Grátis" : `R$ ${fmt(order.frete)}`}
                  </span>
                </div>
              </div>
              <div className="border-t border-sand px-5 py-3 flex justify-between items-center">
                <span className="font-sans text-sm text-espresso font-semibold">Total pago</span>
                <span className="font-serif text-xl text-espresso">R$ {fmt(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/produtos"
            className="flex-1 text-center bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase px-6 py-4 hover:bg-caramel transition-colors"
          >
            Continuar comprando
          </Link>
          <Link
            href="/pedidos"
            className="flex-1 text-center border border-espresso/25 text-espresso font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase px-6 py-4 hover:border-espresso/50 transition-colors"
          >
            Ver meus pedidos
          </Link>
        </div>

      </div>
    </div>
  );
}
