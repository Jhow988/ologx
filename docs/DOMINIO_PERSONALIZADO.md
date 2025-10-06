# 🌐 Configurar Domínio Personalizado - OLogX

## 📍 Onde Configurar

### **Local: Dashboard da Vercel**

```
1. Fazer login: https://vercel.com
2. Selecionar projeto: ologx
3. Ir em: Settings (aba superior)
4. No menu lateral: Domains
5. Clicar em: "Add Domain"
```

---

## 🛒 Passo 1: Comprar Domínio

### **Recomendações por tipo:**

#### **.com.br** (Empresa brasileira)
- **Onde:** https://registro.br
- **Custo:** R$ 40/ano
- **Vantagens:**
  - ✅ Credibilidade no Brasil
  - ✅ Oficial brasileiro
  - ✅ Proteção legal

#### **.com** (Internacional/Startup)
- **Onde:** https://www.cloudflare.com/products/registrar/
- **Custo:** ~$10/ano
- **Vantagens:**
  - ✅ Mais barato
  - ✅ DNS integrado
  - ✅ Global

#### **.app** (Aplicativo)
- **Onde:** Google Domains, Cloudflare
- **Custo:** ~$12/ano
- **Vantagens:**
  - ✅ Moderno
  - ✅ HTTPS obrigatório (mais seguro)

### **Sugestões de nomes:**
```
ologx.com.br
ologx.app
ologx.com
gerenciador-logistica.com.br
sistemalogx.com.br
```

---

## ⚙️ Passo 2: Configurar na Vercel

### **2.1: Adicionar Domínio**

```
1. Vercel Dashboard > Projeto > Settings > Domains
2. Clicar em "Add"
3. Digitar: ologx.com.br (ou seu domínio)
4. Clicar em "Add"
```

### **2.2: Vercel mostrará configurações:**

```
┌────────────────────────────────────────┐
│ Configure DNS                          │
├────────────────────────────────────────┤
│ Add these records to your DNS provider:│
│                                         │
│ Type    Name    Value                  │
│ ─────────────────────────────────────  │
│ A       @       76.76.21.21            │
│ CNAME   www     cname.vercel-dns.com   │
└────────────────────────────────────────┘
```

**⚠️ NÃO FECHE ESTA PÁGINA!** Copie estes valores!

---

## 🔧 Passo 3: Configurar DNS no Registrador

### **Opção A: Registro.br**

```
1. Login: https://registro.br
2. Meus Domínios > Selecionar domínio
3. Editar zona DNS
4. Adicionar registros:

   ┌─────────────────────────────────────┐
   │ Tipo: A                             │
   │ Nome: @                             │
   │ Valor: 76.76.21.21                  │
   │ TTL: 3600                           │
   └─────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │ Tipo: CNAME                         │
   │ Nome: www                           │
   │ Valor: cname.vercel-dns.com         │
   │ TTL: 3600                           │
   └─────────────────────────────────────┘

5. Salvar alterações
```

### **Opção B: Cloudflare**

```
1. Login: https://dash.cloudflare.com
2. Selecionar domínio
3. DNS > Records > Add record

   Registro 1:
   Type: A
   Name: @
   IPv4: 76.76.21.21
   Proxy: OFF (nuvem cinza) ← IMPORTANTE!
   TTL: Auto

   Registro 2:
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   Proxy: OFF (nuvem cinza) ← IMPORTANTE!
   TTL: Auto

4. Save
```

### **Opção C: GoDaddy**

```
1. Login: https://account.godaddy.com
2. My Products > DNS
3. Gerenciar DNS
4. Adicionar:

   Type: A
   Host: @
   Points to: 76.76.21.21
   TTL: 1 hour

   Type: CNAME
   Host: www
   Points to: cname.vercel-dns.com
   TTL: 1 hour

5. Salvar
```

---

## ⏱️ Passo 4: Aguardar Propagação

### **Quanto tempo demora?**

```
Mínimo: 5 minutos
Médio: 1-2 horas
Máximo: 48 horas (raro)
```

### **Como verificar?**

#### **Opção 1: Vercel Dashboard**
```
Settings > Domains
Status do domínio deve mudar de:
❌ "Invalid Configuration"
para
✅ "Valid Configuration"
```

#### **Opção 2: Comando DNS**
```bash
# Windows:
nslookup ologx.com.br

# Deve retornar:
# Address: 76.76.21.21

# Mac/Linux:
dig ologx.com.br

# Deve mostrar:
# ANSWER SECTION:
# ologx.com.br. 3600 IN A 76.76.21.21
```

#### **Opção 3: Ferramentas Online**
```
https://www.whatsmydns.net
Digite: ologx.com.br
Verificar propagação mundial
```

---

## 🔒 Passo 5: Configurar HTTPS (Automático!)

### **Vercel faz isso sozinha:**

```
1. Detecta domínio configurado
2. Gera certificado SSL (Let's Encrypt)
3. Habilita HTTPS automático
4. Redireciona HTTP → HTTPS

Tempo: 2-10 minutos após DNS propagar
```

### **Verificar:**
```
1. Acessar: http://ologx.com.br
2. Deve redirecionar para: https://ologx.com.br
3. Ver cadeado 🔒 no navegador
```

---

## 🎯 Configurações Adicionais (Recomendadas)

### **1. Redirecionar www para domínio principal**

```
Vercel Dashboard > Settings > Domains

Cenário A: Preferir sem www
✅ ologx.com.br (Primary)
🔄 www.ologx.com.br (Redirect to ologx.com.br)

Cenário B: Preferir com www
🔄 ologx.com.br (Redirect to www.ologx.com.br)
✅ www.ologx.com.br (Primary)
```

### **2. Atualizar Supabase Site URL**

```
Supabase Dashboard > Authentication > URL Configuration

Site URL: https://ologx.com.br
Redirect URLs: https://ologx.com.br/**

Salvar!
```

### **3. Atualizar Google/Facebook (se usar OAuth)**

```
Se usar "Login com Google":
- Google Cloud Console
- Adicionar: https://ologx.com.br aos redirect URIs
```

---

## 🐛 Troubleshooting

### **Problema: "Invalid Configuration" na Vercel**

**Causa:** DNS não propagou ainda

**Solução:**
```bash
1. Verificar registros DNS no registrador
2. Aguardar mais tempo (até 48h)
3. Limpar cache DNS local:

   # Windows:
   ipconfig /flushdns

   # Mac:
   sudo dscacheutil -flushcache

   # Linux:
   sudo systemd-resolve --flush-caches
```

### **Problema: "Too Many Redirects"**

**Causa:** Proxy Cloudflare ativado

**Solução:**
```
Cloudflare Dashboard > DNS
Clicar na nuvem laranja (Proxied)
Mudar para nuvem cinza (DNS only)
```

### **Problema: HTTPS não funciona**

**Causa:** Ainda gerando certificado

**Solução:**
```
Aguardar 10-15 minutos
Vercel gera certificado automaticamente
Verificar em: Settings > Domains > SSL
```

### **Problema: Domínio antigo ainda aparece**

**Causa:** Cache do navegador

**Solução:**
```
1. Ctrl + Shift + Del (limpar cache)
2. Ou modo anônimo: Ctrl + Shift + N
3. Ou usar outro navegador
```

---

## 💰 Custos Anuais

### **Cenário Mínimo:**
```
Domínio .com.br: R$ 40/ano
Vercel: R$ 0 (grátis)
Supabase: R$ 0 (free tier)
─────────────────────────
Total: R$ 40/ano (~R$ 3,33/mês)
```

### **Cenário Recomendado (após crescer):**
```
Domínio .com.br: R$ 40/ano
Vercel Pro: $20/mês = R$ 1200/ano
Supabase Pro: $25/mês = R$ 1500/ano
─────────────────────────
Total: ~R$ 2740/ano (~R$ 228/mês)
```

**Para começar: R$ 40/ano é suficiente!**

---

## 📧 E-mail Profissional (Opcional)

### **Ter email @ologx.com.br?**

#### **Opção 1: Google Workspace** (Recomendado)
```
Custo: R$ 30/mês por usuário
Inclui: Gmail, Drive, Meet, Calendar
Email: contato@ologx.com.br
```

#### **Opção 2: Zoho Mail** (Grátis até 5 usuários)
```
Custo: Grátis (lite) ou $1/mês/usuário
Email: suporte@ologx.com.br
```

#### **Opção 3: Cloudflare Email Routing** (Grátis!)
```
Custo: R$ 0 (apenas roteamento)
Funcionalidade: Encaminhar emails
contato@ologx.com.br → seu-email@gmail.com
```

---

## ✅ Checklist Final

```bash
[ ] Domínio comprado
[ ] DNS configurado no registrador
[ ] Domínio adicionado na Vercel
[ ] DNS propagado (verificar com nslookup)
[ ] HTTPS funcionando (ver cadeado 🔒)
[ ] Redirecionamento www configurado
[ ] Site URL atualizado no Supabase
[ ] Testar login/signup com novo domínio
[ ] Compartilhar novo link com usuários! 🎉
```

---

## 🔗 Links Úteis

- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [DNS Propagation Checker](https://www.whatsmydns.net)
- [SSL Checker](https://www.ssllabs.com/ssltest/)
- [Registro.br](https://registro.br)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)

---

**Tempo estimado total:** 30 minutos (+ aguardar propagação DNS)
