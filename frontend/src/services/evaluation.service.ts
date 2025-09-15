import { api } from '../config/api';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData,
  SelfEvaluation,
  LeaderEvaluation,
  EvaluationSummary
} from '../types/evaluation.types';

// Interfaces para upload em lote
interface BulkEvaluationData {
  userId: string;
  selfEvaluation: {
    technical: number | null;
    behavioral: number | null;
    deliveries: number | null;
  };
  toolkit: {
    [key: string]: number | null;
  };
  leaderEvaluation: {
    technical: number | null;
    behavioral: number | null;
    deliveries: number | null;
    potential: number | null;
  };
  pdi: {
    shortTermGoals: string;
    mediumTermGoals: string;
    longTermGoals: string;
    developmentActions: string;
    resources: string;
    timeline: string;
  };
}

export const evaluationService = {
  // ====================================
  // EVALUATION CYCLES
  // ====================================
  
  // Renomeie para corresponder ao que o hook espera
  async getAllCycles(): Promise<EvaluationCycle[]> {
    try {
      const response = await api.get('/evaluations/cycles');
      // A API retorna os dados diretamente, não em response.data.data
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar ciclos:', error);
      return [];
    }
  },

  async getCurrentCycle(): Promise<EvaluationCycle | null> {
    try {
      const response = await api.get('/evaluations/cycles/current');
      // A API retorna os dados diretamente
      return response.data || null;
    } catch (error) {
      console.error('Erro ao buscar ciclo atual:', error);
      return null;
    }
  },

  async createCycle(cycle: Partial<EvaluationCycle>): Promise<EvaluationCycle> {
    const response = await api.post('/evaluations/cycles', cycle);
    return response.data;
  },

  async openCycle(cycleId: string): Promise<void> {
    await api.put(`/evaluations/cycles/${cycleId}/open`, {});
  },

  async closeCycle(cycleId: string): Promise<void> {
    await api.put(`/evaluations/cycles/${cycleId}/close`, {});
  },

  // ====================================
  // DASHBOARD
  // ====================================
  async getCycleDashboard(cycleId: string): Promise<CycleDashboard[]> {
    try {
      const response = await api.get(`/evaluations/cycles/${cycleId}/dashboard`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      return [];
    }
  },

  async getNineBoxData(cycleId: string): Promise<NineBoxData[]> {
    try {
      const response = await api.get(`/evaluations/cycles/${cycleId}/nine-box`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar nine box:', error);
      return [];
    }
  },

  // ====================================
  // EVALUATIONS
  // ====================================
  async getEmployeeEvaluations(cycleId: string, employeeId: string): Promise<EvaluationExtended[]> {
    try {
      const response = await api.get(`/evaluations/employee/${employeeId}?cycleId=${cycleId}`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  },

  async checkExistingEvaluation(
    cycleId: string,
    employeeId: string,
    type: 'self' | 'leader'
  ): Promise<boolean> {
    try {
      const response = await api.get(
        `/evaluations/check?cycleId=${cycleId}&employeeId=${employeeId}&type=${type}`
      );
      return response.data || false;
    } catch {
      return false;
    }
  },

  // ====================================
  // AUTOAVALIAÇÕES
  // ====================================
  
  async getSelfEvaluations(employeeId: string, cycleId?: string): Promise<SelfEvaluation[]> {
    try {
      const url = cycleId 
        ? `/evaluations/self-evaluations/${employeeId}?cycleId=${cycleId}`
        : `/evaluations/self-evaluations/${employeeId}`;
      const response = await api.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar autoavaliações:', error);
      return [];
    }
  },

  async saveSelfEvaluation(data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    knowledge?: string[];
    tools?: string[];
    strengths?: string[];
    qualities?: string[];
    observations?: string[];
  }): Promise<SelfEvaluation> {
    console.log('Sending self evaluation data:', data);
    const response = await api.post('/evaluations/self', data);
    return response.data;
  },

  // ====================================
  // AVALIAÇÕES DE LÍDER
  // ====================================
  
  async getLeaderEvaluations(employeeId: string, cycleId?: string): Promise<LeaderEvaluation[]> {
    try {
      const url = cycleId 
        ? `/evaluations/leader-evaluations/${employeeId}?cycleId=${cycleId}`
        : `/evaluations/leader-evaluations/${employeeId}`;
      const response = await api.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações de líder:', error);
      return [];
    }
  },

  async saveLeaderEvaluation(
    cycleId: string,
    employeeId: string,
    evaluatorId: string,
    competencies: EvaluationCompetency[],
    potentialScore: number,
    feedback?: {
      strengths?: string;
      improvements?: string;
      observations?: string;
    }
  ): Promise<LeaderEvaluation> {
    const response = await api.post('/evaluations/leader', {
      cycleId,
      employeeId,
      evaluatorId,
      competencies,
      potentialScore,
      feedback
    });
    return response.data;
  },

  // ====================================
  // CONSENSUS
  // ====================================
  async createConsensusMeeting(
    meeting: Partial<ConsensusMeeting>
  ): Promise<ConsensusMeeting> {
    const response = await api.post('/evaluations/consensus', meeting);
    return response.data;
  },

  async completeConsensusMeeting(
    meetingId: string,
    performanceScore: number,
    potentialScore: number,
    notes: string
  ): Promise<void> {
    await api.put(`/evaluations/consensus/${meetingId}/complete`, {
      performanceScore,
      potentialScore,
      notes
    });
  },

  // ====================================
  // FUNÇÕES AUXILIARES
  // ====================================
  
  // Calcular score por categoria
  calculateCategoryScore(competencies: EvaluationCompetency[], category: string): number {
    const categoryComps = competencies.filter(c => c.category === category);
    if (categoryComps.length === 0) return 0;
    
    const sum = categoryComps.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return Number((sum / categoryComps.length).toFixed(2));
  },

  // Calcular score final
  calculateFinalScore(competencies: EvaluationCompetency[]): number {
    if (competencies.length === 0) return 0;
    
    const sum = competencies.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return Number((sum / competencies.length).toFixed(2));
  },

  // Mapear posição no Nine Box
  getNineBoxPosition(performance: number, potential: number): string {
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
  },

  // ====================================
  // PDI - PLANO DE DESENVOLVIMENTO INDIVIDUAL
  // ====================================
  
  async savePDI(pdiData: {
    employeeId: string;
    goals: string[];
    actions: string[];
    resources?: string[];
    timeline?: string;
  }): Promise<any> {
    try {
      const response = await api.post('/pdi', pdiData);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      throw error;
    }
  },

  async getPDI(employeeId: string): Promise<any> {
    try {
      const response = await api.get(`/pdi/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar PDI:', error);
      return null;
    }
  },

  async updatePDI(pdiId: string, updates: {
    goals?: string[];
    actions?: string[];
    resources?: string[];
    timeline?: string;
  }): Promise<any> {
    try {
      const response = await api.put(`/evaluations/pdi/${pdiId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar PDI:', error);
      throw error;
    }
  },

  // ====================================
  // BULK EVALUATION UPLOAD
  // ====================================

  async bulkSaveEvaluations(
    cycleId: string, 
    evaluationsData: BulkEvaluationData[]
  ): Promise<{ success: number; errors: string[] }> {
    try {
      const response = await api.post('/evaluations/bulk-upload', {
        cycleId,
        evaluations: evaluationsData
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar avaliações em lote:', error);
      throw error;
    }
  },

  async validateBulkData(
    evaluationsData: BulkEvaluationData[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await api.post('/evaluations/bulk-validate', {
        evaluations: evaluationsData
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao validar dados em lote:', error);
      throw error;
    }
  },

  // ====================================
  // MANAGEMENT BULK SAVE
  // ====================================

  async saveBulkEvaluations(data: {
    cycleId: string;
    evaluations: Array<{
      userId: string;
      selfEvaluation: {
        toolkit: {
          conhecimentos: string[];
          ferramentas: string[];
          forcasInternas: string[];
          qualidades: string[];
        };
        competencies: {
          technical: { [key: string]: number | null };
          behavioral: { [key: string]: number | null };
          deliveries: { [key: string]: number | null };
        };
        finalScore: number;
      };
      leaderEvaluation: {
        technical: { [key: string]: number | null };
        behavioral: { [key: string]: number | null };
        deliveries: { [key: string]: number | null };
        potential: {
          funcaoSubsequente: number | null;
          aprendizadoContinuo: number | null;
          alinhamentoCultural: number | null;
          visaoSistemica: number | null;
        };
        finalScore: number;
      };
      toolkit: {
        conhecimentos: number;
        ferramentas: number;
        forcasInternas: number;
        qualidades: number;
      };
      pdi: {
        curtosPrazos: Array<{
          id: string;
          competencia: string;
          calendarizacao: string;
          comoDesenvolver: string;
          resultadosEsperados: string;
          status: '1' | '2' | '3' | '4' | '5';
          observacoes: string;
        }>;
        mediosPrazos: Array<{
          id: string;
          competencia: string;
          calendarizacao: string;
          comoDesenvolver: string;
          resultadosEsperados: string;
          status: '1' | '2' | '3' | '4' | '5';
          observacoes: string;
        }>;
        longosPrazos: Array<{
          id: string;
          competencia: string;
          calendarizacao: string;
          comoDesenvolver: string;
          resultadosEsperados: string;
          status: '1' | '2' | '3' | '4' | '5';
          observacoes: string;
        }>;
      };
      consensus?: {
        technical: { [key: string]: number | null };
        behavioral: { [key: string]: number | null };
        deliveries: { [key: string]: number | null };
        notes: string;
      };
    }>;
  }): Promise<void> {
    console.log('Enviando avaliações em lote:', data);
    const response = await api.post('/evaluations/bulk-management-save', data);
    return response.data;
  },

  // Alias para compatibilidade
  getEvaluationCycles(): Promise<EvaluationCycle[]> {
    return this.getAllCycles();
  }
};