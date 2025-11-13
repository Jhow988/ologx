import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/UI/Card';
import { Loader, Activity, User, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

const Atividades: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
    fetchUsers();
  }, [user?.companyId, filterType, filterUser]);

  const fetchUsers = async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', user.companyId)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchActivities = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('entity_type', filterType);
      }

      if (filterUser !== 'all') {
        query = query.eq('user_id', filterUser);
      }

      const { data, error } = await query;

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Criou',
      update: 'Atualizou',
      delete: 'Excluiu',
      login: 'Login',
      logout: 'Logout',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      vehicle: 'Veículo',
      client: 'Cliente',
      trip: 'Viagem',
      user: 'Usuário',
      financial: 'Registro Financeiro',
      maintenance: 'Manutenção',
    };
    return labels[entityType] || entityType;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      update: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      delete: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      login: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      logout: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
    };
    return colors[action] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Carregando Atividades</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Buscando histórico de ações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Rastreamento de Atividades</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Histórico completo de ações realizadas no sistema
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar por Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
            >
              <option value="all">Todos os Tipos</option>
              <option value="vehicle">Veículos</option>
              <option value="client">Clientes</option>
              <option value="trip">Viagens</option>
              <option value="user">Usuários</option>
              <option value="financial">Financeiro</option>
              <option value="maintenance">Manutenção</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Filtrar por Usuário
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
            >
              <option value="all">Todos os Usuários</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Atividades */}
      <Card title="Histórico de Atividades">
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary dark:hover:border-primary transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                    <Activity className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                      <span className="font-semibold">{activity.user_name}</span>
                      {' '}
                      <span className={`px-2 py-0.5 rounded text-xs ${getActionColor(activity.action)}`}>
                        {getActionLabel(activity.action)}
                      </span>
                      {' '}
                      {getEntityLabel(activity.entity_type)}
                    </p>
                  </div>

                  {activity.details && (
                    <div className="text-xs text-gray-600 dark:text-dark-text-secondary mb-2">
                      <pre className="whitespace-pre-wrap font-mono bg-gray-100 dark:bg-dark-border p-2 rounded">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Nenhuma atividade registrada
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Atividades;
