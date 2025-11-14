import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Trip, SystemAlert } from '../types';
import { Loader, DollarSign, Truck, Wrench, AlertTriangle, ArrowRight, CheckCircle, TrendingUp, TrendingDown, Minus, Plus, Users, FileText, MapPin, Calendar } from 'lucide-react';
import Card from '../components/UI/Card';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';

interface Stats {
  revenue: number;
  expenses: number;
  activeTrips: number;
  fleetSize: number;
  profit: number;
  profitChange: number;
  profitPercentage: number;
  completedTrips: number;
  totalClients: number;
  pendingMaintenances: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
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

  const fetchDashboardData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Previous month dates
    const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59).toISOString();

    const [revenueRes, expensesRes, prevRevenueRes, prevExpensesRes, tripsRes, vehiclesRes, cnhRes, clientsRes, completedTripsRes, maintenancesRes] = await Promise.all([
      supabase.from('financial_records').select('amount', { count: 'exact' }).eq('company_id', user.companyId).eq('type', 'receivable').gte('due_date', firstDayOfMonth).lte('due_date', lastDayOfMonth),
      supabase.from('financial_records').select('amount', { count: 'exact' }).eq('company_id', user.companyId).eq('type', 'payable').gte('due_date', firstDayOfMonth).lte('due_date', lastDayOfMonth),
      supabase.from('financial_records').select('amount').eq('company_id', user.companyId).eq('type', 'receivable').gte('due_date', firstDayOfPrevMonth).lte('due_date', lastDayOfPrevMonth),
      supabase.from('financial_records').select('amount').eq('company_id', user.companyId).eq('type', 'payable').gte('due_date', firstDayOfPrevMonth).lte('due_date', lastDayOfPrevMonth),
      supabase.from('trips').select('*, client:clients(name)').eq('company_id', user.companyId).order('start_date', { ascending: false }).limit(5),
      supabase.from('vehicles').select('id, plate, licensing_due_date', { count: 'exact' }).eq('company_id', user.companyId).eq('status', 'active'),
      supabase.from('profiles').select('id, full_name, cnh_due_date').eq('company_id', user.companyId).eq('status', 'active').eq('role', 'driver'),
      supabase.from('clients').select('id', { count: 'exact' }).eq('company_id', user.companyId),
      supabase.from('trips').select('id', { count: 'exact' }).eq('company_id', user.companyId).eq('status', 'completed').gte('created_at', firstDayOfMonth),
      supabase.from('maintenances').select('id', { count: 'exact' }).eq('company_id', user.companyId).eq('status', 'pending')
    ]);

    const revenue = revenueRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const expenses = expensesRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const profit = revenue - expenses;

    const prevRevenue = prevRevenueRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const prevExpenses = prevExpensesRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const prevProfit = prevRevenue - prevExpenses;

    const profitChange = profit - prevProfit;
    const profitPercentage = prevProfit !== 0 ? (profitChange / prevProfit) * 100 : 0;

    const activeTrips = (tripsRes.data || []).filter(t => t.status === 'in_progress').length;
    const fleetSize = vehiclesRes.count || 0;
    const completedTrips = completedTripsRes.count || 0;
    const totalClients = clientsRes.count || 0;
    const pendingMaintenances = maintenancesRes.count || 0;

    setStats({ revenue, expenses, activeTrips, fleetSize, profit, profitChange, profitPercentage, completedTrips, totalClients, pendingMaintenances });
    
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

    // Fetch monthly data (last 6 months)
    const monthlyFinancialData: MonthlyData[] = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [monthRevenueRes, monthExpensesRes] = await Promise.all([
        supabase.from('financial_records').select('amount').eq('company_id', user.companyId).eq('type', 'receivable').gte('due_date', monthStart).lte('due_date', monthEnd),
        supabase.from('financial_records').select('amount').eq('company_id', user.companyId).eq('type', 'payable').gte('due_date', monthStart).lte('due_date', monthEnd)
      ]);

      const monthRevenue = monthRevenueRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;
      const monthExpenses = monthExpensesRes.data?.reduce((sum, r) => sum + r.amount, 0) || 0;

      monthlyFinancialData.push({
        month: `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`,
        revenue: monthRevenue,
        expenses: monthExpenses
      });
    }

    setMonthlyData(monthlyFinancialData);

    // Fetch read alerts to filter out read ones
    await fetchReadAlerts();

    setLoading(false);
  }, [user?.companyId, fetchReadAlerts]);

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

  const ProfitCard: React.FC = () => {
    const profit = stats?.profit || 0;
    const profitChange = stats?.profitChange || 0;
    const profitPercentage = stats?.profitPercentage || 0;

    const isPositive = profitChange > 0;
    const isNegative = profitChange < 0;
    const isNeutral = profitChange === 0;

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const trendColor = isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';
    const bgColor = profit >= 0 ? 'bg-green-500' : 'bg-orange-500';

    return (
      <Card className="flex-1">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${bgColor}`}>
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Lucro Líquido</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}
            </p>
            <div className={`flex items-center gap-1 mt-1 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">
                {Math.abs(profitPercentage).toFixed(1)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                vs mês anterior
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        return `
          <div style="padding: 8px;">
            <strong>${params[0].axisValue}</strong><br/>
            <span style="color: #10b981;">● Receitas: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params[0].value)}</span><br/>
            <span style="color: #ef4444;">● Despesas: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params[1].value)}</span><br/>
            <strong>Lucro: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params[0].value - params[1].value)}</strong>
          </div>
        `;
      }
    },
    legend: {
      data: ['Receitas', 'Despesas'],
      top: 0,
      textStyle: {
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: monthlyData.map(d => d.month),
      axisLabel: {
        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
      },
      axisLine: {
        lineStyle: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        },
        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
      },
      splitLine: {
        lineStyle: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6'
        }
      }
    },
    series: [
      {
        name: 'Receitas',
        type: 'bar',
        data: monthlyData.map(d => d.revenue),
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: 'Despesas',
        type: 'bar',
        data: monthlyData.map(d => d.expenses),
        itemStyle: {
          color: '#ef4444',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <Link
          to="/servicos"
          className="flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold text-sm md:text-base"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Nova Viagem</span>
          <span className="sm:hidden">Viagem</span>
        </Link>
        <Link
          to="/cadastros/clientes"
          className="flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-md font-semibold text-sm md:text-base"
        >
          <Users className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Novo Cliente</span>
          <span className="sm:hidden">Cliente</span>
        </Link>
        <Link
          to="/financeiro"
          className="flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-md font-semibold text-sm md:text-base"
        >
          <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Registrar Despesa</span>
          <span className="sm:hidden">Despesa</span>
        </Link>
        <Link
          to="/servicos"
          className="flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-md font-semibold text-sm md:text-base"
        >
          <FileText className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Relatórios</span>
          <span className="sm:hidden">Relatório</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCard title="Receita do Mês" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.revenue || 0)} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Despesas do Mês" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.expenses || 0)} icon={DollarSign} color="bg-red-500" />
        <ProfitCard />
        <StatCard title="Total da Frota" value={stats?.fleetSize || 0} icon={Wrench} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCard title="Serviços Ativos" value={stats?.activeTrips || 0} icon={Truck} color="bg-blue-500" />
        <StatCard title="Viagens Concluídas" value={stats?.completedTrips || 0} icon={CheckCircle} color="bg-green-600" />
        <StatCard title="Total de Clientes" value={stats?.totalClients || 0} icon={Users} color="bg-purple-500" />
        <StatCard title="Manutenções Pendentes" value={stats?.pendingMaintenances || 0} icon={Calendar} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card title="Serviços Recentes">
          <div className="space-y-3">
            {recentTrips.length > 0 ? recentTrips.map(trip => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              };
              const statusLabels = {
                pending: 'Pendente',
                in_progress: 'Em andamento',
                completed: 'Concluído',
                cancelled: 'Cancelado'
              };
              return (
                <div key={trip.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 bg-gray-50 dark:bg-dark-bg rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-dark-text">{trip.clientName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[trip.status as keyof typeof statusColors]}`}>
                        {statusLabels[trip.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-dark-text-secondary font-medium truncate">{trip.origin} → {trip.destination}</p>
                  </div>
                  <Link to={`/servicos`} className="text-primary hover:underline text-xs md:text-sm flex items-center gap-1 flex-shrink-0 self-start sm:self-center">
                    Ver <ArrowRight className="h-3 w-3 md:h-4 md:w-4"/>
                  </Link>
                </div>
              );
            }) : <p className="text-center text-gray-500 py-8">Nenhum serviço recente.</p>}
          </div>
        </Card>
        <Card title="Alertas Importantes">
          <div className="space-y-2 md:space-y-3">
            {alerts.filter(alert => !readAlerts.has(alert.id)).length > 0 ? alerts.filter(alert => !readAlerts.has(alert.id)).map(alert => (
              <div key={alert.id} className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-dark-text mb-1">{alert.title}</p>
                  <p className="text-xs md:text-sm text-gray-700 dark:text-dark-text-secondary leading-relaxed break-words">{alert.message}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 md:py-8">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm md:text-base text-gray-500">Nenhum alerta no momento.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Receitas vs Despesas - Últimos 6 Meses">
        <ReactECharts option={chartOption} style={{ height: '300px' }} className="sm:h-[350px] lg:h-[400px]" />
      </Card>
    </div>
  );
};

export default Dashboard;
