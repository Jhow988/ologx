import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * Cria uma conta a receber quando uma viagem é concluída
 */
export async function createReceivableFromTrip(tripId: string, companyId: string) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 createReceivableFromTrip - INICIANDO');
  console.log('  - tripId:', tripId);
  console.log('  - companyId:', companyId);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Buscar dados da viagem
    console.log('📡 Buscando dados da viagem no banco...');
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, client:clients(name)')
      .eq('id', tripId)
      .single();

    console.log('📦 Resultado da busca da viagem:');
    console.log('  - trip:', trip);
    console.log('  - erro:', tripError);

    if (tripError) throw tripError;
    if (!trip) throw new Error('Viagem não encontrada');

    // Verificar se já existe um registro financeiro para esta viagem
    console.log('🔍 Verificando se já existe conta a receber para esta viagem...');
    const { data: existing } = await supabase
      .from('financial_records')
      .select('id')
      .eq('related_trip_id', tripId)
      .eq('type', 'receivable')
      .single();

    console.log('  - existing:', existing);

    if (existing) {
      console.log('⚠️ Conta a receber já existe para esta viagem:', existing.id);
      return existing;
    }
    console.log('✅ Nenhuma conta existente encontrada, prosseguindo...');

    // Buscar ou criar categoria "Frete/Serviços"
    console.log('🏷️ Buscando/criando categoria "Frete/Serviços"...');
    let { data: category } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', 'Frete/Serviços')
      .single();

    console.log('  - categoria encontrada:', category);

    if (!category) {
      console.log('  - Categoria não existe, criando...');
      const { data: newCategory, error: catError } = await supabase
        .from('financial_categories')
        .insert({
          company_id: companyId,
          name: 'Frete/Serviços',
          type: 'receivable'  // Adicionar tipo da categoria
        })
        .select()
        .single();

      console.log('  - nova categoria criada:', newCategory);
      console.log('  - erro ao criar categoria:', catError);

      if (catError) throw catError;
      category = newCategory;
    } else {
      console.log('  - Categoria já existe:', category.id);
    }

    // Criar conta a receber
    const clientName = trip.client?.name || 'Cliente';
    const route = `${trip.origin} - ${trip.destination}`;

    const recordData = {
      company_id: companyId,
      type: 'receivable' as const,
      description: `Frete: ${clientName} (${route})`,
      amount: (trip as any).freight_value || 0,
      due_date: (trip as any).end_date || (trip as any).start_date,
      status: 'pending' as const,
      category_id: category.id,
      related_trip_id: tripId,
      recurrence: 'unique' as const
    };

    console.log('💰 Criando conta a receber com os dados:');
    console.log('  - company_id:', recordData.company_id);
    console.log('  - type:', recordData.type);
    console.log('  - description:', recordData.description);
    console.log('  - amount:', recordData.amount);
    console.log('  - due_date:', recordData.due_date);
    console.log('  - status:', recordData.status);
    console.log('  - category_id:', recordData.category_id);
    console.log('  - related_trip_id:', recordData.related_trip_id);
    console.log('  - recurrence:', recordData.recurrence);

    const { data: financialRecord, error: finError } = await supabase
      .from('financial_records')
      .insert([recordData])
      .select()
      .single();

    console.log('📋 Resultado da inserção:');
    console.log('  - financialRecord:', financialRecord);
    console.log('  - erro:', finError);

    if (finError) {
      console.error('❌ ERRO ao criar conta a receber:');
      console.error('  - message:', finError.message);
      console.error('  - details:', finError.details);
      console.error('  - hint:', finError.hint);
      console.error('  - code:', finError.code);
      throw finError;
    }

    console.log('✅✅✅ Conta a receber criada COM SUCESSO:', financialRecord);
    console.log('═══════════════════════════════════════════════════════════');
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
          name: 'Manutenção',
          type: 'payable'  // Adicionar tipo da categoria
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
