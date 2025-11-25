import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  description: string | null;
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
  requester: string;
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
    client: 'all'
  });
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [companyName, setCompanyName] = useState<string>('Empresa');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ServiceRecord; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  const fetchData = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);

    try {
      // Build query for trips with optional client filter
      let tripsQuery = supabase
        .from('trips')
        .select('*')
        .eq('company_id', user.companyId)
        .eq('status', 'completed')
        .gte('start_date', filters.startDate)
        .lte('start_date', filters.endDate)
        .order('start_date', { ascending: true });

      // Apply client filter if selected
      if (filters.client !== 'all') {
        tripsQuery = tripsQuery.eq('client_id', filters.client);
      }

      // Fetch all required data
      const [tripsRes, clientsRes, vehiclesRes, driversRes, currentCompanyRes] = await Promise.all([
        tripsQuery,
        supabase.from('clients').select('id, name, city').eq('company_id', user.companyId).order('name'),
        supabase.from('vehicles').select('id, plate, model').eq('company_id', user.companyId).neq('status', 'inactive'),
        supabase.from('profiles').select('id, full_name').eq('company_id', user.companyId).eq('status', 'active').not('cnh_due_date', 'is', null),
        supabase.from('companies').select('name').eq('id', user.companyId).single()
      ]);

      if (tripsRes.error) throw tripsRes.error;

      const trips = (tripsRes.data || []) as Trip[];
      const clientsList = (clientsRes.data || []) as Client[];
      const vehicles = (vehiclesRes.data || []) as Vehicle[];
      const drivers = (driversRes.data || []) as Driver[];

      setClients(clientsList);

      // Set current company name
      if (currentCompanyRes.data) {
        setCompanyName(currentCompanyRes.data.name);
      }

      // Map trips to service records
      const records: ServiceRecord[] = trips.map(trip => {
        const client = clientsList.find(c => c.id === trip.client_id);
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const driver = drivers.find(d => d.id === trip.driver_id);

        return {
          date: new Date(trip.start_date).toLocaleDateString('pt-BR'),
          cte: trip.cte || '-',
          nf: trip.nf || '-',
          client: client?.name || '-',
          requester: trip.requester || '-',
          service: trip.description || `${trip.origin} → ${trip.destination}`,
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
  }, [user?.companyId, filters.startDate, filters.endDate, filters.client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    fetchData();
  };

  // Função para ordenar os serviços
  const handleSort = (key: keyof ServiceRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Serviços ordenados
  const sortedServices = React.useMemo(() => {
    if (!sortConfig) return services;

    const sorted = [...services].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Tratamento especial para valores numéricos
      if (sortConfig.key === 'value') {
        return sortConfig.direction === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }

      // Tratamento para strings
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [services, sortConfig]);

  const handleExportPDF = async () => {
    try {
      // Buscar dados da empresa do usuário (transportadora)
      const { data: userCompanyData, error: companyError } = await supabase
        .from('companies')
        .select('name, document, address, phone, email')
        .eq('id', user?.companyId)
        .single();

      console.log('🏢 Dados da empresa transportadora:');
      console.log('  - user.companyId:', user?.companyId);
      console.log('  - userCompanyData:', userCompanyData);
      console.log('  - companyError:', companyError);

      // Buscar dados da empresa cliente (se filtro específico)
      let clientCompanyData = null;
      if (filters.client !== 'all') {
        const { data } = await supabase
          .from('clients')
          .select('name, document, address, phone, email, city, state')
          .eq('id', filters.client)
          .single();
        clientCompanyData = data;
      }

      // Create new PDF document in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Format dates for display
      const startDateFormatted = new Date(filters.startDate).toLocaleDateString('pt-BR');
      const endDateFormatted = new Date(filters.endDate).toLocaleDateString('pt-BR');
      const todayFormatted = new Date().toLocaleDateString('pt-BR');

      const pageWidth = doc.internal.pageSize.getWidth();

      // HEADER - Título centralizado
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Fechamento de Serviços', pageWidth / 2, 15, { align: 'center' });

      // SEÇÃO DE INFORMAÇÕES - Duas colunas
      let yPos = 25;

      // COLUNA ESQUERDA - Dados da empresa do relatório (cliente)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      if (clientCompanyData) {
        doc.text(`Empresa: ${clientCompanyData.name}`, 14, yPos);
      } else {
        doc.text('Empresa: Todas', 14, yPos);
      }

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Período: ${startDateFormatted} a ${endDateFormatted}`, 14, yPos);
      yPos += 4;
      doc.text(`Gerado em: ${todayFormatted}`, 14, yPos);

      // COLUNA DIREITA - Dados da transportadora (usuário)
      yPos = 25;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const rightX = pageWidth - 14;

      // Nome fantasia ou razão social da transportadora
      const transportadoraNome = userCompanyData?.name || companyName || 'Transportadora';
      console.log('📝 Nome da transportadora para PDF:', transportadoraNome);
      doc.text(transportadoraNome, rightX, yPos, { align: 'right' });

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      // CNPJ
      if (userCompanyData?.document) {
        console.log('📝 CNPJ:', userCompanyData.document);
        doc.text(`CNPJ: ${userCompanyData.document}`, rightX, yPos, { align: 'right' });
        yPos += 4;
      } else {
        console.log('⚠️ CNPJ não encontrado');
      }

      // Endereço
      if (userCompanyData?.address) {
        console.log('📝 Endereço:', userCompanyData.address);
        doc.text(userCompanyData.address, rightX, yPos, { align: 'right' });
        yPos += 4;
      } else {
        console.log('⚠️ Endereço não encontrado');
      }

      // Telefone
      if (userCompanyData?.phone) {
        console.log('📝 Telefone:', userCompanyData.phone);
        doc.text(`Tel: ${userCompanyData.phone}`, rightX, yPos, { align: 'right' });
        yPos += 4;
      } else {
        console.log('⚠️ Telefone não encontrado');
      }

      // Email
      if (userCompanyData?.email) {
        console.log('📝 Email:', userCompanyData.email);
        doc.text(userCompanyData.email, rightX, yPos, { align: 'right' });
      } else {
        console.log('⚠️ Email não encontrado');
      }

      // Prepare table data
      const tableData = services.map(service => [
        service.date,
        service.cte,
        service.nf,
        service.client,
        service.requester,
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
        startY: 45,
        head: [['Data', 'CT-e', 'NF', 'Cliente', 'Solicitante', 'Serviço', 'Cidade', 'Veículo', 'Motorista', 'Frete', 'Seguro', 'Valor']],
        body: tableData,
        foot: [['', '', '', '', '', '', '', '', '', '', 'TOTAL', formatCurrency(totalValue)]],
        theme: 'striped',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 6,
          cellPadding: 1.5
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'right'
        },
        columnStyles: {
          0: { cellWidth: 16 }, // Data
          1: { cellWidth: 18 }, // CT-e
          2: { cellWidth: 18 }, // NF
          3: { cellWidth: 28 }, // Cliente
          4: { cellWidth: 28 }, // Solicitante
          5: { cellWidth: 35 }, // Serviço
          6: { cellWidth: 22 }, // Cidade
          7: { cellWidth: 18 }, // Veículo
          8: { cellWidth: 25 }, // Motorista
          9: { cellWidth: 20 }, // Frete
          10: { cellWidth: 18 }, // Seguro
          11: { cellWidth: 20, halign: 'right' } // Valor
        },
        margin: { left: 14, right: 14 }
      });

      // Add summary after table
      const finalY = (doc as any).lastAutoTable.finalY || 45;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Total: ${formatCurrency(totalValue)}`, 14, finalY + 8);
      doc.text(`Quantidade de serviços: ${services.length}`, 14, finalY + 14);

      // Add footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Documento gerado automaticamente pelo sistema OLogX em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        pageWidth / 2,
        finalY + 22,
        { align: 'center' }
      );

      // Save PDF
      const clientName = clientCompanyData?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Todas';
      const fileName = `fechamento_${clientName}_${filters.startDate}_${filters.endDate}.pdf`;
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
          Selecione o período e o cliente para gerar o fechamento
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
              Cliente
            </label>
            <select
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            >
              <option value="all">Todos</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Data
                    {sortConfig?.key === 'date' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('cte')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    CT-e
                    {sortConfig?.key === 'cte' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('nf')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    NF
                    {sortConfig?.key === 'nf' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('client')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Cliente
                    {sortConfig?.key === 'client' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('requester')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Solicitante
                    {sortConfig?.key === 'requester' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('service')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Serviço
                    {sortConfig?.key === 'service' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('vehicle')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Veículo
                    {sortConfig?.key === 'vehicle' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('driver')} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Motorista
                    {sortConfig?.key === 'driver' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                  <button onClick={() => handleSort('value')} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">
                    Valor
                    {sortConfig?.key === 'value' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">
                    Nenhum serviço encontrado para o período selecionado
                  </td>
                </tr>
              ) : (
                sortedServices.map((service, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-bg-secondary"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.cte}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.nf}</td>
                    <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">{service.client}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.requester}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.service}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.vehicle}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">{service.driver}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-dark-text">
                      {formatCurrency(service.value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedServices.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-secondary">
                  <td colSpan={8} className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-dark-text text-right">
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
