import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Tag, Loader, FolderOpen } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Table from '../../components/UI/Table';
import { FinancialCategory, FinancialSubcategory } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const CategoryForm: React.FC<{
  onSave: (data: { name: string; type: string }) => void;
  onCancel: () => void;
  initialName?: string;
  initialType?: string;
}> = ({ onSave, onCancel, initialName = '', initialType = 'expense' }) => {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Tipo *</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Nome da Categoria</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" placeholder="Ex: Frete, Combustível, Salários" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};

const SubcategoryForm: React.FC<{
  onSave: (data: { name: string; category_id: string }) => void;
  onCancel: () => void;
  initialName?: string;
  initialCategoryId?: string;
  categories: FinancialCategory[];
}> = ({ onSave, onCancel, initialName = '', initialCategoryId = '', categories }) => {
  const [name, setName] = useState(initialName);
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('Selecione uma categoria');
      return;
    }
    onSave({ name, category_id: categoryId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Categoria Principal *</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
        >
          <option value="">Selecione uma categoria</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Nome da Subcategoria</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
          placeholder="Ex: Frete, Combustível, Manutenção"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
};

const CategoriasFinanceiras: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [subcategories, setSubcategories] = useState<FinancialSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  const [modalState, setModalState] = useState<{
    type: 'new_cat' | 'edit_cat' | 'new_sub' | 'edit_sub' | 'delete_cat' | 'delete_sub' | null;
    item: any | null;
  }>({ type: null, item: null });

  const fetchData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [catRes, subcatRes] = await Promise.all([
      supabase.from('financial_categories').select('*').eq('company_id', user.companyId).order('name'),
      supabase.from('financial_subcategories').select('*').eq('company_id', user.companyId).order('name')
    ]);
    if (catRes.error) {
      console.error('Error fetching categories:', catRes.error);
      toast.error('Erro ao carregar categorias');
    }
    if (subcatRes.error) {
      console.error('Error fetching subcategories:', subcatRes.error);
      toast.error('Erro ao carregar subcategorias');
    }
    setCategories(catRes.data as FinancialCategory[] || []);
    setSubcategories(subcatRes.data as FinancialSubcategory[] || []);
    setLoading(false);
  }, [user?.companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveCategory = async (data: { name: string; type: string }) => {
    if (!user?.companyId || !data.name) return;
    const { type, item } = modalState;

    try {
      if (type === 'new_cat') {
        const { error } = await supabase.from('financial_categories').insert({
          name: data.name,
          type: data.type,
          company_id: user.companyId
        });
        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }
      if (type === 'edit_cat') {
        const { error } = await supabase.from('financial_categories').update({
          name: data.name,
          type: data.type
        }).eq('id', item.id);
        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      }
      await fetchData();
      closeModal();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.message || 'Erro ao salvar categoria');
    }
  };

  const handleSaveSubcategory = async (data: { name: string; category_id: string }) => {
    if (!user?.companyId || !data.name) return;
    const { type, item } = modalState;

    try {
      if (type === 'new_sub') {
        const { error } = await supabase.from('financial_subcategories').insert({
          name: data.name,
          category_id: data.category_id,
          company_id: user.companyId
        });
        if (error) throw error;
        toast.success('Subcategoria criada com sucesso!');
      }
      if (type === 'edit_sub') {
        const { error } = await supabase.from('financial_subcategories').update({
          name: data.name,
          category_id: data.category_id
        }).eq('id', item.id);
        if (error) throw error;
        toast.success('Subcategoria atualizada com sucesso!');
      }
      await fetchData();
      closeModal();
    } catch (error: any) {
      console.error('Erro ao salvar subcategoria:', error);
      toast.error(error.message || 'Erro ao salvar subcategoria');
    }
  };

  const handleDelete = async () => {
    const { type, item } = modalState;

    try {
      if (type === 'delete_cat') {
        // Verificar se há subcategorias vinculadas
        const relatedSubs = subcategories.filter(s => s.category_id === item.id);
        if (relatedSubs.length > 0) {
          toast.error(`Não é possível excluir. Esta categoria possui ${relatedSubs.length} subcategoria(s) vinculada(s).`);
          closeModal();
          return;
        }
        const { error } = await supabase.from('financial_categories').delete().eq('id', item.id);
        if (error) throw error;
        toast.success('Categoria excluída com sucesso!');
      }
      if (type === 'delete_sub') {
        const { error } = await supabase.from('financial_subcategories').delete().eq('id', item.id);
        if (error) throw error;
        toast.success('Subcategoria excluída com sucesso!');
      }
      await fetchData();
      closeModal();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  const closeModal = () => setModalState({ type: null, item: null });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  };

  const categoryColumns = [
    {
      key: 'type',
      header: 'Tipo',
      render: (type: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
          type === 'income'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {type === 'income' ? 'Receita' : 'Despesa'}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Nome da Categoria',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      key: 'subcategories_count',
      header: 'Subcategorias',
      render: (_: any, cat: FinancialCategory) => {
        const count = subcategories.filter(s => s.category_id === cat.id).length;
        return <span className="text-sm text-gray-600 dark:text-dark-text-secondary">{count}</span>;
      }
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, cat: FinancialCategory) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setModalState({ type: 'edit_cat', item: cat })} />
          <Button size="sm" variant="ghost" icon={Trash2} className="text-red-500 hover:text-red-600" onClick={() => setModalState({ type: 'delete_cat', item: cat })} />
        </div>
      ),
    },
  ];

  const subcategoryColumns = [
    {
      key: 'name',
      header: 'Nome da Subcategoria',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      key: 'category_id',
      header: 'Categoria Principal',
      render: (categoryId: string) => (
        <span className="text-sm text-gray-600 dark:text-dark-text-secondary">{getCategoryName(categoryId)}</span>
      )
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, sub: FinancialSubcategory) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setModalState({ type: 'edit_sub', item: sub })} />
          <Button size="sm" variant="ghost" icon={Trash2} className="text-red-500 hover:text-red-600" onClick={() => setModalState({ type: 'delete_sub', item: sub })} />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Categorias Financeiras</h1>
            <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie categorias e subcategorias para contas a pagar e receber</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-dark-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categorias ({categories.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('subcategories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subcategories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text-secondary dark:hover:text-dark-text'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Subcategorias ({subcategories.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <Card>
          {activeTab === 'categories' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Categorias Principais</h2>
                <Button icon={Plus} onClick={() => setModalState({ type: 'new_cat', item: null })}>Nova Categoria</Button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text">Nenhuma categoria cadastrada</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">Comece criando sua primeira categoria.</p>
                  <div className="mt-6">
                    <Button icon={Plus} onClick={() => setModalState({ type: 'new_cat', item: null })}>Nova Categoria</Button>
                  </div>
                </div>
              ) : (
                <Table columns={categoryColumns} data={categories} />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Subcategorias</h2>
                <Button
                  icon={Plus}
                  onClick={() => setModalState({ type: 'new_sub', item: null })}
                  disabled={categories.length === 0}
                >
                  Nova Subcategoria
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader className="animate-spin h-8 w-8 text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text">Nenhuma categoria cadastrada</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">Crie pelo menos uma categoria antes de adicionar subcategorias.</p>
                </div>
              ) : subcategories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-text">Nenhuma subcategoria cadastrada</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">Comece criando sua primeira subcategoria.</p>
                  <div className="mt-6">
                    <Button icon={Plus} onClick={() => setModalState({ type: 'new_sub', item: null })}>Nova Subcategoria</Button>
                  </div>
                </div>
              ) : (
                <Table columns={subcategoryColumns} data={subcategories} />
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <Modal isOpen={!!modalState.type} onClose={closeModal} title={
        modalState.type?.includes('delete') ? 'Confirmar Exclusão' :
        modalState.type?.includes('cat') ? `${modalState.type?.includes('new') ? 'Nova' : 'Editar'} Categoria` :
        `${modalState.type?.includes('new') ? 'Nova' : 'Editar'} Subcategoria`
      }>
        {['new_cat', 'edit_cat'].includes(modalState.type || '') && (
          <CategoryForm
            onSave={handleSaveCategory}
            onCancel={closeModal}
            initialName={modalState.item?.name}
            initialType={modalState.item?.type}
          />
        )}
        {['new_sub', 'edit_sub'].includes(modalState.type || '') && (
          <SubcategoryForm
            onSave={handleSaveSubcategory}
            onCancel={closeModal}
            initialName={modalState.item?.name}
            initialCategoryId={modalState.item?.category_id}
            categories={categories}
          />
        )}
        {['delete_cat', 'delete_sub'].includes(modalState.type || '') && (
          <div>
            <p className="text-gray-800 dark:text-dark-text">
              Tem certeza que deseja excluir "{modalState.item?.name}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button variant="outline" onClick={closeModal}>Cancelar</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={handleDelete}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CategoriasFinanceiras;
