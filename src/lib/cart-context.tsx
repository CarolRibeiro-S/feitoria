"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";

export interface CartItem {
  id: string;
  name: string;
  producer: string;
  price: number;
  quantity: number;
  image?: string | null;
  categoria?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Refs so event handlers and timers always see the latest values
  const itemsRef = useRef<CartItem[]>([]);
  const userIdRef = useRef<string | null>(null);
  const userEmailRef = useRef<string | null>(null);
  const anonIdRef = useRef<string>("");
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("feitoria-cart");
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)); } catch { /* corrupt data */ }
    }
    // Anon session id — stable across page loads for the same browser
    let anonId = localStorage.getItem("feitoria-anon-id");
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem("feitoria-anon-id", anonId);
    }
    anonIdRef.current = anonId;
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem("feitoria-cart", JSON.stringify(items));
  }, [items]);

  // Track logged-in user for abandoned cart attribution
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      userIdRef.current = user?.id ?? null;
      userEmailRef.current = user?.email ?? null;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      userIdRef.current = session?.user?.id ?? null;
      userEmailRef.current = session?.user?.email ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  // Build the payload for the abandoned-cart API
  function buildAbandonedPayload() {
    const currentItems = itemsRef.current;
    const valorTotal = currentItems.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      usuario_id: userIdRef.current,
      session_id: userIdRef.current ? null : anonIdRef.current,
      email: userEmailRef.current,
      itens: currentItems.map((i) => ({
        id: i.id,
        nome: i.name,
        produtor: i.producer,
        quantidade: i.quantity,
        preco: i.price,
      })),
      valor_total: valorTotal,
    };
  }

  // POST to the server — fire-and-forget, errors are non-critical
  async function saveAbandonedCart() {
    if (itemsRef.current.length === 0) return;
    try {
      await fetch("/api/carrinhos-abandonados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAbandonedPayload()),
      });
    } catch { /* network failure — non-critical */ }
  }

  // Reset 5-min inactivity timer whenever items change
  useEffect(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (items.length > 0) {
      inactivityTimer.current = setTimeout(saveAbandonedCart, INACTIVITY_MS);
    }
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // sendBeacon on tab close — works reliably in beforeunload
  useEffect(() => {
    function handleBeforeUnload() {
      if (itemsRef.current.length === 0) return;
      const payload = JSON.stringify(buildAbandonedPayload());
      navigator.sendBeacon(
        "/api/carrinhos-abandonados",
        new Blob([payload], { type: "application/json" })
      );
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === newItem.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prevItems, newItem];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems((prevItems) =>
      prevItems.map((item) => item.id === id ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => { setItems([]); };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
