# 📊 Guia de Monitoramento e Logs - OLogX

## 🎯 Por que monitorar?

Monitoramento ajuda você a:
- ✅ Descobrir erros que acontecem com usuários reais
- ✅ Ver onde os erros acontecem (qual página, qual navegador)
- ✅ Receber alertas quando algo quebra
- ✅ Entender padrões de uso e performance

---

## 🔴 Opção 1: Sentry (Recomendado) ⭐

### **O que é?**
Ferramenta que captura erros JavaScript que acontecem no navegador dos usuários e te avisa!

### **Plano Grátis:**
- ✅ 5.000 erros/mês
- ✅ 1 projeto
- ✅ Retenção de dados: 90 dias
- ✅ Alertas por email

### **Passo 1: Criar conta no Sentry**

```
1. Acesse: https://sentry.io/signup/
2. Criar conta (GitHub, Google ou Email)
3. Selecione: "React"
4. Nome do projeto: ologx
5. Copiar o DSN (algo como: https://xxxxx@sentry.io/xxxxx)
```

### **Passo 2: Já instalamos o pacote!**

```bash
# Já fizemos:
npm install @sentry/react
```

### **Passo 3: Configurar no código**

Edite o arquivo `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

// Inicializar Sentry APENAS em produção
if (import.meta.env.VITE_APP_ENV === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Protege dados sensíveis
        blockAllMedia: true,
      }),
    ],

    // Taxa de amostragem
    tracesSampleRate: 1.0, // 100% das transações (reduzir se tiver muito tráfego)

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% das sessões normais
    replaysOnErrorSampleRate: 1.0, // 100% das sessões com erro

    // Ambiente
    environment: import.meta.env.VITE_APP_ENV || 'development',

    // Ignorar erros específicos (opcional)
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
    ],
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### **Passo 4: Adicionar variável de ambiente**

**No .env local (desenvolvimento):**
```bash
# Não adicionar DSN em dev (deixa vazio ou não adiciona)
# VITE_SENTRY_DSN=
```

**Na Vercel (produção):**
```
Settings > Environment Variables > Add

Name: VITE_SENTRY_DSN
Value: https://xxxxx@o4508xxxxx.ingest.us.sentry.io/xxxxx
Environment: Production
```

### **Passo 5: Testar erro (após deploy)**

```typescript
// Em qualquer componente, adicione temporariamente:
const testError = () => {
  throw new Error('Teste de erro do Sentry!');
};

// Chamar essa função
<button onClick={testError}>Testar Sentry</button>
```

Depois de clicar no botão, vá no dashboard do Sentry e veja o erro aparecer!

### **O que você verá no Sentry:**

```
┌──────────────────────────────────────────┐
│ Error: Teste de erro do Sentry!         │
├──────────────────────────────────────────┤
│ Stack Trace:                             │
│  at testError (Dashboard.tsx:42)         │
│  at onClick (Dashboard.tsx:58)           │
│                                          │
│ Browser: Chrome 120.0.0                  │
│ OS: Windows 10                           │
│ User: user@email.com (se logado)        │
│ Time: 2025-01-06 16:30:42               │
│ URL: /dashboard                          │
└──────────────────────────────────────────┘
```

---

## 📈 Opção 2: Vercel Analytics (Performance)

### **O que é?**
Monitora performance do site (velocidade, Core Web Vitals).

### **Plano Grátis:**
- ✅ 100.000 events/mês
- ✅ Core Web Vitals
- ✅ Páginas mais lentas

### **Como ativar:**

```bash
npm install @vercel/analytics
```

**Em `src/main.tsx`:**

```typescript
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
);
```

**Ou ativar pelo Dashboard:**
```
Vercel Dashboard > Projeto > Analytics > Enable
```

---

## 🗄️ Opção 3: Logs do Supabase

### **O que monitorar:**

#### **3.1 Logs de Autenticação**

```
Supabase Dashboard > Authentication > Logs

Filtrar por:
- Failed login attempts (tentativas de login falhadas)
- Suspicious activity (atividade suspeita)
```

#### **3.2 Logs de Queries**

```
Supabase Dashboard > Logs Explorer

Queries úteis:
- SELECT * FROM auth.audit_log_entries WHERE created_at > now() - interval '1 day'
- Erros de permissão (RLS)
- Queries lentas (> 1s)
```

#### **3.3 Configurar Alertas**

```
Logs Explorer > Create Alert

Exemplo: Alertar quando:
- Mais de 10 logins falhados em 1 hora
- Erro de RLS (alguém tentando acessar dados que não pode)
```

---

## 🔔 Opção 4: Alertas por Email/Webhook

### **Sentry Alerts:**

```
Sentry Dashboard > Alerts > Create Alert

Exemplo:
- Enviar email quando: Mais de 10 erros em 1 hora
- Webhook para Slack/Discord quando: Erro crítico
```

### **Supabase Webhooks:**

```
Supabase Dashboard > Database > Webhooks

Exemplo: Webhook quando novo usuário se cadastra
POST https://seu-webhook.com/new-user
```

---

## 📊 Dashboard Personalizado (Opcional)

### **Combinação de dados:**

```typescript
// Criar página /admin/analytics no seu app

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    errorRate: 0,
  });

  useEffect(() => {
    async function loadStats() {
      // Usuários
      const { count: users } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Viagens
      const { count: trips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: users || 0,
        totalTrips: trips || 0,
        errorRate: 0, // Buscar do Sentry API
      });
    }

    loadStats();
  }, []);

  return (
    <div>
      <h1>Analytics</h1>
      <p>Total de Usuários: {stats.totalUsers}</p>
      <p>Total de Viagens: {stats.totalTrips}</p>
    </div>
  );
}
```

---

## 🎯 Recomendação para OLogX

### **Começar com (GRÁTIS):**

1. ✅ **Sentry** - Monitorar erros JavaScript
2. ✅ **Logs do Supabase** - Monitorar auth e database
3. 🟡 **Vercel Analytics** (opcional) - Monitorar performance

### **Quando crescer (PAGO):**

4. 💰 Google Analytics 4 - Rastrear uso e conversões
5. 💰 Hotjar - Gravação de sessões e heatmaps
6. 💰 LogRocket - Session replay completo

---

## ✅ Checklist de Implementação

```bash
[ ] Criar conta no Sentry
[ ] Copiar DSN do Sentry
[ ] Adicionar VITE_SENTRY_DSN na Vercel
[ ] Editar src/main.tsx com código do Sentry
[ ] Fazer deploy
[ ] Testar erro para ver se aparece no Sentry
[ ] Configurar alertas no Sentry
[ ] Ativar logs no Supabase
[ ] (Opcional) Instalar Vercel Analytics
```

---

## 🐛 Exemplos de Erros que o Sentry Captura

### **Erro de API:**
```typescript
try {
  await supabase.from('trips').insert(data);
} catch (error) {
  Sentry.captureException(error); // Enviar para Sentry
  toast.error('Erro ao salvar viagem');
}
```

### **Erro de navegação:**
```typescript
// Se usuário tentar acessar página que não existe
// Sentry captura automaticamente!
```

### **Erro de componente:**
```typescript
// Se um componente quebrar durante render
// Sentry captura com stack trace completo!
```

---

## 💰 Custos

| Ferramenta | Grátis | Pago |
|------------|--------|------|
| Sentry | 5k erros/mês | $26/mês (50k erros) |
| Vercel Analytics | 100k events/mês | Incluído no Pro |
| Supabase Logs | Básico | Avançado no Pro |
| Google Analytics | ✅ Grátis | ✅ Grátis |

**Para começar: Tudo grátis!** 🎉

---

## 🔗 Links Úteis

- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Logs](https://supabase.com/docs/guides/platform/logs)

---

**Próximo passo:** Configurar Sentry após primeiro deploy! 🚀
