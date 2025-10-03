import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Client, Vehicle, User } from '../../types';
import Button from '../UI/Button';
import FileUpload from '../UI/FileUpload';
import { Save } from 'lucide-react';

interface NewTripFormProps {
  initialData?: Trip | null;
  clients: Client[];
  vehicles: Vehicle[];
  users: User[];
  trips: Trip[];
  onSave: (trip: Partial<Trip>) => void;
  onCancel: () => void;
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'in_progress': return 'Em Andamento';
    case 'completed': return 'Concluído';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};

const NewTripForm: React.FC<NewTripFormProps> = ({ initialData, clients, vehicles, users, trips, onSave, onCancel }) => {
  const getInitialState = () => ({
    clientId: initialData?.clientId || '',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    cte: initialData?.cte || '',
    nf: initialData?.nf || '',
    requester: initialData?.requester || '',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    vehicleType: initialData?.vehicleType || '',
    vehicleId: initialData?.vehicleId || '',
    driverId: initialData?.driverId || '',
    value: initialData?.value || 0,
    freightType: initialData?.freightType || '',
    insuranceInfo: initialData?.insuranceInfo || '',
    description: initialData?.description || '',
    status: initialData?.status || 'pending',
    attachments: initialData?.attachments || [],
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const { availableDrivers, availableVehicles } = useMemo(() => {
    const selectedDate = formData.startDate;
    if (!selectedDate) {
      return {
        availableDrivers: users.filter(u => u.role === 'driver' && u.status === 'active'),
        availableVehicles: vehicles.filter(v => v.status === 'active') // Exclui 'maintenance' e 'inactive'
      };
    }

    const unavailableDriverIds = new Set<string>();
    const unavailableVehicleIds = new Set<string>();

    trips.forEach(trip => {
      if (initialData && trip.id === initialData.id) return;
      if (trip.startDate === selectedDate && ['pending', 'in_progress'].includes(trip.status)) {
        if (trip.driverId) unavailableDriverIds.add(trip.driverId);
        if (trip.vehicleId) unavailableVehicleIds.add(trip.vehicleId);
      }
    });

    const drivers = users.filter(u => u.role === 'driver' && u.status === 'active' && !unavailableDriverIds.has(u.id));
    const vehiclesList = vehicles.filter(v => v.status === 'active' && !unavailableVehicleIds.has(v.id)); // Exclui 'maintenance' e 'inactive'

    return { availableDrivers: drivers, availableVehicles: vehiclesList };
  }, [formData.startDate, trips, users, vehicles, initialData]);

  useEffect(() => {
    if (formData.driverId && !availableDrivers.some(d => d.id === formData.driverId)) {
      setFormData(prev => ({ ...prev, driverId: '' }));
    }
    if (formData.vehicleId && !availableVehicles.some(v => v.id === formData.vehicleId)) {
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [availableDrivers, availableVehicles, formData.driverId, formData.vehicleId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setFormData(prev => ({ ...prev, value: 0 }));
      return;
    }
    const numberValue = Number(rawValue) / 100;
    setFormData(prev => ({ ...prev, value: numberValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.clientId || !formData.value) {
      alert('Por favor, preencha os campos obrigatórios (Data, Empresa e Valor).');
      return;
    }
    onSave(formData);
  };

  const getAvailableStatuses = (currentStatus?: Trip['status']): Trip['status'][] => {
    if (!currentStatus) return [];
    switch (currentStatus) {
      case 'pending':
        return ['pending', 'in_progress', 'cancelled'];
      case 'in_progress':
        return ['in_progress', 'completed', 'cancelled'];
      case 'completed':
        return ['completed', 'in_progress'];
      case 'cancelled':
        return ['cancelled', 'pending'];
      default:
        return [currentStatus];
    }
  };

  const availableStatuses = getAvailableStatuses(initialData?.status);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data do Serviço *</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Empresa *</label>
          <select name="clientId" value={formData.clientId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione a empresa</option>
            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">CT-e</label>
          <input type="text" name="cte" value={formData.cte} onChange={handleChange} placeholder="Número do CT-e" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">NF</label>
          <input type="text" name="nf" value={formData.nf} onChange={handleChange} placeholder="Número da NF" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Solicitante</label>
          <input type="text" name="requester" value={formData.requester} onChange={handleChange} placeholder="Nome do solicitante" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Cidade de Origem</label>
          <input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="Cidade de origem" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Cidade de Destino</label>
          <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Cidade de destino" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Tipo de Veículo</label>
          <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione o tipo</option>
            <option>MOTO</option>
            <option>CARRO</option>
            <option>VUC</option>
            <option>3/4</option>
            <option>TRUCK</option>
            <option>CARRETA</option>
            <option>CAM</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Veículo</label>
          <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione um veículo</option>
            {availableVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.model}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Motorista</label>
          <select name="driverId" value={formData.driverId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione um motorista</option>
            {availableDrivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Frete</label>
          <select name="freightType" value={formData.freightType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione o tipo</option>
            <option>CIF</option>
            <option>FOB</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Seguro</label>
          <input type="text" name="insuranceInfo" value={formData.insuranceInfo} onChange={handleChange} placeholder="Informações sobre o seguro" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Valor *</label>
          <input 
            type="text" 
            name="value"
            placeholder="R$ 0,00"
            value={formData.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.value) : ''}
            onChange={handleValueChange}
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" 
          />
        </div>
        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={availableStatuses.length <= 1}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text disabled:bg-gray-100 dark:disabled:bg-dark-border disabled:cursor-not-allowed"
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Descrição do Serviço</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" placeholder="Descrição detalhada do serviço" />
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Arquivos</label>
          <FileUpload 
            files={formData.attachments}
            onFilesChange={(newFiles) => setFormData(prev => ({...prev, attachments: newFiles}))}
          />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Serviço</Button>
      </div>
    </form>
  );
};

export default NewTripForm;
