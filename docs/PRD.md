# Documento de Requisitos do Produto (PRD) - Ologx

**Versão:** 2.0
**Data:** 2025-05-22

## 1. Visão Geral

Ologx é um sistema de gestão para transportadoras de pequeno e médio porte, projetado para simplificar e centralizar as operações de cadastros, serviços, manutenção e finanças. O sistema visa oferecer uma interface clara, intuitiva e responsiva, com dashboards analíticos para auxiliar na tomada de decisões.

---

## 2. Requisitos Funcionais

### 2.1. Estrutura Geral e Design

-   **Design System:**
    -   Interface responsiva para desktop, tablet e mobile.
    -   Paleta de cores: Primária (`#cdb27b`), Destaque (`#de7c04`).
    -   Modo Light/Dark com persistência da preferência do usuário.
-   **Navegação:**
    -   Menu lateral principal, recolhível em todas as resoluções.
    -   Submenus no formato "accordion" para seções com múltiplos itens (Cadastros, Financeiro).
    -   Cabeçalho com acesso rápido ao menu, troca de tema, central de alertas e perfil de usuário.
-   **Componentes Reutilizáveis:**
    -   Cards, Botões, Tabelas e Modais padronizados em toda a aplicação.

### 2.2. Dashboard

-   Exibe cards com indicadores chave de performance (KPIs) da operação.
-   Apresenta atalhos para ações rápidas (ex: Nova Viagem, Cadastrar Cliente).
-   Mostra uma lista de viagens recentes e alertas importantes.

### 2.3. Módulo de Cadastros

-   **Frota:**
    -   CRUD (Create, Read, Update, Delete) completo para veículos.
    -   Formulário em modal para cadastro e edição, incluindo campos para Placa, Modelo, Marca, Ano, Status e **Vencimento do Licenciamento**.
    -   **Regra de Negócio:** Um veículo não pode ser excluído se estiver em manutenção ou associado a um motorista, para garantir a integridade dos dados. Um alerta informa o usuário sobre o bloqueio.
-   **Usuários:**
    -   CRUD para usuários do sistema.
    -   Formulário em modal para cadastro e edição.
    -   **Regra de Negócio:** O campo "Vencimento da CNH" é exibido condicionalmente, apenas para usuários com perfil "Motorista".
    -   **Regra de Negócio:** A exclusão é substituída por uma função de "Desativar/Reativar", preservando o histórico do usuário.
-   **Clientes:**
    -   CRU (Create, Read, Update) para clientes.
    -   A funcionalidade de exclusão foi removida para manter a integridade do histórico de serviços.
    -   **Regra de Negócio:** O sistema valida e impede o cadastro de clientes com Nome/Empresa, CNPJ/CPF ou Email duplicados.
-   **Categorias Financeiras:**
    -   Página dedicada para criar e remover categorias e subcategorias de contas a pagar/receber.
    -   **Regra de Negócio:** As categorias criadas aqui alimentam dinamicamente os campos de seleção no formulário de lançamentos financeiros.

### 2.4. Módulo de Serviços (antigo Viagens)

-   CRUD completo para gestão de serviços.
-   Formulário em modal para cadastro e edição, com campos para CT-e, NF, Solicitante, Tipo de Veículo, etc.
-   **Regra de Negócio (Agendamento):** O sistema impede o agendamento duplo de um motorista ou veículo na mesma data, filtrando dinamicamente as opções disponíveis no formulário e exibindo um alerta de conflito.
-   **Regra de Negócio (Status):** O status de um serviço pode ser alterado no formulário de edição, com regras flexíveis que permitem reverter um status "Concluído" ou "Cancelado".
-   **Upload de Arquivos:**
    -   Funcionalidade para anexar até 2 arquivos PDF por serviço, com limite de 10MB cada.
    -   O sistema simula a compactação dos arquivos com um feedback visual.
    -   Um ícone de clipe (`Paperclip`) identifica na tabela os serviços que contêm anexos.
-   **Filtros:** Filtros avançados por período, cliente e motorista.

### 2.5. Módulo de Manutenção

-   Página dedicada para gestão de manutenções preventivas e corretivas.
-   CRUD para registros de manutenção.
-   Formulário em modal para cadastro e edição, incluindo um campo opcional para "Lembrete da Próxima Manutenção".
-   **Regra de Negócio (Integração de Status):** Ao colocar um veículo em manutenção, seu status é automaticamente atualizado em todo o sistema. Ao concluir, o status retorna para "Ativo".

### 2.6. Módulo Financeiro

-   **Submenus:** Seção dividida em "Fechamento", "Contas a Pagar" e "Contas a Receber".
-   **Fechamento:**
    -   Tela para gerar fechamentos de serviços concluídos por empresa e período.
    -   Exibe um resumo com o total de serviços, valor total e uma tabela detalhada.
    -   **Exportação:** Permite exportar o resultado do fechamento para um arquivo **PDF**.
    -   **Regra de Negócio:** Valida se todos os campos foram preenchidos antes da busca, exibindo um modal de alerta em caso de erro.
-   **Contas a Pagar/Receber:**
    -   Navegação por mês ("Anterior", "Atual", "Próximo") para filtrar os lançamentos.
    -   **Regra de Negócio (Status):** Lançamentos pendentes são automaticamente marcados como "Vencidos" após a data de vencimento.
    -   **Regra de Negócio (Recorrência):** O formulário distingue entre lançamentos "Único", "Parcelado" e "Recorrente".
        -   **Parcelado:** Gera todas as parcelas no ato do cadastro.
        -   **Recorrente:** Gera dinamicamente as futuras ocorrências ao consultar períodos futuros.
    -   Filtros avançados por categoria, subcategoria e status.

### 2.7. Módulo de Relatórios e Análises

-   Dashboard analítico com filtros por período e empresa.
-   **Visualização de Dados:** Utiliza gráficos (`echarts-for-react`) para exibir:
    -   Ranking de motoristas por número de viagens.
    -   Ranking de empresas por receita e número de serviços.
    -   Evolução de serviços realizados por mês.
-   **KPIs:** Exibe métricas como Receita Total, Total de Serviços, Ticket Médio e Veículo Mais Utilizado.

### 2.8. Central de Alertas

-   Página dedicada para notificações do sistema.
-   O ícone de sino no cabeçalho exibe a contagem de alertas não lidos e leva à página.
-   **Regra de Negócio:** Gera alertas automáticos para:
    -   Contas a pagar/receber (vencendo em 3 dias, hoje, ou vencidas).
    -   Lembretes de manutenção.
    -   Vencimento de licenciamento de veículos.
    -   Vencimento de CNH de motoristas.
-   **Interatividade:** Permite marcar alertas como lidos e visualizar os detalhes de cada item em um modal.

### 2.9. Configurações

-   Página para gerenciar dados da empresa e preferências de notificação.
-   Botão "Gerenciar Permissões" que redireciona para a página de Gestão de Usuários.

---

## 3. Requisitos Não Funcionais

-   **Persistência de Dados:** Todos os dados são salvos no `localStorage` do navegador, garantindo que as informações não se percam ao recarregar a página.
-   **Desempenho:** A aplicação deve ser fluida, com animações suaves (`framer-motion`) para abertura de modais e menus.
-   **Tecnologia:** O projeto é construído com React, TypeScript e Tailwind CSS.
