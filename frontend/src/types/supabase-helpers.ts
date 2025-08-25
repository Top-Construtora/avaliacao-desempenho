// Tipos auxiliares para lidar com os retornos do Supabase quando fazemos joins

import type { Database } from './supabase';

// Tipos base
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Tipos de relacionamento para queries com select
export interface TeamMemberWithTeam {
  teams: {
    id: string;
    name: string;
    department_id: string | null;
  } | null;
}

export interface TeamMemberWithUser {
  users: {
    id: string;
    name: string;
    email: string;
    position: string;
  } | null;
}

export interface DepartmentWithResponsible {
  id: string;
  name: string;
  description: string | null;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
  responsible: {
    id: string;
    name: string;
    email: string;
  } | null;
  teams: Array<{
    id: string;
    name: string;
  }>;
}

export interface TeamWithRelations {
  id: string;
  name: string;
  department_id: string | null;
  responsible_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  department: {
    id: string;
    name: string;
  } | null;
  responsible: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface UserWithManager {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  is_master: boolean;
  phone: string | null;
  birth_date: string | null;
  join_date: string;
  active: boolean;
  reports_to: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// Função helper para extrair dados de relacionamentos
export function extractRelation<T>(data: any, key: string): T | null {
  return data?.[key] || null;
}

// Função helper para extrair arrays de relacionamentos
export function extractRelationArray<T>(data: any[], key: string): T[] {
  return data
    ?.map(item => item[key])
    .filter(Boolean) || [];
}

// Type guards
export function isValidUser(user: any): user is Tables['users']['Row'] {
  return user && typeof user.id === 'string' && typeof user.email === 'string';
}

export function isValidTeam(team: any): team is Tables['teams']['Row'] {
  return team && typeof team.id === 'string' && typeof team.name === 'string';
}

export function isValidDepartment(dept: any): dept is Tables['departments']['Row'] {
  return dept && typeof dept.id === 'string' && typeof dept.name === 'string';
}