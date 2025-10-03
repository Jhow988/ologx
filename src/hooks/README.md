# Hooks do Supabase - OLogX

Este diretório contém hooks customizados para realizar operações CRUD com o banco de dados Supabase.

## Hooks Disponíveis

### 1. `useClients` - Gestão de Clientes

Gerencia todas as operações relacionadas a clientes.

**Exemplo de uso:**

```typescript
import { useClients } from '../hooks/useClients';

function MinhaComponent() {
  const {
    clients,           // Lista de clientes
    loading,           // Estado de carregamento
    createClient,      // Criar novo cliente
    updateClient,      // Atualizar cliente
    deleteClient,      // Deletar cliente
    getClientById      // Buscar cliente por ID
  } = useClients();

  // Criar cliente
  const handleCreate = async () => {
    await createClient({
      name: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      phone: '(11) 99999-9999',
      document: '12345678000190',
      address: 'Rua Exemplo, 123',
      city: 'São Paulo',
      state: 'SP',
      cep: '01234-567'
    });
  };

  // Atualizar cliente
  const handleUpdate = async (clientId: string) => {
    await updateClient(clientId, {
      name: 'Novo Nome'
    });
  };

  // Deletar cliente
  const handleDelete = async (clientId: string) => {
    await deleteClient(clientId);
  };
}
```

### 2. `useVehicles` - Gestão de Frota

Gerencia todas as operações relacionadas a veículos.

**Exemplo de uso:**

```typescript
import { useVehicles } from '../hooks/useVehicles';

function MinhaComponent() {
  const {
    vehicles,          // Lista de veículos
    loading,           // Estado de carregamento
    createVehicle,     // Criar novo veículo
    updateVehicle,     // Atualizar veículo
    deleteVehicle,     // Deletar veículo
    getVehicleById     // Buscar veículo por ID
  } = useVehicles();

  // Criar veículo
  const handleCreate = async () => {
    await createVehicle({
      plate: 'ABC-1234',
      model: 'Scania R450',
      brand: 'Scania',
      year: 2023,
      status: 'active',
      licensing_due_date: '2025-12-31'
    });
  };

  // Atualizar status
  const handleUpdate = async (vehicleId: string) => {
    await updateVehicle(vehicleId, {
      status: 'maintenance'
    });
  };
}
```

### 3. `useTrips` - Gestão de Viagens

Gerencia todas as operações relacionadas a viagens/serviços.

**Exemplo de uso:**

```typescript
import { useTrips } from '../hooks/useTrips';

function MinhaComponent() {
  const {
    trips,             // Lista de viagens (com relações)
    loading,           // Estado de carregamento
    createTrip,        // Criar nova viagem
    updateTrip,        // Atualizar viagem
    deleteTrip,        // Deletar viagem
    getTripById,       // Buscar viagem por ID
    updateTripStatus   // Atualizar apenas o status
  } = useTrips();

  // Criar viagem
  const handleCreate = async () => {
    await createTrip({
      client_id: 'uuid-do-cliente',
      vehicle_id: 'uuid-do-veiculo',
      driver_id: 'uuid-do-motorista',
      origin: 'São Paulo, SP',
      destination: 'Rio de Janeiro, RJ',
      start_date: '2025-10-01',
      value: 5000,
      status: 'pending',
      cte: '12345',
      nf: '67890'
    });
  };

  // Atualizar status
  const handleStatusUpdate = async (tripId: string) => {
    await updateTripStatus(tripId, 'in_progress');
  };
}
```

### 4. `useFinancial` - Gestão Financeira

Gerencia categorias, subcategorias e lançamentos financeiros.

**Exemplo de uso:**

```typescript
import { useFinancial } from '../hooks/useFinancial';

function MinhaComponent() {
  const {
    // Lançamentos
    records,           // Lista de lançamentos
    loading,           // Estado de carregamento
    createRecord,      // Criar lançamento
    updateRecord,      // Atualizar lançamento
    deleteRecord,      // Deletar lançamento

    // Categorias
    categories,        // Lista de categorias
    createCategory,    // Criar categoria
    deleteCategory,    // Deletar categoria

    // Subcategorias
    subcategories,     // Lista de subcategorias
    createSubcategory, // Criar subcategoria
    deleteSubcategory  // Deletar subcategoria
  } = useFinancial();

  // Criar categoria
  const handleCreateCategory = async () => {
    await createCategory('Combustível');
  };

  // Criar subcategoria
  const handleCreateSubcategory = async (categoryId: string) => {
    await createSubcategory(categoryId, 'Diesel');
  };

  // Criar lançamento financeiro
  const handleCreateRecord = async () => {
    await createRecord({
      type: 'expense',           // 'income' ou 'expense'
      description: 'Abastecimento',
      amount: 500.00,
      due_date: '2025-10-15',
      status: 'pending',          // 'pending', 'paid', 'overdue'
      category_id: 'uuid-da-categoria',
      subcategory_id: 'uuid-da-subcategoria',
      recurrence: 'none'          // 'none', 'monthly', 'weekly', etc
    });
  };
}
```

## Características dos Hooks

### ✅ Funcionalidades Incluídas

- **Auto-refresh**: Os dados são carregados automaticamente quando o componente monta
- **Filtragem por empresa**: Todos os dados são filtrados pela `company_id` do usuário logado
- **Feedback visual**: Toast notifications para sucesso/erro
- **TypeScript**: Totalmente tipado com tipos do Supabase
- **Tratamento de erros**: Console.error + toast para feedback ao usuário
- **Loading states**: Estado de carregamento para UX melhor

### 🔒 Segurança

Todos os hooks:
- Verificam se o usuário tem `companyId` antes de fazer operações
- Filtram dados pela empresa do usuário
- Adicionam automaticamente o `company_id` nas inserções
- Não expõem dados de outras empresas

### 📝 Próximos Passos

Depois de implementar os hooks, você precisa configurar **Row Level Security (RLS)** no Supabase para garantir segurança no banco de dados.

Veja o arquivo `docs/RLS_POLICIES.md` para os comandos SQL necessários.
