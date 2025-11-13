// Define all possible permissions in the system
export const permissionsMap = {
  servicos: {
    label: 'Serviços',
    permissions: {
      'servicos:criar': 'Criar e editar serviços',
      'servicos:cancelar': 'Cancelar serviços',
      'servicos:ver_todos': 'Visualizar todos os serviços',
    },
  },
  cadastros: {
    label: 'Cadastros',
    permissions: {
      'cadastros:gerenciar_frota': 'Gerenciar frota',
      'cadastros:gerenciar_clientes': 'Gerenciar clientes',
      'cadastros:gerenciar_categorias': 'Gerenciar categorias financeiras',
    },
  },
  usuarios: {
    label: 'Usuários',
    permissions: {
      'usuarios:gerenciar': 'Gerenciar usuários (criar, editar, desativar)',
      'usuarios:gerenciar_permissoes': 'Gerenciar perfis e permissões',
    },
  },
  financeiro: {
    label: 'Financeiro',
    permissions: {
      'financeiro:ver_tudo': 'Visualizar todo o financeiro',
      'financeiro:gerenciar_lancamentos': 'Gerenciar lançamentos (criar, editar)',
      'financeiro:realizar_fechamento': 'Realizar fechamento de serviços',
    },
  },
  relatorios: {
    label: 'Relatórios',
    permissions: {
      'relatorios:ver_todos': 'Visualizar todos os relatórios',
    },
  },
  configuracoes: {
    label: 'Configurações',
    permissions: {
      'configuracoes:gerenciar_empresa': 'Gerenciar dados da empresa',
      'configuracoes:ver_atividades': 'Visualizar rastreamento de atividades',
    },
  },
  dashboard: {
    label: 'Dashboard',
    permissions: {
      'dashboard:ver': 'Visualizar dashboard',
    },
  },
  manutencao: {
    label: 'Manutenção',
    permissions: {
      'manutencao:ver': 'Visualizar manutenções',
      'manutencao:gerenciar': 'Gerenciar manutenções',
    },
  },
  alertas: {
    label: 'Alertas',
    permissions: {
      'alertas:ver': 'Visualizar alertas',
    },
  },
};

// Define roles and their associated permissions
// Apenas o perfil Admin é padrão. Outros perfis devem ser criados como personalizados.
export const roles = {
  admin: {
    name: 'Administrador',
    description: 'Acesso total e irrestrito a todas as funcionalidades do sistema.',
    permissions: Object.values(permissionsMap).flatMap(group => Object.keys(group.permissions)),
  },
};
