"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X, User as UserIcon, LogOut, LayoutDashboard, ClipboardList } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";

export function FeitoriaLogo({ light = false }: { light?: boolean }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Feitoria"
      width={320}
      height={120}
      className={`h-12 sm:h-16 lg:h-20 w-auto ${light ? "brightness-0 invert" : ""}`}
      priority
    />
  );
}

interface HeaderProps {
  onOpenCart?: () => void;
}

export function Header({ onOpenCart }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    // Busca usuário atual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = "/"; // Redireciona para a home após logout
  }

  const userTipo = user?.user_metadata?.tipo;
  const panelHref = userTipo === "produtora" ? "/dashboard" : "/pedidos";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-cream/96 backdrop-blur-sm border-b border-sand">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 lg:h-28">

          {/* Logo */}
          <Link href="/" aria-label="Feitoria" className="flex-shrink-0">
            <FeitoriaLogo />
          </Link>

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
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Auth Button/Dropdown (Desktop) */}
            <div className="hidden lg:flex items-center mr-2">
              {!user ? (
                <Link 
                  href="/login"
                  className="font-sans text-[0.78rem] font-medium tracking-wide text-espresso hover:text-terracota border-b border-transparent hover:border-terracota/30 pb-0.5 transition-all"
                >
                  Entrar
                </Link>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 font-sans text-[0.78rem] font-medium text-espresso hover:text-terracota transition-colors px-2 py-1"
                  >
                    <span className="max-w-[120px] truncate">Olá, {user.user_metadata?.nome?.split(" ")[0]}</span>
                    <UserIcon size={16} strokeWidth={1.8} className="text-espresso/40" />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 mt-3 w-48 bg-cream border border-sand shadow-xl py-2 flex flex-col">
                        <Link 
                          href={panelHref}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 font-sans text-[0.78rem] text-espresso/70 hover:text-espresso hover:bg-sand/30 transition-colors"
                        >
                          {userTipo === "produtora" ? <LayoutDashboard size={16} /> : <ClipboardList size={16} />}
                          Meu Painel
                        </Link>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-5 py-3 font-sans text-[0.78rem] text-wine/70 hover:text-wine hover:bg-wine/5 transition-colors text-left"
                        >
                          <LogOut size={16} />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button aria-label="Buscar" className="hidden md:flex text-espresso/60 hover:text-espresso transition-colors p-2">
              <Search size={19} />
            </button>
            <button aria-label="Favoritos" className="hidden md:flex text-espresso/60 hover:text-espresso transition-colors p-2">
              <Heart size={19} />
            </button>
            <button 
              aria-label="Carrinho" 
              className="text-espresso/60 hover:text-espresso transition-colors relative p-2"
              onClick={onOpenCart}
            >
              <ShoppingBag size={19} />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-terracota text-cream text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              aria-label="Menu"
              className="lg:hidden text-espresso p-2"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-cream border-t border-sand absolute w-full shadow-xl">
          <nav className="max-w-7xl mx-auto px-5 py-6 flex flex-col gap-1">
            {/* Auth (Mobile) */}
            <div className="pb-4 mb-4 border-b border-sand/60">
              {!user ? (
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between font-sans text-sm font-semibold text-terracota py-2 tracking-wide"
                >
                  Entrar na conta
                  <span className="text-xs">→</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-beige/40 flex items-center justify-center text-espresso/60">
                      <UserIcon size={16} />
                    </div>
                    <span className="font-sans text-sm font-medium text-espresso">Olá, {user.user_metadata?.nome}</span>
                  </div>
                  <Link 
                    href={panelHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 font-sans text-sm text-espresso/70"
                  >
                    {userTipo === "produtora" ? <LayoutDashboard size={18} /> : <ClipboardList size={18} />}
                    Meu Painel
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-3 py-3 font-sans text-sm text-wine/70 text-left"
                  >
                    <LogOut size={18} />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-sm font-medium text-espresso py-3.5 border-b border-sand/60 last:border-0 tracking-wide flex items-center justify-between"
              >
                {link.name}
                <span className="text-espresso/20 text-xs">→</span>
              </a>
            ))}
            <div className="flex gap-4 pt-6 mt-2">
              <button className="flex items-center gap-2 bg-sand/30 px-4 py-3 text-espresso/70 font-sans text-[0.75rem] flex-1 justify-center">
                <Search size={17} /> Buscar
              </button>
              <button className="flex items-center gap-2 bg-sand/30 px-4 py-3 text-espresso/70 font-sans text-[0.75rem] flex-1 justify-center">
                <Heart size={17} /> Favoritos
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
