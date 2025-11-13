import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Client, Vehicle, User } from '../../types';
import Button from '../UI/Button';
import FileUpload from '../UI/FileUpload';
import { Save, MapPin } from 'lucide-react';
import { calculateDistance } from '../../lib/distanceCalculator';
import toast from 'react-hot-toast';

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
    case 'scheduled': return 'Agendado';
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
    freight_value: initialData?.freight_value || 0,
    freightType: initialData?.freightType || '',
    insuranceInfo: initialData?.insuranceInfo || '',
    description: initialData?.description || '',
    status: initialData?.status || 'scheduled',
    attachments: initialData?.attachments || [],
    distance: initialData?.distance || 0,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  useEffect(() => {
    setFormData({
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
      freight_value: initialData?.freight_value || 0,
      freightType: initialData?.freightType || '',
      insuranceInfo: initialData?.insuranceInfo || '',
      description: initialData?.description || '',
      status: initialData?.status || 'scheduled',
      attachments: initialData?.attachments || [],
      distance: initialData?.distance || 0,
    });
  }, [initialData]);

  // Calcular distância automaticamente quando origem e destino mudarem
  useEffect(() => {
    const fetchDistance = async () => {
      if (formData.origin && formData.destination && formData.origin !== formData.destination) {
        setCalculatingDistance(true);
        const distance = await calculateDistance(formData.origin, formData.destination);

        if (distance !== null) {
          setFormData(prev => ({ ...prev, distance }));
          toast.success(`Distância calculada: ${distance} km`);
        } else {
          toast.error('Não foi possível calcular a distância automaticamente');
        }
        setCalculatingDistance(false);
      }
    };

    // Debounce para evitar muitas chamadas
    const timer = setTimeout(fetchDistance, 1000);
    return () => clearTimeout(timer);
  }, [formData.origin, formData.destination]);

  const { availableDrivers, availableVehicles } = useMemo(() => {
    const selectedDate = formData.startDate;
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

    if (!selectedDate) {
      return {
        availableDrivers: users.filter(u => u.role === 'driver' && u.status === 'active'),
        availableVehicles: vehicles.filter(v => ['active', 'available'].includes(v.status)) // Aceita 'active' ou 'available'
      };
    }

    const unavailableDriverIds = new Set<string>();
    const unavailableVehicleIds = new Set<string>();

    trips.forEach(trip => {
      if (initialData && trip.id === initialData.id) return;
      if (trip.startDate === selectedDate && ['scheduled', 'in_progress'].includes(trip.status)) {
        if (trip.driverId) unavailableDriverIds.add(trip.driverId);
        if (trip.vehicleId) unavailableVehicleIds.add(trip.vehicleId);
      }
    });

    let drivers = users.filter(u => u.role === 'driver' && u.status === 'active' && !unavailableDriverIds.has(u.id));

    // Filtrar motoristas pela categoria CNH necessária do veículo
    if (selectedVehicle?.required_cnh_category) {
      drivers = drivers.filter(driver => {
        // Se o motorista não tem categorias CNH, não pode dirigir
        if (!driver.cnhCategories || driver.cnhCategories.length === 0) return false;
        // Verificar se o motorista tem a categoria necessária
        return driver.cnhCategories.includes(selectedVehicle.required_cnh_category);
      });
    }

    const vehiclesList = vehicles.filter(v => ['active', 'available'].includes(v.status) && !unavailableVehicleIds.has(v.id)); // Aceita 'active' ou 'available'

    return { availableDrivers: drivers, availableVehicles: vehiclesList };
  }, [formData.startDate, formData.vehicleId, trips, users, vehicles, initialData]);

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
      setFormData(prev => ({ ...prev, freight_value: 0 }));
      return;
    }
    const numberValue = Number(rawValue) / 100;
    setFormData(prev => ({ ...prev, freight_value: numberValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.clientId || !formData.freight_value || !formData.origin || !formData.destination) {
      alert('Por favor, preencha os campos obrigatórios (Data, Empresa, Valor, Origem e Destino).');
      return;
    }
    onSave(formData);
  };

  const getAvailableStatuses = (currentStatus?: Trip['status']): Trip['status'][] => {
    if (!currentStatus) return [];
    switch (currentStatus) {
      case 'scheduled':
        return ['scheduled', 'in_progress', 'cancelled'];
      case 'in_progress':
        return ['in_progress', 'completed', 'cancelled'];
      case 'completed':
        return ['completed', 'in_progress'];
      case 'cancelled':
        return ['cancelled', 'scheduled'];
      default:
        return [currentStatus];
    }
  };

  const availableStatuses = getAvailableStatuses(initialData?.status);

  return (
    <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* COLUNA ESQUERDA */}
        <div className="space-y-3">
          {/* Seção 1: Informações Básicas */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              📋 Informações Básicas
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Data *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Empresa *</label>
                <select name="clientId" value={formData.clientId} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
                  <option value="">Selecione</option>
                  {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">CT-e</label>
                <input type="text" name="cte" value={formData.cte} onChange={handleChange} placeholder="Número do CT-e" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">NF</label>
                <input type="text" name="nf" value={formData.nf} onChange={handleChange} placeholder="Número da NF" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA CENTRAL */}
        <div className="space-y-3">
          {/* Seção 2: Rota */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              🗺️ Rota
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Solicitante</label>
                <input type="text" name="requester" value={formData.requester} onChange={handleChange} placeholder="Nome do solicitante" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Origem *</label>
                <input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="Cidade de origem" required className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Destino *</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Cidade de destino" required className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Distância</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={calculatingDistance ? 'Calculando...' : formData.distance ? `${formData.distance} km` : '0 km'}
                    disabled
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-border text-gray-900 dark:text-dark-text cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Veículos e Transporte */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              🚛 Veículos
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Tipo de Veículo</label>
                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
                  <option value="">Selecione</option>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Veículo *</label>
                <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
                  <option value="">Selecione</option>
                  {availableVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Motorista *</label>
                <select name="driverId" value={formData.driverId} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
                  <option value="">Selecione</option>
                  {availableDrivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
                {formData.vehicleId && vehicles.find(v => v.id === formData.vehicleId)?.required_cnh_category && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    ⚠️ Este veículo requer CNH categoria {vehicles.find(v => v.id === formData.vehicleId)?.required_cnh_category}. Apenas motoristas com esta categoria estão listados.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-3">
          {/* Seção 4: Financeiro */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              💰 Financeiro
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Valor *</label>
                <input
                  type="text"
                  name="freight_value"
                  placeholder="R$ 0,00"
                  value={formData.freight_value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.freight_value) : ''}
                  onChange={handleValueChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Tipo de Frete</label>
                <select name="freightType" value={formData.freightType} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
                  <option value="">Selecione</option>
                  <option>CIF</option>
                  <option>FOB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Seguro</label>
                <input type="text" name="insuranceInfo" value={formData.insuranceInfo} onChange={handleChange} placeholder="Informações do seguro" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
              </div>
              {initialData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={availableStatuses.length <= 1}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text disabled:bg-gray-100 dark:disabled:bg-dark-border disabled:cursor-not-allowed"
                  >
                    {availableStatuses.map(status => (
                      <option key={status} value={status}>
                        {getStatusText(status)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Seção 5: Observações */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              📝 Observações
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">Descrição</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text resize-none" placeholder="Descrição detalhada do serviço" />
            </div>
          </div>

          {/* Seção 6: Arquivos */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              📎 Arquivos
            </h3>
            <FileUpload
              files={formData.attachments}
              onFilesChange={(newFiles) => setFormData(prev => ({...prev, attachments: newFiles}))}
              uploadToSupabase={true}
              folder="trips"
              maxSizeMB={50}
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-200 dark:border-dark-border">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Serviço</Button>
      </div>
    </form>
  );
};

export default NewTripForm;
