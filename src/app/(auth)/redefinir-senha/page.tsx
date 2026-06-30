"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Check existing session first (PKCE flow: /auth/callback already ran)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // Also listen for PASSWORD_RECOVERY or SIGNED_IN events (implicit flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
          setSessionReady(true);
        }
      }
    );

    // Safety timeout: user arrived via a recovery link so they must be auth'd.
    // If neither getSession nor onAuthStateChange fires within 3s, show the form anyway.
    const timeout = setTimeout(() => setSessionReady(true), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("A senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      setErro(error.message ?? "Erro ao redefinir a senha. Tente novamente.");
      setCarregando(false);
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/login"), 2500);
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
          Nova senha
        </h1>
        <p className="font-sans text-[0.8rem] text-espresso/50 tracking-wide">
          Escolha uma nova senha para a sua conta
        </p>
      </div>

      {/* Sucesso */}
      {sucesso && (
        <div className="bg-olive/8 border border-olive/20 px-4 py-3">
          <p className="font-sans text-[0.78rem] text-olive font-medium">
            Senha redefinida com sucesso! Redirecionando para o login...
          </p>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-wine/8 border border-wine/20 px-4 py-3">
          <p className="font-sans text-[0.78rem] text-wine">{erro}</p>
        </div>
      )}

      {/* Aguardando sessão */}
      {!sessionReady && !sucesso && (
        <div className="flex flex-col gap-5">
          <div className="h-12 bg-sand/40 animate-pulse" />
          <div className="h-12 bg-sand/40 animate-pulse" />
          <div className="h-12 bg-sand/40 animate-pulse" />
          <p className="font-sans text-[0.75rem] text-espresso/40 text-center">
            Verificando link de recuperação...
          </p>
        </div>
      )}

      {/* Form */}
      {sessionReady && !sucesso && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="nova-senha" className={labelCls}>Nova senha</label>
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmar-senha" className={labelCls}>Confirmar nova senha</label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-1 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? "Salvando..." : "Salvar nova senha"}
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
