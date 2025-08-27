import { ApiError } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/supabase';
import { PDIUtils } from '../utils/pdiUtils';
import type { 
  EvaluationCycle, 
  SelfEvaluation,
  LeaderEvaluation,
  EvaluationCompetency,
  ConsensusMeeting,
  CycleDashboard,
  NineBoxData
} from '../types';

export const evaluationService = {
  // ====================================
  // CICLOS DE AVALIAÇÃO
  // ====================================
  
  // Buscar todos os ciclos
  async getEvaluationCycles(supabase: any) {
    try {
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to fetch evaluation cycles');
      }

      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Buscar ciclo atual
  async getCurrentCycle(supabase: any) {
    try {
      const now = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .in('status', ['active', 'open'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to fetch current cycle');
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar novo ciclo
  async createCycle(supabase: any, cycleData: any) {
    try {
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .insert({
          title: cycleData.title,
          description: cycleData.description,
          start_date: cycleData.start_date,
          end_date: cycleData.end_date,
          status: cycleData.status || 'draft',
          is_editable: true,
          created_by: cycleData.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to create cycle');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Atualizar status do ciclo
  async updateCycleStatus(supabase: any, cycleId: string, status: string) {
    try {
      // Se estiver abrindo um ciclo, fechar outros ciclos abertos
      if (status === 'open') {
        await supabase
          .from('evaluation_cycles')
          .update({ status: 'closed' })
          .eq('status', 'open');
      }

      const { data, error } = await supabase
        .from('evaluation_cycles')
        .update({
          status: status,
          is_editable: status !== 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', cycleId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to update cycle');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // DASHBOARD E RELATÓRIOS
  // ====================================
  
  // Dashboard do ciclo
  async getCycleDashboard(supabase: any, cycleId: string) {
    try {
      // Buscar autoavaliações
      const { data: selfEvals } = await supabase
        .from('self_evaluations')
        .select(`
          *,
          employee:users!employee_id(id, name, email, position)
        `)
        .eq('cycle_id', cycleId);

      // Buscar avaliações de líder
      const { data: leaderEvals } = await supabase
        .from('leader_evaluations')
        .select(`
          *,
          employee:users!employee_id(id, name, email, position),
          evaluator:users!evaluator_id(id, name)
        `)
        .eq('cycle_id', cycleId);

      // Buscar reuniões de consenso
      const { data: consensusMeetings } = await supabase
        .from('consensus_meetings')
        .select(`
          *,
          employee:users!employee_id(id, name)
        `)
        .eq('cycle_id', cycleId);

      // Combinar dados para o dashboard
      const employeeMap = new Map<string, CycleDashboard>();

      // Processar autoavaliações
      selfEvals?.forEach((se: any) => {
        const empId = se.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: se.employee?.name || '',
            employee_email: se.employee?.email || '',
            employee_position: se.employee?.position || '',
            self_evaluation_status: se.status,
            self_evaluation_score: se.final_score || null,
            leader_evaluation_status: 'pending',
            leader_evaluation_score: null,
            consensus_status: 'pending',
            consensus_performance_score: null,
            consensus_potential_score: null
          });
        } else {
          const emp = employeeMap.get(empId)!;
          emp.self_evaluation_status = se.status;
          emp.self_evaluation_score = se.final_score || null;
        }
      });

      // Processar avaliações de líder
      leaderEvals?.forEach((le: any) => {
        const empId = le.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: le.employee?.name || '',
            employee_email: le.employee?.email || '',
            employee_position: le.employee?.position || '',
            self_evaluation_status: 'pending',
            self_evaluation_score: null,
            leader_evaluation_status: le.status,
            leader_evaluation_score: le.final_score || null,
            consensus_status: 'pending',
            consensus_performance_score: null,
            consensus_potential_score: null
          });
        } else {
          const emp = employeeMap.get(empId)!;
          emp.leader_evaluation_status = le.status;
          emp.leader_evaluation_score = le.final_score || null;
        }
      });

      // Processar reuniões de consenso
      consensusMeetings?.forEach((cm: any) => {
        const empId = cm.employee_id;
        if (employeeMap.has(empId)) {
          const emp = employeeMap.get(empId)!;
          emp.consensus_status = cm.status;
          if (cm.status === 'completed') {
            emp.consensus_performance_score = cm.consensus_performance_score;
            emp.consensus_potential_score = cm.consensus_potential_score;
          }
        }
      });

      return Array.from(employeeMap.values());
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Dados do Nine Box
  async getNineBoxData(supabase: any, cycleId: string) {
    try {
      const { data, error } = await supabase
        .from('consensus_meetings')
        .select(`
          *,
          employee:users!employee_id(
            id, 
            name, 
            position,
            department:departments(name)
          )
        `)
        .eq('cycle_id', cycleId)
        .eq('status', 'completed');

      if (error) throw new ApiError(500, error.message);

      return data?.map((item: any) => ({
        employee_id: item.employee_id,
        employee_name: item.employee?.name || '',
        position: item.employee?.position || '',
        department: item.employee?.department?.name || '',
        performance_score: item.consensus_performance_score,
        potential_score: item.consensus_potential_score,
        nine_box_position: this.calculateNineBoxPosition(
          item.consensus_performance_score,
          item.consensus_potential_score
        )
      })) || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // AUTOAVALIAÇÕES
  // ====================================
  
  // Buscar autoavaliações do funcionário
  async getSelfEvaluations(supabase: any, employeeId: string, cycleId?: string) {
    try {
      let query = supabase
        .from('self_evaluations')
        .select(`
          *,
          evaluation_competencies!self_evaluation_id (*)
        `)
        .eq('employee_id', employeeId);
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new ApiError(500, error.message);
      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar autoavaliação
  async createSelfEvaluation(supabase: any, evaluationData: any) {
    try {
      // Calcular scores por categoria
      const technicalScore = this.calculateCategoryScore(evaluationData.competencies, 'technical');
      const behavioralScore = this.calculateCategoryScore(evaluationData.competencies, 'behavioral');
      const deliveriesScore = this.calculateCategoryScore(evaluationData.competencies, 'deliveries');
      const finalScore = this.calculateFinalScore(evaluationData.competencies);

      // Mapear os dados do frontend para os arrays do banco
      const knowledge = evaluationData.knowledge || [];
      const tools = evaluationData.tools || [];
      const strengths = evaluationData.strengths || [];
      const qualities = evaluationData.qualities || [];

      // Criar a autoavaliação
      const insertData: any = {
        cycle_id: evaluationData.cycleId,
        employee_id: evaluationData.employeeId,
        status: 'completed',
        technical_score: technicalScore,
        behavioral_score: behavioralScore,
        deliveries_score: deliveriesScore,
        final_score: finalScore,
        knowledge: knowledge,
        tools: tools,
        strengths_internal: strengths,
        qualities: qualities,
        improvements: [],
        observations: evaluationData.observations || [],
        evaluation_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };


      console.log('Inserting self evaluation data:', insertData);
      console.log('Raw evaluation data received:', evaluationData);

      // Primeiro inserir sem select para evitar problemas de cache
      const { error: evalError } = await supabase
        .from('self_evaluations')
        .insert(insertData);

      if (evalError) {
        console.error('Error inserting self evaluation:', evalError);
        throw new ApiError(500, evalError.message);
      }

      // Depois buscar o registro inserido
      const { data: evaluation, error: selectError } = await supabase
        .from('self_evaluations')
        .select('*')
        .eq('cycle_id', evaluationData.cycleId)
        .eq('employee_id', evaluationData.employeeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError) {
        console.error('Error selecting self evaluation:', selectError);
        throw new ApiError(500, selectError.message);
      }

      // Salvar as competências avaliadas
      if (evaluationData.competencies && evaluationData.competencies.length > 0) {
        const competenciesToInsert = evaluationData.competencies.map((comp: any) => ({
          self_evaluation_id: evaluation.id,
          criterion_name: comp.name,
          criterion_description: comp.description,
          category: comp.category,
          score: comp.score,
          written_response: comp.written_response || '',
          created_at: new Date().toISOString()
        }));

        const { error: compError } = await supabase
          .from('evaluation_competencies')
          .insert(competenciesToInsert);

        if (compError) throw new ApiError(500, compError.message);
      }

      return evaluation;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // AVALIAÇÕES DE LÍDER
  // ====================================
  
  // Buscar avaliações de líder
  async getLeaderEvaluations(supabase: any, employeeId: string, cycleId?: string) {
    try {
      let query = supabase
        .from('leader_evaluations')
        .select(`
          *,
          evaluation_competencies!leader_evaluation_id (*),
          evaluator:users!evaluator_id(id, name)
        `)
        .eq('employee_id', employeeId);
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new ApiError(500, error.message);
      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar avaliação de líder
  async createLeaderEvaluation(supabase: any, evaluationData: any) {
    try {
      // Calcular scores
      const technicalScore = this.calculateCategoryScore(evaluationData.competencies, 'technical');
      const behavioralScore = this.calculateCategoryScore(evaluationData.competencies, 'behavioral');
      const deliveriesScore = this.calculateCategoryScore(evaluationData.competencies, 'deliveries');
      const finalScore = this.calculateFinalScore(evaluationData.competencies);

      // Criar a avaliação
      const { data: evaluation, error: evalError } = await supabase
        .from('leader_evaluations')
        .insert({
          cycle_id: evaluationData.cycleId,
          employee_id: evaluationData.employeeId,
          evaluator_id: evaluationData.evaluatorId,
          status: 'completed',
          technical_score: technicalScore,
          behavioral_score: behavioralScore,
          deliveries_score: deliveriesScore,
          final_score: finalScore,
          potential_score: evaluationData.potentialScore,
          strengths: evaluationData.feedback?.strengths || '',
          improvements: evaluationData.feedback?.improvements || '',
          observations: evaluationData.feedback?.observations || '',
          evaluation_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (evalError) throw new ApiError(500, evalError.message);

      // Salvar as competências avaliadas
      if (evaluationData.competencies && evaluationData.competencies.length > 0) {
        const competenciesToInsert = evaluationData.competencies.map((comp: any) => ({
          leader_evaluation_id: evaluation.id,
          criterion_name: comp.name,
          criterion_description: comp.description,
          category: comp.category,
          score: comp.score,
          written_response: comp.written_response || '',
          created_at: new Date().toISOString()
        }));

        const { error: compError } = await supabase
          .from('evaluation_competencies')
          .insert(competenciesToInsert);

        if (compError) throw new ApiError(500, compError.message);
      }

      return evaluation;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // BUSCAR TODAS AS AVALIAÇÕES (UNIFICADO)
  // ====================================
  
  async getEmployeeEvaluations(supabase: any, employeeId: string) {
    try {
      // Buscar usando a view unificada
      const { data, error } = await supabase
        .from('v_evaluations_summary')
        .select('*')
        .eq('employee_id', employeeId)
        .order('evaluation_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Se a view não existir, buscar das tabelas separadas
        if (error.code === '42P01') {
          console.warn('View v_evaluations_summary does not exist, fetching from separate tables');
          
          const selfEvals = await this.getSelfEvaluations(supabase, employeeId);
          const leaderEvals = await this.getLeaderEvaluations(supabase, employeeId);
          
          return [
            ...selfEvals.map((e: any) => ({ ...e, evaluation_type: 'self' })),
            ...leaderEvals.map((e: any) => ({ ...e, evaluation_type: 'leader' }))
          ];
        }
        throw new ApiError(500, error.message || 'Failed to fetch evaluations');
      }

      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Verificar avaliação existente
  async checkExistingEvaluation(supabase: any, cycleId: string, employeeId: string, type: 'self' | 'leader') {
    try {
      const table = type === 'self' ? 'self_evaluations' : 'leader_evaluations';
      
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('cycle_id', cycleId)
        .eq('employee_id', employeeId)
        .limit(1);

      if (error) throw new ApiError(500, error.message);
      
      return data && data.length > 0;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // CONSENSO
  // ====================================
  
  // Criar reunião de consenso
  async createConsensusMeeting(supabase: any, meetingData: any) {
    try {
      const { data, error } = await supabase
        .from('consensus_meetings')
        .insert({
          cycle_id: meetingData.cycleId,
          employee_id: meetingData.employeeId,
          self_evaluation_id: meetingData.selfEvaluationId,
          leader_evaluation_id: meetingData.leaderEvaluationId,
          meeting_date: meetingData.meetingDate,
          consensus_performance_score: meetingData.performanceScore || 0,
          consensus_potential_score: meetingData.potentialScore || 0,
          meeting_notes: meetingData.notes || '',
          participants: meetingData.participants || [],
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: meetingData.createdBy
        })
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);
      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Completar consenso
  async completeConsensusMeeting(supabase: any, meetingId: string, data: any) {
    try {
      const { data: meeting, error } = await supabase
        .from('consensus_meetings')
        .update({
          consensus_performance_score: data.performanceScore,
          consensus_potential_score: data.potentialScore,
          meeting_notes: data.notes,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);

      // Criar registro na tabela consensus_evaluations
      const { error: consensusError } = await supabase
        .from('consensus_evaluations')
        .insert({
          employee_id: meeting.employee_id,
          self_evaluation_id: meeting.self_evaluation_id,
          leader_evaluation_id: meeting.leader_evaluation_id,
          consensus_score: data.performanceScore,
          potential_score: data.potentialScore,
          nine_box_position: this.calculateNineBoxPosition(
            data.performanceScore,
            data.potentialScore
          ),
          notes: data.notes,
          evaluation_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (consensusError) throw new ApiError(500, consensusError.message);

      return meeting;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // FUNÇÕES AUXILIARES
  // ====================================
  
  // Calcular score por categoria
  calculateCategoryScore(competencies: EvaluationCompetency[], category: string): number {
    const categoryComps = competencies.filter(c => c.category === category);
    if (categoryComps.length === 0) return 0;
    
    const sum = categoryComps.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return Number((sum / categoryComps.length).toFixed(3));
  },

  // Calcular score final com pesos: Técnicas (50%), Comportamentais (30%), Organizacionais (20%)
  calculateFinalScore(competencies: EvaluationCompetency[]): number {
    if (competencies.length === 0) return 0;
    
    // Definir os pesos para cada categoria
    const weights = {
      technical: 0.5,    // 50%
      behavioral: 0.3,   // 30%
      deliveries: 0.2    // 20% (organizacionais)
    };
    
    // Calcular média por categoria
    const categories = ['technical', 'behavioral', 'deliveries'] as const;
    let weightedSum = 0;
    let totalWeight = 0;
    
    categories.forEach(category => {
      const categoryComps = competencies.filter(c => c.category === category && c.score !== null);
      if (categoryComps.length > 0) {
        const categorySum = categoryComps.reduce((acc, comp) => acc + (comp.score || 0), 0);
        const categoryAverage = categorySum / categoryComps.length;
        
        weightedSum += categoryAverage * weights[category];
        totalWeight += weights[category];
      }
    });
    
    return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(3)) : 0;
  },

  // Calcular posição no Nine Box
  calculateNineBoxPosition(performance: number, potential: number): string {
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
  
  // Salvar PDI - Nova estrutura simplificada
  async savePDI(supabase: any, pdiData: any) {
    try {
      // Verificar se já existe um PDI ativo para o colaborador no ciclo
      const { data: existingPDI } = await supabase
        .from('development_plans')
        .select('*')
        .eq('employee_id', pdiData.employeeId)
        .eq('cycle_id', pdiData.cycleId || null)
        .eq('status', 'active')
        .single();

      if (existingPDI) {
        // Se já existe, atualizar o status para 'completed'
        await supabase
          .from('development_plans')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPDI.id);
      }

      // Estruturar items do PDI
      const pdiItems = pdiData.items || [];

      // Criar novo PDI com estrutura simplificada
      const { data, error } = await supabase
        .from('development_plans')
        .insert({
          employee_id: pdiData.employeeId,
          cycle_id: pdiData.cycleId || null,
          items: pdiItems,
          title: pdiData.title || `PDI - ${new Date().getFullYear()}`,
          description: pdiData.description || `Plano com ${pdiItems.length} itens`,
          start_date: pdiData.start_date || new Date().toISOString().split('T')[0],
          end_date: pdiData.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          priority: pdiData.priority || 'media',
          status: 'active',
          created_by: pdiData.created_by || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);
      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Buscar PDI ativo do colaborador
  async getPDI(supabase: any, employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('development_plans')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new ApiError(500, error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Atualizar PDI - Nova estrutura
  async updatePDI(supabase: any, pdiId: string, updates: any) {
    try {
      // Garantir que os items tenham timestamps atualizados
      let processedUpdates = { ...updates };
      
      if (updates.items && Array.isArray(updates.items)) {
        processedUpdates.items = updates.items.map((item: any) => ({
          ...item,
          updated_at: new Date().toISOString()
        }));
      }

      const { data, error } = await supabase
        .from('development_plans')
        .update({
          ...processedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', pdiId)
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);
      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // UPLOAD EM LOTE
  // ====================================

  // Criar avaliações em lote
  async bulkCreateEvaluations(
    supabase: any, 
    cycleId: string, 
    evaluationsData: any[], 
    createdBy: string
  ) {
    try {
      const results = {
        success: 0,
        errors: [] as string[]
      };

      for (const evalData of evaluationsData) {
        try {
          // Criar autoavaliação se tiver dados
          if (this.hasValidScores(evalData.selfEvaluation)) {
            await this.createSimpleEvaluation(supabase, {
              employee_id: evalData.userId,
              evaluator_id: evalData.userId,
              cycle_id: cycleId,
              type: 'self',
              technical_score: evalData.selfEvaluation.technical,
              behavioral_score: evalData.selfEvaluation.behavioral,
              deliveries_score: evalData.selfEvaluation.deliveries,
              status: 'completed',
              evaluation_date: new Date().toISOString()
            });
          }

          // Criar avaliação do líder se tiver dados
          if (this.hasValidScores(evalData.leaderEvaluation)) {
            await this.createSimpleEvaluation(supabase, {
              employee_id: evalData.userId,
              evaluator_id: createdBy, // Master como avaliador
              cycle_id: cycleId,
              type: 'leader',
              technical_score: evalData.leaderEvaluation.technical,
              behavioral_score: evalData.leaderEvaluation.behavioral,
              deliveries_score: evalData.leaderEvaluation.deliveries,
              potential_score: evalData.leaderEvaluation.potential,
              status: 'completed',
              evaluation_date: new Date().toISOString()
            });
          }

          // Criar competências do toolkit se tiver dados
          if (evalData.toolkit && Object.keys(evalData.toolkit).length > 0) {
            await this.createToolkitCompetencies(supabase, evalData.userId, evalData.toolkit, cycleId);
          }

          // Criar PDI se tiver dados
          if (this.hasValidPDI(evalData.pdi)) {
            await this.createPDI(supabase, {
              employee_id: evalData.userId,
              goals: [
                evalData.pdi.shortTermGoals,
                evalData.pdi.mediumTermGoals,
                evalData.pdi.longTermGoals
              ].filter(goal => goal.trim()),
              actions: [evalData.pdi.developmentActions].filter(action => action.trim()),
              resources: [evalData.pdi.resources].filter(resource => resource.trim()),
              timeline: evalData.pdi.timeline,
              created_by: createdBy
            });
          }

          results.success++;
        } catch (error: any) {
          results.errors.push(`Erro ao processar usuário ${evalData.userId}: ${error.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Validar dados em lote
  async validateBulkEvaluations(evaluationsData: any[]) {
    const errors: string[] = [];
    
    for (const evalData of evaluationsData) {
      // Validar scores (1-5)
      if (evalData.selfEvaluation) {
        const selfErrors = this.validateScores(evalData.selfEvaluation, 'Autoavaliação');
        errors.push(...selfErrors);
      }
      
      if (evalData.leaderEvaluation) {
        const leaderErrors = this.validateScores(evalData.leaderEvaluation, 'Avaliação do Líder');
        errors.push(...leaderErrors);
      }
      
      if (evalData.toolkit) {
        const toolkitErrors = this.validateScores(evalData.toolkit, 'Toolkit');
        errors.push(...toolkitErrors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Métodos auxiliares
  hasValidScores(scores: any): boolean {
    if (!scores) return false;
    return Object.values(scores).some(score => score !== null && score !== undefined);
  },

  hasValidPDI(pdi: any): boolean {
    if (!pdi) return false;
    return Object.values(pdi).some(value => value && value.toString().trim() !== '');
  },

  validateScores(scores: any, section: string): string[] {
    const errors: string[] = [];
    
    Object.entries(scores).forEach(([key, value]: [string, any]) => {
      if (value !== null && value !== undefined) {
        const score = Number(value);
        if (isNaN(score) || score < 1 || score > 5) {
          errors.push(`${section}: ${key} deve estar entre 1 e 5`);
        }
      }
    });
    
    return errors;
  },


  async createToolkitCompetencies(supabase: any, userId: string, toolkit: any, cycleId: string) {
    const competencies = Object.entries(toolkit)
      .filter(([_, score]) => score !== null && score !== undefined)
      .map(([name, score]) => ({
        employee_id: userId,
        criterion_name: name,
        criterion_description: `Competência: ${name}`,
        category: 'behavioral',
        score: Number(score),
        cycle_id: cycleId
      }));

    if (competencies.length > 0) {
      const { error } = await supabase
        .from('evaluation_competencies')
        .insert(competencies);

      if (error) throw new ApiError(500, error.message);
    }
  },

  async createPDI(supabase: any, data: any) {
    const { data: result, error } = await supabase
      .from('development_plans')
      .insert({
        employee_id: data.employee_id,
        goals: data.goals,
        actions: data.actions,
        resources: data.resources,
        timeline: data.timeline,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return result;
  },

  // Método simples para criar avaliações diretas
  async createSimpleEvaluation(supabase: any, data: any) {
    const { data: result, error } = await supabase
      .from('evaluations')
      .insert(data)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return result;
  },

  // ====================================
  // BULK MANAGEMENT SAVE
  // ====================================
  async bulkManagementSave(supabase: any, cycleId: string, evaluations: any[], userId: string) {
    // Use admin client to bypass RLS policies for bulk operations
    const adminClient = supabaseAdmin;
    try {
      console.log('=== INICIANDO BULK MANAGEMENT SAVE ===');
      console.log('CycleId:', cycleId);
      console.log('UserId:', userId);
      console.log('Number of evaluations:', evaluations.length);
      
      const results = {
        success: 0,
        errors: [] as string[]
      };

      for (const evaluation of evaluations) {
        console.log(`\n--- Processando avaliação para usuário ${evaluation.userId} ---`);
        try {
          console.log('Dados da avaliação recebidos:', JSON.stringify(evaluation, null, 2));
          
          // Declare variables to be used across sections
          let selfEvaluationResult: any = null;
          let leaderEvaluationResult: any = null;
          
          // 1. Salvar autoavaliação se houver dados
          if (evaluation.selfEvaluation && evaluation.selfEvaluation.competencies) {
            console.log('Salvando autoavaliação...');
            const selfEvaluationData = {
              employee_id: evaluation.userId,
              cycle_id: cycleId,
              status: 'completed',
              technical_score: this.calculateCategoryScoreFromObject(evaluation.selfEvaluation.competencies.technical),
              behavioral_score: this.calculateCategoryScoreFromObject(evaluation.selfEvaluation.competencies.behavioral),
              deliveries_score: this.calculateCategoryScoreFromObject(evaluation.selfEvaluation.competencies.deliveries),
              final_score: this.calculateFinalScoreFromObject(evaluation.selfEvaluation.competencies),
              evaluation_date: new Date().toISOString().split('T')[0],
              // Incluir dados de toolkit se existirem
              knowledge: evaluation.selfEvaluation.toolkit?.conhecimentos || [],
              tools: evaluation.selfEvaluation.toolkit?.ferramentas || [],
              strengths_internal: evaluation.selfEvaluation.toolkit?.forcasInternas || [],
              qualities: evaluation.selfEvaluation.toolkit?.qualidades || [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            console.log('Dados da autoavaliação a serem salvos:', JSON.stringify(selfEvaluationData, null, 2));

            // Primeiro, verificar se já existe uma autoavaliação para este usuário e ciclo
            const { data: existingSelfEvaluation, error: findSelfError } = await adminClient
              .from('self_evaluations')
              .select('id')
              .eq('employee_id', evaluation.userId)
              .eq('cycle_id', cycleId)
              .single();

            let selfError;
            if (existingSelfEvaluation && !findSelfError) {
              // Atualizar autoavaliação existente
              const { data, error } = await adminClient
                .from('self_evaluations')
                .update(selfEvaluationData)
                .eq('id', existingSelfEvaluation.id)
                .select()
                .single();
              selfEvaluationResult = data;
              selfError = error;
            } else {
              // Criar nova autoavaliação
              const { data, error } = await adminClient
                .from('self_evaluations')
                .insert(selfEvaluationData)
                .select()
                .single();
              selfEvaluationResult = data;
              selfError = error;
            }

            if (selfError) {
              console.error('Erro ao salvar autoavaliação:', selfError);
              results.errors.push(`Erro ao salvar autoavaliação para usuário ${evaluation.userId}: ${selfError.message}`);
            } else if (selfEvaluationResult?.id) {
              // Salvar competências detalhadas da autoavaliação
              const criteria = this.flattenCompetencies(evaluation.selfEvaluation.competencies);
              for (const criterion of criteria) {
                const { error: compError } = await adminClient
                  .from('evaluation_competencies')
                  .upsert({
                    evaluation_id: selfEvaluationResult.id, // Use the self evaluation ID as the main evaluation_id
                    self_evaluation_id: selfEvaluationResult.id,
                    criterion_name: criterion.name,
                    criterion_description: criterion.description || '',
                    category: criterion.category,
                    score: criterion.score,
                    created_at: new Date().toISOString()
                  });
                
                if (compError) {
                  console.error('Erro ao salvar competência da autoavaliação:', compError);
                }
              }
            }
          }

          // 2. Salvar avaliação do líder se houver dados
          if (evaluation.leaderEvaluation) {
            console.log('Salvando avaliação do líder...');
            const potentialScore = evaluation.leaderEvaluation.potential 
              ? this.calculatePotentialScore(evaluation.leaderEvaluation.potential)
              : null;

            const leaderEvaluationData = {
              employee_id: evaluation.userId,
              evaluator_id: userId,
              cycle_id: cycleId,
              status: 'completed',
              technical_score: this.calculateCategoryScoreFromObject(evaluation.leaderEvaluation.technical),
              behavioral_score: this.calculateCategoryScoreFromObject(evaluation.leaderEvaluation.behavioral),
              deliveries_score: this.calculateCategoryScoreFromObject(evaluation.leaderEvaluation.deliveries),
              final_score: this.calculateFinalScoreFromObject(evaluation.leaderEvaluation),
              potential_score: potentialScore,
              evaluation_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            console.log('Dados da avaliação do líder a serem salvos:', JSON.stringify(leaderEvaluationData, null, 2));

            // Primeiro, verificar se já existe uma avaliação de líder para este usuário e ciclo
            const { data: existingLeaderEvaluation, error: findLeaderError } = await adminClient
              .from('leader_evaluations')
              .select('id')
              .eq('employee_id', evaluation.userId)
              .eq('evaluator_id', userId)
              .eq('cycle_id', cycleId)
              .single();

            let leaderError;
            if (existingLeaderEvaluation && !findLeaderError) {
              // Atualizar avaliação de líder existente
              const { data, error } = await adminClient
                .from('leader_evaluations')
                .update(leaderEvaluationData)
                .eq('id', existingLeaderEvaluation.id)
                .select()
                .single();
              leaderEvaluationResult = data;
              leaderError = error;
            } else {
              // Criar nova avaliação de líder
              const { data, error } = await adminClient
                .from('leader_evaluations')
                .insert(leaderEvaluationData)
                .select()
                .single();
              leaderEvaluationResult = data;
              leaderError = error;
            }

            if (leaderError) {
              console.error('Erro ao salvar avaliação do líder:', leaderError);
              results.errors.push(`Erro ao salvar avaliação do líder para usuário ${evaluation.userId}: ${leaderError.message}`);
            } else if (leaderEvaluationResult?.id) {
              // Salvar competências detalhadas da avaliação do líder
              const leaderCriteria = this.flattenCompetencies({
                technical: evaluation.leaderEvaluation.technical,
                behavioral: evaluation.leaderEvaluation.behavioral,
                deliveries: evaluation.leaderEvaluation.deliveries
              });
              
              for (const criterion of leaderCriteria) {
                const { error: compError } = await adminClient
                  .from('evaluation_competencies')
                  .upsert({
                    evaluation_id: leaderEvaluationResult.id, // Use the leader evaluation ID as the main evaluation_id
                    leader_evaluation_id: leaderEvaluationResult.id,
                    criterion_name: criterion.name,
                    criterion_description: criterion.description || '',
                    category: criterion.category,
                    score: criterion.score,
                    created_at: new Date().toISOString()
                  });
                
                if (compError) {
                  console.error('Erro ao salvar competência da avaliação do líder:', compError);
                }
              }
            }
          }

          // 3. Salvar dados de consenso se houver
          if (evaluation.consensus && selfEvaluationResult && leaderEvaluationResult) {
            console.log('Salvando dados de consenso...');
            
            // Calcular scores do consenso com pesos corretos
            const consensusPerformanceScore = this.calculateFinalScoreFromObject(evaluation.consensus);

            // Verificar se já existe um consenso
            const { data: existingConsensus, error: findConsensusError } = await adminClient
              .from('consensus_evaluations')
              .select('id')
              .eq('employee_id', evaluation.userId)
              .eq('self_evaluation_id', selfEvaluationResult.id)
              .eq('leader_evaluation_id', leaderEvaluationResult.id)
              .single();

            const consensusData = {
              employee_id: evaluation.userId,
              self_evaluation_id: selfEvaluationResult.id,
              leader_evaluation_id: leaderEvaluationResult.id,
              consensus_score: consensusPerformanceScore,
              potential_score: leaderEvaluationResult.potential_score || null,
              nine_box_position: this.calculateNineBoxPosition(
                consensusPerformanceScore,
                leaderEvaluationResult.potential_score || 1
              ),
              notes: evaluation.consensus.notes || '',
              evaluation_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            let consensusError;
            if (existingConsensus && !findConsensusError) {
              // Atualizar consenso existente
              const { error } = await adminClient
                .from('consensus_evaluations')
                .update(consensusData)
                .eq('id', existingConsensus.id);
              consensusError = error;
            } else {
              // Criar novo consenso
              const { error } = await adminClient
                .from('consensus_evaluations')
                .insert(consensusData);
              consensusError = error;
            }

            if (consensusError) {
              console.error('Erro ao salvar consenso:', consensusError);
              results.errors.push(`Erro ao salvar consenso para usuário ${evaluation.userId}: ${consensusError.message}`);
            } else {
              console.log('Consenso salvo com sucesso');
            }
          } else {
            console.log('consenso tambem nao foi salvo');
          }

          // 4. Salvar PDI se houver dados
          if (evaluation.pdi) {
            console.log('Salvando PDI...');
            console.log('Dados PDI recebidos:', JSON.stringify(evaluation.pdi, null, 2));
            
            // Usar PDIUtils para processar os dados
            const allPdiItems = PDIUtils.processPDIData(evaluation.pdi);

            console.log(`PDI items processados: ${allPdiItems.length}`);
            console.log('Items do PDI:', JSON.stringify(allPdiItems, null, 2));

            if (allPdiItems.length > 0) {
              const pdiData = {
                employee_id: evaluation.userId,
                cycle_id: cycleId,
                status: 'active',
                // Estrutura simplificada - apenas items JSONB (calendarização dentro dos items já serve como data)
                items: allPdiItems,
                created_by: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Primeiro, verificar se já existe um PDI para este usuário e ciclo
              const { data: existingPdi, error: findPdiError } = await adminClient
                .from('development_plans')
                .select('id')
                .eq('employee_id', evaluation.userId)
                .eq('cycle_id', cycleId)
                .single();

              let pdiError;
              if (existingPdi && !findPdiError) {
                // Atualizar PDI existente
                const { error } = await adminClient
                  .from('development_plans')
                  .update(pdiData)
                  .eq('id', existingPdi.id);
                pdiError = error;
                console.log('PDI atualizado para usuário:', evaluation.userId);
              } else {
                // Criar novo PDI
                const { error } = await adminClient
                  .from('development_plans')
                  .insert(pdiData);
                pdiError = error;
                console.log('Novo PDI criado para usuário:', evaluation.userId);
              }

              if (pdiError) {
                console.error('Erro ao salvar PDI:', pdiError);
                results.errors.push(`Erro ao salvar PDI para usuário ${evaluation.userId}: ${pdiError.message}`);
              } else {
                console.log('\n\nPDI salvo com sucesso! Dados preservados.');
              }
            } else {
              console.log('Nenhum item de PDI encontrado para processar');
            }
          } else {
            console.log('\n\no pdi foi salvo mas faltam as informações que foram digitadas');
          }

          results.success++;
        } catch (error: any) {
          console.error(`Erro ao processar avaliação do usuário ${evaluation.userId}:`, error);
          results.errors.push(`Erro para usuário ${evaluation.userId}: ${error.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error('Erro no bulkManagementSave:', error);
      throw error;
    }
  },

  // Função auxiliar para calcular score de categoria (novo formato)
  calculateCategoryScoreFromObject(categoryData: { [key: string]: number | null }): number {
    if (!categoryData) return 0;
    
    const scores = Object.values(categoryData).filter(score => score !== null) as number[];
    if (scores.length === 0) return 0;
    
    return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(3));
  },

  // Função auxiliar para calcular score de potencial
  calculatePotentialScore(potentialData: { [key: string]: number | null }): number {
    if (!potentialData) return 0;
    
    const scores = Object.values(potentialData).filter(score => score !== null) as number[];
    if (scores.length === 0) return 0;
    
    return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(3));
  },

  // Função auxiliar para calcular score final com pesos a partir de objeto de competências
  calculateFinalScoreFromObject(competencies: { 
    technical: { [key: string]: number | null };
    behavioral: { [key: string]: number | null };
    deliveries: { [key: string]: number | null };
  }): number {
    // Definir os pesos para cada categoria
    const weights = {
      technical: 0.5,    // 50%
      behavioral: 0.3,   // 30%
      deliveries: 0.2    // 20% (organizacionais)
    };
    
    const categories = ['technical', 'behavioral', 'deliveries'] as const;
    let weightedSum = 0;
    let totalWeight = 0;
    
    categories.forEach(category => {
      const categoryData = competencies[category];
      if (categoryData) {
        const scores = Object.values(categoryData).filter(score => score !== null) as number[];
        if (scores.length > 0) {
          const categoryAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          weightedSum += categoryAverage * weights[category];
          totalWeight += weights[category];
        }
      }
    });
    
    return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(3)) : 0;
  },

  // Função auxiliar para achatar competências
  flattenCompetencies(competencies: { [category: string]: { [name: string]: number | null } }): Array<{
    name: string;
    description?: string;
    category: string;
    score: number;
  }> {
    const flattened: Array<{
      name: string;
      description?: string;
      category: string;
      score: number;
    }> = [];

    for (const [category, skills] of Object.entries(competencies)) {
      for (const [name, score] of Object.entries(skills)) {
        if (score !== null) {
          flattened.push({
            name,
            category,
            score
          });
        }
      }
    }

    return flattened;
  }
};