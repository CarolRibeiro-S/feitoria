'use server'

import { mpClient, Preference } from "@/lib/mercadopago";

export type ItemPreferencia = {
  title: string;
  quantity: number;
  unit_price: number;
};

export type PreferenceInput = {
  numeroPedido: string;
  items: ItemPreferencia[];
  emailCliente: string;
  total: number;
};

export type PreferenceResult =
  | { ok: true; id: string; init_point: string }
  | { ok: false; error: string };

export async function criarPreferencia(input: PreferenceInput): Promise<PreferenceResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.somosfeitoria.com.br";

  try {
    const preference = new Preference(mpClient);

    // Send items at their original prices.
    // If total differs (discount applied), add a balancing item so the sum matches.
    const itemsSum = input.items.reduce(
      (acc, i) => acc + i.unit_price * i.quantity,
      0
    );
    const mpItems: {
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
      currency_id: string;
    }[] = input.items.map((item, idx) => ({
      id: String(idx + 1),
      title: item.title,
      quantity: item.quantity,
      unit_price: Math.round(item.unit_price * 100) / 100,
      currency_id: "BRL",
    }));

    const diff = Math.round((input.total - itemsSum) * 100) / 100;
    if (Math.abs(diff) > 0.01) {
      mpItems.push({
        id: "adj",
        title: diff < 0 ? "Desconto aplicado" : "Frete",
        quantity: 1,
        unit_price: Math.abs(diff),
        currency_id: "BRL",
      });
    }

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: { email: input.emailCliente },
        back_urls: {
          success: `${siteUrl}/checkout/confirmacao?status=success`,
          failure: `${siteUrl}/checkout/confirmacao?status=failure`,
          pending: `${siteUrl}/checkout/confirmacao?status=pending`,
        },
        auto_return: "approved",
        external_reference: input.numeroPedido,
      },
    });

    if (!result.id || !result.init_point) {
      console.error("[criarPreferencia] Missing id or init_point:", result);
      return { ok: false, error: "Resposta inválida do Mercado Pago." };
    }

    console.log("[criarPreferencia] Preference created:", result.id);
    return { ok: true, id: result.id, init_point: result.init_point };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[criarPreferencia] Error:", msg);
    return { ok: false, error: msg };
  }
}
