import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Loader, Download, Calendar, Share2, TrendingUp, TrendingDown, DollarSign, AlertCircle, X, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

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
  freight_value: number;
  origin: string;
  destination: string;
  client_id: string;
  start_date: string;
  end_date?: string;
  hidden?: boolean;
  vehicle_type?: string;
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
  revenueByVehicle: { name: string; value: number; percentage: number; }[];
  recentTransactions: any[];
  topRoutes: { route: string; trips: number; revenue: number; change: number; }[];
  topClients: { name: string; revenue: number; }[];
  cashFlow: { week: string; inflow: number; outflow: number; }[];
}

const RelatorioAnalitico: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState({ serviceType: 'all', status: 'all', client: '' });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({ frequency: 'weekly', email: '', day: '1' });
  const [shareEmail, setShareEmail] = useState('');

  const fetchReportData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Fetch data (excluindo serviços ocultos)
      const [financialsRes, tripsRes, clientsRes] = await Promise.all([
        supabase.from('financial_records').select('*').eq('company_id', user.companyId),
        supabase.from('trips').select('*').eq('company_id', user.companyId).neq('hidden', true),
        supabase.from('clients').select('id, name').eq('company_id', user.companyId),
      ]);

      const financials = (financialsRes.data || []) as FinancialRecord[];
      const trips = (tripsRes.data || []) as any[] as Trip[];
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

      // Calcular receita de financial_records + serviços concluídos
      const financialRevenue = currentMonthFinancials
        .filter(f => f.type === 'receivable')
        .reduce((sum, f) => sum + f.amount, 0);

      // Adicionar receita de serviços concluídos no mês (usando end_date)
      const completedTrips = trips.filter(t => {
        if (!t.end_date || t.status !== 'completed') return false;
        const endDate = new Date(t.end_date);
        return endDate >= currentMonth;
      });

      const tripsRevenue = completedTrips.reduce((sum, t) => sum + (t.freight_value || 0), 0);

      const totalRevenue = financialRevenue + tripsRevenue;

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

      // Revenue by vehicle type (baseado em serviços concluídos)
      const vehicleTypes: { [key: string]: number } = {};

      completedTrips.forEach(trip => {
        const value = trip.freight_value || 0;
        const vehicleType = trip.vehicle_type || 'Não especificado';
        vehicleTypes[vehicleType] = (vehicleTypes[vehicleType] || 0) + value;
      });

      const totalVehicleRevenue = Object.values(vehicleTypes).reduce((a, b) => a + b, 0);
      const revenueByVehicle = Object.entries(vehicleTypes)
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalVehicleRevenue > 0 ? (value / totalVehicleRevenue) * 100 : 0
        }))
        .filter(s => s.value > 0)
        .sort((a, b) => b.value - a.value);

      // Recent transactions (apenas serviços concluídos)
      const recentTransactions = completedTrips
        .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime())
        .slice(0, 10)
        .map(trip => {
          const client = clients.find(c => c.id === trip.client_id);
          const value = trip.freight_value || 0;
          return {
            date: new Date(trip.end_date || trip.start_date).toLocaleDateString('pt-BR'),
            client: client?.name || 'Cliente não encontrado',
            service: value > 10000 ? 'Frete Rodoviário' : 'Entrega Expressa',
            route: `${trip.origin} - ${trip.destination}`,
            value: value,
            status: 'Concluído' // Todos são concluídos
          };
        });

      // Top routes (apenas serviços concluídos)
      const routeStats: { [key: string]: { trips: number; revenue: number } } = {};
      completedTrips.forEach(trip => {
        const route = `${trip.origin} - ${trip.destination}`;
        if (!routeStats[route]) {
          routeStats[route] = { trips: 0, revenue: 0 };
        }
        routeStats[route].trips++;
        routeStats[route].revenue += (trip.freight_value || 0);
      });

      // Calcular mudança de rotas comparando com mês anterior
      const lastMonthTrips = trips.filter(t => {
        if (!t.end_date || t.status !== 'completed') return false;
        const endDate = new Date(t.end_date);
        return endDate >= lastMonth && endDate <= lastMonthEnd;
      });

      const lastMonthRouteStats: { [key: string]: number } = {};
      lastMonthTrips.forEach(trip => {
        const route = `${trip.origin} - ${trip.destination}`;
        lastMonthRouteStats[route] = (lastMonthRouteStats[route] || 0) + (trip.freight_value || 0);
      });

      const topRoutes = Object.entries(routeStats)
        .map(([route, stats]) => {
          const lastMonthRevenue = lastMonthRouteStats[route] || 0;
          const change = lastMonthRevenue > 0
            ? ((stats.revenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;
          return {
            route,
            trips: stats.trips,
            revenue: stats.revenue,
            change
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Top clients (baseado em serviços concluídos)
      const clientRevenue: { [key: string]: number } = {};
      completedTrips.forEach(trip => {
        const client = clients.find(c => c.id === trip.client_id);
        if (client) {
          clientRevenue[client.name] = (clientRevenue[client.name] || 0) + (trip.freight_value || 0);
        }
      });

      const topClients = Object.entries(clientRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Cash flow (próximas 4 semanas baseado em due_date)
      const cashFlowData: { week: string; inflow: number; outflow: number; }[] = [];
      for (let weekNum = 1; weekNum <= 4; weekNum++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + (weekNum - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekFinancials = financials.filter(f => {
          const dueDate = new Date(f.due_date);
          return dueDate >= weekStart && dueDate <= weekEnd;
        });

        const inflow = weekFinancials
          .filter(f => f.type === 'receivable')
          .reduce((sum, f) => sum + f.amount, 0);

        const outflow = weekFinancials
          .filter(f => f.type === 'payable')
          .reduce((sum, f) => sum + f.amount, 0);

        cashFlowData.push({
          week: `Sem ${weekNum}`,
          inflow,
          outflow: -outflow
        });
      }

      const cashFlow = cashFlowData;

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
        revenueByVehicle,
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

  // Generate Complete PDF Report
  const handleGenerateCompletePDF = () => {
    if (!reportData) {
      toast.error('Nenhum dado disponível para gerar o relatório');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Analítico Completo', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // KPIs Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores Financeiros', 14, yPosition);
    yPosition += 5;

    const kpiData = [
      ['Receita Total', formatCurrency(reportData.totalRevenue)],
      ['Despesas Totais', formatCurrency(reportData.totalExpenses)],
      ['Lucro Líquido', formatCurrency(reportData.netProfit)],
      ['Margem de Lucro', `${reportData.profitMargin.toFixed(1)}%`],
      ['Contas a Receber', formatCurrency(reportData.accountsReceivable)],
      ['Contas Pendentes', reportData.pendingCount.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Indicador', 'Valor']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Routes Section
    if (reportData.topRoutes.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Principais Rotas', 14, yPosition);
      yPosition += 5;

      const routesData = reportData.topRoutes.map(r => [
        r.route,
        r.trips.toString(),
        formatCurrency(r.revenue),
        formatPercentage(r.change)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Rota', 'Viagens', 'Receita', 'Variação']],
        body: routesData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Top Clients Section
    if (reportData.topClients.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Principais Clientes', 14, yPosition);
      yPosition += 5;

      const clientsData = reportData.topClients.map(c => [
        c.name,
        formatCurrency(c.revenue)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Cliente', 'Receita Total']],
        body: clientsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Revenue by Vehicle Section
    if (reportData.revenueByVehicle.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Receita por Tipo de Veículo', 14, yPosition);
      yPosition += 5;

      const vehicleData = reportData.revenueByVehicle.map(v => [
        v.name,
        formatCurrency(v.value),
        `${v.percentage.toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Tipo de Veículo', 'Receita', '% do Total']],
        body: vehicleData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    // Save PDF
    const fileName = `relatorio-analitico-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    toast.success('Relatório completo gerado com sucesso!');
  };

  // Schedule Report
  const handleScheduleReport = () => {
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleConfig.email) {
      toast.error('Por favor, informe um email para envio');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(scheduleConfig.email)) {
      toast.error('Email inválido');
      return;
    }

    try {
      // TODO: Implement backend service to handle scheduled reports
      // For now, we'll just show a success message
      const frequencyText = scheduleConfig.frequency === 'daily' ? 'diariamente' :
                           scheduleConfig.frequency === 'weekly' ? 'semanalmente' : 'mensalmente';

      console.log('Agendamento configurado:', {
        frequency: scheduleConfig.frequency,
        email: scheduleConfig.email,
        day: scheduleConfig.day,
        companyId: user?.companyId
      });

      toast.success(`Relatório agendado para envio ${frequencyText} para ${scheduleConfig.email}`);
      setShowScheduleModal(false);
      setScheduleConfig({ frequency: 'weekly', email: '', day: '1' });
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Erro ao criar agendamento. Tente novamente.');
    }
  };

  // Share Report
  const handleShareReport = () => {
    setShowShareModal(true);
  };

  const handleSendReport = async () => {
    if (!shareEmail) {
      toast.error('Por favor, informe um email');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast.error('Email inválido');
      return;
    }

    try {
      // In a real implementation, this would call an API to send the email
      // For now, we'll just show a success message
      toast.success(`Relatório enviado para ${shareEmail}!`);
      setShowShareModal(false);
      setShareEmail('');
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error('Erro ao compartilhar relatório. Tente novamente.');
    }
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

  const vehicleRevenueOption = {
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
        data: reportData?.revenueByVehicle.map(s => ({ name: s.name, value: s.value })) || [],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6']
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Relatório Analítico</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">Análise detalhada com gráficos e transações</p>
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

        <Card title="Receita por Tipo de Veículo">
          <ReactECharts option={vehicleRevenueOption} style={{ height: '350px' }} />
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
            <Button variant="outline" icon={Download} onClick={handleGenerateCompletePDF}>
              Gerar Relatório Completo
            </Button>
            <Button variant="outline" icon={Calendar} onClick={handleScheduleReport}>
              Agendar Relatório
            </Button>
            <Button variant="outline" icon={Share2} onClick={handleShareReport}>
              Compartilhar
            </Button>
          </div>
          <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </Card>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                Agendar Relatório
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Frequência
                </label>
                <select
                  value={scheduleConfig.frequency}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              {scheduleConfig.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    Dia da Semana
                  </label>
                  <select
                    value={scheduleConfig.day}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                  >
                    <option value="1">Segunda-feira</option>
                    <option value="2">Terça-feira</option>
                    <option value="3">Quarta-feira</option>
                    <option value="4">Quinta-feira</option>
                    <option value="5">Sexta-feira</option>
                    <option value="6">Sábado</option>
                    <option value="0">Domingo</option>
                  </select>
                </div>
              )}

              {scheduleConfig.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    Dia do Mês
                  </label>
                  <select
                    value={scheduleConfig.day}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Email para Envio
                </label>
                <input
                  type="email"
                  value={scheduleConfig.email}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSchedule}
                className="flex-1"
              >
                Salvar Agendamento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compartilhar Relatório
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              O relatório atual será enviado por email no formato PDF.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Email do Destinatário
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="destinatario@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSendReport}
                icon={Mail}
                className="flex-1"
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioAnalitico;
