import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Search, UserCheck, UserX, Loader, Mail } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import NewUserForm from '../../components/Forms/NewUserForm';
import InviteUserForm from '../../components/Forms/InviteUserForm';
import { User as UserType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, supabaseAdmin } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface CustomRole {
  id: string;
  name: string;
}

const Usuarios: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | 'toggle-status' | null;
    user: UserType | null;
  }>({ type: null, user: null });

  const fetchUsers = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);

    try {
      // Buscar custom roles primeiro
      const { data: rolesData } = await (supabase as any)
        .from('custom_roles')
        .select('id, name')
        .eq('company_id', user.companyId);

      setCustomRoles(rolesData || []);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', user.companyId)
        .eq('is_super_admin', false); // Garantir que super admins nunca apareçam

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } else {
        const formattedUsers = data.map(p => ({
          id: p.id,
          companyId: p.company_id,
          name: p.full_name || 'N/A',
          email: (p as any).email || 'N/A',
          role: p.role as UserType['role'],
          status: ((p as any).status || 'active') as UserType['status'],
          cnhDueDate: p.cnh_due_date || undefined,
          cnhCategories: (p as any).cnh_categories || undefined,
          isSuperAdmin: p.is_super_admin,
        }));

        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const handleInviteUser = async (email: string, role: string, fullName: string, password: string, cnhDueDate?: string, cnhCategories?: string[]) => {
    if (!user?.companyId) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    if (!supabaseAdmin) {
      console.error('supabaseAdmin é null - Service Role Key não configurada');
      toast.error('Service Role Key não configurada. Configure VITE_SUPABASE_SERVICE_ROLE_KEY no arquivo .env e reinicie o servidor.');
      return;
    }

    try {
      // Primeiro, verificar se o usuário já existe
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('Erro ao listar usuários:', listError);
      } else {
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
          console.log('Usuário já existe:', existingUser.id);

          // Verificar se o usuário confirmou o email
          if (!existingUser.email_confirmed_at) {
            console.log('Usuário não confirmou email, deletando para reenviar...');

            // Deletar usuário não confirmado
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);

            if (deleteError) {
              console.error('Erro ao deletar usuário:', deleteError);
            } else {
              console.log('Usuário deletado com sucesso');
              // Aguardar um pouco para garantir que foi deletado
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            toast.error('Este email já está cadastrado e ativo no sistema.');
            return;
          }
        }
      }

      // Criar usuário com a senha fornecida
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true // Confirmar email automaticamente
        // NÃO passar user_metadata aqui para evitar trigger
      });

      if (createError) {
        console.error('Error creating user:', createError);
        toast.error('Erro ao criar usuário: ' + createError.message);
        return;
      }

      console.log('Usuário criado:', createData.user?.id);

      // Aguardar um pouco para o trigger criar o profile (se existir)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar/criar profile usando upsert (evita conflito se trigger já criou)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: createData.user!.id,
          company_id: user.companyId,
          full_name: fullName,
          role: role,
          is_super_admin: false,
          status: 'active', // Usuário criado diretamente, já está ativo
          cnh_due_date: cnhDueDate || null,
          cnh_categories: cnhCategories || []
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Erro ao criar/atualizar profile:', profileError);
        // Deletar usuário criado se falhar ao criar profile
        await supabaseAdmin.auth.admin.deleteUser(createData.user!.id);
        toast.error('Erro ao criar perfil do usuário: ' + profileError.message);
        return;
      }

      console.log('Profile criado/atualizado com sucesso');

      // Usuário criado com sucesso, status é ativo
      toast.success(
        `Usuário ${fullName} criado com sucesso!`,
        { duration: 4000 }
      );

      // Wait a bit before refreshing to ensure DB is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUsers();
      closeModal();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário: ' + error.message);
    }
  };

  const handleSaveUser = async (userData: Partial<UserType>) => {
    if (!user?.companyId) return;
    if (modalState.type === 'edit' && modalState.user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.name,
          role: userData.role,
          cnh_due_date: userData.role === 'driver' ? userData.cnhDueDate : null,
        })
        .eq('id', modalState.user.id);

      if (error) {
        console.error("Error updating user:", error);
        toast.error('Erro ao atualizar usuário');
      } else {
        toast.success('Usuário atualizado com sucesso!');
      }
    }
    await fetchUsers();
    closeModal();
  };
  
  const handleResendInvite = async (userToResend: UserType) => {
    if (!user?.companyId) return;

    try {
      // Buscar dados completos do usuário do Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToResend.id)
        .single();

      if (!profileData) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Enviar email de reset de senha
      const appUrl = (import.meta as any).env?.VITE_APP_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        userToResend.email,
        {
          redirectTo: `${appUrl}/reset-password`
        }
      );

      if (resetError) {
        console.error('Erro ao reenviar convite:', resetError);
        toast.error('Erro ao reenviar convite: ' + resetError.message);
        return;
      }

      toast.success(`Convite reenviado para ${userToResend.email}!`);
    } catch (error: any) {
      console.error('Erro ao reenviar convite:', error);
      toast.error('Erro ao reenviar convite: ' + error.message);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!modalState.user || !user?.companyId) return;

    if (!supabaseAdmin) {
      toast.error('Service Role Key não configurada. Não é possível alterar status de usuários.');
      closeModal();
      return;
    }

    const userToToggle = modalState.user;
    const newStatus = userToToggle.status === 'active' ? 'inactive' : 'active';

    try {
      // 1. Atualizar status no perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userToToggle.id);

      if (profileError) {
        console.error('Erro ao atualizar status no perfil:', profileError);
        toast.error('Erro ao atualizar status do usuário');
        return;
      }

      // 2. Atualizar status no Supabase Auth
      if (newStatus === 'inactive') {
        // Desativar usuário no auth (ban)
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
          userToToggle.id,
          { ban_duration: 'none' } // Usar ban permanente
        );

        if (banError) {
          console.error('Erro ao desativar usuário no auth:', banError);
          // Reverter mudança no perfil
          await supabase
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', userToToggle.id);
          toast.error('Erro ao desativar acesso do usuário');
          return;
        }
      } else {
        // Reativar usuário no auth (unban)
        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
          userToToggle.id,
          { ban_duration: '0s' } // Remover ban
        );

        if (unbanError) {
          console.error('Erro ao reativar usuário no auth:', unbanError);
          // Reverter mudança no perfil
          await supabase
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', userToToggle.id);
          toast.error('Erro ao reativar acesso do usuário');
          return;
        }
      }

      toast.success(
        `Usuário ${userToToggle.name} ${newStatus === 'active' ? 'reativado' : 'desativado'} com sucesso!`
      );

      await fetchUsers();
      closeModal();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário: ' + error.message);
    }
  };

  const closeModal = () => {
    setModalState({ type: null, user: null });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all'
      ? true
      : u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'driver': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'operator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: {
        // Custom roles usam cor laranja/accent
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      }
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'driver': return 'Motorista';
      case 'operator': return 'Operador';
      default: {
        // Se for UUID, buscar o nome do custom role
        const customRole = customRoles.find(r => r.id === role);
        return customRole ? customRole.name : role;
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Convite Pendente';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Perfil',
      render: (role: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)}`}>
          {getRoleText(role)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      ),
    },
    { key: 'cnhDueDate', header: 'Venc. CNH', render: (date?: string) => date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A' },
    {
      key: 'cnhCategories',
      header: 'Categorias CNH',
      render: (categories?: string[]) => {
        if (!categories || categories.length === 0) return 'N/A';
        return (
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
              >
                {cat}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, u: UserType) => (
        <div className="flex gap-1">
          {u.status === 'pending' ? (
            <Button
              variant="ghost"
              size="sm"
              icon={Mail}
              onClick={() => handleResendInvite(u)}
              title="Reenviar Convite"
              className="text-blue-500 hover:bg-blue-100"
            />
          ) : (
            <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setModalState({ type: 'edit', user: u })} />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={u.status === 'active' ? UserX : UserCheck}
            onClick={() => setModalState({ type: 'toggle-status', user: u })}
            title={u.status === 'active' ? 'Desativar' : 'Reativar'}
            className={u.status === 'active' ? 'text-red-500 hover:bg-red-100' : 'text-green-500 hover:bg-green-100'}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão de Usuários</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie usuários e suas permissões no sistema</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalState({ type: 'new', user: null })}>
            Novo Usuário
          </Button>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                <option value="active">Apenas Ativos</option>
                <option value="inactive">Apenas Inativos</option>
                <option value="all">Todos os Usuários</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table columns={columns} data={filteredUsers} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalState.type === 'new'}
        onClose={closeModal}
        title="Criar Novo Usuário"
      >
        <InviteUserForm onInvite={handleInviteUser} onCancel={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === 'edit'}
        onClose={closeModal}
        title="Editar Usuário"
      >
        <NewUserForm initialData={modalState.user} onSave={handleSaveUser} onCancel={closeModal} />
      </Modal>

      {modalState.user && (
        <Modal
          isOpen={modalState.type === 'toggle-status'}
          onClose={closeModal}
          title={`Confirmar ${modalState.user.status === 'active' ? 'Desativação' : 'Reativação'}`}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-dark-text">
              {modalState.user.status === 'active' ? (
                <>
                  Tem certeza que deseja <strong className="text-red-600">desativar</strong> o usuário <strong>{modalState.user.name}</strong>?
                  <br /><br />
                  O usuário não poderá mais fazer login no sistema até que seja reativado.
                </>
              ) : (
                <>
                  Tem certeza que deseja <strong className="text-green-600">reativar</strong> o usuário <strong>{modalState.user.name}</strong>?
                  <br /><br />
                  O usuário poderá fazer login no sistema novamente.
                </>
              )}
            </p>
          </div>
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button
              variant={modalState.user.status === 'active' ? 'warning' : 'primary'}
              onClick={handleToggleStatusConfirm}
              className={modalState.user.status === 'active' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {modalState.user.status === 'active' ? 'Desativar' : 'Reativar'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Usuarios;
