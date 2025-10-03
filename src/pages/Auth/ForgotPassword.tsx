import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Truck, Mail, ArrowLeft } from 'lucide-react';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Email de recuperação enviado com sucesso!');
    } catch (error: any) {
      toast.error(error.error_description || error.message || 'Erro ao enviar email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Email Enviado!</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Enviamos um link de recuperação de senha para <strong>{email}</strong>.
            <br />
            <br />
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </p>
          <Link to="/login">
            <Button variant="primary" icon={ArrowLeft}>Voltar para o Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Esqueceu a Senha?</h1>
          <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
            Não se preocupe! Digite seu email abaixo e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-dark-text"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full" icon={Mail}>
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
