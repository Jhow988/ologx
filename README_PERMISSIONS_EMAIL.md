# 🔐 Sistema de Permissões e Email - Ologx

## ✅ O que foi implementado

### 1. Sistema de Reset de Senha
- ✅ Página de "Esqueci a senha" ([/forgot-password](src/pages/Auth/ForgotPassword.tsx))
- ✅ Página de redefinição de senha ([/reset-password](src/pages/Auth/ResetPassword.tsx))
- ✅ Link adicionado na página de login
- ✅ Rotas configuradas no App.tsx

### 2. Políticas de Segurança (RLS) Melhoradas
- ✅ Arquivo [supabase_rls_policies_improved.sql](supabase_rls_policies_improved.sql)
- ✅ Funções helper: `is_super_admin()` e `get_my_company_id()`
- ✅ Políticas separadas para super admins
- ✅ Auto-preenchimento de `company_id`
- ✅ Triggers automáticos
- ✅ Índices de performance

### 3. Configuração do Supabase Client
- ✅ PKCE flow habilitado
- ✅ Auto-refresh de tokens
- ✅ Detecção de sessão na URL

### 4. Documentação Completa
- ✅ [EMAIL_SETUP.md](docs/EMAIL_SETUP.md) - Configuração de emails
- ✅ [SETUP_COMPLETO.md](docs/SETUP_COMPLETO.md) - Setup do zero
- ✅ [database_schema.sql](database_schema.sql) - Schema do banco

## 🚀 Como Usar

### Setup Rápido

1. **Configure o Supabase:**
   ```bash
   # Siga o guia: docs/SETUP_COMPLETO.md
   ```

2. **Execute os scripts SQL (nesta ordem):**
   - Primeiro: `database_schema.sql`
   - Depois: `supabase_rls_policies_improved.sql`

3. **Configure emails no Supabase:**
   ```bash
   # Siga o guia: docs/EMAIL_SETUP.md
   ```

4. **Inicie a aplicação:**
   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```

### Funcionalidades Disponíveis

#### Para Usuários

- **Login**: `/login`
- **Cadastro**: `/signup` (com confirmação de email)
- **Esqueci a senha**: `/forgot-password`
- **Redefinir senha**: `/reset-password`

#### Para Desenvolvedores

**Verificar se usuário é super admin:**
```typescript
const { user } = useAuth();
if (user?.isSuperAdmin) {
  // Super admin tem acesso total
}
```

**Verificar permissões específicas:**
```tsx
<Can perform="clients.create">
  <Button>Criar Cliente</Button>
</Can>
```

**Usar em código:**
```typescript
const { user } = useAuth();
const canCreate = user?.permissions.includes('clients.create');
```

## 🔒 Níveis de Permissão

### Super Admin
- ✅ Acesso a TODAS as empresas
- ✅ Pode criar/editar/deletar empresas
- ✅ Pode gerenciar todos os usuários
- ✅ Acesso total a todos os recursos

### Admin (de empresa)
- ✅ Acesso total aos dados da SUA empresa
- ✅ Pode gerenciar usuários da sua empresa
- ✅ Pode editar configurações da empresa
- ❌ NÃO vê dados de outras empresas

### Manager
- ✅ Acesso aos dados da empresa
- ✅ Pode criar/editar registros
- ❌ NÃO pode deletar
- ❌ NÃO pode gerenciar usuários

### Operator
- ✅ Acesso de leitura
- ✅ Pode criar alguns registros
- ❌ Edição limitada
- ❌ NÃO pode deletar

### Driver
- ✅ Vê suas próprias viagens
- ✅ Pode atualizar status de viagens
- ❌ Acesso muito limitado

## 📧 Fluxo de Emails

### 1. Cadastro de Novo Usuário
```
Usuário preenche formulário
    ↓
Supabase cria conta
    ↓
Email de confirmação enviado
    ↓
Usuário clica no link
    ↓
Conta ativada → Login
```

### 2. Recuperação de Senha
```
Usuário clica "Esqueci a senha"
    ↓
Digita email
    ↓
Email de recuperação enviado
    ↓
Usuário clica no link
    ↓
Define nova senha → Login
```

### 3. Convite de Usuário
```
Admin convida novo usuário
    ↓
Email de convite enviado
    ↓
Usuário clica no link
    ↓
Define senha → Login
```

## 🗂️ Estrutura de Arquivos

```
ologx/
├── src/
│   ├── pages/Auth/
│   │   ├── Login.tsx              # Página de login
│   │   ├── SignUp.tsx             # Página de cadastro
│   │   ├── ForgotPassword.tsx     # ✨ NOVO: Esqueci a senha
│   │   └── ResetPassword.tsx      # ✨ NOVO: Redefinir senha
│   ├── contexts/
│   │   └── AuthContext.tsx        # Contexto de autenticação
│   ├── lib/
│   │   └── supabaseClient.ts      # ✨ ATUALIZADO: Cliente Supabase
│   └── App.tsx                    # ✨ ATUALIZADO: Rotas
├── docs/
│   ├── EMAIL_SETUP.md             # ✨ NOVO: Config de emails
│   └── SETUP_COMPLETO.md          # ✨ NOVO: Setup completo
├── database_schema.sql            # ✨ NOVO: Schema do banco
├── supabase_rls_policies_improved.sql  # ✨ NOVO: Políticas melhoradas
└── supabase_rls_policies.sql      # Políticas antigas (manter como backup)
```

## 🧪 Como Testar

### Teste 1: Cadastro e Confirmação
1. Acesse `/signup`
2. Preencha o formulário
3. Verifique seu email
4. Clique no link de confirmação
5. Faça login

### Teste 2: Recuperação de Senha
1. Acesse `/login`
2. Clique em "Esqueceu a senha?"
3. Digite seu email
4. Verifique seu email
5. Clique no link
6. Defina nova senha
7. Faça login com a nova senha

### Teste 3: Permissões
1. Faça login como super admin
2. Veja que tem acesso a `/admin/empresas`
3. Faça login como usuário normal
4. Veja que NÃO tem acesso a `/admin/empresas`

## 🐛 Troubleshooting

### Problema: Email não chega
**Solução**:
1. Verifique pasta de spam
2. Confira configuração SMTP no Supabase
3. Veja logs em: Dashboard > Logs > Auth Logs

### Problema: Erro de permissão ao acessar dados
**Solução**:
1. Verifique se executou `supabase_rls_policies_improved.sql`
2. Verifique se usuário tem `company_id`:
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```

### Problema: Link de reset não funciona
**Solução**:
1. Verifique se a URL está em "Redirect URLs" no Supabase
2. Verifique se o link não expirou (válido por 1 hora)

## 📚 Documentação Adicional

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## ✨ Próximas Melhorias

- [ ] Autenticação com Google/GitHub
- [ ] Autenticação de dois fatores (2FA)
- [ ] Logs de auditoria
- [ ] Convite de usuários por admin
- [ ] Gerenciamento de sessões ativas
- [ ] Rate limiting personalizado

---

**Última atualização**: 2025-10-02

**Desenvolvido para**: Ologx Transportes
