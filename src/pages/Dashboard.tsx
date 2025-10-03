import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Trip, SystemAlert } from '../types';
import { Loader, DollarSign, Truck, Wrench, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import Card from '../components/UI/Card';
import { Link } from 'react-router-dom';

interface Stats {
  revenue: number;
  expenses: number;
  activeTrips: number;
  fleetSize: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const [revenueRes, expensesRes, tripsRes, vehiclesRes, cnhRes] = await Promise.all([
      supabase.from('financial_records').select('amount', { count: 'exact' }).eq('company_id', user.companyId).eq('type', 'receivable').gte('due_date', firstDayOfMonth),
      supabase.from('financial_records').select('amount', { count: 'exact' }).eq('company_id', user.companyId).eq('type', 'payable').gte('due_date', firstDayOfMonth),
      supabase.from('trips').select('*, client:clients(name)').eq('company_id', user.companyId).order('start_date', { ascending: false }).limit(5),
      supabase.from('vehicles').select('id, plate, licensing_due_date', { count: 'exact' }).eq('company_id', user.companyId),
      supabase.from('profiles').select('id, full_name, cnh_due_date').eq('company_id', user.companyId).eq('role', 'driver')
    ]);

    const revenue = revenueRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const expenses = expensesRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const activeTrips = (tripsRes.data || []).filter(t => t.status === 'in_progress').length;
    const fleetSize = vehiclesRes.count || 0;

    setStats({ revenue, expenses, activeTrips, fleetSize });
    
    const mappedTrips = (tripsRes.data || []).map((t: any) => ({
      ...t,
      clientName: t.client?.name || 'N/A',
    })) as Trip[];
    setRecentTrips(mappedTrips);

    // Generate alerts
    const generatedAlerts: SystemAlert[] = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    vehiclesRes.data?.forEach(v => {
      if (v.licensing_due_date) {
        const dueDate = new Date(v.licensing_due_date + 'T00:00:00');
        const isExpired = dueDate < today;
        const isNearExpiry = dueDate <= thirtyDaysFromNow && dueDate >= today;

        if (isExpired) {
          generatedAlerts.push({
            id: `licensing-${v.id}`,
            type: 'licensing',
            title: 'Licenciamento Vencido',
            message: `O licenciamento do veículo ${v.plate} venceu em ${dueDate.toLocaleDateString('pt-BR')}.`,
            date: dueDate.toISOString(),
            relatedId: v.id,
          });
        } else if (isNearExpiry) {
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

    cnhRes.data?.forEach(d => {
        if (d.cnh_due_date) {
            const dueDate = new Date(d.cnh_due_date + 'T00:00:00');
            if (dueDate <= thirtyDaysFromNow && dueDate >= today) {
                generatedAlerts.push({
                    id: `cnh-${d.id}`,
                    type: 'cnh',
                    title: 'CNH Próxima',
                    message: `Motorista ${d.full_name} vence em ${dueDate.toLocaleDateString('pt-BR')}`,
                    date: dueDate.toISOString(),
                    relatedId: d.id,
                });
            }
        }
    });

    setAlerts(generatedAlerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5));

    setLoading(false);
  }, [user?.companyId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Carregando Dashboard</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Buscando os dados mais recentes da sua operação...</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita do Mês" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.revenue || 0)} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Despesas do Mês" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.expenses || 0)} icon={DollarSign} color="bg-red-500" />
        <StatCard title="Serviços Ativos" value={stats?.activeTrips || 0} icon={Truck} color="bg-blue-500" />
        <StatCard title="Total da Frota" value={stats?.fleetSize || 0} icon={Wrench} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Serviços Recentes">
          <div className="space-y-4">
            {recentTrips.length > 0 ? recentTrips.map(trip => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div>
                  <p className="font-medium">{trip.clientName}</p>
                  <p className="text-sm text-gray-500">{trip.origin} → {trip.destination}</p>
                </div>
                <Link to={`/servicos`} className="text-primary hover:underline text-sm flex items-center gap-1">Ver <ArrowRight className="h-3 w-3"/></Link>
              </div>
            )) : <p className="text-center text-gray-500 py-8">Nenhum serviço recente.</p>}
          </div>
        </Card>
        <Card title="Alertas Importantes">
        <div className="space-y-4">
            {alerts.length > 0 ? alerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-gray-600 dark:text-dark-text-secondary">{alert.message}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum alerta no momento.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
