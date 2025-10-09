import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, supabaseAdmin } from '../../lib/supabaseClient';
import { Company } from '../../types';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import { Building, CheckCircle, XCircle, Plus, Loader, Save, Mail, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { consultarCNPJ, formatCNPJ, validateCNPJ, cleanCNPJ } from '../../lib/cnpjService';

const Empresas: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    cnpj: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      toast.error(`Erro ao carregar empresas: ${error.message}`);
    } else {
      const formattedData = data.map(c => ({
        ...c,
        document: 'N/A', // Placeholder
        createdAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
      }));
      setCompanies(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCNPJBlur = async () => {
    const cnpj = newCompanyData.cnpj;

    if (!cnpj || cnpj.length < 14) {
      return;
    }

    if (!validateCNPJ(cnpj)) {
      toast.error('CNPJ inválido');
      return;
    }

    setIsLoadingCNPJ(true);

    try {
      const data = await consultarCNPJ(cnpj);

      if (data) {
        setNewCompanyData({
          ...newCompanyData,
          cnpj: data.cnpj,
          name: data.razao_social,
          email: data.email || '',
          phone: data.telefone || '',
          address: [
            data.logradouro,
            data.numero,
            data.complemento,
            data.bairro,
            `${data.municipio} - ${data.uf}`,
            data.cep
          ].filter(Boolean).join(', ')
        });

        toast.success('Dados da empresa carregados com sucesso!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao consultar CNPJ');
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('companies')
      .update({ status: newStatus })
      .eq('id', company.id);

    if (error) {
      toast.error(`Erro ao alterar status: ${error.message}`);
    } else {
      toast.success(`Empresa ${company.name} foi ${newStatus === 'active' ? 'ativada' : 'desativada'}.`);
      await fetchCompanies();
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCompanyData.cnpj.trim()) {
      toast.error('CNPJ é obrigatório.');
      return;
    }

    if (!validateCNPJ(newCompanyData.cnpj)) {
      toast.error('CNPJ inválido.');
      return;
    }

    if (!newCompanyData.name.trim()) {
      toast.error('Nome da empresa é obrigatório.');
      return;
    }

    setIsSaving(true);

    try {
      // Criar apenas a empresa, sem enviar email
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          cnpj: cleanCNPJ(newCompanyData.cnpj),
          name: newCompanyData.name,
          email: newCompanyData.email || null,
          phone: newCompanyData.phone || null,
          address: newCompanyData.address || null,
          status: 'active'
        }])
        .select()
        .single();

      if (companyError) {
        if (companyError.code === '23505') {
          throw new Error('CNPJ já cadastrado no sistema.');
        }
        throw companyError;
      }

      toast.success(
        `Empresa "${newCompanyData.name}" cadastrada com sucesso! Use "Convidar Admin" para enviar o email de acesso.`,
        {
          duration: 5000,
        }
      );

      setNewCompanyData({ cnpj: '', name: '', email: '', phone: '', address: '' });
      setIsNewCompanyModalOpen(false);
      await fetchCompanies();
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      toast.error(`Erro ao criar empresa: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedCompany) {
      toast.error('Email e empresa são obrigatórios.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error('Por favor, insira um email válido.');
      return;
    }

    if (!supabaseAdmin) {
      console.error('supabaseAdmin é null - Service Role Key não configurada');
      toast.error('Service Role Key não configurada. Configure VITE_SUPABASE_SERVICE_ROLE_KEY no arquivo .env e reinicie o servidor.');
      return;
    }

    console.log('Enviando convite para:', inviteEmail);
    console.log('Empresa:', selectedCompany.name);

    setIsSaving(true);

    try {
      // Primeiro, verificar se o usuário já existe
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('Erro ao listar usuários:', listError);
      } else {
        const existingUser = existingUsers?.users?.find(u => u.email === inviteEmail);

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
            setIsSaving(false);
            return;
          }
        }
      }

      // Criar usuário e enviar link de redefinição de senha
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

      // Gerar senha temporária aleatória
      const tempPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16) + 'A1!';

      // Criar usuário SEM metadata (para evitar trigger problemático)
      console.log('Tentando criar usuário:', inviteEmail);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: inviteEmail,
        password: tempPassword,
        email_confirm: true // Confirmar email automaticamente
        // NÃO passar user_metadata aqui para evitar trigger
      });

      if (createError) {
        console.error('Erro detalhado ao criar usuário:', {
          message: createError.message,
          status: createError.status,
          code: createError.code,
          details: createError
        });
        throw new Error(`Erro ao criar usuário: ${createError.message || JSON.stringify(createError)}`);
      }

      console.log('Usuário criado com sucesso:', createData.user?.id);

      // Aguardar um pouco para o trigger criar o profile (se existir)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar/criar profile usando upsert (evita conflito se trigger já criou)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: createData.user!.id,
          company_id: selectedCompany.id,
          full_name: inviteEmail.split('@')[0], // Usar parte antes do @ como nome temporário
          role: 'admin',
          is_super_admin: false
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Erro ao criar/atualizar profile:', profileError);
        // Deletar usuário criado se falhar ao criar profile
        await supabaseAdmin.auth.admin.deleteUser(createData.user!.id);
        throw new Error(`Erro ao criar perfil do usuário: ${profileError.message}`);
      }

      console.log('Profile criado/atualizado com sucesso');

      // Agora enviar email de reset de senha usando o cliente normal
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        inviteEmail,
        {
          redirectTo: `${appUrl}/reset-password`
        }
      );

      if (resetError) {
        console.error('Erro ao enviar email de reset:', resetError);
        // Não falhar se o email não enviar, usuário foi criado
      }

      toast.success(
        `Convite enviado para ${inviteEmail}! O administrador receberá um email com instruções para criar a senha.`,
        {
          duration: 6000,
        }
      );

      setInviteEmail('');
      setIsInviteModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(`Erro ao enviar convite: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openInviteModal = (company: Company) => {
    setSelectedCompany(company);
    setIsInviteModalOpen(true);
  };

  // Filtrar empresas
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Filtro de busca
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [companies, searchTerm, statusFilter]);

  const columns = [
    { key: 'name', header: 'Nome da Empresa' },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
          status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {status === 'active' ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Data de Cadastro' },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, company: Company) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleToggleStatus(company)}
          >
            {company.status === 'active' ? 'Desativar' : 'Ativar'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            icon={Mail}
            onClick={() => openInviteModal(company)}
          >
            Convidar Admin
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-gray-800 dark:text-dark-text" />
                <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão de Empresas</h1>
                <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie todas as empresas cadastradas na plataforma.</p>
                </div>
            </div>
            <Button icon={Plus} onClick={() => setIsNewCompanyModalOpen(true)}>Nova Empresa</Button>
        </div>

        <Card>
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empresa por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              />
            </div>

            {/* Filtro de status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text appearance-none cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Apenas Ativas</option>
                <option value="inactive">Apenas Inativas</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mb-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            Mostrando {filteredCompanies.length} de {companies.length} empresa(s)
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-dark-text-secondary">
              Nenhuma empresa encontrada
            </div>
          ) : (
            <Table columns={columns} data={filteredCompanies} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isNewCompanyModalOpen}
        onClose={() => {
          setIsNewCompanyModalOpen(false);
          setNewCompanyData({ cnpj: '', name: '', email: '', phone: '', address: '' });
        }}
        title="Cadastrar Nova Empresa"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div>
            <label htmlFor="companyCNPJ" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              CNPJ *
            </label>
            <input
              id="companyCNPJ"
              type="text"
              value={newCompanyData.cnpj}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setNewCompanyData({ ...newCompanyData, cnpj: formatCNPJ(value) });
              }}
              onBlur={handleCNPJBlur}
              required
              disabled={isLoadingCNPJ}
              maxLength={18}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text disabled:opacity-50"
              placeholder="00.000.000/0000-00"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isLoadingCNPJ ? 'Consultando CNPJ...' : 'Os dados da empresa serão preenchidos automaticamente'}
            </p>
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Nome da Empresa *
            </label>
            <input
              id="companyName"
              type="text"
              value={newCompanyData.name}
              onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Ex: Transportadora ABC Ltda"
            />
          </div>

          <div>
            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Email da Empresa
            </label>
            <input
              id="companyEmail"
              type="email"
              value={newCompanyData.email}
              onChange={(e) => setNewCompanyData({ ...newCompanyData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="contato@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Telefone
            </label>
            <input
              id="companyPhone"
              type="tel"
              value={newCompanyData.phone}
              onChange={(e) => setNewCompanyData({ ...newCompanyData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="(00) 0000-0000"
            />
          </div>

          <div>
            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Endereço
            </label>
            <textarea
              id="companyAddress"
              value={newCompanyData.address}
              onChange={(e) => setNewCompanyData({ ...newCompanyData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text resize-none"
              placeholder="Rua, número, bairro, cidade - UF, CEP"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Importante:</strong> Após cadastrar a empresa, use o botão "Convidar Admin" para enviar o email de acesso ao administrador.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNewCompanyModalOpen(false);
                setNewCompanyData({ cnpj: '', name: '', email: '', phone: '', address: '' });
              }}
              disabled={isSaving || isLoadingCNPJ}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={isSaving ? Loader : Save}
              disabled={isSaving || isLoadingCNPJ}
            >
              {isSaving ? 'Cadastrando...' : 'Cadastrar Empresa'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={`Convidar Admin para ${selectedCompany?.name}`}
      >
        <form onSubmit={handleInviteAdmin} className="space-y-4">
          <div>
            <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Email do Administrador
            </label>
            <input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={isSaving ? Loader : Mail} disabled={isSaving}>
              {isSaving ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Empresas;
