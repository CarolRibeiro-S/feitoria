"use client";

import { useState, useEffect } from "react";
import { DollarSign, Clock, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

interface Produtora { id: string; nome_marca: string }

interface ItemRow {
  pedido_id: string;
  nome_produto: string;
  preco_unitario: number;
  quantidade: number;
}

interface PedidoRow {
  id: string;
  numero: string;
  nome_cliente: string;
  total: number;
  status: string;
  criado_em: string;
}

const STATUS_STYLES: Record<string, string> = {
  pendente:   "text-caramel  bg-caramel/8  border-caramel/20",
  confirmado: "text-olive    bg-olive/8    border-olive/20",
  em_preparo: "text-blue-600 bg-blue-50    border-blue-200",
  entregue:   "text-espresso bg-sand       border-sand",
  cancelado:  "text-wine     bg-wine/8     border-wine/20",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente", confirmado: "Confirmado",
  em_preparo: "Em preparo", entregue: "Entregue", cancelado: "Cancelado",
};

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [produtora, setProdutora] = useState<Produtora | null>(null);
  const [semRegistro, setSemRegistro] = useState(false);

  const [produtosAtivos, setProdutosAtivos] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  const [receita, setReceita] = useState(0);
  const [recentOrders, setRecentOrders] = useState<(PedidoRow & { itens: ItemRow[] })[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── 1. Verifica registro de produtora ─────────────────────────────────
      const { data: prod } = await supabase
        .from("produtoras")
        .select("id, nome_marca")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (!prod) {
        setSemRegistro(true);
        setLoading(false);
        return;
      }
      setProdutora(prod);

      // ── 2. Produtos desta produtora ───────────────────────────────────────
      const [{ data: todosProdutos }, { data: prodAtivos }] = await Promise.all([
        supabase.from("produtos").select("id").eq("produtora_id", user.id),
        supabase.from("produtos").select("id").eq("produtora_id", user.id).eq("disponivel", true),
      ]);

      const productIds = (todosProdutos ?? []).map((p: { id: string }) => p.id);
      setTotalProdutos(productIds.length);
      setProdutosAtivos((prodAtivos ?? []).length);

      if (productIds.length === 0) { setLoading(false); return; }

      // ── 3. Itens de pedido desta produtora ────────────────────────────────
      const { data: itens } = await supabase
        .from("itens_pedido")
        .select("pedido_id, nome_produto, preco_unitario, quantidade")
        .in("produto_id", productIds);

      const pedidoIds = [...new Set((itens ?? []).map((i: ItemRow) => i.pedido_id))];
      if (pedidoIds.length === 0) { setLoading(false); return; }

      // ── 4. Pedidos ────────────────────────────────────────────────────────
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("id, numero, nome_cliente, total, status, criado_em")
        .in("id", pedidoIds)
        .order("criado_em", { ascending: false });

      const pedidoList = (pedidos ?? []) as PedidoRow[];
      const cancelledIds = new Set(pedidoList.filter(p => p.status === "cancelado").map(p => p.id));

      // Receita = soma dos meus itens em pedidos não cancelados
      const receitaCalc = (itens ?? [])
        .filter((i: ItemRow) => !cancelledIds.has(i.pedido_id))
        .reduce((s: number, i: ItemRow) => s + i.preco_unitario * i.quantidade, 0);

      setPedidosPendentes(pedidoList.filter(p => p.status === "pendente").length);
      setReceita(receitaCalc);

      // Montar os últimos 5 com seus itens
      const itensByPedido: Record<string, ItemRow[]> = {};
      (itens ?? []).forEach((i: ItemRow) => {
        if (!itensByPedido[i.pedido_id]) itensByPedido[i.pedido_id] = [];
        itensByPedido[i.pedido_id].push(i);
      });

      setRecentOrders(
        pedidoList.slice(0, 5).map(p => ({ ...p, itens: itensByPedido[p.id] ?? [] }))
      );
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-10">
        <div className="h-12 w-60 bg-sand/40 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-sand/40 animate-pulse" />)}
        </div>
        <div className="h-64 bg-sand/40 animate-pulse" />
      </div>
    );
  }

  if (semRegistro) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-[50vh] text-center">
        <Package size={40} strokeWidth={1.2} className="text-espresso/25" />
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-2xl text-espresso font-normal">Complete seu perfil de produtora</h2>
          <p className="font-sans text-sm text-espresso/55 max-w-xs">
            Antes de usar o painel, precisamos das informações da sua marca.
          </p>
        </div>
        <Link
          href="/dashboard/perfil"
          className="inline-flex items-center gap-2 font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase bg-terracota text-cream px-8 py-4 hover:bg-caramel transition-colors"
        >
          Completar perfil
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const cards = [
    {
      label: "Receita Total",
      value: fmtBRL(receita),
      detail: "seus itens em pedidos ativos",
      icon: DollarSign,
      positive: true,
    },
    {
      label: "Pedidos Pendentes",
      value: String(pedidosPendentes),
      detail: "aguardando confirmação",
      icon: Clock,
      positive: pedidosPendentes === 0,
    },
    {
      label: "Produtos Ativos",
      value: String(produtosAtivos),
      detail: `${totalProdutos - produtosAtivos} inativos`,
      icon: Package,
      positive: true,
    },
  ];

  return (
    <div className="flex flex-col gap-10">

      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
          Painel da Produtora
        </p>
        <h1 className="font-serif text-3xl text-espresso font-normal">
          Olá, {produtora?.nome_marca}
        </h1>
        <p className="font-sans text-sm text-espresso/50 mt-1">
          Aqui está um resumo do seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, detail, icon: Icon, positive }) => (
          <div key={label} className="bg-white border border-sand p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/45 font-semibold">
                {label}
              </span>
              <Icon size={15} strokeWidth={1.6} className="text-espresso/25" />
            </div>
            <div>
              <p className="font-serif text-2xl text-espresso font-normal leading-none">{value}</p>
              <p className={`font-sans text-[0.7rem] mt-1.5 ${positive ? "text-olive" : "text-caramel"}`}>{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-espresso font-normal">Pedidos Recentes</h2>
          <a href="/dashboard/pedidos" className="font-sans text-[0.7rem] text-caramel hover:text-terracota transition-colors tracking-wider uppercase font-semibold">
            Ver todos
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <div className="border border-sand py-16 text-center">
            <p className="font-serif text-lg text-espresso/30 italic">Nenhum pedido ainda.</p>
          </div>
        ) : (
          <div className="border border-sand overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-sand">
                  {["Pedido", "Produto", "Cliente", "Valor", "Status", "Data"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-espresso/35 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/30 transition-colors">
                    <td className="px-4 py-3.5 font-sans text-xs text-espresso/50 whitespace-nowrap">{order.numero}</td>
                    <td className="px-4 py-3.5 font-sans text-sm text-espresso">
                      {order.itens[0]?.nome_produto ?? "—"}
                      {order.itens.length > 1 && (
                        <span className="text-espresso/40 text-xs"> +{order.itens.length - 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-sans text-sm text-espresso/70 whitespace-nowrap">{order.nome_cliente}</td>
                    <td className="px-4 py-3.5 font-sans text-sm text-espresso font-medium whitespace-nowrap">
                      R$ {order.total.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 border ${STATUS_STYLES[order.status] ?? ""}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans text-xs text-espresso/40 whitespace-nowrap">
                      {new Date(order.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
