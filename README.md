# FEITORIA

**Curadoria de sabores, marcas e histórias.**

Marketplace de produtos artesanais que conecta pequenas produtoras a clientes que valorizam origem, qualidade e histórias reais.

acesse: www.somosfeitoria.com.br

---

## Sobre o projeto

A FEITORIA nasceu da vontade de dar visibilidade a quem produz com cuidado e intenção. Mais do que uma loja, é um espaço de curadoria: cada produto tem uma história, cada produtora tem um rosto e um propósito.

O diferencial está no storytelling — o cliente não compra apenas um cookie ou um pão artesanal, mas conhece quem faz, como faz e por quê faz. A plataforma valoriza a transparência da cadeia, a produção em pequena escala e a conexão direta entre produtora e consumidor.

---

## Stack tecnológica

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL, Auth, Storage)
- **Vercel** (deploy)

---

## Funcionalidades

- Catálogo de produtos com página de detalhe
- Perfil completo de cada produtora — seção "Descubra Quem Faz"
- Carrinho de compras com drawer lateral
- Checkout com cálculo de frete via ViaCEP e opção de retirada
- Autenticação por papel: cliente, produtora e admin
- Painel da produtora: gerenciamento de produtos, pedidos e vendas
- Painel administrativo: visão geral, produtoras, pedidos e financeiro
- Recuperação de senha por e-mail

---

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
git clone https://github.com/CarolRibeiro-S/feitoria.git
cd feitoria
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Rodando o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/         # Login, cadastro, recuperação de senha
│   ├── actions/        # Server actions (checkout, produtoras)
│   ├── admin/          # Painel administrativo
│   ├── checkout/       # Fluxo de compra e confirmação
│   ├── dashboard/      # Painel da produtora
│   ├── pedidos/        # Histórico de pedidos do cliente
│   ├── produtoras/     # Listagem e perfil das produtoras
│   └── produtos/       # Catálogo e detalhe de produtos
├── components/
│   ├── layout/         # Header, Footer, CartDrawer
│   └── ui/             # Componentes reutilizáveis
└── lib/                # Supabase client, contextos, utilitários
```

---

## Identidade visual

- **Cores:** cream, terracota, espresso, olive, caramel, sand, wine
- **Tipografia:** Playfair Display (serif) + Montserrat (sans-serif)

---

## Deploy

O projeto está em produção em [somosfeitoria.com.br](https://www.somosfeitoria.com.br), hospedado na Vercel com deploy contínuo a partir da branch `main`.

---

## Autoria

Desenvolvido por **Carol Ribeiro**.
