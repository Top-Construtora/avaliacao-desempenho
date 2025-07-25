import { useState, useEffect, useCallback } from 'react';
import { evaluationService } from '../services/evaluation.service';
import { usersService } from '../services/supabase.service';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData,
  SelfEvaluation,
  LeaderEvaluation
} from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Define ActionItem and PdiData interfaces here or import them
interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PdiData {
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}


interface UseEvaluationReturn {
  // States
  loading: boolean;
  currentCycle: EvaluationCycle | null;
  cycles: EvaluationCycle[];
  dashboard: CycleDashboard[];
  employees: UserWithDetails[];
  subordinates: UserWithDetails[];
  nineBoxData: NineBoxData[];
  
  // Actions
  loadCurrentCycle: () => Promise<void>;
  loadAllCycles: () => Promise<void>;
  loadDashboard: (cycleId: string) => Promise<void>;
  loadNineBoxData: (cycleId: string) => Promise<void>;
  loadSubordinates: () => Promise<void>;
  
  // Cycle management
  createCycle: (cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  openCycle: (cycleId: string) => Promise<void>;
  closeCycle: (cycleId: string) => Promise<void>;
  
  // Evaluations
  saveSelfEvaluation: (data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    knowledge?: string[];
    tools?: string[];
    strengths?: string[];
    qualities?: string[];
    observations?: string[];
  }) => Promise<void>;
  
  saveLeaderEvaluation: (data: {
    cycleId: string;
    employeeId: string;
    evaluatorId: string;
    competencies: EvaluationCompetency[];
    potentialScore: number;
    feedback?: {
      strengths?: string;
      improvements?: string;
      observations?: string;
    };
  }) => Promise<void>;
  
  createConsensus: (data: Partial<ConsensusMeeting>) => Promise<void>;
  completeConsensus: (meetingId: string, performanceScore: number, potentialScore: number, notes: string) => Promise<void>;
  
  // Queries
  getEmployeeEvaluations: (cycleId: string, employeeId: string) => Promise<EvaluationExtended[]>;
  getSelfEvaluations: (employeeId: string, cycleId?: string) => Promise<SelfEvaluation[]>;
  getLeaderEvaluations: (employeeId: string, cycleId?: string) => Promise<LeaderEvaluation[]>;
  checkExistingEvaluation: (cycleId: string, employeeId: string, type: 'self' | 'leader') => Promise<boolean>;
  getNineBoxByEmployeeId: (employeeId: string) => NineBoxData | undefined;
  savePDI: (pdiData: any) => Promise<any>;
  loadPDI: (employeeId: string) => Promise<PdiData | null>; // Added loadPDI
}

export const useEvaluation = (): UseEvaluationReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<EvaluationCycle | null>(null);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [dashboard, setDashboard] = useState<CycleDashboard[]>([]);
  const [employees, setEmployees] = useState<UserWithDetails[]>([]);
  const [subordinates, setSubordinates] = useState<UserWithDetails[]>([]);
  const [nineBoxData, setNineBoxData] = useState<NineBoxData[]>([]);

  // Load current active cycle
  const loadCurrentCycle = useCallback(async () => {
    try {
      setLoading(true);
      const cycle = await evaluationService.getCurrentCycle();
      setCurrentCycle(cycle);
      
      // Se não houver ciclo ativo, tenta carregar todos e verificar se algum está aberto
      if (!cycle) {
        const allCycles = await evaluationService.getAllCycles();
        const activeCycle = allCycles.find(c => c.status === 'open');
        if (activeCycle) {
          setCurrentCycle(activeCycle);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ciclo atual:', error);
      toast.error('Erro ao carregar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all cycles
  const loadAllCycles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getAllCycles();
      setCycles(data);
    } catch (error) {
      console.error('Erro ao carregar ciclos:', error);
      toast.error('Erro ao carregar ciclos de avaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dashboard data
  const loadDashboard = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      const data = await evaluationService.getCycleDashboard(cycleId);
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load NineBox data
  const loadNineBoxData = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      const data = await evaluationService.getNineBoxData(cycleId);
      setNineBoxData(data);
    } catch (error) {
      console.error('Erro ao carregar dados NineBox:', error);
      toast.error('Erro ao carregar matriz 9-Box');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load subordinates
  const loadSubordinates = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const allUsers = await usersService.getAll();
      const subs = allUsers.filter(u => u.reports_to === user.id);
      setSubordinates(subs);
    } catch (error) {
      console.error('Erro ao carregar subordinados:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new cycle
  const createCycle = useCallback(async (cycle: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const newCycle = await evaluationService.createCycle({
        ...cycle,
        created_by: user?.id || ''
      });
      toast.success('Ciclo de avaliação criado com sucesso!');
      await loadAllCycles();
    } catch (error: any) {
      console.error('Erro ao criar ciclo:', error);
      toast.error(error.message || 'Erro ao criar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [user, loadAllCycles]);

  // Open cycle
  const openCycle = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      await evaluationService.openCycle(cycleId);
      toast.success('Ciclo de avaliação aberto!');
      await loadAllCycles();
      await loadCurrentCycle();
    } catch (error) {
      console.error('Erro ao abrir ciclo:', error);
      toast.error('Erro ao abrir ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [loadAllCycles, loadCurrentCycle]);

  // Close cycle
  const closeCycle = useCallback(async (cycleId: string) => {
    try {
      setLoading(true);
      await evaluationService.closeCycle(cycleId);
      toast.success('Ciclo de avaliação encerrado!');
      await loadAllCycles();
      await loadCurrentCycle();
    } catch (error) {
      console.error('Erro ao fechar ciclo:', error);
      toast.error('Erro ao fechar ciclo de avaliação');
    } finally {
      setLoading(false);
    }
  }, [loadAllCycles, loadCurrentCycle]);

  // Save self evaluation
  const saveSelfEvaluation = useCallback(async (data: {
    cycleId: string;
    employeeId: string;
    competencies: EvaluationCompetency[];
    knowledge?: string[];
    tools?: string[];
    strengths?: string[];
    qualities?: string[];
    observations?: string[];
  }) => {
    try {
      setLoading(true);
      await evaluationService.saveSelfEvaluation(data);
      toast.success('Autoavaliação salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar autoavaliação:', error);
      toast.error(error.message || 'Erro ao salvar autoavaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save leader evaluation
  const saveLeaderEvaluation = useCallback(async (data: {
    cycleId: string;
    employeeId: string;
    evaluatorId: string;
    competencies: EvaluationCompetency[];
    potentialScore: number;
    feedback?: {
      strengths?: string;
      improvements?: string;
      observations?: string;
    };
  }) => {
    try {
      setLoading(true);
      await evaluationService.saveLeaderEvaluation(
        data.cycleId,
        data.employeeId,
        data.evaluatorId,
        data.competencies,
        data.potentialScore,
        data.feedback
      );
      toast.success('Avaliação do líder salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação do líder');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create consensus meeting
  const createConsensus = useCallback(async (data: Partial<ConsensusMeeting>) => {
    try {
      setLoading(true);
      await evaluationService.createConsensusMeeting(data);
      toast.success('Reunião de consenso criada!');
    } catch (error: any) {
      console.error('Erro ao criar consenso:', error);
      toast.error(error.message || 'Erro ao criar reunião de consenso');
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete consensus
  const completeConsensus = useCallback(async (
    meetingId: string,
    performanceScore: number,
    potentialScore: number,
    notes: string
  ) => {
    try {
      setLoading(true);
      await evaluationService.completeConsensusMeeting(
        meetingId,
        performanceScore,
        potentialScore,
        notes
      );
      toast.success('Consenso finalizado com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar consenso:', error);
      toast.error('Erro ao finalizar consenso');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get employee evaluations (unified)
  const getEmployeeEvaluations = useCallback(async (cycleId: string, employeeId: string): Promise<EvaluationExtended[]> => {
    try {
      return await evaluationService.getEmployeeEvaluations(cycleId, employeeId);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }, []);

  // Get self evaluations
  const getSelfEvaluations = useCallback(async (employeeId: string, cycleId?: string): Promise<SelfEvaluation[]> => {
    try {
      return await evaluationService.getSelfEvaluations(employeeId, cycleId);
    } catch (error) {
      console.error('Erro ao buscar autoavaliações:', error);
      return [];
    }
  }, []);

  // Get leader evaluations
  const getLeaderEvaluations = useCallback(async (employeeId: string, cycleId?: string): Promise<LeaderEvaluation[]> => {
    try {
      return await evaluationService.getLeaderEvaluations(employeeId, cycleId);
    } catch (error) {
      console.error('Erro ao buscar avaliações de líder:', error);
      return [];
    }
  }, []);

  // Check existing evaluation
  const checkExistingEvaluation = useCallback(async (
    cycleId: string,
    employeeId: string,
    type: 'self' | 'leader'
  ): Promise<boolean> => {
    try {
      return await evaluationService.checkExistingEvaluation(cycleId, employeeId, type);
    } catch (error) {
      console.error('Erro ao verificar avaliação existente:', error);
      return false;
    }
  }, []);

  // Add getNineBoxByEmployeeId
  const getNineBoxByEmployeeId = (employeeId: string) => {
    return nineBoxData.find((item) => item.employee_id === employeeId);
  };

  // Add savePDI
  const savePDI = async (pdiData: any) => {
    try {
      setLoading(true);
      const result = await evaluationService.savePDI(pdiData);
      toast.success('PDI salvo com sucesso!');
      return result;
    } catch (error: any) {
      console.error('Erro ao salvar PDI:', error);
      toast.error(error.message || 'Erro ao salvar PDI');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add loadPDI
  const loadPDI = useCallback(async (employeeId: string): Promise<PdiData | null> => {
    try {
      setLoading(true);
      const pdi = await evaluationService.getPDI(employeeId);
      if (pdi) {
        // Transform the fetched PDI data (goals, actions are string arrays)
        // back into the frontend's PdiData structure
        const transformActionItems = (items: string[]): ActionItem[] => {
          return items.map((item, index) => {
            // This is a simplified parsing. A more robust solution would involve
            // a structured format for saving/loading PDI items.
            // For now, we'll try to extract parts based on the saving format.
            const competenceMatch = item.match(/Competência: (.*?)\./);
            const resultsMatch = item.match(/Resultados Esperados: (.*?)\./);
            const howToDevelopMatch = item.match(/Como desenvolver: (.*?) \(Prazo: (.*?), Status: (.*?), Observação: (.*?)\)\./);

            let competencia = competenceMatch ? competenceMatch[1] : `Item ${index + 1}`;
            let resultadosEsperados = resultsMatch ? resultsMatch[1] : '';
            let comoDesenvolver = howToDevelopMatch ? howToDevelopMatch[1] : '';
            let calendarizacao = howToDevelopMatch ? howToDevelopMatch[2] : '';
            let status = (howToDevelopMatch ? howToDevelopMatch[3] : '1') as '1' | '2' | '3' | '4' | '5';
            let observacao = howToDevelopMatch ? howToDevelopMatch[4] : '';

            return {
              id: `pdi-${index}-${Date.now()}`, // Generate a unique ID
              competencia,
              calendarizacao,
              comoDesenvolver,
              resultadosEsperados,
              status,
              observacao,
            };
          });
        };

        const curtosPrazos: ActionItem[] = []; // Assuming no direct mapping for short/medium/long term from backend
        const mediosPrazos: ActionItem[] = [];
        const longosPrazos: ActionItem[] = [];

        // For simplicity, let's put all loaded items into 'curtosPrazos' for now.
        // A more complex parsing based on 'timeline' or other criteria would be needed
        // if the backend stores distinct short/medium/long term PDIs.
        // Given the current backend structure (single goals/actions arrays),
        // we'll just put them all into 'curtosPrazos' for display.
        if (pdi.goals && pdi.actions) {
            for (let i = 0; i < pdi.goals.length; i++) {
                const goal = pdi.goals[i];
                const action = pdi.actions[i];

                const competenceMatch = goal.match(/Competência: (.*?)\./);
                const resultsMatch = goal.match(/Resultados Esperados: (.*?)\./);
                const howToDevelopMatch = action.match(/Como desenvolver: (.*?) \(Prazo: (.*?), Status: (.*?), Observação: (.*?)\)\./);

                let competencia = competenceMatch ? competenceMatch[1] : `Item ${i + 1}`;
                let resultadosEsperados = resultsMatch ? resultsMatch[1] : '';
                let comoDesenvolver = howToDevelopMatch ? howToDevelopMatch[1] : '';
                let calendarizacao = howToDevelopMatch ? howToDevelopMatch[2] : '';
                let status = (howToDevelopMatch ? howToDevelopMatch[3] : '1') as '1' | '2' | '3' | '4' | '5';
                let observacao = howToDevelopMatch ? howToDevelopMatch[4] : '';

                curtosPrazos.push({
                    id: `pdi-${i}-${Date.now()}`,
                    competencia,
                    calendarizacao,
                    comoDesenvolver,
                    resultadosEsperados,
                    status,
                    observacao,
                });
            }
        }


        return {
          id: pdi.id,
          colaboradorId: pdi.employee_id,
          colaborador: '', // Will be populated from selectedEmployee in Consensus.tsx
          cargo: '', // Will be populated from selectedEmployee in Consensus.tsx
          departamento: '', // Will be populated from selectedEmployee in Consensus.tsx
          periodo: pdi.timeline || '',
          curtosPrazos,
          mediosPrazos,
          longosPrazos,
          dataCriacao: pdi.created_at,
          dataAtualizacao: pdi.updated_at,
        };
      }
      return null;
    } catch (error: any) {
      console.error('Erro ao carregar PDI:', error);
      toast.error(error.message || 'Erro ao carregar PDI');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadCurrentCycle();
    loadAllCycles();
    
    const loadEmployees = async () => {
      try {
        const data = await usersService.getAll();
        setEmployees(data);
      } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
      }
    };
    
    loadEmployees();
  }, [loadCurrentCycle, loadAllCycles]);

  return {
    loading,
    currentCycle,
    cycles,
    dashboard,
    employees,
    subordinates,
    nineBoxData,
    loadCurrentCycle,
    loadAllCycles,
    loadDashboard,
    loadNineBoxData,
    loadSubordinates,
    createCycle,
    openCycle,
    closeCycle,
    saveSelfEvaluation,
    saveLeaderEvaluation,
    createConsensus,
    completeConsensus,
    getEmployeeEvaluations,
    getSelfEvaluations,
    getLeaderEvaluations,
    checkExistingEvaluation,
    getNineBoxByEmployeeId,
    savePDI,
    loadPDI, // Added
  };
};
