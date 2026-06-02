"use client";

import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useCart } from "@/lib/cart-context";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  function handleCheckout() {
    onClose();
    router.push("/checkout");
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-espresso/40 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-cream z-[70] shadow-2xl transform transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-sand">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-espresso" />
              <h2 className="font-serif text-lg sm:text-xl text-espresso">Seu Carrinho</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-sand/50 rounded-full transition-colors text-espresso/40 hover:text-espresso"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-hide">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sand flex-shrink-0 overflow-hidden relative">
                    <ImagePlaceholder className="w-full h-full" />
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-terracota opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-sans text-[0.8rem] sm:text-[0.85rem] font-medium text-espresso leading-tight">
                        {item.name}
                      </h3>
                      <p className="font-sans text-[0.7rem] sm:text-[0.72rem] text-espresso/40 mt-1">
                        por {item.producer}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-espresso/10 bg-sand/20 h-7 sm:h-8">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 sm:w-7 h-full flex items-center justify-center text-espresso/30 hover:text-espresso"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-5 sm:w-6 text-center font-sans text-[0.7rem] sm:text-[0.75rem] text-espresso">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 sm:w-7 h-full flex items-center justify-center text-espresso/30 hover:text-espresso"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="font-serif text-[0.8rem] sm:text-sm text-espresso">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <ShoppingBag size={40} className="text-espresso/10" />
                <p className="font-serif text-lg text-espresso/40 italic">
                  Seu carrinho está vazio.
                </p>
                <button 
                  onClick={onClose}
                  className="text-caramel font-sans text-[0.75rem] tracking-[0.2em] uppercase font-semibold underline underline-offset-4"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 bg-sand/30 border-t border-sand">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <span className="font-sans text-[0.7rem] sm:text-[0.75rem] tracking-[0.2em] uppercase text-espresso/50 font-semibold">
                  Subtotal
                </span>
                <span className="font-serif text-xl sm:text-2xl text-espresso">
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full h-12 sm:h-14 bg-terracota text-cream font-sans text-[0.7rem] sm:text-[0.75rem] font-semibold tracking-[0.2em] uppercase hover:bg-caramel transition-colors flex items-center justify-center gap-3"
              >
                Finalizar Pedido
              </button>
              <p className="text-center font-sans text-[0.6rem] sm:text-[0.65rem] text-espresso/30 mt-4 leading-relaxed px-4">
                Frete e descontos serão calculados na próxima etapa.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
