"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, ShoppingBag, Plus, Minus, Trash2, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import { mergeCrossSellHints } from "@/lib/cross-sell-map";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrossSellProduct = {
  id: string;
  nome: string;
  preco: number;
  foto: string | null;
  categoria: string;
  produtoras: { nome_marca: string };
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, subtotal, updateQuantity, removeItem, addItem } = useCart();

  const [crossSellItems, setCrossSellItems] = useState<CrossSellProduct[]>([]);
  const prevKeyRef = useRef<string>("");

  // Stable key representing current cart contents
  const cartKey = useMemo(
    () => items.map((i) => i.id).sort().join(","),
    [items]
  );

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setCrossSellItems([]);
      return;
    }
    if (cartKey === prevKeyRef.current) return;
    prevKeyRef.current = cartKey;

    async function fetchCrossSell() {
      const cartIds = items.map((i) => i.id);

      // Use categoria stored in CartItem; fallback to Supabase lookup for old cart items
      let itemsWithCat: { name: string; categoria: string }[] = items
        .filter((i) => !!i.categoria)
        .map((i) => ({ name: i.name, categoria: i.categoria! }));

      if (itemsWithCat.length === 0) {
        const { data: productMeta } = await supabase
          .from("produtos")
          .select("id, nome, categoria")
          .in("id", cartIds);

        if (!productMeta || productMeta.length === 0) {
          console.log("[CrossSell] Sem meta de produto para IDs:", cartIds);
          return;
        }
        const metaMap = new Map(
          productMeta.map((p) => [p.id, { name: p.nome, categoria: p.categoria }])
        );
        itemsWithCat = cartIds
          .map((id) => metaMap.get(id))
          .filter(Boolean) as { name: string; categoria: string }[];
      }

      console.log("[CrossSell] Itens no carrinho com categoria:", itemsWithCat);

      const { categories, priorityFilter } = mergeCrossSellHints(itemsWithCat);
      console.log("[CrossSell] Categorias sugeridas:", categories, "| Filtro prioritário:", priorityFilter);

      if (categories.length === 0) {
        console.log("[CrossSell] crossSellMap não cobre as categorias:", itemsWithCat.map((i) => i.categoria));
        return;
      }

      const { data: candidates } = await supabase
        .from("produtos")
        .select("id, nome, preco, foto, categoria, produtoras(nome_marca)")
        .in("categoria", categories)
        .eq("disponivel", true)
        .limit(9);

      console.log("[CrossSell] Candidatos do banco:", candidates?.length, "| categorias:", categories);

      if (!candidates) return;

      const cartIdSet = new Set(cartIds);
      let filtered = candidates.filter((p) => !cartIdSet.has(p.id));

      if (priorityFilter) {
        const pf = priorityFilter.toLowerCase();
        filtered = [
          ...filtered.filter((p) => p.nome.toLowerCase().includes(pf)),
          ...filtered.filter((p) => !p.nome.toLowerCase().includes(pf)),
        ];
      }

      const result = filtered.slice(0, 3) as unknown as CrossSellProduct[];
      console.log("[CrossSell] Sugestões finais:", result.map((p) => p.nome));
      setCrossSellItems(result);
    }

    fetchCrossSell();
  }, [isOpen, cartKey]);

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

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 scrollbar-hide">
            {items.length > 0 ? (
              <>
                {/* ── Cart items ───────────────────────────────────────── */}
                {items.map((item) => (
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
                        <Link
                          href={`/produtos/${item.id}`}
                          onClick={onClose}
                          className="font-sans text-[0.8rem] sm:text-[0.85rem] font-medium text-espresso leading-tight hover:underline underline-offset-2 decoration-espresso/30"
                        >
                          {item.name}
                        </Link>
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
                ))}

                {/* ── Cross-sell suggestions ───────────────────────────── */}
                {crossSellItems.length > 0 && (
                  <div className="border-t border-sand pt-6 -mx-0">
                    <p className="font-sans text-[0.58rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-4">
                      Você também pode gostar
                    </p>
                    <div className="flex flex-col gap-3">
                      {crossSellItems.map((produto) => (
                        <div
                          key={produto.id}
                          className="flex items-center gap-3 bg-sand/20 p-3 border border-sand/60"
                        >
                          {/* Thumbnail */}
                          <Link
                            href={`/produtos/${produto.id}`}
                            onClick={onClose}
                            className="flex-shrink-0"
                          >
                            <div className="w-12 h-12 bg-beige overflow-hidden relative flex items-center justify-center">
                              {produto.foto ? (
                                <Image
                                  src={produto.foto}
                                  alt={produto.nome}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : (
                                <ImageIcon size={14} className="text-espresso/20" />
                              )}
                            </div>
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/produtos/${produto.id}`}
                              onClick={onClose}
                              className="font-sans text-[0.75rem] font-medium text-espresso leading-snug line-clamp-2 hover:text-terracota transition-colors block"
                            >
                              {produto.nome}
                            </Link>
                            <p className="font-sans text-[0.63rem] text-espresso/40 mt-0.5 truncate">
                              {produto.produtoras.nome_marca}
                            </p>
                          </div>

                          {/* Price + add */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-serif text-[0.82rem] text-espresso">
                              R$ {produto.preco.toFixed(2).replace(".", ",")}
                            </span>
                            <button
                              onClick={() =>
                                addItem({
                                  id: produto.id,
                                  name: produto.nome,
                                  producer: produto.produtoras.nome_marca,
                                  price: produto.preco,
                                  quantity: 1,
                                  image: produto.foto,
                                  categoria: produto.categoria,
                                })
                              }
                              aria-label={`Adicionar ${produto.nome} ao carrinho`}
                              className="w-7 h-7 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors flex-shrink-0"
                            >
                              <Plus size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
              <div className="flex flex-col gap-2 mb-5 sm:mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.7rem] sm:text-[0.75rem] text-espresso/50">
                    Subtotal
                  </span>
                  <span className="font-serif text-base sm:text-lg text-espresso">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[0.7rem] sm:text-[0.75rem] text-espresso/50">
                    Frete
                  </span>
                  <span className="font-sans text-[0.72rem] text-espresso/40 italic">
                    A calcular
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-sand">
                  <span className="font-sans text-[0.7rem] sm:text-[0.75rem] tracking-[0.2em] uppercase text-espresso/70 font-semibold">
                    Total estimado
                  </span>
                  <span className="font-serif text-xl sm:text-2xl text-espresso">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
              {subtotal < 45 && (
                <p className="font-sans text-[0.68rem] text-wine/80 border border-wine/20 bg-wine/5 px-3 py-2.5 leading-relaxed mb-1">
                  Pedido mínimo de R$ 45,00. Faltam R${" "}
                  {(45 - subtotal).toFixed(2).replace(".", ",")} para continuar.
                </p>
              )}
              <button
                onClick={handleCheckout}
                disabled={subtotal < 45}
                className="w-full h-12 sm:h-14 bg-terracota text-cream font-sans text-[0.7rem] sm:text-[0.75rem] font-semibold tracking-[0.2em] uppercase hover:bg-caramel transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-terracota"
              >
                Finalizar Pedido
              </button>
              <p className="text-center font-sans text-[0.6rem] sm:text-[0.65rem] text-espresso/30 mt-4 leading-relaxed px-4">
                Frete calculado ao finalizar o pedido.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
