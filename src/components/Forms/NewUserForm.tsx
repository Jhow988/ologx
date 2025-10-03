import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import Button from '../UI/Button';
import { Save } from 'lucide-react';

interface NewUserFormProps {
  initialData?: User | null;
  onSave: (user: Partial<User>) => void;
  onCancel: () => void;
}

const NewUserForm: React.FC<NewUserFormProps> = ({ initialData, onSave, onCancel }) => {
  const getInitialState = () => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'operator',
    cnhDueDate: initialData?.cnhDueDate || '',
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Por favor, preencha nome e email.');
      return;
    }
    if (formData.role === 'driver' && !formData.cnhDueDate) {
      alert('Por favor, preencha o vencimento da CNH para motoristas.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Nome Completo</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Perfil de Acesso</label>
        <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text">
          <option value="operator">Operador</option>
          <option value="driver">Motorista</option>
          <option value="manager">Gerente</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      {formData.role === 'driver' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Vencimento da CNH</label>
          <input type="date" name="cnhDueDate" value={formData.cnhDueDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
      )}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Usuário</Button>
      </div>
    </form>
  );
};

export default NewUserForm;
