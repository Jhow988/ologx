# 🚀 Estratégia de Deploy - OLogX

## 📊 Opções de Ambiente

### **Opção 1: Projeto Único (Recomendado para começar)** ⭐

#### Estrutura:
```
Supabase (1 projeto)
└── hpbnyyktoybpuickmujq.supabase.co
    ├── Banco PostgreSQL
    ├── Auth
    └── Storage

Frontend
├── Desenvolvimento (localhost:5173)
│   └── VITE_SUPABASE_URL=https://hpbnyyktoybpuickmujq.supabase.co
│   └── VITE_APP_ENV=development
│
└── Produção (seudominio.com)
    └── VITE_SUPABASE_URL=https://hpbnyyktoybpuickmujq.supabase.co
    └── VITE_APP_ENV=production
```

#### Configuração:

**1. Criar .env para desenvolvimento (.env.local):**
```bash
VITE_SUPABASE_URL=https://hpbnyyktoybpuickmujq.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_APP_ENV=development
```

**2. Configurar no Vercel/Netlify (produção):**
```bash
VITE_SUPABASE_URL=https://hpbnyyktoybpuickmujq.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-ROTACIONADA
VITE_APP_ENV=production
```

#### Boas Práticas:
```typescript
// src/config/environment.ts
export const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
export const isProduction = import.meta.env.VITE_APP_ENV === 'production';

// Usar para features em desenvolvimento:
if (isDevelopment) {
  console.log('Debug info:', data);
}

// Ou feature flags:
const FEATURES = {
  newDashboard: isProduction ? false : true,
  betaReports: false
};
```

#### Separação de Dados:
```sql
-- Criar empresa de TESTES
INSERT INTO companies (name, is_test)
VALUES ('EMPRESA TESTE - NÃO DELETAR', true);

-- Política para identificar dados de teste
CREATE POLICY "Hide test data in production"
ON trips FOR SELECT
USING (
  -- Se estiver em prod, não mostrar dados de teste
  CASE
    WHEN current_setting('app.environment', true) = 'production'
    THEN (SELECT is_test FROM companies WHERE id = company_id) = false
    ELSE true
  END
);
```

---

### **Opção 2: Projetos Separados (Recomendado para escala)** 🏢

#### Estrutura:
```
[DEV] Supabase Desenvolvimento
└── xxxxx-dev.supabase.co
    ├── Schema completo
    ├── Dados de teste
    └── Migrations testadas primeiro

[PROD] Supabase Produção
└── yyyyy-prod.supabase.co
    ├── Schema idêntico
    ├── Dados reais
    └── Migrations aplicadas após teste
```

#### Passo a Passo:

**1. Criar novo projeto no Supabase:**
```bash
# No dashboard: https://app.supabase.com
# Clique em "New Project"
# Nome: OLogX - Production
# Password: [senha forte]
# Region: South America (São Paulo)
```

**2. Aplicar migrations no projeto PROD:**
```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto de produção
supabase link --project-ref yyyyy-prod

# Aplicar todas as migrations
supabase db push

# Ou aplicar manualmente via Dashboard
# SQL Editor > copiar e executar cada migration
```

**3. Configurar ambientes:**

**.env.development:**
```bash
VITE_SUPABASE_URL=https://xxxxx-dev.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
VITE_APP_ENV=development
```

**.env.production (Vercel/Netlify):**
```bash
VITE_SUPABASE_URL=https://yyyyy-prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_APP_ENV=production
```

**4. Workflow de migrations:**
```bash
# 1. Criar migration em DEV
supabase migration new add_new_feature

# 2. Editar arquivo SQL
# supabase/migrations/timestamp_add_new_feature.sql

# 3. Testar em DEV
supabase db push --project-ref xxxxx-dev

# 4. Se OK, aplicar em PROD
supabase db push --project-ref yyyyy-prod
```

---

## 🔄 Migração de Dados entre Projetos

### Se precisar copiar dados de DEV para PROD:

**Opção 1: Export/Import via Dashboard**
```bash
# 1. No projeto DEV:
# Database > Backups > Create backup

# 2. Download do backup

# 3. No projeto PROD:
# Database > Backups > Restore from backup
```

**Opção 2: Via pg_dump (mais controle)**
```bash
# 1. Export do DEV
pg_dump "postgresql://postgres:[senha]@db.xxxxx-dev.supabase.co:5432/postgres" \
  --data-only \
  --table=companies \
  --table=profiles \
  > backup.sql

# 2. Import no PROD
psql "postgresql://postgres:[senha]@db.yyyyy-prod.supabase.co:5432/postgres" \
  < backup.sql
```

**Opção 3: Seed data via código**
```typescript
// scripts/seed-production.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Cuidado!
);

async function seed() {
  // Inserir dados iniciais
  const { error } = await supabase.from('companies').insert([
    { name: 'Empresa Exemplo' }
  ]);
}
```

---

## 📋 Checklist de Deploy

### Primeira vez em Produção:

```bash
# PRÉ-DEPLOY
[ ] Decidir: 1 projeto ou 2 projetos?
[ ] Se 2 projetos: criar projeto PROD no Supabase
[ ] Aplicar todas as migrations no PROD
[ ] Rotacionar API keys do projeto PROD
[ ] Configurar Site URL no Supabase Auth
[ ] Configurar SMTP para emails (se necessário)

# DEPLOY
[ ] Configurar variáveis de ambiente no hosting
[ ] Deploy do frontend
[ ] Testar login/signup
[ ] Testar criação de empresa
[ ] Testar RLS (usuários só veem sua empresa)

# PÓS-DEPLOY
[ ] Configurar domínio customizado
[ ] Configurar SSL (automático no Vercel/Netlify)
[ ] Configurar backup automático no Supabase
[ ] Configurar monitoramento
```

---

## 💰 Custos

### Supabase Pricing:

**Free Tier (até 500MB DB):**
- ✅ 1 projeto grátis
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50MB bandwidth

**Pro Tier ($25/mês por projeto):**
- ✅ Projetos ilimitados
- ✅ 8GB database
- ✅ 100GB file storage
- ✅ 250GB bandwidth
- ✅ Backups automatizados (7 dias)

**Recomendação:**
- Começar com 1 projeto (Free)
- Upgrade para Pro quando:
  - Tiver +10 empresas usando
  - Precisar de backups automáticos
  - Banco > 500MB

---

## 🎯 Recomendação Final para OLogX

### Para começar (Próximos 3-6 meses):
```
✅ Opção 1: Projeto Único
- Usar projeto atual para dev e prod
- Criar empresa "TESTE" para desenvolvimento
- Rotacionar keys antes do primeiro deploy
- Usar VITE_APP_ENV para diferenciar ambientes
```

### Quando crescer (6+ meses / 20+ empresas):
```
✅ Migrar para Opção 2: Projetos Separados
- Criar projeto PROD
- Migrar dados reais
- Manter projeto DEV para testes
- Workflow: testar em DEV → aplicar em PROD
```

---

## 🔗 Links Úteis

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Managing Environments](https://supabase.com/docs/guides/getting-started/local-development)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/managing-migrations)
