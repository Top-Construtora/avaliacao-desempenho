// frontend/src/types/supabase.ts
// Tipos gerados do Supabase - representam as tabelas do banco
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          responsible_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          responsible_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          responsible_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          position: string
          is_leader: boolean
          is_director: boolean
          is_master: boolean
          phone: string | null
          birth_date: string | null
          join_date: string
          active: boolean
          reports_to: string | null
          profile_image: string | null
          contract_type?: 'CLT' | 'PJ' | null
          current_track_position_id?: string | null
          current_salary_level_id?: string | null
          current_salary?: number | null
          admission_date?: string | null
          position_start_date?: string | null
          created_at: string
          updated_at: string
          // Campos adicionados para consistência com formulários de frontend
          department_id?: string | null
          track_id?: string | null
          position_id?: string | null
          intern_level?: 'A' | 'B' | 'C' | 'D' | 'E' | null
          
          // Novos campos de perfil pessoal
          gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null
          has_children?: boolean
          children_age_ranges?: string[] | null
          marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null
          hobbies?: string | null
          favorite_color?: string | null
          supports_team?: boolean
          team_name?: string | null
          practices_sports?: boolean
          sports?: string[] | null
        }
        Insert: {
          id: string
          email: string
          name: string
          position: string
          is_leader?: boolean
          is_director?: boolean
          is_master?: boolean
          phone?: string | null
          birth_date?: string | null
          join_date?: string
          active?: boolean
          reports_to?: string | null
          profile_image?: string | null
          contract_type?: 'CLT' | 'PJ' | null
          current_track_position_id?: string | null
          current_salary_level_id?: string | null
          current_salary?: number | null
          admission_date?: string | null
          position_start_date?: string | null
          created_at?: string
          updated_at?: string
          // Campos adicionados
          department_id?: string | null
          track_id?: string | null
          position_id?: string | null
          intern_level?: 'A' | 'B' | 'C' | 'D' | 'E' | null
          
          // Novos campos de perfil pessoal
          gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null
          has_children?: boolean
          children_age_ranges?: string[] | null
          marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null
          hobbies?: string | null
          favorite_color?: string | null
          supports_team?: boolean
          team_name?: string | null
          practices_sports?: boolean
          sports?: string[] | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          position?: string
          is_leader?: boolean
          is_director?: boolean
          is_master?: boolean
          phone?: string | null
          birth_date?: string | null
          join_date?: string
          active?: boolean
          reports_to?: string | null
          profile_image?: string | null
          contract_type?: 'CLT' | 'PJ' | null
          current_track_position_id?: string | null
          current_salary_level_id?: string | null
          current_salary?: number | null
          admission_date?: string | null
          position_start_date?: string | null
          created_at?: string
          updated_at?: string
          // Campos adicionados
          department_id?: string | null
          track_id?: string | null
          position_id?: string | null
          intern_level?: 'A' | 'B' | 'C' | 'D' | 'E' | null
          
          // Novos campos de perfil pessoal
          gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null
          has_children?: boolean
          children_age_ranges?: string[] | null
          marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null
          hobbies?: string | null
          favorite_color?: string | null
          supports_team?: boolean
          team_name?: string | null
          practices_sports?: boolean
          sports?: string[] | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          department_id: string | null
          responsible_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          department_id?: string | null
          responsible_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          department_id?: string | null
          responsible_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          team_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          team_id?: string
          user_id?: string
          created_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          employee_id: string
          evaluator_id: string
          type: 'self' | 'leader' | 'potential'
          status: 'pending' | 'in-progress' | 'completed'
          technical_score: number | null
          behavioral_score: number | null
          deliveries_score: number | null
          final_score: number | null
          strengths: string | null
          improvements: string | null
          observations: string | null
          evaluation_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          evaluator_id: string
          type: 'self' | 'leader' | 'potential'
          status?: 'pending' | 'in-progress' | 'completed'
          technical_score?: number | null
          behavioral_score?: number | null
          deliveries_score?: number | null
          final_score?: number | null
          strengths?: string | null
          improvements?: string | null
          observations?: string | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          evaluator_id?: string
          type?: 'self' | 'leader' | 'potential'
          status?: 'pending' | 'in-progress' | 'completed'
          technical_score?: number | null
          behavioral_score?: number | null
          deliveries_score?: number | null
          final_score?: number | null
          strengths?: string | null
          improvements?: string | null
          observations?: string | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      evaluation_criteria: {
        Row: {
          id: string
          evaluation_id: string
          criterion_name: string
          criterion_description: string
          category: 'technical' | 'behavioral' | 'deliveries'
          score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          criterion_name: string
          criterion_description: string
          category: 'technical' | 'behavioral' | 'deliveries'
          score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          criterion_name?: string
          criterion_description?: string
          category?: 'technical' | 'behavioral' | 'deliveries'
          score?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_team_members: {
        Args: { team_id: string }
        Returns: {
          id: string
          name: string
          email: string
          position: string
          is_leader: boolean
        }[]
      }
      get_user_teams: {
        Args: { user_id: string }
        Returns: {
          id: string
          name: string
          department_name: string
        }[]
      }
    }
    Enums: {
      gender_type: 'masculino' | 'feminino' | 'outro' | 'nao_informar'
      marital_status_type: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar'
    }
  }
}

// Tipos auxiliares para facilitar o uso
export type Department = Database['public']['Tables']['departments']['Row']
export type DepartmentInsert = Database['public']['Tables']['departments']['Insert']
export type DepartmentUpdate = Database['public']['Tables']['departments']['Update']

export type SupabaseUser = Database['public']['Tables']['users']['Row']
export type SupabaseUserInsert = Database['public']['Tables']['users']['Insert']
export type SupabaseUserUpdate = Database['public']['Tables']['users']['Update']

export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert']

export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert']
export type EvaluationUpdate = Database['public']['Tables']['evaluations']['Update']

export type EvaluationCriterion = Database['public']['Tables']['evaluation_criteria']['Row']
export type EvaluationCriterionInsert = Database['public']['Tables']['evaluation_criteria']['Insert']

// Tipos compostos (com joins)
export interface UserWithDetails extends SupabaseUser {
  teams?: Team[]
  departments?: Department[]
  manager?: Pick<User, 'id' | 'name' | 'email'>
  direct_reports?: Pick<User, 'id' | 'name' | 'email' | 'position'>[]
}

export interface TeamWithDetails extends Team {
  department?: Department
  responsible?: Pick<User, 'id' | 'name' | 'email'>
  members?: Pick<User, 'id' | 'name' | 'email' | 'position' | 'profile_image'>[]
}

export interface DepartmentWithDetails extends Department {
  responsible?: Pick<User, 'id' | 'name' | 'email'>
  teams?: Team[]
  member_count?: number
}

export interface EvaluationWithDetails extends Evaluation {
  employee?: Pick<User, 'id' | 'name' | 'email' | 'position'>
  evaluator?: Pick<User, 'id' | 'name' | 'email'>
  criteria?: EvaluationCriterion[]
}