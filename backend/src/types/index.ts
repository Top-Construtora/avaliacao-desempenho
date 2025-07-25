// backend/src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
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
  
  // Campos de trilha/salário
  current_track_position_id?: string;
  current_salary_level_id?: string;
  current_salary?: number;
  track_id?: string;
  position_id?: string;
  
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
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any; // Supabase User
  session: any; // Supabase Session
  profile: User; // Nossa tabela users
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  is_director: boolean;
  is_leader: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Department & Team types
export interface Department {
  id: string;
  name: string;
  description?: string;
  responsible_id?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  department_id?: string;
  responsible_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  created_at?: string;
}

// ====================================
// EVALUATION TYPES - ATUALIZADAS
// ====================================

// Tipos base para as avaliações
export interface BaseEvaluation {
  id: string;
  cycle_id: string;
  employee_id: string;
  status: 'pending' | 'in-progress' | 'completed';
  technical_score?: number;
  behavioral_score?: number;
  deliveries_score?: number;
  final_score?: number;
  evaluation_date: string;
  created_at: string;
  updated_at: string;
}

// Autoavaliação
export interface SelfEvaluation extends BaseEvaluation {
  knowledge?: string[];
  tools?: string[];
  strengths_internal?: string[];
  qualities?: string[];
  improvements?: string[];
  observations?: string[];
}

// Avaliação de Líder
export interface LeaderEvaluation extends BaseEvaluation {
  evaluator_id: string;
  potential_score?: number;
  strengths?: string;
  improvements?: string;
  observations?: string;
}

// Tipo unificado para queries (usando a view)
export interface EvaluationSummary {
  evaluation_type: 'self' | 'leader';
  id: string;
  employee_id: string;
  evaluator_id: string;
  cycle_id: string;
  status: string;
  final_score: number;
  potential_score?: number;
  evaluation_date: string;
  employee_name: string;
  evaluator_name: string;
}

// Ciclo de avaliação
export interface EvaluationCycle {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'open' | 'closed';
  is_editable?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Competências avaliadas - ATUALIZADA
export interface EvaluationCompetency {
  id: string;
  evaluation_id?: string; // Legado
  self_evaluation_id?: string; // Novo
  leader_evaluation_id?: string; // Novo
  criterion_name: string;
  criterion_description?: string;
  category: 'technical' | 'behavioral' | 'deliveries';
  score?: number;
  written_response?: string;
  weight?: number;
  created_at?: string;
}

// Avaliação de consenso
export interface ConsensusEvaluation {
  id: string;
  employee_id: string;
  self_evaluation_id?: string;
  leader_evaluation_id?: string;
  consensus_score?: number;
  potential_score?: number;
  nine_box_position?: string;
  notes?: string;
  evaluation_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Reunião de consenso
export interface ConsensusMeeting {
  id: string;
  cycle_id?: string;
  employee_id: string;
  self_evaluation_id?: string;
  leader_evaluation_id?: string;
  meeting_date?: string;
  consensus_performance_score: number;
  consensus_potential_score: number;
  meeting_notes?: string;
  participants?: any;
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Dashboard do ciclo
export interface CycleDashboard {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  self_evaluation_status: string;
  self_evaluation_score?: number | null;
  leader_evaluation_status: string;
  leader_evaluation_score?: number | null;
  consensus_status: string;
  consensus_performance_score?: number | null;
  consensus_potential_score?: number | null;
}

// Dados do Nine Box
export interface NineBoxData {
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  performance_score: number;
  potential_score: number;
  nine_box_position: string;
}

// Feedback escrito

// Tipo estendido para incluir relacionamentos
export interface EvaluationExtended extends BaseEvaluation {
  evaluation_type?: 'self' | 'leader';
  evaluator?: {
    id: string;
    name: string;
  };
  employee?: {
    id: string;
    name: string;
    email: string;
    position: string;
  };
  competencies?: EvaluationCompetency[];
}

// Tipo Evaluation para compatibilidade
export interface Evaluation {
  id: string;
  evaluator_id: string;
  evaluated_id: string;
  evaluation_type: 'self' | 'leader' | 'peer';
  period_start: string;
  period_end: string;
  status: 'draft' | 'completed' | 'submitted';
  submitted_at?: string;
  total_score?: number;
  competencies?: any;
  feedback?: string;
  goals?: string;
  created_at?: string;
  updated_at?: string;
}

// ====================================
// FIM DAS ATUALIZAÇÕES DE EVALUATION
// ====================================

// PDI (Development Plan) types
export interface DevelopmentPlan {
  id: string;
  employee_id: string;
  consensus_evaluation_id?: string;
  goals: string[];
  actions: string[];
  resources: string[];
  timeline?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface PDI extends DevelopmentPlan {} // Alias para compatibilidade

// Competency types
export interface Competency {
  id: string;
  name: string;
  description?: string;
  category: 'technical' | 'behavioral' | 'deliveries';
  created_at?: string;
}

// Audit types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

// Database row types (for Supabase operations)
export interface UsersRow {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  phone: string | null;
  birth_date: string | null;
  join_date: string | null;
  active: boolean;
  reports_to: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
  contract_type: 'CLT' | 'PJ' | 'INTERN' | null;
  current_track_position_id: string | null;
  current_salary_level_id: string | null;
  current_salary: number | null;
  admission_date: string | null;
  position_start_date: string | null;
  department_id: string | null;
  track_id: string | null;
  position_id: string | null;
  intern_level: string | null;
  
  // Novos campos
  gender: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null;
  has_children: boolean;
  children_age_ranges: string[] | null;
  marital_status: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null;
  hobbies: string | null;
  favorite_color: string | null;
  supports_team: boolean;
  team_name: string | null;
  practices_sports: boolean;
  sports: string[] | null;
}

export interface UsersInsert {
  id?: string;
  email: string;
  name: string;
  position: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string | null;
  active?: boolean;
  reports_to?: string | null;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
  contract_type?: 'CLT' | 'PJ' | 'INTERN' | null;
  department_id?: string | null;
  admission_date?: string | null;
  position_start_date?: string | null;
  intern_level?: string | null;
  track_id?: string | null;
  position_id?: string | null;
  current_track_position_id?: string | null;
  current_salary_level_id?: string | null;
  current_salary?: number | null;
  
  // Novos campos
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null;
  has_children?: boolean;
  children_age_ranges?: string[] | null;
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null;
  hobbies?: string | null;
  favorite_color?: string | null;
  supports_team?: boolean;
  team_name?: string | null;
  practices_sports?: boolean;
  sports?: string[] | null;
}

export interface UsersUpdate {
  email?: string;
  name?: string;
  position?: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string | null;
  active?: boolean;
  reports_to?: string | null;
  profile_image?: string | null;
  updated_at?: string;
  contract_type?: 'CLT' | 'PJ' | 'INTERN' | null;
  department_id?: string | null;
  admission_date?: string | null;
  position_start_date?: string | null;
  intern_level?: string | null;
  track_id?: string | null;
  position_id?: string | null;
  current_track_position_id?: string | null;
  current_salary_level_id?: string | null;
  current_salary?: number | null;
  
  // Novos campos
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null;
  has_children?: boolean;
  children_age_ranges?: string[] | null;
  marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null;
  hobbies?: string | null;
  favorite_color?: string | null;
  supports_team?: boolean;
  team_name?: string | null;
  practices_sports?: boolean;
  sports?: string[] | null;
}

// Tipos auxiliares
export type Gender = 'masculino' | 'feminino' | 'outro' | 'nao_informar';
export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar';
export type ChildrenAgeRange = '0-3' | '4-6' | '7-12' | '13-17' | '18+';
export type ContractType = 'CLT' | 'PJ' | 'INTERN';

// Enums para validação
export const GENDER_VALUES: Gender[] = ['masculino', 'feminino', 'outro', 'nao_informar'];
export const MARITAL_STATUS_VALUES: MaritalStatus[] = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'nao_informar'];
export const CHILDREN_AGE_RANGES: ChildrenAgeRange[] = ['0-3', '4-6', '7-12', '13-17', '18+'];
export const CONTRACT_TYPES: ContractType[] = ['CLT', 'PJ', 'INTERN'];

// Request/Response types
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  position: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string;
  birth_date?: string;
  join_date?: string;
  profile_image?: string;
  reports_to?: string;
  team_ids?: string[];
  department_id?: string;
  track_id?: string;
  position_id?: string;
  intern_level?: string;
  contract_type?: ContractType;
  
  // Novos campos
  gender?: Gender;
  has_children?: boolean;
  children_age_ranges?: string[];
  marital_status?: MaritalStatus;
  hobbies?: string;
  favorite_color?: string;
  supports_team?: boolean;
  team_name?: string;
  practices_sports?: boolean;
  sports?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  position?: string;
  is_leader?: boolean;
  is_director?: boolean;
  phone?: string;
  birth_date?: string;
  join_date?: string;
  profile_image?: string;
  reports_to?: string;
  active?: boolean;
  department_id?: string;
  track_id?: string;
  position_id?: string;
  intern_level?: string;
  contract_type?: ContractType;
  
  // Novos campos
  gender?: Gender;
  has_children?: boolean;
  children_age_ranges?: string[];
  marital_status?: MaritalStatus;
  hobbies?: string;
  favorite_color?: string;
  supports_team?: boolean;
  team_name?: string;
  practices_sports?: boolean;
  sports?: string[];
}

// Auth types
export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

// Filter types
export interface UserFilters {
  active?: boolean;
  is_leader?: boolean;
  is_director?: boolean;
  reports_to?: string;
  department_id?: string;
  contract_type?: ContractType;
  gender?: Gender;
  has_children?: boolean;
  marital_status?: MaritalStatus;
  supports_team?: boolean;
  practices_sports?: boolean;
  favorite_color?: string;
  sport?: string;
}

// Import and re-export other type files if they exist
export * from './supabase';
export * from './salary';