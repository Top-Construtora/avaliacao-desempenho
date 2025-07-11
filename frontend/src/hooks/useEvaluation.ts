import { useState, useEffect, useCallback } from 'react';
import { evaluationService } from '../services/evaluation.service';
import { usersService } from '../services/supabase.service';
import type {
  EvaluationCycle,
  EvaluationExtended,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData
} from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
  saveSelfEvaluation: (data: any) => Promise<void>;
  saveLeaderEvaluation: (data: any) => Promise<void>;
  createConsensus: (data: any) => Promise<void>;
  completeConsensus: (meetingId: string, performanceScore: number, potentialScore: number, notes: string) => Promise<void>;
  
  // Queries
  getEmployeeEvaluations: (cycleId: string, employeeId: string) => Promise<any>;
  checkExistingEvaluation: (cycleId: string, employeeId: string, type: 'self' | 'leader') => Promise<boolean>;
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
  const saveSelfEvaluation = useCallback(async (data: any) => {
    try {
      setLoading(true);
      await evaluationService.saveSelfEvaluation(
        data.cycleId,
        data.employeeId,
        data.competencies,
        data.writtenFeedback
      );
      toast.success('Autoavaliação salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar autoavaliação:', error);
      toast.error(error.message || 'Erro ao salvar autoavaliação');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save leader evaluation
  const saveLeaderEvaluation = useCallback(async (data: any) => {
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
  const createConsensus = useCallback(async (data: any) => {
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

  // Get employee evaluations
  const getEmployeeEvaluations = useCallback(async (cycleId: string, employeeId: string) => {
    return await evaluationService.getEmployeeEvaluations(cycleId, employeeId);
  }, []);

  // Check existing evaluation
  const checkExistingEvaluation = useCallback(async (
    cycleId: string,
    employeeId: string,
    type: 'self' | 'leader'
  ) => {
    return await evaluationService.checkExistingEvaluation(cycleId, employeeId, type);
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
    checkExistingEvaluation
  };
};