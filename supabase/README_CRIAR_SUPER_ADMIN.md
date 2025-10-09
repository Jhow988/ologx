# Como Criar Super Admin Manualmente

## Visão Geral

Para simplificar o processo inicial e evitar problemas com triggers, o **Super Admin deve ser criado diretamente no banco de dados**.

Depois que o Super Admin estiver criado, ele poderá:
- Cadastrar empresas
- Convidar admins para as empresas
- Os admins das empresas poderão convidar usuários normais

## Passos para Criar Super Admin

### 1. Acesse o SQL Editor do Supabase

Vá em: https://app.supabase.com/project/hpbnyyktoybpuickmujq/sql/new

### 2. Copie o Script

Abra o arquivo: `supabase/scripts/create_super_admin.sql`

### 3. Personalize os Dados

**ANTES de executar**, altere as seguintes linhas no SQL:

```sql
'seu-email@example.com'        → Seu email real
'SuaSenhaForte123!'            → Sua senha forte
'Super Administrador'          → Seu nome completo
```

**Exemplo:**
```sql
'jhonatan@ologx.com.br'
'MinhaS3nh@Segur@2025!'
'Jhonatan de Oliveira Pinto'
```

### 4. Execute o Script

1. Cole o script **completo** no SQL Editor
2. Clique em **"RUN"** (botão verde no canto inferior direito)
3. Aguarde a mensagem: `Super Admin criado com sucesso! User ID: xxx`

### 5. Faça Login

1. Acesse: https://ologx.com.br/login
2. Use o email e senha que você definiu no script
3. Você será redirecionado para o painel do Super Admin

## Fluxo Completo do Sistema

```
1. Super Admin (criado no banco)
   ↓
2. Super Admin cadastra Empresas
   ↓
3. Super Admin convida Admin para Empresa
   ↓
4. Admin da Empresa convida Usuários (motoristas, operadores, etc)
```

## Notas Importantes

- ✅ **Super Admin**: Criar manualmente no banco (este script)
- ✅ **Admin de Empresa**: Convidar via interface do Super Admin
- ✅ **Usuários**: Convidar via interface do Admin da Empresa
- ⚠️ **Não tente criar Super Admin pela interface** - isso causará erros

## Troubleshooting

### "Email já existe"
- Verifique se já não criou este super admin antes
- Você pode deletar o usuário existente e criar novamente

### "Permission denied"
- Certifique-se de estar logado no Supabase como owner do projeto
- Verifique se está usando o SQL Editor correto

### "Syntax error"
- Certifique-se de copiar o script COMPLETO
- Execute todo o bloco `DO $$` de uma vez só
