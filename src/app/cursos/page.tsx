import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CursosPage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-32">
        <div className="flex flex-col items-center text-center gap-6 max-w-lg">

          <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-caramel font-semibold">
            Cursos
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-espresso font-normal leading-tight">
            Em breve.
          </h1>

          <p className="font-sans text-[0.9rem] sm:text-[0.95rem] text-espresso/55 leading-relaxed max-w-sm">
            Estamos preparando cursos únicos para você se conectar ainda mais com quem produz.
          </p>

          <div className="w-10 h-px bg-terracota/40 my-2" />

          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-7 py-4 hover:bg-caramel transition-colors mt-2"
          >
            Explorar Produtos
            <ArrowRight size={13} />
          </Link>

        </div>
      </main>
    </div>
  );
}
