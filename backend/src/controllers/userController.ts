import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export const userController = {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {};

      // Só aplicar filtros quando explicitamente fornecidos
      if (req.query.active !== undefined) {
        filters.active = req.query.active === 'true';
      }
      if (req.query.is_leader !== undefined) {
        filters.is_leader = req.query.is_leader === 'true';
      }
      if (req.query.is_director !== undefined) {
        filters.is_director = req.query.is_director === 'true';
      }
      if (req.query.reports_to) {
        filters.reports_to = req.query.reports_to as string;
      }

      const users = await userService.getUsers(filters);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async createUserWithAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, ...userData } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }

      const user = await userService.createUserWithAuth(email, password, userData);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getSubordinates(req: Request, res: Response, next: NextFunction) {
    try {
      const { leaderId } = req.params;
      const subordinates = await userService.getSubordinates(leaderId);

      res.json({
        success: true,
        data: subordinates
      });
    } catch (error) {
      next(error);
    }
  },

  // Endpoint temporário para configurar líderes
  async setUserAsLeader(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { is_leader, is_director } = req.body;

      const user = await userService.updateUser(userId, {
        is_leader: is_leader === true,
        is_director: is_director === true
      });

      res.json({
        success: true,
        data: user,
        message: `Usuário ${user.name} atualizado com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }

};