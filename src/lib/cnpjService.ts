/**
 * Serviço para consulta de CNPJ utilizando API pública
 */

interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}

/**
 * Formata o CNPJ no padrão XX.XXX.XXX/XXXX-XX
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) {
    return cnpj;
  }

  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Remove formatação do CNPJ
 */
export const cleanCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

/**
 * Valida se o CNPJ é válido
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cleanCNPJ(cnpj);

  if (cleaned.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  let pos = 5;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }

  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (digit !== parseInt(cleaned.charAt(12))) {
    return false;
  }

  sum = 0;
  pos = 6;

  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }

  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return digit === parseInt(cleaned.charAt(13));
};

/**
 * Consulta dados da empresa através do CNPJ usando a API da ReceitaWS
 */
export const consultarCNPJ = async (cnpj: string): Promise<CnpjData | null> => {
  const cleaned = cleanCNPJ(cnpj);

  if (!validateCNPJ(cleaned)) {
    throw new Error('CNPJ inválido');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado');
      }
      throw new Error('Erro ao consultar CNPJ');
    }

    const data = await response.json();

    // Formata o endereço
    const address = [
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro,
      `${data.municipio} - ${data.uf}`,
      data.cep
    ].filter(Boolean).join(', ');

    return {
      cnpj: formatCNPJ(cleaned),
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      email: data.email || '',
      telefone: data.ddd_telefone_1 || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      cep: data.cep || ''
    };
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    throw error;
  }
};
