"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Archive,
  ClipboardList,
  TrendingUp,
  BarChart2,
  Store,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const NAV = [
  { label: "Visão Geral",    href: "/dashboard",          icon: LayoutDashboard },
  { label: "Meus Produtos",  href: "/dashboard/produtos",  icon: Package         },
  { label: "Estoque",        href: "/dashboard/estoque",   icon: Archive         },
  { label: "Pedidos",        href: "/dashboard/pedidos",   icon: ClipboardList   },
  { label: "Vendas",         href: "/dashboard/vendas",    icon: TrendingUp      },
  { label: "Analytics",      href: "/dashboard/analytics", icon: BarChart2       },
  { label: "Perfil da Marca",href: "/dashboard/perfil",    icon: Store           },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          className="fixed inset-0 bg-espresso/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-56 bg-espresso flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 flex-shrink-0">
          <Link href="/">
            <Image
              src="/logo.jpg"
              alt="Feitoria"
              width={200}
              height={80}
              className="h-7 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-cream/40 hover:text-cream transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 transition-colors
                  font-sans text-[0.76rem] font-medium tracking-wide
                  ${active
                    ? "bg-caramel/20 text-cream border-l-2 border-caramel"
                    : "text-cream/45 hover:bg-white/5 hover:text-cream/75 border-l-2 border-transparent"
                  }
                `}
              >
                <Icon size={15} strokeWidth={1.7} className={`flex-shrink-0 ${active ? "text-caramel" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 flex-shrink-0 border-t border-white/8 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-cream/35 hover:text-cream/65 transition-colors font-sans text-[0.76rem] font-medium tracking-wide"
          >
            <LogOut size={15} strokeWidth={1.7} />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-4 px-5 h-14 bg-cream border-b border-sand flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-espresso/55 hover:text-espresso transition-colors"
          >
            <Menu size={20} />
          </button>
          <Image
            src="/logo.jpg"
            alt="Feitoria"
            width={200}
            height={80}
            className="h-6 w-auto"
          />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
