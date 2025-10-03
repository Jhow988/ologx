import React from 'react';
import { validatePassword, getPasswordStrengthLabel, getPasswordStrengthColor } from '../../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true
}) => {
  if (!password) return null;

  const strength = validatePassword(password);
  const strengthLabel = getPasswordStrengthLabel(strength.score);
  const strengthColor = getPasswordStrengthColor(strength.score);

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Força da senha:</span>
          <span
            className="font-semibold"
            style={{ color: strengthColor }}
          >
            {strengthLabel}
          </span>
        </div>

        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: level <= strength.score ? strengthColor : '#e5e7eb'
              }}
            />
          ))}
        </div>
      </div>

      {/* Requisitos */}
      {showRequirements && (
        <div className="space-y-1 text-xs">
          <RequirementItem
            met={password.length >= 8}
            text="Mínimo 8 caracteres"
          />
          <RequirementItem
            met={/[A-Z]/.test(password)}
            text="Uma letra maiúscula"
          />
          <RequirementItem
            met={/[a-z]/.test(password)}
            text="Uma letra minúscula"
          />
          <RequirementItem
            met={/[0-9]/.test(password)}
            text="Um número"
          />
          <RequirementItem
            met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}
            text="Um caractere especial (!@#$%&*)"
          />
        </div>
      )}

      {/* Erros */}
      {strength.errors.length > 0 && (
        <div className="text-xs text-red-600 dark:text-red-400 space-y-1 mt-2">
          {strength.errors.map((error, index) => (
            <div key={index} className="flex items-start gap-1">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sugestões */}
      {strength.suggestions.length > 0 && strength.score < 3 && (
        <div className="text-xs text-amber-600 dark:text-amber-400 space-y-1 mt-2">
          {strength.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-1">
              <span>💡</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
      <span className="text-base">
        {met ? '✓' : '○'}
      </span>
      <span>{text}</span>
    </div>
  );
};

export default PasswordStrengthIndicator;
