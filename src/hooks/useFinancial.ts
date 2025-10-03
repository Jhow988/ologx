import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type FinancialRecord = Database['public']['Tables']['financial_records']['Row'];
type FinancialRecordInsert = Database['public']['Tables']['financial_records']['Insert'];
type FinancialRecordUpdate = Database['public']['Tables']['financial_records']['Update'];

type FinancialCategory = Database['public']['Tables']['financial_categories']['Row'];
type FinancialCategoryInsert = Database['public']['Tables']['financial_categories']['Insert'];

type FinancialSubcategory = Database['public']['Tables']['financial_subcategories']['Row'];
type FinancialSubcategoryInsert = Database['public']['Tables']['financial_subcategories']['Insert'];

// Tipo expandido com joins
export type FinancialRecordWithRelations = FinancialRecord & {
  category?: FinancialCategory;
  subcategory?: FinancialSubcategory | null;
};

export function useFinancial() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FinancialRecordWithRelations[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [subcategories, setSubcategories] = useState<FinancialSubcategory[]>([]);
  const [loading, setLoading] = useState(true);

  // ============ CATEGORIAS ============

  const fetchCategories = async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('company_id', user.companyId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const createCategory = async (name: string) => {
    if (!user?.companyId) {
      toast.error('Usuário não possui empresa associada');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert([{ name, company_id: user.companyId }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      await fetchCategories();
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
      return null;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      await fetchCategories();
      return true;
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
      return false;
    }
  };

  // ============ SUBCATEGORIAS ============

  const fetchSubcategories = async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('financial_subcategories')
        .select('*')
        .eq('company_id', user.companyId)
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar subcategorias:', error);
      toast.error('Erro ao carregar subcategorias');
    }
  };

  const createSubcategory = async (categoryId: string, name: string) => {
    if (!user?.companyId) {
      toast.error('Usuário não possui empresa associada');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('financial_subcategories')
        .insert([{
          name,
          category_id: categoryId,
          company_id: user.companyId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Subcategoria criada com sucesso!');
      await fetchSubcategories();
      return data;
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error);
      toast.error('Erro ao criar subcategoria');
      return null;
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Subcategoria excluída com sucesso!');
      await fetchSubcategories();
      return true;
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      toast.error('Erro ao excluir subcategoria');
      return false;
    }
  };

  // ============ LANÇAMENTOS FINANCEIROS ============

  const fetchRecords = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          category:financial_categories(*),
          subcategory:financial_subcategories(*)
        `)
        .eq('company_id', user.companyId)
        .order('due_date', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      toast.error('Erro ao carregar lançamentos financeiros');
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (recordData: Omit<FinancialRecordInsert, 'company_id' | 'id'>) => {
    if (!user?.companyId) {
      toast.error('Usuário não possui empresa associada');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('financial_records')
        .insert([{
          ...recordData,
          company_id: user.companyId
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lançamento criado com sucesso!');
      await fetchRecords();
      return data;
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
      toast.error('Erro ao criar lançamento');
      return null;
    }
  };

  const updateRecord = async (id: string, recordData: FinancialRecordUpdate) => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Lançamento atualizado com sucesso!');
      await fetchRecords();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar lançamento:', error);
      toast.error('Erro ao atualizar lançamento');
      return null;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Lançamento excluído com sucesso!');
      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      toast.error('Erro ao excluir lançamento');
      return false;
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.companyId) {
      fetchCategories();
      fetchSubcategories();
      fetchRecords();
    }
  }, [user?.companyId]);

  return {
    // Records
    records,
    loading,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,

    // Categories
    categories,
    fetchCategories,
    createCategory,
    deleteCategory,

    // Subcategories
    subcategories,
    fetchSubcategories,
    createSubcategory,
    deleteSubcategory
  };
}
