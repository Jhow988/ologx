import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import Select from 'react-select';
import { Trip, Client, Vehicle, User } from '../types';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import FileUpload from '../components/UI/FileUpload';
import MaskedInput from '../components/UI/MaskedInput';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../hooks/useTrips';
import { useClients } from '../hooks/useClients';
import { useVehicles } from '../hooks/useVehicles';
import { supabase } from '../lib/supabaseClient';
import { calculateDistance, calculateDistanceByCep } from '../lib/distanceCalculator';
import toast from 'react-hot-toast';

const NovoServico: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTrip } = useTrips();
  const { clients } = useClients();
  const { vehicles } = useVehicles('active');
  const [drivers, setDrivers] = useState<User[]>([]);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    startDate: new Date().toISOString().split('T')[0],
    cte: '',
    nf: '',
    requester: '',
    origin: '',
    destination: '',
    originCep: '',
    destinationCep: '',
    vehicleType: '',
    vehicleId: '',
    driverId: '',
    freight_value: 0,
    freightType: '',
    insuranceInfo: '',
    description: '',
    distance: 0,
    attachments: [] as any[],
  });

  // Debug: Log vehicles
  useEffect(() => {
    console.log('Vehicles from hook:', vehicles);
    console.log('Vehicles count:', vehicles.length);
  }, [vehicles]);

  // Preparar opções para o react-select
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: `${client.document} - ${client.name}`,
    searchLabel: `${client.document} ${client.name}`.toLowerCase()
  }));

  // Estilos personalizados para o react-select
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '42px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 50
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#3b82f6'
      }
    })
  };

  // Buscar motoristas
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!user?.companyId) return;

      // First, let's check ALL profiles to debug
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, status')
        .eq('company_id', user.companyId);

      console.log('ALL profiles:', allProfiles);
      console.log('Profiles with driver role:', allProfiles?.filter(p => p.role === 'driver'));

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, status')
        .eq('company_id', user.companyId)
        .eq('role', 'driver')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching drivers:', error);
      } else {
        console.log('Drivers fetched (role=driver AND status=active):', data);
        console.log('Drivers count:', data?.length || 0);
        const mappedDrivers = (data || []).map(d => ({
          id: d.id,
          name: d.full_name,
          role: d.role,
          status: d.status
        })) as User[];
        setDrivers(mappedDrivers);
      }
    };

    fetchDrivers();
  }, [user?.companyId]);

  // Buscar dados do CEP de origem
  useEffect(() => {
    const fetchOriginCep = async () => {
      const cleanCep = formData.originCep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              origin: `${data.city} - ${data.state}`
            }));
          } else {
            toast.error('CEP de origem não encontrado');
          }
        } catch (error) {
          console.error('Erro ao buscar CEP de origem:', error);
          toast.error('Erro ao buscar CEP de origem');
        }
      }
    };

    const timer = setTimeout(fetchOriginCep, 800);
    return () => clearTimeout(timer);
  }, [formData.originCep]);

  // Buscar dados do CEP de destino
  useEffect(() => {
    const fetchDestinationCep = async () => {
      const cleanCep = formData.destinationCep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              destination: `${data.city} - ${data.state}`
            }));
          } else {
            toast.error('CEP de destino não encontrado');
          }
        } catch (error) {
          console.error('Erro ao buscar CEP de destino:', error);
          toast.error('Erro ao buscar CEP de destino');
        }
      }
    };

    const timer = setTimeout(fetchDestinationCep, 800);
    return () => clearTimeout(timer);
  }, [formData.destinationCep]);

  // Calcular distância automaticamente por CEP
  useEffect(() => {
    const fetchDistance = async () => {
      if (formData.originCep && formData.destinationCep && formData.originCep !== formData.destinationCep) {
        const cleanOriginCep = formData.originCep.replace(/\D/g, '');
        const cleanDestCep = formData.destinationCep.replace(/\D/g, '');

        if (cleanOriginCep.length === 8 && cleanDestCep.length === 8) {
          setCalculatingDistance(true);
          const distance = await calculateDistanceByCep(formData.originCep, formData.destinationCep);

          if (distance !== null) {
            setFormData(prev => ({ ...prev, distance }));
            toast.success(`Distância calculada: ${distance} km`);
          } else {
            toast.error('Não foi possível calcular a distância');
          }
          setCalculatingDistance(false);
        }
      }
    };

    const timer = setTimeout(fetchDistance, 2000);
    return () => clearTimeout(timer);
  }, [formData.originCep, formData.destinationCep]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.clientId || !formData.freight_value || !formData.origin || !formData.destination) {
      toast.error('Por favor, preencha os campos obrigatórios (Data, Empresa, Valor, Origem e Destino).');
      return;
    }

    if (vehicles.length === 0) {
      toast.error('Não há veículos ativos disponíveis. Ative um veículo antes de criar um serviço.');
      return;
    }

    if (drivers.length === 0) {
      toast.error('Não há motoristas ativos disponíveis. Ative um motorista antes de criar um serviço.');
      return;
    }

    const attachmentsToSave = (formData.attachments || []).map(att => ({
      id: att.id,
      name: att.name,
      size: att.size,
      url: att.url,
      storagePath: att.storagePath
    }));

    const dataToSave = {
      client_id: formData.clientId,
      start_date: formData.startDate,
      cte: formData.cte || null,
      nf: formData.nf || null,
      requester: formData.requester || null,
      origin: formData.origin,
      destination: formData.destination,
      vehicle_type: formData.vehicleType || null,
      vehicle_id: formData.vehicleId,
      driver_id: formData.driverId,
      freight_value: formData.freight_value || 0,
      freight_type: formData.freightType || null,
      insurance_info: formData.insuranceInfo || null,
      description: formData.description || null,
      status: 'scheduled',
      distance: formData.distance || 0,
      attachments: attachmentsToSave,
    };

    await createTrip(dataToSave as any);
    toast.success('Serviço cadastrado com sucesso!');
    navigate('/servicos');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/viagens')}>
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Cadastrar Novo Serviço</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Preencha os dados do serviço</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA 1 - Informações Básicas */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              📋 Informações Básicas
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Data do Serviço *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Empresa *</label>
                <Select
                  options={clientOptions}
                  value={clientOptions.find(opt => opt.value === formData.clientId) || null}
                  onChange={(option) => setFormData(prev => ({ ...prev, clientId: option?.value || '' }))}
                  placeholder="Buscar por CNPJ ou nome..."
                  isClearable
                  isSearchable
                  styles={selectStyles}
                  noOptionsMessage={() => "Nenhuma empresa encontrada"}
                  filterOption={(option, inputValue) => {
                    return option.data.searchLabel.includes(inputValue.toLowerCase());
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">CT-e</label>
                <input
                  type="text"
                  name="cte"
                  value={formData.cte}
                  onChange={handleChange}
                  placeholder="Número do CT-e"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">NF</label>
                <input
                  type="text"
                  name="nf"
                  value={formData.nf}
                  onChange={handleChange}
                  placeholder="Número da NF"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>
          </Card>

          {/* COLUNA 2 - Rota e Veículos */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              🗺️ Rota e Transporte
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Solicitante</label>
                <input
                  type="text"
                  name="requester"
                  value={formData.requester}
                  onChange={handleChange}
                  placeholder="Nome do solicitante"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">CEP Origem *</label>
                  <MaskedInput
                    mask="cep"
                    value={formData.originCep}
                    onChange={(value) => setFormData(prev => ({ ...prev, originCep: value }))}
                    placeholder="00000-000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Cidade Origem</label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    disabled
                    placeholder="Preenchido automaticamente"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-border text-gray-900 dark:text-dark-text cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">CEP Destino *</label>
                  <MaskedInput
                    mask="cep"
                    value={formData.destinationCep}
                    onChange={(value) => setFormData(prev => ({ ...prev, destinationCep: value }))}
                    placeholder="00000-000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Cidade Destino</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    disabled
                    placeholder="Preenchido automaticamente"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-border text-gray-900 dark:text-dark-text cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Distância</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={calculatingDistance ? 'Calculando...' : formData.distance ? `${formData.distance} km` : '0 km'}
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-border text-gray-900 dark:text-dark-text cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculado automaticamente</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Tipo de Veículo</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                >
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
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Veículo *</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                  disabled={vehicles.length === 0}
                >
                  <option value="">{vehicles.length === 0 ? 'Nenhum veículo ativo disponível' : 'Selecione um veículo'}</option>
                  {vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.model}</option>)}
                </select>
                {vehicles.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Não há veículos ativos. Ative um veículo em Cadastros → Frota</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Motorista *</label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                  disabled={drivers.length === 0}
                >
                  <option value="">{drivers.length === 0 ? 'Nenhum motorista ativo disponível' : 'Selecione um motorista'}</option>
                  {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
                {drivers.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Não há motoristas ativos. Ative um motorista em Cadastros → Usuários</p>
                )}
              </div>
            </div>
          </Card>

          {/* COLUNA 3 - Financeiro e Extras */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              💰 Financeiro e Extras
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Valor do Frete *</label>
                <input
                  type="text"
                  name="freight_value"
                  placeholder="R$ 0,00"
                  value={formData.freight_value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.freight_value) : ''}
                  onChange={handleValueChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Frete</label>
                <select
                  name="freightType"
                  value={formData.freightType}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                >
                  <option value="">Selecione o tipo de frete</option>
                  <option>Frete Fracionado</option>
                  <option>Frete Integral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Seguro</label>
                <input
                  type="text"
                  name="insuranceInfo"
                  value={formData.insuranceInfo}
                  onChange={handleChange}
                  placeholder="Informações sobre o seguro"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Descrição do Serviço</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text resize-none"
                  placeholder="Descrição detalhada do serviço"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Arquivos</label>
                <FileUpload
                  files={formData.attachments}
                  onFilesChange={(newFiles) => setFormData(prev => ({ ...prev, attachments: newFiles }))}
                  uploadToSupabase={true}
                  folder="trips"
                  maxSizeMB={50}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/viagens')}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" icon={Save}>
            Salvar Serviço
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoServico;
