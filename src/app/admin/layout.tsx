"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ClipboardList,
  Calculator,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const ADMIN_NAV = [
  { label: "Visão Geral",   href: "/admin",              icon: LayoutDashboard },
  { label: "Produtoras",    href: "/admin/produtoras",   icon: Users           },
  { label: "Clientes",      href: "/admin/clientes",     icon: UserCheck       },
  { label: "Pedidos",       href: "/admin/pedidos",      icon: ShoppingBag     },
  { label: "Financeiro",    href: "/admin/financeiro",   icon: BarChart3       },
  { label: "Simulador",     href: "/admin/simulador",    icon: Calculator      },
  { label: "Solicitações",  href: "/admin/solicitacoes", icon: ClipboardList   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cream">

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-espresso/40 z-[60] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[70] w-64 bg-espresso flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Brand/Logo */}
        <div className="flex flex-col px-7 py-9 border-b border-white/5 flex-shrink-0 gap-5">
          <Link href="/">
            <Image
              src="/logo.jpg"
              alt="Feitoria"
              width={200}
              height={80}
              className="h-7 w-auto brightness-0 invert opacity-90"
            />
          </Link>
          <div className="flex items-center gap-2.5 text-olive font-sans text-[0.62rem] tracking-[0.25em] uppercase font-bold">
            <ShieldCheck size={13} className="text-olive/80" />
            Administração
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 px-4 py-8 overflow-y-auto scrollbar-hide">
          {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3.5 transition-all duration-200
                  font-sans text-[0.78rem] font-medium tracking-wide
                  ${active
                    ? "bg-white/10 text-cream"
                    : "text-cream/45 hover:bg-white/5 hover:text-cream/80"
                  }
                `}
              >
                <Icon size={16} strokeWidth={1.8} className={active ? "text-olive" : "text-inherit"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 pb-8 flex-shrink-0 border-t border-white/5 pt-6 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 text-cream/35 hover:text-cream/70 transition-colors font-sans text-[0.78rem] font-medium tracking-wide"
          >
            <LogOut size={16} strokeWidth={1.8} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header Bar */}
        <header className="flex items-center justify-between px-6 lg:px-10 h-20 bg-cream border-b border-sand flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-espresso/60 hover:text-espresso transition-colors"
          >
            <Menu size={22} />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="font-serif text-xl text-espresso/80">
              {ADMIN_NAV.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.label || 'Visão Geral'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-sans text-[0.75rem] font-bold text-espresso tracking-tight">Administrador</span>
              <span className="font-sans text-[0.65rem] text-espresso/40">admin@feitoria.com.br</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center text-espresso font-serif text-sm border border-sand-dark/10">
              AD
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-sand/15">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-12">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
