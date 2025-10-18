## Plataforma RTC

Aplicação Next.js 15 com Tailwind v4 e shadcn/ui para apoiar organizações na adaptação à reforma tributária. Este repositório contém landing page, autenticação local e os próximos módulos descritos no PDR.

## Pré-requisitos

- Node.js 20+
- npm (ou pnpm/yarn/bun, ajustando os comandos abaixo)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<chave_anon>"
SUPABASE_SERVICE_ROLE_KEY="<chave_service_role>"
```

⚠️ **Nunca** exponha a chave `SUPABASE_SERVICE_ROLE_KEY` em código que roda no navegador. Ela é usada apenas em código do servidor (rotas, actions, scripts). Para ambientes de produção, prefira armazenar essa variável diretamente na plataforma de deploy.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O aplicativo ficará acessível em [http://localhost:3000](http://localhost:3000).

### Navegação principal

A área autenticada fica sob `/app` e foi reorganizada em páginas dedicadas por módulo:

- `/app/dashboard` — visão executiva resumindo progresso, riscos, recomendações e links rápidos.
- `/app/checklist` — acompanhamento detalhado das ações prioritárias e alertas.
- `/app/relatorios` — relatórios financeiros e simuladores exportáveis.
- `/app/curadoria` — conteúdos recomendados para a transição.
- `/app/timeline` — principais marcos da reforma tributária.
- `/app/configuracoes` — preferências de acesso, notificações e auditoria.

Use o menu superior fixo para alternar entre os módulos sem recarregar todo o contexto do usuário.

## Testes rápidos

- `npm run lint` — verifica o estilo e padrões do projeto

## Supabase

Helpers para acessar o banco estão disponíveis em `src/lib/supabase`:

- `getSupabaseBrowserClient()` — uso em componentes cliente
- `createSupabaseServerClient()` — uso em server actions/route handlers com chave anônima
- `createSupabaseServiceClient()` — uso restrito no servidor com chave de service role

Substitua o placeholder de tipos em `src/lib/supabase/types.ts` pelo arquivo gerado via `supabase gen types typescript --project-id <id>` para obter tipagem segura das tabelas.

### Migrations

As migrations SQL da fase 1 ficam em `supabase/migrations`. Para aplicá-las com o [CLI da Supabase](https://supabase.com/docs/reference/cli), execute:

```bash
supabase db push
```

ou, se preferir rodar direto no dashboard da Supabase, copie o conteúdo do arquivo `202410180001_initial_mvp.sql` para o editor SQL e execute manualmente.
