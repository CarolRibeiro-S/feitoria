import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// POST /api/carrinhos-abandonados
// Called from the browser (cart-context) when the user becomes inactive
// or closes the tab. Uses service role to bypass RLS.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { usuario_id, session_id, email, itens, valor_total } = body;

  if (!usuario_id && !session_id) {
    return NextResponse.json({ error: "usuario_id or session_id required" }, { status: 400 });
  }

  const base = {
    email: email ?? null,
    itens,
    valor_total,
    ultima_atualizacao: new Date().toISOString(),
    convertido: false,
  };

  let error: { message: string } | null = null;

  if (usuario_id) {
    ({ error } = await supabaseAdmin
      .from("carrinhos_abandonados")
      .upsert({ ...base, usuario_id, session_id: null }, { onConflict: "usuario_id" }));
  } else {
    ({ error } = await supabaseAdmin
      .from("carrinhos_abandonados")
      .upsert({ ...base, session_id, usuario_id: null }, { onConflict: "session_id" }));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
