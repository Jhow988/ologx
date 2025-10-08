import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Check } from 'lucide-react';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from '../../components/UI/PasswordStrengthIndicator';
import { validatePassword } from '../../utils/passwordValidation';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event confirms that Supabase has processed the token from the URL
        // and a temporary session is active. The user can now update their password.
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    // Validação com regras de segurança aprimoradas
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || 'A senha não atende aos requisitos de segurança');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      toast.error(error.error_description || error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Nova Senha</h1>
          <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Nova senha (mínimo 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <PasswordStrengthIndicator password={password} />

          <div className="relative">
            <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full" icon={Lock}>
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
