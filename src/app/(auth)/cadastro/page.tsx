"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Store, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { insertProdutora, updateClienteProfile } from "@/app/actions/auth";

type Tipo = "cliente" | "produtora";

const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";
const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";

const PREFERENCIAS_OPTIONS = [
  "Confeitaria doce",
  "Pães e fermentação natural",
  "Cafés especiais",
  "Bebidas",
  "Produtos sem lactose",
  "Produtos sem glúten",
  "Kits para presente",
  "Produtos veganos",
];

function formatCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

function formatTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export default function CadastroPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>("cliente");

  // Common
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Cliente
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidadeEnd, setCidadeEnd] = useState("");
  const [estadoEnd, setEstadoEnd] = useState("");
  const [preferencias, setPreferencias] = useState<string[]>([]);

  // Produtora
  const [nomeMarca, setNomeMarca] = useState("");
  const [cidade, setCidade] = useState("");

  // UI
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function buscarCEP(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidadeEnd(data.localidade ?? "");
        setEstadoEnd(data.uf ?? "");
      }
    } catch {}
    finally { setCepLoading(false); }
  }

  function togglePreferencia(pref: string) {
    setPreferencias((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, tipo } },
      });

      if (authError) {
        setErro(authError.message ?? "Erro ao criar conta. Tente novamente.");
        return;
      }
      if (!authData.user) {
        setErro("Erro inesperado. Tente novamente.");
        return;
      }

      const userId = authData.user.id;

      if (tipo === "produtora") {
        try {
          await insertProdutora({ usuario_id: userId, nome_marca: nomeMarca, cidade });
        } catch (err) {
          console.error("[Cadastro] Erro ao inserir em produtoras:", err);
        }
      }

      if (tipo === "cliente") {
        try {
          await updateClienteProfile({
            id: userId,
            data_nascimento: dataNascimento || undefined,
            telefone: telefone || undefined,
            cep: cep || undefined,
            endereco: rua || undefined,
            numero_endereco: numero || undefined,
            complemento: complemento || undefined,
            bairro: bairro || undefined,
            cidade: cidadeEnd || undefined,
            estado: estadoEnd || undefined,
            preferencias: preferencias.length > 0 ? preferencias : undefined,
          });
        } catch (err) {
          console.error("[Cadastro] Erro ao salvar perfil:", err);
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

      <Link href="/" className="self-center opacity-90 hover:opacity-100 transition-opacity">
        <Image src="/logo.jpg" alt="Feitoria" width={320} height={120} className="h-24 w-auto" priority />
      </Link>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-serif text-[1.85rem] text-espresso font-normal">Criar sua conta</h1>
        <p className="font-sans text-[0.8rem] text-espresso/50 tracking-wide">
          Escolha como deseja participar da Feitoria
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className={labelCls}>Nome completo</label>
          <input
            id="nome" type="text" autoComplete="name" placeholder="Seu nome"
            required value={nome} onChange={(e) => setNome(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelCls}>E-mail</label>
          <input
            id="email" type="email" autoComplete="email" placeholder="seu@email.com"
            required value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="senha" className={labelCls}>Senha</label>
          <input
            id="senha" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres"
            required value={senha} onChange={(e) => setSenha(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmar-senha" className={labelCls}>Confirmar senha</label>
          <input
            id="confirmar-senha" type="password" autoComplete="new-password" placeholder="Repita a senha"
            required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* ── CAMPOS CLIENTE ─────────────────────────────────────────── */}
        {tipo === "cliente" && (
          <>
            <div className="h-px bg-sand" />
            <p className="font-sans text-[0.68rem] tracking-[0.22em] uppercase text-caramel font-semibold -mb-1">
              Dados pessoais
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="data-nascimento" className={labelCls}>Data de nascimento</label>
              <input
                id="data-nascimento" type="date"
                value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="telefone" className={labelCls}>Telefone / WhatsApp</label>
              <input
                id="telefone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000"
                value={telefone} onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                className={inputCls}
              />
            </div>

            <div className="h-px bg-sand" />
            <p className="font-sans text-[0.68rem] tracking-[0.22em] uppercase text-caramel font-semibold -mb-1">
              Endereço
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="cad-cep" className={labelCls}>
                CEP
                {cepLoading && <Loader2 size={11} className="inline ml-2 animate-spin text-caramel" />}
              </label>
              <input
                id="cad-cep" type="text" placeholder="00000-000"
                value={cep}
                onChange={(e) => {
                  const v = formatCEP(e.target.value);
                  setCep(v);
                  buscarCEP(v);
                }}
                className={inputCls}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="cad-rua" className={labelCls}>Rua</label>
                <input
                  id="cad-rua" type="text" placeholder="Logradouro"
                  value={rua} onChange={(e) => setRua(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2 w-24">
                <label htmlFor="cad-numero" className={labelCls}>Número</label>
                <input
                  id="cad-numero" type="text" placeholder="Nº"
                  value={numero} onChange={(e) => setNumero(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cad-complemento" className={labelCls}>
                Complemento{" "}
                <span className="normal-case tracking-normal font-normal text-espresso/35">(opcional)</span>
              </label>
              <input
                id="cad-complemento" type="text" placeholder="Apto, bloco, referência..."
                value={complemento} onChange={(e) => setComplemento(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="cad-bairro" className={labelCls}>Bairro</label>
                <input
                  id="cad-bairro" type="text" placeholder="Bairro"
                  value={bairro} onChange={(e) => setBairro(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2 w-16">
                <label htmlFor="cad-estado" className={labelCls}>UF</label>
                <input
                  id="cad-estado" type="text" placeholder="DF" maxLength={2}
                  value={estadoEnd} onChange={(e) => setEstadoEnd(e.target.value.toUpperCase())}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cad-cidade" className={labelCls}>Cidade</label>
              <input
                id="cad-cidade" type="text" placeholder="Cidade"
                value={cidadeEnd} onChange={(e) => setCidadeEnd(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="h-px bg-sand" />
            <div className="flex flex-col gap-1">
              <p className="font-sans text-[0.68rem] tracking-[0.22em] uppercase text-caramel font-semibold">
                O que você mais gosta?
              </p>
              <p className="font-sans text-[0.75rem] text-espresso/45">
                Ajuda-nos a personalizar sua experiência.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PREFERENCIAS_OPTIONS.map((pref) => (
                <label
                  key={pref}
                  className={`flex items-start gap-2.5 px-3 py-3 border cursor-pointer transition-colors ${
                    preferencias.includes(pref)
                      ? "border-espresso bg-sand/40"
                      : "border-sand hover:border-espresso/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={preferencias.includes(pref)}
                    onChange={() => togglePreferencia(pref)}
                    className="mt-0.5 accent-espresso flex-shrink-0"
                  />
                  <span className="font-sans text-[0.73rem] text-espresso leading-snug">{pref}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* ── CAMPOS PRODUTORA ───────────────────────────────────────── */}
        {tipo === "produtora" && (
          <>
            <div className="h-px bg-sand" />
            <p className="font-sans text-[0.68rem] tracking-[0.22em] uppercase text-caramel font-semibold -mb-1">
              Sobre sua marca
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="marca" className={labelCls}>Nome da marca</label>
              <input
                id="marca" type="text" placeholder="Como sua marca se chama?"
                value={nomeMarca} onChange={(e) => setNomeMarca(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="cidade" className={labelCls}>Cidade</label>
              <input
                id="cidade" type="text" placeholder="Cidade, Estado"
                value={cidade} onChange={(e) => setCidade(e.target.value)}
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

        {sucesso && (
          <div className="border border-olive px-4 py-3">
            <p className="font-sans text-[0.78rem] text-olive font-medium">
              Conta criada! Verifique seu email para confirmar.
            </p>
          </div>
        )}

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
