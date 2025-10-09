# Setup Inicial do Sistema - Guia Completo

## Visão Geral

Como você tem acesso ao painel do Supabase, pode criar os **Admins de cada empresa** diretamente no banco de dados. Depois, cada admin poderá convidar seus próprios usuários (motoristas, operadores, etc).

## Fluxo do Sistema

```
1. Você (com acesso ao Supabase)
   ↓
2. Cria Empresas no banco
   ↓
3. Cria Admin para cada Empresa no banco
   ↓
4. Admin faz login e convida seus Usuários pela interface
```

## Passo a Passo

### 1. Criar Empresas

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Criar uma empresa
INSERT INTO public.companies (name, cnpj, email, phone, address, status)
VALUES (
  'Nome da Empresa LTDA',
  '12345678000190',  -- CNPJ sem pontos/traços
  'contato@empresa.com',
  '11987654321',
  'Rua Exemplo, 123 - São Paulo - SP',
  'active'
);

-- Ver empresas criadas e pegar o ID
SELECT id, name, cnpj, status FROM companies;
```

**Anote o `id` da empresa** que você acabou de criar!

### 2. Criar Admin para a Empresa

1. Abra o arquivo: `supabase/scripts/create_admin_empresa.sql`

2. **Substitua** os seguintes valores:
   - `COLE_O_ID_DA_EMPRESA_AQUI` → ID da empresa que você anotou
   - `admin@empresa.com` → Email do admin
   - `SenhaForte123!` → Senha do admin
   - `Administrador da Empresa` → Nome completo do admin

3. **Execute** o script completo no SQL Editor

4. Você verá: `Admin criado com sucesso! User ID: xxx, Company ID: xxx`

### 3. Admin Faz Login

1. O admin acessa: https://ologx.com.br/login
2. Usa o email e senha que você definiu
3. É redirecionado para o painel da empresa dele

### 4. Admin Convida Usuários

Agora o admin pode:
- Ir em **Cadastros → Usuários**
- Clicar em **"Convidar Usuário"**
- Preencher email, nome e perfil
- O usuário recebe email para criar senha

## Exemplo Completo

### Cenário: 3 empresas transportadoras

```sql
-- 1. Criar as empresas
INSERT INTO public.companies (name, cnpj, status) VALUES
  ('Transportes Rápido LTDA', '11111111000100', 'active'),
  ('Logística Express SA', '22222222000200', 'active'),
  ('Frota Total ME', '33333333000300', 'active');

-- 2. Ver os IDs criados
SELECT id, name FROM companies ORDER BY created_at DESC LIMIT 3;
```

Depois, para cada empresa, execute o script `create_admin_empresa.sql` alterando:
- O `company_id`
- O email do admin
- A senha
- O nome

## Estrutura de Permissões

| Tipo | Criado por | Pode criar |
|------|-----------|------------|
| **Empresa** | Você (SQL) | - |
| **Admin** | Você (SQL) | Usuários via interface |
| **Usuários** | Admin (interface) | - |

## Remover Super Admin

Como você não precisa mais do Super Admin, vamos simplificar:

### Remover Menu Super Admin

O sistema já detecta automaticamente se o usuário é super admin. Se não criar nenhum super admin, esse menu não aparecerá.

### Se Criou Super Admin por Engano

Execute este SQL para remover:

```sql
-- Ver super admins
SELECT id, email FROM auth.users
WHERE id IN (SELECT id FROM profiles WHERE is_super_admin = true);

-- Deletar super admin (substitua o ID)
DELETE FROM auth.users WHERE id = 'ID_DO_SUPER_ADMIN';
```

## Troubleshooting

### "Empresa não encontrada"
- Verifique se copiou o ID correto da empresa
- O ID deve estar entre aspas simples no SQL

### "Email já existe"
- Este email já foi usado
- Escolha outro email ou delete o usuário antigo

### "Não consigo fazer login"
- Verifique se o email e senha estão corretos
- Certifique-se de que executou o script completo

### "Admin não vê menu de usuários"
- Verifique se o campo `role` está como 'admin'
- Verifique se o `company_id` está preenchido no profile

## Próximos Passos

Após criar empresas e admins:

1. ✅ Compartilhe os acessos com cada admin
2. ✅ Admins fazem login
3. ✅ Admins convidam seus usuários
4. ✅ Sistema funcionando! 🚀
