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
      self_evaluations: {
        Row: {
          id: string
          employee_id: string
          cycle_id: string
          status: 'pending' | 'in-progress' | 'completed'
          technical_score: number | null
          behavioral_score: number | null
          deliveries_score: number | null
          final_score: number | null
          evaluation_date: string
          created_at: string
          updated_at: string
          knowledge: string[] | null
          tools: string[] | null
          strengths_internal: string[] | null
          qualities: string[] | null
        }
        Insert: {
          id?: string
          employee_id: string
          cycle_id: string
          status?: 'pending' | 'in-progress' | 'completed'
          technical_score?: number | null
          behavioral_score?: number | null
          deliveries_score?: number | null
          final_score?: number | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
          knowledge?: string[] | null
          tools?: string[] | null
          strengths_internal?: string[] | null
          qualities?: string[] | null
        }
        Update: {
          id?: string
          employee_id?: string
          cycle_id?: string
          status?: 'pending' | 'in-progress' | 'completed'
          technical_score?: number | null
          behavioral_score?: number | null
          deliveries_score?: number | null
          final_score?: number | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
          knowledge?: string[] | null
          tools?: string[] | null
          strengths_internal?: string[] | null
          qualities?: string[] | null
        }
      }
      leader_evaluations: {
        Row: {
          id: string
          employee_id: string
          evaluator_id: string
          cycle_id: string
          status: 'pending' | 'in-progress' | 'completed'
          technical_score: number | null
          behavioral_score: number | null
          deliveries_score: number | null
          final_score: number | null
          potential_score: number | null
          evaluation_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          evaluator_id: string
          cycle_id: string
          status?: 'pending' | 'in-progress' | 'completed'
          technical_score?: number | null
          behavioral_score?: number | null
          deliveries_score?: number | null
          final_score?: number | null
          potential_score?: number | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          evaluator_id?: string
          cycle_id?: string
          status?: 'pending' | 'in-progress' | 'completed'
          technical_score?: number | null
          behavioral_score?: number | null
          deliveries_score?: number | null
          final_score?: number | null
          potential_score?: number | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      evaluation_competencies: {
        Row: {
          id: string
          evaluation_id: string | null
          criterion_name: string
          criterion_description: string | null
          category: 'technical' | 'behavioral' | 'deliveries'
          score: number | null
          created_at: string
          written_response: string | null
          weight: number | null
          self_evaluation_id: string | null
          leader_evaluation_id: string | null
        }
        Insert: {
          id?: string
          evaluation_id?: string | null
          criterion_name: string
          criterion_description?: string | null
          category: 'technical' | 'behavioral' | 'deliveries'
          score?: number | null
          created_at?: string
          written_response?: string | null
          weight?: number | null
          self_evaluation_id?: string | null
          leader_evaluation_id?: string | null
        }
        Update: {
          id?: string
          evaluation_id?: string | null
          criterion_name?: string
          criterion_description?: string | null
          category?: 'technical' | 'behavioral' | 'deliveries'
          score?: number | null
          created_at?: string
          written_response?: string | null
          weight?: number | null
          self_evaluation_id?: string | null
          leader_evaluation_id?: string | null
        }
      }
      development_plans: {
        Row: {
          id: string
          employee_id: string
          consensus_evaluation_id: string | null
          goals: string[]
          actions: string[]
          resources: string[]
          timeline: string | null
          status: 'draft' | 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
          cycle_id: string | null
          leader_evaluation_id: string | null
          items: any | null
          periodo: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          consensus_evaluation_id?: string | null
          goals?: string[]
          actions?: string[]
          resources?: string[]
          timeline?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
          cycle_id?: string | null
          leader_evaluation_id?: string | null
          items?: any | null
          periodo?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          consensus_evaluation_id?: string | null
          goals?: string[]
          actions?: string[]
          resources?: string[]
          timeline?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
          cycle_id?: string | null
          leader_evaluation_id?: string | null
          items?: any | null
          periodo?: string | null
          created_by?: string | null
        }
      }
      evaluation_cycles: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: 'draft' | 'active' | 'open' | 'closed'
          is_editable: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: 'draft' | 'active' | 'open' | 'closed'
          is_editable?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: 'draft' | 'active' | 'open' | 'closed'
          is_editable?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
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

export type SelfEvaluation = Database['public']['Tables']['self_evaluations']['Row']
export type SelfEvaluationInsert = Database['public']['Tables']['self_evaluations']['Insert']
export type SelfEvaluationUpdate = Database['public']['Tables']['self_evaluations']['Update']

export type LeaderEvaluation = Database['public']['Tables']['leader_evaluations']['Row']
export type LeaderEvaluationInsert = Database['public']['Tables']['leader_evaluations']['Insert']
export type LeaderEvaluationUpdate = Database['public']['Tables']['leader_evaluations']['Update']

export type EvaluationCompetency = Database['public']['Tables']['evaluation_competencies']['Row']
export type EvaluationCompetencyInsert = Database['public']['Tables']['evaluation_competencies']['Insert']
export type EvaluationCompetencyUpdate = Database['public']['Tables']['evaluation_competencies']['Update']

export type DevelopmentPlan = Database['public']['Tables']['development_plans']['Row']
export type DevelopmentPlanInsert = Database['public']['Tables']['development_plans']['Insert']
export type DevelopmentPlanUpdate = Database['public']['Tables']['development_plans']['Update']

export type EvaluationCycle = Database['public']['Tables']['evaluation_cycles']['Row']
export type EvaluationCycleInsert = Database['public']['Tables']['evaluation_cycles']['Insert']
export type EvaluationCycleUpdate = Database['public']['Tables']['evaluation_cycles']['Update']

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

export interface SelfEvaluationWithDetails extends SelfEvaluation {
  employee?: Pick<User, 'id' | 'name' | 'email' | 'position'>
  competencies?: EvaluationCompetency[]
}

export interface LeaderEvaluationWithDetails extends LeaderEvaluation {
  employee?: Pick<User, 'id' | 'name' | 'email' | 'position'>
  evaluator?: Pick<User, 'id' | 'name' | 'email'>
  competencies?: EvaluationCompetency[]
}

export interface DevelopmentPlanWithDetails extends DevelopmentPlan {
  employee?: Pick<User, 'id' | 'name' | 'email' | 'position'>
  created_by_user?: Pick<User, 'id' | 'name' | 'email'>
}