import { Router } from 'express';
import { departmentController } from '../controllers/departmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Listar departamentos - todos podem ver
router.get('/', departmentController.getDepartments as any);

// Buscar departamento por ID - todos podem ver
router.get('/:id', departmentController.getDepartmentById as any);

// Criar departamento - apenas diretores
router.post('/', authorizeRoles(['master', 'director']) as any, departmentController.createDepartment as any);

// Atualizar departamento - apenas diretores
router.put('/:id', authorizeRoles(['master', 'director']) as any, departmentController.updateDepartment as any);

// Deletar departamento - apenas diretores
router.delete('/:id', authorizeRoles(['master', 'director']) as any, departmentController.deleteDepartment as any);

export default router;