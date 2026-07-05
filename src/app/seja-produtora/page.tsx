"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

const CATEGORIAS = [
  "Pães & Confeitaria",
  "Bebidas & Cafés",
  "Empório",
  "Congelados",
  "Kits",
  "Outro",
];

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

type FormData = {
  nome_completo: string;
  nome_marca: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  categoria: string;
  descricao_negocio: string;
};

const EMPTY: FormData = {
  nome_completo: "",
  nome_marca: "",
  whatsapp: "",
  email: "",
  cidade: "",
  estado: "",
  categoria: "",
  descricao_negocio: "",
};

export default function SejaProdutoraPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData();
    formData.append("_subject", "Nova solicitação — Seja uma Produtora");
    formData.append("nome_completo", form.nome_completo);
    formData.append("nome_marca", form.nome_marca);
    formData.append("whatsapp", form.whatsapp);
    formData.append("email", form.email);
    formData.append("cidade", form.cidade);
    formData.append("estado", form.estado);
    formData.append("categoria", form.categoria);
    formData.append("descricao_negocio", form.descricao_negocio);

    const [supabaseResult, formspreeResult] = await Promise.allSettled([
      supabase.from("solicitacoes_produtoras").insert([form]),
      fetch("https://formspree.io/f/xvzjgdaw", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      })
    ]);

    let supabaseSuccess = false;
    if (supabaseResult.status === "fulfilled") {
      const { error } = supabaseResult.value;
      if (!error) {
        supabaseSuccess = true;
      } else {
        console.error("Supabase insert error:", error);
      }
    } else {
      console.error("Supabase insert rejected:", supabaseResult.reason);
    }

    let formspreeSuccess = false;
    if (formspreeResult.status === "fulfilled") {
      const res = formspreeResult.value;
      if (res.ok) {
        formspreeSuccess = true;
      } else {
        console.error("Formspree response error:", res.statusText);
      }
    } else {
      console.error("Formspree post rejected:", formspreeResult.reason);
    }

    if (supabaseSuccess || formspreeSuccess) {
      setEnviado(true);
    } else {
      setErro("Algo deu errado. Tente novamente ou entre em contato pelo Instagram.");
    }
    setLoading(false);
  }

  return (
    <div className="bg-cream min-h-screen">

      {/* Hero */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-16 px-5 sm:px-8 text-center">
        <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-caramel font-semibold">
          Faça parte
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-espresso font-normal mt-3 leading-tight">
          Seja uma Produtora FEITORIA
        </h1>
        <p className="font-sans text-[0.88rem] sm:text-[0.92rem] text-espresso/50 mt-5 max-w-md mx-auto leading-relaxed">
          Queremos conhecer sua história e seus produtos antes de tudo. Preencha
          o formulário abaixo e entraremos em contato para conversarmos.
        </p>
        <div className="w-10 h-px bg-terracota/40 mx-auto mt-8" />
      </section>

      {/* Formulário */}
      <main className="max-w-lg mx-auto px-5 sm:px-8 pb-32">

        {enviado ? (
          <div className="text-center py-12 flex flex-col gap-4 border border-sand px-8">
            <p className="font-serif text-2xl text-espresso font-normal">
              Solicitação recebida!
            </p>
            <p className="font-sans text-sm text-espresso/55 leading-relaxed">
              Recebemos sua solicitação! Em breve entraremos em contato pelo
              WhatsApp ou email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Nome completo */}
            <div className="flex flex-col gap-2">
              <label htmlFor="nome_completo" className={labelCls}>Nome completo</label>
              <input
                id="nome_completo"
                type="text"
                placeholder="Seu nome completo"
                required
                value={form.nome_completo}
                onChange={(e) => set("nome_completo", e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Nome da marca */}
            <div className="flex flex-col gap-2">
              <label htmlFor="nome_marca" className={labelCls}>Nome da marca</label>
              <input
                id="nome_marca"
                type="text"
                placeholder="Como se chama sua marca?"
                required
                value={form.nome_marca}
                onChange={(e) => set("nome_marca", e.target.value)}
                className={inputCls}
              />
            </div>

            {/* WhatsApp + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="whatsapp" className={labelCls}>WhatsApp</label>
                <input
                  id="whatsapp"
                  type="tel"
                  placeholder="(61) 99999-9999"
                  required
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className={labelCls}>E-mail</label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Cidade + Estado */}
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="cidade" className={labelCls}>Cidade</label>
                <input
                  id="cidade"
                  type="text"
                  placeholder="Brasília"
                  value={form.cidade}
                  onChange={(e) => set("cidade", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="estado" className={labelCls}>Estado</label>
                <input
                  id="estado"
                  type="text"
                  placeholder="DF"
                  maxLength={2}
                  value={form.estado}
                  onChange={(e) => set("estado", e.target.value.toUpperCase())}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="flex flex-col gap-2">
              <label htmlFor="categoria" className={labelCls}>Categoria principal</label>
              <select
                id="categoria"
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
                className={`${inputCls} appearance-none cursor-pointer`}
              >
                <option value="" disabled>Selecione uma categoria</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-2">
              <label htmlFor="descricao_negocio" className={labelCls}>
                Sobre você e seus produtos
              </label>
              <textarea
                id="descricao_negocio"
                rows={5}
                placeholder="Conte um pouco sobre você e seus produtos"
                value={form.descricao_negocio}
                onChange={(e) => set("descricao_negocio", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            {erro && (
              <p className="font-sans text-[0.8rem] text-wine text-center">{erro}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-2 hover:bg-caramel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar solicitação"}
            </button>

          </form>
        )}

      </main>
    </div>
  );
}
