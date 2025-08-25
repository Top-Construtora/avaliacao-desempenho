import { Request, Response, NextFunction } from 'express';
import { evaluationService } from '../services/evaluationService';
import { AuthRequest } from '../middleware/auth';

export const evaluationController = {
  // ====================================
  // CICLOS DE AVALIAÇÃO
  // ====================================
  
  // Buscar todos os ciclos
  async getCycles(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const cycles = await evaluationService.getEvaluationCycles(authReq.supabase);
      
      res.json({
        success: true,
        data: cycles
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar ciclo atual
  async getCurrentCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const currentCycle = await evaluationService.getCurrentCycle(authReq.supabase);
      
      res.json({
        success: true,
        data: currentCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar ciclo
  async createCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const cycleData = req.body;
      
      const newCycle = await evaluationService.createCycle(authReq.supabase, {
        ...cycleData,
        created_by: authReq.user?.id
      });
      
      res.json({
        success: true,
        data: newCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Abrir ciclo
  async openCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      
      const updatedCycle = await evaluationService.updateCycleStatus(
        authReq.supabase,
        id,
        'open'
      );
      
      res.json({
        success: true,
        data: updatedCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Fechar ciclo
  async closeCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      
      const updatedCycle = await evaluationService.updateCycleStatus(
        authReq.supabase,
        id,
        'closed'
      );
      
      res.json({
        success: true,
        data: updatedCycle
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // ====================================
  // DASHBOARD E RELATÓRIOS
  // ====================================
  
  // Dashboard do ciclo
  async getCycleDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;
      
      const dashboard = await evaluationService.getCycleDashboard(
        authReq.supabase,
        cycleId
      );
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Dados NineBox
  async getNineBoxData(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;
      
      const nineBoxData = await evaluationService.getNineBoxData(
        authReq.supabase,
        cycleId
      );
      
      res.json({
        success: true,
        data: nineBoxData
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // ====================================
  // AVALIAÇÕES
  // ====================================
  
  // Buscar avaliações do funcionário (unificado)
  async getEmployeeEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      
      const evaluations = await evaluationService.getEmployeeEvaluations(
        authReq.supabase,
        employeeId
      );
      
      res.json({
        success: true,
        data: evaluations
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar autoavaliações
  async getSelfEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      const { cycleId } = req.query;
      
      const evaluations = await evaluationService.getSelfEvaluations(
        authReq.supabase,
        employeeId,
        cycleId as string
      );
      
      res.json({
        success: true,
        data: evaluations
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar avaliações de líder
  async getLeaderEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      const { cycleId } = req.query;
      
      const evaluations = await evaluationService.getLeaderEvaluations(
        authReq.supabase,
        employeeId,
        cycleId as string
      );
      
      res.json({
        success: true,
        data: evaluations
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Verificar avaliação existente
  async checkExistingEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId, employeeId, type } = req.query;
      
      if (!cycleId || !employeeId || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: cycleId, employeeId, type'
        });
      }
      
      const exists = await evaluationService.checkExistingEvaluation(
        authReq.supabase,
        cycleId as string,
        employeeId as string,
        type as 'self' | 'leader'
      );
      
      res.json({
        success: true,
        data: exists
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar autoavaliação
  async createSelfEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      // Limpar campos desnecessários
      const cleanedBody = { ...req.body };
      delete cleanedBody.written_feedback;
      delete cleanedBody.writtenFeedback;
      
      console.log('Controller received body:', req.body);
      console.log('Controller sending cleaned body:', cleanedBody);
      
      const evaluation = await evaluationService.createSelfEvaluation(
        authReq.supabase,
        cleanedBody
      );
      
      res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Criar avaliação do líder
  async createLeaderEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const evaluation = await evaluationService.createLeaderEvaluation(
        authReq.supabase,
        req.body
      );
      
      res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // ====================================
  // CONSENSO
  // ====================================
  
  // Criar reunião de consenso
  async createConsensusMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const meeting = await evaluationService.createConsensusMeeting(
        authReq.supabase,
        {
          ...req.body,
          createdBy: authReq.user?.id
        }
      );
      
      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Completar consenso
  async completeConsensusMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { meetingId } = req.params;
      const { performanceScore, potentialScore, notes } = req.body;
      
      if (!performanceScore || !potentialScore) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: performanceScore, potentialScore'
        });
      }
      
      const meeting = await evaluationService.completeConsensusMeeting(
        authReq.supabase,
        meetingId,
        { performanceScore, potentialScore, notes }
      );
      
      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // ====================================
  // PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL)
  // ====================================
  
  // Salvar PDI
  async savePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId, goals, actions, resources, timeline } = req.body;
      
      if (!employeeId || !goals || !actions) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: employeeId, goals, actions'
        });
      }
      
      const pdi = await evaluationService.savePDI(
        authReq.supabase,
        {
          employeeId,
          goals,
          actions,
          resources,
          timeline,
          createdBy: authReq.user?.id
        }
      );
      
      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar PDI
  async getPDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId } = req.params;
      
      const pdi = await evaluationService.getPDI(
        authReq.supabase,
        employeeId
      );
      
      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Atualizar PDI
  async updatePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { pdiId } = req.params;
      const { goals, actions, resources, timeline } = req.body;
      
      const pdi = await evaluationService.updatePDI(
        authReq.supabase,
        pdiId,
        {
          goals,
          actions,
          resources,
          timeline
        }
      );
      
      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // ====================================
  // UPLOAD EM LOTE
  // ====================================

  // Upload em lote de avaliações
  async bulkUploadEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId, evaluations } = req.body;

      if (!cycleId || !evaluations || !Array.isArray(evaluations)) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros inválidos. cycleId e evaluations são obrigatórios.'
        });
      }

      if (!authReq.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      const result = await evaluationService.bulkCreateEvaluations(
        authReq.supabase,
        cycleId,
        evaluations,
        authReq.user.id
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Validar dados em lote
  async bulkValidateEvaluations(req: Request, res: Response, next: NextFunction) {
    try {
      const { evaluations } = req.body;

      if (!evaluations || !Array.isArray(evaluations)) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro evaluations é obrigatório.'
        });
      }

      const result = await evaluationService.validateBulkEvaluations(evaluations);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  }
};