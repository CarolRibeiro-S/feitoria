"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import { getUserTipo } from "@/lib/user-tipo";
import { User } from "@supabase/supabase-js";

// Mantido para uso no Footer
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userTipo, setUserTipo] = useState<string | null>(null);
  const { totalItems } = useCart();

  async function loadTipo(u: User | null) {
    setUserTipo(u ? await getUserTipo(supabase, u.id) : null);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      loadTipo(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        loadTipo(u);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = "/";
  }

  const panelHref = userTipo === "produtora" ? "/dashboard" : "/pedidos";
  const firstName = user?.user_metadata?.nome?.split(" ")[0];

  return (
    <>
      {/* ── HEADER BAR ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-cream border-b border-sand">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 lg:px-8">

          {/* LEFT — hamburger */}
          <div className="flex-1 flex items-center">
            <button
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
              className="text-espresso/65 hover:text-espresso transition-colors p-1 -ml-1"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* CENTER — logo */}
          <Link href="/" aria-label="Feitoria" className="flex items-center justify-center h-full">
            <Image
              src="/logo_topo.jpeg"
              alt="FEITORIA"
              width={160}
              height={50}
              className="w-[120px] sm:w-[160px] h-auto object-contain -translate-x-8 sm:-translate-x-10"
              priority
            />
          </Link>

          {/* RIGHT — icons + auth */}
          <div className="flex-1 flex items-center justify-end gap-0.5 sm:gap-1">

            <button aria-label="Buscar" className="text-espresso/65 hover:text-espresso transition-colors p-2">
              <Search size={20} strokeWidth={1.5} />
            </button>

            <button aria-label="Favoritos" className="text-espresso/65 hover:text-espresso transition-colors p-2">
              <Heart size={20} strokeWidth={1.5} />
            </button>

            <button
              aria-label="Carrinho"
              onClick={onOpenCart}
              className="text-espresso/65 hover:text-espresso transition-colors p-2 relative"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-terracota text-cream text-[0.55rem] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {totalItems}
                </span>
              )}
            </button>

            {!user ? (
              <Link
                href="/login"
                className="font-sans text-[0.73rem] font-medium text-espresso/65 hover:text-espresso transition-colors ml-2 whitespace-nowrap"
              >
                Entrar
              </Link>
            ) : (
              <div className="relative ml-1">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 font-sans text-[0.73rem] font-medium text-espresso hover:text-caramel transition-colors py-1.5 px-1"
                >
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">Olá, {firstName}</span>
                  <UserIcon size={15} strokeWidth={1.8} className="text-espresso/40 flex-shrink-0" />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-cream border border-sand shadow-lg py-1.5 flex flex-col">
                      <Link
                        href={panelHref}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-[0.75rem] text-espresso/70 hover:text-espresso hover:bg-sand/30 transition-colors"
                      >
                        {userTipo === "produtora"
                          ? <LayoutDashboard size={14} strokeWidth={1.6} />
                          : <ClipboardList size={14} strokeWidth={1.6} />
                        }
                        Meu painel
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-[0.75rem] text-wine/70 hover:text-wine hover:bg-wine/5 transition-colors text-left"
                      >
                        <LogOut size={14} strokeWidth={1.6} />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── DRAWER OVERLAY ─────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 bg-espresso/40 z-[60] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── DRAWER PANEL ───────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-cream z-[70] flex flex-col transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer top — FEITORIA + close */}
        <div className="flex items-center justify-between px-6 h-14 sm:h-16 border-b border-sand flex-shrink-0">
          <span className="font-serif text-base tracking-[0.2em] uppercase text-espresso">
            Feitoria
          </span>
          <button
            aria-label="Fechar menu"
            onClick={() => setDrawerOpen(false)}
            className="text-espresso/50 hover:text-espresso transition-colors p-1 -mr-1"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className="font-serif text-xl text-espresso hover:text-caramel transition-colors py-4 border-b border-sand/50 last:border-0 leading-tight"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Drawer footer — Seja uma Produtora */}
        <div className="px-6 py-7 border-t border-sand flex-shrink-0">
          <a
            href="/seja-produtora"
            onClick={() => setDrawerOpen(false)}
            className="font-sans text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-terracota hover:text-caramel transition-colors"
          >
            Seja uma Produtora →
          </a>
        </div>
      </div>
    </>
  );
}
