// ====================================
// TIPOS BASE PARA AS NOVAS TABELAS
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

// ====================================
// TIPOS EXISTENTES ATUALIZADOS
// ====================================

export interface EvaluationCycle {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'open' | 'closed';
  is_editable: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Atualizado para suportar as novas tabelas
export interface EvaluationCompetency {
  id?: string;
  evaluation_id?: string; // Legado
  self_evaluation_id?: string; // Novo
  leader_evaluation_id?: string; // Novo
  name?: string; // Para compatibilidade com frontend
  criterion_name: string;
  criterion_description?: string;
  description?: string; // Para compatibilidade com frontend
  category: 'technical' | 'behavioral' | 'deliveries';
  score?: number;
  written_response?: string;
  weight?: number;
  created_at?: string;
}

export interface EvaluationExtended {
  id: string;
  cycle_id: string;
  employee_id: string;
  evaluator_id: string;
  evaluation_type: 'self' | 'leader' | 'consensus';
  type?: 'self' | 'leader' | 'potential'; // Legacy field
  status: 'pending' | 'in-progress' | 'completed';
  technical_score?: number;
  behavioral_score?: number;
  deliveries_score?: number;
  final_score?: number;
  potential_score?: number;
  consensus_performance_score?: number;
  consensus_potential_score?: number;
  strengths?: string;
  improvements?: string;
  observations?: string;
  evaluation_date: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
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


export interface ConsensusMeeting {
  id: string;
  cycle_id: string;
  employee_id: string;
  self_evaluation_id?: string; // Agora opcional
  leader_evaluation_id?: string; // Agora opcional
  meeting_date?: string;
  consensus_performance_score: number;
  consensus_potential_score: number;
  meeting_notes?: string;
  participants?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Dashboard atualizado
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
  // Campos extras do tipo original
  cycle_id?: string;
  cycle_title?: string;
  cycle_status?: 'draft' | 'open' | 'closed';
  position?: string;
  reports_to?: string;
  self_evaluation_id?: string;
  self_score?: number;
  leader_evaluation_id?: string;
  leader_score?: number;
  potential_score?: number;
  consensus_id?: string;
  ninebox_position?: number;
}

export interface NineBoxData {
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  performance_score: number;
  potential_score: number;
  nine_box_position: string;
  // Campos extras do tipo original
  box_position?: number;
  box_description?: string;
}

// Competency templates for evaluations
export const EVALUATION_COMPETENCIES = {
  technical: [
    {
      name: 'Gestão do Conhecimento',
      description: 'Capacidade de adquirir, compartilhar e aplicar conhecimentos técnicos relevantes',
      category: 'technical' as const
    },
    {
      name: 'Orientação a Resultados com Segurança',
      description: 'Foco em resultados mantendo padrões de segurança e qualidade',
      category: 'technical' as const
    },
    {
      name: 'Pensamento Crítico',
      description: 'Capacidade de analisar criticamente situações e propor soluções eficazes',
      category: 'technical' as const
    },
    {
      name: 'Aderência a Processos',
      description: 'Trabalha em aderência aos processos de gestão da empresa, esforçando-se para compreender e atender os objetivos, cumprindo com os resutlados da área',
      category: 'technical' as const
    }
  ],
  behavioral: [
    {
      name: 'Comunicação',
      description: 'Capacidade de se comunicar de forma clara, eficaz e respeitosa',
      category: 'behavioral' as const
    },
    {
      name: 'Inteligência Emocional',
      description: 'Habilidade de reconhecer e gerenciar emoções próprias e dos outros',
      category: 'behavioral' as const
    },
    {
      name: 'Colaboração',
      description: 'Possibilita entre o time uma troca de conhecimento e agilidade no cumprimento de metas e objetivos compartilhados, ou seja, trabalho em equipe',
      category: 'behavioral' as const
    },
    {
      name: 'Flexibilidade',
      description: 'Capaz de se adaptar a mudanças e/ou situações inesperadas',
      category: 'behavioral' as const
    }
  ],
  deliveries: [
    {
      name: 'Missão dada é missão cumprida',
      description: 'Aqui, o compromisso é sagrado. O que é combinado, é entregue. Cumpra o acordo dentro dos parâmetros estabelecidos e com excelência',
      category: 'deliveries' as const
    },
    {
      name: 'Senso do Dono',
      description: 'Cada colaborador cuida do negócio como se fosse seu. Tomamos decisões com responsabilidade, sempre pensando no melhor para a empresa',
      category: 'deliveries' as const
    },
    {
      name: 'Planejar é preciso',
      description: 'Sem planejamento, tudo vira urgência. Antecipamos os desafios para garantir que cada etapa seja cumprida no tempo certo, evitando o caos',
      category: 'deliveries' as const
    },
    {
      name: 'Melhora Contínua',
      description: 'Nunca estamos satisfeitos com o status quo. Buscamos constantemente melhorar, tanto no nível pessoal quanto organizacional, com uma postura inconformada que nos impulsiona a evoluir',
      category: 'deliveries' as const
    }
  ]
};

// Helper functions
export const calculateAverageScore = (competencies: EvaluationCompetency[]): number => {
  if (!competencies.length) return 0;
  const sum = competencies.reduce((acc, comp) => acc + (comp.score || 0), 0);
  return Number((sum / competencies.length).toFixed(2));
};

export const getCategoryScore = (competencies: EvaluationCompetency[], category: string): number => {
  const categoryComps = competencies.filter(c => c.category === category);
  return calculateAverageScore(categoryComps);
};

export const getNineBoxDescription = (position: number): string => {
  const descriptions: Record<number, string> = {
    1: 'Insuficiente - Risco com desempenho',
    2: 'Questionável - Potencial para melhorar',
    3: 'Dilema - Potencial não demonstrado',
    4: 'Eficaz - Especialista de alto valor',
    5: 'Mantenedor - Boa performance, espaço para crescer',
    6: 'Forte Desempenho - Potencial para mudanças',
    7: 'Comprometimento - Especialista difícil de substituir',
    8: 'Alto Impacto - Contribuição de valor',
    9: 'Futuro Líder - Potencial além da função atual'
  };
  return descriptions[position] || 'Posição não definida';
};

// Interface legado para compatibilidade
export interface Evaluation {
  id: string;
  cycle_id: string;
  employee_id: string;
  evaluator_id?: string;
  evaluation_type?: 'self' | 'leader' | 'consensus';
  type?: 'self' | 'leader' | 'consensus'; // Legacy support
  status: 'draft' | 'in-progress' | 'completed';
  performance_score?: number;
  potential_score?: number;
  final_score?: number;
  strengths?: string;
  improvements?: string;
  observations?: string;
  career_interests?: string;
  mobility?: string;
  created_at: string;
  updated_at?: string;
  evaluation_date?: string;
  evaluation_competencies?: EvaluationCompetency[];
}

export interface ConsensusParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  role: 'facilitator' | 'participant';
  attended: boolean;
  created_at: string;
}

// ====================================
// TIPOS PARA FORMULÁRIOS
// ====================================

export interface EvaluationFormData {
  cycleId: string;
  employeeId: string;
  evaluatorId?: string;
  competencies: EvaluationCompetency[];
  potentialScore?: number;
  feedback?: {
    strengths?: string;
    improvements?: string;
    observations?: string;
  };
}

// Status de avaliação
export type EvaluationStatus = 'pending' | 'in-progress' | 'completed';

// Categorias de competências
export type CompetencyCategory = 'technical' | 'behavioral' | 'deliveries';

// Posições do Nine Box
export type NineBoxPosition = 
  | 'Questionável'
  | 'Novo/Desenvolvimento'
  | 'Enigma'
  | 'Eficaz'
  | 'Mantenedor'
  | 'Forte Desempenho'
  | 'Especialista'
  | 'Alto Desempenho'
  | 'Estrela';

// Métricas de avaliação
export interface EvaluationMetrics {
  totalEmployees: number;
  completedSelfEvaluations: number;
  completedLeaderEvaluations: number;
  completedConsensus: number;
  averagePerformance: number;
  averagePotential: number;
}

// ====================================
// FUNÇÕES AUXILIARES PARA NINE BOX
// ====================================

export const calculateNineBoxPosition = (performance: number, potential: number): string => {
  const perfLevel = performance <= 2 ? 'low' : performance <= 3 ? 'medium' : 'high';
  const potLevel = potential <= 2 ? 'low' : potential <= 3 ? 'medium' : 'high';
  
  const positions: { [key: string]: string } = {
    'low-low': 'Questionável',
    'low-medium': 'Novo/Desenvolvimento',
    'low-high': 'Enigma',
    'medium-low': 'Eficaz',
    'medium-medium': 'Mantenedor',
    'medium-high': 'Forte Desempenho',
    'high-low': 'Especialista',
    'high-medium': 'Alto Desempenho',
    'high-high': 'Estrela'
  };
  
  return positions[`${perfLevel}-${potLevel}`] || 'Não classificado';
};

export const getNineBoxPositionNumber = (performance: number, potential: number): number => {
  const perfLevel = performance <= 2 ? 0 : performance <= 3 ? 1 : 2;
  const potLevel = potential <= 2 ? 0 : potential <= 3 ? 1 : 2;
  
  // Matriz 3x3: performance (linha) x potential (coluna)
  // 7 8 9
  // 4 5 6
  // 1 2 3
  return (potLevel * 3) + perfLevel + 1;
};