import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { SystemAlert } from '../types';
import { Loader, AlertTriangle, Calendar, User, Truck, CheckCircle, Check, Eye, EyeOff } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';

const Alertas: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [showRead, setShowRead] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReadAlerts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await (supabase as any)
        .from('read_alerts')
        .select('alert_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching read alerts:', error);
        return;
      }

      const readIds = new Set(data?.map((r: any) => r.alert_id) || []);
      setReadAlerts(readIds);
    } catch (error) {
      console.error('Error fetching read alerts:', error);
    }
  }, [user?.id]);

  const fetchAlerts = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [vehiclesRes, driversRes] = await Promise.all([
      supabase.from('vehicles').select('id, plate, licensing_due_date').eq('company_id', user.companyId),
      supabase.from('profiles').select('id, full_name, cnh_due_date').eq('company_id', user.companyId).not('cnh_due_date', 'is', null)
    ]);

    const generatedAlerts: SystemAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Vehicle licensing alerts
    (vehiclesRes.data || []).forEach(v => {
      if (v.licensing_due_date) {
        const dueDate = new Date(v.licensing_due_date + 'T00:00:00');
        if (dueDate <= thirtyDaysFromNow) {
          generatedAlerts.push({
            id: `licensing-${v.id}`,
            type: 'licensing',
            title: 'Licenciamento Próximo do Vencimento',
            message: `O licenciamento do veículo ${v.plate} vence em ${dueDate.toLocaleDateString('pt-BR')}.`,
            date: dueDate.toISOString(),
            relatedId: v.id,
          });
        }
      }
    });

    // Driver CNH alerts
    (driversRes.data || []).forEach(d => {
      if (d.cnh_due_date) {
        const dueDate = new Date(d.cnh_due_date + 'T00:00:00');
        if (dueDate <= thirtyDaysFromNow) {
          generatedAlerts.push({
            id: `cnh-${d.id}`,
            type: 'cnh',
            title: 'CNH Próxima do Vencimento',
            message: `A CNH do motorista ${d.full_name} vence em ${dueDate.toLocaleDateString('pt-BR')}.`,
            date: dueDate.toISOString(),
            relatedId: d.id,
          });
        }
      }
    });
    
    // Sort alerts by date
    generatedAlerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setAlerts(generatedAlerts);
    await fetchReadAlerts();
    setLoading(false);
  }, [user?.companyId, fetchReadAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await (supabase as any)
        .from('read_alerts')
        .insert({
          user_id: user.id,
          alert_id: alertId,
        });

      if (error) {
        console.error('Error marking alert as read:', error);
        toast.error('Erro ao marcar alerta como lido');
        return;
      }

      setReadAlerts(prev => new Set([...prev, alertId]));
      toast.success('Alerta marcado como lido');
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
      toast.error('Erro ao marcar alerta como lido');
    }
  };

  const handleMarkAsUnread = async (alertId: string) => {
    if (!user?.id) return;

    try {
      const { error} = await (supabase as any)
        .from('read_alerts')
        .delete()
        .eq('user_id', user.id)
        .eq('alert_id', alertId);

      if (error) {
        console.error('Error marking alert as unread:', error);
        toast.error('Erro ao desmarcar alerta');
        return;
      }

      setReadAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
      toast.success('Alerta desmarcado');
    } catch (error: any) {
      console.error('Error marking alert as unread:', error);
      toast.error('Erro ao desmarcar alerta');
    }
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'licensing': return Truck;
      case 'cnh': return User;
      default: return AlertTriangle;
    }
  };
  
  const getAlertColor = (date: string, isRead: boolean) => {
    if (isRead) {
      return 'border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-60';
    }
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (daysDiff < 0) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (daysDiff < 7) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-gray-200 dark:border-dark-border';
  };

  const filteredAlerts = showRead
    ? alerts
    : alerts.filter(alert => !readAlerts.has(alert.id));

  const unreadCount = alerts.filter(alert => !readAlerts.has(alert.id)).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Buscando Alertas</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Verificando os dados da sua operação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Central de Alertas</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Avisos importantes sobre vencimentos e pendências.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                {unreadCount} não {unreadCount === 1 ? 'lido' : 'lidos'}
              </span>
            )}
          </p>
        </div>
        <Button
          variant={showRead ? 'primary' : 'outline'}
          icon={showRead ? Eye : EyeOff}
          onClick={() => setShowRead(!showRead)}
        >
          {showRead ? 'Ocultar lidos' : 'Mostrar lidos'}
        </Button>
      </div>

      <Card>
        {filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map(alert => {
              const Icon = getAlertIcon(alert.type);
              const isRead = readAlerts.has(alert.id);
              return (
                <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getAlertColor(alert.date, isRead)}`}>
                  <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-dark-text">
                      {alert.title}
                      {isRead && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          <Check className="h-3 w-3 mr-1" />
                          Lido
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{alert.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Vencimento: {new Date(alert.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isRead ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsUnread(alert.id)}
                        title="Marcar como não lido"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Desmarcar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Check}
                        onClick={() => handleMarkAsRead(alert.id)}
                        title="Marcar como lido"
                      >
                        Marcar como lido
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-green-100 dark:bg-green-900/50 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">
              {showRead ? 'Nenhum alerta' : 'Tudo em ordem!'}
            </h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              {showRead
                ? 'Nenhum alerta encontrado.'
                : 'Nenhum alerta não lido para os próximos 30 dias.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Alertas;
