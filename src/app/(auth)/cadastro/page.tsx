"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Store } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { insertProdutora } from "@/app/actions/auth";

type Tipo = "cliente" | "produtora";

const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";
const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";

export default function CadastroPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>("cliente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nomeMarca, setNomeMarca] = useState("");
  const [cidade, setCidade] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    // Validações client-side
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 8) {
      setErro("A senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (tipo === "produtora" && !nomeMarca.trim()) {
      setErro("Informe o nome da sua marca.");
      return;
    }

    setCarregando(true);

    try {
      // 1. Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome, tipo },
        },
      });

      if (authError) {
        console.error("[Cadastro] Erro no signUp:", authError);
        setErro(authError.message ?? "Erro ao criar conta. Tente novamente.");
        return;
      }

      if (!authData.user) {
        console.error("[Cadastro] signUp não retornou usuário:", authData);
        setErro("Erro inesperado. Tente novamente.");
        return;
      }

      const userId = authData.user.id;
      console.log("[Cadastro] Usuário criado:", userId);

      // A tabela usuarios é populada automaticamente pelo trigger
      // on_auth_user_created no Supabase — não inserir aqui para evitar conflito de chave.

      // 2. Se for produtora, insere na tabela produtoras via Server Action
      if (tipo === "produtora") {
        try {
          await insertProdutora({ usuario_id: userId, nome_marca: nomeMarca, cidade })
          console.log("[Cadastro] Inserido em produtoras:", userId)
        } catch (err) {
          console.error("[Cadastro] Erro ao inserir em produtoras:", err)
        }
      }

      setSucesso(true);
      setTimeout(() => router.push("/login"), 3000);

    } catch (err) {
      console.error("[Cadastro] Erro inesperado:", err);
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">

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
          Criar sua conta
        </h1>
        <p className="font-sans text-[0.8rem] text-espresso/50 tracking-wide">
          Escolha como deseja participar da Feitoria
        </p>
      </div>

      {/* Tipo selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTipo("cliente")}
          className={`flex flex-col items-center gap-2.5 py-5 border transition-colors ${
            tipo === "cliente"
              ? "border-espresso bg-espresso text-cream"
              : "border-sand bg-cream text-espresso/55 hover:border-espresso/30 hover:text-espresso/80"
          }`}
        >
          <User size={20} strokeWidth={1.4} />
          <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase leading-none">
            Sou Cliente
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTipo("produtora")}
          className={`flex flex-col items-center gap-2.5 py-5 border transition-colors ${
            tipo === "produtora"
              ? "border-espresso bg-espresso text-cream"
              : "border-sand bg-cream text-espresso/55 hover:border-espresso/30 hover:text-espresso/80"
          }`}
        >
          <Store size={20} strokeWidth={1.4} />
          <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase leading-none">
            Sou Produtora
          </span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={labelCls}>Nome completo</label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputCls}
          />
        </div>

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

        <div className="flex flex-col gap-2">
          <label htmlFor="senha" className={labelCls}>Senha</label>
          <input
            id="senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmar-senha" className={labelCls}>Confirmar senha</label>
          <input
            id="confirmar-senha"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            required
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Campos exclusivos de Produtora */}
        {tipo === "produtora" && (
          <>
            <div className="h-px bg-sand" />
            <p className="font-sans text-[0.68rem] tracking-[0.22em] uppercase text-caramel font-semibold -mb-1">
              Sobre sua marca
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="marca" className={labelCls}>Nome da marca</label>
              <input
                id="marca"
                type="text"
                placeholder="Como sua marca se chama?"
                value={nomeMarca}
                onChange={(e) => setNomeMarca(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="cidade" className={labelCls}>Cidade</label>
              <input
                id="cidade"
                type="text"
                placeholder="Cidade, Estado"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className={inputCls}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={carregando || sucesso}
          className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-1 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>

        {/* Mensagem de sucesso — perto do botão para ser vista */}
        {sucesso && (
          <div className="border border-olive px-4 py-3">
            <p className="font-sans text-[0.78rem] text-olive font-medium">
              Conta criada! Verifique seu email para confirmar.
            </p>
          </div>
        )}

        {/* Mensagem de erro — perto do botão para ser vista */}
        {erro && (
          <div className="border border-wine px-4 py-3">
            <p className="font-sans text-[0.78rem] text-wine">{erro}</p>
          </div>
        )}

      </form>

      <p className="font-sans text-[0.8rem] text-espresso/55 text-center pb-4">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="text-espresso font-semibold hover:text-terracota transition-colors underline underline-offset-2"
        >
          Entrar
        </Link>
      </p>

    </div>
  );
}
