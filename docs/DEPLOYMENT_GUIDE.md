# 🚀 Guia Completo de Deploy - OLogX

Este guia vai te ajudar a configurar o projeto em **desenvolvimento local** e fazer **deploy para produção** no Netlify + Supabase.

---

## 📋 Pré-requisitos

- [x] Node.js 18+ instalado
- [x] Conta no [Supabase](https://supabase.com)
- [x] Conta no [Netlify](https://netlify.com)
- [x] Git instalado

---

## 🏗️ PARTE 1: Configurar Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: ologx-production (ou outro nome)
   - **Database Password**: escolha uma senha forte
   - **Region**: escolha a mais próxima (South America - São Paulo)
4. Aguarde a criação do projeto (~2 minutos)

### 1.2 Pegar as Credenciais

1. No projeto criado, vá em **Settings** > **API**
2. Copie os valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`

### 1.3 Aplicar as Migrations (Criar Tabelas)

Você já tem as migrations na pasta `supabase/migrations/`. Vamos aplicá-las:

**Opção A: Pelo Dashboard (Recomendado)**

1. No Supabase, vá em **SQL Editor**
2. Abra os arquivos de migration em ordem e execute cada um:
   - Abra cada arquivo `.sql` da pasta `supabase/migrations/`
   - Copie o conteúdo
   - Cole no SQL Editor
   - Clique em **Run**

**Opção B: Pela CLI do Supabase**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Link com o projeto
supabase link --project-ref seu-project-id

# Aplicar migrations
supabase db push
```

### 1.4 Aplicar Row Level Security (RLS)

**CRÍTICO**: Execute as políticas de segurança!

1. No Supabase, vá em **SQL Editor**
2. Abra o arquivo [RLS_POLICIES.md](./RLS_POLICIES.md)
3. Copie **TODO O CONTEÚDO** do arquivo
4. Cole no SQL Editor e execute (**Run**)
5. Verifique se todas as policies foram criadas sem erros

### 1.5 Criar Primeiro Usuário e Empresa

No **SQL Editor**, execute:

```sql
-- 1. Criar a primeira empresa
INSERT INTO companies (name, email, phone, status, document, address)
VALUES (
  'Minha Transportadora LTDA',
  'contato@minhatransportadora.com',
  '(11) 99999-9999',
  'active',
  '12.345.678/0001-90',
  'Rua Exemplo, 123 - São Paulo, SP'
);

-- 2. Pegar o ID da empresa criada
SELECT id, name FROM companies ORDER BY created_at DESC LIMIT 1;
-- Copie o UUID retornado!
```

Agora crie o usuário Admin:

1. Vá em **Authentication** > **Users**
2. Clique em **"Add user"** > **"Create new user"**
3. Preencha:
   - **Email**: `admin@minhatransportadora.com`
   - **Password**: escolha uma senha forte
   - **Auto Confirm User**: ✅ SIM (marque)
4. Clique em **Create user**
5. Copie o **User UID** gerado

Agora vincule ao profile no **SQL Editor**:

```sql
-- Substitua os valores abaixo
INSERT INTO profiles (id, company_id, full_name, role, is_super_admin)
VALUES (
  'UUID-DO-USUARIO-AUTH',  -- Cole o User UID que você copiou
  'UUID-DA-EMPRESA',       -- Cole o UUID da empresa criada
  'Administrador',
  'admin',
  true  -- Super admin pode ver tudo
);
```

✅ **Pronto!** Supabase configurado.

---

## 💻 PARTE 2: Ambiente de Desenvolvimento Local

### 2.1 Instalar Dependências

```bash
cd c:\Projetos\ologx\ologx
npm install
```

### 2.2 Configurar Variáveis de Ambiente

Você já tem o arquivo `.env` configurado! Verifique se está correto:

```bash
# Ver conteúdo do .env
type .env
```

Deve ter:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Se precisar atualizar, edite o arquivo `.env` com as credenciais do Supabase.

### 2.3 Rodar em Desenvolvimento

```bash
npm run dev
```

A aplicação vai abrir em: `http://localhost:5173` (ou outra porta)

### 2.4 Testar Login

1. Acesse `http://localhost:5173`
2. Faça login com:
   - **Email**: `admin@minhatransportadora.com`
   - **Senha**: a senha que você definiu
3. Teste criar clientes, veículos, viagens

✅ **Funcionou?** Perfeito! Vamos para produção.

---

## 🌐 PARTE 3: Deploy para Produção (Netlify)

### 3.1 Preparar o Repositório Git

Se ainda não tem um repositório:

```bash
# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Initial commit - OLogX ready for production"

# Criar repositório no GitHub/GitLab
# Depois:
git remote add origin https://github.com/seu-usuario/ologx.git
git branch -M main
git push -u origin main
```

### 3.2 Conectar ao Netlify

**Opção A: Deploy pelo Dashboard (Recomendado)**

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em **"Add new site"** > **"Import an existing project"**
3. Conecte com GitHub/GitLab
4. Selecione o repositório **ologx**
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: (deixe vazio)

6. **IMPORTANTE**: Adicione as variáveis de ambiente:
   - Clique em **"Show advanced"** > **"New variable"**
   - Adicione:
     ```
     VITE_SUPABASE_URL = https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGc...
     ```

7. Clique em **"Deploy site"**

**Opção B: Deploy pela CLI**

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Adicionar variáveis de ambiente
netlify env:set VITE_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGc..."
```

### 3.3 Configurar Domínio (Opcional)

1. No Netlify, vá em **Site settings** > **Domain management**
2. Você tem duas opções:
   - **Usar domínio Netlify**: `seu-app.netlify.app` (grátis)
   - **Domínio customizado**: Adicione seu domínio próprio

### 3.4 Configurar Redirects (SPA)

O arquivo `netlify.toml` já está configurado, mas vamos garantir que o redirect para SPA funcione.

Verifique se existe o arquivo `public/_redirects`:

```bash
# Criar se não existir
echo "/* /index.html 200" > public/_redirects
```

### 3.5 Testar em Produção

1. Acesse o URL do Netlify: `https://seu-app.netlify.app`
2. Faça login
3. Teste as funcionalidades

✅ **Deploy concluído!**

---

## 🔒 PARTE 4: Segurança em Produção

### 4.1 Configurar CORS no Supabase

1. No Supabase, vá em **Settings** > **API**
2. Em **CORS Allowed Origins**, adicione:
   ```
   https://seu-app.netlify.app
   ```

### 4.2 Habilitar Email Confirmations (Opcional)

1. No Supabase, vá em **Authentication** > **Email Templates**
2. Configure os templates de email
3. Em **Auth Settings**, configure:
   - **Site URL**: `https://seu-app.netlify.app`
   - **Redirect URLs**: `https://seu-app.netlify.app/**`

### 4.3 Revisar RLS Policies

Certifique-se que todas as policies RLS foram aplicadas (veja [RLS_POLICIES.md](./RLS_POLICIES.md))

---

## 📊 PARTE 5: Monitoramento e Manutenção

### 5.1 Logs do Netlify

- Acesse **Site** > **Deploys** > Clique no deploy
- Veja os logs de build

### 5.2 Logs do Supabase

- Acesse **Logs** no dashboard do Supabase
- Monitore queries, erros e performance

### 5.3 Backups

- No Supabase, vá em **Database** > **Backups**
- Configure backups automáticos (plano pago)
- Ou faça backups manuais via `pg_dump`

---

## 🐛 Troubleshooting

### Erro: "Fetch failed" ou "Network error"

**Problema**: Variáveis de ambiente não configuradas no Netlify

**Solução**:
1. Vá em Netlify **Site settings** > **Environment variables**
2. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Faça **Trigger deploy** (re-deploy)

### Erro: "Row Level Security"

**Problema**: RLS policies não aplicadas

**Solução**:
- Execute os comandos em [RLS_POLICIES.md](./RLS_POLICIES.md)
- Verifique se RLS está habilitado: `ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;`

### Página em branco após login

**Problema**: Redirect não configurado (SPA)

**Solução**:
- Certifique-se que existe `public/_redirects` com `/* /index.html 200`
- Ou configure redirect no `netlify.toml`

### Erro: "Cannot read company_id of null"

**Problema**: Profile do usuário sem `company_id`

**Solução**:
```sql
UPDATE profiles
SET company_id = 'UUID-DA-EMPRESA'
WHERE id = 'UUID-DO-USUARIO';
```

---

## 📝 Checklist Final

Antes de considerar o deploy concluído:

### Supabase
- [ ] Projeto criado
- [ ] Migrations aplicadas (todas as tabelas criadas)
- [ ] RLS policies aplicadas (todas!)
- [ ] Primeiro usuário e empresa criados
- [ ] CORS configurado

### Netlify
- [ ] Site conectado ao repositório
- [ ] Variáveis de ambiente configuradas
- [ ] Build rodando sem erros
- [ ] Site acessível via HTTPS
- [ ] Redirects funcionando (SPA)

### Funcionalidades
- [ ] Login funcionando
- [ ] Criar clientes funciona
- [ ] Criar veículos funciona
- [ ] Criar viagens funciona
- [ ] Dados aparecem apenas da empresa do usuário
- [ ] Toast notifications funcionando

---

## 🎉 Pronto!

Seu projeto está no ar!

- **Desenvolvimento**: `http://localhost:5173`
- **Produção**: `https://seu-app.netlify.app`

### Próximos Passos Sugeridos

1. Configurar domínio customizado
2. Configurar emails transacionais no Supabase
3. Adicionar mais usuários via painel admin
4. Configurar backups automáticos
5. Implementar analytics (Google Analytics, Plausible, etc)

### Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção (testar localmente)
npm run build
npm run preview

# Deploy para Netlify (se usando CLI)
netlify deploy --prod

# Ver logs do Netlify
netlify logs

# Ver variáveis de ambiente
netlify env:list
```

---

## 📞 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Netlify](https://docs.netlify.com)
- [Issues do Projeto](https://github.com/seu-usuario/ologx/issues)

---

**Desenvolvido com ❤️ usando React + Vite + Supabase + Netlify**
