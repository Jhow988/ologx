# Como Aplicar a Migration

Esta migration corrige o problema de "Database error creating new user" ao enviar convites.

## Passos:

1. Acesse o painel do Supabase: https://app.supabase.com/project/hpbnyyktoybpuickmujq/sql/new

2. Copie e cole o conteúdo do arquivo: `migrations/20251008_fix_handle_new_user_for_invites.sql`

3. Clique em **"Run"** para executar a migration

4. Teste enviando um novo convite

## O que esta migration faz:

- Corrige a função `handle_new_user()` para **não criar uma nova empresa** quando o usuário já tem `company_id` no metadata (caso de convites)
- Usa o `company_id` fornecido no convite ao invés de criar uma nova empresa
- Mantém compatibilidade com signup normal (sem company_id = cria nova empresa)
