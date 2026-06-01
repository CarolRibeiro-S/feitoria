"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error || !data.user) {
      setErro("E-mail ou senha incorretos. Verifique e tente novamente.");
      setCarregando(false);
      return;
    }

    // Usa user_metadata.tipo definido no cadastro para evitar query extra
    const tipo = data.user.user_metadata?.tipo;
    router.push(tipo === "produtora" ? "/dashboard" : "/");
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
          Bem-vinda de volta
        </h1>
        <p className="font-sans text-[0.8rem] text-espresso/50 tracking-wide">
          Entre na sua conta para continuar
        </p>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <div className="bg-wine/8 border border-wine/20 px-4 py-3">
          <p className="font-sans text-[0.78rem] text-wine">{erro}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelCls}>
            E-mail
          </label>
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

        {/* Senha */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="senha" className={labelCls}>
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              className="font-sans text-[0.72rem] text-caramel hover:text-terracota transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-1 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-sand" />
        <span className="font-sans text-[0.68rem] text-espresso/30 tracking-widest uppercase">ou</span>
        <div className="flex-1 h-px bg-sand" />
      </div>

      {/* Criar conta */}
      <p className="font-sans text-[0.8rem] text-espresso/55 text-center">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="text-espresso font-semibold hover:text-terracota transition-colors underline underline-offset-2"
        >
          Criar conta
        </Link>
      </p>

    </div>
  );
}
