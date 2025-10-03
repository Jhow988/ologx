import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Sun, Moon, Building } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

interface HeaderProps {
  onMenuClick: () => void;
  isSuperAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isSuperAdmin = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Fetch alerts count
  useEffect(() => {
    const fetchAlertsCount = async () => {
      if (!user?.companyId || isSuperAdmin) return;

      try {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        // Count overdue financial records
        const { count: overdueFinancials } = await supabase
          .from('financial_records')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .eq('status', 'overdue');

        // Count vehicles with licensing due in 30 days
        const { count: licensingDue } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .lte('licensing_due_date', thirtyDaysFromNow.toISOString().split('T')[0]);

        // Count drivers with CNH due in 30 days
        const { count: cnhDue } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .eq('role', 'driver')
          .lte('cnh_due_date', thirtyDaysFromNow.toISOString().split('T')[0]);

        const total = (overdueFinancials || 0) + (licensingDue || 0) + (cnhDue || 0);
        setUnreadAlertsCount(total);
      } catch (error) {
        console.error('Error fetching alerts count:', error);
      }
    };

    fetchAlertsCount();

    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlertsCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.companyId, isSuperAdmin]);

  const handleLogoutRequest = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-gray-200 dark:border-dark-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                {isSuperAdmin ? 'Painel Super Admin' : 'Ologx'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                {isSuperAdmin ? 'Gestão da Plataforma' : user?.name ? `Bem-vindo, ${user.name.split(' ')[0]}` : 'Bem-vindo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {!isSuperAdmin && (
              <Link to="/alertas" className="relative p-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border">
                <Bell className="h-5 w-5" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full text-xs text-white flex items-center justify-center">
                    {unreadAlertsCount}
                  </span>
                )}
              </Link>
            )}

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{user?.isSuperAdmin ? 'Super Admin' : user?.role}</p>
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                    {user?.isSuperAdmin ? <Building className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <Link
                    to="/profile"
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-border"
                  >
                    <User className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogoutRequest}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-border"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirmar Saída"
      >
        <p className="text-gray-800 dark:text-dark-text">Tem certeza que deseja sair do sistema?</p>
        <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
          <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmLogout} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
            Sair
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Header;
