import React, { useState, useEffect, useCallback } from 'react';
import { Save, CheckCircle, Loader, Building2, Mail, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import MaskedInput from '../../components/UI/MaskedInput';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface CompanySettings {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

const Empresa: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<CompanySettings>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fetchingCnpj, setFetchingCnpj] = useState(false);

  const fetchCompanyData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, cnpj, email, phone, address, city, state, zip_code')
        .eq('id', user.companyId)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          name: data.name || '',
          cnpj: data.cnpj || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      toast.error(`Erro ao carregar os dados da empresa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleMaskedChange = (name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));

    // Auto-fetch company data when CNPJ is complete
    if (name === 'cnpj' && value.replace(/\D/g, '').length === 14) {
      fetchCnpjData(value);
    }
  };

  const fetchCnpjData = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido');
      return;
    }

    setFetchingCnpj(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

      if (!response.ok) {
        throw new Error('CNPJ não encontrado');
      }

      const data = await response.json();

      // Update settings with fetched data
      setSettings(prev => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia || prev.name,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `${data.ddd_telefone_1}` : prev.phone,
        address: `${data.logradouro}${data.numero ? ', ' + data.numero : ''}${data.complemento ? ' - ' + data.complemento : ''}`,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
        zip_code: data.cep || prev.zip_code
      }));

      toast.success('Dados da empresa preenchidos automaticamente!');
    } catch (error: any) {
      console.error('Error fetching CNPJ data:', error);
      toast.error('Não foi possível buscar os dados do CNPJ. Preencha manualmente.');
    } finally {
      setFetchingCnpj(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    // Validation
    if (!settings.name || !settings.cnpj || !settings.email) {
      toast.error('Por favor, preencha os campos obrigatórios: Nome, CNPJ e Email');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: settings.name,
          cnpj: settings.cnpj,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zip_code: settings.zip_code
        })
        .eq('id', user.companyId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_activity', {
        p_action: 'update',
        p_entity_type: 'company',
        p_entity_id: user.companyId,
        p_details: {
          name: settings.name,
          updated_fields: Object.keys(settings)
        }
      });

      setShowSuccess(true);
      toast.success('Dados da empresa atualizados com sucesso!');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving company data:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-dark-text-secondary">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-accent/10 rounded-lg">
          <Building2 className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Dados da Empresa</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">Gerencie as informações da sua empresa</p>
        </div>
      </div>

      {/* Alert Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">Mantenha seus dados atualizados</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Essas informações são utilizadas em documentos fiscais e comunicações oficiais.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSave} className="space-y-8">
          {/* Company Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              Informações da Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Nome da Empresa *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={settings.name || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text"
                    placeholder="Digite o nome da empresa"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  CNPJ *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <MaskedInput
                    mask="cpfCnpj"
                    value={settings.cnpj || ''}
                    onChange={(value) => handleMaskedChange('cnpj', value)}
                    placeholder="00.000.000/0000-00"
                    className="pl-10"
                    required
                    disabled={fetchingCnpj}
                  />
                  {fetchingCnpj && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Loader className="h-5 w-5 animate-spin text-accent" />
                    </div>
                  )}
                </div>
                {fetchingCnpj && (
                  <p className="text-xs text-accent mt-1">Buscando dados da empresa...</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={settings.email || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text"
                    placeholder="empresa@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <MaskedInput
                    mask="phone"
                    value={settings.phone || ''}
                    onChange={(value) => handleMaskedChange('phone', value)}
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-dark-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  CEP
                </label>
                <MaskedInput
                  mask="cep"
                  value={settings.zip_code || ''}
                  onChange={(value) => handleMaskedChange('zip_code', value)}
                  placeholder="00000-000"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Logradouro
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={settings.address || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text"
                  placeholder="Rua, Avenida, etc"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Cidade
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={settings.city || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text"
                  placeholder="Nome da cidade"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Estado
                </label>
                <select
                  id="state"
                  name="state"
                  value={settings.state || ''}
                  onChange={handleChange as any}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-900 dark:text-dark-text"
                >
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
              * Campos obrigatórios
            </p>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Salvo com sucesso!</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                type="submit"
                variant="primary"
                icon={isSaving ? Loader : Save}
                disabled={isSaving}
                className={isSaving ? 'opacity-50' : ''}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Empresa;
