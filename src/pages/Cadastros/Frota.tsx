import React, { useState } from 'react';
import { Plus, Pencil, Search, Filter, Loader, AlertTriangle } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import NewVehicleForm from '../../components/Forms/NewVehicleForm';
import { Vehicle } from '../../types';
import { useVehicles } from '../../hooks/useVehicles';

const Frota: React.FC = () => {
  const { vehicles, loading, createVehicle, updateVehicle } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | null;
    vehicle: Vehicle | null;
  }>({ type: null, vehicle: null });

  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    const formattedData = { ...vehicleData, year: Number(vehicleData.year) };

    if (modalState.type === 'edit' && modalState.vehicle) {
      await updateVehicle(modalState.vehicle.id, formattedData);
    } else {
      await createVehicle(formattedData as any);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalState({ type: null, vehicle: null });
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'in_use': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'in_use': return 'Em Uso';
      case 'maintenance': return 'Manutenção';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  };

  const hasRestriction = (vehicle: Vehicle) => {
    if (!vehicle.licensing_due_date) return false;
    const dueDate = new Date(vehicle.licensing_due_date + 'T00:00:00');
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return dueDate <= thirtyDaysFromNow; // Expired or expiring soon
  };

  const columns = [
    {
      key: 'plate',
      header: 'Placa',
      render: (plate: string, vehicle: Vehicle) => (
        <div className="flex items-center gap-2">
          {hasRestriction(vehicle) && (
            <div title="Veículo com restrição de licenciamento">
              <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            </div>
          )}
          <span>{plate}</span>
        </div>
      )
    },
    { key: 'model', header: 'Modelo' },
    { key: 'year', header: 'Ano' },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      ),
    },
    { key: 'licensing_due_date', header: 'Venc. Licenciamento', render: (date: string) => date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A' },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, vehicle: Vehicle) => (
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setModalState({ type: 'edit', vehicle })} />
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão de Frota</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie todos os veículos da sua transportadora</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalState({ type: 'new', vehicle: null })}>Novo Veículo</Button>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por placa ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="inactive">Inativo</option>
              </select>
              <Button variant="outline" icon={Filter}>Filtros</Button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table columns={columns} data={filteredVehicles} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalState.type === 'new' || modalState.type === 'edit'}
        onClose={closeModal}
        title={modalState.type === 'edit' ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
      >
        <NewVehicleForm initialData={modalState.vehicle} onSave={handleSaveVehicle} onCancel={closeModal} />
      </Modal>
    </>
  );
};

export default Frota;
