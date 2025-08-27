import { Router } from 'express';
import { evaluationController } from '../controllers/evaluationController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas de avaliação requerem autenticação
router.use(authenticateToken as any);

// ====================================
// ROTAS DE CICLOS
// ====================================
router.get('/cycles', evaluationController.getCycles);
router.get('/cycles/current', evaluationController.getCurrentCycle);
router.post('/cycles', evaluationController.createCycle);
router.put('/cycles/:id/open', evaluationController.openCycle);
router.put('/cycles/:id/close', evaluationController.closeCycle);

// ====================================
// ROTAS DE DASHBOARD E RELATÓRIOS
// ====================================
router.get('/cycles/:cycleId/dashboard', evaluationController.getCycleDashboard);
router.get('/cycles/:cycleId/nine-box', evaluationController.getNineBoxData);

// ====================================
// ROTAS DE AVALIAÇÕES
// ====================================

// Rotas unificadas (usando a view)
router.get('/employee/:employeeId', evaluationController.getEmployeeEvaluations);
router.get('/check', evaluationController.checkExistingEvaluation);

// Rotas específicas para autoavaliações
router.get('/self-evaluations/:employeeId', evaluationController.getSelfEvaluations);
router.post('/self', evaluationController.createSelfEvaluation);

// Rotas específicas para avaliações de líder
router.get('/leader-evaluations/:employeeId', evaluationController.getLeaderEvaluations);
router.post('/leader', evaluationController.createLeaderEvaluation);

// ====================================
// ROTAS DE CONSENSO
// ====================================
router.post('/consensus', evaluationController.createConsensusMeeting);
router.put('/consensus/:meetingId/complete', evaluationController.completeConsensusMeeting);

// ====================================
// ROTAS DE PDI (NOVO)
// ====================================
router.post('/pdi', evaluationController.savePDI);
router.get('/pdi/:employeeId', evaluationController.getPDI);
router.put('/pdi/:pdiId', evaluationController.updatePDI);

// ====================================
// ROTAS DE UPLOAD EM LOTE (MASTER ONLY)
// ====================================
router.post('/bulk-upload', authorizeRoles(['master']) as any, evaluationController.bulkUploadEvaluations);
router.post('/bulk-validate', authorizeRoles(['master']) as any, evaluationController.bulkValidateEvaluations);

// ====================================
// ROTAS DE GERENCIAMENTO EM LOTE (DIRECTORS ONLY)
// ====================================
router.post('/bulk-management-save', authorizeRoles(['director', 'master']) as any, evaluationController.bulkManagementSave);

export default router;