import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/admin-auth";

// GET /api/admin/carrinhos-abandonados
// Query params:
//   range=hoje|7d|30d  — preset date range
//   from=YYYY-MM-DD    — custom start (used with to=)
//   to=YYYY-MM-DD      — custom end
// Returns carrinhos with convertido=false ordered by ultima_atualizacao desc.
export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const range = searchParams.get("range");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let query = supabaseAdmin
    .from("carrinhos_abandonados")
    .select("id, email, itens, valor_total, ultima_atualizacao")
    .eq("convertido", false)
    .order("ultima_atualizacao", { ascending: false });

  const now = new Date();

  if (range === "hoje") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    query = query.gte("ultima_atualizacao", startOfDay);
  } else if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    query = query.gte("ultima_atualizacao", d.toISOString());
  } else if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    query = query.gte("ultima_atualizacao", d.toISOString());
  } else if (fromParam && toParam) {
    query = query
      .gte("ultima_atualizacao", `${fromParam}T00:00:00`)
      .lte("ultima_atualizacao", `${toParam}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
