"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/ui/ImageUpload";
import { CATEGORIES } from "@/lib/constants";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function NovoProdutoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [uploadPath] = useState(() => `novo-${Date.now()}`);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria: CATEGORIES[0].name,
    foto: "",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function field(
    key: keyof typeof form
  ): {
    value: string;
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => void;
  } {
    return {
      value: form[key],
      onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setErrorMsg("Nome é obrigatório.");
      return;
    }
    const preco = parseFloat(form.preco.replace(",", "."));
    if (isNaN(preco) || preco <= 0) {
      setErrorMsg("Preço inválido.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    const res = await fetch("/api/admin/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco,
        categoria: form.categoria,
        foto: form.foto || null,
        produtora_id: id,
        disponivel: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro desconhecido." }));
      setErrorMsg(err.error ?? "Erro ao salvar produto.");
      setSaving(false);
      return;
    }

    router.push(`/admin/produtoras/${id}`);
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">

      {/* Header */}
      <div className="flex items-center gap-5">
        <Link
          href={`/admin/produtoras/${id}`}
          className="text-espresso/35 hover:text-espresso transition-colors p-1 -ml-1"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <div>
          <p className="font-sans text-[0.58rem] tracking-[0.28em] uppercase text-espresso/35 font-semibold">
            Novo produto
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-espresso leading-tight">
            Adicionar
          </h2>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Nome *</label>
          <input
            type="text"
            placeholder="Nome do produto"
            {...field("nome")}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Descrição</label>
          <textarea
            rows={4}
            placeholder="Descreva o produto..."
            {...field("descricao")}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Preço (R$) *</label>
            <input
              type="text"
              placeholder="0,00"
              {...field("preco")}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Categoria *</label>
            <select
              {...field("categoria")}
              className={`${inputCls} bg-cream cursor-pointer`}
            >
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Foto do produto</label>
          <ImageUpload
            bucket="produtos"
            path={uploadPath}
            onUpload={(url) => setForm((p) => ({ ...p, foto: url }))}
          />
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-sand">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-espresso text-cream font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase px-6 py-3 hover:bg-terracota transition-colors disabled:opacity-50"
          >
            <Save size={13} />
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
          {errorMsg && (
            <p className="font-sans text-[0.78rem] text-wine">{errorMsg}</p>
          )}
        </div>

      </div>
    </div>
  );
}
