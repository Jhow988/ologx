import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';
import Button from '../UI/Button';
import MaskedInput from '../UI/MaskedInput';
import { Save } from 'lucide-react';

interface NewVehicleFormProps {
  initialData?: Vehicle | null;
  onSave: (vehicle: Partial<Vehicle>) => void;
  onCancel: () => void;
}

const NewVehicleForm: React.FC<NewVehicleFormProps> = ({ initialData, onSave, onCancel }) => {
  const getInitialState = () => ({
    plate: initialData?.plate || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    status: initialData?.status || 'available',
    licensing_due_date: initialData?.licensing_due_date || '',
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaskedChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.brand || !formData.model) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    onSave({
      ...formData,
      year: Number(formData.year),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <MaskedInput
            mask="plate"
            label="Placa *"
            value={formData.plate}
            onChange={(value) => handleMaskedChange('plate', value)}
            placeholder="ABC-1234"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Marca</label>
          <input type="text" name="brand" value={formData.brand} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Modelo</label>
          <input type="text" name="model" value={formData.model} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Ano</label>
          <input type="number" name="year" value={formData.year} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="available">Disponível</option>
            <option value="in_use">Em Uso</option>
            <option value="maintenance">Manutenção</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Vencimento do Licenciamento</label>
          <input type="date" name="licensing_due_date" value={formData.licensing_due_date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Veículo</Button>
      </div>
    </form>
  );
};

export default NewVehicleForm;
