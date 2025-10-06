import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Frota from './pages/Cadastros/Frota';
import Usuarios from './pages/Cadastros/Usuarios';
import Clientes from './pages/Cadastros/Clientes';
import Viagens from './pages/Viagens';
import NovoServico from './pages/NovoServico';
import EditarServico from './pages/EditarServico';
import Manutencao from './pages/Manutencao';
import Financeiro from './pages/Financeiro';
import Relatorios from './pages/Relatorios';
import Fechamento from './pages/Fechamento';
import Alertas from './pages/Alertas';
import Empresa from './pages/Configuracoes/Empresa';
import Perfis from './pages/Configuracoes/Perfis';
import PerfilForm from './pages/Configuracoes/PerfilForm';
import CategoriasFinanceiras from './pages/Cadastros/CategoriasFinanceiras';
import Profile from './pages/Profile';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import SuperAdminEmpresas from './pages/SuperAdmin/Empresas';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import { Toaster } from 'react-hot-toast';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-xl font-medium text-gray-700 dark:text-dark-text-secondary">Carregando...</div>
      </div>
    );
  }

  // Permitir acesso a /reset-password mesmo se estiver autenticado
  // (necessário para recuperação de senha via email)
  if (location.pathname === '/reset-password') {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user?.isSuperAdmin) {
    return (
      <SuperAdminLayout>
        <Routes>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/admin/empresas" element={<SuperAdminEmpresas />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </SuperAdminLayout>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="cadastros/frota" element={<Frota />} />
        <Route path="cadastros/usuarios" element={<Usuarios />} />
        <Route path="cadastros/clientes" element={<Clientes />} />
        <Route path="cadastros/categorias" element={<CategoriasFinanceiras />} />
        <Route path="servicos" element={<Viagens />} />
        <Route path="servicos/novo" element={<NovoServico />} />
        <Route path="servicos/editar/:id" element={<EditarServico />} />
        <Route path="manutencao" element={<Manutencao />} />
        <Route path="financeiro" element={<Navigate to="/financeiro/pagar" replace />} />
        <Route path="financeiro/:view" element={<Financeiro />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="fechamento" element={<Fechamento />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="configuracoes" element={<Navigate to="/configuracoes/empresa" replace />} />
        <Route path="configuracoes/empresa" element={<Empresa />} />
        <Route path="configuracoes/perfis" element={<Perfis />} />
        <Route path="configuracoes/perfis/novo" element={<PerfilForm />} />
        <Route path="configuracoes/perfis/:id" element={<PerfilForm />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
