import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Company } from '../../types';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import { Building, CheckCircle, XCircle, Plus, Loader, Save, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Empresas: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [isSaving, setIsSaving] = useState(false);

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
    if (!newCompanyName.trim()) {
      toast.error('O nome da empresa não pode estar vazio.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('companies')
      .insert([{ name: newCompanyName, status: 'active' }]);
    
    if (error) {
      toast.error(`Erro ao criar empresa: ${error.message}`);
    } else {
      toast.success(`Empresa "${newCompanyName}" criada com sucesso!`);
      setNewCompanyName('');
      setIsNewCompanyModalOpen(false);
      await fetchCompanies();
    }
    setIsSaving(false);
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
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : (
            <Table columns={columns} data={companies} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isNewCompanyModalOpen}
        onClose={() => setIsNewCompanyModalOpen(false)}
        title="Cadastrar Nova Empresa"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Nome da Empresa
            </label>
            <input
              id="companyName"
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Digite o nome da nova empresa"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsNewCompanyModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={isSaving ? Loader : Save} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Empresa'}
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
