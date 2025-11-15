import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Cria uma conta a receber quando uma viagem é concluída
 */
export async function createReceivableFromTrip(tripId: string, companyId: string) {
  try {
    // Buscar dados da viagem
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, client:clients(name)')
      .eq('id', tripId)
      .single();

    if (tripError) throw tripError;
    if (!trip) throw new Error('Viagem não encontrada');

    // Verificar se já existe um registro financeiro para esta viagem
    const { data: existing } = await supabase
      .from('financial_records')
      .select('id')
      .eq('related_trip_id', tripId)
      .eq('type', 'receivable')
      .single();

    if (existing) {
      console.log('Conta a receber já existe para esta viagem');
      return existing;
    }

    // Buscar ou criar categoria "Frete/Serviços"
    let { data: category } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', 'Frete/Serviços')
      .single();

    if (!category) {
      const { data: newCategory, error: catError } = await supabase
        .from('financial_categories')
        .insert({
          company_id: companyId,
          name: 'Frete/Serviços'
        })
        .select()
        .single();

      if (catError) throw catError;
      category = newCategory;
    }

    // Criar conta a receber
    const clientName = trip.client?.name || 'Cliente';
    const route = `${trip.origin} - ${trip.destination}`;

    const { data: financialRecord, error: finError } = await supabase
      .from('financial_records')
      .insert({
        company_id: companyId,
        type: 'receivable',
        description: `Frete: ${clientName} (${route})`,
        amount: trip.freight_value || 0,
        due_date: trip.end_date || trip.start_date,
        status: 'pending',
        category_id: category.id,
        related_trip_id: tripId,
        recurrence: 'unique'
      })
      .select()
      .single();

    if (finError) throw finError;

    console.log('✅ Conta a receber criada:', financialRecord);
    return financialRecord;
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    throw error;
  }
}

/**
 * Cria uma conta a pagar quando uma manutenção é concluída
 */
export async function createPayableFromMaintenance(maintenanceId: string, companyId: string) {
  try {
    // Buscar dados da manutenção
    const { data: maintenance, error: maintError } = await supabase
      .from('maintenances')
      .select('*, vehicle:vehicles(plate, model)')
      .eq('id', maintenanceId)
      .single();

    if (maintError) throw maintError;
    if (!maintenance) throw new Error('Manutenção não encontrada');

    // Verificar se já existe um registro financeiro para esta manutenção
    const { data: existing } = await supabase
      .from('financial_records')
      .select('id')
      .eq('company_id', companyId)
      .eq('description', `Manutenção: ${maintenance.vehicle?.plate || 'Veículo'} - ${maintenance.title}`)
      .eq('type', 'payable')
      .single();

    if (existing) {
      console.log('Conta a pagar já existe para esta manutenção');
      return existing;
    }

    // Buscar ou criar categoria "Manutenção"
    let { data: category } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', 'Manutenção')
      .single();

    if (!category) {
      const { data: newCategory, error: catError } = await supabase
        .from('financial_categories')
        .insert({
          company_id: companyId,
          name: 'Manutenção'
        })
        .select()
        .single();

      if (catError) throw catError;
      category = newCategory;
    }

    // Criar conta a pagar
    const vehicleInfo = maintenance.vehicle
      ? `${maintenance.vehicle.plate} (${maintenance.vehicle.model})`
      : 'Veículo';

    const { data: financialRecord, error: finError } = await supabase
      .from('financial_records')
      .insert({
        company_id: companyId,
        type: 'payable',
        description: `Manutenção: ${vehicleInfo} - ${maintenance.title}`,
        amount: maintenance.cost || 0,
        due_date: maintenance.end_date || maintenance.start_date,
        status: 'pending',
        category_id: category.id,
        recurrence: 'unique'
      })
      .select()
      .single();

    if (finError) throw finError;

    console.log('✅ Conta a pagar criada:', financialRecord);
    return financialRecord;
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    throw error;
  }
}

/**
 * Verifica e cria registros financeiros automaticamente ao concluir viagem
 */
export async function handleTripCompletion(tripId: string, companyId: string) {
  try {
    const record = await createReceivableFromTrip(tripId, companyId);
    if (record) {
      toast.success('Conta a receber criada automaticamente!');
    }
    return record;
  } catch (error: any) {
    console.error('Erro na integração financeira:', error);
    // Não mostrar toast de erro para não poluir a interface
    return null;
  }
}

/**
 * Verifica e cria registros financeiros automaticamente ao concluir manutenção
 */
export async function handleMaintenanceCompletion(maintenanceId: string, companyId: string) {
  try {
    const record = await createPayableFromMaintenance(maintenanceId, companyId);
    if (record) {
      toast.success('Conta a pagar criada automaticamente!');
    }
    return record;
  } catch (error: any) {
    console.error('Erro na integração financeira:', error);
    // Não mostrar toast de erro para não poluir a interface
    return null;
  }
}
