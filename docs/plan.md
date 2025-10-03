# Plano de Desenvolvimento - Ologx

Este documento descreve o plano de desenvolvimento e as futuras funcionalidades para o sistema Ologx.

Prompt Otimizado – MVP Web App Transportadora:
"Desenvolva um MVP de web app responsivo para gestão financeira e de clientes de uma transportadora de pequeno a médio porte. O sistema deve priorizar simplicidade, clareza na navegação e usabilidade em desktop, tablet e mobile.
Funcionalidades principais:
Dashboard


Exibir resumo de indicadores financeiros, status da frota, viagens em andamento e atalhos rápidos.


Módulo de Cadastros


Frotas: cadastro de veículos, status e manutenção.


Usuários: perfis de acesso com permissões diferenciadas.


Clientes: dados completos e histórico de serviços.


Módulo de Serviços (Viagens)


Criação de viagens (associar veículo, motorista e cliente).


Lista de viagens ativas.


Histórico de viagens concluídas.


Relatórios de fechamento de viagens (filtros por data, cliente e motorista).


Módulo Financeiro


Contas a pagar.


Contas a receber.


Relatório financeiro geral.


Relatório de repasses de motoristas.


Módulo de Relatórios e Análises


Relatórios filtráveis por período.


Exportação em PDF/Excel.


Relatórios customizados.


Configurações e Perfis de Usuário


Gerenciamento de acessos.


Preferências do sistema.



Requisitos de Design:
Paleta de cores:


Cor primária: #cdb27b (menus principais).


Cor de destaque: #de7c04 (submenus, botões de ação).


Contraste adequado para boa legibilidade (ex.: texto branco sobre fundo colorido).


Layout responsivo para desktop, tablet e mobile.


Navegação hierárquica clara: Dashboard → Módulos → Submódulos.


Requisitos Técnicos:
Estrutura modular para permitir expansão futura.


Interfaces simples e intuitivas, com menus laterais e cabeçalhos claros.


Uso de componentes reutilizáveis (cards, tabelas, formulários).


Exportação de relatórios em PDF/Excel integrada.


Entrega esperada:
Protótipo funcional MVP com telas navegáveis.


Implementação responsiva com identidade visual coerente.


Organização em módulos, destacando fluxos principais (cadastros, viagens e financeiro).


## Próximos Passos (Q3 2025)

- [ ] **Integração com Supabase:**
  - [ ] Autenticação de usuários.
  - [ ] Persistência de dados para todos os módulos (Frota, Clientes, Viagens, Financeiro).
  - [ ] Storage para upload de documentos (ex: CNH, Documentos de veículos).

- [ ] **Módulo de Manutenção de Frota:**
  - [ ] Agendamento de manutenções preventivas.
  - [ ] Histórico de manutenções por veículo.
  - [ ] Alertas de manutenção futura.

- [ ] **Dashboard Avançado:**
  - [ ] Gráficos interativos (custos vs. receita, km rodado por veículo).
  - [ ] KPIs customizáveis pelo usuário.

## Ideias para o Futuro (2026)

- [ ] **Aplicativo Mobile para Motoristas:**
  - [ ] Visualização de rotas.
  - [ ] Checklist de início de viagem.
  - [ ] Comunicação via chat com a base.

- [ ] **Integração com APIs de Rastreamento:**
  - [ ] Visualização da localização dos veículos em tempo real no mapa.

- [ ] **Portal do Cliente:**
  - [ ] Clientes podem solicitar novas viagens.
  - [ ] Acompanhamento do status da entrega.
  - [ ] Acesso a faturas e histórico financeiro.
