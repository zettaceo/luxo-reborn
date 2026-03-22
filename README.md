# 🧸 Luxo Reborn — Loja Virtual

Loja virtual completa para a Luxo Reborn — Bebês Reborn, Pelúcias e Brinquedos.

## 🚀 Stack

- **Frontend + API:** Next.js 14 (App Router) + TypeScript
- **Banco de dados:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (imagens dos produtos)
- **Pagamento:** Mercado Pago (Pix grátis + Cartão)
- **Hospedagem:** Vercel
- **Frete:** Melhor Envio API

---

## ⚙️ Setup — Passo a Passo

### 1. Clone e instale dependências

```bash
git clone https://github.com/SEU_USUARIO/luxo-reborn.git
cd luxo-reborn
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha:

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → Settings → API |
| `MERCADOPAGO_ACCESS_TOKEN` | mercadopago.com.br/developers |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | mercadopago.com.br/developers |
| `ADMIN_SECRET_KEY` | Crie uma senha forte qualquer |

### 3. Configure o banco de dados

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor → New Query**
3. Cole o conteúdo de `supabase/schema.sql` e execute

### 4. Configure o Storage

No Supabase, vá em **Storage** e crie um bucket chamado `products` com acesso público. Ou execute pelo código:

```bash
npm run dev
# O bucket é criado automaticamente na primeira execução
```

### 5. Configure o Mercado Pago

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Crie um aplicativo
3. Copie o **Access Token** de produção e a **Public Key**
4. Configure o Webhook URL: `https://SEU_DOMINIO/api/webhooks/mercadopago`

### 6. Rode localmente

```bash
npm run dev
# Acesse: http://localhost:3000
# Admin: http://localhost:3000/admin (senha no .env.local)
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx              # Home da loja
│   ├── produtos/             # Catálogo + página do produto
│   ├── checkout/             # Checkout com Pix e Cartão
│   ├── pedidos/              # Acompanhar pedidos
│   ├── admin/                # Painel da cliente (protegido)
│   └── api/                  # Backend (pode mover para VPS)
│       ├── products/         # CRUD de produtos
│       ├── orders/           # Pedidos
│       ├── payment/          # Pix + Cartão (Mercado Pago)
│       ├── upload/           # Upload de imagens
│       └── webhooks/         # Confirmação de pagamento
│
├── components/
│   ├── store/                # Componentes da loja
│   └── admin/                # Componentes do painel
│
├── lib/
│   ├── db/                   # ← Trocar Supabase por VPS aqui
│   ├── mercadopago/          # Integração de pagamento
│   ├── storage/              # Upload de imagens
│   └── utils/                # Formatação, CEP, etc.
│
├── hooks/
│   └── useCart.ts            # Carrinho global (Zustand)
│
└── types/
    └── index.ts              # Todos os tipos TypeScript
```

---

## 🌐 Deploy na Vercel

1. Suba o código para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Em **Environment Variables**, adicione todas as variáveis do `.env.example`
4. Deploy automático a cada `git push`!

### Domínio próprio
1. Compre o domínio em [registro.br](https://registro.br) (ex: `luxoreborn.com.br`)
2. Na Vercel: **Settings → Domains → Add Domain**
3. Configure os DNS conforme indicado pela Vercel

---

## 🔄 Migrar para VPS no Futuro

A arquitetura é modular. Para migrar:

1. **Banco:** Troque Supabase por PostgreSQL próprio em `/src/lib/db/index.ts`
2. **API:** Descomente o `rewrites` em `next.config.js` e aponte para sua VPS
3. **Storage:** Troque Supabase Storage por S3/Cloudflare R2 em `/src/lib/storage/index.ts`

O frontend Next.js na Vercel continua sem mudanças!

---

## 💳 Taxas de Pagamento

| Método | Taxa |
|---|---|
| Pix | 0% (até R$15k/mês CNPJ) |
| Cartão crédito | ~4,99% |
| Cartão débito | ~3,49% |

O dinheiro cai na conta Mercado Pago da cliente. Ela transfere para o Nubank PJ gratuitamente quando quiser.

---

## 📞 Suporte

WhatsApp da loja: [wa.me/5511965277902](https://wa.me/5511965277902)  
Instagram: [@luxo_reborn](https://www.instagram.com/luxo_reborn)
