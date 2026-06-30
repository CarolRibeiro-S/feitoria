// Server-only — never import in client components.
import { MercadoPagoConfig, Preference } from "mercadopago";

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export { Preference };
