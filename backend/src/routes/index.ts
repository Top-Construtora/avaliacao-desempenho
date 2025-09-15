import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import departmentRoutes from './departmentRoutes';
import evaluationRoutes from './evaluationRoutes';
import salaryRoutes from './salaryRoutes';
import pdiRoutes from './pdiRoutes';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/salary', salaryRoutes);
router.use('/pdi', pdiRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;