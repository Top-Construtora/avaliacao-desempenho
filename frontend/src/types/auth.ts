// Tipos relacionados à autenticação e permissões

export type UserRole = 'master' | 'director' | 'leader' | 'employee';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
}

// Mapeamento de permissões por papel
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  master: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'departments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'consensus', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pdi', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'salary', actions: ['create', 'read', 'update', 'delete'] },
  ],
  director: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'departments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'consensus', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'salary', actions: ['create', 'read', 'update', 'delete'] },
  ],
  leader: [
    { resource: 'users', actions: ['read', 'update'] }, // apenas subordinados
    { resource: 'teams', actions: ['create', 'read', 'update'] }, // seus times
    { resource: 'departments', actions: ['read'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update'] }, // suas avaliações
    { resource: 'reports', actions: ['read'] }, // relatórios limitados
    { resource: 'salary', actions: ['read'] }, // visualizar salários da equipe
  ],
  employee: [
    { resource: 'users', actions: ['read'] }, // apenas próprio perfil
    { resource: 'teams', actions: ['read'] }, // seus times
    { resource: 'departments', actions: ['read'] },
    { resource: 'evaluations', actions: ['create', 'read', 'update'] }, // apenas próprias
    { resource: 'salary', actions: ['read'] }, // apenas próprio salário
  ],
};

// Helper para verificar permissões
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const resourcePermission = permissions.find(p => p.resource === resource);
  return resourcePermission ? resourcePermission.actions.includes(action) : false;
}

// Helper para determinar role baseado nos booleans
export function getUserRole(user: { is_director: boolean; is_leader: boolean; is_master?: boolean }): UserRole {
  if (user.is_master) return 'master';
  if (user.is_director) return 'director';
  if (user.is_leader) return 'leader';
  return 'employee';
}

// Tipos para controle de acesso em rotas
export interface AccessControl {
  requireAuth: boolean;
  requireRoles?: UserRole[];
  requireActive?: boolean;
  redirectTo?: string;
}

// Configuração de rotas com controle de acesso
export const ROUTE_ACCESS: Record<string, AccessControl> = {
  '/': { requireAuth: true, requireActive: true },
  '/login': { requireAuth: false },
  '/reset-password': { requireAuth: false },
  '/self-evaluation': { 
    requireAuth: true, 
    requireRoles: ['employee', 'leader', 'director', 'master'],
    requireActive: true 
  },
  '/leader-evaluation': { 
    requireAuth: true, 
    requireRoles: ['leader', 'director', 'master'],
    requireActive: true 
  },
  '/potential-evaluation': { 
    requireAuth: true, 
    requireRoles: ['leader', 'director', 'master'],
    requireActive: true 
  },
  '/consensus': { 
    requireAuth: true, 
    requireRoles: ['director', 'master'],
    requireActive: true 
  },
  '/nine-box': { 
    requireAuth: true, 
    requireRoles: ['director', 'master'],
    requireActive: true 
  },
  '/action-plan': { 
    requireAuth: true, 
    requireRoles: ['director', 'master'],
    requireActive: true 
  },
  '/reports': { 
    requireAuth: true, 
    requireRoles: ['director', 'master'],
    requireActive: true 
  },
  '/users': { 
    requireAuth: true, 
    requireRoles: ['director', 'master'],
    requireActive: true 
  },
  '/users/new': { 
    requireAuth: true, 
    requireRoles: ['director', 'master'],
    requireActive: true 
  },
  '/notifications': { 
    requireAuth: true,
    requireActive: true 
  },
  '/settings': { 
    requireAuth: true,
    requireActive: true 
  },
  '/salary': {
    requireAuth: true,
    requireRoles: ['director', 'master'],
    requireActive: true
  },
  '/salary/tracks': {
    requireAuth: true,
    requireRoles: ['director', 'master'],
    requireActive: true
  },
  '/salary/progressions': {
    requireAuth: true,
    requireRoles: ['director', 'leader'],
    requireActive: true
  }
};

// Tipos para validação de segurança
export interface SecurityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validador de segurança para operações críticas
export function validateSecurityOperation(
  operation: string,
  userRole: UserRole,
  targetData?: any
): SecurityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações específicas por operação
  switch (operation) {
    case 'promote_to_director':
      if (userRole !== 'director' && userRole !== 'master') {
        errors.push('Apenas diretores podem promover outros usuários a diretor');
      }
      break;
    
    case 'deactivate_user':
      if (userRole !== 'director' && userRole !== 'master') {
        errors.push('Apenas diretores podem desativar usuários');
      }
      if (targetData?.is_director) {
        warnings.push('Você está desativando um diretor. Isso pode afetar o sistema.');
      }
      break;
    
    case 'delete_department':
      if (userRole !== 'director' && userRole !== 'master') {
        errors.push('Apenas diretores podem excluir departamentos');
      }
      if (targetData?.teams_count > 0) {
        warnings.push('Este departamento possui times ativos');
      }
      break;
    
    case 'change_team_leader':
      if (userRole !== 'director' && userRole !== 'leader' && userRole !== 'master') {
        errors.push('Apenas diretores e líderes podem alterar responsáveis de times');
      }
      break;

    case 'modify_salary':
      if (userRole !== 'director' && userRole !== 'master') {
        errors.push('Apenas diretores podem modificar salários');
      }
      break;

    case 'approve_progression':
      if (userRole !== 'director' && userRole !== 'master') {
        errors.push('Apenas diretores podem aprovar progressões');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Interface para contexto de autenticação
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    is_director: boolean;
    is_leader: boolean;
    is_master: boolean;
    active: boolean;
  };
  role: UserRole;
  permissions: Permission[];
}

// Helper para criar contexto de autenticação
export function createAuthContext(user: any): AuthContext {
  const role = getUserRole(user);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_director: user.is_director,
      is_leader: user.is_leader,
      active: user.active
    },
    role,
    permissions: ROLE_PERMISSIONS[role]
  };
}

// Middleware types
export interface AuthRequest extends Express.Request {
  auth?: AuthContext;
}

// Token payload
export interface TokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  is_director: boolean;
  is_leader: boolean;
  iat?: number;
  exp?: number;
}