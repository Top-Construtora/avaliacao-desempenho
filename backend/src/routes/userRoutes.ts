import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticateToken as any);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.post('/create-with-auth', userController.createUserWithAuth);
router.put('/:id', userController.updateUser);
router.put('/set-leader/:userId', userController.setUserAsLeader);
router.delete('/:id', userController.deleteUser);
router.get('/leader/:leaderId/subordinates', userController.getSubordinates);

export default router;