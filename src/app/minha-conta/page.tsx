"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Heart,
  Package,
  TrendingUp,
  Award,
  ChevronDown,
  Truck,
  MapPin,
  Loader2,
  Check,
  Image as ImageIcon,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { updateClienteProfile } from "@/app/actions/auth";
import { useCart } from "@/lib/cart-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "dados" | "favoritos" | "pedidos" | "mais-comprados" | "fidelidade";

type PerfilForm = {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cep: string;
  endereco: string;
  numero_endereco: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type Favorito = {
  id: string;
  produto_id: string;
  produtos: {
    id: string;
    nome: string;
    preco: number;
    foto: string | null;
    produtoras: { id: string; nome_marca: string };
  };
};

type ItemPedido = {
  id: string;
  nome_produto: string;
  produtor: string;
  preco_unitario: number;
  quantidade: number;
};

type Pedido = {
  id: string;
  numero: string;
  created_at: string;
  status: string;
  tipo_entrega: string;
  forma_pagamento: string;
  subtotal: number;
  frete: number;
  total: number;
  itens_pedido: ItemPedido[];
};

type ProdutoMaisComprado = {
  produto_id: string | null;
  nome: string;
  produtor: string;
  preco: number;
  foto: string | null;
  total_comprado: number;
};

type ProgressoFidelidade = {
  selos_atuais: number;
  selos_historico_total: number;
  elegivel_desconto: boolean;
};

// ─── Status labels ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string }> = {
  pendente:   { label: "Pendente",   cls: "text-caramel   border-caramel/30   bg-caramel/8"   },
  confirmado: { label: "Confirmado", cls: "text-olive     border-olive/30     bg-olive/8"     },
  em_preparo: { label: "Em preparo", cls: "text-terracota border-terracota/30 bg-terracota/8" },
  entregue:   { label: "Entregue",   cls: "text-espresso  border-espresso/20  bg-sand"        },
  cancelado:  { label: "Cancelado",  cls: "text-wine      border-wine/30      bg-wine/8"      },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function formatCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

// ─── PainelFidelidade ─────────────────────────────────────────────────────────

function PainelFidelidade({ progresso }: { progresso: ProgressoFidelidade }) {
  const { selos_atuais, selos_historico_total, elegivel_desconto } = progresso;
  const selosVisiveis = Math.min(selos_atuais, 10);
  const faltam = Math.max(0, 10 - selos_atuais);

  return (
    <div className="border border-sand max-w-xl">
      <div className="px-5 py-4 border-b border-sand">
        <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-0.5">
          Programa de Fidelidade
        </p>
        <h2 className="font-serif text-xl text-espresso font-normal">Fidelidade FEITORIA</h2>
      </div>

      <div className="px-5 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`w-5 h-5 transition-colors ${
                  i < selosVisiveis ? "bg-espresso" : "border border-sand"
                }`}
              />
            ))}
          </div>

          {elegivel_desconto ? (
            <p className="font-sans text-xs text-olive font-medium">
              Desconto de 30% disponível na sua próxima compra.
            </p>
          ) : (
            <p className="font-sans text-xs text-espresso/55">
              {selos_atuais} de 10 selos acumulados
              {faltam > 0 && (
                <>
                  {" "}— faltam{" "}
                  <span className="text-espresso font-medium">{faltam}</span>{" "}
                  {faltam === 1 ? "selo" : "selos"} para o desconto de 30%
                </>
              )}
            </p>
          )}

          <p className="font-sans text-[0.65rem] text-espresso/35">
            A cada R$ 100 em compras (sem frete), você ganha 1 selo.
          </p>
        </div>

        <div className="flex items-stretch gap-8 pt-4 border-t border-sand">
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-2xl text-espresso">{selos_atuais}</span>
            <span className="font-sans text-[0.6rem] tracking-[0.18em] uppercase text-espresso/40">
              Selos atuais
            </span>
          </div>
          <div className="w-px bg-sand" />
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-2xl text-espresso">{selos_historico_total}</span>
            <span className="font-sans text-[0.6rem] tracking-[0.18em] uppercase text-espresso/40">
              Total histórico
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinhaContaPage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dados");

  // Dados
  const [perfilForm, setPerfilForm] = useState<PerfilForm>({
    nome: "", email: "", telefone: "", data_nascimento: "",
    cep: "", endereco: "", numero_endereco: "", complemento: "",
    bairro: "", cidade: "", estado: "",
  });
  const [perfilLoading, setPerfilLoading] = useState(true);
  const [perfilSalvando, setPerfilSalvando] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Favoritos
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [favoritosLoading, setFavoritosLoading] = useState(true);

  // Pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Mais Comprados
  const [maisComprados, setMaisComprados] = useState<ProdutoMaisComprado[]>([]);
  const [maisCompradosLoading, setMaisCompradosLoading] = useState(true);

  // Fidelidade
  const [progresso, setProgresso] = useState<ProgressoFidelidade | null>(null);

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      fetchAll(user.id, user.email ?? "");
    });
  }, [router]);

  async function fetchAll(uid: string, email: string) {
    await Promise.all([
      fetchPerfil(uid, email),
      fetchFavoritos(uid),
      fetchPedidos(uid),
      fetchMaisComprados(uid),
      fetchProgresso(uid),
    ]);
  }

  // ── Fetchers ────────────────────────────────────────────────────────────────

  async function fetchPerfil(uid: string, email: string) {
    setPerfilLoading(true);
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("nome, telefone, data_nascimento, cep, endereco, numero_endereco, complemento, bairro, cidade, estado")
        .eq("id", uid)
        .single();

      setPerfilForm({
        nome: data?.nome ?? "",
        email,
        telefone: data?.telefone ?? "",
        data_nascimento: data?.data_nascimento ?? "",
        cep: data?.cep ?? "",
        endereco: data?.endereco ?? "",
        numero_endereco: data?.numero_endereco ?? "",
        complemento: data?.complemento ?? "",
        bairro: data?.bairro ?? "",
        cidade: data?.cidade ?? "",
        estado: data?.estado ?? "",
      });
    } finally {
      setPerfilLoading(false);
    }
  }

  async function fetchFavoritos(uid: string) {
    setFavoritosLoading(true);
    try {
      const { data } = await supabase
        .from("favoritos")
        .select("id, produto_id, produtos(id, nome, preco, foto, produtoras(id, nome_marca))")
        .eq("usuario_id", uid);
      setFavoritos((data as unknown as Favorito[]) ?? []);
    } catch {
      // table may not be set up yet
    } finally {
      setFavoritosLoading(false);
    }
  }

  async function fetchPedidos(uid: string) {
    setPedidosLoading(true);
    try {
      const { data } = await supabase
        .from("pedidos")
        .select("*, itens_pedido(*)")
        .eq("usuario_id", uid)
        .order("created_at", { ascending: false });
      setPedidos((data as Pedido[]) ?? []);
    } finally {
      setPedidosLoading(false);
    }
  }

  async function fetchMaisComprados(uid: string) {
    setMaisCompradosLoading(true);
    try {
      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("id")
        .eq("usuario_id", uid);

      const pedidoIds = (pedidosData ?? []).map((p: { id: string }) => p.id);
      if (pedidoIds.length === 0) return;

      const { data: itens } = await supabase
        .from("itens_pedido")
        .select("produto_id, nome_produto, produtor, preco_unitario, quantidade, foto_url")
        .in("pedido_id", pedidoIds);

      if (!itens) return;

      const map = new Map<string, ProdutoMaisComprado>();
      for (const item of itens) {
        const key: string = item.produto_id ?? item.nome_produto;
        const existing = map.get(key);
        if (existing) {
          existing.total_comprado += item.quantidade;
        } else {
          map.set(key, {
            produto_id: item.produto_id ?? null,
            nome: item.nome_produto,
            produtor: item.produtor,
            preco: item.preco_unitario,
            foto: item.foto_url ?? null,
            total_comprado: item.quantidade,
          });
        }
      }

      setMaisComprados(
        Array.from(map.values())
          .sort((a, b) => b.total_comprado - a.total_comprado)
          .slice(0, 5)
      );
    } finally {
      setMaisCompradosLoading(false);
    }
  }

  async function fetchProgresso(uid: string) {
    const { data } = await supabase
      .from("progresso_fidelidade")
      .select("selos_atuais, selos_historico_total, elegivel_desconto")
      .eq("usuario_id", uid)
      .single();
    if (data) setProgresso(data as ProgressoFidelidade);
  }

  // ── CEP auto-fill ────────────────────────────────────────────────────────────

  async function buscarCEP(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await res.json();
      if (!d.erro) {
        setPerfilForm((prev) => ({
          ...prev,
          cep,
          endereco: d.logradouro ?? prev.endereco,
          bairro: d.bairro ?? prev.bairro,
          cidade: d.localidade ?? prev.cidade,
          estado: d.uf ?? prev.estado,
        }));
      }
    } catch {}
    finally { setCepLoading(false); }
  }

  // ── Save profile ─────────────────────────────────────────────────────────────

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setPerfilSalvando(true);
    try {
      await updateClienteProfile({
        id: userId,
        nome: perfilForm.nome || undefined,
        telefone: perfilForm.telefone || undefined,
        data_nascimento: perfilForm.data_nascimento || undefined,
        cep: perfilForm.cep || undefined,
        endereco: perfilForm.endereco || undefined,
        numero_endereco: perfilForm.numero_endereco || undefined,
        complemento: perfilForm.complemento || undefined,
        bairro: perfilForm.bairro || undefined,
        cidade: perfilForm.cidade || undefined,
        estado: perfilForm.estado || undefined,
      });
      setPerfilSalvo(true);
      setTimeout(() => setPerfilSalvo(false), 3000);
    } catch (err) {
      console.error("[MinhaContaPage] Erro ao salvar perfil:", err);
    } finally {
      setPerfilSalvando(false);
    }
  }

  // ── Favoritos ─────────────────────────────────────────────────────────────────

  async function removerFavorito(id: string) {
    await supabase.from("favoritos").delete().eq("id", id);
    setFavoritos((prev) => prev.filter((f) => f.id !== id));
  }

  // ── Pedidos ───────────────────────────────────────────────────────────────────

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (!userId) {
    return (
      <div className="bg-cream min-h-screen pt-28 lg:pt-40 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-terracota/40" />
      </div>
    );
  }

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "dados",          label: "Meus Dados",     Icon: User },
    { id: "favoritos",      label: "Favoritos",      Icon: Heart },
    { id: "pedidos",        label: "Meus Pedidos",   Icon: Package },
    { id: "mais-comprados", label: "Mais Comprados", Icon: TrendingUp },
    { id: "fidelidade",     label: "Fidelidade",     Icon: Award },
  ];

  return (
    <div className="bg-cream min-h-screen pt-28 lg:pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
            Conta
          </p>
          <h1 className="font-serif text-3xl text-espresso font-normal">
            {perfilForm.nome ? perfilForm.nome.split(" ")[0] : "Minha Conta"}
          </h1>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="border-b border-sand mb-10 overflow-x-auto -mx-5 px-5 sm:-mx-8 sm:px-8">
          <div className="flex min-w-max">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 font-sans text-[0.65rem] sm:text-[0.7rem] font-semibold tracking-[0.1em] uppercase transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === id
                    ? "border-espresso text-espresso"
                    : "border-transparent text-espresso/40 hover:text-espresso/70"
                }`}
              >
                <Icon size={13} strokeWidth={1.8} className="flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ABA: MEUS DADOS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "dados" && (
          perfilLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-terracota/40" />
            </div>
          ) : (
            <form onSubmit={handleSalvar} className="flex flex-col gap-8 max-w-xl">

              <div className="flex flex-col gap-5">
                <p className="font-sans text-[0.62rem] tracking-[0.25em] uppercase text-caramel font-semibold">
                  Dados pessoais
                </p>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Nome completo</label>
                  <input
                    type="text"
                    value={perfilForm.nome}
                    onChange={(e) => setPerfilForm((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Seu nome"
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>E-mail</label>
                  <input
                    type="email"
                    value={perfilForm.email}
                    readOnly
                    className={`${inputCls} opacity-40 cursor-not-allowed`}
                  />
                  <span className="font-sans text-[0.63rem] text-espresso/35">
                    O e-mail não pode ser alterado por aqui.
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className={labelCls}>Telefone</label>
                    <input
                      type="tel"
                      value={perfilForm.telefone}
                      onChange={(e) =>
                        setPerfilForm((p) => ({ ...p, telefone: formatTelefone(e.target.value) }))
                      }
                      placeholder="(00) 00000-0000"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className={labelCls}>Data de nascimento</label>
                    <input
                      type="date"
                      value={perfilForm.data_nascimento}
                      onChange={(e) =>
                        setPerfilForm((p) => ({ ...p, data_nascimento: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-sand" />

              <div className="flex flex-col gap-5">
                <p className="font-sans text-[0.62rem] tracking-[0.25em] uppercase text-caramel font-semibold">
                  Endereço
                </p>

                <div className="flex flex-col gap-2">
                  <label className={`${labelCls} flex items-center gap-2`}>
                    CEP
                    {cepLoading && <Loader2 size={11} className="animate-spin text-caramel" />}
                  </label>
                  <input
                    type="text"
                    value={perfilForm.cep}
                    onChange={(e) => {
                      const v = formatCEP(e.target.value);
                      setPerfilForm((p) => ({ ...p, cep: v }));
                      buscarCEP(v);
                    }}
                    placeholder="00000-000"
                    className={inputCls}
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className={labelCls}>Endereço</label>
                    <input
                      type="text"
                      value={perfilForm.endereco}
                      onChange={(e) => setPerfilForm((p) => ({ ...p, endereco: e.target.value }))}
                      placeholder="Logradouro"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-24">
                    <label className={labelCls}>Número</label>
                    <input
                      type="text"
                      value={perfilForm.numero_endereco}
                      onChange={(e) =>
                        setPerfilForm((p) => ({ ...p, numero_endereco: e.target.value }))
                      }
                      placeholder="Nº"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>
                    Complemento{" "}
                    <span className="normal-case tracking-normal font-normal text-espresso/30">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={perfilForm.complemento}
                    onChange={(e) => setPerfilForm((p) => ({ ...p, complemento: e.target.value }))}
                    placeholder="Apto, bloco, referência..."
                    className={inputCls}
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className={labelCls}>Bairro</label>
                    <input
                      type="text"
                      value={perfilForm.bairro}
                      onChange={(e) => setPerfilForm((p) => ({ ...p, bairro: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-16">
                    <label className={labelCls}>UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={perfilForm.estado}
                      onChange={(e) =>
                        setPerfilForm((p) => ({ ...p, estado: e.target.value.toUpperCase() }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Cidade</label>
                  <input
                    type="text"
                    value={perfilForm.cidade}
                    onChange={(e) => setPerfilForm((p) => ({ ...p, cidade: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center gap-5 pt-2">
                <button
                  type="submit"
                  disabled={perfilSalvando}
                  className="bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase px-8 py-4 hover:bg-caramel transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {perfilSalvando && <Loader2 size={13} className="animate-spin" />}
                  Salvar alterações
                </button>
                {perfilSalvo && (
                  <div className="flex items-center gap-1.5 text-olive">
                    <Check size={14} strokeWidth={2.2} />
                    <span className="font-sans text-[0.75rem]">Salvo</span>
                  </div>
                )}
              </div>

            </form>
          )
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA: FAVORITOS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "favoritos" && (
          favoritosLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-terracota/40" />
            </div>
          ) : favoritos.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-6 py-20">
              <Heart size={36} strokeWidth={1.2} className="text-espresso/20" />
              <div>
                <p className="font-serif text-xl text-espresso font-normal mb-2">
                  Nenhum favorito ainda
                </p>
                <p className="font-sans text-sm text-espresso/50">
                  Salve produtos que você gostou e encontre-os aqui.
                </p>
              </div>
              <Link
                href="/produtos"
                className="font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase bg-terracota text-cream px-8 py-4 hover:bg-caramel transition-colors"
              >
                Explorar produtos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favoritos.map((fav) => (
                <div key={fav.id} className="flex gap-4 border border-sand p-4">
                  <Link href={`/produtos/${fav.produtos.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 bg-beige overflow-hidden relative flex items-center justify-center">
                      {fav.produtos.foto ? (
                        <Image
                          src={fav.produtos.foto}
                          alt={fav.produtos.nome}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <ImageIcon size={20} className="text-espresso/20" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 py-0.5">
                    <div>
                      <Link
                        href={`/produtos/${fav.produtos.id}`}
                        className="font-sans text-sm font-medium text-espresso hover:text-terracota transition-colors leading-snug line-clamp-2 block"
                      >
                        {fav.produtos.nome}
                      </Link>
                      <p className="font-sans text-xs text-espresso/40 mt-0.5">
                        {fav.produtos.produtoras.nome_marca}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base text-espresso">
                        R$ {fmt(fav.produtos.preco)}
                      </span>
                      <button
                        onClick={() => removerFavorito(fav.id)}
                        className="flex items-center gap-1.5 text-espresso/30 hover:text-wine transition-colors"
                      >
                        <Trash2 size={13} strokeWidth={1.6} />
                        <span className="font-sans text-[0.63rem]">Remover</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA: MEUS PEDIDOS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "pedidos" && (
          pedidosLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-terracota/40" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-6 py-20">
              <Package size={36} strokeWidth={1.2} className="text-espresso/20" />
              <div>
                <p className="font-serif text-xl text-espresso font-normal mb-2">
                  Nenhum pedido ainda
                </p>
                <p className="font-sans text-sm text-espresso/50">
                  Quando você finalizar uma compra, seus pedidos aparecerão aqui.
                </p>
              </div>
              <Link
                href="/produtos"
                className="font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase bg-terracota text-cream px-8 py-4 hover:bg-caramel transition-colors"
              >
                Explorar produtos
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pedidos.map((pedido) => {
                const expanded = expandedIds.has(pedido.id);
                const status = STATUS[pedido.status] ?? {
                  label: pedido.status,
                  cls: "text-espresso/50 border-sand bg-sand",
                };
                return (
                  <div key={pedido.id} className="border border-sand bg-cream">
                    <button
                      onClick={() => toggleExpand(pedido.id)}
                      className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-sand/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-sans text-sm font-semibold text-espresso">
                            {pedido.numero}
                          </span>
                          <span
                            className={`font-sans text-[0.62rem] font-semibold tracking-[0.18em] uppercase px-2.5 py-1 border ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-espresso/45 mt-1">
                          {formatDate(pedido.created_at)}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-espresso/50 flex-shrink-0">
                        {pedido.tipo_entrega === "entrega" ? (
                          <Truck size={13} strokeWidth={1.6} />
                        ) : (
                          <MapPin size={13} strokeWidth={1.6} />
                        )}
                        <span className="font-sans text-xs">
                          {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0">
                        <span className="font-serif text-lg text-espresso">
                          R$ {fmt(pedido.total)}
                        </span>
                        <div className="flex items-center gap-1 text-espresso/40">
                          <span className="font-sans text-[0.63rem] tracking-wide uppercase">
                            {expanded ? "Fechar" : "Ver detalhes"}
                          </span>
                          <ChevronDown
                            size={14}
                            strokeWidth={1.8}
                            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-sand">
                        <div className="divide-y divide-sand/60">
                          {pedido.itens_pedido.length > 0 ? (
                            pedido.itens_pedido.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                                <div className="w-9 h-9 bg-beige flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-sans text-sm text-espresso font-medium leading-snug truncate">
                                    {item.nome_produto}
                                  </p>
                                  <p className="font-sans text-xs text-espresso/45">{item.produtor}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-sans text-sm text-espresso font-medium">
                                    R$ {fmt(item.preco_unitario * item.quantidade)}
                                  </p>
                                  <p className="font-sans text-xs text-espresso/40">
                                    {item.quantidade} × R$ {fmt(item.preco_unitario)}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="px-5 py-4 font-sans text-xs text-espresso/40">
                              Detalhes dos itens indisponíveis.
                            </p>
                          )}
                        </div>
                        <div className="border-t border-sand px-5 py-4 bg-sand/20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                          <div className="flex items-center gap-2 text-espresso/50">
                            {pedido.tipo_entrega === "entrega" ? (
                              <Truck size={13} strokeWidth={1.6} />
                            ) : (
                              <MapPin size={13} strokeWidth={1.6} />
                            )}
                            <span className="font-sans text-xs">
                              {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}
                              {" · "}
                              {pedido.forma_pagamento === "pix" ? "Pix" : "Cartão de crédito"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex justify-between gap-8 w-full sm:w-auto">
                              <span className="font-sans text-xs text-espresso/50">Subtotal</span>
                              <span className="font-sans text-xs text-espresso">
                                R$ {fmt(pedido.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-8 w-full sm:w-auto">
                              <span className="font-sans text-xs text-espresso/50">Frete</span>
                              <span
                                className={`font-sans text-xs ${
                                  pedido.frete === 0 ? "text-olive" : "text-espresso"
                                }`}
                              >
                                {pedido.frete === 0 ? "Grátis" : `R$ ${fmt(pedido.frete)}`}
                              </span>
                            </div>
                            <div className="flex justify-between gap-8 w-full sm:w-auto pt-1 border-t border-sand mt-1">
                              <span className="font-sans text-xs text-espresso font-semibold">
                                Total
                              </span>
                              <span className="font-serif text-base text-espresso">
                                R$ {fmt(pedido.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA: MAIS COMPRADOS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "mais-comprados" && (
          maisCompradosLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-terracota/40" />
            </div>
          ) : maisComprados.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-6 py-20">
              <TrendingUp size={36} strokeWidth={1.2} className="text-espresso/20" />
              <div>
                <p className="font-serif text-xl text-espresso font-normal mb-2">
                  Nenhum histórico ainda
                </p>
                <p className="font-sans text-sm text-espresso/50 max-w-xs">
                  Seus produtos favoritos aparecerão aqui conforme você compra.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-2xl">
              {maisComprados.map((produto, index) => (
                <div
                  key={produto.produto_id ?? produto.nome}
                  className="flex items-center gap-5 border border-sand px-5 py-4"
                >
                  <span className="font-serif text-2xl text-espresso/20 w-6 text-center flex-shrink-0 select-none">
                    {index + 1}
                  </span>

                  <div className="w-14 h-14 bg-beige flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                    {produto.foto ? (
                      <Image
                        src={produto.foto}
                        alt={produto.nome}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <ImageIcon size={18} className="text-espresso/20" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium text-espresso leading-snug truncate">
                      {produto.nome}
                    </p>
                    <p className="font-sans text-xs text-espresso/45 mt-0.5">{produto.produtor}</p>
                    <p className="font-sans text-[0.63rem] text-espresso/30 mt-1">
                      {produto.total_comprado}{" "}
                      {produto.total_comprado === 1 ? "unidade comprada" : "unidades compradas"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                    <span className="font-serif text-base text-espresso">
                      R$ {fmt(produto.preco)}
                    </span>
                    {produto.produto_id && (
                      <Link
                        href={`/produtos/${produto.produto_id}`}
                        className="flex items-center gap-1.5 font-sans text-[0.63rem] font-semibold tracking-[0.14em] uppercase text-terracota hover:text-caramel transition-colors"
                      >
                        <ShoppingBag size={11} strokeWidth={1.8} />
                        Comprar de novo
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA: FIDELIDADE
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "fidelidade" && (
          progresso ? (
            <PainelFidelidade progresso={progresso} />
          ) : (
            <div className="flex flex-col items-center text-center gap-6 py-20">
              <Award size={36} strokeWidth={1.2} className="text-espresso/20" />
              <div>
                <p className="font-serif text-xl text-espresso font-normal mb-2">
                  Programa de Fidelidade
                </p>
                <p className="font-sans text-sm text-espresso/50 max-w-xs mx-auto">
                  Faça sua primeira compra e comece a acumular selos. A cada R$ 100 em compras,
                  você ganha 1 selo.
                </p>
              </div>
              <Link
                href="/produtos"
                className="font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase border border-espresso/20 text-espresso px-8 py-4 hover:bg-sand transition-colors"
              >
                Explorar produtos
              </Link>
            </div>
          )
        )}

      </div>
    </div>
  );
}
