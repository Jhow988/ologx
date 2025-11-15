import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Search, Loader, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Table from '../components/UI/Table';
import Modal from '../components/UI/Modal';
import NewFinancialRecordForm from '../components/Forms/NewFinancialRecordForm';
import { FinancialRecord, Trip, FinancialCategory, FinancialSubcategory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const Financeiro: React.FC = () => {
  const { view = 'pagar' } = useParams<{ view: 'pagar' | 'receber' }>();
  const { user } = useAuth();

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [subcategories, setSubcategories] = useState<FinancialSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState<{
    type: 'new' | 'edit' | null;
    record: FinancialRecord | null;
  }>({ type: null, record: null });

  const fetchData = useCallback(async () => {
    if (!user?.companyId) {
        console.log('❌ Financeiro: Sem companyId');
        setLoading(false);
        return;
    };

    console.log('🔄 Financeiro: Buscando dados para company_id:', user.companyId);
    setLoading(true);

    const [recordsRes, tripsRes, categoriesRes, subcategoriesRes] = await Promise.all([
      supabase.from('financial_records').select('*, category:financial_categories(name), subcategory:financial_subcategories(name)').eq('company_id', user.companyId).order('due_date', { ascending: true }),
      supabase.from('trips').select('id, origin, destination, start_date').eq('company_id', user.companyId),
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
  }, [user?.companyId]);

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

    // Converter campos vazios em null para evitar erros de UUID
    const cleanedData = {
      ...data,
      subcategory_id: data.subcategory_id || null,
      related_trip_id: data.related_trip_id || null,
      trip_id: data.trip_id || null,
      vehicle_id: data.vehicle_id || null,
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

  const filteredRecords = useMemo(() => {
    const typeFilter = view === 'pagar' ? 'payable' : 'receivable';
    console.log(`🔍 Filtrando registros - View: ${view}, Type Filter: ${typeFilter}, Total Records: ${records.length}`);

    const filtered = records.filter(record =>
      record.type === typeFilter &&
      record.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log(`✅ Registros filtrados: ${filtered.length}`, filtered);
    return filtered;
  }, [records, view, searchTerm]);

  const getStatusColor = (status: string) => ({
    'paid': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'overdue': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }[status] || 'bg-gray-100');

  const getStatusText = (status: string) => ({
    'paid': 'Pago', 'pending': 'Pendente', 'overdue': 'Vencido',
  }[status] || status);

  const columns = [
    { key: 'description', header: 'Descrição' },
    { key: 'due_date', header: 'Vencimento', render: (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') },
    { key: 'amount', header: 'Valor', render: (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) },
    { key: 'categoryName', header: 'Categoria' },
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
        <Button
          variant={record.status === 'paid' ? 'ghost' : 'primary'}
          size="sm"
          icon={CheckCircle}
          onClick={() => handleToggleStatus(record)}
          title={record.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}
        >
          {record.status === 'paid' ? '' : 'Pagar'}
        </Button>
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

          <div className="flex-1 relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar por descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg" />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table columns={columns} data={filteredRecords} />
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
