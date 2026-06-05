# MT Makers — Sistema de Gestão

Sistema de gestão empresarial para a **MT Makers** (impressão 3D personalizada), construído com **Next.js 14 (App Router)**, **Google Sheets** como banco de dados e **Claude (Anthropic)** para a calculadora de preços com IA.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** (base-ui)
- **Google Sheets API v4** (service account) como banco de dados
- **Anthropic Claude API** para precificação inteligente
- **Clerk** para autenticação (login/cadastro, sessão, UserButton)
- **React Hook Form + Zod**, **Sonner** (toasts), **Lucide** (ícones)

## Funcionalidades

| Página | O que faz |
|--------|-----------|
| **Dashboard** | KPIs (pedidos, faturamento do mês, meta, saldo consignado), gráfico de status, últimos pedidos |
| **Clientes** | CRUD completo, busca, filtro por tipo, drawer com histórico de pedidos |
| **Produtos** | Catálogo em cards, filtro por categoria, formulário com **"Calcular com IA"** |
| **Pedidos** | Lista com filtros, formulário com autocomplete de cliente/produto, drawer para atualizar status |
| **Entradas** | Vendas rápidas |
| **Consignado** | Produtos com revendedores e saldos |
| **Retiradas** | Saídas/pagamentos |
| **Calculadora IA** | Precificação 3D via Claude, breakdown de custos, salvar como produto, histórico (localStorage) |

## Configuração

### 1. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
GOOGLE_SHEETS_ID=16_o2hNUeyUZgrPhbWH4iGeU-AAGfygBjgjRgEJzUa3Y
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # JSON em uma linha
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5                            # opcional
NEXT_PUBLIC_APP_NAME=MT Makers
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 2. Google Sheets (service account)

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto e ative a **Google Sheets API**.
2. Crie uma **Service Account** e gere uma chave JSON.
3. Cole o JSON (em uma linha) em `GOOGLE_SERVICE_ACCOUNT_JSON`.
4. **Compartilhe a planilha** com o `client_email` da service account (permissão de **Editor**).

A estrutura das abas (linha 3 = cabeçalhos, dados a partir da linha 4) está mapeada em
[`lib/sheets-config.ts`](lib/sheets-config.ts).

### 3. Claude (calculadora de preços)

Gere uma chave em [console.anthropic.com](https://console.anthropic.com) e coloque em `ANTHROPIC_API_KEY`.
O prompt de precificação está em [`lib/claude.ts`](lib/claude.ts) — ajuste o `systemPrompt`
para refletir os custos reais da MT Makers, se desejar.

### 4. Autenticação (Clerk) — obrigatório para rodar

O app inteiro é protegido por login. Sem as chaves do Clerk o servidor responde
**500 (Missing publishableKey)** — então configure antes de iniciar.

1. Crie uma aplicação em [dashboard.clerk.com](https://dashboard.clerk.com).
2. Em **API Keys**, copie as chaves para o `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. As rotas `/sign-in` e `/sign-up` já existem; usuários não autenticados são
   redirecionados automaticamente pelo [`middleware.ts`](middleware.ts).
4. Após login, o `UserButton` aparece no rodapé da sidebar (sair, gerenciar conta).

As rotas públicas e protegidas são controladas em [`middleware.ts`](middleware.ts)
(`/sign-in` e `/sign-up` são públicas; todo o resto, incluindo `/api/*`, exige login).

## Rodando localmente

> Requer **Node 18.17+** (testado com Node 22) e as chaves do **Clerk** configuradas.

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build && npm start
```

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente (mesmas do `.env.local`).
3. Deploy. A configuração de região/timeout está em [`vercel.json`](vercel.json).

## Arquitetura

```
middleware.ts         Clerk — protege todas as rotas exceto /sign-in e /sign-up
app/                  rotas (páginas + /api)
  sign-in, sign-up/   telas de autenticação (Clerk)
  api/<entidade>/     route handlers (GET/POST/PUT/DELETE)
components/           layout, dashboard, formulários, shared (Combobox, StatusBadge…)
lib/
  sheets.ts           helper genérico do Google Sheets + normalização pt-BR
  sheets-config.ts    mapa das abas (gid, colunas, primeira linha de dados)
  data.ts             camada de acesso: mapeia linhas <-> objetos tipados
  claude.ts           integração com a Claude API
  constants.ts        status, categorias, cores, meta mensal
  format.ts           formatação pt-BR (R$, datas, %)
types/index.ts        todos os tipos
```

### Convenções importantes

- IDs sequenciais automáticos: `CLI-001`, `MTK-001`, `PED-001`, `CON-001`, `RET-001`.
- Datas gravadas em `DD/MM/YYYY`; valores monetários como número puro.
- Leitura normaliza o locale pt-BR (`1.100,80` → `1100.8`).
- A linha **TOTAIS** e linhas vazias são ignoradas na leitura de Pedidos.
- Sem credenciais configuradas, as telas exibem um estado de erro amigável (o app não quebra).
