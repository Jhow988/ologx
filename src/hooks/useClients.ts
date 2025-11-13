import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar todos os clientes da empresa
  const fetchClients = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo cliente
  const createClient = async (clientData: Omit<ClientInsert, 'company_id' | 'id'>) => {
    console.log('=== CREATE CLIENT DEBUG ===');
    console.log('User:', user);
    console.log('Company ID:', user?.companyId);
    console.log('Client Data:', clientData);

    if (!user?.companyId) {
      toast.error('Usuário não possui empresa associada');
      return null;
    }

    try {
      const insertData = {
        ...clientData,
        company_id: user.companyId
      };

      console.log('Insert Data:', insertData);

      const { data, error } = await supabase
        .from('clients')
        .insert([insertData])
        .select()
        .single();

      console.log('Supabase Response - Data:', data);
      console.log('Supabase Response - Error:', error);

      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Erro desconhecido');
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'create',
        p_entity_type: 'client',
        p_entity_id: data.id,
        p_details: {
          name: data.name,
          email: data.email,
          phone: data.phone
        }
      });

      toast.success('Cliente criado com sucesso!');
      await fetchClients(); // Atualiza a lista
      return data;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      toast.error(`Erro ao criar cliente: ${error.message || 'Erro desconhecido'}`);
      return null;
    }
  };

  // Atualizar cliente
  const updateClient = async (id: string, clientData: ClientUpdate) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'update',
        p_entity_type: 'client',
        p_entity_id: data.id,
        p_details: {
          updated_fields: Object.keys(clientData),
          name: data.name
        }
      });

      toast.success('Cliente atualizado com sucesso!');
      await fetchClients(); // Atualiza a lista
      return data;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
      return null;
    }
  };

  // Deletar cliente
  const deleteClient = async (id: string) => {
    try {
      // Get client data before deleting for logging
      const clientToDelete = await getClientById(id);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      if (clientToDelete) {
        await supabase.rpc('log_activity', {
          p_action: 'delete',
          p_entity_type: 'client',
          p_entity_id: id,
          p_details: {
            name: clientToDelete.name,
            email: clientToDelete.email,
            phone: clientToDelete.phone
          }
        });
      }

      toast.success('Cliente excluído com sucesso!');
      await fetchClients(); // Atualiza a lista
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
      return false;
    }
  };

  // Buscar cliente por ID
  const getClientById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      toast.error('Erro ao buscar cliente');
      return null;
    }
  };

  // Carregar clientes quando o componente montar ou user mudar
  useEffect(() => {
    fetchClients();
  }, [user?.companyId]);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById
  };
}
