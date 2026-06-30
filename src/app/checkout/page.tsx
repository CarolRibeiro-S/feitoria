"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Truck, Check, ChevronLeft, Loader2, Plus, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-client";
import { criarPedido } from "@/app/actions/checkout";
import { criarPreferencia } from "@/app/actions/payment";
import { validarCupom } from "@/app/actions/fidelidade";
import type { CupomValido } from "@/app/actions/fidelidade";
import { mergeCrossSellHints } from "@/lib/cross-sell-map";

type CrossSellProduct = {
  id: string;
  nome: string;
  preco: number;
  foto: string | null;
  categoria: string;
  produtoras: { nome_marca: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FRETE = 15.0;
const PEDIDO_MINIMO = 45;
const LOCAIS_RETIRADA = ["Jardim Botânico", "SQS 204", "Águas Claras"];
const ALL_HORARIOS = Array.from({ length: 17 }, (_, i) => {
  const mins = 600 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

function getHorariosDisponiveis(dataSelecionada: string): string[] {
  if (!dataSelecionada) return ALL_HORARIOS;
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  // If date is today, filter out times already past (+ 1h minimum lead time)
  if (dataSelecionada === todayStr) {
    const cutoffMins = today.getHours() * 60 + today.getMinutes() + 60;
    return ALL_HORARIOS.filter((h) => {
      const [hh, mm] = h.split(":").map(Number);
      return hh * 60 + mm > cutoffMins;
    });
  }
  return ALL_HORARIOS;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}


// ─── Step indicator ───────────────────────────────────────────────────────────

const ETAPAS = ["Identificação", "Entrega", "Pagamento"] as const;

function StepIndicator({ etapa }: { etapa: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {ETAPAS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const done = etapa > step;
        const active = etapa === step;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 flex items-center justify-center flex-shrink-0 transition-colors ${
                  done
                    ? "bg-espresso"
                    : active
                    ? "bg-terracota"
                    : "border border-sand bg-cream"
                }`}
              >
                {done ? (
                  <Check size={13} className="text-cream" strokeWidth={2.5} />
                ) : (
                  <span
                    className={`font-sans text-[0.7rem] font-semibold ${
                      active ? "text-cream" : "text-espresso/30"
                    }`}
                  >
                    {step}
                  </span>
                )}
              </div>
              <span
                className={`font-sans text-[0.72rem] font-medium tracking-wide hidden sm:block ${
                  active ? "text-espresso" : "text-espresso/40"
                }`}
              >
                {label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? "bg-espresso/30" : "bg-sand"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";
const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, addItem } = useCart();

  // Auth
  const [userId, setUserId] = useState<string | null>(null);

  // Navigation
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [erro, setErro] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  // Step 1 — Identificação
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  // Step 2 — Entrega
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">("entrega");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [horaRetirada, setHoraRetirada] = useState("");
  const [localRetirada, setLocalRetirada] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>(ALL_HORARIOS);

  // Recalculate available times whenever the selected date changes
  useEffect(() => {
    setHorariosDisponiveis(getHorariosDisponiveis(dataRetirada));
    setHoraRetirada("");
  }, [dataRetirada]);

  // Minimum selectable date: tomorrow (orders need at least 1 day lead time)
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Cross-sell
  const [checkoutCrossSell, setCheckoutCrossSell] = useState<CrossSellProduct[]>([]);

  // Fidelidade
  const [progressoFidelidade, setProgressoFidelidade] = useState<{
    selos_atuais: number;
    elegivel_desconto: boolean;
  } | null>(null);
  const [aplicarDescontoFidelidade, setAplicarDescontoFidelidade] = useState(false);
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomValido | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);

  const frete = tipoEntrega === "entrega" ? FRETE : 0;

  // Discount calculations (derived)
  const descontoFidelidade =
    aplicarDescontoFidelidade && progressoFidelidade?.elegivel_desconto
      ? Math.round(subtotal * 0.3 * 100) / 100
      : 0;
  const subtotalAposFidelidade = subtotal - descontoFidelidade;
  const descontoCupom = cupomAplicado
    ? Math.round(subtotalAposFidelidade * (cupomAplicado.percentual_desconto / 100) * 100) / 100
    : 0;
  const subtotalFinal = subtotalAposFidelidade - descontoCupom;
  const total = subtotalFinal + frete;

  // Pre-fill logged-in user data
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setNome(user.user_metadata?.nome ?? "");
        setEmail(user.email ?? "");
      }
    });
  }, []);

  // Fetch loyalty progress when user is known
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("progresso_fidelidade")
      .select("selos_atuais, elegivel_desconto")
      .eq("usuario_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setProgressoFidelidade(data as { selos_atuais: number; elegivel_desconto: boolean });
      });
  }, [userId]);

  // Fetch cross-sell suggestions when entering Step 3
  useEffect(() => {
    if (etapa !== 3 || items.length === 0) return;

    async function fetchCheckoutCrossSell() {
      const cartIds = items.map((i) => i.id);

      let itemsWithCat: { name: string; categoria: string }[] = items
        .filter((i) => !!i.categoria)
        .map((i) => ({ name: i.name, categoria: i.categoria! }));

      if (itemsWithCat.length === 0) {
        const { data: meta } = await supabase
          .from("produtos")
          .select("id, nome, categoria")
          .in("id", cartIds);
        if (!meta) return;
        const m = new Map(meta.map((p) => [p.id, { name: p.nome, categoria: p.categoria }]));
        itemsWithCat = cartIds.map((id) => m.get(id)).filter(Boolean) as { name: string; categoria: string }[];
      }

      const { categories, priorityFilter } = mergeCrossSellHints(itemsWithCat);
      if (categories.length === 0) return;

      const { data: candidates } = await supabase
        .from("produtos")
        .select("id, nome, preco, foto, categoria, produtoras(nome_marca)")
        .in("categoria", categories)
        .eq("disponivel", true)
        .limit(9);

      if (!candidates) return;

      const cartIdSet = new Set(cartIds);
      let filtered = candidates.filter((p) => !cartIdSet.has(p.id));

      if (priorityFilter) {
        const pf = priorityFilter.toLowerCase();
        filtered = [
          ...filtered.filter((p) => p.nome.toLowerCase().includes(pf)),
          ...filtered.filter((p) => !p.nome.toLowerCase().includes(pf)),
        ];
      }

      setCheckoutCrossSell(filtered.slice(0, 3) as unknown as CrossSellProduct[]);
    }

    fetchCheckoutCrossSell();
  }, [etapa]);

  // ── CEP lookup ──────────────────────────────────────────────────────────────
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
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch {
      // ViaCEP indisponível — usuário preenche manualmente
    } finally {
      setCepLoading(false);
    }
  }

  // ── Cupom ───────────────────────────────────────────────────────────────────
  async function handleAplicarCupom() {
    if (!userId || !cupomCodigo.trim()) return;
    setCupomErro("");
    setCupomLoading(true);
    try {
      const result = await validarCupom(cupomCodigo, userId);
      if (result) {
        setCupomAplicado(result);
      } else {
        setCupomErro("Cupom inválido, expirado ou já utilizado.");
      }
    } catch {
      setCupomErro("Não foi possível validar o cupom. Tente novamente.");
    } finally {
      setCupomLoading(false);
    }
  }

  function handleRemoverCupom() {
    setCupomAplicado(null);
    setCupomCodigo("");
    setCupomErro("");
  }

  // ── Step handlers ───────────────────────────────────────────────────────────
  function handleContinuar1(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      setErro("Preencha nome e email para continuar.");
      return;
    }
    setErro("");
    setEtapa(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleContinuar2(e: React.FormEvent) {
    e.preventDefault();
    if (subtotal < PEDIDO_MINIMO) {
      setErro(`Pedido mínimo de R$ 45,00 (sem considerar o frete). Adicione mais R$ ${fmt(PEDIDO_MINIMO - subtotal)} para continuar.`);
      return;
    }
    if (tipoEntrega === "entrega" && (!cep || !rua || !numero)) {
      setErro("Preencha o endereço completo para continuar.");
      return;
    }
    if (tipoEntrega === "retirada" && !localRetirada) {
      setErro("Selecione um ponto de retirada.");
      return;
    }
    if (tipoEntrega === "retirada" && !dataRetirada) {
      setErro("Selecione uma data para retirada.");
      return;
    }
    setErro("");
    setEtapa(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePagarComMP() {
    setErro("");
    setFinalizando(true);
    try {
      // 1. Persist order to DB
      const numeroPedido = await criarPedido({
        usuario_id: userId,
        nome_cliente: nome,
        email_cliente: email,
        cpf_cliente: cpf,
        tipo_entrega: tipoEntrega,
        cep,
        endereco: rua,
        numero_endereco: numero,
        complemento,
        bairro: tipoEntrega === "retirada" ? localRetirada : bairro,
        cidade,
        estado,
        data_retirada: dataRetirada,
        hora_retirada: horaRetirada,
        forma_pagamento: "pix",
        subtotal: subtotalFinal,
        frete,
        total,
        itens: items.map((item) => ({
          produto_id: item.id,
          nome_produto: item.name,
          produtor: item.producer,
          preco_unitario: item.price,
          quantidade: item.quantity,
        })),
        desconto_fidelidade_usado: aplicarDescontoFidelidade && !!progressoFidelidade?.elegivel_desconto,
        cupom_codigo: cupomAplicado?.codigo ?? null,
      });

      // 2. Save order snapshot for the confirmation page
      localStorage.setItem(
        "feitoria-last-order",
        JSON.stringify({ numero: numeroPedido, items, subtotal: subtotalFinal, frete, total })
      );

      // 3. Create MP preference
      const prefResult = await criarPreferencia({
        numeroPedido,
        items: items.map((item) => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        emailCliente: email,
        total,
      });

      if (!prefResult.ok) {
        setErro("Erro ao conectar com o Mercado Pago. Tente novamente.");
        setFinalizando(false);
        return;
      }

      // 4. Clear cart and redirect to MP Checkout
      clearCart();
      window.location.href = prefResult.init_point;
    } catch (err) {
      console.error("[Checkout] Erro ao finalizar:", err);
      setErro("Erro ao finalizar pedido. Tente novamente.");
      setFinalizando(false);
    }
  }

  // ── Empty cart guard ────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="bg-cream min-h-[60vh] flex flex-col items-center justify-center gap-6 px-5">
        <p className="font-serif text-2xl text-espresso/50 font-normal">Seu carrinho está vazio.</p>
        <a
          href="/produtos"
          className="font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase border border-espresso/30 text-espresso px-8 py-4 hover:border-espresso transition-colors"
        >
          Ver produtos
        </a>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 lg:py-14">

        {/* Page title */}
        <div className="mb-8">
          <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
            Compra segura
          </p>
          <h1 className="font-serif text-3xl text-espresso font-normal">Checkout</h1>
        </div>

        <StepIndicator etapa={etapa} />

        {/* ── ETAPA 1 — Identificação ──────────────────────────────────────── */}
        {etapa === 1 && (
          <form onSubmit={handleContinuar1} className="max-w-lg flex flex-col gap-5">
            <div className="flex flex-col gap-1 mb-2">
              <h2 className="font-serif text-xl text-espresso font-normal">Identificação</h2>
              {userId && (
                <p className="font-sans text-xs text-olive">
                  Dados carregados da sua conta.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="nome" className={labelCls}>Nome completo</label>
              <input
                id="nome"
                type="text"
                autoComplete="name"
                placeholder="Seu nome completo"
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
              <label htmlFor="cpf" className={labelCls}>CPF</label>
              <input
                id="cpf"
                type="text"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className={inputCls}
              />
            </div>

            {erro && <p className="font-sans text-[0.78rem] text-wine border border-wine/30 px-4 py-3">{erro}</p>}

            <button
              type="submit"
              className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-2 hover:bg-caramel transition-colors"
            >
              Continuar
            </button>
          </form>
        )}

        {/* ── ETAPA 2 — Entrega ────────────────────────────────────────────── */}
        {etapa === 2 && (
          <form onSubmit={handleContinuar2} className="max-w-lg flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => setEtapa(1)} className="text-espresso/40 hover:text-espresso transition-colors">
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-serif text-xl text-espresso font-normal">Entrega</h2>
            </div>

            {/* Toggle tipo */}
            <div className="grid grid-cols-2 gap-3">
              {(["entrega", "retirada"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoEntrega(tipo)}
                  className={`flex items-center justify-center gap-2.5 py-4 border transition-colors font-sans text-[0.72rem] font-semibold tracking-[0.15em] uppercase ${
                    tipoEntrega === tipo
                      ? "border-espresso bg-espresso text-cream"
                      : "border-sand text-espresso/50 hover:border-espresso/30 hover:text-espresso/80"
                  }`}
                >
                  {tipo === "entrega" ? <Truck size={15} strokeWidth={1.6} /> : <MapPin size={15} strokeWidth={1.6} />}
                  {tipo === "entrega" ? "Entrega" : "Retirada"}
                </button>
              ))}
            </div>

            {/* Entrega fields */}
            {tipoEntrega === "entrega" && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="cep" className={labelCls}>
                    CEP
                    {cepLoading && <Loader2 size={11} className="inline ml-2 animate-spin text-caramel" />}
                  </label>
                  <input
                    id="cep"
                    type="text"
                    placeholder="00000-000"
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
                    <label htmlFor="rua" className={labelCls}>Rua / Logradouro</label>
                    <input
                      id="rua"
                      type="text"
                      placeholder="Nome da rua"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-28">
                    <label htmlFor="numero" className={labelCls}>Número</label>
                    <input
                      id="numero"
                      type="text"
                      placeholder="Nº"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="complemento" className={labelCls}>Complemento <span className="normal-case tracking-normal font-normal text-espresso/35">(opcional)</span></label>
                  <input
                    id="complemento"
                    type="text"
                    placeholder="Apto, bloco, referência..."
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col gap-2 flex-1">
                    <label htmlFor="bairro" className={labelCls}>Bairro</label>
                    <input id="bairro" type="text" placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-2 w-16">
                    <label htmlFor="estado" className={labelCls}>UF</label>
                    <input id="estado" type="text" placeholder="SP" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} className={inputCls} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="cidade" className={labelCls}>Cidade</label>
                  <input id="cidade" type="text" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputCls} />
                </div>

                {/* Frete mockado */}
                <div className="flex items-center justify-between py-3 border-y border-sand">
                  <span className="font-sans text-sm text-espresso/60">Frete estimado</span>
                  <span className="font-sans text-sm text-espresso font-medium">R$ {fmt(FRETE)}</span>
                </div>
              </>
            )}

            {/* Retirada fields */}
            {tipoEntrega === "retirada" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Ponto de retirada</label>
                  <div className="flex flex-col gap-2">
                    {LOCAIS_RETIRADA.map((local) => (
                      <label
                        key={local}
                        className={`flex items-center gap-3 px-4 py-3.5 border cursor-pointer transition-colors ${
                          localRetirada === local
                            ? "border-espresso bg-sand/30"
                            : "border-sand hover:border-espresso/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="local-retirada"
                          value={local}
                          checked={localRetirada === local}
                          onChange={() => setLocalRetirada(local)}
                          className="accent-espresso"
                        />
                        <span className="font-sans text-sm text-espresso">{local}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="data-retirada" className={labelCls}>Data</label>
                    <input
                      id="data-retirada"
                      type="date"
                      required
                      min={minDate}
                      value={dataRetirada}
                      onChange={(e) => setDataRetirada(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="hora-retirada" className={labelCls}>Horário</label>
                    <select
                      id="hora-retirada"
                      value={horaRetirada}
                      onChange={(e) => setHoraRetirada(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Selecione</option>
                      {horariosDisponiveis.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-y border-sand">
                  <span className="font-sans text-sm text-espresso/60">Frete</span>
                  <span className="font-sans text-sm text-olive font-medium">Grátis</span>
                </div>
              </>
            )}

            {erro && <p className="font-sans text-[0.78rem] text-wine border border-wine/30 px-4 py-3">{erro}</p>}

            <button
              type="submit"
              className="w-full bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 mt-1 hover:bg-caramel transition-colors"
            >
              Continuar
            </button>
          </form>
        )}

        {/* ── ETAPA 3 — Pagamento ──────────────────────────────────────────── */}
        {etapa === 3 && (
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-10">

            {/* Left: discounts + payment */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEtapa(2)} className="text-espresso/40 hover:text-espresso transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <h2 className="font-serif text-xl text-espresso font-normal">Pagamento</h2>
              </div>

              {/* ── Banner fidelidade ── */}
              {userId && progressoFidelidade?.elegivel_desconto && (
                <div className="border border-olive/25 bg-olive/5 px-5 py-4 flex flex-col gap-3">
                  <div>
                    <p className="font-sans text-[0.58rem] tracking-[0.28em] uppercase text-olive font-semibold mb-0.5">
                      Fidelidade FEITORIA
                    </p>
                    <p className="font-sans text-sm text-espresso">
                      Você acumulou 10 selos. Use 30% de desconto nesta compra.
                    </p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aplicarDescontoFidelidade}
                      onChange={(e) => setAplicarDescontoFidelidade(e.target.checked)}
                      className="accent-espresso w-4 h-4"
                    />
                    <span className="font-sans text-sm text-espresso">
                      Aplicar desconto de 30%{" "}
                      <span className="text-olive">
                        (−R$ {fmt(subtotal * 0.3)})
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {/* ── Cupom de desconto ── */}
              {userId && (
                <div className="flex flex-col gap-2">
                  <label className={labelCls}>
                    Cupom de desconto{" "}
                    <span className="normal-case tracking-normal font-normal text-espresso/35">(opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite seu código"
                      value={cupomCodigo}
                      onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                      className={`${inputCls} flex-1`}
                      disabled={!!cupomAplicado}
                    />
                    {!cupomAplicado ? (
                      <button
                        type="button"
                        onClick={handleAplicarCupom}
                        disabled={cupomLoading || !cupomCodigo.trim()}
                        className="flex-shrink-0 px-4 py-3 border border-espresso/30 text-espresso font-sans text-[0.7rem] font-semibold hover:border-espresso transition-colors disabled:opacity-40"
                      >
                        {cupomLoading ? <Loader2 size={13} className="animate-spin" /> : "Aplicar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRemoverCupom}
                        className="flex-shrink-0 px-4 py-3 border border-wine/30 text-wine font-sans text-[0.7rem] font-semibold hover:border-wine transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  {cupomErro && (
                    <p className="font-sans text-[0.75rem] text-wine">{cupomErro}</p>
                  )}
                  {cupomAplicado && (
                    <p className="font-sans text-[0.75rem] text-olive">
                      Cupom <span className="font-semibold">{cupomAplicado.codigo}</span> aplicado —{" "}
                      {cupomAplicado.percentual_desconto}% de desconto (−R$ {fmt(descontoCupom)})
                    </p>
                  )}
                </div>
              )}

              {/* Pagamento via Mercado Pago */}
              <div className="flex flex-col gap-3">
                <p className="font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold">
                  Método de pagamento
                </p>
                <div className="bg-sand/30 border border-sand px-5 py-4 flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="12" fill="#009EE3" />
                    <path d="M6 13.5h3.5l1-3h4l1 3H19" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="font-sans text-[0.82rem] font-semibold text-espresso">Mercado Pago</p>
                    <p className="font-sans text-[0.68rem] text-espresso/45">
                      Pix, cartão de crédito/débito, boleto e mais.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Cross-sell suggestions ── */}
              {(() => {
                const cartIdSet = new Set(items.map((i) => i.id));
                const visibleCrossSell = checkoutCrossSell.filter((p) => !cartIdSet.has(p.id));
                if (visibleCrossSell.length === 0) return null;
                return (
                  <div className="border-t border-sand pt-5 flex flex-col gap-4">
                    <p className="font-sans text-[0.58rem] tracking-[0.28em] uppercase text-caramel font-semibold">
                      Você também pode gostar
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {visibleCrossSell.map((produto) => (
                        <div
                          key={produto.id}
                          className="flex items-center gap-3 border border-sand/60 bg-sand/15 px-3 py-2.5"
                        >
                          <div className="w-11 h-11 bg-beige flex-shrink-0 overflow-hidden relative flex items-center justify-center">
                            {produto.foto ? (
                              <Image
                                src={produto.foto}
                                alt={produto.nome}
                                fill
                                className="object-cover"
                                sizes="44px"
                              />
                            ) : (
                              <ImageIcon size={14} className="text-espresso/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-[0.75rem] font-medium text-espresso leading-snug truncate">
                              {produto.nome}
                            </p>
                            <p className="font-sans text-[0.62rem] text-espresso/40 truncate">
                              {produto.produtoras.nome_marca}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <span className="font-serif text-sm text-espresso">
                              R$ {produto.preco.toFixed(2).replace(".", ",")}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                addItem({
                                  id: produto.id,
                                  name: produto.nome,
                                  producer: produto.produtoras.nome_marca,
                                  price: produto.preco,
                                  quantity: 1,
                                  image: produto.foto,
                                  categoria: produto.categoria,
                                })
                              }
                              aria-label={`Adicionar ${produto.nome} ao pedido`}
                              className="w-7 h-7 bg-espresso text-cream flex items-center justify-center hover:bg-terracota transition-colors"
                            >
                              <Plus size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {erro && <p className="font-sans text-[0.78rem] text-wine border border-wine/30 px-4 py-3">{erro}</p>}

              <button
                type="button"
                onClick={handlePagarComMP}
                disabled={finalizando}
                style={{ backgroundColor: finalizando ? "#007ab5" : "#009EE3" }}
                className="w-full text-white font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
              >
                {finalizando && <Loader2 size={14} className="animate-spin" />}
                {finalizando ? "Redirecionando..." : "Pagar com Mercado Pago"}
              </button>
            </div>

            {/* Right: order summary */}
            <div className="flex flex-col gap-4 order-first lg:order-last">
              <h3 className="font-serif text-lg text-espresso font-normal">Resumo do pedido</h3>

              <div className="border border-sand flex flex-col">
                {/* Items */}
                <div className="flex flex-col divide-y divide-sand">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-10 h-10 bg-beige flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[0.8rem] text-espresso leading-snug truncate">{item.name}</p>
                        <p className="font-sans text-[0.7rem] text-espresso/45">{item.producer}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-sans text-[0.78rem] text-espresso font-medium">
                          R$ {fmt(item.price * item.quantity)}
                        </p>
                        <p className="font-sans text-[0.65rem] text-espresso/40">× {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-sand px-4 py-3 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-sans text-xs text-espresso/55">Subtotal</span>
                    <span className="font-sans text-xs text-espresso">R$ {fmt(subtotal)}</span>
                  </div>
                  {descontoFidelidade > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-olive">Desconto fidelidade (30%)</span>
                      <span className="font-sans text-xs text-olive">−R$ {fmt(descontoFidelidade)}</span>
                    </div>
                  )}
                  {descontoCupom > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-olive">
                        Cupom ({cupomAplicado?.percentual_desconto}%)
                      </span>
                      <span className="font-sans text-xs text-olive">−R$ {fmt(descontoCupom)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-sans text-xs text-espresso/55">Frete</span>
                    <span className={`font-sans text-xs ${frete === 0 ? "text-olive" : "text-espresso"}`}>
                      {frete === 0 ? "Grátis" : `R$ ${fmt(frete)}`}
                    </span>
                  </div>
                </div>
                <div className="border-t border-sand px-4 py-3 flex justify-between items-center bg-sand/30">
                  <span className="font-sans text-sm text-espresso font-semibold">Total</span>
                  <span className="font-serif text-lg text-espresso">R$ {fmt(total)}</span>
                </div>
              </div>

              {/* Delivery summary */}
              <div className="bg-sand/40 border border-sand px-4 py-3 flex flex-col gap-1">
                <p className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-espresso/40 font-semibold mb-1">
                  {tipoEntrega === "entrega" ? "Entrega em" : "Retirada em"}
                </p>
                {tipoEntrega === "entrega" ? (
                  <p className="font-sans text-xs text-espresso/70">
                    {rua}{numero ? `, ${numero}` : ""}{complemento ? ` (${complemento})` : ""}<br />
                    {bairro}{cidade ? ` · ${cidade}` : ""}{estado ? `, ${estado}` : ""}
                  </p>
                ) : (
                  <p className="font-sans text-xs text-espresso/70">
                    {localRetirada}<br />
                    {dataRetirada && <>em {new Date(dataRetirada + "T12:00").toLocaleDateString("pt-BR")} {horaRetirada && `às ${horaRetirada}`}</>}
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
