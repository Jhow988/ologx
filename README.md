# 🚚 OLogX - Sistema de Gestão para Transportadoras

Sistema completo de gestão para empresas de transporte e logística, desenvolvido com React, TypeScript, Vite, Supabase e Netlify.

## ⚡ Quick Start

**Quer começar AGORA?** Veja o [QUICK_START.md](QUICK_START.md)

## 🚀 Funcionalidades

### Core Features
- ✅ **Gestão de Clientes** - Cadastro completo com documentos e localização
- ✅ **Gestão de Frota** - Controle de veículos, licenciamento e manutenções
- ✅ **Gestão de Viagens** - Controle de serviços, CT-e, NF e rastreamento
- ✅ **Sistema Financeiro** - Receitas, despesas, categorias e subcategorias
- ✅ **Alertas Inteligentes** - CNH vencida, licenciamento, manutenções
- ✅ **Dashboard Analytics** - Gráficos e métricas em tempo real
- ✅ **Relatórios em PDF** - Exportação de dados e documentos
- ✅ **Multi-tenant** - Suporte a múltiplas empresas
- ✅ **Dark Mode** - Tema claro e escuro

### Sistema de Permissões e Usuários
- ✅ **Perfis Personalizados** - Criação de perfis customizados com permissões específicas
- ✅ **Gestão de Usuários** - Ativação/desativação de usuários pelo sistema
- ✅ **Controle de Acesso** - Menus e funcionalidades filtrados por permissão
- ✅ **Categorias CNH** - Controle de categorias da CNH dos motoristas (A, B, C, D, E)
- ✅ **Validação de Habilitação** - Veículos requerem categoria CNH específica

### Alertas e Notificações
- ✅ **Central de Alertas** - Sistema completo de alertas de vencimentos
- ✅ **Marcar como Lido** - Controle individual de alertas lidos/não lidos
- ✅ **Filtros de Alertas** - Mostrar/ocultar alertas já lidos
- ✅ **Contador de Não Lidos** - Badge com quantidade de alertas pendentes

### Relatórios e Fechamento
- ✅ **Fechamento por Cliente** - Relatórios filtrados por cliente específico
- ✅ **Exportação PDF** - Geração de PDF com informações completas da empresa
- ✅ **Período Customizado** - Seleção de datas para fechamento

## 🛠️ Tecnologias

### Frontend
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **ECharts** - Data Visualization
- **React Router** - Navigation
- **Lucide Icons** - Icon Library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions

### Deploy
- **Netlify** - Hosting e CI/CD

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no Netlify (para produção)

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/ologx.git
cd ologx
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations em `supabase/migrations/`
3. **IMPORTANTE**: Aplique as políticas RLS (veja [docs/RLS_POLICIES.md](docs/RLS_POLICIES.md))
4. Crie o primeiro usuário e empresa (veja [QUICK_START.md](QUICK_START.md))

### 5. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 📚 Documentação

- **[QUICK_START.md](QUICK_START.md)** - Comece em 5 minutos
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Deploy completo para produção
- **[RLS_POLICIES.md](docs/RLS_POLICIES.md)** - Políticas de segurança do banco
- **[SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)** - Configuração detalhada do Supabase
- **[Hooks README](src/hooks/README.md)** - Documentação dos hooks CRUD
- **[Deploy Checklist](scripts/deploy-checklist.md)** - Checklist de deploy

## 🏗️ Estrutura do Projeto

```
ologx/
├── src/
│   ├── components/      # Componentes React
│   │   ├── Forms/       # Formulários
│   │   ├── Layout/      # Layout (Sidebar, Header)
│   │   └── UI/          # Componentes UI reutilizáveis
│   ├── contexts/        # React Contexts (Auth, Theme)
│   ├── hooks/           # Custom Hooks (useClients, useVehicles, etc)
│   ├── lib/             # Configurações (Supabase client)
│   ├── pages/           # Páginas da aplicação
│   │   ├── Auth/        # Login, Register
│   │   ├── Cadastros/   # CRUD pages
│   │   └── SuperAdmin/  # Admin pages
│   ├── types/           # TypeScript types
│   └── config/          # Configurações (permissions)
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── docs/                # Documentação
├── public/              # Assets estáticos
└── scripts/             # Scripts úteis
```

## 🔐 Segurança

O sistema implementa múltiplas camadas de segurança:

1. **Autenticação** via Supabase Auth
2. **Row Level Security (RLS)** - Usuários só veem dados da sua empresa
3. **Permissões por Role** - Admin, Manager, Operator, Driver
4. **Variáveis de ambiente** - Credenciais não commitadas
5. **HTTPS** - Comunicação encriptada

## 🧪 Testes

```bash
# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 📊 Hooks Disponíveis

O projeto inclui hooks customizados para todas as operações CRUD:

- **useClients** - Gestão de clientes
- **useVehicles** - Gestão de veículos
- **useTrips** - Gestão de viagens
- **useFinancial** - Gestão financeira

Cada hook oferece:
- Auto-refresh de dados
- Filtragem automática por empresa
- Toast notifications
- Loading states
- TypeScript types

Veja [src/hooks/README.md](src/hooks/README.md) para exemplos de uso.

## 🌐 Deploy

### Deploy Automático (Recomendado)

1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente
3. Deploy automático a cada push na main

Veja o guia completo em [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

### Deploy Manual

```bash
# Build
npm run build

# Deploy para Netlify
netlify deploy --prod
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 License

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido por [Seu Nome]

## 🆘 Suporte

- **Documentação**: Veja os arquivos em `/docs`
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/ologx/issues)
- **Email**: seu-email@exemplo.com

---

## 📋 Changelog

### v2.0.0 - Sistema de Validação CNH e Melhorias de UX (Janeiro 2025)

#### 🎯 Funcionalidades Principais

**Sistema de Categorias CNH**
- ✅ Campo de categorias CNH no cadastro de motoristas (A, B, C, D, E)
- ✅ Seleção múltipla de categorias com checkboxes
- ✅ Campo de categoria necessária no cadastro de veículos
- ✅ Validação automática ao vincular motorista a veículo em viagens
- ✅ Filtro inteligente: apenas motoristas qualificados aparecem na lista
- ✅ Mensagem informativa sobre restrições de categoria

**Gestão de Usuários Aprimorada**
- ✅ Ativação e desativação de usuários diretamente pelo sistema
- ✅ Integração com Supabase Auth para ban/unban de usuários
- ✅ Modal de confirmação com feedback claro
- ✅ Rollback automático em caso de erro
- ✅ Display de categorias CNH na tabela de usuários com badges

**Sistema de Permissões Personalizado**
- ✅ Suporte completo a perfis customizados criados no banco
- ✅ Detecção automática de UUID para custom roles
- ✅ Carregamento dinâmico de permissões do banco de dados
- ✅ Filtro de menus baseado em permissões do usuário
- ✅ Fallback para roles legados (admin, manager, etc)

**Central de Alertas Inteligente**
- ✅ Sistema de marcação de alertas como lidos
- ✅ Tabela `read_alerts` com RLS policies
- ✅ Toggle para mostrar/ocultar alertas lidos
- ✅ Contador de alertas não lidos com badge
- ✅ Indicador visual de alertas lidos com opacidade
- ✅ Botão para desmarcar alertas como não lidos

**Fechamento por Cliente**
- ✅ Filtro de relatórios por cliente específico
- ✅ Dropdown com lista de clientes da empresa
- ✅ Opção "Todos" para relatório completo
- ✅ Nome correto da empresa nos PDFs exportados
- ✅ Query otimizada com filtro de `client_id`

#### 🗄️ Migrações de Banco de Dados

**20250730130000_create_alerts_read_table.sql**
- Tabela `read_alerts` para rastreamento de alertas lidos
- Índices em `user_id` e `alert_id`
- Policies RLS para controle de acesso
- Constraint `unique_user_alert` para evitar duplicatas

**20250730140000_add_cnh_categories.sql**
- Coluna `cnh_categories` (TEXT ARRAY) na tabela `profiles`
- Armazena múltiplas categorias de CNH do motorista
- Default para array vazio `'{}'`

**20250730150000_add_vehicle_cnh_category.sql**
- Coluna `required_cnh_category` (TEXT) na tabela `vehicles`
- Constraint CHECK para validar valores (A, B, C, D, E)
- Campo opcional (NULL permitido)

#### 🎨 Melhorias de Interface

**Componentes Atualizados**
- `InviteUserForm.tsx` - Campo de categorias CNH com checkboxes
- `NewUserForm.tsx` - Categorias CNH condicional ao perfil Motorista
- `NewVehicleForm.tsx` - Dropdown de categoria necessária
- `NewTripForm.tsx` - Validação e mensagem de restrição
- `Usuarios.tsx` - Coluna de categorias CNH com badges azuis
- `Alertas.tsx` - Sistema completo de lido/não lido
- `Fechamento.tsx` - Filtro por cliente

**Tipos TypeScript**
- `User.cnhCategories?: string[]` - Array de categorias do motorista
- `Vehicle.required_cnh_category?: 'A' | 'B' | 'C' | 'D' | 'E'` - Categoria necessária

#### 🔧 Correções e Otimizações

**AuthContext**
- ✅ Detecção de UUID para custom roles via regex
- ✅ Fetch de permissões do banco para roles customizados
- ✅ Fallback para roles padrão do config
- ✅ Super admin com todas as permissões

**Validações**
- ✅ Verificação de categoria CNH ao selecionar veículo
- ✅ Filtro automático de motoristas disponíveis
- ✅ Reset de motorista selecionado se não qualificado
- ✅ Toast notifications em todas as operações

**Performance**
- ✅ useMemo para recalcular motoristas apenas quando necessário
- ✅ Queries otimizadas com filtros específicos
- ✅ Índices de banco para busca rápida

#### 📝 Documentação

**Arquivos Criados/Atualizados**
- `README.md` - Seção de funcionalidades expandida
- `README.md` - Changelog completo com todas as mudanças
- Comentários em migrations com metadados completos

#### 🎓 Como Usar

**Categorias CNH**
1. Cadastre motoristas e selecione suas categorias (A, B, C, D, E)
2. Cadastre veículos e defina a categoria necessária
3. Ao criar viagem, selecione o veículo primeiro
4. Sistema filtra automaticamente motoristas qualificados
5. Mensagem informa a restrição aplicada

**Alertas**
1. Acesse a Central de Alertas
2. Clique em "Marcar como lido" nos alertas visualizados
3. Use o toggle para mostrar/ocultar alertas lidos
4. Badge mostra quantidade de não lidos

**Fechamento**
1. Acesse Fechamento de Serviços
2. Selecione o período desejado
3. Escolha um cliente específico ou "Todos"
4. Exporte PDF com informações da empresa

---

**Desenvolvido com ❤️ usando React + Vite + Supabase + Netlify**