// backend/src/types/supabase.ts
// Tipos gerados do Supabase para o backend
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
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          responsible_id?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          responsible_id?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
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
          contract_type: 'CLT' | 'PJ' | 'INTERN'
          current_track_position_id: string | null
          current_salary_level_id: string | null
          current_salary: number | null
          admission_date: string | null
          position_start_date: string | null
          department_id: string | null
          track_id: string | null
          position_id: string | null
          intern_level: string | null
          created_at: string
          updated_at: string
          
          // Novos campos de perfil pessoal
          gender: 'masculino' | 'feminino' | 'outro' | 'nao_informar' | null
          has_children: boolean
          children_age_ranges: string[] | null
          marital_status: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar' | null
          hobbies: string | null
          favorite_color: string | null
          supports_team: boolean
          team_name: string | null
          practices_sports: boolean
          sports: string[] | null
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
          contract_type?: 'CLT' | 'PJ' | 'INTERN'
          current_track_position_id?: string | null
          current_salary_level_id?: string | null
          current_salary?: number | null
          admission_date?: string | null
          position_start_date?: string | null
          department_id?: string | null
          track_id?: string | null
          position_id?: string | null
          intern_level?: string | null
          created_at?: string
          updated_at?: string
          
          // Novos campos
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
          contract_type?: 'CLT' | 'PJ' | 'INTERN'
          current_track_position_id?: string | null
          current_salary_level_id?: string | null
          current_salary?: number | null
          admission_date?: string | null
          position_start_date?: string | null
          department_id?: string | null
          track_id?: string | null
          position_id?: string | null
          intern_level?: string | null
          created_at?: string
          updated_at?: string
          
          // Novos campos
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
          cycle_id: string | null
          evaluation_type: 'self' | 'leader' | 'consensus' | null
          potential_score: number | null
          consensus_score: number | null
          potential_score: number | null
          written_feedback: Json | null
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
          cycle_id?: string | null
          evaluation_type?: 'self' | 'leader' | 'consensus' | null
          potential_score?: number | null
          consensus_score?: number | null
          potential_score?: number | null
          written_feedback?: Json | null
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
          cycle_id?: string | null
          evaluation_type?: 'self' | 'leader' | 'consensus' | null
          potential_score?: number | null
          consensus_score?: number | null
          potential_score?: number | null
          written_feedback?: Json | null
        }
      }
      evaluation_competencies: {
        Row: {
          id: string
          evaluation_id: string
          criterion_name: string
          criterion_description: string | null
          category: 'technical' | 'behavioral' | 'deliveries'
          score: number | null
          created_at: string
          written_response: string | null
          weight: number
        }
        Insert: {
          id?: string
          evaluation_id: string
          criterion_name: string
          criterion_description?: string | null
          category: 'technical' | 'behavioral' | 'deliveries'
          score?: number | null
          created_at?: string
          written_response?: string | null
          weight?: number
        }
        Update: {
          id?: string
          evaluation_id?: string
          criterion_name?: string
          criterion_description?: string | null
          category?: 'technical' | 'behavioral' | 'deliveries'
          score?: number | null
          created_at?: string
          written_response?: string | null
          weight?: number
        }
      }
      evaluation_cycles: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: 'draft' | 'open' | 'closed'
          is_editable: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: 'draft' | 'open' | 'closed'
          is_editable?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: 'draft' | 'open' | 'closed'
          is_editable?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      consensus_evaluations: {
        Row: {
          id: string
          employee_id: string
          self_evaluation_id: string | null
          leader_evaluation_id: string | null
          consensus_score: number | null
          potential_score: number | null
          nine_box_position: string | null
          notes: string | null
          evaluation_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          self_evaluation_id?: string | null
          leader_evaluation_id?: string | null
          consensus_score?: number | null
          potential_score?: number | null
          nine_box_position?: string | null
          notes?: string | null
          evaluation_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          self_evaluation_id?: string | null
          leader_evaluation_id?: string | null
          consensus_score?: number | null
          potential_score?: number | null
          nine_box_position?: string | null
          notes?: string | null
          evaluation_date?: string | null
          created_at?: string
          updated_at?: string
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
          status: 'draft' | 'active' | 'completed' | 'cancelled' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          consensus_evaluation_id?: string | null
          goals?: string[]
          actions?: string[]
          resources?: string[]
          timeline?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          consensus_evaluation_id?: string | null
          goals?: string[]
          actions?: string[]
          resources?: string[]
          timeline?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled' | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      // TABELAS DO SISTEMA DE SALÁRIOS
      salary_classes: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          order_index: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          order_index: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      job_positions: {
        Row: {
          id: string
          name: string
          code: string | null
          description: string | null
          is_multifunctional: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          description?: string | null
          is_multifunctional?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          description?: string | null
          is_multifunctional?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      salary_levels: {
        Row: {
          id: string
          name: string
          percentage: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          percentage: number
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          percentage?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      career_tracks: {
        Row: {
          id: string
          department_id: string | null
          name: string
          code: string | null
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department_id?: string | null
          name: string
          code?: string | null
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department_id?: string | null
          name?: string
          code?: string | null
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      track_positions: {
        Row: {
          id: string
          track_id: string
          position_id: string
          class_id: string
          base_salary: number
          order_index: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          track_id: string
          position_id: string
          class_id: string
          base_salary: number
          order_index: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          track_id?: string
          position_id?: string
          class_id?: string
          base_salary?: number
          order_index?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      progression_rules: {
        Row: {
          id: string
          from_position_id: string
          to_position_id: string
          progression_type: 'horizontal' | 'vertical' | 'merit'
          min_time_months: number | null
          performance_requirement: number | null
          additional_requirements: Json | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_position_id: string
          to_position_id: string
          progression_type: 'horizontal' | 'vertical' | 'merit'
          min_time_months?: number | null
          performance_requirement?: number | null
          additional_requirements?: Json | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_position_id?: string
          to_position_id?: string
          progression_type?: 'horizontal' | 'vertical' | 'merit'
          min_time_months?: number | null
          performance_requirement?: number | null
          additional_requirements?: Json | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      progression_history: {
        Row: {
          id: string
          user_id: string
          from_track_position_id: string | null
          to_track_position_id: string
          from_salary_level_id: string | null
          to_salary_level_id: string
          from_salary: number | null
          to_salary: number
          progression_type: 'horizontal' | 'vertical' | 'merit'
          progression_date: string
          reason: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_track_position_id?: string | null
          to_track_position_id: string
          from_salary_level_id?: string | null
          to_salary_level_id: string
          from_salary?: number | null
          to_salary: number
          progression_type: 'horizontal' | 'vertical' | 'merit'
          progression_date: string
          reason?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_track_position_id?: string | null
          to_track_position_id?: string
          from_salary_level_id?: string | null
          to_salary_level_id?: string
          from_salary?: number | null
          to_salary?: number
          progression_type?: 'horizontal' | 'vertical' | 'merit'
          progression_date?: string
          reason?: string | null
          approved_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      user_calculated_salaries: {
        Row: {
          id: string
          name: string
          email: string
          contract_type: 'CLT' | 'PJ' | 'INTERN'
          base_salary: number | null
          level_percentage: number | null
          calculated_salary: number | null
          current_salary: number | null
          department_name: string | null
          position_name: string | null
          class_code: string | null
          salary_level: string | null
          track_name: string | null
        }
      }
      user_possible_progressions: {
        Row: {
          user_id: string
          user_name: string
          rule_id: string
          progression_type: 'horizontal' | 'vertical' | 'merit'
          min_time_months: number | null
          performance_requirement: number | null
          from_position_id: string
          from_position_name: string
          from_class_code: string
          to_position_id: string
          to_position_name: string
          to_class_code: string
          to_base_salary: number
          progression_type_label: string
        }
      }
      hr_salary_overview: {
        Row: {
          total_employees: number
          total_clt: number
          total_pj: number
          avg_salary: number
          min_salary: number
          max_salary: number
          total_tracks: number
          total_positions: number
        }
      }
    }
    Functions: {
      calculate_salary: {
        Args: {
          p_track_position_id: string
          p_salary_level_id: string
        }
        Returns: number
      }
      check_progression_eligibility: {
        Args: {
          p_user_id: string
          p_rule_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      contract_type: 'CLT' | 'PJ' | 'INTERN'
      progression_type: 'horizontal' | 'vertical' | 'merit'
      gender_type: 'masculino' | 'feminino' | 'outro' | 'nao_informar'
      marital_status_type: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'nao_informar'
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Aliases for convenience
export type DBUser = Tables<'users'>
export type DBUserInsert = TablesInsert<'users'>
export type DBUserUpdate = TablesUpdate<'users'>
export type DBDepartment = Tables<'departments'>
export type DBTeam = Tables<'teams'>
export type DBEvaluation = Tables<'evaluations'>
export type DBEvaluationCycle = Tables<'evaluation_cycles'>
export type DBCareerTrack = Tables<'career_tracks'>
export type DBJobPosition = Tables<'job_positions'>
export type DBSalaryLevel = Tables<'salary_levels'>