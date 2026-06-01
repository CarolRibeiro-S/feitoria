import { DollarSign, Clock, Package, Star } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CARDS = [
  {
    label: "Total de Vendas",
    value: "R$ 3.240,00",
    detail: "+12% este mês",
    icon: DollarSign,
    positive: true,
  },
  {
    label: "Pedidos Pendentes",
    value: "8",
    detail: "aguardando confirmação",
    icon: Clock,
    positive: false,
  },
  {
    label: "Produtos Ativos",
    value: "12",
    detail: "3 pausados",
    icon: Package,
    positive: true,
  },
  {
    label: "Avaliação Média",
    value: "4.8",
    detail: "34 avaliações",
    icon: Star,
    positive: true,
  },
];

const ORDERS = [
  { id: "#0041", produto: "Geleia de Damasco com Cardamomo", cliente: "Ana Lima",       valor: "R$ 34,90",  status: "entregue",  data: "28 mai" },
  { id: "#0040", produto: "Torta de Lavanda e Limão Siciliano", cliente: "Mariana Costa", valor: "R$ 89,00",  status: "pendente",  data: "27 mai" },
  { id: "#0039", produto: "Kit Café da Manhã Especial",         cliente: "Julia Santos",  valor: "R$ 145,00", status: "confirmado", data: "26 mai" },
  { id: "#0038", produto: "Brigadeiro de Pistache (cx 6un)",    cliente: "Fernanda Melo", valor: "R$ 36,00",  status: "pendente",  data: "26 mai" },
  { id: "#0037", produto: "Pão de Centeio com Nozes",           cliente: "Camila Ferreira",valor: "R$ 28,00", status: "entregue",  data: "25 mai" },
];

const STATUS_STYLES: Record<string, string> = {
  pendente:   "text-caramel  bg-caramel/8  border-caramel/20",
  confirmado: "text-olive    bg-olive/8    border-olive/20",
  entregue:   "text-espresso bg-sand       border-sand",
  cancelado:  "text-wine     bg-wine/8     border-wine/20",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10">

      {/* Header */}
      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
          Painel da Produtora
        </p>
        <h1 className="font-serif text-3xl text-espresso font-normal">
          Olá, Casa Mato Verde
        </h1>
        <p className="font-sans text-sm text-espresso/50 mt-1">
          Aqui está um resumo do seu negócio hoje.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, detail, icon: Icon, positive }) => (
          <div key={label} className="bg-white border border-sand p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.62rem] tracking-[0.2em] uppercase text-espresso/45 font-semibold">
                {label}
              </span>
              <Icon size={15} strokeWidth={1.6} className="text-espresso/25" />
            </div>
            <div>
              <p className="font-serif text-2xl text-espresso font-normal leading-none">
                {value}
              </p>
              <p className={`font-sans text-[0.7rem] mt-1.5 ${positive ? "text-olive" : "text-caramel"}`}>
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-espresso font-normal">Pedidos Recentes</h2>
          <a href="/dashboard/pedidos" className="font-sans text-[0.7rem] text-caramel hover:text-terracota transition-colors tracking-wider uppercase font-semibold">
            Ver todos
          </a>
        </div>

        <div className="border border-sand overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-sand">
                {["Pedido", "Produto", "Cliente", "Valor", "Status", "Data"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-espresso/35 font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-sand/50 last:border-0 hover:bg-sand/30 transition-colors">
                  <td className="px-4 py-3.5 font-sans text-xs text-espresso/50 whitespace-nowrap">{order.id}</td>
                  <td className="px-4 py-3.5 font-sans text-sm text-espresso">{order.produto}</td>
                  <td className="px-4 py-3.5 font-sans text-sm text-espresso/70 whitespace-nowrap">{order.cliente}</td>
                  <td className="px-4 py-3.5 font-sans text-sm text-espresso font-medium whitespace-nowrap">{order.valor}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`font-sans text-[0.65rem] font-semibold tracking-wide uppercase px-2.5 py-1 border ${STATUS_STYLES[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-sans text-xs text-espresso/40 whitespace-nowrap">{order.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
