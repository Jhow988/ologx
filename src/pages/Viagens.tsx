import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Search, Loader } from 'lucide-react';
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

const Viagens: React.FC = () => {
  const { user } = useAuth();
  const { trips: rawTrips, loading: tripsLoading, createTrip, updateTrip } = useTrips();
  const { clients } = useClients();
  const { vehicles } = useVehicles();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | null;
    trip: Trip | null;
  }>({ type: null, trip: null });

  // Buscar motoristas
  const fetchDrivers = useCallback(async () => {
    if (!user?.companyId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', user.companyId)
      .eq('role', 'driver');

    if (error) {
      console.error('Error fetching drivers:', error);
    } else {
      const mappedDrivers = (data || []).map(d => ({ id: d.id, name: d.full_name })) as User[];
      setDrivers(mappedDrivers);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Mapear trips para o formato esperado
  const trips = rawTrips.map((t: any) => ({
    id: t.id,
    companyId: t.company_id,
    clientId: t.client_id,
    clientName: t.client?.name || 'N/A',
    vehicleId: t.vehicle_id,
    vehiclePlate: t.vehicle?.plate || 'N/A',
    driverId: t.driver_id,
    driverName: t.driver?.full_name || 'N/A',
    startDate: t.start_date,
    endDate: t.end_date,
    origin: t.origin,
    destination: t.destination,
    value: t.value,
    status: t.status,
    cte: t.cte,
    nf: t.nf,
  })) as Trip[];

  const handleSaveTrip = async (tripData: Partial<Trip>) => {
    const dataToSave = {
      client_id: tripData.clientId,
      start_date: tripData.startDate,
      cte: tripData.cte,
      nf: tripData.nf,
      requester: tripData.requester,
      origin: tripData.origin,
      destination: tripData.destination,
      vehicle_type: tripData.vehicleType,
      vehicle_id: tripData.vehicleId,
      driver_id: tripData.driverId,
      value: tripData.value,
      freight_type: tripData.freightType,
      insurance_info: tripData.insuranceInfo,
      description: tripData.description,
      status: tripData.status,
      attachments: tripData.attachments,
    };

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

  const filteredTrips = trips.filter(trip =>
    trip.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const columns = [
    { key: 'startDate', header: 'Data', render: (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') },
    { key: 'clientName', header: 'Cliente' },
    { key: 'origin', header: 'Origem' },
    { key: 'destination', header: 'Destino' },
    { key: 'vehiclePlate', header: 'Veículo' },
    { key: 'driverName', header: 'Motorista' },
    { key: 'value', header: 'Valor', render: (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, trip: Trip) => (
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setModalState({ type: 'edit', trip })}>Editar</Button>
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
          <Button variant="primary" icon={Plus} onClick={() => setModalState({ type: 'new', trip: null })}>Novo Serviço</Button>
        </div>

        <Card>
          <div className="flex-1 relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, origem, destino ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg"
            />
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
    </>
  );
};

export default Viagens;
