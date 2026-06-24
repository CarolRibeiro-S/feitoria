import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/admin-auth";

// In Next.js 15+, dynamic route params are a Promise
type RouteParams = { params: Promise<{ produtoId: string }> };

// GET /api/admin/produtos/[produtoId] — fetch a single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { produtoId } = await params;

  const { data, error } = await supabaseAdmin
    .from("produtos")
    .select("nome, descricao, preco, categoria, foto")
    .eq("id", produtoId)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(data);
}

// PATCH /api/admin/produtos/[produtoId] — update fields (nome, preco, disponivel, …)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { produtoId } = await params;
  const body = await request.json();

  const { error } = await supabaseAdmin
    .from("produtos")
    .update(body)
    .eq("id", produtoId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/produtos/[produtoId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { produtoId } = await params;

  const { error } = await supabaseAdmin
    .from("produtos")
    .delete()
    .eq("id", produtoId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
