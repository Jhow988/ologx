import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Search, Loader, Paperclip, Eye, EyeOff, Calendar, Mail, Send, Check } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Table from '../components/UI/Table';
import Modal from '../components/UI/Modal';
import NewTripForm from '../components/Forms/NewTripForm';
import { Trip, Client, Vehicle, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../hooks/useTrips';
import { useClients } from '../hooks/useClients';
import { useVehicles } from '../hooks/useVehicles';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { sendTripAttachments } from '../services/emailService';

const Viagens: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trips: rawTrips, loading: tripsLoading, createTrip, updateTrip } = useTrips();
  const { clients } = useClients();
  const { vehicles } = useVehicles('active');
  const [drivers, setDrivers] = useState<User[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | 'details' | null;
    trip: Trip | null;
  }>({ type: null, trip: null });

  // Buscar motoristas
  const fetchDrivers = useCallback(async () => {
    if (!user?.companyId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('company_id', user.companyId)
      .eq('role', 'driver')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching drivers:', error);
    } else {
      const mappedDrivers = (data || []).map(d => ({
        id: d.id,
        name: d.full_name,
        role: d.role,
        status: d.status
      })) as User[];
      setDrivers(mappedDrivers);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);
  // Buscar nome da empresa
  const fetchCompanyName = useCallback(async () => {
    if (!user?.companyId) return;

    const { data, error } = await supabase
      .from('companies')
      .select('name')
      .eq('id', user.companyId)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
    } else if (data) {
      setCompanyName(data.name);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchCompanyName();
  }, [fetchCompanyName]);


  // Mapear trips para o formato esperado
  const trips = rawTrips.map((t: any) => ({
    id: t.id,
    companyId: t.company_id,
    clientId: t.client_id,
    clientName: t.client?.name || 'N/A',
    vehicleId: t.vehicle_id,
    vehiclePlate: t.vehicle?.plate || 'N/A',
    vehicleType: t.vehicle_type,
    driverId: t.driver_id,
    driverName: t.driver?.full_name || 'N/A',
    startDate: t.start_date,
    endDate: t.end_date,
    origin: t.origin,
    destination: t.destination,
    freight_value: t.freight_value || 0,
    freightType: t.freight_type,
    insuranceInfo: t.insurance_info,
    status: t.status,
    cte: t.cte,
    nf: t.nf,
    requester: t.requester,
    distance: t.distance || 0,
    attachments: t.attachments || [],
    hidden: t.hidden || false,
    email_sent: t.email_sent || false,
    email_sent_at: t.email_sent_at,
    service_number: t.service_number,
  })) as Trip[];

  const handleSaveTrip = async (tripData: Partial<Trip>) => {
    console.log('🎯 handleSaveTrip CHAMADO - dados recebidos:', tripData);

    // VALIDAÇÃO DETALHADA
    const validationErrors: string[] = [];

    console.log('📋 Validando campo a campo:');
    console.log('  clientId:', tripData.clientId, '- válido?', !!tripData.clientId);
    console.log('  startDate:', tripData.startDate, '- válido?', !!tripData.startDate);
    console.log('  origin:', tripData.origin, '- válido?', !!tripData.origin);
    console.log('  destination:', tripData.destination, '- válido?', !!tripData.destination);
    console.log('  vehicleId:', tripData.vehicleId, '- válido?', !!tripData.vehicleId);
    console.log('  driverId:', tripData.driverId, '- válido?', !!tripData.driverId);
    console.log('  freight_value:', tripData.freight_value, '- válido?', tripData.freight_value && tripData.freight_value > 0);

    if (!tripData.clientId) validationErrors.push('Empresa');
    if (!tripData.startDate) validationErrors.push('Data');
    if (!tripData.origin || tripData.origin.trim() === '') validationErrors.push('Origem');
    if (!tripData.destination || tripData.destination.trim() === '') validationErrors.push('Destino');
    if (!tripData.vehicleId) validationErrors.push('Veículo');
    if (!tripData.driverId) validationErrors.push('Motorista');
    if (!tripData.freight_value || tripData.freight_value <= 0) validationErrors.push('Valor');

    if (validationErrors.length > 0) {
      console.error('❌ VALIDAÇÃO FALHOU - Campos inválidos:', validationErrors);
      toast.error(`Por favor, preencha os campos obrigatórios: ${validationErrors.join(', ')}`);
      return;
    }

    console.log('✅ Validação passou! Preparando dados para salvar...');

    // Preparar attachments para salvar (apenas metadados, não o File object)
    const attachmentsToSave = (tripData.attachments || []).map(att => ({
      id: att.id,
      name: att.name,
      size: att.size,
      url: att.url,
      storagePath: att.storagePath
    }));

    const dataToSave = {
      client_id: tripData.clientId,
      start_date: tripData.startDate,
      cte: tripData.cte || null,
      nf: tripData.nf || null,
      requester: tripData.requester || null,
      origin: tripData.origin,
      destination: tripData.destination,
      vehicle_type: tripData.vehicleType || null,
      vehicle_id: tripData.vehicleId,
      driver_id: tripData.driverId,
      freight_value: tripData.freight_value || 0,
      freight_type: tripData.freightType || null,
      insurance_info: tripData.insuranceInfo || null,
      description: tripData.description || null,
      status: tripData.status || 'scheduled',
      distance: tripData.distance || 0,
      attachments: attachmentsToSave,
    };

    console.log('💾 Salvando viagem com dados finais:', dataToSave);

    if (modalState.type === 'edit' && modalState.trip) {
      await updateTrip(modalState.trip.id, dataToSave as any);
    } else {
      await createTrip(dataToSave as any);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalState({ type: null, trip: null });
  };

  const handleToggleHidden = async (trip: Trip) => {
    try {
      const newHiddenStatus = !trip.hidden;
      console.log('Alterando visibilidade:', { tripId: trip.id, currentHidden: trip.hidden, newHidden: newHiddenStatus });

      const result = await updateTrip(trip.id, {
        hidden: newHiddenStatus
      } as any);

      console.log('Resultado da atualização:', result);

      if (result) {
        toast.success(newHiddenStatus ? 'Serviço ocultado com sucesso' : 'Serviço reexibido com sucesso');
      } else {
        toast.error('Erro ao alterar visibilidade do serviço');
      }
    } catch (error) {
      console.error('Erro ao alterar visibilidade do serviço:', error);
      toast.error('Erro ao alterar visibilidade do serviço');
    }
  };

  const handleSendEmail = async (trip: Trip) => {
    if (!trip.attachments || trip.attachments.length === 0) {
      toast.error('Não há anexos para enviar');
      return;
    }

    // Buscar email do cliente
    const client = clients.find(c => c.id === trip.clientId);
    if (!client || !client.email) {
      toast.error('Cliente não possui email cadastrado');
      return;
    }

    console.log('=== INICIANDO ENVIO DE EMAIL ===');
    console.log('Cliente:', client.name, '- Email:', client.email);
    console.log('Número de anexos:', trip.attachments.length);
    console.log('Anexos:', trip.attachments.map(a => ({ name: a.name, url: a.url })));

    setSendingEmail(true);
    try {
      // Enviar email via Resend
      await sendTripAttachments({
        trip,
        client,
        companyName: companyName || 'OLogX',
      });

      // Atualizar status de email enviado
      await updateTrip(trip.id, {
        email_sent: true,
        email_sent_at: new Date().toISOString()
      });

      toast.success(`Email enviado com sucesso para ${client.email}`, { duration: 5000 });
      closeModal();
    } catch (error) {
      console.error('=== ERRO AO ENVIAR EMAIL ===');
      console.error('Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Mensagem completa:', error);

      let errorMessage = 'Erro ao enviar email. Tente novamente.';

      if (error instanceof Error) {
        // Verificar tipos específicos de erro
        if (error.message.includes('não configurado') || error.message.includes('VITE_RESEND_API_KEY')) {
          errorMessage = '⚠️ Serviço de email não configurado. Entre em contato com o suporte.';
        } else if (error.message.includes('Resend')) {
          errorMessage = `⚠️ Erro no serviço de email: ${error.message}`;
        } else {
          errorMessage = `❌ Erro: ${error.message}`;
        }
      }

      toast.error(errorMessage, { duration: 7000 });
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    // Filtro de viagens ocultas
    if (!showHidden && trip.hidden) {
      return false;
    }

    // Filtro de busca por texto
    const matchesSearch = trip.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de datas
    let matchesDateRange = true;
    if (startDate || endDate) {
      if (!trip.startDate) {
        matchesDateRange = false;
      } else {
        const tripDate = new Date(trip.startDate.split('T')[0]);

        if (startDate) {
          const filterStartDate = new Date(startDate);
          if (tripDate < filterStartDate) matchesDateRange = false;
        }

        if (endDate) {
          const filterEndDate = new Date(endDate);
          if (tripDate > filterEndDate) matchesDateRange = false;
        }
      }
    }

    return matchesSearch && matchesDateRange;
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const columns = [
    {
      key: 'service_number',
      header: 'Nº',
      render: (serviceNumber: number, trip: Trip) => (
        <span className="font-semibold text-primary">#{serviceNumber || '---'}</span>
      )
    },
    {
      key: 'startDate',
      header: 'Data',
      render: (startDate: string) => {
        if (!startDate) return <span className="text-gray-400">-</span>;
        try {
          const dateOnly = startDate.split('T')[0];
          const [year, month, day] = dateOnly.split('-').map(Number);
          if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
            return <span className="text-gray-400">-</span>;
          }
          const dateObj = new Date(year, month - 1, day);
          return <span className="text-sm">{dateObj.toLocaleDateString('pt-BR')}</span>;
        } catch (error) {
          return <span className="text-gray-400">-</span>;
        }
      }
    },
    {
      key: 'cte',
      header: 'CT-e',
      render: (cte: string) => (
        <span className="text-sm">{cte || '-'}</span>
      )
    },
    {
      key: 'clientName',
      header: 'Empresa',
      render: (name: string) => (
        <div className="max-w-[150px] truncate" title={name}>{name}</div>
      )
    },
    {
      key: 'requester',
      header: 'Solicitante',
      render: (requester: string) => (
        <span className="text-sm">{requester || '-'}</span>
      )
    },
    {
      key: 'origin',
      header: 'Serviço',
      render: (origin: string, trip: Trip) => (
        <div className="max-w-[180px] truncate" title={`${origin} → ${trip.destination}`}>
          {origin || '-'} → {trip.destination || '-'}
        </div>
      )
    },
    {
      key: 'destination',
      header: 'Cidade',
      render: (destination: string) => (
        <span className="text-sm">{destination || '-'}</span>
      )
    },
    {
      key: 'vehicleType',
      header: 'Tipo Veículo',
      render: (vehicleType: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${vehicleType ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'text-gray-400'}`}>
          {vehicleType || '-'}
        </span>
      )
    },
    {
      key: 'driverName',
      header: 'Motorista',
      render: (driverName: string) => (
        <span className="text-sm">{driverName || '-'}</span>
      )
    },
    {
      key: 'freightType',
      header: 'Frete',
      render: (freightType: string) => (
        <span className="text-sm">{freightType || '-'}</span>
      )
    },
    {
      key: 'insuranceInfo',
      header: 'Seguro',
      render: (insuranceInfo: string) => (
        <span className="text-sm">{insuranceInfo ? 'R$ ' + insuranceInfo : 'R$0'}</span>
      )
    },
    {
      key: 'freight_value',
      header: 'Valor',
      render: (value: number) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, trip: Trip) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => setModalState({ type: 'details', trip })}
            title="Visualizar detalhes"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => navigate(`/servicos/editar/${trip.id}`)}
            title="Editar serviço"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={trip.hidden ? Eye : EyeOff}
            onClick={() => handleToggleHidden(trip)}
            title={trip.hidden ? "Reexibir serviço" : "Ocultar serviço"}
            className={trip.hidden ? "text-gray-400" : ""}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão de Serviços</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie todos os serviços e entregas</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/servicos/novo')}>Novo Serviço</Button>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, origem, destino ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                  placeholder="Data inicial"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                  placeholder="Data final"
                />
              </div>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border transition-colors whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm">Mostrar ocultos</span>
              </label>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Mostrando {filteredTrips.length} de {trips.length} serviço(s)
            </p>
          </div>
          {tripsLoading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table columns={columns} data={filteredTrips} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalState.type === 'new' || modalState.type === 'edit'}
        onClose={closeModal}
        title={modalState.type === 'edit' ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
      >
        <NewTripForm
          initialData={modalState.trip}
          clients={clients}
          vehicles={vehicles}
          users={drivers}
          trips={trips}
          onSave={handleSaveTrip}
          onCancel={closeModal}
        />
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={modalState.type === 'details'}
        onClose={closeModal}
        title="Detalhes do Serviço"
      >
        {modalState.trip && (
          <div className="space-y-4">
            {/* Primeira linha: Data, Status, Cliente, Solicitante */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                  {modalState.trip.startDate ? new Date(modalState.trip.startDate.split('T')[0].split('-').map(Number).reduce((acc, val, i) => i === 0 ? [val] : i === 1 ? [...acc, val - 1] : [...acc, val], [] as number[]).reduce((d, v, i) => i === 0 ? new Date(v, 0, 1) : i === 1 ? new Date(d.getFullYear(), v, d.getDate()) : new Date(d.getFullYear(), d.getMonth(), v), new Date())).toLocaleDateString('pt-BR') : 'Sem data'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(modalState.trip.status)}`}>
                  {getStatusText(modalState.trip.status)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cliente</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate" title={modalState.trip.clientName}>
                  {modalState.trip.clientName}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Solicitante</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate" title={modalState.trip.requester || '-'}>
                  {modalState.trip.requester || '-'}
                </p>
              </div>
            </div>

            {/* Segunda linha: CT-e, NF */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CT-e</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{modalState.trip.cte || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NF</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{modalState.trip.nf || '-'}</p>
              </div>
            </div>

            {/* Terceira linha: Origem, Destino, Distância */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Origem</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{modalState.trip.origin}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Destino</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{modalState.trip.destination}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Distância</label>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {modalState.trip.distance ? `${modalState.trip.distance} km` : '-'}
                </p>
              </div>
            </div>

            {/* Quarta linha: Veículo, Motorista */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Veículo</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{modalState.trip.vehiclePlate || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Motorista</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate" title={modalState.trip.driverName}>
                  {modalState.trip.driverName || '-'}
                </p>
              </div>
            </div>

            {/* Quinta linha: Valor do Frete */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor do Frete</label>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(modalState.trip.freight_value || 0)}
              </p>
            </div>

            {/* Anexos */}
            {modalState.trip.attachments && modalState.trip.attachments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Anexos ({modalState.trip.attachments.length})
                  </label>
                  {modalState.trip.email_sent ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        Enviado {modalState.trip.email_sent_at ? new Date(modalState.trip.email_sent_at).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Send}
                      onClick={() => handleSendEmail(modalState.trip!)}
                      disabled={sendingEmail}
                      className="text-xs"
                    >
                      {sendingEmail ? 'Enviando...' : 'Enviar para Cliente'}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {modalState.trip.attachments.map((att: any, idx: number) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-gray-900 dark:text-dark-text flex-1 truncate">{att.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(att.size / 1024).toFixed(1)} KB
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Fechar */}
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={closeModal}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Viagens;
