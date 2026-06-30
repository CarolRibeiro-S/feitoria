export type ItemProdutoraEmail = {
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
};

export type PedidoNovoProdutoraData = {
  numero: string;
  data_pedido: string;
  nome_produtora: string;
  itens: ItemProdutoraEmail[];
  nome_cliente: string;
  email_cliente: string;
  tipo_entrega: "entrega" | "retirada";
  // entrega
  endereco?: string;
  numero_endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  // retirada
  local_retirada?: string;
  data_retirada?: string;
  hora_retirada?: string;
};

function fmtBRL(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export function pedidoNovoProdutoraEmail(data: PedidoNovoProdutoraData): {
  subject: string;
  html: string;
} {
  const totalItens = data.itens.reduce(
    (acc, i) => acc + i.preco_unitario * i.quantidade,
    0
  );

  const entregaHtml =
    data.tipo_entrega === "retirada"
      ? `<p style="margin:0;font-size:14px;color:#3B2F2A;line-height:1.6;">
           Retirada em <strong>${data.local_retirada ?? data.bairro ?? "—"}</strong>
           ${data.data_retirada ? ` · <strong>${fmtDate(data.data_retirada)}</strong>` : ""}
           ${data.hora_retirada ? ` às <strong>${data.hora_retirada}</strong>` : ""}
         </p>`
      : `<p style="margin:0;font-size:14px;color:#3B2F2A;line-height:1.6;">
           Entrega em ${[
             data.endereco,
             data.numero_endereco,
             data.bairro,
             data.cidade,
             data.estado,
           ]
             .filter(Boolean)
             .join(", ")}
         </p>`;

  const itensHtml = data.itens
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E8E0D4;">
          <span style="font-size:14px;color:#3B2F2A;font-weight:600;">${item.nome_produto}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E8E0D4;text-align:center;">
          <span style="font-size:13px;color:#7A6B64;">× ${item.quantidade}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E8E0D4;text-align:right;">
          <span style="font-size:14px;color:#3B2F2A;">${fmtBRL(item.preco_unitario * item.quantidade)}</span>
        </td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo pedido — FEITORIA</title>
</head>
<body style="margin:0;padding:0;background-color:#F0ECE6;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0ECE6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F6F3EE;border:1px solid #E8E0D4;">

          <!-- Header -->
          <tr>
            <td style="background:#3B2F2A;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;letter-spacing:0.3em;color:#F6F3EE;font-weight:normal;">
                FEITORIA
              </p>
              <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.25em;color:#C55A3A;text-transform:uppercase;">
                Novo pedido recebido
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C55A3A;font-weight:bold;">
                Para produtora
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#3B2F2A;">
                Olá, ${data.nome_produtora}!
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#5A4A44;line-height:1.6;font-family:Arial,sans-serif;">
                Você recebeu um novo pedido via FEITORIA. Prepare com carinho!
              </p>

              <!-- Order number + date -->
              <div style="background:#E8E0D4;padding:14px 20px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6B64;">Pedido</span><br/>
                      <span style="font-family:Georgia,serif;font-size:20px;color:#3B2F2A;">${data.numero}</span>
                    </td>
                    <td style="text-align:right;">
                      <span style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6B64;">Data</span><br/>
                      <span style="font-family:Arial,sans-serif;font-size:14px;color:#3B2F2A;">${fmtDate(data.data_pedido)}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Items -->
              <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6B64;font-weight:bold;">
                Seus itens neste pedido
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                ${itensHtml}
              </table>
              <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:13px;color:#7A6B64;text-align:right;">
                Total dos seus itens: <strong style="color:#3B2F2A;">${fmtBRL(totalItens)}</strong>
              </p>

              <!-- Client info -->
              <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6B64;font-weight:bold;">
                Dados do cliente
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:#7A6B64;width:90px;">Nome</td>
                  <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:#3B2F2A;">${data.nome_cliente}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:#7A6B64;">E-mail</td>
                  <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:#3B2F2A;">${data.email_cliente}</td>
                </tr>
              </table>

              <!-- Delivery info -->
              <div style="background:#F0ECE6;border-left:3px solid #C55A3A;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C55A3A;font-weight:bold;">
                  ${data.tipo_entrega === "retirada" ? "Retirada" : "Entrega"}
                </p>
                ${entregaHtml}
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-top:8px;">
                <a href="https://www.somosfeitoria.com.br/dashboard"
                   style="display:inline-block;background:#C55A3A;color:#F6F3EE;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 32px;">
                  Gerenciar pedido no Dashboard
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#3B2F2A;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#C4B9B2;">
                Dúvidas sobre este pedido?
              </p>
              <a href="mailto:contato@somosfeitoria.com.br"
                 style="font-family:Arial,sans-serif;font-size:13px;color:#C55A3A;text-decoration:none;">
                contato@somosfeitoria.com.br
              </a>
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#6B5C57;">
                © FEITORIA — Marketplace de produtoras artesanais
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return {
    subject: `Novo pedido recebido — FEITORIA ${data.numero}`,
    html,
  };
}
