import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Search, Loader, TrendingUp, TrendingDown, CheckCircle, Edit } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Table from '../components/UI/Table';
import Modal from '../components/UI/Modal';
import NewFinancialRecordForm from '../components/Forms/NewFinancialRecordForm';
import { FinancialRecord, Trip, FinancialCategory, FinancialSubcategory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const Financeiro: React.FC = () => {
  const { view = 'pagar' } = useParams<{ view: 'pagar' | 'receber' }>();
  const { user } = useAuth();

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [subcategories, setSubcategories] = useState<FinancialSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros
  const [periodFilter, setPeriodFilter] = useState<'current' | 'next' | 'last' | 'custom'>('current');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | null;
    record: FinancialRecord | null;
  }>({ type: null, record: null });

  // Função para criar automaticamente os próximos meses de contas recorrentes
  const createNextMonthRecurringEntries = useCallback(async () => {
    if (!user?.companyId) return;

    console.log('🔄 Verificando contas recorrentes que precisam de novos meses...');

    // Buscar todos os grupos de recorrência (usando recurrence_id)
    const { data: recurringGroups, error: groupsError } = await supabase
      .from('financial_records')
      .select('recurrence_id, recurrence')
      .eq('company_id', user.companyId)
      .eq('recurrence', 'recurring')
      .not('recurrence_id', 'is', null);

    if (groupsError) {
      console.error('❌ Erro ao buscar grupos recorrentes:', groupsError);
      return;
    }

    // Obter IDs únicos de recorrência
    const uniqueRecurrenceIds = [...new Set(recurringGroups?.map(r => r.recurrence_id).filter(Boolean))];
    console.log(`📋 Encontrados ${uniqueRecurrenceIds.length} grupos de recorrência`);

    for (const recurrenceId of uniqueRecurrenceIds) {
      if (!recurrenceId) continue; // Skip null values

      // Buscar todos os registros deste grupo de recorrência
      const { data: groupRecords, error: recordsError } = await supabase
        .from('financial_records')
        .select('*')
        .eq('recurrence_id', recurrenceId)
        .order('due_date', { ascending: false });

      if (recordsError || !groupRecords || groupRecords.length === 0) continue;

      const lastRecord = groupRecords[0]; // Último registro (mais recente)
      const lastDueDate = new Date(lastRecord.due_date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calcular quantos meses à frente temos
      const monthsDiff = (lastDueDate.getFullYear() - today.getFullYear()) * 12 +
                         (lastDueDate.getMonth() - today.getMonth());

      // Se temos menos de 2 meses à frente, criar mais um mês
      if (monthsDiff < 2) {
        console.log(`➕ Criando próximo mês para recorrência ${recurrenceId}`);

        // Calcular próxima data de vencimento
        const nextDueDate = new Date(lastDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        // Verificar se já existe um registro para esta data
        const { data: existingRecord } = await supabase
          .from('financial_records')
          .select('id')
          .eq('recurrence_id', recurrenceId)
          .eq('due_date', nextDueDate.toISOString().split('T')[0])
          .single();

        if (existingRecord) {
          console.log(`⏭️ Registro já existe para ${nextDueDate.toISOString().split('T')[0]}`);
          continue;
        }

        // Criar novo registro para o próximo mês
        const nextMonthNumber = groupRecords.length + 1;
        const baseDescription = lastRecord.description.replace(/\s*\(Mês \d+\)|\s*\(\d+\/\d+\)/, '');

        const newRecord = {
          company_id: user.companyId,
          type: lastRecord.type,
          description: `${baseDescription} (Mês ${nextMonthNumber})`,
          amount: lastRecord.amount,
          due_date: nextDueDate.toISOString().split('T')[0],
          status: 'pending',
          category_id: lastRecord.category_id,
          subcategory_id: lastRecord.subcategory_id,
          recurrence: 'recurring',
          recurrence_id: recurrenceId,
          related_trip_id: lastRecord.related_trip_id
        };

        const { error: insertError } = await supabase
          .from('financial_records')
          .insert([newRecord]);

        if (insertError) {
          console.error(`❌ Erro ao criar próximo mês para recorrência ${recurrenceId}:`, insertError);
        } else {
          console.log(`✅ Próximo mês criado com sucesso para ${nextDueDate.toISOString().split('T')[0]}`);
        }
      }
    }
  }, [user?.companyId]);

  const fetchData = useCallback(async () => {
    if (!user?.companyId) {
        console.log('❌ Financeiro: Sem companyId');
        setLoading(false);
        return;
    };

    console.log('🔄 Financeiro: Buscando dados para company_id:', user.companyId);
    setLoading(true);

    // Criar próximos meses de contas recorrentes antes de buscar os dados
    await createNextMonthRecurringEntries();

    const [recordsRes, tripsRes, categoriesRes, subcategoriesRes] = await Promise.all([
      supabase.from('financial_records').select('*, category:financial_categories(name), subcategory:financial_subcategories(name)').eq('company_id', user.companyId).order('due_date', { ascending: true }),
      supabase.from('trips').select('id, origin, destination, start_date, status, service_number').eq('company_id', user.companyId),
      supabase.from('financial_categories').select('*').eq('company_id', user.companyId),
      supabase.from('financial_subcategories').select('*').eq('company_id', user.companyId)
    ]);

    console.log('📊 Financeiro: Resultados das queries:');
    console.log('  - Financial Records:', recordsRes.data?.length || 0, 'registros', recordsRes.error ? '❌ ERRO: ' + recordsRes.error.message : '✅');
    console.log('  - Trips:', tripsRes.data?.length || 0, 'viagens', tripsRes.error ? '❌ ERRO: ' + tripsRes.error.message : '✅');
    console.log('  - Categories:', categoriesRes.data?.length || 0, 'categorias', categoriesRes.error ? '❌ ERRO: ' + categoriesRes.error.message : '✅');
    console.log('  - Subcategories:', subcategoriesRes.data?.length || 0, 'subcategorias', subcategoriesRes.error ? '❌ ERRO: ' + subcategoriesRes.error.message : '✅');

    if (recordsRes.error) console.error('❌ Error fetching records:', recordsRes.error);
    if (tripsRes.error) console.error('❌ Error fetching trips:', tripsRes.error);
    if (categoriesRes.error) console.error('❌ Error fetching categories:', categoriesRes.error);
    if (subcategoriesRes.error) console.error('❌ Error fetching subcategories:', subcategoriesRes.error);

    if (recordsRes.data && recordsRes.data.length > 0) {
      console.log('📝 Primeiro registro:', recordsRes.data[0]);
    }

    const mappedRecords = (recordsRes.data || []).map((r: any) => ({ ...r, categoryName: r.category?.name, subcategoryName: r.subcategory?.name })) as FinancialRecord[];
    console.log('✅ Registros mapeados:', mappedRecords.length);

    setRecords(mappedRecords);
    setTrips(tripsRes.data as Trip[] || []);
    setCategories(categoriesRes.data as FinancialCategory[] || []);
    setSubcategories(subcategoriesRes.data as FinancialSubcategory[] || []);

    setLoading(false);
  }, [user?.companyId, createNextMonthRecurringEntries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveRecord = async (recordData: Partial<FinancialRecord> & { installments?: number }) => {
    if (!user?.companyId) {
      console.log('❌ handleSaveRecord: Sem companyId');
      return;
    }

    console.log('💾 handleSaveRecord - INICIANDO');
    console.log('  - Dados recebidos:', recordData);
    console.log('  - user.companyId:', user.companyId);
    console.log('  - modalState.type:', modalState.type);

    const { installments, ...data } = recordData;

    // Converter campos vazios em null para evitar erros de UUID e remover campos extras
    const cleanedData = {
      type: data.type!,
      description: data.description!,
      amount: data.amount!,
      due_date: data.due_date!,
      category_id: data.category_id!,
      subcategory_id: data.subcategory_id || null,
      recurrence: data.recurrence || 'unique',
      status: data.status || 'pending',
      related_trip_id: data.related_trip_id || null,
    };

    if (modalState.type === 'edit' && modalState.record) {
      console.log('📝 Modo EDIÇÃO - Atualizando registro:', modalState.record.id);
      const { error, data: updatedData } = await supabase
        .from('financial_records')
        .update(cleanedData)
        .eq('id', modalState.record.id)
        .select();

      if (error) {
        console.error("❌ Error updating record:", error);
        console.error("  - message:", error.message);
        console.error("  - details:", error.details);
      } else {
        console.log("✅ Registro atualizado com sucesso:", updatedData);
      }
    } else {
        console.log('✨ Modo CRIAÇÃO - Criando novo registro');

        if (cleanedData.recurrence === 'installment' && installments && installments > 1) {
            const recordsToInsert = [];
            const recurrenceId = crypto.randomUUID();
            console.log('📦 Modo PARCELADO - Criando', installments, 'parcelas');

            for (let i = 0; i < installments; i++) {
                const dueDate = new Date(cleanedData.due_date!);
                dueDate.setMonth(dueDate.getMonth() + i);
                recordsToInsert.push({
                    ...cleanedData,
                    company_id: user.companyId,
                    description: `${cleanedData.description} ${i + 1}/${installments}`,
                    due_date: dueDate.toISOString().split('T')[0],
                    recurrence_id: recurrenceId,
                });
            }
            console.log('💳 Dados a inserir (parcelas):', recordsToInsert);

            const { error, data: insertedData } = await supabase
              .from('financial_records')
              .insert(recordsToInsert)
              .select();

            if (error) {
              console.error("❌ Error inserting installment records:", error);
              console.error("  - message:", error.message);
              console.error("  - details:", error.details);
              console.error("  - hint:", error.hint);
            } else {
              console.log("✅ Parcelas inseridas com sucesso:", insertedData?.length, 'registros');
              console.log("  - Primeiro registro:", insertedData?.[0]);
            }
        } else if (cleanedData.recurrence === 'recurring') {
            const recordsToInsert = [];
            const recurrenceId = crypto.randomUUID();

            // Para recorrências, criar apenas 3 meses à frente inicialmente
            // O sistema criará automaticamente os próximos meses quando necessário
            const isInfinite = installments === -1;
            const monthsToCreate = isInfinite ? 3 : Math.min(installments || 12, 3);

            console.log(`🔄 Modo RECORRENTE - Criando ${monthsToCreate} meses iniciais${isInfinite ? ' (INFINITO - mais meses serão criados automaticamente)' : ''}`);

            for (let i = 0; i < monthsToCreate; i++) {
                const dueDate = new Date(cleanedData.due_date!);
                dueDate.setMonth(dueDate.getMonth() + i);
                recordsToInsert.push({
                    ...cleanedData,
                    company_id: user.companyId,
                    description: isInfinite ? `${cleanedData.description} (Mês ${i + 1})` : `${cleanedData.description} (${i + 1}/${installments})`,
                    due_date: dueDate.toISOString().split('T')[0],
                    recurrence_id: recurrenceId,
                });
            }
            console.log('💳 Dados a inserir (recorrência):', recordsToInsert);

            const { error, data: insertedData } = await supabase
              .from('financial_records')
              .insert(recordsToInsert)
              .select();

            if (error) {
              console.error("❌ Error inserting recurring records:", error);
              console.error("  - message:", error.message);
              console.error("  - details:", error.details);
              console.error("  - hint:", error.hint);
            } else {
              console.log(`✅ Recorrência inserida com sucesso: ${insertedData?.length} registros${isInfinite ? ' (infinito - mais meses serão criados automaticamente)' : ''}`);
              console.log("  - Primeiro registro:", insertedData?.[0]);
            }
        } else {
            const recordToInsert = {
              ...cleanedData,
              company_id: user.companyId,
              status: cleanedData.status || 'pending'
            };
            console.log('💳 Modo ÚNICO - Dados a inserir:', recordToInsert);

            const { error, data: insertedData } = await supabase
              .from('financial_records')
              .insert([recordToInsert])
              .select();

            if (error) {
              console.error("❌ Error inserting record:", error);
              console.error("  - message:", error.message);
              console.error("  - details:", error.details);
              console.error("  - hint:", error.hint);
              console.error("  - code:", error.code);
            } else {
              console.log("✅ Registro inserido com sucesso:", insertedData);
            }
        }
    }

    console.log('🔄 Recarregando dados...');
    await fetchData();
    console.log('✅ Dados recarregados');
    closeModal();
  };

  const handleToggleStatus = async (record: FinancialRecord) => {
    const newStatus = record.status === 'paid' ? 'pending' : 'paid';
    const { error } = await supabase.from('financial_records').update({ status: newStatus }).eq('id', record.id);
    if (error) console.error("Error toggling status:", error);
    else await fetchData();
  }

  const closeModal = () => setModalState({ type: null, record: null });

  // Helper function to calculate date range based on period filter
  const getDateRangeForPeriod = useCallback((period: 'current' | 'next' | 'last' | 'custom') => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'current':
        // First day of current month to last day of current month
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'next':
        // First day of next month to last day of next month
        start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      case 'last':
        // First day of last month to last day of last month
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        // Use custom dates or return null if not set
        if (!customStartDate || !customEndDate) return null;
        return {
          startDate: customStartDate,
          endDate: customEndDate
        };
    }

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end)
    };
  }, [customStartDate, customEndDate]);

  const filteredRecords = useMemo(() => {
    const typeFilter = view === 'pagar' ? 'payable' : 'receivable';
    console.log(`🔍 Filtrando registros - View: ${view}, Type Filter: ${typeFilter}, Total Records: ${records.length}`);

    // Get date range based on period filter
    const dateRange = getDateRangeForPeriod(periodFilter);

    const filtered = records.filter(record => {
      // Filtro de tipo (pagar/receber)
      if (record.type !== typeFilter) return false;

      // Filtro de busca por texto
      if (searchTerm && !record.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro de data (apenas se houver range válido)
      if (dateRange) {
        if (record.due_date < dateRange.startDate) {
          return false;
        }
        if (record.due_date > dateRange.endDate) {
          return false;
        }
      }

      // Filtro de categoria
      if (selectedCategory && record.category_id !== selectedCategory) {
        return false;
      }

      return true;
    });

    // Ordenar por data de criação (mais recentes primeiro)
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    });

    console.log(`✅ Registros filtrados e ordenados: ${sorted.length}`, sorted);
    return sorted;
  }, [records, view, searchTerm, periodFilter, customStartDate, customEndDate, selectedCategory, getDateRangeForPeriod]);

  const getStatusColor = (status: string) => ({
    'paid': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'overdue': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }[status] || 'bg-gray-100');

  const getStatusText = (status: string) => ({
    'paid': 'Pago', 'pending': 'Pendente', 'overdue': 'Vencido',
  }[status] || status);

  const getRecurrenceText = (recurrence: string) => {
    const map: any = {
      'unique': 'Única',
      'installment': 'Parcelado',
      'recurring': 'Recorrente'
    };
    return map[recurrence] || recurrence;
  };

  const columns = [
    {
      key: 'description',
      header: 'Descrição',
      render: (description: string) => (
        <div className="max-w-[300px] truncate" title={description}>
          {description}
        </div>
      )
    },
    { key: 'due_date', header: 'Vencimento', render: (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') },
    { key: 'amount', header: 'Valor', render: (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) },
    { key: 'categoryName', header: 'Categoria' },
    {
      key: 'recurrence',
      header: 'Recorrência',
      render: (recurrence: string) => (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
          {getRecurrenceText(recurrence)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, record: FinancialRecord) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={Edit}
            onClick={() => setModalState({ type: 'edit', record })}
            title="Editar"
          />
          {record.status !== 'paid' && (
            <button
              onClick={() => handleToggleStatus(record)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              title="Marcar como pago"
            >
              <CheckCircle className="h-4 w-4" />
              Pago
            </button>
          )}
          {record.status === 'paid' && (
            <button
              onClick={() => handleToggleStatus(record)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              title="Marcar como pendente"
            >
              <CheckCircle className="h-4 w-4" />
              Reverter
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Gestão Financeira</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie suas contas a pagar e a receber</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalState({ type: 'new', record: { type: view === 'pagar' ? 'payable' : 'receivable' } as FinancialRecord })}>
            Novo Lançamento
          </Button>
        </div>

        <Card>
          <div className="border-b border-gray-200 dark:border-dark-border mb-6">
            <nav className="-mb-px flex gap-6">
              <Link to="/financeiro/pagar" className={`py-4 px-1 border-b-2 font-medium text-sm ${view === 'pagar' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <TrendingDown className="inline-block mr-2 h-4 w-4" /> Contas a Pagar
              </Link>
              <Link to="/financeiro/receber" className={`py-4 px-1 border-b-2 font-medium text-sm ${view === 'receber' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <TrendingUp className="inline-block mr-2 h-4 w-4" /> Contas a Receber
              </Link>
            </nav>
          </div>

          {/* Filtros */}
          <div className="space-y-4 mb-6">
            {/* Linha 1: Busca, Período e Categoria */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.5fr,1.5fr] gap-3">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar por descrição
                </label>
                <Search className="absolute left-3 top-[38px] h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período
                </label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as 'current' | 'next' | 'last' | 'custom')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                >
                  <option value="current">Mês Atual</option>
                  <option value="next">Próximo Mês</option>
                  <option value="last">Mês Anterior</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2: Datas personalizadas (quando necessário) */}
            {periodFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                  />
                </div>
              </div>
            )}

            {/* Linha 3: Botão Limpar e Contador */}
            {(searchTerm || periodFilter !== 'current' || customStartDate || customEndDate || selectedCategory) && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-dark-border">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPeriodFilter('current');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setSelectedCategory('');
                  }}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Limpar filtros
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredRecords.length} {filteredRecords.length === 1 ? 'resultado' : 'resultados'}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {!searchTerm && periodFilter === 'current' && !customStartDate && !customEndDate && !selectedCategory && (
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Total: {filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'}
                </div>
              )}
              <Table columns={columns} data={filteredRecords} />
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={!!modalState.type} onClose={closeModal} title={modalState.type === 'edit' ? 'Editar Lançamento' : 'Novo Lançamento'}>
        <NewFinancialRecordForm
          initialData={modalState.record}
          trips={trips}
          categories={categories}
          subcategories={subcategories}
          onSave={handleSaveRecord}
          onCancel={closeModal}
        />
      </Modal>
    </>
  );
};

export default Financeiro;
