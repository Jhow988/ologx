import React, { useState, useEffect } from 'react';
import { FinancialRecord, Trip, FinancialCategory, FinancialSubcategory } from '../../types';
import Button from '../UI/Button';
import { Save } from 'lucide-react';

interface NewFinancialRecordFormProps {
  initialData?: FinancialRecord | null;
  trips: Trip[];
  categories: FinancialCategory[];
  subcategories: FinancialSubcategory[];
  onSave: (record: Partial<FinancialRecord> & { installments?: number }) => void;
  onCancel: () => void;
}

const NewFinancialRecordForm: React.FC<NewFinancialRecordFormProps> = ({ initialData, trips, categories, subcategories, onSave, onCancel }) => {
  const getInitialState = () => ({
    type: initialData?.type || 'receivable',
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    due_date: initialData?.due_date || new Date().toISOString().split('T')[0],
    category_id: initialData?.category_id || '',
    subcategory_id: initialData?.subcategory_id || '',
    recurrence: initialData?.recurrence || 'unique',
    status: initialData?.status || 'pending',
    related_trip_id: initialData?.related_trip_id || '',
  });

  const [formData, setFormData] = useState(getInitialState());
  const [installments, setInstallments] = useState(12);

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'category_id') {
      setFormData(prev => ({ ...prev, category_id: value, subcategory_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setFormData(prev => ({ ...prev, amount: 0 }));
      return;
    }
    const numberValue = Number(rawValue) / 100;
    setFormData(prev => ({ ...prev, amount: numberValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0 || !formData.category_id) {
      alert('Por favor, preencha a descrição, um valor maior que zero e a categoria.');
      return;
    }
    onSave({
      ...formData,
      installments: formData.recurrence === 'installment' ? installments : 1,
    });
  };
  
  const availableSubcategories = subcategories.filter(sc => sc.category_id === formData.category_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Tipo de Lançamento</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="receivable">A Receber</option>
            <option value="payable">A Pagar</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Descrição</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Valor (R$)</label>
          <input
            type="text"
            name="amount"
            placeholder="R$ 0,00"
            value={formData.amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.amount) : ''}
            onChange={handleValueChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Data de Vencimento</label>
          <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Categoria</label>
          <select name="category_id" value={formData.category_id} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Selecione uma categoria</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Subcategoria</label>
          <select name="subcategory_id" value={formData.subcategory_id} onChange={handleChange} disabled={!formData.category_id || availableSubcategories.length === 0} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text disabled:bg-gray-100 dark:disabled:bg-dark-border">
            <option value="">{availableSubcategories.length > 0 ? 'Selecione uma subcategoria' : 'Nenhuma'}</option>
            {availableSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Recorrência</label>
          <select name="recurrence" value={formData.recurrence} onChange={handleChange} disabled={!!initialData} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text disabled:bg-gray-100 dark:disabled:bg-dark-border">
            <option value="unique">Única</option>
            <option value="installment">Parcelado</option>
            <option value="recurring">Recorrente</option>
          </select>
        </div>
        
        {formData.recurrence === 'installment' && !initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Número de Parcelas</label>
            <input
              type="number"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              min="2"
              max="60"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
            />
          </div>
        )}

        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Vincular à Viagem (Opcional)</label>
          <select name="related_trip_id" value={formData.related_trip_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
            <option value="">Nenhuma</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.origin} → {trip.destination} ({trip.start_date})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Lançamento</Button>
      </div>
    </form>
  );
};

export default NewFinancialRecordForm;
