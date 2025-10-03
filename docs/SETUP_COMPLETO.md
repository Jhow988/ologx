# 🚀 Setup Completo - Ologx Transportes

Guia completo para configurar o sistema do zero com autenticação, emails e permissões.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Supabase](#configuração-do-supabase)
3. [Configuração Local](#configuração-local)
4. [Políticas de Segurança (RLS)](#políticas-de-segurança-rls)
5. [Configuração de Emails](#configuração-de-emails)
6. [Primeiro Acesso](#primeiro-acesso)
7. [Verificação](#verificação)

---

## 1️⃣ Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Editor de código (VS Code recomendado)
- Gmail ou outro provedor SMTP (para emails)

---

## 2️⃣ Configuração do Supabase

### 2.1 Criar Projeto

1. Acesse https://supabase.com/dashboard
2. Clique em **New Project**
3. Preencha:
   - **Name**: Ologx Transportes
   - **Database Password**: Crie uma senha forte (salve em local seguro!)
   - **Region**: Escolha o mais próximo (South America recomendado)
4. Clique em **Create new project**
5. Aguarde ~2 minutos para o projeto ser criado

### 2.2 Obter Credenciais

1. No dashboard, vá em **Settings** → **API**
2. Copie e salve:
   - **Project URL** (ex: `https://xxxxxxxxxxx.supabase.co`)
   - **anon/public key** (chave longa começando com `eyJ...`)

### 2.3 Criar Estrutura do Banco de Dados

1. Vá em **SQL Editor**
2. Crie um novo script
3. Copie e cole o conteúdo do arquivo `database_schema.sql` (criar se não existir)
4. Clique em **Run**

**Estrutura básica das tabelas:**

```sql
-- Tabela de empresas
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  cnpj text,
  address text,
  city text,
  state text,
  zip_code text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'operator',
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Outras tabelas (clientes, veículos, viagens, etc.)
-- Ver arquivo completo em: database_schema.sql
```

---

## 3️⃣ Configuração Local

### 3.1 Clonar/Baixar Projeto

```bash
cd c:\Projetos\ologx\ologx
```

### 3.2 Instalar Dependências

```bash
npm install --legacy-peer-deps
```

### 3.3 Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
   ```bash
   copy .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 4️⃣ Políticas de Segurança (RLS)

### 4.1 Aplicar Políticas Melhoradas

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo `supabase_rls_policies_improved.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**
6. Aguarde a confirmação de sucesso

**O que isso faz?**
- Habilita Row Level Security (RLS) em todas as tabelas
- Cria funções auxiliares (`is_super_admin()`, `get_my_company_id()`)
- Define políticas de acesso por empresa
- Super admins podem ver/editar tudo
- Usuários normais só veem dados da sua empresa
- Auto-preenche `company_id` em novos registros

### 4.2 Verificar Políticas

```sql
-- Verificar se RLS está ativado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Listar todas as policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 5️⃣ Configuração de Emails

### 5.1 Configurar SMTP (Gmail)

1. No Supabase, vá em **Project Settings** → **Auth**
2. Role até **SMTP Settings**
3. Clique em **Enable Custom SMTP**
4. Preencha:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: seu-email@gmail.com
   Password: [Senha de App - veja abaixo]
   Sender email: seu-email@gmail.com
   Sender name: Ologx Transportes
   ```

**Como obter Senha de App do Gmail:**
1. Acesse https://myaccount.google.com/security
2. Ative **Verificação em duas etapas**
3. Role até **Senhas de app**
4. Gere uma senha para "Aplicativo personalizado"
5. Use essa senha no campo Password

### 5.2 Configurar URLs

1. Vá em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:5173` (dev) ou `https://seudominio.com` (prod)
   - **Redirect URLs**: Adicione:
     ```
     http://localhost:5173/**
     https://seudominio.com/**
     ```

### 5.3 Ativar Confirmação de Email

1. Vá em **Authentication** → **Settings**
2. Em **User Signups**:
   - ✅ **Enable email confirmations**
   - ✅ **Enable email change confirmation**

### 5.4 Personalizar Templates (Opcional)

1. Vá em **Authentication** → **Email Templates**
2. Personalize os templates conforme [EMAIL_SETUP.md](./EMAIL_SETUP.md)

---

## 6️⃣ Primeiro Acesso

### 6.1 Criar Super Admin Manualmente

Como o primeiro usuário precisa ser super admin, crie-o manualmente:

1. No Supabase, vá em **Authentication** → **Users**
2. Clique em **Add User** → **Create new user**
3. Preencha:
   - **Email**: admin@ologx.com
   - **Password**: Senha123!
   - **Auto Confirm User**: ✅ Marcar

4. Copie o UUID do usuário criado

5. Vá em **SQL Editor** e execute:

```sql
-- 1. Criar empresa
INSERT INTO companies (id, name, email, phone, status)
VALUES (
  gen_random_uuid(),
  'Ologx Transportes',
  'contato@ologx.com',
  '(11) 99999-9999',
  'active'
) RETURNING id;

-- Copie o ID retornado

-- 2. Criar perfil do super admin
INSERT INTO profiles (id, company_id, full_name, role, is_super_admin)
VALUES (
  'COLE-O-UUID-DO-USUARIO-AQUI',
  'COLE-O-ID-DA-EMPRESA-AQUI',
  'Administrador Principal',
  'admin',
  true
);
```

### 6.2 Iniciar Aplicação

```bash
npm run dev
```

Acesse: http://localhost:5173

### 6.3 Fazer Login

1. Acesse http://localhost:5173/login
2. Use as credenciais:
   - **Email**: admin@ologx.com
   - **Password**: Senha123!
3. Você deve ser redirecionado para o dashboard de super admin

---

## 7️⃣ Verificação

### ✅ Checklist de Verificação

Execute cada item e marque quando funcionar:

#### Backend (Supabase)

- [ ] Projeto Supabase criado
- [ ] Credenciais copiadas
- [ ] Banco de dados criado
- [ ] RLS policies aplicadas
- [ ] SMTP configurado
- [ ] URLs de redirect configuradas
- [ ] Super admin criado

#### Frontend (Aplicação)

- [ ] Dependências instaladas
- [ ] `.env` configurado
- [ ] Aplicação inicia sem erros (`npm run dev`)
- [ ] Página de login carrega
- [ ] Login funciona
- [ ] Dashboard aparece após login

#### Autenticação

- [ ] Login funciona
- [ ] Logout funciona
- [ ] Cadastro de novo usuário funciona
- [ ] Email de confirmação é enviado
- [ ] Link de confirmação funciona
- [ ] "Esqueci a senha" funciona
- [ ] Email de recuperação é enviado
- [ ] Reset de senha funciona

#### Permissões

- [ ] Super admin vê todas as empresas
- [ ] Usuário normal vê apenas sua empresa
- [ ] Usuário não consegue acessar dados de outras empresas
- [ ] CRUD funciona para clientes
- [ ] CRUD funciona para veículos
- [ ] CRUD funciona para viagens

---

## 🐛 Problemas Comuns

### Erro: "Row Level Security"

**Sintoma**: Erro ao buscar dados, mensagem sobre RLS

**Solução**:
1. Verifique se executou `supabase_rls_policies_improved.sql`
2. Verifique se o usuário tem `company_id` associado
3. Execute no SQL Editor:
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```

### Erro: "Property 'env' does not exist"

**Sintoma**: Erro TypeScript no `supabaseClient.ts`

**Solução**:
1. Crie/atualize `src/vite-env.d.ts`:
   ```typescript
   /// <reference types="vite/client" />

   interface ImportMetaEnv {
     readonly VITE_SUPABASE_URL: string
     readonly VITE_SUPABASE_ANON_KEY: string
   }

   interface ImportMeta {
     readonly env: ImportMetaEnv
   }
   ```

### Email não está sendo enviado

**Sintoma**: Não recebe email de confirmação/recuperação

**Solução**:
1. Verifique pasta de spam
2. Verifique se SMTP está configurado corretamente
3. Veja logs em **Logs** → **Auth Logs**
4. Teste com outro email

### Usuário sem empresa

**Sintoma**: Erro "usuario não possui empresa associada"

**Solução**:
```sql
-- Atualizar perfil com company_id
UPDATE profiles
SET company_id = 'COLE-UUID-DA-EMPRESA'
WHERE id = 'COLE-UUID-DO-USUARIO';
```

---

## 📚 Próximos Passos

Após concluir este setup:

1. ✅ Leia [EMAIL_SETUP.md](./EMAIL_SETUP.md) para personalizar emails
2. ✅ Leia [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para entender os hooks
3. ✅ Configure backup automático do banco
4. ✅ Configure domínio personalizado (produção)
5. ✅ Implemente monitoramento

---

## 🆘 Suporte

- **Documentação Supabase**: https://supabase.com/docs
- **Logs da Aplicação**: Console do navegador (F12)
- **Logs do Supabase**: Dashboard → Logs

---

**Última atualização**: 2025-10-02

✨ **Parabéns!** Seu sistema está configurado e pronto para uso!
