import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Truck, Mail, Lock, User, Building } from 'lucide-react';
import Button from '../../components/UI/Button';
import PasswordStrengthIndicator from '../../components/UI/PasswordStrengthIndicator';
import { validatePassword } from '../../utils/passwordValidation';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validação no frontend com regras de segurança aprimoradas
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0] || 'A senha não atende aos requisitos de segurança.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      if (error) {
        // Traduzir mensagens de erro do Supabase
        let errorMessage = error.message;
        if (error.message.includes('Password should be at least 6 characters')) {
          errorMessage = 'A senha deve ter no mínimo 6 caracteres.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido.';
        }
        throw new Error(errorMessage);
      }

      if (data.user?.identities?.length === 0) {
        throw new Error("Este email já está em uso. Tente fazer login.");
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Verifique seu Email</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Enviamos um link de confirmação para <strong>{email}</strong>. Por favor, clique no link para ativar sua conta.
          </p>
          <Link to="/login">
            <Button variant="primary">Voltar para o Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Crie sua Conta</h1>
          <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">Comece a gerenciar sua transportadora hoje mesmo.</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSignUp}>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Nome da Empresa" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Seu Nome Completo" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="password" placeholder="Senha (mínimo 8 caracteres)" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text" />
          </div>

          <PasswordStrengthIndicator password={password} />

          {error && <p className="text-sm text-center text-red-500">{error}</p>}

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600 dark:text-dark-text-secondary">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
