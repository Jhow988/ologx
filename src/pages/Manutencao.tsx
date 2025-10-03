import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Search, Loader } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Table from '../components/UI/Table';
import Modal from '../components/UI/Modal';
import NewMaintenanceForm from '../components/Forms/NewMaintenanceForm';
import { Vehicle } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// Frontend-specific Maintenance type with camelCase
interface Maintenance {
  id: string;
  companyId: string;
  vehicleId: string;
  title: string;
  startDate: string;
  endDate?: string;
  description: string;
  cost: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  type: 'preventive' | 'corrective';
  nextMaintenanceReminder?: string;
  // Joined data
  vehiclePlate?: string;
  vehicleModel?: string;
}

const Manutencao: React.FC = () => {
  const { user } = useAuth();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | null;
    maintenance: Maintenance | null;
  }>({ type: null, maintenance: null });

  const fetchData = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);

    const [maintenancesRes, vehiclesRes] = await Promise.all([
      supabase.from('maintenances').select('*, vehicle:vehicles(plate, model)').eq('company_id', user.companyId).order('start_date', { ascending: false }),
      supabase.from('vehicles').select('*').eq('company_id', user.companyId)
    ]);

    if (maintenancesRes.error) console.error('Error fetching maintenances:', maintenancesRes.error);
    if (vehiclesRes.error) console.error('Error fetching vehicles:', vehiclesRes.error);

    const mappedMaintenances = (maintenancesRes.data || []).map((m: any) => ({
      id: m.id,
      companyId: m.company_id,
      vehicleId: m.vehicle_id,
      title: m.title,
      startDate: m.start_date,
      endDate: m.end_date,
      description: m.description,
      cost: m.cost,
      status: m.status,
      type: m.type,
      nextMaintenanceReminder: m.next_maintenance_reminder,
      vehiclePlate: m.vehicle?.plate || 'N/A',
      vehicleModel: m.vehicle?.model || 'N/A',
    }));

    setMaintenances(mappedMaintenances);
    setVehicles((vehiclesRes.data as unknown as Vehicle[]) || []);
    setLoading(false);
  }, [user?.companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveMaintenance = async (maintenanceData: Partial<Maintenance>) => {
    if (!user?.companyId || !maintenanceData.vehicleId) {
      toast.error('Dados incompletos. Verifique os campos obrigatórios.');
      return;
    }

    console.log('=== SAVE MAINTENANCE DEBUG ===');
    console.log('User Company ID:', user.companyId);
    console.log('Maintenance Data:', maintenanceData);

    const dataToSave = {
      company_id: user.companyId,
      vehicle_id: maintenanceData.vehicleId,
      title: maintenanceData.title,
      start_date: maintenanceData.startDate,
      end_date: maintenanceData.endDate || null,
      description: maintenanceData.description,
      cost: maintenanceData.cost,
      status: maintenanceData.status,
      type: maintenanceData.type,
      next_maintenance_reminder: maintenanceData.nextMaintenanceReminder || null,
    };

    console.log('Data to Save:', dataToSave);

    let vehicleStatusUpdate: { status: 'active' | 'maintenance' } | null = null;
    const oldStatus = modalState.maintenance?.status;
    const newStatus = maintenanceData.status;

    try {
      if (modalState.type === 'edit' && modalState.maintenance) {
        const { data, error } = await supabase.from('maintenances').update(dataToSave).eq('id', modalState.maintenance.id).select();

        console.log('Update Response - Data:', data);
        console.log('Update Response - Error:', error);

        if (error) {
          console.error("Error updating maintenance:", error);
          toast.error(`Erro ao atualizar manutenção: ${error.message}`);
          return;
        }

        if (newStatus === 'in_progress' && oldStatus !== 'in_progress') vehicleStatusUpdate = { status: 'maintenance' };
        else if (newStatus === 'completed' && oldStatus === 'in_progress') vehicleStatusUpdate = { status: 'active' };

        toast.success('Manutenção atualizada com sucesso!');
      } else {
        const { data, error } = await supabase.from('maintenances').insert(dataToSave).select();

        console.log('Insert Response - Data:', data);
        console.log('Insert Response - Error:', error);

        if (error) {
          console.error("Error inserting maintenance:", error);
          toast.error(`Erro ao criar manutenção: ${error.message}`);
          return;
        }

        if (newStatus === 'in_progress') vehicleStatusUpdate = { status: 'maintenance' };

        toast.success('Manutenção criada com sucesso!');
      }

      if (vehicleStatusUpdate) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleStatusUpdate)
          .eq('id', maintenanceData.vehicleId);
        if (vehicleError) {
          console.error("Error updating vehicle status:", vehicleError);
          toast.error(`Erro ao atualizar status do veículo: ${vehicleError.message}`);
        }
      }

      await fetchData();
      closeModal();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error(`Erro inesperado: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const closeModal = () => setModalState({ type: null, maintenance: null });

  const filteredMaintenances = maintenances.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => ({
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'scheduled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  }[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300');

  const getStatusText = (status: string) => ({
    'scheduled': 'Agendada',
    'in_progress': 'Em Andamento',
    'completed': 'Concluída',
  }[status] || status);

  const columns = [
    { key: 'title', header: 'Serviço' },
    { key: 'vehiclePlate', header: 'Veículo', render: (_:any, row: Maintenance) => `${row.vehiclePlate} - ${row.vehicleModel}` },
    { key: 'startDate', header: 'Início', render: (date: string) => {
      if (!date) return '—';
      const d = new Date(date);
      return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleDateString('pt-BR');
    }},
    { key: 'endDate', header: 'Conclusão', render: (date?: string) => {
      if (!date) return '—';
      const d = new Date(date);
      return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleDateString('pt-BR');
    }},
    { key: 'cost', header: 'Custo', render: (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) },
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
      render: (_: any, maintenance: Maintenance) => (
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setModalState({ type: 'edit', maintenance })}>Editar</Button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão de Manutenção</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Controle as manutenções preventivas e corretivas da sua frota</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalState({ type: 'new', maintenance: null })}>Nova Manutenção</Button>
        </div>

        <Card>
          <div className="flex-1 relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por serviço ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg"
            />
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table columns={columns} data={filteredMaintenances} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalState.type === 'new' || modalState.type === 'edit'}
        onClose={closeModal}
        title={modalState.type === 'edit' ? 'Editar Manutenção' : 'Cadastrar Nova Manutenção'}
      >
        <NewMaintenanceForm
          initialData={modalState.maintenance}
          vehicles={vehicles}
          onSave={handleSaveMaintenance}
          onCancel={closeModal}
        />
      </Modal>
    </>
  );
};

export default Manutencao;
