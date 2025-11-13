import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface InviteUserFormProps {
  onInvite: (email: string, role: string, fullName: string, password: string, cnhDueDate?: string, cnhCategories?: string[]) => Promise<void>;
  onCancel: () => void;
}

interface CustomRole {
  id: string;
  name: string;
  description: string;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ onInvite, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    cnhDueDate: '',
    cnhCategories: [] as string[],
  });
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch custom roles
  useEffect(() => {
    fetchCustomRoles();
  }, [user?.companyId]);

  const fetchCustomRoles = async () => {
    if (!user?.companyId) {
      setLoadingRoles(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('id, name, description')
        .eq('company_id', user.companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching custom roles:', error);
      toast.error('Erro ao carregar perfis personalizados');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnhCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      cnhCategories: prev.cnhCategories.includes(category)
        ? prev.cnhCategories.filter(c => c !== category)
        : [...prev.cnhCategories, category]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.password) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    // Gerar email automaticamente baseado no nome
    const emailUsername = formData.fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '.') // Substitui espaços por pontos
      .replace(/[^a-z0-9.]/g, ''); // Remove caracteres especiais

    const generatedEmail = `${emailUsername}@ologx.local`;

    setLoading(true);
    try {
      await onInvite(
        generatedEmail,
        formData.role,
        formData.fullName,
        formData.password,
        formData.cnhDueDate || undefined,
        formData.cnhCategories.length > 0 ? formData.cnhCategories : undefined
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Senha *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Mínimo 6 caracteres"
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Confirmar Senha *
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Digite a senha novamente"
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Data de Vencimento da CNH
        </label>
        <input
          type="date"
          name="cnhDueDate"
          value={formData.cnhDueDate}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-secondary">
          Obrigatório para motoristas. O sistema alertará sobre vencimentos próximos.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
          Categorias da CNH
        </label>
        <div className="flex flex-wrap gap-3">
          {['A', 'B', 'C', 'D', 'E'].map((category) => (
            <label
              key={category}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.cnhCategories.includes(category)}
                onChange={() => handleCnhCategoryToggle(category)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
                {category}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-secondary">
          Selecione as categorias que o motorista pode operar.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Perfil de Acesso *
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={loadingRoles}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="admin">Administrador</option>
          {customRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-secondary">
          {customRoles.length > 0
            ? `${customRoles.length} perfil(is) personalizado(s) disponível(is). Gerencie em Configurações &gt; Perfis e Permissões.`
            : 'Crie perfis personalizados em Configurações &gt; Perfis e Permissões para outras necessidades.'
          }
        </p>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" icon={UserPlus} disabled={loading}>
          {loading ? 'Criando usuário...' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  );
};

export default InviteUserForm;
