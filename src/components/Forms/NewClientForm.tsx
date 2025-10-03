import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import Button from '../UI/Button';
import MaskedInput from '../UI/MaskedInput';
import { Save, Search } from 'lucide-react';
import { useCep } from '../../hooks/useCep';
import { useCnpj } from '../../hooks/useCnpj';

interface NewClientFormProps {
  initialData?: Client | null;
  onSave: (client: Partial<Client>) => void;
  onCancel: () => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ initialData, onSave, onCancel }) => {
  const getInitialState = () => {
    // Separate street and number from address
    const addressParts = initialData?.address?.split(', ') || [];
    const street = addressParts[0] || '';
    const number = addressParts[1] || '';

    return {
      name: initialData?.name || '',
      document: initialData?.document || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      street: street,
      number: number,
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip_code: (initialData as any)?.zip_code || '',
    };
  };

  const [formData, setFormData] = useState(getInitialState());
  const { fetchAddress, loading: loadingCep } = useCep();
  const { fetchCompany, loading: loadingCnpj } = useCnpj();

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaskedChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnpjBlur = async () => {
    const cleanDocument = formData.document.replace(/\D/g, '');

    // Only search if it's a CNPJ (14 digits)
    if (cleanDocument.length === 14) {
      const company = await fetchCompany(formData.document);
      if (company) {
        // Separate street and number from company address
        const addressParts = company.address?.split(', ') || [];
        const street = addressParts[0] || '';
        const number = addressParts[1] || '';

        setFormData(prev => ({
          ...prev,
          name: company.name || prev.name,
          email: company.email || prev.email,
          phone: company.phone || prev.phone,
          street: street || prev.street,
          number: number || prev.number,
          city: company.city || prev.city,
          state: company.state || prev.state,
          zip_code: company.cep || prev.zip_code,
        }));
      }
    }
  };

  const handleCepBlur = async () => {
    if (formData.zip_code && formData.zip_code.replace(/\D/g, '').length === 8) {
      const address = await fetchAddress(formData.zip_code);
      if (address) {
        setFormData(prev => ({
          ...prev,
          street: address.street || prev.street,
          city: address.city || prev.city,
          state: address.state || prev.state,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.document || !formData.email) {
      alert('Por favor, preencha Nome/Empresa, CNPJ/CPF e Email.');
      return;
    }

    // Combine street and number into address field
    const fullAddress = formData.number
      ? `${formData.street}, ${formData.number}`
      : formData.street;

    const clientData = {
      ...formData,
      address: fullAddress,
    };

    // Remove temporary fields
    const { street, number, ...finalData } = clientData;

    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Nome/Empresa</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div className="relative">
          <MaskedInput
            mask="cpfCnpj"
            label="CNPJ/CPF *"
            value={formData.document}
            onChange={(value) => handleMaskedChange('document', value)}
            onBlur={handleCnpjBlur}
            placeholder="00.000.000/0000-00 ou 000.000.000-00"
            required
          />
          {loadingCnpj && (
            <div className="absolute right-3 top-9">
              <Search className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div className="relative">
          <MaskedInput
            mask="cep"
            label="CEP"
            value={formData.zip_code}
            onChange={(value) => handleMaskedChange('zip_code', value)}
            onBlur={handleCepBlur}
            placeholder="00000-000"
          />
          {loadingCep && (
            <div className="absolute right-3 top-9">
              <Search className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Rua/Logradouro</label>
          <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Número</label>
          <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="123" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Cidade</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Estado</label>
          <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
        </div>
        <div>
          <MaskedInput
            mask="phone"
            label="Telefone *"
            value={formData.phone}
            onChange={(value) => handleMaskedChange('phone', value)}
            placeholder="(11) 98765-4321"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-dark-border mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" icon={Save}>Salvar Cliente</Button>
      </div>
    </form>
  );
};

export default NewClientForm;
