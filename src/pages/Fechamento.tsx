import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Trip {
  id: string;
  start_date: string;
  cte: string | null;
  nf: string | null;
  requester: string | null;
  client_id: string;
  vehicle_id: string;
  driver_id: string;
  origin: string;
  destination: string;
  freight_type: string | null;
  insurance_info: string | null;
  freight_value: number;
  status: string;
}

interface Client {
  id: string;
  name: string;
  city: string | null;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface Driver {
  id: string;
  full_name: string;
}

interface ServiceRecord {
  date: string;
  cte: string;
  nf: string;
  client: string;
  service: string;
  city: string;
  vehicle: string;
  driver: string;
  freightType: string;
  insurance: string;
  value: number;
}

const Fechamento: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    company: 'all'
  });
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyName, setCompanyName] = useState<string>('Empresa');

  const fetchData = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);

    try {
      // Fetch all required data
      const [tripsRes, clientsRes, vehiclesRes, driversRes, companiesRes, currentCompanyRes] = await Promise.all([
        supabase
          .from('trips')
          .select('*')
          .eq('company_id', user.companyId)
          .eq('status', 'completed')
          .gte('start_date', filters.startDate)
          .lte('start_date', filters.endDate)
          .order('start_date', { ascending: true }),
        supabase.from('clients').select('id, name, city').eq('company_id', user.companyId),
        supabase.from('vehicles').select('id, plate, model').eq('company_id', user.companyId),
        supabase.from('profiles').select('id, full_name').eq('company_id', user.companyId).eq('role', 'driver'),
        supabase.from('companies').select('id, name'),
        supabase.from('companies').select('name').eq('id', user.companyId).single()
      ]);

      if (tripsRes.error) throw tripsRes.error;

      const trips = (tripsRes.data || []) as Trip[];
      const clients = (clientsRes.data || []) as Client[];
      const vehicles = (vehiclesRes.data || []) as Vehicle[];
      const drivers = (driversRes.data || []) as Driver[];
      const allCompanies = (companiesRes.data || []) as { id: string; name: string }[];

      setCompanies(allCompanies);

      // Set current company name
      if (currentCompanyRes.data) {
        setCompanyName(currentCompanyRes.data.name);
      }

      // Map trips to service records
      const records: ServiceRecord[] = trips.map(trip => {
        const client = clients.find(c => c.id === trip.client_id);
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const driver = drivers.find(d => d.id === trip.driver_id);

        return {
          date: new Date(trip.start_date).toLocaleDateString('pt-BR'),
          cte: trip.cte || '-',
          nf: trip.nf || '-',
          client: trip.requester || client?.name || '-',
          service: `${trip.origin} → ${trip.destination}`,
          city: client?.city || '-',
          vehicle: vehicle ? `${vehicle.plate}` : '-',
          driver: driver?.full_name || '-',
          freightType: trip.freight_type || '-',
          insurance: trip.insurance_info || '-',
          value: trip.freight_value || 0
        };
      });

      setServices(records);
      setTotalValue(records.reduce((sum, record) => sum + record.value, 0));
    } catch (error) {
      console.error('Error fetching closing data:', error);
      toast.error('Erro ao carregar dados de fechamento');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    fetchData();
  };

  const handleExportPDF = () => {
    try {
      // Create new PDF document in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Format dates for display
      const startDateFormatted = new Date(filters.startDate).toLocaleDateString('pt-BR');
      const endDateFormatted = new Date(filters.endDate).toLocaleDateString('pt-BR');

      // Add header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Fechamento de Serviços', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Período: ${startDateFormatted} a ${endDateFormatted}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

      // Add info section
      doc.setFontSize(9);
      doc.text(`Total de Serviços: ${services.length}`, 14, 36);
      doc.text(`Valor Total: ${formatCurrency(totalValue)}`, doc.internal.pageSize.getWidth() / 2, 36, { align: 'center' });
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, doc.internal.pageSize.getWidth() - 14, 36, { align: 'right' });

      // Prepare table data
      const tableData = services.map(service => [
        service.date,
        service.cte,
        service.nf,
        service.client,
        service.service,
        service.city,
        service.vehicle,
        service.driver,
        service.freightType,
        service.insurance,
        formatCurrency(service.value)
      ]);

      // Add table
      autoTable(doc, {
        startY: 42,
        head: [['Data', 'CT-e', 'NF', 'Solicitante', 'Serviço', 'Cidade', 'Veículo', 'Motorista', 'Frete', 'Seguro', 'Valor']],
        body: tableData,
        foot: [['', '', '', '', '', '', '', '', '', 'TOTAL GERAL', formatCurrency(totalValue)]],
        theme: 'striped',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'right'
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Data
          1: { cellWidth: 20 }, // CT-e
          2: { cellWidth: 20 }, // NF
          3: { cellWidth: 35 }, // Solicitante
          4: { cellWidth: 40 }, // Serviço
          5: { cellWidth: 25 }, // Cidade
          6: { cellWidth: 20 }, // Veículo
          7: { cellWidth: 30 }, // Motorista
          8: { cellWidth: 25 }, // Frete
          9: { cellWidth: 20 }, // Seguro
          10: { cellWidth: 23, halign: 'right' } // Valor
        },
        margin: { left: 14, right: 14 }
      });

      // Add footer
      const finalY = (doc as any).lastAutoTable.finalY || 42;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Documento gerado automaticamente pelo sistema OLogX em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        doc.internal.pageSize.getWidth() / 2,
        finalY + 10,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `Fechamento_${startDateFormatted.replace(/\//g, '-')}_a_${endDateFormatted.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Carregando Fechamento</h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">Buscando serviços do período...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Fechamento de Serviços
        </h1>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Selecione o período e a empresa para gerar o fechamento
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Empresa
            </label>
            <select
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            >
              <option value="all">Todas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="primary" className="w-full" icon={Search} onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Resultados</h2>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {services.length} serviço(s) encontrado(s) • {formatCurrency(totalValue)}
            </p>
          </div>
          <Button variant="warning" icon={Download} onClick={handleExportPDF}>
            Exportar PDF
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-dark-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Data</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">CT-e</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">NF</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Solicitante</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Serviço</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Cidade</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Veículo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Motorista</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Frete</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Seguro</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Valor</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                    Nenhum serviço encontrado para o período selecionado
                  </td>
                </tr>
              ) : (
                services.map((service, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-bg-secondary"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.cte}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.nf}</td>
                    <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">{service.client}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.service}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.city}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.vehicle}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.driver}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.freightType}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.insurance}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-dark-text">
                      {formatCurrency(service.value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {services.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-secondary">
                  <td colSpan={10} className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-dark-text text-right">
                    TOTAL
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-bold text-primary">
                    {formatCurrency(totalValue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Fechamento;
