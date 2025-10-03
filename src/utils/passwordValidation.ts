// Utilitário de validação de senha

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4 (fraca a forte)
  errors: string[];
  suggestions: string[];
}

export const validatePassword = (password: string): PasswordStrength => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Requisitos mínimos
  if (password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres');
  } else {
    score++;
  }

  // Letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
    suggestions.push('Adicione letras maiúsculas (A-Z)');
  } else {
    score++;
  }

  // Letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
    suggestions.push('Adicione letras minúsculas (a-z)');
  } else {
    score++;
  }

  // Número
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
    suggestions.push('Adicione números (0-9)');
  } else {
    score++;
  }

  // Caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
    suggestions.push('Adicione caracteres especiais (!@#$%&*)');
  } else {
    score++;
  }

  // Verificações adicionais para melhorar o score
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Senhas comuns (blacklist básica)
  const commonPasswords = [
    '12345678', 'password', 'senha123', 'admin123',
    'qwerty123', '123456789', 'password123'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Esta senha é muito comum. Escolha uma senha mais segura');
    score = 0;
  }

  // Sequências repetitivas
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Evite repetir o mesmo caractere');
    score = Math.max(0, score - 1);
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    score: Math.min(4, score), // Máximo 4
    errors,
    suggestions
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Muito fraca';
    case 2:
      return 'Fraca';
    case 3:
      return 'Média';
    case 4:
      return 'Forte';
    default:
      return 'Muito fraca';
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return '#ef4444'; // red-500
    case 2:
      return '#f59e0b'; // amber-500
    case 3:
      return '#3b82f6'; // blue-500
    case 4:
      return '#10b981'; // green-500
    default:
      return '#ef4444';
  }
};
