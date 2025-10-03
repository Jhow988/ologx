import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Loader, Download, Calendar, Filter, Share2, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FinancialRecord {
  type: 'receivable' | 'payable';
  amount: number;
  due_date: string;
  status: string;
  description: string;
}

interface Trip {
  id: string;
  status: string;
  value: number;
  origin: string;
  destination: string;
  client_id: string;
  start_date: string;
}

interface Client {
  id: string;
  name: string;
}

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  accountsReceivable: number;
  pendingCount: number;
  monthlyComparison: {
    revenueChange: number;
    expensesChange: number;
  };
  monthlyFinancials: { month: string; revenue: number; expenses: number; }[];
  revenueByService: { name: string; value: number; percentage: number; }[];
  recentTransactions: any[];
  topRoutes: { route: string; trips: number; revenue: number; change: number; }[];
  topClients: { name: string; revenue: number; }[];
  cashFlow: { week: string; inflow: number; outflow: number; }[];
}

const Relatorios: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState({ serviceType: 'all', status: 'all', client: '' });

  const fetchReportData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Fetch data
      const [financialsRes, tripsRes, clientsRes] = await Promise.all([
        supabase.from('financial_records').select('*').eq('company_id', user.companyId),
        supabase.from('trips').select('*').eq('company_id', user.companyId),
        supabase.from('clients').select('id, name').eq('company_id', user.companyId),
      ]);

      const financials = (financialsRes.data || []) as FinancialRecord[];
      const trips = (tripsRes.data || []) as Trip[];
      const clients = (clientsRes.data || []) as Client[];

      // Calculate current month data
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentMonthFinancials = financials.filter(f => {
        const date = new Date(f.due_date);
        return date >= currentMonth;
      });

      const lastMonthFinancials = financials.filter(f => {
        const date = new Date(f.due_date);
        return date >= lastMonth && date <= lastMonthEnd;
      });

      const totalRevenue = currentMonthFinancials
        .filter(f => f.type === 'receivable')
        .reduce((sum, f) => sum + f.amount, 0);

      const totalExpenses = currentMonthFinancials
        .filter(f => f.type === 'payable')
        .reduce((sum, f) => sum + f.amount, 0);

      const lastMonthRevenue = lastMonthFinancials
        .filter(f => f.type === 'receivable')
        .reduce((sum, f) => sum + f.amount, 0);

      const lastMonthExpenses = lastMonthFinancials
        .filter(f => f.type === 'payable')
        .reduce((sum, f) => sum + f.amount, 0);

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const accountsReceivable = currentMonthFinancials
        .filter(f => f.type === 'receivable' && f.status === 'pending')
        .reduce((sum, f) => sum + f.amount, 0);

      const pendingCount = currentMonthFinancials
        .filter(f => f.type === 'receivable' && f.status === 'pending').length;

      // Monthly financials for chart (last 12 months)
      const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      financials.forEach(record => {
        const recordDate = new Date(record.due_date);
        const monthKey = recordDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        if (monthlyData[monthKey] !== undefined) {
          if (record.type === 'receivable') monthlyData[monthKey].revenue += record.amount;
          else monthlyData[monthKey].expenses += record.amount;
        }
      });

      const monthlyFinancials = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      }));

      // Revenue by service type (based on trips)
      const currentMonthTrips = trips.filter(t => {
        const date = new Date(t.start_date);
        return date >= currentMonth;
      });

      const serviceTypes: { [key: string]: number } = {
        'Frete Rodoviário': 0,
        'Entrega Expressa': 0,
        'Armazenagem': 0,
        'Outros Serviços': 0
      };

      currentMonthTrips.forEach(trip => {
        // Simple logic - you can enhance this based on your data
        const type = trip.value > 10000 ? 'Frete Rodoviário' :
                     trip.value > 5000 ? 'Entrega Expressa' :
                     trip.value > 2000 ? 'Armazenagem' : 'Outros Serviços';
        serviceTypes[type] += trip.value;
      });

      const totalServiceRevenue = Object.values(serviceTypes).reduce((a, b) => a + b, 0);
      const revenueByService = Object.entries(serviceTypes)
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalServiceRevenue > 0 ? (value / totalServiceRevenue) * 100 : 0
        }))
        .filter(s => s.value > 0);

      // Recent transactions
      const recentTransactions = currentMonthTrips
        .slice(0, 10)
        .map(trip => {
          const client = clients.find(c => c.id === trip.client_id);
          return {
            date: new Date(trip.start_date).toLocaleDateString('pt-BR'),
            client: client?.name || 'Cliente não encontrado',
            service: trip.value > 10000 ? 'Frete Rodoviário' : 'Entrega Expressa',
            route: `${trip.origin} - ${trip.destination}`,
            value: trip.value,
            status: trip.status === 'completed' ? 'Pago' :
                   trip.status === 'in_progress' ? 'Pendente' : 'Vencido'
          };
        });

      // Top routes
      const routeStats: { [key: string]: { trips: number; revenue: number } } = {};
      currentMonthTrips.forEach(trip => {
        const route = `${trip.origin} - ${trip.destination}`;
        if (!routeStats[route]) {
          routeStats[route] = { trips: 0, revenue: 0 };
        }
        routeStats[route].trips++;
        routeStats[route].revenue += trip.value;
      });

      const topRoutes = Object.entries(routeStats)
        .map(([route, stats]) => ({
          route,
          trips: stats.trips,
          revenue: stats.revenue,
          change: Math.random() * 30 - 10 // Placeholder - calculate real change
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Top clients
      const clientRevenue: { [key: string]: number } = {};
      currentMonthTrips.forEach(trip => {
        const client = clients.find(c => c.id === trip.client_id);
        if (client) {
          clientRevenue[client.name] = (clientRevenue[client.name] || 0) + trip.value;
        }
      });

      const topClients = Object.entries(clientRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Cash flow (next 30 days - simulated)
      const cashFlow = [
        { week: 'Sem 1', inflow: 650000, outflow: -420000 },
        { week: 'Sem 2', inflow: 680000, outflow: -450000 },
        { week: 'Sem 3', inflow: 620000, outflow: -480000 },
      ];

      setReportData({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        accountsReceivable,
        pendingCount,
        monthlyComparison: {
          revenueChange: lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
          expensesChange: lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0
        },
        monthlyFinancials,
        revenueByService,
        recentTransactions,
        topRoutes,
        topClients,
        cashFlow
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Chart options
  const revenueVsExpensesOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['Receita', 'Despesas'],
      textStyle: { color: theme === 'dark' ? '#e2e8f0' : '#1a202c' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: reportData?.monthlyFinancials.map(d => d.month) || [],
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#4a5568' }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: theme === 'dark' ? '#a0aec0' : '#4a5568',
        formatter: (value: number) => `R$ ${value / 1000}k`
      }
    },
    series: [
      {
        name: 'Receita',
        type: 'line',
        smooth: true,
        data: reportData?.monthlyFinancials.map(d => d.revenue) || [],
        itemStyle: { color: '#3b82f6' },
        areaStyle: { opacity: 0.3 }
      },
      {
        name: 'Despesas',
        type: 'line',
        smooth: true,
        data: reportData?.monthlyFinancials.map(d => d.expenses) || [],
        itemStyle: { color: '#ef4444' },
        areaStyle: { opacity: 0.3 }
      }
    ]
  };

  const serviceRevenueOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: theme === 'dark' ? '#e2e8f0' : '#1a202c' }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: theme === 'dark' ? '#e2e8f0' : '#1a202c'
        },
        labelLine: { show: true },
        data: reportData?.revenueByService.map(s => ({ name: s.name, value: s.value })) || [],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      }
    ]
  };

  const cashFlowOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: reportData?.cashFlow.map(c => c.week) || [],
      axisLabel: { color: theme === 'dark' ? '#a0aec0' : '#4a5568' }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: theme === 'dark' ? '#a0aec0' : '#4a5568',
        formatter: (value: number) => `R$ ${value / 1000}k`
      }
    },
    series: [
      {
        name: 'Entrada',
        type: 'bar',
        stack: 'total',
        data: reportData?.cashFlow.map(c => c.inflow) || [],
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'Saída',
        type: 'bar',
        stack: 'total',
        data: reportData?.cashFlow.map(c => c.outflow) || [],
        itemStyle: { color: '#f97316' }
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gerando Relatórios</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Analisando os dados da sua operação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Relatórios Financeiros</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">Dashboard → Relatórios → Financeiro</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
            <option>Último mês</option>
            <option>Últimos 3 meses</option>
            <option>Últimos 6 meses</option>
            <option>Último ano</option>
          </select>
          <Button variant="outline" icon={Download}>Exportar</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              placeholder="dd/mm/aaaa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              placeholder="dd/mm/aaaa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Tipo de Serviço</label>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            >
              <option value="all">Todos</option>
              <option>Frete Rodoviário</option>
              <option>Entrega Expressa</option>
              <option>Armazenagem</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            >
              <option value="all">Todos</option>
              <option>Pago</option>
              <option>Pendente</option>
              <option>Vencido</option>
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Cliente</label>
            <input
              type="text"
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              placeholder="Buscar cliente..."
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="primary" size="sm" className="flex-1">Aplicar</Button>
            <Button variant="outline" size="sm" className="flex-1">Limpar</Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Receita Total</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">
                {formatCurrency(reportData?.totalRevenue || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">
                  {formatPercentage(reportData?.monthlyComparison.revenueChange || 0)} vs mês anterior
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Despesas Totais</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">
                {formatCurrency(reportData?.totalExpenses || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">
                  {formatPercentage(reportData?.monthlyComparison.expensesChange || 0)} vs mês anterior
                </span>
              </div>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Lucro Líquido</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">
                {formatCurrency(reportData?.netProfit || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-blue-500">
                  Margem: {reportData?.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Contas a Receber</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">
                {formatCurrency(reportData?.accountsReceivable || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-500">
                  {reportData?.pendingCount || 0} pendências
                </span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Receita vs Despesas">
          <ReactECharts option={revenueVsExpensesOption} style={{ height: '350px' }} />
        </Card>

        <Card title="Receita por Tipo de Serviço">
          <ReactECharts option={serviceRevenueOption} style={{ height: '350px' }} />
        </Card>
      </div>

      {/* Transactions Table */}
      <Card title="Transações Recentes">
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar transações..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">DATA</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">CLIENTE</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">SERVIÇO</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">ROTA</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">VALOR</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.recentTransactions.slice(0, 4).map((transaction, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-bg-secondary">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{transaction.client}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{transaction.service}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{transaction.route}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-dark-text font-medium">{formatCurrency(transaction.value)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'Pago' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                      transaction.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
          <span>Mostrando 1-4 de {reportData?.recentTransactions.length || 0} transações</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Anterior</Button>
            <Button variant="outline" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Próximo</Button>
          </div>
        </div>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes */}
        <Card title="Rotas Mais Lucrativas">
          <div className="space-y-4">
            {reportData?.topRoutes.map((route, index) => (
              <div key={index} className="border-b border-gray-100 dark:border-dark-border/50 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text">{route.route}</h4>
                  <span className="text-lg font-bold text-gray-900 dark:text-dark-text">{formatCurrency(route.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-dark-text-secondary">
                  <span>{route.trips} entregas</span>
                  <span className={route.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatPercentage(route.change)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Clients */}
        <Card title="Top 10 Clientes">
          <div className="space-y-2">
            {reportData?.topClients.map((client, index) => (
              <div key={index} className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary w-32 truncate">{client.name}</span>
                <div className="flex-1 mx-3">
                  <div className="h-8 bg-blue-500 rounded" style={{ width: `${(client.revenue / (reportData.topClients[0]?.revenue || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cash Flow */}
      <Card title="Fluxo de Caixa - Próximos 30 Dias">
        <ReactECharts option={cashFlowOption} style={{ height: '300px' }} />
      </Card>

      {/* Footer Actions */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button variant="outline" icon={Download}>Gerar Relatório Completo</Button>
            <Button variant="outline" icon={Calendar}>Agendar Relatório</Button>
            <Button variant="outline" icon={Share2}>Compartilhar</Button>
          </div>
          <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default Relatorios;
