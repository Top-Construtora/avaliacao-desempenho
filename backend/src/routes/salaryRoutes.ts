import { Router } from 'express';
import { salaryController } from '../controllers/salaryController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// ===== CLASSES SALARIAIS =====
router.get('/classes', salaryController.getSalaryClasses as any);
router.get('/classes/:id', salaryController.getSalaryClassById as any);
router.post('/classes', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.createSalaryClass as any);
router.put('/classes/:id', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.updateSalaryClass as any);
router.delete('/classes/:id', authorizeRoles(['master', 'director']) as any, salaryController.deleteSalaryClass as any);

// ===== CARGOS =====
router.get('/positions', salaryController.getJobPositions as any);
router.get('/positions/:id', salaryController.getJobPositionById as any);
router.post('/positions', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.createJobPosition as any);
router.put('/positions/:id', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.updateJobPosition as any);
router.delete('/positions/:id', authorizeRoles(['master', 'director']) as any, salaryController.deleteJobPosition as any);

// ===== INTERNÍVEIS =====
router.get('/levels', salaryController.getSalaryLevels as any);
router.get('/levels/:id', salaryController.getSalaryLevelById as any);
router.post('/levels', authorizeRoles(['master', 'director']) as any, salaryController.createSalaryLevel as any);
router.put('/levels/:id', authorizeRoles(['master', 'director']) as any, salaryController.updateSalaryLevel as any);
router.delete('/levels/:id', authorizeRoles(['master', 'director']) as any, salaryController.deleteSalaryLevel as any);

// ===== TRILHAS DE CARREIRA =====
router.get('/tracks', salaryController.getCareerTracks as any);
router.get('/tracks/:id', salaryController.getCareerTrackById as any);
router.get('/tracks/department/:departmentId', salaryController.getTracksByDepartment as any);
router.post('/tracks', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.createCareerTrack as any);
router.put('/tracks/:id', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.updateCareerTrack as any);
router.delete('/tracks/:id', authorizeRoles(['master', 'director']) as any, salaryController.deleteCareerTrack as any);

// ===== POSIÇÕES NAS TRILHAS =====
router.get('/track-positions', salaryController.getTrackPositions as any);
router.get('/track-positions/:id', salaryController.getTrackPositionById as any);
router.get('/track-positions/track/:trackId', salaryController.getPositionsByTrack as any);
router.post('/track-positions', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.createTrackPosition as any);
router.put('/track-positions/:id', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.updateTrackPosition as any);
router.delete('/track-positions/:id', authorizeRoles(['master', 'director']) as any, salaryController.deleteTrackPosition as any);

// ===== REGRAS DE PROGRESSÃO =====
router.get('/progression-rules', salaryController.getProgressionRules as any);
router.get('/progression-rules/:id', salaryController.getProgressionRuleById as any);
router.get('/progression-rules/from/:positionId', salaryController.getRulesByFromPosition as any);
router.post('/progression-rules', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.createProgressionRule as any);
router.put('/progression-rules/:id', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.updateProgressionRule as any);
router.delete('/progression-rules/:id', authorizeRoles(['master', 'director']) as any, salaryController.deleteProgressionRule as any);

// ===== ATRIBUIÇÃO DE TRILHAS E CARGOS =====
router.put('/users/:userId/assign-track', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.assignUserToTrack as any);
router.put('/users/:userId/update-level', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.updateUserSalaryLevel as any);
router.get('/users/:userId/salary-info', salaryController.getUserSalaryInfo as any);
router.get('/users/:userId/possible-progressions', salaryController.getUserPossibleProgressions as any);

// ===== PROGRESSÃO DE CARREIRA =====
router.post('/users/:userId/progress', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.progressUser as any);
router.get('/users/:userId/progression-history', salaryController.getUserProgressionHistory as any);

// ===== RELATÓRIOS E DASHBOARDS =====
router.get('/reports/overview', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.getSalaryOverview as any);
router.get('/reports/by-department', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.getSalaryByDepartment as any);
router.get('/reports/by-position', authorizeRoles(['master', 'director', 'leader']) as any, salaryController.getSalaryByPosition as any);

// ===== CÁLCULO DE SALÁRIO =====
router.post('/calculate', salaryController.calculateSalary as any);

export default router;