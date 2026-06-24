import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/admin-auth";

// GET /api/admin/produtos?produtora_id=... — list products for a producer
export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const produtoraId = request.nextUrl.searchParams.get("produtora_id");
  if (!produtoraId)
    return NextResponse.json({ error: "produtora_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("produtos")
    .select("id, nome, categoria, preco, foto, disponivel")
    .eq("produtora_id", produtoraId)
    .order("criado_em", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST /api/admin/produtos — create a new product
export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { error } = await supabaseAdmin.from("produtos").insert(body);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
