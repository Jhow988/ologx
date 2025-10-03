import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];

// Tipo expandido com joins
export type TripWithRelations = Trip & {
  client?: { id: string; name: string };
  vehicle?: { id: string; plate: string; model: string };
  driver?: { id: string; full_name: string };
};

export function useTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar todas as viagens da empresa com relações
  const fetchTrips = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          client:clients(id, name),
          vehicle:vehicles(id, plate, model),
          driver:profiles(id, full_name)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrips(data || []);
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      toast.error('Erro ao carregar viagens');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova viagem
  const createTrip = async (tripData: Omit<TripInsert, 'company_id' | 'id'>) => {
    if (!user?.companyId) {
      toast.error('Usuário não possui empresa associada');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([{
          ...tripData,
          company_id: user.companyId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Viagem criada com sucesso!');
      await fetchTrips();
      return data;
    } catch (error) {
      console.error('Erro ao criar viagem:', error);
      toast.error('Erro ao criar viagem');
      return null;
    }
  };

  // Atualizar viagem
  const updateTrip = async (id: string, tripData: TripUpdate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(tripData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Viagem atualizada com sucesso!');
      await fetchTrips();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      toast.error('Erro ao atualizar viagem');
      return null;
    }
  };

  // Deletar viagem
  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Viagem excluída com sucesso!');
      await fetchTrips();
      return true;
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      toast.error('Erro ao excluir viagem');
      return false;
    }
  };

  // Buscar viagem por ID
  const getTripById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          client:clients(id, name),
          vehicle:vehicles(id, plate, model),
          driver:profiles(id, full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar viagem:', error);
      toast.error('Erro ao buscar viagem');
      return null;
    }
  };

  // Atualizar status da viagem
  const updateTripStatus = async (id: string, status: string) => {
    return updateTrip(id, { status });
  };

  useEffect(() => {
    fetchTrips();
  }, [user?.companyId]);

  return {
    trips,
    loading,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripById,
    updateTripStatus
  };
}
