# Guia Completo - Configuração Supabase

## ✅ O que já está configurado

1. ✅ Cliente Supabase ([src/lib/supabaseClient.ts](../src/lib/supabaseClient.ts))
2. ✅ Variáveis de ambiente ([.env](.env))
3. ✅ Types TypeScript ([src/types/supabase.ts](../src/types/supabase.ts))
4. ✅ AuthContext com Supabase ([src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx))
5. ✅ Hooks CRUD criados:
   - `useClients` - Gestão de clientes
   - `useVehicles` - Gestão de veículos
   - `useTrips` - Gestão de viagens
   - `useFinancial` - Gestão financeira
6. ✅ Páginas atualizadas para usar os hooks

## 🚀 Próximos Passos

### 1. Configurar Row Level Security (RLS)

**CRÍTICO**: Sem RLS, qualquer usuário pode ver dados de todas as empresas!

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá no seu projeto
3. Abra **SQL Editor**
4. Copie e execute os comandos do arquivo [docs/RLS_POLICIES.md](./RLS_POLICIES.md)

### 2. Testar a aplicação

```bash
# Instalar dependências (se ainda não fez)
npm install

# Rodar em desenvolvimento
npm run dev
```

### 3. Criar primeiro usuário

Você precisa criar o primeiro usuário e empresa manualmente no Supabase:

**No SQL Editor do Supabase:**

```sql
-- 1. Criar uma empresa
INSERT INTO companies (id, name, email, phone, status)
VALUES (
  'uuid-aqui',  -- Gere um UUID
  'Minha Transportadora',
  'contato@transportadora.com',
  '(11) 99999-9999',
  'active'
);

-- 2. Criar usuário no Auth (usar Authentication > Add User no dashboard)
-- Email: admin@transportadora.com
-- Password: senha-segura

-- 3. Depois que criar o usuário no Auth, pegue o UUID dele e crie o profile:
INSERT INTO profiles (id, company_id, full_name, role, is_super_admin)
VALUES (
  'uuid-do-usuario-auth',  -- UUID do usuário criado no Auth
  'uuid-da-empresa',       -- UUID da empresa criada acima
  'Admin Principal',
  'admin',
  false
);
```

### 4. Fazer login

Agora você pode fazer login com:
- Email: `admin@transportadora.com`
- Senha: a que você definiu

## 📝 Como Usar os Hooks nas Páginas

### Exemplo: Criar um novo componente

```typescript
import React from 'react';
import { useClients } from '../hooks/useClients';
import { useVehicles } from '../hooks/useVehicles';

function MeuComponente() {
  const { clients, loading: clientsLoading, createClient } = useClients();
  const { vehicles, loading: vehiclesLoading } = useVehicles();

  const handleCreateClient = async () => {
    await createClient({
      name: 'Cliente Teste',
      email: 'teste@cliente.com',
      phone: '(11) 98765-4321'
    });
  };

  if (clientsLoading || vehiclesLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1>Clientes: {clients.length}</h1>
      <h1>Veículos: {vehicles.length}</h1>
      <button onClick={handleCreateClient}>
        Criar Cliente
      </button>
    </div>
  );
}
```

## 🔐 Segurança Implementada

### No Frontend (React)
- ✅ AuthContext verifica autenticação
- ✅ Hooks filtram por `company_id` do usuário
- ✅ Feedback visual com toast notifications

### No Backend (Supabase)
- ⚠️ **PENDENTE**: Configurar RLS policies (veja passo 1 acima)
- ⚠️ **PENDENTE**: Testar políticas de segurança

## 🎯 Funcionalidades Disponíveis

Agora você pode:

1. **Gestão de Clientes** ([pages/Cadastros/Clientes.tsx](../src/pages/Cadastros/Clientes.tsx))
   - Listar clientes
   - Criar cliente
   - Editar cliente
   - Excluir cliente
   - Buscar por nome/documento/cidade

2. **Gestão de Frota** ([pages/Cadastros/Frota.tsx](../src/pages/Cadastros/Frota.tsx))
   - Listar veículos
   - Criar veículo
   - Editar veículo
   - Excluir veículo
   - Filtrar por status

3. **Gestão de Viagens** ([pages/Viagens.tsx](../src/pages/Viagens.tsx))
   - Listar viagens com dados relacionados
   - Criar viagem
   - Editar viagem
   - Excluir viagem
   - Buscar por múltiplos campos

4. **Sistema Financeiro**
   - Gerenciar categorias e subcategorias
   - Criar lançamentos (receitas/despesas)
   - Atualizar status de pagamento

## 📊 Estrutura do Banco

```
companies (empresas)
├── profiles (usuários)
├── clients (clientes)
├── vehicles (veículos)
├── trips (viagens)
│   ├── → client
│   ├── → vehicle
│   └── → driver (profile)
├── maintenances (manutenções)
│   └── → vehicle
└── financial_*
    ├── financial_categories
    ├── financial_subcategories
    └── financial_records
        └── → category, subcategory
```

## 🐛 Troubleshooting

### Erro: "Row Level Security"
- **Problema**: RLS não configurado
- **Solução**: Execute os comandos em [RLS_POLICIES.md](./RLS_POLICIES.md)

### Erro: "Usuario não possui empresa associada"
- **Problema**: Profile sem `company_id`
- **Solução**: Atualize o profile no banco com um `company_id` válido

### Dados não aparecem
- **Problema**: `company_id` do usuário não bate com dados
- **Solução**: Verifique se os dados têm o mesmo `company_id` do usuário

### Erro ao criar dados
- **Problema**: RLS policies muito restritivas ou ausentes
- **Solução**: Verifique as policies com `SELECT` no SQL Editor

## 📚 Documentação Adicional

- [Hooks README](../src/hooks/README.md) - Como usar cada hook
- [RLS Policies](./RLS_POLICIES.md) - Políticas de segurança
- [Supabase Docs](https://supabase.com/docs) - Documentação oficial

## 🎉 Pronto!

Seu projeto agora está completamente conectado ao Supabase!

Todas as alterações que você fizer através dos hooks serão persistidas no banco de dados e aparecerão em tempo real para todos os usuários da mesma empresa.
