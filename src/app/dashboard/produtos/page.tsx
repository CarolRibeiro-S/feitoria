import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1, nome: "Geleia de Damasco com Cardamomo",    categoria: "Empório",     preco: 34.90,  status: "ativo"   },
  { id: 2, nome: "Torta de Lavanda e Limão Siciliano", categoria: "Confeitaria", preco: 89.00,  status: "ativo"   },
  { id: 3, nome: "Pão de Centeio com Nozes",           categoria: "Padaria",     preco: 28.00,  status: "ativo"   },
  { id: 4, nome: "Kit Café da Manhã Especial",         categoria: "Kits",        preco: 145.00, status: "inativo" },
  { id: 5, nome: "Brigadeiro de Pistache (cx 6un)",    categoria: "Confeitaria", preco: 36.00,  status: "ativo"   },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdutosPage() {
  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
            Catálogo
          </p>
          <h1 className="font-serif text-3xl text-espresso font-normal">Meus Produtos</h1>
        </div>
        <Link
          href="/dashboard/produtos/novo"
          className="flex-shrink-0 flex items-center gap-2 bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase px-5 py-3 hover:bg-caramel transition-colors"
        >
          <Plus size={14} />
          Adicionar produto
        </Link>
      </div>

      {/* Table */}
      <div className="border border-sand overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-sand">
              {["Foto", "Nome", "Categoria", "Preço", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-espresso/35 font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => (
              <tr key={p.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/25 transition-colors">

                {/* Foto placeholder */}
                <td className="px-4 py-3">
                  <div className="w-10 h-10 bg-beige flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 64 64" fill="none" className="text-espresso/20">
                      <rect x="8" y="8" width="48" height="48" rx="2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="22" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 44L20 32L30 42L42 28L56 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </td>

                <td className="px-4 py-3 font-sans text-sm text-espresso max-w-[240px]">
                  <span className="block truncate">{p.nome}</span>
                </td>

                <td className="px-4 py-3 font-sans text-xs text-espresso/55 whitespace-nowrap">
                  {p.categoria}
                </td>

                <td className="px-4 py-3 font-sans text-sm text-espresso font-medium whitespace-nowrap">
                  R$ {p.preco.toFixed(2).replace(".", ",")}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {p.status === "ativo" ? (
                    <span className="font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 text-olive bg-olive/8 border border-olive/20">
                      Ativo
                    </span>
                  ) : (
                    <span className="font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 text-espresso/40 bg-sand border border-sand">
                      Inativo
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      title="Editar"
                      className="p-2 text-espresso/35 hover:text-espresso transition-colors"
                    >
                      <Pencil size={14} strokeWidth={1.7} />
                    </button>
                    <button
                      title="Excluir"
                      className="p-2 text-espresso/35 hover:text-wine transition-colors"
                    >
                      <Trash2 size={14} strokeWidth={1.7} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-sans text-xs text-espresso/35">
        {PRODUCTS.filter(p => p.status === "ativo").length} produtos ativos · {PRODUCTS.filter(p => p.status === "inativo").length} inativos
      </p>

    </div>
  );
}
