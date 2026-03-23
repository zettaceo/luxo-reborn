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
| `MELHOR_ENVIO_ACCESS_TOKEN` | melhorenvio.com.br (token da API) |
| `MELHOR_ENVIO_FROM_POSTAL_CODE` | CEP de origem da loja |
| `ADMIN_SECRET_KEY` | Crie uma senha forte qualquer |
| `CUSTOMER_AUTH_SECRET` | Chave para sessão da área do cliente |
| `RESEND_API_KEY` | Chave da API de e-mail (resend.com) para recuperação de senha |
| `RESEND_FROM_EMAIL` | Remetente validado no Resend (ex: no-reply@dominio.com) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 (opcional) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (opcional) |
| `TRACKING_SYNC_SECRET` | Token para cron de rastreio (opcional) |

### 3. Configure o banco de dados

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor → New Query**
3. Cole o conteúdo de `supabase/schema.sql` e execute
4. Em seguida, execute também `supabase/analytics.sql` (painel de funil/conversão)
5. Execute `supabase/customer_accounts.sql` para ativar a área de cliente (login, endereços, pagamentos)
6. Se você já tinha executado `customer_accounts.sql` antes desta atualização, rode `supabase/password_recovery_patch.sql`
7. Se o projeto já existia antes, execute `supabase/security_patch.sql` para remover acesso público direto a pedidos

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
5. Defina `MERCADOPAGO_WEBHOOK_SECRET` (obrigatório em produção)

### 5.1 Configure frete real (Melhor Envio)

1. Crie token da API no Melhor Envio
2. Defina no `.env`:
   - `MELHOR_ENVIO_ACCESS_TOKEN`
   - `MELHOR_ENVIO_FROM_POSTAL_CODE`
3. (Opcional) Ajuste:
   - `MELHOR_ENVIO_SERVICES`
   - dimensões padrão `MELHOR_ENVIO_DEFAULT_*`

Sem essas variáveis, o sistema usa fallback interno de frete para não quebrar o checkout.

### 6. Rode localmente

```bash
npm run dev
# Acesse: http://localhost:3000
# Admin: http://localhost:3000/admin (senha no .env.local)
# Marketing: http://localhost:3000/admin/marketing
# Rastreio: http://localhost:3000/pedidos
# Conta do cliente: http://localhost:3000/conta
# Recuperar senha: http://localhost:3000/conta/esqueci-senha
```

### ✅ Checklist de validação (pronto para uso)

1. Abra `/admin/marketing` e confirme os cards de funil.
2. Acesse um produto, adicione no carrinho e avance no checkout.
3. Volte em `/admin/marketing` e valide aumento em:
   - `view_item`
   - `add_to_cart`
   - `begin_checkout`
4. Faça um pedido de teste e valide `purchase`.
5. Abra `/pedidos` e consulte com e-mail da compra.
6. No admin de pedido, use o botão **Atualizar rastreio automático** para buscar status dos Correios.

### 🔄 Rastreio automático por cron (opcional)

Existe endpoint para sincronizar pedidos enviados:
- `POST /api/cron/tracking-sync`
- Header obrigatório: `Authorization: Bearer <TRACKING_SYNC_SECRET>`

Ele marca pedidos como entregues automaticamente quando o rastreio indicar entrega.

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

### Variáveis importantes para conversão
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`

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
