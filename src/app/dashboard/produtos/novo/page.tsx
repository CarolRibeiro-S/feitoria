"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import { supabase } from "@/lib/supabase-client";
import { createProduto } from "@/app/actions/produtos";

const CATEGORIAS = [
  "Pães & Confeitaria",
  "Bebidas & Cafés",
  "Empório",
  "Congelados",
  "Kits",
];

const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";
const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";

export default function NovoProdutoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("");
  const [foto, setFoto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      } else {
        router.push("/login");
      }
    }
    getSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    
    setCarregando(true);

    try {
      await createProduto({
        nome,
        descricao,
        preco: parseFloat(preco),
        categoria,
        foto,
        produtora_id: userId,
      });

      router.push("/dashboard/produtos");
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("Erro ao salvar produto. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-sans text-xs text-espresso/40">
        <Link href="/dashboard/produtos" className="hover:text-espresso transition-colors">
          Meus Produtos
        </Link>
        <ChevronRight size={12} />
        <span className="text-espresso/70">Novo produto</span>
      </nav>

      {/* Header */}
      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
          Catálogo
        </p>
        <h1 className="font-serif text-3xl text-espresso font-normal">Adicionar Produto</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Foto */}
        <div className="flex flex-col gap-2">
          <span className={labelCls}>Foto do produto</span>
          {userId && (
            <ImageUpload
              bucket="produtos"
              path={`${userId}/${Date.now()}_foto.jpg`}
              onUpload={(url) => setFoto(url)}
            />
          )}
        </div>

        {/* Nome */}
        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={labelCls}>Nome do produto</label>
          <input
            id="nome"
            type="text"
            placeholder="Ex: Geleia de Damasco com Cardamomo"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-2">
          <label htmlFor="descricao" className={labelCls}>Descrição</label>
          <textarea
            id="descricao"
            rows={4}
            placeholder="Conte o que torna esse produto especial: ingredientes, processo, história..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Preço + Categoria — grid 2 colunas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="preco" className={labelCls}>Preço (R$)</label>
            <input
              id="preco"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              required
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="categoria" className={labelCls}>Categoria</label>
            <select
              id="categoria"
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="" disabled>Selecionar</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={carregando || !foto}
            className="flex-1 sm:flex-none sm:px-10 bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? "Salvando..." : "Salvar produto"}
          </button>
          <Link
            href="/dashboard/produtos"
            className="flex-1 sm:flex-none sm:px-8 border border-sand text-espresso/60 font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 text-center hover:border-espresso/30 hover:text-espresso transition-colors"
          >
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  );
}
