import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { SystemAlert } from '../types';
import { Loader, AlertTriangle, Calendar, User, Truck, CheckCircle } from 'lucide-react';
import Card from '../components/UI/Card';

const Alertas: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [vehiclesRes, driversRes] = await Promise.all([
      supabase.from('vehicles').select('id, plate, licensing_due_date').eq('company_id', user.companyId),
      supabase.from('profiles').select('id, full_name, cnh_due_date').eq('company_id', user.companyId).eq('role', 'driver')
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
    setLoading(false);
  }, [user?.companyId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'licensing': return Truck;
      case 'cnh': return User;
      default: return AlertTriangle;
    }
  };
  
  const getAlertColor = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (daysDiff < 0) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (daysDiff < 7) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-gray-200 dark:border-dark-border';
  };

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Central de Alertas</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Avisos importantes sobre vencimentos e pendências.</p>
      </div>

      <Card>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map(alert => {
              const Icon = getAlertIcon(alert.type);
              return (
                <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getAlertColor(alert.date)}`}>
                  <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-dark-text">{alert.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{alert.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Vencimento: {new Date(alert.date).toLocaleDateString('pt-BR')}</span>
                    </div>
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
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Tudo em ordem!</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary">Nenhum alerta encontrado para os próximos 30 dias.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Alertas;
