import React, { useState } from 'react';
import { Plus, Pencil, Search, Phone, Mail, Loader } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import NewClientForm from '../../components/Forms/NewClientForm';
import { Client } from '../../types';
import { useClients } from '../../hooks/useClients';

const Clientes: React.FC = () => {
  const { clients, loading, createClient, updateClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | null;
    client: Client | null;
  }>({ type: null, client: null });

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (modalState.type === 'edit' && modalState.client) {
        const result = await updateClient(modalState.client.id, clientData);
        if (result) {
          closeModal();
        }
      } else {
        // Remove any extra fields that shouldn't be in the database
        const { id, created_at, company_id, ...cleanData } = clientData as any;
        const result = await createClient(cleanData);
        if (result) {
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };
  
  const closeModal = () => {
    setModalState({ type: null, client: null });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.document && client.document.includes(searchTerm)) ||
    (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { key: 'name', header: 'Nome/Empresa' },
    { key: 'document', header: 'CNPJ/CPF' },
    {
      key: 'contact',
      header: 'Contato',
      render: (_: any, client: Client) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-dark-text"><Phone className="h-3 w-3" />{client.phone}</div>
          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-dark-text"><Mail className="h-3 w-3" />{client.email}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localização',
      render: (_: any, client: Client) => `${client.city}, ${client.state}`,
    },
    { key: 'created_at', header: 'Cadastrado em', render: (date: string) => new Date(date).toLocaleDateString('pt-BR') },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, client: Client) => (
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setModalState({ type: 'edit', client })}>Editar</Button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão de Clientes</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie todos os clientes da sua transportadora</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalState({ type: 'new', client: null })}>Novo Cliente</Button>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, documento ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg"
              />
            </div>
          </div>
          {loading ? (
             <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table columns={columns} data={filteredClients} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalState.type === 'new' || modalState.type === 'edit'}
        onClose={closeModal}
        title={modalState.type === 'edit' ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
      >
        <NewClientForm initialData={modalState.client} onSave={handleSaveClient} onCancel={closeModal} />
      </Modal>
    </>
  );
};

export default Clientes;
