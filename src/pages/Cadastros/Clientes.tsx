import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Search, Phone, Mail, Loader, Eye, MapPin, FileText, EyeOff, Filter, Info } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import NewClientForm from '../../components/Forms/NewClientForm';
import { Client } from '../../types';
import { useClients } from '../../hooks/useClients';
import toast from 'react-hot-toast';

const Clientes: React.FC = () => {
  const { clients, loading, createClient, updateClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | 'view' | null;
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

  const handleToggleStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    const result = await updateClient(client.id, { status: newStatus });

    if (result) {
      toast.success(
        newStatus === 'active'
          ? `Cliente "${client.name}" foi reativado!`
          : `Cliente "${client.name}" foi ocultado!`
      );
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Filtro de status (mostrar apenas ativos ou todos)
      const statusMatch = showInactive || client.status === 'active';

      // Filtro de busca
      const searchMatch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.document && client.document.includes(searchTerm)) ||
        (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()));

      return statusMatch && searchMatch;
    });
  }, [clients, searchTerm, showInactive]);

  const columns = [
    {
      key: 'name',
      header: 'Nome/Empresa',
      render: (name: string) => (
        <div className="max-w-xs" title={name}>
          <span className="block truncate">{name}</span>
        </div>
      ),
    },
    { key: 'document', header: 'CNPJ/CPF' },
    {
      key: 'contact',
      header: 'Contato',
      render: (_: any, client: Client) => (
        <div className="space-y-1">
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-dark-text">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-dark-text">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, client: Client) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Info}
            onClick={() => setModalState({ type: 'view', client })}
            title="Visualizar detalhes"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => setModalState({ type: 'edit', client })}
            title="Editar"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={client.status === 'active' ? EyeOff : Eye}
            onClick={() => handleToggleStatus(client)}
            title={client.status === 'active' ? 'Ocultar cliente' : 'Reativar cliente'}
            className={client.status === 'inactive' ? 'text-green-600 hover:text-green-700 dark:text-green-400' : ''}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <Button
              variant={showInactive ? 'primary' : 'outline'}
              icon={Filter}
              onClick={() => setShowInactive(!showInactive)}
              title={showInactive ? 'Ocultar clientes inativos' : 'Mostrar clientes inativos'}
            >
              {showInactive ? 'Mostrando Todos' : 'Apenas Ativos'}
            </Button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Mostrando {filteredClients.length} de {clients.length} cliente(s)
              {!showInactive && clients.filter(c => c.status === 'inactive').length > 0 && (
                <span className="ml-2 text-gray-500">
                  ({clients.filter(c => c.status === 'inactive').length} oculto(s))
                </span>
              )}
            </p>
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

      <Modal
        isOpen={modalState.type === 'view'}
        onClose={closeModal}
        title="Detalhes do Cliente"
      >
        {modalState.client && (
          <div className="space-y-6">
            {/* Nome/Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Nome/Empresa
              </label>
              <p className="text-base text-gray-900 dark:text-dark-text font-medium">
                {modalState.client.name}
              </p>
            </div>

            {/* CNPJ/CPF */}
            {modalState.client.document && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  CNPJ/CPF
                </label>
                <p className="text-base text-gray-900 dark:text-dark-text">
                  {modalState.client.document}
                </p>
              </div>
            )}

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modalState.client.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <p className="text-base text-gray-900 dark:text-dark-text">
                    {modalState.client.email}
                  </p>
                </div>
              )}
              {modalState.client.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Telefone
                  </label>
                  <p className="text-base text-gray-900 dark:text-dark-text">
                    {modalState.client.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Endereço Completo */}
            {(modalState.client.address || modalState.client.city || modalState.client.state || modalState.client.zip_code) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Endereço
                </label>
                <div className="text-base text-gray-900 dark:text-dark-text space-y-1">
                  {modalState.client.address && <p>{modalState.client.address}</p>}
                  {(modalState.client.city || modalState.client.state) && (
                    <p>
                      {modalState.client.city}
                      {modalState.client.city && modalState.client.state && ', '}
                      {modalState.client.state}
                    </p>
                  )}
                  {modalState.client.zip_code && <p>CEP: {modalState.client.zip_code}</p>}
                </div>
              </div>
            )}

            {/* Observações */}
            {modalState.client.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Observações
                </label>
                <p className="text-base text-gray-900 dark:text-dark-text whitespace-pre-wrap">
                  {modalState.client.notes}
                </p>
              </div>
            )}

            {/* Data de Cadastro */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cadastrado em: {new Date(modalState.client.created_at).toLocaleDateString('pt-BR')} às {new Date(modalState.client.created_at).toLocaleTimeString('pt-BR')}
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button
                variant="outline"
                onClick={closeModal}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                icon={Pencil}
                onClick={() => setModalState({ type: 'edit', client: modalState.client })}
              >
                Editar Cliente
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Clientes;
