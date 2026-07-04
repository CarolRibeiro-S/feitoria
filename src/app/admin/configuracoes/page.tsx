"use client";

import { useState, useEffect } from "react";
import { Building2, Sliders, Tag, ShieldCheck, UserPlus, Check, AlertCircle, Loader2, X, Gift } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const CATEGORIAS = ["Confeitaria", "Cookies", "Padaria", "Cafés", "Empório", "Bebidas", "Congelados", "Kits"];

type Configs        = Record<string, string>;
type Admin          = { id: string; nome: string | null; email: string };
type FeedbackState  = "idle" | "saving" | "ok" | "err";
type PromoState     = "idle" | "loading" | "ok" | "notfound" | "err";
type InteresseKit   = { id: string; nome: string; email: string; criado_em: string; notificado: boolean };

const inputCls =
  "bg-cream border border-sand px-4 py-2.5 font-sans text-[0.82rem] text-espresso outline-none focus:border-espresso/45 transition-colors placeholder:text-espresso/25 w-full";

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-cream border border-sand shadow-sm">
      <div className="px-6 py-5 border-b border-sand flex items-center gap-3">
        <Icon size={15} className="text-espresso/40" strokeWidth={1.8} />
        <h3 className="font-sans text-[0.72rem] tracking-[0.22em] uppercase text-espresso/55 font-bold">
          {title}
        </h3>
      </div>
      <div className="px-6 py-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-sans text-[0.65rem] tracking-[0.2em] uppercase text-espresso/50 font-semibold">
        {label}
      </label>
      {children}
      {note && (
        <p className="font-sans text-[0.62rem] text-espresso/35 leading-relaxed">{note}</p>
      )}
    </div>
  );
}

function SaveButton({
  status,
  onClick,
}: {
  status: FeedbackState;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        onClick={onClick}
        disabled={status === "saving"}
        className="px-5 py-2.5 bg-espresso text-cream font-sans text-[0.75rem] font-semibold tracking-[0.1em] uppercase hover:bg-espresso/85 transition-colors disabled:opacity-50"
      >
        {status === "saving" && <Loader2 size={13} className="animate-spin inline mr-2" />}
        Salvar
      </button>
      {status === "ok" && (
        <span className="flex items-center gap-1.5 font-sans text-[0.7rem] text-olive">
          <Check size={13} /> Salvo
        </span>
      )}
      {status === "err" && (
        <span className="flex items-center gap-1.5 font-sans text-[0.7rem] text-terracota">
          <AlertCircle size={13} /> Erro ao salvar
        </span>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ConfiguracoesPage() {
  const [loading,       setLoading]       = useState(true);
  const [currentId,     setCurrentId]     = useState<string | null>(null);
  const [admins,        setAdmins]        = useState<Admin[]>([]);
  const [interessados,  setInteressados]  = useState<InteresseKit[]>([]);

  // Section state
  const [empresa,  setEmpresa]  = useState({ nome_empresa: "", cnpj: "", razao_social: "" });
  const [negocio,  setNegocio]  = useState({ comissao_padrao: "", pedido_minimo: "" });

  // Per-section save feedback
  const [stEmpresa, setStEmpresa] = useState<FeedbackState>("idle");
  const [stNegocio, setStNegocio] = useState<FeedbackState>("idle");

  // Promote admin
  const [promoEmail,  setPromoEmail]  = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoState>("idle");
  const [promoNome,   setPromoNome]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [cfgsRes, admsRes, kitsRes, { data: { user } }] = await Promise.all([
        supabase.from("configuracoes").select("chave, valor"),
        supabase.from("usuarios").select("id, nome, email").eq("tipo", "admin").order("nome"),
        supabase.from("interesse_kits").select("id, nome, email, criado_em, notificado").order("criado_em", { ascending: false }),
        supabase.auth.getUser(),
      ]);

      const map: Configs = {};
      for (const c of (cfgsRes.data ?? []) as { chave: string; valor: string | null }[]) {
        map[c.chave] = c.valor ?? "";
      }

      setEmpresa({
        nome_empresa:  map.nome_empresa  ?? "",
        cnpj:          map.cnpj          ?? "",
        razao_social:  map.razao_social  ?? "",
      });
      setNegocio({
        comissao_padrao: map.comissao_padrao ?? "18",
        pedido_minimo:   map.pedido_minimo   ?? "45",
      });
      setAdmins((admsRes.data ?? []) as Admin[]);
      setInteressados((kitsRes.data ?? []) as InteresseKit[]);
      setCurrentId(user?.id ?? null);
      setLoading(false);
    }
    load();
  }, []);

  async function upsertConfigs(pairs: Record<string, string>, setStatus: (s: FeedbackState) => void) {
    setStatus("saving");
    const rows = Object.entries(pairs).map(([chave, valor]) => ({
      chave,
      valor,
      atualizado_em: new Date().toISOString(),
    }));
    const { error } = await supabase.from("configuracoes").upsert(rows, { onConflict: "chave" });
    setStatus(error ? "err" : "ok");
    if (!error) setTimeout(() => setStatus("idle"), 3000);
  }

  async function promoverAdmin() {
    const email = promoEmail.trim().toLowerCase();
    if (!email) return;
    setPromoStatus("loading");
    setPromoNome(null);

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, tipo")
      .eq("email", email)
      .single();

    if (error || !data) { setPromoStatus("notfound"); return; }

    if ((data as any).tipo === "admin") {
      setPromoNome((data as any).nome);
      setPromoStatus("ok");
      return;
    }

    const { error: upErr } = await supabase
      .from("usuarios")
      .update({ tipo: "admin" })
      .eq("id", (data as any).id);

    if (upErr) { setPromoStatus("err"); return; }

    const newAdmin = { id: (data as any).id, nome: (data as any).nome, email };
    setAdmins((prev) =>
      [...prev, newAdmin].sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""))
    );
    setPromoNome((data as any).nome);
    setPromoStatus("ok");
    setPromoEmail("");
    setTimeout(() => setPromoStatus("idle"), 4000);
  }

  async function toggleNotificado(id: string, atual: boolean) {
    const { error } = await supabase
      .from("interesse_kits")
      .update({ notificado: !atual })
      .eq("id", id);
    if (!error) {
      setInteressados((prev) =>
        prev.map((r) => (r.id === id ? { ...r, notificado: !atual } : r))
      );
    }
  }

  async function revogarAdmin(adminId: string) {
    if (adminId === currentId) return;
    const { error } = await supabase
      .from("usuarios")
      .update({ tipo: "cliente" })
      .eq("id", adminId);
    if (!error) setAdmins((prev) => prev.filter((a) => a.id !== adminId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sand border-t-espresso/40 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* ── Dados da Empresa ──────────────────────────────────────────────── */}
      <SectionCard title="Dados da Empresa" icon={Building2}>
        <Field label="Nome da empresa">
          <input
            className={inputCls}
            value={empresa.nome_empresa}
            onChange={(e) => setEmpresa((p) => ({ ...p, nome_empresa: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="CNPJ">
            <input
              className={inputCls}
              placeholder="00.000.000/0001-00"
              value={empresa.cnpj}
              onChange={(e) => setEmpresa((p) => ({ ...p, cnpj: e.target.value }))}
            />
          </Field>
          <Field label="Razão Social">
            <input
              className={inputCls}
              value={empresa.razao_social}
              onChange={(e) => setEmpresa((p) => ({ ...p, razao_social: e.target.value }))}
            />
          </Field>
        </div>
        <SaveButton
          status={stEmpresa}
          onClick={() => upsertConfigs(empresa, setStEmpresa)}
        />
      </SectionCard>

      {/* ── Regras de Negócio ─────────────────────────────────────────────── */}
      <SectionCard title="Regras de Negócio" icon={Sliders}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Comissão da plataforma (%)"
            note="Percentual retido pela FEITORIA sobre cada venda."
          >
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className={inputCls + " pr-8"}
                value={negocio.comissao_padrao}
                onChange={(e) => setNegocio((p) => ({ ...p, comissao_padrao: e.target.value }))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[0.75rem] text-espresso/35 pointer-events-none">
                %
              </span>
            </div>
          </Field>
          <Field
            label="Pedido mínimo (R$)"
            note="Valor mínimo de pedido, sem considerar o frete."
          >
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls + " pr-10"}
                value={negocio.pedido_minimo}
                onChange={(e) => setNegocio((p) => ({ ...p, pedido_minimo: e.target.value }))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[0.75rem] text-espresso/35 pointer-events-none">
                R$
              </span>
            </div>
          </Field>
        </div>
        <p className="font-sans text-[0.65rem] text-espresso/35 leading-relaxed border-l-2 border-sand pl-3">
          Alterar esses valores não afeta pedidos já realizados, apenas os futuros.
        </p>
        <SaveButton
          status={stNegocio}
          onClick={() => upsertConfigs(negocio, setStNegocio)}
        />
      </SectionCard>

      {/* ── Categorias ────────────────────────────────────────────────────── */}
      <SectionCard title="Categorias de Produtos" icon={Tag}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1.5 bg-sand/30 border border-sand font-sans text-[0.72rem] text-espresso/60 tracking-wide"
            >
              {cat}
            </span>
          ))}
        </div>
        <p className="font-sans text-[0.62rem] text-espresso/30 leading-relaxed">
          As categorias são definidas no código-fonte. Para adicionar ou remover, contate o desenvolvedor.
        </p>
      </SectionCard>

      {/* ── Administradores ───────────────────────────────────────────────── */}
      <SectionCard title="Administradores" icon={ShieldCheck}>

        {/* Lista atual */}
        <div className="flex flex-col divide-y divide-sand/50">
          {admins.length === 0 && (
            <p className="font-sans text-[0.75rem] text-espresso/30 italic">
              Nenhum administrador encontrado.
            </p>
          )}
          {admins.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-[0.82rem] font-medium text-espresso">
                  {a.nome ?? (
                    <span className="italic text-espresso/35">sem nome</span>
                  )}
                  {a.id === currentId && (
                    <span className="ml-2 text-[0.58rem] tracking-[0.15em] uppercase font-semibold text-olive/70 bg-olive/10 px-1.5 py-0.5">
                      você
                    </span>
                  )}
                </span>
                <span className="font-sans text-[0.72rem] text-espresso/40">{a.email}</span>
              </div>

              {a.id !== currentId && (
                <button
                  onClick={() => revogarAdmin(a.id)}
                  className="flex items-center gap-1.5 font-sans text-[0.68rem] text-espresso/30 hover:text-terracota transition-colors"
                >
                  <X size={12} />
                  Revogar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Promover novo admin */}
        <div className="border-t border-sand pt-5 flex flex-col gap-3">
          <p className="font-sans text-[0.65rem] tracking-[0.18em] uppercase text-espresso/40 font-semibold flex items-center gap-2">
            <UserPlus size={13} className="text-espresso/30" />
            Promover usuário a administrador
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="email@exemplo.com"
              className={inputCls}
              value={promoEmail}
              onChange={(e) => {
                setPromoEmail(e.target.value);
                setPromoStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && promoEmail.trim() && promoverAdmin()}
            />
            <button
              onClick={promoverAdmin}
              disabled={!promoEmail.trim() || promoStatus === "loading"}
              className="px-5 py-2.5 bg-espresso text-cream font-sans text-[0.75rem] font-semibold tracking-[0.1em] uppercase hover:bg-espresso/85 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {promoStatus === "loading" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                "Tornar admin"
              )}
            </button>
          </div>

          {promoStatus === "ok" && (
            <p className="font-sans text-[0.7rem] text-olive flex items-center gap-1.5">
              <Check size={13} />
              {promoNome ?? promoEmail} agora é administrador.
            </p>
          )}
          {promoStatus === "notfound" && (
            <p className="font-sans text-[0.7rem] text-terracota flex items-center gap-1.5">
              <AlertCircle size={13} />
              Nenhum usuário encontrado com esse e-mail.
            </p>
          )}
          {promoStatus === "err" && (
            <p className="font-sans text-[0.7rem] text-terracota flex items-center gap-1.5">
              <AlertCircle size={13} />
              Erro ao atualizar. Tente novamente.
            </p>
          )}
        </div>
      </SectionCard>

      {/* ── Interessados em Kits ──────────────────────────────────────────── */}
      <SectionCard title="Interessados em Kits" icon={Gift}>

        <p className="font-sans text-[0.75rem] text-espresso/50">
          {interessados.length === 0
            ? "Nenhum registro ainda."
            : `${interessados.length} ${interessados.length === 1 ? "pessoa aguardando" : "pessoas aguardando"} o lançamento dos kits.`}
        </p>

        {interessados.length > 0 && (
          <div className="flex flex-col divide-y divide-sand/50">
            {interessados.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-sans text-[0.82rem] font-medium text-espresso truncate">
                    {r.nome}
                  </span>
                  <span className="font-sans text-[0.72rem] text-espresso/40 truncate">
                    {r.email}
                  </span>
                  <span className="font-sans text-[0.62rem] text-espresso/30">
                    {new Date(r.criado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                </div>

                <button
                  onClick={() => toggleNotificado(r.id, r.notificado)}
                  title={r.notificado ? "Marcar como não notificado" : "Marcar como notificado"}
                  className={`flex items-center gap-1.5 flex-shrink-0 font-sans text-[0.68rem] font-semibold tracking-wide transition-colors ${
                    r.notificado ? "text-olive" : "text-espresso/25 hover:text-espresso/60"
                  }`}
                >
                  <div
                    className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${
                      r.notificado ? "bg-olive border-olive" : "border-espresso/25 hover:border-espresso/50"
                    }`}
                  >
                    {r.notificado && <Check size={10} strokeWidth={2.5} className="text-cream" />}
                  </div>
                  {r.notificado ? "Notificado" : "Notificar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
}
