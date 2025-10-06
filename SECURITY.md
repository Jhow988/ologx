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

### 2. Configurar Variáveis de Ambiente no Hosting

#### Para Vercel:
```bash
# No dashboard da Vercel ou via CLI:
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

#### Para Netlify:
```bash
# No dashboard: Site settings > Environment variables
# Ou via arquivo netlify.toml:
[build.environment]
  VITE_SUPABASE_URL = "https://your-prod-project.supabase.co"
  VITE_SUPABASE_ANON_KEY = "your-prod-anon-key"
```

### 3. Configurar Headers de Segurança

#### Para Vercel (vercel.json):
```json
{
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
        }
      ]
    }
  ]
}
```

#### Para Netlify (_headers):
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
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
- Site URL: https://seu-dominio.com
- Redirect URLs:
  - https://seu-dominio.com/**
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
