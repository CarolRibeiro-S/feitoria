import { supabase } from "@/lib/supabase-client";

export function trackEvent(tipo: string, pagina?: string) {
  supabase.auth.getUser().then(({ data: { user } }) => {
    supabase.from("eventos_acesso").insert({
      tipo,
      pagina: pagina ?? null,
      usuario_id: user?.id ?? null,
    });
  });
}
