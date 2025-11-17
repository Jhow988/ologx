import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Loader, Download, TrendingUp, TrendingDown, DollarSign, Package, Truck, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialRecord {
  type: 'receivable' | 'payable';
  amount: number;
  due_date: string;
  status: string;
}

interface Trip {
  id: string;
  status: string;
  freight_value: number;
  end_date?: string;
  hidden?: boolean;
  vehicle_type?: string;
}

interface SummaryData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  completedTrips: number;
  activeClients: number;
  revenueByVehicle: { name: string; value: number; percentage: number; }[];
  monthlyFinancials: { month: string; revenue: number; expenses: number; }[];
}

const RelatorioSintetico: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummaryData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch financial records and trips
      const [financialsRes, tripsRes, clientsRes] = await Promise.all([
        supabase.from('financial_records').select('*').eq('company_id', user.companyId),
        supabase.from('trips').select('*').eq('company_id', user.companyId).neq('hidden', true),
        supabase.from('clients').select('id').eq('company_id', user.companyId),
      ]);

      const financials = (financialsRes.data || []) as FinancialRecord[];
      const trips = (tripsRes.data || []) as Trip[];
      const clients = clientsRes.data || [];

      // Current month financials
      const currentMonthFinancials = financials.filter(f => {
        const date = new Date(f.due_date);
        return date >= currentMonth;
      });

      // Completed trips in current month
      const completedTrips = trips.filter(t => {
        if (!t.end_date || t.status !== 'completed') return false;
        const endDate = new Date(t.end_date);
        return endDate >= currentMonth;
      });

      // Calculate revenue
      const financialRevenue = currentMonthFinancials
        .filter(f => f.type === 'receivable')
        .reduce((sum, f) => sum + f.amount, 0);

      const tripsRevenue = completedTrips.reduce((sum, t) => sum + (t.freight_value || 0), 0);
      const totalRevenue = financialRevenue + tripsRevenue;

      // Calculate expenses
      const totalExpenses = currentMonthFinancials
        .filter(f => f.type === 'payable')
        .reduce((sum, f) => sum + f.amount, 0);

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Revenue by vehicle type
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

      // Monthly financials (last 6 months)
      const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
      for (let i = 5; i >= 0; i--) {
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

      setSummaryData({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        completedTrips: completedTrips.length,
        activeClients: clients.length,
        revenueByVehicle,
        monthlyFinancials,
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  const handleExportPDF = () => {
    if (!summaryData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Sintético', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });

    // KPIs Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores do Mês Atual', 14, 45);

    const kpiData = [
      ['Receita Total', `R$ ${summaryData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Despesas Totais', `R$ ${summaryData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Lucro Líquido', `R$ ${summaryData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Margem de Lucro', `${summaryData.profitMargin.toFixed(1)}%`],
      ['Serviços Concluídos', summaryData.completedTrips.toString()],
      ['Clientes Ativos', summaryData.activeClients.toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Indicador', 'Valor']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Revenue by Vehicle
    if (summaryData.revenueByVehicle.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 50;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Receita por Tipo de Veículo', 14, finalY + 15);

      const vehicleData = summaryData.revenueByVehicle.map(v => [
        v.name,
        `R$ ${v.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `${v.percentage.toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Tipo de Veículo', 'Receita', '% do Total']],
        body: vehicleData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save('relatorio-sintetico.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-dark-text-secondary">Nenhum dado disponível</p>
      </div>
    );
  }

  // Chart options
  const vehicleRevenueOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: R$ {c} ({d}%)'
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
        data: summaryData.revenueByVehicle.map(s => ({ name: s.name, value: s.value })),
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6']
      }
    ]
  };

  const monthlyOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Receita', 'Despesas'],
      textStyle: { color: theme === 'dark' ? '#e2e8f0' : '#1a202c' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: summaryData.monthlyFinancials.map(m => m.month),
      axisLabel: { color: theme === 'dark' ? '#e2e8f0' : '#1a202c' },
      axisLine: { lineStyle: { color: theme === 'dark' ? '#4a5568' : '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: theme === 'dark' ? '#e2e8f0' : '#1a202c',
        formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`
      },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#4a5568' : '#e2e8f0' } }
    },
    series: [
      {
        name: 'Receita',
        type: 'bar',
        data: summaryData.monthlyFinancials.map(m => m.revenue),
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Despesas',
        type: 'bar',
        data: summaryData.monthlyFinancials.map(m => m.expenses),
        itemStyle: { color: '#ef4444' }
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Relatório Sintético</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary mt-1">Visão resumida dos principais indicadores</p>
        </div>
        <Button variant="primary" icon={Download} onClick={handleExportPDF}>
          Exportar PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                R$ {summaryData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Despesas Totais</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                R$ {summaryData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Lucro Líquido</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                R$ {summaryData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Margem: {summaryData.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Serviços Concluídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                {summaryData.completedTrips}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                {summaryData.activeClients}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Receita por Tipo de Veículo">
          <ReactECharts option={vehicleRevenueOption} style={{ height: '350px' }} />
        </Card>

        <Card title="Receita vs Despesas (Últimos 6 Meses)">
          <ReactECharts option={monthlyOption} style={{ height: '350px' }} />
        </Card>
      </div>
    </div>
  );
};

export default RelatorioSintetico;
