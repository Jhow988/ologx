# 🔑 Como Rotacionar API Keys do Supabase

## ⚠️ ATENÇÃO: Diferença entre Legacy e Project API Keys

### ❌ **Legacy API Keys** (NÃO usar para rotação)
```
Settings > API > Legacy API Keys
- anon
- service_role
- [ Disable legacy API keys ]
```
**Estas são chaves antigas!** Você pode até desabilitar se não estiver usando.

### ✅ **Project API Keys** (Usar estas!)
```
Settings > API > Project API keys
- URL
- anon public
- service_role secret
- [ Generate new API keys ]
```

---

## 📸 Onde encontrar (passo a passo)

1. **No Dashboard do Supabase:**
   ```
   https://app.supabase.com/project/hpbnyyktoybpuickmujq/settings/api
   ```

2. **Role a página para baixo** até ver:
   ```
   ┌─────────────────────────────────────┐
   │ Project API keys                     │
   ├─────────────────────────────────────┤
   │ URL                                  │
   │ https://...supabase.co              │
   │                                      │
   │ anon public                         │
   │ eyJhbGc... [Reveal] [Copy]          │
   │                                      │
   │ service_role secret                 │
   │ **** [Reveal]                       │
   │                                      │
   │ [Generate new API keys] ← AQUI!     │
   └─────────────────────────────────────┘
   ```

---

## 🔄 Processo de Rotação (Passo a Passo)

### **ANTES DE COMEÇAR:**
- ⚠️ Isso vai **invalidar todas as sessões ativas**!
- ⚠️ Usuários terão que fazer login novamente
- ⚠️ Faça em horário de baixo uso (madrugada/fim de semana)

### **Passo 1: Backup das chaves atuais**
```bash
# Copiar e salvar em local seguro (temporariamente):
VITE_SUPABASE_URL=https://hpbnyyktoybpuickmujq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Guardar por 24h caso precise reverter
```

### **Passo 2: Gerar novas chaves**
```
1. Clique em "Generate new API keys"
2. Confirme: "Yes, generate new keys"
3. Aguarde alguns segundos
4. ✅ Novas chaves geradas!
```

### **Passo 3: Copiar NOVA anon key**
```
1. Clique em [Reveal] ao lado de "anon public"
2. Clique em [Copy]
3. Cole em arquivo temporário
```

### **Passo 4: Atualizar .env local**
```bash
# .env (desenvolvimento)
VITE_SUPABASE_URL=https://hpbnyyktoybpuickmujq.supabase.co
VITE_SUPABASE_ANON_KEY=<NOVA_KEY_AQUI>  # ← Substituir
VITE_APP_ENV=development
```

### **Passo 5: Testar localmente**
```bash
# Reiniciar servidor de desenvolvimento
npm run dev

# Tentar fazer login
# Se funcionou ✅ prosseguir
# Se não funcionou ❌ verificar key copiada corretamente
```

### **Passo 6: Atualizar produção**

#### **Se usando Vercel:**
```bash
# Via CLI:
vercel env rm VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SUPABASE_ANON_KEY production
# Colar a NOVA key quando solicitado

# Ou via Dashboard:
# https://vercel.com/seu-usuario/ologx/settings/environment-variables
# 1. Deletar VITE_SUPABASE_ANON_KEY antiga
# 2. Add New > Name: VITE_SUPABASE_ANON_KEY
# 3. Value: <NOVA_KEY>
# 4. Environment: Production
# 5. Save
```

#### **Se usando Netlify:**
```bash
# Via Dashboard:
# https://app.netlify.com/sites/seu-site/settings/deploys#environment
# 1. Edit variables
# 2. VITE_SUPABASE_ANON_KEY = <NOVA_KEY>
# 3. Save
```

### **Passo 7: Redeployar**
```bash
# Vercel (redeploy automático após mudar env vars)
# Ou forçar:
vercel --prod

# Netlify
# Deploys > Trigger deploy > Deploy site
```

### **Passo 8: Verificar produção**
```
1. Acessar https://seudominio.com
2. Fazer logout (se logado)
3. Tentar fazer login
4. Criar novo registro de teste
5. ✅ Se tudo funcionou, rotação completa!
```

---

## ⏮️ Reverter se algo der errado

Se a rotação falhar, você tem 2 opções:

### **Opção 1: Usar chaves antigas (salvou no Passo 1)**
```bash
# Atualizar .env e variáveis de produção com as chaves antigas
# MAS: Não é possível "desrotacionar" no Supabase
# As chaves antigas foram INVALIDADAS permanentemente
```

### **Opção 2: Gerar novas chaves novamente**
```bash
# Repetir o processo de rotação
# Gerar novas keys
# Atualizar tudo de novo
```

**⚠️ IMPORTANTE:** Uma vez que você clica em "Generate new API keys", não há volta! As chaves antigas param de funcionar imediatamente.

---

## 🎯 Quando fazer rotação?

### **Obrigatório:**
- ✅ Antes do primeiro deploy em produção
- ✅ Se as chaves vazaram (commit acidental, screenshot público, etc.)
- ✅ Após demitir desenvolvedor que tinha acesso

### **Recomendado:**
- 🟡 A cada 6 meses (boa prática)
- 🟡 Após auditoria de segurança
- 🟡 Antes de vender/transferir projeto

### **Opcional:**
- 🟢 Após upgrade de plano
- 🟢 Mudança de arquitetura

---

## ❓ FAQ

### **P: Preciso rotacionar service_role também?**
**R:** Sim, é rotacionado junto com anon key automaticamente. Mas você NÃO deve usar service_role no frontend de qualquer forma!

### **P: Quantas vezes posso rotacionar?**
**R:** Ilimitado. Mas cada rotação invalida sessões de usuários.

### **P: Posso agendar rotação?**
**R:** Não nativamente no Supabase. Mas pode fazer via API (avançado).

### **P: E se eu só quiser trocar a service_role?**
**R:** Não dá para rotacionar individualmente. Sempre rotaciona as duas juntas.

### **P: As chaves Legacy afetam algo?**
**R:** Não se você não as estiver usando. Pode desabilitar clicando em "Disable legacy API keys".

---

## 🔗 Links Úteis

- [Supabase Docs: Managing API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-security)

---

**Última atualização:** 2025-01-XX
