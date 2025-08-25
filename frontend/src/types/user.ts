// frontend/src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  is_master: boolean;
  active: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string;
  reports_to?: string | null;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
  contract_type?: 'CLT' | 'PJ' | 'INTERN';
  department_id?: string;
  admission_date?: string;
  position_start_date?: string;
  intern_level?: string;
  
  // Novos campos de perfil pessoal
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null;
  has_children?: boolean;
  children_age_ranges?: string[];
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null;
  hobbies?: string | null;
  favorite_color?: string | null;
  supports_team?: boolean;
  team_name?: string | null;
  practices_sports?: boolean;
  sports?: string[];
  
  // Campos de trilha/salário (opcionais)
  current_track_position_id?: string;
  current_salary_level_id?: string;
  current_salary?: number;
  track_id?: string;
  position_id?: string;
  
  // Relacionamentos (opcionais, preenchidos em algumas queries)
  department?: Department;
  teams?: Team[];
  managed_teams?: Team[];
  managed_department?: Department;
}

// Tipos auxiliares para os novos campos
export type Gender = 'masculino' | 'feminino' | 'outro' | 'nao_informar';
export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar';
export type ChildrenAgeRange = '0-3' | '4-6' | '7-12' | '13-17' | '18+';

// Opções para os formulários
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informar', label: 'Prefiro não informar' }
];

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'nao_informar', label: 'Prefiro não informar' }
];

export const CHILDREN_AGE_OPTIONS: { value: ChildrenAgeRange; label: string }[] = [
  { value: '0-3', label: '0 a 3 anos' },
  { value: '4-6', label: '4 a 6 anos' },
  { value: '7-12', label: '7 a 12 anos' },
  { value: '13-17', label: '13 a 17 anos' },
  { value: '18+', label: '18 anos ou mais' }
];

// Esportes comuns
export const POPULAR_SPORTS = [
  'Futebol',
  'Vôlei',
  'Basquete',
  'Natação',
  'Corrida',
  'Ciclismo',
  'Musculação',
  'Tênis',
  'Caminhada',
  'Yoga',
  'Pilates',
  'Artes Marciais',
  'Dança',
  'Crossfit',
  'Surf'
];

export interface Department {
  id: string;
  name: string;
  description?: string;
  responsible_id?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  responsible?: User;
}

export interface Team {
  id: string;
  name: string;
  department_id?: string;
  responsible_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  department?: Department;
  responsible?: User;
  members?: User[];
}

// Helper para determinar o "role" baseado nos booleans
export function getUserRole(user: User): 'master' | 'admin' | 'director' | 'leader' | 'employee' {
  // Master tem acesso total a tudo
  if (user.is_master) {
    return 'master';
  }
  
  // Admin é um caso especial - diretor com email específico
  if (user.email === 'admin@empresa.com' && user.is_director) {
    return 'admin';
  }
  
  if (user.is_director) {
    return 'director';
  }
  
  if (user.is_leader) {
    return 'leader';
  }
  
  return 'employee';
}

// Helper para verificar permissões
export function hasPermission(user: User, permission: string): boolean {
  const role = getUserRole(user);
  
  const permissions: Record<string, string[]> = {
    master: ['*'], // Acesso total - pode gerenciar avaliações e PDIs de todos
    admin: ['*'], // Acesso total
    director: [
      'users.manage',
      'departments.manage',
      'teams.manage',
      'evaluations.manage',
      'reports.view',
      'salary.manage'
    ],
    leader: [
      'teams.view',
      'teams.manage_own',
      'evaluations.create',
      'evaluations.view_team',
      'reports.view_team'
    ],
    employee: [
      'profile.view_own',
      'profile.edit_own',
      'evaluations.view_own',
      'evaluations.create_self'
    ]
  };
  
  const userPermissions = permissions[role] || [];
  
  // Admin tem acesso a tudo
  if (userPermissions.includes('*')) {
    return true;
  }
  
  return userPermissions.includes(permission);
}

// Types para requisições de login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  profile?: User;
}

// Types para atualização de usuário
export interface UpdateUserRequest {
  name?: string;
  position?: string;
  phone?: string;
  birth_date?: string;
  profile_image?: string;
  department_id?: string;
  is_leader?: boolean;
  is_director?: boolean;
  is_master?: boolean;
  active?: boolean;
  
  // Novos campos
  gender?: Gender | null;
  has_children?: boolean;
  children_age_ranges?: string[];
  marital_status?: MaritalStatus | null;
  hobbies?: string | null;
  favorite_color?: string | null;
  supports_team?: boolean;
  team_name?: string | null;
  practices_sports?: boolean;
  sports?: string[];
}

// Enum para tipos de contrato
export enum ContractType {
  CLT = 'CLT',
  PJ = 'PJ',
  INTERN = 'INTERN'
}

// Type guards
export function isDirector(user: User): boolean {
  return user.is_director === true;
}

export function isLeader(user: User): boolean {
  return user.is_leader === true;
}

export function isActive(user: User): boolean {
  return user.active === true;
}

export function canManageUsers(user: User): boolean {
  return isDirector(user);
}

export function canManageTeams(user: User): boolean {
  return isDirector(user) || isLeader(user);
}