# 🚀 Deploy no Vercel - Guia Completo

## ⚡ Opção 1: Via Dashboard (Mais Fácil)

### **Passo 1: Preparar o projeto**

1. **Garantir que o projeto builda corretamente:**
```bash
cd c:/Projetos/ologx/ologx
npm run build

# Se der erro, corrija antes de prosseguir!
```

2. **Commitar tudo no Git:**
```bash
git add .
git commit -m "Preparar para deploy em produção"
git push origin main
```

### **Passo 2: Criar conta no Vercel**

1. Acesse: https://vercel.com/signup
2. Clique em "Continue with GitHub"
3. Autorize o Vercel a acessar seus repositórios

### **Passo 3: Importar projeto**

1. No dashboard: https://vercel.com/new
2. Clique em "Import Git Repository"
3. Se não aparecer seu repositório:
   - Clique em "Adjust GitHub App Permissions"
   - Selecione o repositório `ologx`
4. Clique em "Import"

### **Passo 4: Configurar build**

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Geralmente detecta automaticamente!** ✅

### **Passo 5: Configurar variáveis de ambiente**

⚠️ **IMPORTANTE:** NÃO prosseguir sem isso!

1. Antes de clicar "Deploy", clique em "Environment Variables"
2. Adicionar:

```
Name: VITE_SUPABASE_URL
Value: https://hpbnyyktoybpuickmujq.supabase.co
Environment: Production

Name: VITE_SUPABASE_ANON_KEY
Value: [COLE A KEY ROTACIONADA AQUI]
Environment: Production

Name: VITE_APP_ENV
Value: production
Environment: Production
```

3. Clique em "Add" para cada uma

### **Passo 6: Deploy!**

1. Clique em "Deploy"
2. Aguarde 2-3 minutos (build + deploy)
3. ✅ **Pronto!** URL gerada: `https://ologx-xxx.vercel.app`

---

## ⚡ Opção 2: Via CLI (Mais Controle)

### **Passo 1: Instalar Vercel CLI**

```bash
npm install -g vercel
```

### **Passo 2: Login**

```bash
vercel login

# Escolher método (GitHub, Email, etc.)
```

### **Passo 3: Deploy**

```bash
cd c:/Projetos/ologx/ologx

# Deploy de teste (preview)
vercel

# Ou direto para produção
vercel --prod
```

### **Passo 4: Configurar variáveis de ambiente**

```bash
# Via CLI:
vercel env add VITE_SUPABASE_URL production
# Cole: https://hpbnyyktoybpuickmujq.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: [KEY ROTACIONADA]

vercel env add VITE_APP_ENV production
# Digite: production
```

### **Passo 5: Redeploy com as env vars**

```bash
vercel --prod
```

---

## 🔧 Configuração Adicional

### **Arquivo `vercel.json` (Opcional mas recomendado)**

Crie na raiz do projeto:

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
        }
      ]
    }
  ]
}
```

**Por que isso?**
- `rewrites`: Garante que React Router funcione (SPA)
- `headers`: Adiciona segurança extra

---

## 🔄 Deploy Automático (CI/CD)

### **Como funciona:**

```
1. Você faz mudanças no código
2. Commita: git commit -m "Nova feature"
3. Push: git push origin main
4. ✨ Vercel detecta e faz deploy automático!
5. Em 2-3 min seu site está atualizado
```

### **Preview Deploys:**

```
1. Criar branch: git checkout -b feature/nova-funcionalidade
2. Fazer mudanças
3. Push: git push origin feature/nova-funcionalidade
4. Abrir Pull Request no GitHub
5. ✨ Vercel cria URL de preview automática!
6. Testar antes de mergear
7. Mergear PR → Deploy automático em produção
```

---

## 🌐 Domínio Customizado (Opcional)

### **Domínio Grátis:**
```
https://ologx-seu-usuario.vercel.app
```

### **Domínio Próprio:**

1. Comprar domínio (ex: ologx.com.br)
   - Registro.br: ~R$ 40/ano
   - GoDaddy, HostGator, etc.

2. No Vercel Dashboard:
   - Settings > Domains
   - Add Domain: ologx.com.br
   - Seguir instruções de DNS

3. Configurar DNS (no registrador):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

4. Aguardar propagação (até 48h, geralmente <1h)
5. ✅ Site acessível em: https://ologx.com.br

---

## 🐛 Troubleshooting

### **Erro: "Build failed"**

```bash
# Testar build local primeiro:
npm run build

# Ver logs detalhados:
vercel logs [deployment-url]
```

### **Erro: "Variáveis de ambiente não funcionam"**

```bash
# Verificar se começam com VITE_
VITE_SUPABASE_URL ✅
SUPABASE_URL ❌ (Vite não reconhece!)

# Redeploy após adicionar vars:
vercel --prod --force
```

### **Erro: "404 ao navegar entre páginas"**

```bash
# Adicionar vercel.json com rewrites (ver acima)
# Ou configurar via Dashboard:
# Settings > Functions > Presets > Other
```

### **Site lento no Brasil**

```bash
# Vercel usa CDN global, deve ser rápido
# Se lento:
# 1. Verificar tamanho do bundle (npm run build)
# 2. Otimizar imagens
# 3. Usar lazy loading
```

---

## 📊 Monitoramento

### **Vercel Analytics (Opcional - Pago)**

```bash
# Instalar:
npm install @vercel/analytics

# Em main.tsx:
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### **Alternativa Grátis: Google Analytics**

```bash
# Adicionar no index.html:
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
```

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

```bash
[ ] Build local funciona (npm run build)
[ ] Código commitado no GitHub
[ ] Variáveis de ambiente configuradas no Vercel
[ ] Deploy realizado com sucesso
[ ] Site acessível via HTTPS
[ ] Login/Signup funcionando
[ ] Upload de arquivos funcionando
[ ] Testar em mobile
[ ] Verificar console do browser (sem erros)
[ ] Configurar domínio customizado (opcional)
```

---

## 💰 Custos

### **Plano Hobby (Grátis):**
- ✅ Projetos ilimitados
- ✅ 100GB bandwidth/mês
- ✅ 100 deploys/dia
- ✅ HTTPS automático
- ✅ Preview deploys

### **Quando precisar de upgrade:**
- Mais de 100GB bandwidth/mês
- Mais de 1000 usuários simultâneos
- Precisar de Analytics

**Para começar: Plano grátis é MAIS que suficiente!**

---

## 🔗 Links Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Deploy Vite Apps](https://vercel.com/docs/frameworks/vite)

---

**Tempo total para primeiro deploy:** 10-15 minutos
**Próximos deploys:** Automáticos (push = deploy)
