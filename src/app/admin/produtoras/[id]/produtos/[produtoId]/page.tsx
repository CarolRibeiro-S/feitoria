"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/ui/ImageUpload";
import { CATEGORIES } from "@/lib/constants";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function EditarProdutoPage() {
  const { id, produtoId } = useParams<{ id: string; produtoId: string }>();
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [nomeProduto, setNomeProduto] = useState("");
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria: CATEGORIES[0].name,
    foto: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (produtoId) fetchProduto();
  }, [produtoId]);

  async function fetchProduto() {
    setPageLoading(true);
    const res = await fetch(`/api/admin/produtos/${produtoId}`);

    if (!res.ok) {
      setNotFound(true);
      setPageLoading(false);
      return;
    }

    const d = await res.json();
    setNomeProduto(d.nome ?? "");
    setForm({
      nome: d.nome ?? "",
      descricao: d.descricao ?? "",
      preco: (d.preco ?? 0).toFixed(2).replace(".", ","),
      categoria: d.categoria ?? CATEGORIES[0].name,
      foto: d.foto ?? "",
    });
    setPageLoading(false);
  }

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
    setSuccessMsg(null);

    const res = await fetch(`/api/admin/produtos/${produtoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco,
        categoria: form.categoria,
        foto: form.foto || null,
      }),
    });

    if (!res.ok) {
      setErrorMsg("Erro ao salvar alterações.");
    } else {
      setNomeProduto(form.nome);
      setSuccessMsg("Alterações salvas.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    setSaving(false);
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <p className="font-serif text-xl text-espresso/30 italic">
          Produto não encontrado.
        </p>
        <Link
          href={`/admin/produtoras/${id}`}
          className="font-sans text-xs tracking-widest uppercase text-caramel hover:text-terracota transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    );
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
            Produto
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-espresso leading-tight">
            {nomeProduto || "—"}
          </h2>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Nome *</label>
          <input type="text" {...field("nome")} className={inputCls} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Descrição</label>
          <textarea
            rows={4}
            {...field("descricao")}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Preço (R$) *</label>
            <input type="text" {...field("preco")} className={inputCls} />
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
            path={produtoId}
            onUpload={(url) => setForm((p) => ({ ...p, foto: url }))}
            defaultValue={form.foto || undefined}
          />
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-sand">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-espresso text-cream font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase px-6 py-3 hover:bg-terracota transition-colors disabled:opacity-50"
          >
            <Save size={13} />
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          {errorMsg && (
            <p className="font-sans text-[0.78rem] text-wine">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="font-sans text-[0.78rem] text-olive">{successMsg}</p>
          )}
        </div>

      </div>
    </div>
  );
}
