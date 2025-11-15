import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { handleTripCompletion } from '../utils/financialIntegration';

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
      console.log('createTrip - tripData:', tripData);

      const dataToInsert = {
        ...tripData,
        company_id: user.companyId
      };

      console.log('createTrip - dataToInsert:', dataToInsert);

      const { data, error } = await supabase
        .from('trips')
        .insert([dataToInsert])
        .select()
        .single();

      console.log('createTrip - data:', data);
      console.log('createTrip - error:', error);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'create',
        p_entity_type: 'trip',
        p_entity_id: data.id,
        p_details: {
          origin: data.origin,
          destination: data.destination,
          status: data.status,
          freight_value: data.freight_value
        }
      });

      toast.success('Viagem criada com sucesso!');
      await fetchTrips();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar viagem:', error);
      console.error('Detalhes:', error.message, error.details);
      toast.error('Erro ao criar viagem');
      return null;
    }
  };

  // Atualizar viagem
  const updateTrip = async (id: string, tripData: TripUpdate) => {
    try {
      console.log('🔄 useTrips.updateTrip - INICIANDO');
      console.log('  - id:', id);
      console.log('  - tripData:', tripData);

      // Buscar status anterior
      const { data: oldTrip } = await supabase
        .from('trips')
        .select('status')
        .eq('id', id)
        .single();

      console.log('  - oldTrip status:', oldTrip?.status);

      const { data, error } = await supabase
        .from('trips')
        .update(tripData)
        .eq('id', id)
        .select()
        .single();

      console.log('  - data após update:', data);
      console.log('  - error:', error);

      if (error) throw error;

      // Se mudou para 'completed', criar conta a receber automaticamente
      const wasCompleted = oldTrip?.status !== 'completed' && data.status === 'completed';
      console.log('  - wasCompleted?:', wasCompleted);
      console.log('    - oldTrip.status:', oldTrip?.status);
      console.log('    - data.status:', data.status);

      if (wasCompleted && user?.companyId) {
        console.log('🎉 Viagem foi CONCLUÍDA! Chamando handleTripCompletion...');
        console.log('  - trip.id:', data.id);
        console.log('  - user.companyId:', user.companyId);
        await handleTripCompletion(data.id, user.companyId);
        console.log('✅ handleTripCompletion finalizado');
      } else {
        console.log('⚠️ Viagem NÃO foi concluída ou já estava concluída. Não criando conta a receber.');
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'update',
        p_entity_type: 'trip',
        p_entity_id: data.id,
        p_details: {
          updated_fields: Object.keys(tripData),
          origin: data.origin,
          destination: data.destination,
          status: data.status
        }
      });

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
      // Get trip data before deleting for logging
      const tripToDelete = await getTripById(id);

      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      if (tripToDelete) {
        await supabase.rpc('log_activity', {
          p_action: 'delete',
          p_entity_type: 'trip',
          p_entity_id: id,
          p_details: {
            origin: tripToDelete.origin,
            destination: tripToDelete.destination,
            status: tripToDelete.status
          }
        });
      }

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
