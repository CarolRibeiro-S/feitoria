"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setCarregando(false);

    if (error) {
      setErro("Não foi possível enviar o email. Tente novamente.");
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-10">

      {/* Logo */}
      <Link href="/" className="self-center opacity-90 hover:opacity-100 transition-opacity">
        <Image
          src="/logo.jpg"
          alt="Feitoria"
          width={320}
          height={120}
          className="h-24 w-auto"
          priority
        />
      </Link>

      {/* Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-serif text-[1.85rem] text-espresso font-normal">
          Recuperar senha
        </h1>
        <p className="font-sans text-[0.8rem] text-espresso/50 tracking-wide">
          Informe seu email para receber o link de redefinição
        </p>
      </div>

      {/* Sucesso */}
      {enviado && (
        <div className="bg-olive/8 border border-olive/20 px-4 py-3">
          <p className="font-sans text-[0.78rem] text-olive font-medium">
            Se esse email existir na nossa base, você receberá um link de recuperação em breve.
          </p>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-wine/8 border border-wine/20 px-4 py-3">
          <p className="font-sans text-[0.78rem] text-wine">{erro}</p>
        </div>
      )}

      {/* Form */}
      {!enviado && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className={labelCls}>E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-1 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
      )}

      <p className="font-sans text-[0.8rem] text-espresso/55 text-center">
        <Link
          href="/login"
          className="text-espresso font-semibold hover:text-terracota transition-colors underline underline-offset-2"
        >
          Voltar para o login
        </Link>
      </p>

    </div>
  );
}
