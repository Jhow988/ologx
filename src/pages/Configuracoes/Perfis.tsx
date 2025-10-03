import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Plus, Edit2, Trash2, Loader } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { roles, permissionsMap } from '../../config/permissions';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  company_id: string;
  is_custom: boolean;
  created_at: string;
}

interface RoleDisplay {
  key: string;
  name: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
  id?: string;
}

const Perfis: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  const permissionGroups = Object.keys(permissionsMap) as (keyof typeof permissionsMap)[];

  // Fetch custom roles
  useEffect(() => {
    fetchCustomRoles();
  }, [user?.companyId]);

  const fetchCustomRoles = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching custom roles:', error);
      toast.error(`Erro ao carregar perfis personalizados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Combine default roles with custom roles
  const allRoles: RoleDisplay[] = [
    ...Object.entries(roles).map(([key, role]) => ({
      key,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isCustom: false,
    })),
    ...customRoles.map(role => ({
      key: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isCustom: true,
      id: role.id,
    })),
  ];

  const handleDelete = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase.from('custom_roles').delete().eq('id', roleId);

      if (error) throw error;
      toast.success('Perfil excluído com sucesso!');
      await fetchCustomRoles();
    } catch (error: any) {
      console.error('Error deleting custom role:', error);
      toast.error(`Erro ao excluir: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-dark-text-secondary">Carregando perfis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Perfis e Permissões</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Gerencie perfis de acesso e suas permissões no sistema
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/configuracoes/perfis/novo')}
        >
          Criar Perfil Personalizado
        </Button>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Perfis Padrão</strong> (Administrador, Gerente, Operador, Motorista) não podem ser editados.
          Crie <strong>Perfis Personalizados</strong> para definir permissões customizadas.
        </p>
      </div>

      {/* Permissions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead className="bg-gray-50 dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                  Permissão
                </th>
                {allRoles.map(role => (
                  <th
                    key={role.key}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-4 w-4 mb-1" />
                      <span>{role.name}</span>
                      {role.isCustom && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">
                          Personalizado
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
              {permissionGroups.map(groupKey => (
                <React.Fragment key={groupKey}>
                  <tr className="bg-gray-50 dark:bg-dark-bg">
                    <td colSpan={allRoles.length + 1} className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      {permissionsMap[groupKey].label}
                    </td>
                  </tr>
                  {Object.keys(permissionsMap[groupKey].permissions).map(permissionKey => (
                    <tr key={permissionKey} className="hover:bg-gray-50 dark:hover:bg-dark-bg">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-dark-text">
                        {permissionsMap[groupKey].permissions[permissionKey as keyof typeof permissionsMap[typeof groupKey]['permissions']]}
                      </td>
                      {allRoles.map(role => (
                        <td key={`${role.key}-${permissionKey}`} className="px-6 py-4 text-center">
                          {role.permissions.includes(permissionKey) && (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Custom Roles Management */}
      {customRoles.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
            Perfis Personalizados
          </h2>
          <div className="space-y-3">
            {customRoles.map(role => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-dark-text">{role.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">
                      {role.permissions.length} permissões
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {role.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => navigate(`/configuracoes/perfis/${role.id}`)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(role.id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Perfis;
