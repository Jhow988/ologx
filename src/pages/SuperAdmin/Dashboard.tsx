import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/UI/Card';
import { Loader, Building, Users, CheckCircle, XCircle } from 'lucide-react';

interface AdminStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);

    const [companiesRes, usersRes] = await Promise.all([
      supabase.from('companies').select('id, status', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('is_super_admin', false),
    ]);

    const totalCompanies = companiesRes.count || 0;
    const activeCompanies = companiesRes.data?.filter(c => c.status === 'active').length || 0;
    const inactiveCompanies = totalCompanies - activeCompanies;
    const totalUsers = usersRes.count || 0;

    setStats({
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      totalUsers,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Carregando Dashboard</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Buscando as estatísticas da plataforma...</p>
      </div>
    );
  }

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <Card className="flex-1">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{value}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Dashboard do Super Admin</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Visão geral da plataforma Ologx.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Empresas" value={stats?.totalCompanies || 0} icon={Building} color="bg-blue-500" />
        <StatCard title="Empresas Ativas" value={stats?.activeCompanies || 0} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Empresas Inativas" value={stats?.inactiveCompanies || 0} icon={XCircle} color="bg-red-500" />
        <StatCard title="Total de Usuários" value={stats?.totalUsers || 0} icon={Users} color="bg-yellow-500" />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
