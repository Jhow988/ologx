# 🔐 Guia de Segurança - OLogX

## ✅ Status Atual de Segurança

### O que JÁ está seguro:
- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Multi-tenancy com isolamento por empresa
- ✅ Políticas de Storage com RLS
- ✅ Autenticação PKCE (Proof Key for Code Exchange)
- ✅ Variáveis de ambiente nunca commitadas no Git
- ✅ Foreign keys com CASCADE apropriado
- ✅ Validação de tipos MIME em uploads

## 🚨 AÇÕES OBRIGATÓRIAS ANTES DE PRODUÇÃO

### 1. Rotacionar API Keys do Supabase

**IMPORTANTE:** As chaves atuais são de desenvolvimento e devem ser trocadas!

```bash
# No Dashboard do Supabase:
# 1. Acesse: https://app.supabase.com/project/YOUR_PROJECT/settings/api
# 2. Vá em "Project API keys"
# 3. Clique em "Reset project API keys"
# 4. ⚠️ ATENÇÃO: Isso invalidará todas as sessões ativas!
# 5. Copie as NOVAS chaves
# 6. Atualize as variáveis de ambiente de produção
```

**Por que fazer isso?**
- As chaves atuais podem ter sido expostas durante desenvolvimento
- Melhor prática: diferentes chaves para dev/staging/prod
- Segurança em camadas

### 2. Configurar Variáveis de Ambiente na Vercel

**Opção A: Via Dashboard da Vercel (Recomendado)**

```
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto: ologx
3. Settings > Environment Variables
4. Adicionar uma por uma:

   Name: VITE_SUPABASE_URL
   Value: https://hpbnyyktoybpuickmujq.supabase.co
   Environment: Production
   [Add]

   Name: VITE_SUPABASE_ANON_KEY
   Value: [COLE A NOVA KEY ROTACIONADA]
   Environment: Production
   [Add]

   Name: VITE_APP_ENV
   Value: production
   Environment: Production
   [Add]
```

**Opção B: Via Vercel CLI**

```bash
# Instalar CLI (se ainda não tiver)
npm install -g vercel

# Fazer login
vercel login

# Adicionar variáveis
vercel env add VITE_SUPABASE_URL production
# Cole: https://hpbnyyktoybpuickmujq.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: [NOVA KEY ROTACIONADA]

vercel env add VITE_APP_ENV production
# Digite: production
```

### 3. Configurar Headers de Segurança na Vercel

Crie o arquivo `vercel.json` na raiz do projeto:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

**Depois de criar o arquivo:**

```bash
git add vercel.json
git commit -m "feat: Adicionar configurações de segurança Vercel"
git push origin main

# Vercel fará redeploy automático
```

### 4. Habilitar Recursos de Segurança no Supabase

No Dashboard do Supabase:

#### 4.1 Auth Settings
```
Authentication > Settings:
- ✅ Enable Email Confirmations
- ✅ Enable Secure Password (min 8 chars)
- ✅ Session timeout: 3600 seconds (1 hour)
- ✅ Refresh token rotation
```

#### 4.2 Rate Limiting
```
Authentication > Rate Limits:
- Emails sent per hour: 4
- SMS sent per hour: 4
- Signup requests per hour: 30
```

#### 4.3 Site URL Configuration
```
Authentication > URL Configuration:

Desenvolvimento:
- Site URL: http://localhost:5173
- Redirect URLs:
  - http://localhost:5173/**

Produção (após deploy na Vercel):
- Site URL: https://seu-projeto.vercel.app
- Redirect URLs:
  - https://seu-projeto.vercel.app/**
  - https://seu-dominio.com/** (se tiver domínio customizado)
```

### 5. Configurar Backup Automático

No Supabase Dashboard:
```
Database > Backups:
- ✅ Enable automated daily backups
- Retention: 7 days (mínimo)
```

### 6. Monitoramento e Logs

#### 6.1 Configurar Sentry (opcional mas recomendado)
```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 1.0,
});
```

#### 6.2 Logs no Supabase
```
Logs Explorer > Configure:
- ✅ Enable query logging
- ✅ Alert on failed authentication attempts
```

## 🔍 Verificações Periódicas

### Mensal:
- [ ] Revisar logs de acesso suspeitos
- [ ] Verificar políticas RLS ainda estão ativas
- [ ] Atualizar dependências com vulnerabilidades

### Trimestral:
- [ ] Rotacionar API keys
- [ ] Revisar permissões de usuários
- [ ] Audit de políticas de Storage

### Anual:
- [ ] Revisão completa de segurança
- [ ] Penetration testing (se aplicável)

## ⚠️ O QUE NUNCA FAZER

```bash
# ❌ NUNCA commite estas chaves:
SERVICE_ROLE_KEY
DATABASE_URL (com senha)
Senhas em plain text
Tokens de API de terceiros

# ❌ NUNCA exponha no frontend:
Service Role Key
Database Password
Secret Keys

# ❌ NUNCA desabilite:
RLS (Row Level Security)
HTTPS em produção
Email verification
```

## 📱 Contato de Segurança

Se encontrar vulnerabilidades:
1. NÃO abra issue pública
2. Entre em contato: [seu-email-de-seguranca@empresa.com]
3. Aguarde resposta antes de divulgar

## 🔗 Recursos Úteis

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web.dev Security](https://web.dev/secure/)

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0
