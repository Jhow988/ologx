import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { permissionsMap } from '../../config/permissions';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const PerfilForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const permissionGroups = Object.keys(permissionsMap) as (keyof typeof permissionsMap)[];
  const allPermissions = permissionGroups.flatMap(group =>
    Object.keys(permissionsMap[group].permissions)
  );

  useEffect(() => {
    if (id) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    if (!id || !user?.companyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('id', id)
        .eq('company_id', user.companyId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          description: data.description || '',
          permissions: data.permissions || [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching role:', error);
      toast.error(`Erro ao carregar perfil: ${error.message}`);
      navigate('/configuracoes/perfis');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const toggleAllInGroup = (groupKey: keyof typeof permissionsMap) => {
    const groupPermissions = Object.keys(permissionsMap[groupKey].permissions);
    const allSelected = groupPermissions.every(p => formData.permissions.includes(p));

    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !groupPermissions.includes(p))
        : [...new Set([...prev.permissions, ...groupPermissions])],
    }));
  };

  const handleSave = async () => {
    if (!user?.companyId) return;

    if (!formData.name.trim()) {
      toast.error('Por favor, informe o nome do perfil');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        // Update existing role
        const { error } = await supabase
          .from('custom_roles')
          .update({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Perfil atualizado com sucesso!');
      } else {
        // Create new role
        const { error } = await supabase.from('custom_roles').insert({
          company_id: user.companyId,
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          is_custom: true,
        });

        if (error) throw error;
        toast.success('Perfil criado com sucesso!');
      }

      navigate('/configuracoes/perfis');
    } catch (error: any) {
      console.error('Error saving custom role:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-dark-text-secondary">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/configuracoes/perfis')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-dark-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {id ? 'Editar Perfil' : 'Criar Perfil Personalizado'}
            </h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              {id ? 'Modifique as permissões do perfil' : 'Defina um novo perfil de acesso com permissões personalizadas'}
            </p>
          </div>
        </div>
        <Button variant="primary" icon={Save} onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
            Informações Básicas
          </h2>
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Nome do Perfil *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text"
                placeholder="Ex: Supervisor de Operações"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text resize-none"
                placeholder="Descreva as responsabilidades deste perfil"
                rows={6}
              />
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Permissões Selecionadas:</strong>
                <br />
                {formData.permissions.length} de {allPermissions.length} permissões
              </p>
            </div>
          </div>
        </Card>

        {/* Right Column - Permissions */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
            Permissões *
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionGroups.map(groupKey => {
              const groupPermissions = Object.keys(permissionsMap[groupKey].permissions);
              const selectedCount = groupPermissions.filter(p => formData.permissions.includes(p)).length;
              const allSelected = selectedCount === groupPermissions.length;
              const someSelected = selectedCount > 0 && selectedCount < groupPermissions.length;

              return (
                <div
                  key={groupKey}
                  className="border border-gray-200 dark:border-dark-border rounded-lg p-4 bg-gray-50 dark:bg-dark-bg"
                >
                  {/* Group Header */}
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-300 dark:border-dark-border mb-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={input => {
                        if (input) {
                          input.indeterminate = someSelected;
                        }
                      }}
                      onChange={() => toggleAllInGroup(groupKey)}
                      className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent cursor-pointer"
                    />
                    <span className="font-semibold text-gray-900 dark:text-dark-text text-sm flex-1">
                      {permissionsMap[groupKey].label}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-dark-text-secondary bg-white dark:bg-dark-bg-secondary px-2 py-1 rounded">
                      {selectedCount}/{groupPermissions.length}
                    </span>
                  </div>

                  {/* Individual Permissions */}
                  <div className="space-y-2">
                    {groupPermissions.map(permissionKey => (
                      <label
                        key={permissionKey}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-dark-text-secondary cursor-pointer hover:text-gray-900 dark:hover:text-dark-text p-2 rounded hover:bg-white dark:hover:bg-dark-bg-secondary transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permissionKey)}
                          onChange={() => handlePermissionToggle(permissionKey)}
                          className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent cursor-pointer flex-shrink-0 mt-0.5"
                        />
                        <span className="text-sm leading-tight">
                          {permissionsMap[groupKey].permissions[permissionKey as keyof typeof permissionsMap[typeof groupKey]['permissions']]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerfilForm;
