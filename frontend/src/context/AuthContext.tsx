import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api';
import { User } from '../types/user';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export interface UserRole {
  isAdmin: boolean;
  isLeader: boolean;
  isDirector: boolean;
  isEmployee: boolean;
  isActive: boolean;
  role: 'admin' | 'director' | 'leader' | 'collaborator';
}

export const useUserRole = (): UserRole => {
  const { profile } = useAuth();
  
  if (!profile) {
    return {
      isAdmin: false,
      isLeader: false,
      isDirector: false,
      isEmployee: true,
      isActive: true,
      role: 'collaborator'
    };
  }

  let role: 'admin' | 'director' | 'leader' | 'collaborator' = 'collaborator';
  
  if (profile.email === 'admin@empresa.com' && profile.is_director) {
    role = 'admin';
  } else if (profile.is_director) {
    role = 'director';
  } else if (profile.is_leader) {
    role = 'leader';
  }

  return {
    isAdmin: role === 'admin',
    isLeader: profile.is_leader || false,
    isDirector: profile.is_director || false,
    isEmployee: !profile.is_leader && !profile.is_director,
    isActive: profile.active !== false,
    role
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listener para mudanças de autenticação (incluindo refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          // Atualiza o token no localStorage
          localStorage.setItem('access_token', session.access_token);

          // Se for TOKEN_REFRESHED, busca o perfil atualizado
          if (event === 'TOKEN_REFRESHED' && session.user) {
            const { data: profileData } = await supabase
              .from('users')
              .select('*, is_master')
              .eq('id', session.user.id)
              .single();

            if (profileData) {
              setUser(profileData);
              setProfile(profileData);
              setIsAuthenticated(true);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      } else if (event === 'TOKEN_EXPIRED') {
        // O Supabase tentará renovar automaticamente, mas se falhar:
        console.warn('Token expirado, tentando renovar...');
      }
    });

    // Cleanup: remove o listener quando o componente desmontar
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      // Primeiro verifica se há sessão no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Se houver sessão, busca o perfil do usuário
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*, is_master')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('AuthContext - Error loading profile:', error);
      }

      if (!error && profileData) {
        console.log('AuthContext - Loaded profile data:', profileData);
        console.log('AuthContext - is_master field:', profileData.is_master);
        setUser(profileData);
        setProfile(profileData);
        setIsAuthenticated(true);
        
        // Salva o token no localStorage para uso com a API
        localStorage.setItem('access_token', session.access_token);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Faz login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message || 'Erro ao fazer login');
        return false;
      }

      if (!data.user || !data.session) {
        toast.error('Erro ao fazer login');
        return false;
      }

      // Busca o perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileData) {
        toast.error('Erro ao buscar perfil do usuário');
        return false;
      }

      // Verifica se o usuário está ativo
      if (!profileData.active) {
        await supabase.auth.signOut();
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        return false;
      }

      // Salva os dados
      localStorage.setItem('access_token', data.session.access_token);
      setUser(profileData);
      setProfile(profileData);
      setIsAuthenticated(true);
      
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!profile) return;

    try {
      // Garantir consistência dos dados antes de enviar
      const updateData = { ...updates };
      
      // Se não tem filhos, limpar array de faixas etárias
      if ('has_children' in updateData && !updateData.has_children) {
        updateData.children_age_ranges = [];
      }
      
      // Se não pratica esportes, limpar array de esportes
      if ('practices_sports' in updateData && !updateData.practices_sports) {
        updateData.sports = [];
      }
      
      // Se não torce para time, limpar nome do time
      if ('supports_team' in updateData && !updateData.supports_team) {
        updateData.team_name = null;
      }

      // Atualiza no Supabase
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        // Atualizar também o user se necessário
        if (user && user.id === profile.id) {
          setUser(data);
        }
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  // Add resetPassword implementation
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Erro ao enviar email de recuperação');
      throw error;
    }
  };

  const value = {
    user,
    profile,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};