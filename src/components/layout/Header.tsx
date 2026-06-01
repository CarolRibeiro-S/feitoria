"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";

export function FeitoriaLogo({ light = false }: { light?: boolean }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Feitoria"
      width={320}
      height={120}
      className={`h-16 lg:h-20 w-auto ${light ? "brightness-0 invert" : ""}`}
      priority
    />
  );
}

interface HeaderProps {
  onOpenCart?: () => void;
}

export function Header({ onOpenCart }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-cream/96 backdrop-blur-sm border-b border-sand">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-20 lg:h-28">

          {/* Logo */}
          <a href="/" aria-label="Feitoria">
            <FeitoriaLogo />
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-sans text-[0.78rem] font-medium tracking-wide text-espresso/70 hover:text-espresso transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button aria-label="Buscar" className="hidden sm:flex text-espresso/60 hover:text-espresso transition-colors">
              <Search size={19} />
            </button>
            <button aria-label="Favoritos" className="hidden sm:flex text-espresso/60 hover:text-espresso transition-colors">
              <Heart size={19} />
            </button>
            <button 
              aria-label="Carrinho" 
              className="text-espresso/60 hover:text-espresso transition-colors relative"
              onClick={onOpenCart}
            >
              <ShoppingBag size={19} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-terracota text-cream text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              aria-label="Menu"
              className="lg:hidden text-espresso"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-cream border-t border-sand">
          <nav className="max-w-7xl mx-auto px-5 py-5 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-sm font-medium text-espresso py-3 border-b border-sand/60 last:border-0 tracking-wide"
              >
                {link.name}
              </a>
            ))}
            <div className="flex gap-5 pt-4">
              <button className="text-espresso/60"><Search size={19} /></button>
              <button className="text-espresso/60"><Heart size={19} /></button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
