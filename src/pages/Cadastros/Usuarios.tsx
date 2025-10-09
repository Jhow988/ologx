import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Search, UserCheck, UserX, Loader } from 'lucide-react';
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

const Usuarios: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | 'toggle-status' | null;
    user: UserType | null;
  }>({ type: null, user: null });

  const fetchUsers = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);

    try {
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
          cnhDueDate: p.cnh_due_date,
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


  const handleInviteUser = async (email: string, role: string, fullName: string) => {
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

      // Usar inviteUserByEmail para criar um link que não expira tão rapidamente
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            role: role,
            company_id: user.companyId,
            is_super_admin: false,
          },
          redirectTo: `${appUrl}/reset-password`,
        }
      );

      if (authError) {
        console.error('Error creating user:', authError);
        toast.error('Erro ao criar usuário: ' + authError.message);
        return;
      }

      // Profile will be created automatically by trigger
      // Just show success message
      toast.success(
        `Convite enviado com sucesso! Um email foi enviado para ${email}`,
        { duration: 6000 }
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
  
  const handleToggleStatusConfirm = () => {
    // This would require more complex logic, e.g., disabling a user in Supabase Auth
    // For now, it's a placeholder.
    closeModal();
  };

  const closeModal = () => {
    setModalState({ type: null, user: null });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'driver': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'operator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'driver': return 'Motorista';
      case 'operator': return 'Operador';
      default: return role;
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
      key: 'actions',
      header: 'Ações',
      render: (_: any, u: UserType) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setModalState({ type: 'edit', user: u })} />
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
            Convidar Usuário
          </Button>
        </div>

        <Card>
          <div className="flex-1 relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg"
            />
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
        title="Convidar Novo Usuário"
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
          <p>A funcionalidade de ativar/desativar usuários deve ser configurada no Supabase.</p>
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" onClick={handleToggleStatusConfirm}>Confirmar</Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Usuarios;
