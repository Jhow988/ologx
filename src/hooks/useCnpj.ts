import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  municipio: string;
  uf: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  ddd_telefone_1: string;
  email: string;
}

export interface CompanyData {
  name: string;
  fantasyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  cep: string;
}

export const useCnpj = () => {
  const [loading, setLoading] = useState(false);

  const fetchCompany = async (cnpj: string): Promise<CompanyData | null> => {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido. Digite um CNPJ com 14 dígitos.');
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('CNPJ não encontrado.');
        } else {
          toast.error('Erro ao buscar CNPJ. Tente novamente.');
        }
        return null;
      }

      const data: CnpjData = await response.json();

      toast.success('Empresa encontrada!');

      return {
        name: data.razao_social || '',
        fantasyName: data.nome_fantasia || '',
        email: data.email || '',
        phone: data.ddd_telefone_1 || '',
        address: `${data.logradouro}${data.numero ? ', ' + data.numero : ''}${data.complemento ? ' - ' + data.complemento : ''}`,
        city: data.municipio || '',
        state: data.uf || '',
        cep: data.cep || '',
      };
    } catch (error) {
      toast.error('Erro ao buscar CNPJ. Verifique sua conexão.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchCompany, loading };
};
