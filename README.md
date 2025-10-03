# 🚚 OLogX - Sistema de Gestão para Transportadoras

Sistema completo de gestão para empresas de transporte e logística, desenvolvido com React, TypeScript, Vite, Supabase e Netlify.

## ⚡ Quick Start

**Quer começar AGORA?** Veja o [QUICK_START.md](QUICK_START.md)

## 🚀 Funcionalidades

- ✅ **Gestão de Clientes** - Cadastro completo com documentos e localização
- ✅ **Gestão de Frota** - Controle de veículos, licenciamento e manutenções
- ✅ **Gestão de Viagens** - Controle de serviços, CT-e, NF e rastreamento
- ✅ **Sistema Financeiro** - Receitas, despesas, categorias e subcategorias
- ✅ **Alertas Inteligentes** - CNH vencida, licenciamento, manutenções
- ✅ **Dashboard Analytics** - Gráficos e métricas em tempo real
- ✅ **Relatórios em PDF** - Exportação de dados e documentos
- ✅ **Multi-tenant** - Suporte a múltiplas empresas
- ✅ **Sistema de Permissões** - Admin, Manager, Operator, Driver
- ✅ **Dark Mode** - Tema claro e escuro

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

**Desenvolvido com ❤️ usando React + Vite + Supabase + Netlify**