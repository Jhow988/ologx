import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from '../../components/UI/PasswordStrengthIndicator';
import { validatePassword } from '../../utils/passwordValidation';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeSession = async () => {
      // Log completo da URL para diagnóstico
      console.log('URL completa:', window.location.href);
      console.log('Hash:', window.location.hash);
      console.log('Search:', window.location.search);

      // Processar hash fragments da URL (tokens de convite/recuperação)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');

      console.log('Hash params:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        type,
        error,
        errorCode,
        errorDescription
      });

      // Se há erro na URL, mostrar imediatamente
      if (error) {
        console.error('Erro no link:', { error, errorCode, errorDescription });
        toast.error(`Link inválido: ${errorDescription || error}. Solicite um novo convite.`);
        return;
      }

      // Se temos tokens na URL, estabelecer sessão
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Erro ao estabelecer sessão:', error);
            toast.error('Link inválido ou expirado. Solicite um novo convite.');
            return;
          }

          console.log('Sessão estabelecida com sucesso:', data);
          setIsSessionReady(true);

          // Limpar hash da URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (error) {
          console.error('Erro ao processar tokens:', error);
          toast.error('Erro ao processar link de convite.');
        }
      } else {
        // Verificar se já existe uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Sessão existente:', session);

        if (session) {
          setIsSessionReady(true);
        } else {
          // Aguardar eventos de auth
          setTimeout(async () => {
            const { data: { session: laterSession } } = await supabase.auth.getSession();
            if (laterSession) {
              setIsSessionReady(true);
            } else {
              console.warn('Nenhuma sessão detectada após timeout');
            }
          }, 2000);
        }
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        setIsSessionReady(true);
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

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || 'A senha não atende aos requisitos de segurança');
      return;
    }

    setLoading(true);

    try {
      // Verificar sessão antes de tentar atualizar
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão ao tentar atualizar senha:', session);

      if (!session) {
        toast.error("Sessão expirada ou inválida. Por favor, solicite um novo link.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      if (error.message === "Auth session missing!") {
        toast.error("Sessão expirada ou inválida. Por favor, solicite um novo link.");
      } else {
        toast.error(error.error_description || error.message || 'Erro ao redefinir senha');
      }
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
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Nova senha (mínimo 8 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <PasswordStrengthIndicator password={password} />

          <div className="relative">
            <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirm-password"
              name="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full" icon={loading ? Loader2 : Lock}>
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
