# Configuração de Emails no Supabase

Este guia explica como configurar o envio de emails para ativação de conta e recuperação de senha no Supabase.

## 📧 Tipos de Emails Configurados

1. **Email de Confirmação** - Enviado quando um novo usuário se cadastra
2. **Email de Recuperação de Senha** - Enviado quando o usuário esquece a senha
3. **Email de Mudança de Email** - Enviado quando o usuário altera seu email
4. **Email de Convite** - Enviado quando um admin convida um novo usuário

## 🚀 Passo a Passo

### 1. Acessar Configurações de Email

1. Entre no [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **Email Templates**

### 2. Configurar SMTP (Recomendado para Produção)

Por padrão, o Supabase usa seus próprios servidores de email, mas eles têm limitações. Para produção, configure seu próprio SMTP.

#### Gmail SMTP (Recomendado - ologx.noreply@gmail.com)

**Passo 1: Criar conta Gmail para o sistema**
1. Crie uma conta Gmail: **ologx.noreply@gmail.com**
2. Use uma senha forte e guarde em local seguro

**Passo 2: Ativar Verificação em Duas Etapas**
1. Acesse https://myaccount.google.com/security
2. Faça login com **ologx.noreply@gmail.com**
3. Clique em **Verificação em duas etapas**
4. Siga os passos para ativar (vai precisar de um número de telefone)

**Passo 3: Gerar Senha de App**
1. Ainda em https://myaccount.google.com/security
2. Role até **Senhas de app** (aparece após ativar verificação em duas etapas)
3. Clique em **Senhas de app**
4. Em "Selecionar app", escolha **Outro (nome personalizado)**
5. Digite: **Ologx Supabase**
6. Clique em **Gerar**
7. **Copie a senha de 16 caracteres** (algo como: `abcd efgh ijkl mnop`)
8. Guarde esta senha - você vai usar no Supabase

**Passo 4: Configurar SMTP no Supabase**
1. No Supabase, vá em **Project Settings** → **Authentication**
2. Role até **SMTP Settings**
3. Ative **Enable Custom SMTP**
4. Configure:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: ologx.noreply@gmail.com
   Password: [Cole a Senha de App de 16 caracteres aqui]
   Sender email: ologx.noreply@gmail.com
   Sender name: Ologx Transportes
   ```
5. Clique em **Save**

**✅ Pronto!** Agora todos os emails serão enviados de **ologx.noreply@gmail.com**

---

#### Opção Alternativa: SendGrid

1. Crie conta em https://sendgrid.com
2. Gere uma API Key
3. Configure no Supabase:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Sua API Key do SendGrid]
   Sender email: seu-email@seudominio.com
   Sender name: Ologx Transportes
   ```

#### Opção Alternativa: Amazon SES

1. Configure Amazon SES
2. Obtenha credenciais SMTP
3. Configure no Supabase:
   ```
   Host: email-smtp.us-east-1.amazonaws.com
   Port: 587
   Username: [SMTP Username]
   Password: [SMTP Password]
   Sender email: seu-email@seudominio.com
   Sender name: Ologx Transportes
   ```

### 3. Configurar URLs de Redirecionamento

1. Vá em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `https://seudominio.com` (produção) ou `http://localhost:5173` (dev)
   - **Redirect URLs**: Adicione as URLs permitidas:
     ```
     http://localhost:5173/**
     https://seudominio.com/**
     ```

### 4. Personalizar Templates de Email

#### Template de Confirmação de Email

1. Vá em **Authentication** → **Email Templates** → **Confirm signup**
2. Personalize o template:

```html
<h2>Bem-vindo à Ologx!</h2>
<p>Obrigado por se cadastrar na Ologx Transportes.</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Se você não criou uma conta, ignore este email.</p>
<br>
<p>Equipe Ologx</p>
```

#### Template de Recuperação de Senha

1. Vá em **Authentication** → **Email Templates** → **Reset password**
2. Personalize o template:

```html
<h2>Recuperação de Senha - Ologx</h2>
<p>Você solicitou a recuperação de senha da sua conta Ologx.</p>
<p>Clique no link abaixo para redefinir sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Este link expira em 1 hora.</p>
<p>Se você não solicitou esta recuperação, ignore este email.</p>
<br>
<p>Equipe Ologx</p>
```

#### Template de Convite de Usuário

1. Vá em **Authentication** → **Email Templates** → **Invite user**
2. Personalize o template:

```html
<h2>Você foi convidado para a Ologx!</h2>
<p>Você foi convidado para fazer parte da equipe na Ologx Transportes.</p>
<p>Clique no link abaixo para aceitar o convite e criar sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Aceitar Convite</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Este link expira em 24 horas.</p>
<br>
<p>Equipe Ologx</p>
```

### 5. Configurar Expiração de Links

1. Vá em **Authentication** → **Auth** → **Security and Protection**
2. Configure os tempos de expiração:
   - **JWT expiry**: 3600 (1 hora)
   - **Refresh token expiry**: 2592000 (30 dias)
   - **Email OTP expiry**: 3600 (1 hora)

### 6. Ativar Confirmação de Email

1. Vá em **Authentication** → **Settings**
2. Em **User Signups**:
   - ✅ Marque **Enable email confirmations**
   - ✅ Marque **Enable email change confirmation**

## 🧪 Testar Envio de Emails

### Teste de Cadastro

1. Acesse `http://localhost:5173/signup`
2. Preencha o formulário e cadastre-se
3. Verifique seu email
4. Clique no link de confirmação

### Teste de Recuperação de Senha

1. Acesse `http://localhost:5173/forgot-password`
2. Digite seu email
3. Verifique seu email
4. Clique no link de recuperação
5. Redefina sua senha

## 🔧 Troubleshooting

### Emails não estão sendo enviados

**Problema**: Usuário não recebe email
**Soluções**:
1. Verifique a pasta de spam
2. Verifique se o SMTP está configurado corretamente
3. Verifique os logs em **Logs** → **Auth Logs**
4. Teste com outro provedor de email

### Link de confirmação não funciona

**Problema**: Ao clicar no link, dá erro
**Soluções**:
1. Verifique se a URL está na lista de **Redirect URLs**
2. Verifique se o **Site URL** está correto
3. Verifique se o link não expirou

### Erro ao enviar email com Gmail

**Problema**: "Username and Password not accepted"
**Soluções**:
1. Certifique-se de que a verificação em duas etapas está ativa
2. Use uma Senha de App, não sua senha normal do Gmail
3. Verifique se a conta Gmail não está bloqueada

### Rate Limit atingido

**Problema**: "Too many requests"
**Soluções**:
1. O Supabase gratuito tem limite de 4 emails/hora
2. Configure seu próprio SMTP para remover limitações
3. Upgrade para plano pago do Supabase

## 📊 Monitoramento

### Ver Logs de Email

1. Vá em **Logs** → **Auth Logs**
2. Filtre por `auth.user.invited`, `auth.user.signup`, `auth.user.recovery`
3. Verifique erros e sucessos

### Métricas

1. Vá em **Authentication** → **Users**
2. Veja quantos usuários confirmaram email
3. Monitore taxa de conversão

## 🔒 Segurança

### Boas Práticas

1. ✅ Sempre use HTTPS em produção
2. ✅ Configure SPF e DKIM para seu domínio
3. ✅ Use Rate Limiting
4. ✅ Configure expiração de tokens
5. ✅ Monitore logs regularmente

### Configurar SPF e DKIM

Se usar domínio próprio, configure:

**SPF Record:**
```
v=spf1 include:_spf.google.com ~all
```

**DKIM:**
Configure no seu provedor de DNS seguindo instruções do Gmail/SendGrid/SES

## 📝 Variáveis de Template Disponíveis

### Todos os Templates

- `{{ .SiteURL }}` - URL do site
- `{{ .ConfirmationURL }}` - URL de confirmação
- `{{ .Token }}` - Token de confirmação
- `{{ .TokenHash }}` - Hash do token
- `{{ .Email }}` - Email do usuário

### Template de Convite

- `{{ .InvitedByEmail }}` - Email de quem convidou
- `{{ .InvitedByName }}` - Nome de quem convidou

## 🎨 Personalização Avançada

### CSS Inline

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #2563eb; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Ologx Transportes</h1>
  </div>
  <div style="padding: 20px; background-color: #f9fafb;">
    <h2 style="color: #1f2937;">Bem-vindo!</h2>
    <p style="color: #4b5563;">Conteúdo do email aqui...</p>
    <a href="{{ .ConfirmationURL }}"
       style="display: inline-block; background-color: #2563eb; color: white;
              padding: 12px 24px; text-decoration: none; border-radius: 6px;
              margin-top: 16px;">
      Confirmar Email
    </a>
  </div>
  <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>© 2025 Ologx Transportes. Todos os direitos reservados.</p>
  </div>
</div>
```

## 📚 Recursos Adicionais

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configurar SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Templates de Email](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Troubleshooting Auth](https://supabase.com/docs/guides/auth/troubleshooting)

## ✅ Checklist Final

- [ ] SMTP configurado e testado
- [ ] Site URL configurado corretamente
- [ ] Redirect URLs adicionadas
- [ ] Templates de email personalizados
- [ ] Confirmação de email ativada
- [ ] Teste de cadastro realizado com sucesso
- [ ] Teste de recuperação de senha realizado
- [ ] SPF/DKIM configurados (produção)
- [ ] Monitoramento ativo
- [ ] Documentação revisada pela equipe

---

**Última atualização**: 2025-10-02
