import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Truck,
  Route,
  DollarSign,
  BarChart3,
  Settings,
  UserPlus,
  Car,
  ChevronDown,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Tags,
  Wrench,
  Bell,
  Building,
  Shield,
  Calendar,
  Activity
} from 'lucide-react';
import { Can } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard:ver' }, // Assuming a default permission
  {
    path: '/cadastros',
    icon: Users,
    label: 'Cadastros',
    submenu: [
      { path: '/cadastros/frota', icon: Car, label: 'Frota', permission: 'cadastros:gerenciar_frota' },
      { path: '/cadastros/usuarios', icon: UserPlus, label: 'Usuários', permission: 'usuarios:gerenciar' },
      { path: '/cadastros/clientes', icon: Users, label: 'Clientes', permission: 'cadastros:gerenciar_clientes' },
      { path: '/cadastros/categorias', icon: Tags, label: 'Categorias', permission: 'cadastros:gerenciar_categorias' },
    ],
  },
  { path: '/servicos', icon: Route, label: 'Serviços', permission: 'servicos:ver_todos' },
  { path: '/manutencao', icon: Wrench, label: 'Manutenção', permission: 'manutencao:ver' }, // Assuming permission
  {
    path: '/financeiro',
    icon: DollarSign,
    label: 'Financeiro',
    permission: 'financeiro:ver_tudo',
    submenu: [
      { path: '/fechamento', icon: Calendar, label: 'Fechamento', permission: 'financeiro:realizar_fechamento' },
      { path: '/financeiro/pagar', icon: TrendingDown, label: 'Contas a Pagar', permission: 'financeiro:ver_tudo' },
      { path: '/financeiro/receber', icon: TrendingUp, label: 'Contas a Receber', permission: 'financeiro:ver_tudo' },
    ],
  },
  { path: '/relatorios', icon: BarChart3, label: 'Relatórios', permission: 'relatorios:ver_todos' },
  { path: '/alertas', icon: Bell, label: 'Alertas', permission: 'alertas:ver' }, // Assuming permission
  {
    path: '/configuracoes',
    icon: Settings,
    label: 'Configurações',
    submenu: [
      { path: '/configuracoes/empresa', icon: Building, label: 'Dados da Empresa', permission: 'configuracoes:gerenciar_empresa' },
      { path: '/configuracoes/perfis', icon: Shield, label: 'Perfis e Permissões', permission: 'usuarios:gerenciar_permissoes' },
      { path: '/configuracoes/atividades', icon: Activity, label: 'Rastreamento', permission: 'configuracoes:ver_atividades' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleSubmenuToggle = (path: string) => {
    setOpenSubmenu(openSubmenu === path ? null : path);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-primary text-white dark:bg-dark-bg-secondary dark:border-r dark:border-dark-border flex flex-col transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-primary-dark dark:border-dark-border">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white dark:text-dark-text">
            <Truck className="h-6 w-6" />
            Ologx
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.path}>
              {item.submenu ? (
                <Can perform={item.submenu.map(s => s.permission).join('|')}>
                  <button
                    onClick={() => handleSubmenuToggle(item.path)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-white/80 dark:text-dark-text-secondary hover:bg-primary-dark dark:hover:bg-dark-border hover:text-white dark:hover:text-dark-text focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openSubmenu === item.path ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openSubmenu === item.path && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden ml-4"
                      >
                        <div className="pt-1 pb-2 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Can perform={subItem.permission} key={subItem.path}>
                              <NavLink
                                to={subItem.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                                    isActive
                                      ? 'bg-accent text-white'
                                      : 'text-white/70 dark:text-dark-text-secondary hover:bg-primary-dark dark:hover:bg-dark-border hover:text-white dark:hover:text-dark-text'
                                  }`
                                }
                              >
                                <subItem.icon className="h-4 w-4" />
                                {subItem.label}
                              </NavLink>
                            </Can>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Can>
              ) : (
                <Can perform={item.permission}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'text-white/80 dark:text-dark-text-secondary hover:bg-primary-dark dark:hover:bg-dark-border hover:text-white dark:hover:text-dark-text'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                </Can>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
