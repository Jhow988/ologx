import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Search, Filter, Loader, AlertTriangle, Eye, EyeOff, Truck, Calendar, Wrench, Info } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import NewVehicleForm from '../../components/Forms/NewVehicleForm';
import { Vehicle } from '../../types';
import { useVehicles } from '../../hooks/useVehicles';
import toast from 'react-hot-toast';

const Frota: React.FC = () => {
  const { vehicles, loading, createVehicle, updateVehicle } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | 'view' | null;
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

  const handleToggleStatus = async (vehicle: Vehicle) => {
    const newStatus = vehicle.status === 'inactive' ? 'available' : 'inactive';
    const result = await updateVehicle(vehicle.id, { status: newStatus });

    if (result) {
      toast.success(
        newStatus === 'available'
          ? `Veículo "${vehicle.plate}" foi reativado!`
          : `Veículo "${vehicle.plate}" foi ocultado!`
      );
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Filtro de busca
      const matchesSearch = vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status dropdown
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;

      // Filtro de inativos (ocultar/mostrar)
      const statusMatch = showInactive || vehicle.status !== 'inactive';

      return matchesSearch && matchesStatus && statusMatch;
    });
  }, [vehicles, searchTerm, statusFilter, showInactive]);

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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Info}
            onClick={() => setModalState({ type: 'view', vehicle })}
            title="Visualizar detalhes"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => setModalState({ type: 'edit', vehicle })}
            title="Editar"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={vehicle.status === 'inactive' ? Eye : EyeOff}
            onClick={() => handleToggleStatus(vehicle)}
            title={vehicle.status === 'inactive' ? 'Reativar veículo' : 'Ocultar veículo'}
            className={vehicle.status === 'inactive' ? 'text-green-600 hover:text-green-700 dark:text-green-400' : ''}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                <option value="all">Todos os Status</option>
                <option value="available">Disponível</option>
                <option value="in_use">Em Uso</option>
                <option value="maintenance">Manutenção</option>
                <option value="inactive">Inativo</option>
              </select>
              <Button
                variant={showInactive ? 'primary' : 'outline'}
                icon={Filter}
                onClick={() => setShowInactive(!showInactive)}
                title={showInactive ? 'Ocultar veículos inativos' : 'Mostrar veículos inativos'}
              >
                {showInactive ? 'Mostrando Todos' : 'Apenas Ativos'}
              </Button>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Mostrando {filteredVehicles.length} de {vehicles.length} veículo(s)
              {!showInactive && vehicles.filter(v => v.status === 'inactive').length > 0 && (
                <span className="ml-2 text-gray-500">
                  ({vehicles.filter(v => v.status === 'inactive').length} oculto(s))
                </span>
              )}
            </p>
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

      <Modal
        isOpen={modalState.type === 'view'}
        onClose={closeModal}
        title="Detalhes do Veículo"
        size="lg"
      >
        {modalState.vehicle && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Placa
                </label>
                <p className="text-gray-900 dark:text-dark-text font-medium">{modalState.vehicle.plate}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Status
                </label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(modalState.vehicle.status)}`}>
                  {getStatusText(modalState.vehicle.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Modelo
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.model}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Marca
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.brand || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Ano
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.year}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Tipo
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.type || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Capacidade
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.capacity || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Tipo de Combustível
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.fuel_type || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  KM Atual
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.current_km ? `${modalState.vehicle.current_km.toLocaleString('pt-BR')} km` : 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Vencimento do Licenciamento
                </label>
                <p className="text-gray-900 dark:text-dark-text flex items-center gap-2">
                  {modalState.vehicle.licensing_due_date ? (
                    <>
                      {new Date(modalState.vehicle.licensing_due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {hasRestriction(modalState.vehicle) && (
                        <span className="text-yellow-500 flex items-center gap-1" title="Vencido ou vencendo em breve">
                          <AlertTriangle className="h-4 w-4" />
                        </span>
                      )}
                    </>
                  ) : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  RENAVAM
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.renavam || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Chassi
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.chassis || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Cor
                </label>
                <p className="text-gray-900 dark:text-dark-text">{modalState.vehicle.color || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Cadastrado em
                </label>
                <p className="text-gray-900 dark:text-dark-text">
                  {new Date(modalState.vehicle.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {modalState.vehicle.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Observações
                </label>
                <p className="text-gray-900 dark:text-dark-text whitespace-pre-wrap">{modalState.vehicle.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button
                variant="outline"
                onClick={closeModal}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                icon={Pencil}
                onClick={() => setModalState({ type: 'edit', vehicle: modalState.vehicle })}
              >
                Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Frota;
