import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Company } from '../../types';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import { Building, CheckCircle, XCircle, Plus, Loader, Save, Mail, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Empresas: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    email: ''
  });

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

    if (!newCompanyData.name.trim() || !newCompanyData.email.trim()) {
      toast.error('Nome da empresa e email são obrigatórios.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCompanyData.email)) {
      toast.error('Por favor, insira um email válido.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Criar a empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: newCompanyData.name,
          email: newCompanyData.email,
          status: 'active'
        }])
        .select()
        .single();

      if (companyError) {
        throw companyError;
      }

      // 2. Enviar convite para o email cadastrado
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        newCompanyData.email,
        {
          data: {
            company_id: companyData.id,
            company_name: newCompanyData.name,
            role: 'admin',
            is_super_admin: false
          },
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (inviteError) {
        console.error('Erro ao enviar convite:', inviteError);
        // Mesmo com erro no envio do email, a empresa foi criada
        toast(
          `Empresa "${newCompanyData.name}" criada, mas houve erro ao enviar o convite. Use a função "Convidar Admin" para reenviar.`,
          {
            icon: '⚠️',
            duration: 6000,
          }
        );
      } else {
        toast.success(
          `Empresa "${newCompanyData.name}" criada! Um email foi enviado para ${newCompanyData.email} com instruções para criar a senha.`,
          {
            duration: 6000,
          }
        );
      }

      setNewCompanyData({ name: '', email: '' });
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
    setIsSaving(true);

    const { error } = await supabase.functions.invoke('invite-user', {
      body: { email: inviteEmail, company_id: selectedCompany.id },
    });

    if (error) {
      toast.error(`Erro ao enviar convite: ${error.message}`);
    } else {
      toast.success(`Convite enviado para ${inviteEmail}!`);
      setInviteEmail('');
      setIsInviteModalOpen(false);
    }
    setIsSaving(false);
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
          setNewCompanyData({ name: '', email: '' });
        }}
        title="Cadastrar Nova Empresa"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
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
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Email do Administrador *
            </label>
            <input
              id="adminEmail"
              type="email"
              value={newCompanyData.email}
              onChange={(e) => setNewCompanyData({ ...newCompanyData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="admin@empresa.com"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Um email será enviado para este endereço com instruções para criar a senha.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNewCompanyModalOpen(false);
                setNewCompanyData({ name: '', email: '' });
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={isSaving ? Loader : Save} disabled={isSaving}>
              {isSaving ? 'Criando e Enviando Convite...' : 'Criar Empresa'}
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
