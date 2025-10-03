// Utilitários para máscaras de input

export const masks = {
  cpf: '999.999.999-99',
  cnpj: '99.999.999/9999-99',
  phone: '(99) 99999-9999',
  cep: '99999-999',
  plate: 'AAA-9*99', // Placas Mercosul: ABC-1D23 ou antigas ABC-1234
  date: '99/99/9999',
  time: '99:99',
  currency: 'R$ 999.999.999,99',
};

// Função para aplicar máscara de CPF/CNPJ dinamicamente
export const applyCpfCnpjMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 11) {
    // CPF: 999.999.999-99
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    // CNPJ: 99.999.999/9999-99
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

// Função para aplicar máscara de telefone
export const applyPhoneMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 10) {
    // (99) 9999-9999
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    // (99) 99999-9999
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

// Função para aplicar máscara de placa (Mercosul ou antiga)
export const applyPlateMask = (value: string): string => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.length <= 3) {
    return cleaned;
  } else {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
  }
};

// Função para aplicar máscara de data
export const applyDateMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '');

  return numbers
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})\d+?$/, '$1');
};

// Função para aplicar máscara de CEP
export const applyCepMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '');

  return numbers
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// Função para remover máscara
export const removeMask = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Validações
export const isValidCPF = (cpf: string): boolean => {
  const numbers = removeMask(cpf);

  if (numbers.length !== 11 || /^(\d)\1+$/.test(numbers)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;

  return true;
};

export const isValidCNPJ = (cnpj: string): boolean => {
  const numbers = removeMask(cnpj);

  if (numbers.length !== 14 || /^(\d)\1+$/.test(numbers)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(numbers.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(numbers.charAt(13))) return false;

  return true;
};
