"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  Heart,
  Award,
  Tag,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cliente {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
  data_nascimento: string | null;
  cep: string | null;
  endereco: string | null;
  numero_endereco: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  preferencias: string[] | null;
}

interface PedidoItem {
  nome_produto: string;
  produtor: string;
  quantidade: number;
  preco_unitario: number;
}

interface Pedido {
  id: string;
  numero: string;
  criado_em: string;
  status: string;
  total: number;
  itens_pedido: PedidoItem[];
}

interface FavoritoProduto {
  id: string;
  produto_id: string;
  produtos: {
    id: string;
    nome: string;
    preco: number;
    foto: string | null;
    produtoras: { nome_marca: string };
  };
}

interface Fidelidade {
  selos_atuais: number;
  selos_historico_total: number;
  elegivel_desconto: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function statusStyle(s: string) {
  if (s === "confirmado") return "bg-olive/10 text-olive";
  if (s === "em_preparo") return "bg-blue-50 text-blue-600";
  if (s === "entregue")   return "bg-espresso/10 text-espresso";
  if (s === "cancelado")  return "bg-terracota/10 text-terracota";
  return "bg-amber-100 text-amber-600";
}

const STATUS_LABELS: Record<string, string> = {
  pendente:   "Pendente",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  entregue:   "Entregue",
  cancelado:  "Cancelado",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-espresso/40 font-bold pb-3 border-b border-sand">
      {label}
    </p>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4">
      <span className="font-sans text-[0.62rem] tracking-[0.18em] uppercase text-espresso/35 font-semibold w-36 flex-shrink-0">
        {label}
      </span>
      <span className="font-sans text-[0.85rem] text-espresso/80">{value ?? "—"}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminClienteDetalhePage() {
  const { id } = useParams<{ id: string }>();

  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [cliente,    setCliente]    = useState<Cliente | null>(null);
  const [pedidos,    setPedidos]    = useState<Pedido[]>([]);
  const [favoritos,  setFavoritos]  = useState<FavoritoProduto[]>([]);
  const [fidelidade, setFidelidade] = useState<Fidelidade | null>(null);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [clienteRes, pedidosRes, favoritosRes, fidelidadeRes] = await Promise.all([
        supabase
          .from("usuarios")
          .select("id, nome, email, telefone, data_nascimento, cep, endereco, numero_endereco, complemento, bairro, cidade, estado, preferencias")
          .eq("id", id)
          .single(),
        supabase
          .from("pedidos")
          .select("id, numero, criado_em, status, total, itens_pedido(nome_produto, produtor, quantidade, preco_unitario)")
          .eq("usuario_id", id)
          .order("criado_em", { ascending: false }),
        supabase
          .from("favoritos")
          .select("id, produto_id, produtos(id, nome, preco, foto, produtoras(nome_marca))")
          .eq("usuario_id", id),
        supabase
          .from("progresso_fidelidade")
          .select("selos_atuais, selos_historico_total, elegivel_desconto")
          .eq("usuario_id", id)
          .single(),
      ]);

      if (clienteRes.error || !clienteRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCliente(clienteRes.data as unknown as Cliente);
      setPedidos((pedidosRes.data ?? []) as unknown as Pedido[]);
      setFavoritos((favoritosRes.data ?? []) as unknown as FavoritoProduto[]);
      if (fidelidadeRes.data) setFidelidade(fidelidadeRes.data as Fidelidade);
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const pedidosAtivos = pedidos.filter((p) => p.status !== "cancelado");
  const totalGasto    = pedidosAtivos.reduce((s, p) => s + p.total, 0);
  const ticketMedio   = pedidosAtivos.length > 0 ? totalGasto / pedidosAtivos.length : 0;
  const primeiroPedido = pedidos.length > 0 ? pedidos[pedidos.length - 1].criado_em : null;
  const ultimoPedido   = pedidos.length > 0 ? pedidos[0].criado_em : null;

  // ── Loading / Not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !cliente) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64">
        <p className="font-serif text-xl text-espresso/30 italic">Cliente não encontrado.</p>
        <Link
          href="/admin/clientes"
          className="font-sans text-xs tracking-widest uppercase text-caramel hover:text-terracota transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10 max-w-4xl">

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        <Link
          href="/admin/clientes"
          className="text-espresso/35 hover:text-espresso transition-colors p-1 -ml-1"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <div>
          <p className="font-sans text-[0.58rem] tracking-[0.28em] uppercase text-espresso/35 font-semibold">
            Cliente
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-espresso leading-tight">
            {cliente.nome ?? "(sem nome)"}
          </h2>
        </div>
      </div>

      {/* ── Dados pessoais ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionHeading label="Dados pessoais" />
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3.5">
          <DataRow
            label="E-mail"
            value={
              <span className="flex items-center gap-1.5">
                <Mail size={12} className="text-espresso/25" />
                {cliente.email}
              </span>
            }
          />
          <DataRow
            label="Telefone"
            value={
              cliente.telefone ? (
                <span className="flex items-center gap-1.5">
                  <Phone size={12} className="text-espresso/25" />
                  {cliente.telefone}
                </span>
              ) : null
            }
          />
          <DataRow
            label="Nascimento"
            value={
              cliente.data_nascimento ? (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-espresso/25" />
                  {new Date(cliente.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              ) : null
            }
          />
          <DataRow
            label="Localização"
            value={
              [cliente.cidade, cliente.estado].filter(Boolean).length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-espresso/25" />
                  {[cliente.cidade, cliente.estado].filter(Boolean).join(", ")}
                </span>
              ) : null
            }
          />
          {(cliente.endereco || cliente.cep) && (
            <DataRow
              label="Endereço"
              value={[
                cliente.endereco,
                cliente.numero_endereco,
                cliente.complemento,
                cliente.bairro,
                cliente.cep,
              ].filter(Boolean).join(", ")}
            />
          )}
        </div>
      </section>

      {/* ── Resumo ────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionHeading label="Resumo" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total gasto",    value: totalGasto > 0 ? fmtBRL(totalGasto) : "—",        icon: TrendingUp, color: "text-olive"    },
            { label: "Pedidos",        value: String(pedidosAtivos.length),                       icon: Package,    color: "text-espresso" },
            { label: "Ticket médio",   value: ticketMedio > 0 ? fmtBRL(ticketMedio) : "—",      icon: TrendingUp, color: "text-caramel"  },
            { label: "Favoritos",      value: String(favoritos.length),                           icon: Heart,      color: "text-wine"     },
          ].map((c) => (
            <div key={c.label} className="bg-cream border border-sand p-4 flex flex-col gap-3">
              <div className={`w-7 h-7 rounded-full bg-sand/30 flex items-center justify-center ${c.color}`}>
                <c.icon size={13} strokeWidth={2} />
              </div>
              <div>
                <p className="font-sans text-[0.58rem] tracking-[0.15em] uppercase text-espresso/35 font-bold mb-0.5">
                  {c.label}
                </p>
                <p className="font-serif text-lg text-espresso">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {(primeiroPedido || ultimoPedido) && (
          <div className="flex items-center gap-8 px-5 py-4 bg-sand/20 border border-sand text-espresso/55">
            {primeiroPedido && (
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-espresso/35">Primeiro pedido</span>
                <span className="font-sans text-[0.82rem] text-espresso">{fmtDate(primeiroPedido)}</span>
              </div>
            )}
            {primeiroPedido && ultimoPedido && primeiroPedido !== ultimoPedido && (
              <div className="w-px h-8 bg-sand" />
            )}
            {ultimoPedido && primeiroPedido !== ultimoPedido && (
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-espresso/35">Último pedido</span>
                <span className="font-sans text-[0.82rem] text-espresso">{fmtDate(ultimoPedido)}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Histórico de Pedidos ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionHeading label={`Histórico de Pedidos (${pedidos.length})`} />

        {pedidos.length === 0 ? (
          <p className="font-serif text-base text-espresso/30 italic">Nenhum pedido realizado.</p>
        ) : (
          <div className="bg-cream border border-sand divide-y divide-sand/50">
            {pedidos.map((p) => {
              const expanded = expandedPedido === p.id;
              return (
                <div key={p.id}>
                  <button
                    onClick={() => setExpandedPedido(expanded ? null : p.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-sand/10 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-5 flex-wrap">
                      <span className="font-sans text-[0.75rem] font-semibold text-espresso tracking-wider">
                        #{p.numero}
                      </span>
                      <span className="font-sans text-[0.72rem] text-espresso/40">
                        {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${statusStyle(p.status)}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-serif text-base text-espresso">{fmtBRL(p.total)}</span>
                      {expanded
                        ? <ChevronUp size={14} className="text-espresso/30" />
                        : <ChevronDown size={14} className="text-espresso/30" />}
                    </div>
                  </button>

                  {expanded && p.itens_pedido.length > 0 && (
                    <div className="px-5 pb-4 flex flex-col gap-2 bg-sand/5">
                      {p.itens_pedido.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-sand/40 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-[0.78rem] text-espresso truncate">{item.nome_produto}</p>
                            <p className="font-sans text-[0.65rem] text-espresso/35">{item.produtor}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0 font-sans text-[0.75rem] text-espresso/60 tabular-nums">
                            <span>{item.quantidade}×</span>
                            <span>{fmtBRL(item.preco_unitario)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Produtos Favoritados ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionHeading label={`Produtos Favoritados (${favoritos.length})`} />

        {favoritos.length === 0 ? (
          <p className="font-serif text-base text-espresso/30 italic">Nenhum produto favoritado.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favoritos.map((f) => (
              <Link
                key={f.id}
                href={`/produtos/${f.produto_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-cream border border-sand px-4 py-3.5 hover:border-espresso/25 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 bg-sand/30 flex-shrink-0 overflow-hidden relative">
                  {f.produtos?.foto ? (
                    <Image
                      src={f.produtos.foto}
                      alt={f.produtos.nome}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={12} className="text-espresso/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[0.78rem] font-medium text-espresso truncate group-hover:text-terracota transition-colors">
                    {f.produtos?.nome ?? "—"}
                  </p>
                  <p className="font-sans text-[0.62rem] text-espresso/40">
                    {f.produtos?.produtoras?.nome_marca ?? "—"} · {f.produtos?.preco ? fmtBRL(f.produtos.preco) : "—"}
                  </p>
                </div>

                <Heart size={13} className="text-wine/40 flex-shrink-0" strokeWidth={1.6} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Fidelidade ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <SectionHeading label="Fidelidade" />

        {!fidelidade ? (
          <p className="font-serif text-base text-espresso/30 italic">Sem registro de fidelidade.</p>
        ) : (
          <div className="bg-cream border border-sand px-5 py-5 max-w-md flex flex-col gap-5">
            {/* Barra de selos */}
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 transition-colors flex-shrink-0 ${
                      i < Math.min(fidelidade.selos_atuais, 10) ? "bg-espresso" : "border border-sand"
                    }`}
                  />
                ))}
              </div>
              {fidelidade.elegivel_desconto ? (
                <p className="font-sans text-[0.75rem] text-olive font-medium flex items-center gap-1.5">
                  <Award size={12} />
                  Elegível a desconto de 30% na próxima compra
                </p>
              ) : (
                <p className="font-sans text-[0.72rem] text-espresso/50">
                  {fidelidade.selos_atuais} de 10 selos acumulados
                  {fidelidade.selos_atuais < 10 && (
                    <> — faltam <strong>{10 - fidelidade.selos_atuais}</strong> para o desconto</>
                  )}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-stretch gap-8 pt-4 border-t border-sand">
              <div>
                <span className="font-serif text-2xl text-espresso">{fidelidade.selos_atuais}</span>
                <p className="font-sans text-[0.58rem] tracking-[0.18em] uppercase text-espresso/35 mt-0.5">Selos atuais</p>
              </div>
              <div className="w-px bg-sand" />
              <div>
                <span className="font-serif text-2xl text-espresso">{fidelidade.selos_historico_total}</span>
                <p className="font-sans text-[0.58rem] tracking-[0.18em] uppercase text-espresso/35 mt-0.5">Total histórico</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Preferências ─────────────────────────────────────────────────── */}
      {cliente.preferencias && cliente.preferencias.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeading label="Preferências declaradas" />
          <div className="flex flex-wrap gap-2">
            {cliente.preferencias.map((pref) => (
              <span
                key={pref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand/30 border border-sand font-sans text-[0.68rem] text-espresso/70 font-medium"
              >
                <Tag size={10} className="text-espresso/30" />
                {pref}
              </span>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
