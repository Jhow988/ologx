# ✅ Checklist de Deploy - OLogX

Use este checklist para garantir que tudo está configurado antes do deploy.

## 🔧 Configuração Inicial

### Supabase

- [ ] **Projeto criado no Supabase**
  - URL do projeto: `___________________________`
  - Região: South America (São Paulo)

- [ ] **Credenciais copiadas**
  - [ ] Project URL copiada
  - [ ] Anon Key copiada

- [ ] **Migrations aplicadas**
  - [ ] Tabela `companies` criada
  - [ ] Tabela `profiles` criada
  - [ ] Tabela `clients` criada
  - [ ] Tabela `vehicles` criada
  - [ ] Tabela `trips` criada
  - [ ] Tabela `maintenances` criada
  - [ ] Tabela `financial_categories` criada
  - [ ] Tabela `financial_subcategories` criada
  - [ ] Tabela `financial_records` criada

- [ ] **RLS Policies aplicadas**
  - [ ] Companies policies
  - [ ] Profiles policies
  - [ ] Clients policies
  - [ ] Vehicles policies
  - [ ] Trips policies
  - [ ] Maintenances policies
  - [ ] Financial policies

- [ ] **Primeiro usuário criado**
  - Email: `___________________________`
  - Senha: (guardada em local seguro)
  - Company ID: `___________________________`
  - Profile criado e vinculado

### Netlify

- [ ] **Conta criada/login feito**
- [ ] **Repositório Git criado**
  - URL do repo: `___________________________`
  - Branch principal: `main`

- [ ] **Site criado no Netlify**
  - Site name: `___________________________`
  - URL: `https://___________________________`

- [ ] **Build settings configurados**
  - Build command: `npm run build`
  - Publish directory: `dist`

- [ ] **Variáveis de ambiente adicionadas**
  - [ ] `VITE_SUPABASE_URL` configurada
  - [ ] `VITE_SUPABASE_ANON_KEY` configurada

- [ ] **Deploy realizado com sucesso**
  - Status: ⚪ Pending | 🟢 Success | 🔴 Failed

## 🧪 Testes Locais

Antes de fazer deploy, teste localmente:

- [ ] **Instalação**
  ```bash
  npm install
  ```

- [ ] **Ambiente dev rodando**
  ```bash
  npm run dev
  ```

- [ ] **Login funciona**
  - Email e senha corretos
  - Redirect após login OK
  - Dados do usuário carregados

- [ ] **CRUD de Clientes funciona**
  - [ ] Listar clientes
  - [ ] Criar novo cliente
  - [ ] Editar cliente
  - [ ] Deletar cliente

- [ ] **CRUD de Veículos funciona**
  - [ ] Listar veículos
  - [ ] Criar novo veículo
  - [ ] Editar veículo
  - [ ] Deletar veículo

- [ ] **CRUD de Viagens funciona**
  - [ ] Listar viagens
  - [ ] Criar nova viagem
  - [ ] Editar viagem
  - [ ] Deletar viagem

- [ ] **Build de produção funciona**
  ```bash
  npm run build
  npm run preview
  ```

## 🚀 Deploy

- [ ] **Código commitado e pushed**
  ```bash
  git add .
  git commit -m "Ready for production"
  git push origin main
  ```

- [ ] **Deploy no Netlify executado**
  - Método: [ ] Auto (via Git) | [ ] Manual (CLI)
  - Status do build: ⚪ Building | 🟢 Success | 🔴 Failed

- [ ] **URL de produção funcionando**
  - URL: `https://___________________________`
  - Site carrega sem erros

## 🔒 Segurança

- [ ] **CORS configurado no Supabase**
  - Netlify URL adicionada em Allowed Origins

- [ ] **RLS habilitado em todas as tabelas**
  ```sql
  -- Verificar:
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
  ```

- [ ] **Variáveis sensíveis não commitadas**
  - `.env` está no `.gitignore`
  - Nenhuma senha/key no código

## 🧪 Testes em Produção

- [ ] **Login funciona**
  - [ ] Login com credenciais corretas
  - [ ] Logout funciona
  - [ ] Session persiste no refresh

- [ ] **Dados carregam corretamente**
  - [ ] Clientes aparecem
  - [ ] Veículos aparecem
  - [ ] Viagens aparecem
  - [ ] Apenas dados da empresa do usuário

- [ ] **Operações CRUD funcionam**
  - [ ] Criar novo registro
  - [ ] Editar registro
  - [ ] Deletar registro
  - [ ] Toast notifications aparecem

- [ ] **Segurança testada**
  - [ ] Usuário não autenticado é redirecionado
  - [ ] Dados de outras empresas não aparecem
  - [ ] Não há erros de CORS

## 📊 Pós-Deploy

- [ ] **Documentação atualizada**
  - [ ] README com URL de produção
  - [ ] Credenciais armazenadas em local seguro
  - [ ] Equipe notificada sobre novo ambiente

- [ ] **Backup configurado**
  - [ ] Backup automático do Supabase (se plano pago)
  - [ ] Ou schedule manual de backups

- [ ] **Monitoramento configurado**
  - [ ] Logs do Netlify acessíveis
  - [ ] Logs do Supabase acessíveis
  - [ ] Alertas configurados (opcional)

- [ ] **Domínio customizado (opcional)**
  - [ ] DNS configurado
  - [ ] SSL ativado (Netlify faz automático)

## 📝 Informações Importantes

### URLs
- **Desenvolvimento**: `http://localhost:5173`
- **Produção**: `https://___________________________`
- **Supabase Dashboard**: `https://app.supabase.com/project/___________`
- **Netlify Dashboard**: `https://app.netlify.com/sites/___________`

### Credenciais (NÃO COMMITAR!)
- **Admin Email**: `___________________________`
- **Supabase URL**: `___________________________`
- **Company ID**: `___________________________`

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build local
npm run build
npm run preview

# Deploy (se usando CLI)
netlify deploy --prod

# Ver logs
netlify logs
```

---

## 🎯 Próximos Passos

Depois do deploy bem-sucedido:

1. [ ] Criar mais usuários (admin, operadores, motoristas)
2. [ ] Importar dados iniciais (clientes, veículos)
3. [ ] Configurar emails transacionais
4. [ ] Adicionar analytics
5. [ ] Configurar CI/CD automático
6. [ ] Documentar processos para a equipe

---

**Data do Deploy**: ___/___/______
**Responsável**: ___________________________
**Status Final**: ⚪ Em progresso | 🟢 Sucesso | 🔴 Problemas

**Notas**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```
