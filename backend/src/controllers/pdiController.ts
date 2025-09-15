import { Request, Response, NextFunction } from 'express';
import { pdiService } from '../services/pdiService';
import { AuthRequest } from '../middleware/auth';
import { PDIUtils } from '../utils/pdiUtils';

export const pdiController = {
  // Salvar PDI
  async savePDI(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { employeeId, cycleId, leaderEvaluationId, periodo } = req.body;

      console.log('🎯 Controller - Recebido no backend:', req.body);

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Campo obrigatório: employeeId'
        });
      }

      // Processar os dados do PDI vindos do frontend
      let processedItems;
      if (req.body.items && Array.isArray(req.body.items)) {
        // Se já vem como array de items (formato direto)
        processedItems = req.body.items;
        console.log('📋 Controller - Usando items diretos:', processedItems.length);
      } else {
        // Se vem no formato com arrays separados (curtosPrazos, mediosPrazos, longosPrazos)
        processedItems = PDIUtils.processPDIData(req.body);
        console.log('📋 Controller - Items processados:', processedItems.length);
      }

      if (!processedItems || processedItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'O PDI deve conter pelo menos um item'
        });
      }

      console.log('📝 Controller - Items antes da validação:', processedItems);

      // Validar items usando o método do service
      if (!pdiService.validatePDIItems(processedItems)) {
        console.log('❌ Controller - Validação falhou');
        return res.status(400).json({
          success: false,
          error: 'Estrutura dos itens do PDI inválida'
        });
      }

      console.log('✅ Controller - Validação passou, enviando para service');

      const pdi = await pdiService.savePDI(authReq.supabase, {
        employeeId,
        items: processedItems,
        cycleId,
        leaderEvaluationId,
        periodo,
        status: 'active',
        createdBy: authReq.user?.id
      });

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

      const pdi = await pdiService.getPDI(authReq.supabase, employeeId);

      res.json({
        success: true,
        data: pdi
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  },

  // Buscar PDIs por ciclo
  async getPDIsByCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { cycleId } = req.params;

      const pdis = await pdiService.getPDIsByCycle(authReq.supabase, cycleId);

      res.json({
        success: true,
        data: pdis
      });
    } catch (error) {
      console.error('Controller error:', error);
      next(error);
    }
  }
};