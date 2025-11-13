import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';
import { roles } from '../config/permissions';

interface AuthUser extends User {
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<AuthUser> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      throw new Error("Could not fetch user profile. This might be due to RLS policies.");
    }

    const userRole = profile.role;
    let permissions: string[] = [];

    // Se for super admin, tem todas as permissões
    if (profile.is_super_admin) {
      permissions = Object.values(roles).flatMap(r => r.permissions);
    }
    // Se for role padrão (admin), buscar permissões do config
    else if (userRole === 'admin') {
      permissions = roles.admin?.permissions || [];
    }
    // Se for UUID (custom role), buscar permissões do banco
    else if (userRole && userRole.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        const { data: customRole } = await (supabase as any)
          .from('custom_roles')
          .select('permissions')
          .eq('id', userRole)
          .single();

        permissions = customRole?.permissions || [];
      } catch (err) {
        console.error('Error fetching custom role permissions:', err);
        permissions = [];
      }
    }
    // Fallback para roles antigos que ainda podem existir
    else {
      const roleKey = userRole as keyof typeof roles;
      permissions = roles[roleKey]?.permissions || [];
    }

    return {
      id: profile.id,
      companyId: profile.company_id,
      name: profile.full_name || supabaseUser.email || 'Usuário',
      email: supabaseUser.email || '',
      role: userRole as any,
      status: 'active',
      isSuperAdmin: profile.is_super_admin,
      permissions: permissions,
    };
  }, []);

  const createFallbackUser = (supabaseUser: SupabaseUser): AuthUser => {
    console.warn("Creating a fallback user. The app will have limited functionality.");
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.email || 'Usuário (Erro)',
      companyId: null,
      role: 'operator',
      isSuperAdmin: false,
      permissions: [],
      status: 'active',
    };
  };

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (session: Session | null) => {
      if (!isMounted) return;

      try {
        setSession(session);
        if (session?.user) {
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (isMounted) setUser(userProfile);
          } catch (profileError) {
            if (isMounted) setUser(createFallbackUser(session.user));
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (e) {
        console.error("Critical error in auth handler:", e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted && loading) {
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface CanProps {
  perform: string;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ perform, children }) => {
  const { user } = useAuth();

  if (!user) return null;
  
  if (user.isSuperAdmin) return <>{children}</>;

  const requiredPermissions = perform.split('|');
  const hasPermission = requiredPermissions.some(p => user.permissions.includes(p));

  return <>{hasPermission ? children : null}</>;
};
