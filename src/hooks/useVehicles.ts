import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

export function useVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar todos os veículos da empresa
  const fetchVehicles = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      toast.error('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo veículo
  const createVehicle = async (vehicleData: Omit<VehicleInsert, 'company_id' | 'id'>) => {
    if (!user?.companyId) {
      toast.error('Usuário não possui empresa associada');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          ...vehicleData,
          company_id: user.companyId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Veículo criado com sucesso!');
      await fetchVehicles();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar veículo:', error);
      console.error('Detalhes do erro:', error.message, error.details, error.hint);
      toast.error(error.message || 'Erro ao criar veículo');
      return null;
    }
  };

  // Atualizar veículo
  const updateVehicle = async (id: string, vehicleData: VehicleUpdate) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Veículo atualizado com sucesso!');
      await fetchVehicles();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      toast.error('Erro ao atualizar veículo');
      return null;
    }
  };

  // Deletar veículo
  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Veículo excluído com sucesso!');
      await fetchVehicles();
      return true;
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      toast.error('Erro ao excluir veículo');
      return false;
    }
  };

  // Buscar veículo por ID
  const getVehicleById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar veículo:', error);
      toast.error('Erro ao buscar veículo');
      return null;
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.companyId]);

  return {
    vehicles,
    loading,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById
  };
}
