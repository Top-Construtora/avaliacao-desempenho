import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

export interface AuthRequest extends Request {
  user?: Database['public']['Tables']['users']['Row'];
  supabase: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token de autenticação não fornecido' 
      });
    }

    // Criar cliente Supabase com o token do usuário
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verificar o token e obter o usuário
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido ou expirado' 
      });
    }

    // Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    // Adicionar user e supabase ao request
    req.user = userData;
    req.supabase = supabase;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno no servidor' 
    });
  }
};

// Middleware para autorização por roles
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    // Verificar se o usuário tem uma das roles permitidas
    const userRoles: string[] = [];
    
    if (req.user.is_master) userRoles.push('master');
    if (req.user.is_director) userRoles.push('director');
    if (req.user.is_leader) userRoles.push('leader');
    if (!req.user.is_master && !req.user.is_director && !req.user.is_leader) userRoles.push('employee');

    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        error: 'Você não tem permissão para acessar este recurso' 
      });
    }

    next();
  };
};