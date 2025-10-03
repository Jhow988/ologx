import React from 'react';
import InputMask from 'react-input-mask';
import {
  applyPhoneMask,
  applyCpfCnpjMask,
  applyPlateMask,
  applyDateMask,
  applyCepMask,
} from '../../utils/masks';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask?: 'phone' | 'cpf' | 'cnpj' | 'cpfCnpj' | 'plate' | 'date' | 'cep' | string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  label,
  error,
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let maskedValue = rawValue;

    // Aplicar máscaras customizadas
    switch (mask) {
      case 'phone':
        maskedValue = applyPhoneMask(rawValue);
        break;
      case 'cpfCnpj':
        maskedValue = applyCpfCnpjMask(rawValue);
        break;
      case 'plate':
        maskedValue = applyPlateMask(rawValue);
        break;
      case 'date':
        maskedValue = applyDateMask(rawValue);
        break;
      case 'cep':
        maskedValue = applyCepMask(rawValue);
        break;
      default:
        maskedValue = rawValue;
    }

    onChange(maskedValue);
  };

  // Máscaras fixas para react-input-mask
  const getMaskPattern = (): string | undefined => {
    switch (mask) {
      case 'cpf':
        return '999.999.999-99';
      case 'cnpj':
        return '99.999.999/9999-99';
      case 'phone':
        return value.replace(/\D/g, '').length <= 10
          ? '(99) 9999-99999'
          : '(99) 99999-9999';
      case 'cep':
        return '99999-999';
      case 'date':
        return '99/99/9999';
      default:
        return typeof mask === 'string' && mask.includes('9') ? mask : undefined;
    }
  };

  const maskPattern = getMaskPattern();
  const baseClassName = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-bg-secondary dark:border-dark-border dark:text-dark-text ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
  } ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
          {label}
        </label>
      )}

      {maskPattern && !['phone', 'cpfCnpj', 'plate', 'date', 'cep'].includes(mask || '') ? (
        <InputMask
          mask={maskPattern}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClassName}
          {...props}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className={baseClassName}
          {...props}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default MaskedInput;
