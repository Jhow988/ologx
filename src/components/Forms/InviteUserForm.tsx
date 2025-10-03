import React, { useState } from 'react';
import Button from '../UI/Button';
import { UserPlus } from 'lucide-react';

interface InviteUserFormProps {
  onInvite: (email: string, role: string, fullName: string) => Promise<void>;
  onCancel: () => void;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ onInvite, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'operator' as 'admin' | 'manager' | 'operator' | 'driver',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.fullName) {
      alert('Por favor, preencha o email e o nome completo.');
      return;
    }

    setLoading(true);
    try {
      await onInvite(formData.email, formData.role, formData.fullName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="usuario@exemplo.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Nome Completo *
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Nome completo do usuário"
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Perfil de Acesso *
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
        >
          <option value="operator">Operador</option>
          <option value="driver">Motorista</option>
          <option value="manager">Gerente</option>
          <option value="admin">Administrador</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-secondary">
          O usuário receberá um email com instruções para criar sua senha.
        </p>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" icon={UserPlus} disabled={loading}>
          {loading ? 'Enviando convite...' : 'Convidar Usuário'}
        </Button>
      </div>
    </form>
  );
};

export default InviteUserForm;
