import React, { useState, useEffect } from 'react';
import { Maintenance, Vehicle } from '../../types';
import Button from '../UI/Button';
import { Save } from 'lucide-react';

interface NewMaintenanceFormProps {
  initialData?: Maintenance | null;
  vehicles: Vehicle[];
  onSave: (maintenance: Partial<Maintenance>) => void;
  onCancel: () => void;
}

const NewMaintenanceForm: React.FC<NewMaintenanceFormProps> = ({ initialData, vehicles, onSave, onCancel }) => {
  const getInitialState = () => {
    // Convert timestamp to date format (YYYY-MM-DD) for date inputs
    const formatDateForInput = (dateString?: string | null) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    return {
      vehicleId: initialData?.vehicleId || '',
      title: initialData?.title || '',
      startDate: formatDateForInput(initialData?.startDate) || new Date().toISOString().split('T')[0],
      endDate: formatDateForInput(initialData?.endDate),
      description: initialData?.description || '',
      cost: initialData?.cost || 0,
      status: initialData?.status || 'scheduled',
      type: initialData?.type || 'preventive',
      nextMaintenanceReminder: formatDateForInput(initialData?.nextMaintenanceReminder),
    };
  };

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // For date inputs, if the value is empty, store empty string (will be converted to null later)
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setFormData(prev => ({ ...prev, cost: 0 }));
      return;
    }
    const numberValue = Number(rawValue) / 100;
    setFormData(prev => ({ ...prev, cost: numberValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.title || !formData.description) {
      alert('Por favor, selecione um veículo, adicione um título e uma descrição.');
      return;
    }

    // Convert empty strings to undefined so they become null in the database
    const cleanedData = {
      ...formData,
      cost: Number(formData.cost),
      endDate: formData.endDate || undefined,
      nextMaintenanceReminder: formData.nextMaintenanceReminder || undefined,
    };

    onSave(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Veículo</label>
          <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione um veículo</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id} disabled={v.status === 'maintenance' && v.id !== initialData?.vehicleId}>
                {v.plate} - {v.model} {v.status === 'maintenance' && v.id !== initialData?.vehicleId ? '(Em Manutenção)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Título da Manutenção</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Tipo de Manutenção</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="preventive">Preventiva</option>
            <option value="corrective">Corretiva</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="scheduled">Agendada</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data de Início</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data de Conclusão</label>
          <div className="relative">
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
            {formData.endDate && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, endDate: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Limpar data"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Custo (R$)</label>
          <input
            type="text"
            name="cost"
            placeholder="R$ 0,00"
            value={formData.cost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.cost) : ''}
            onChange={handleCostChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Lembrete da Próxima Manutenção (Opcional)</label>
          <div className="relative">
            <input type="date" name="nextMaintenanceReminder" value={formData.nextMaintenanceReminder} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
            {formData.nextMaintenanceReminder && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, nextMaintenanceReminder: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Limpar data"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Descrição do Serviço</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Manutenção</Button>
      </div>
    </form>
  );
};

export default NewMaintenanceForm;
