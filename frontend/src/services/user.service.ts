import { api } from '../config/api';
import { User } from '../types/user';

export const userService = {
  async getUsers(filters?: {
    active?: boolean;
    is_leader?: boolean;
    is_director?: boolean;
    is_master?: boolean;
    reports_to?: string;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams(
      Object.entries(filters || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    const response = await api.get(`/users?${queryParams}`);
    return response.data.data || response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data || response.data;
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const response = await api.post('/users', user);
    return response.data.data || response.data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, updates);
    return response.data.data || response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async getSubordinates(leaderId: string): Promise<User[]> {
    const response = await api.get(`/users/leader/${leaderId}/subordinates`);
    return response.data.data || response.data;
  },

  async createUserWithAuth(userData: any): Promise<User> {
    const response = await api.post('/users/create-with-auth', userData);
    return response.data.data || response.data;
  },

  async getAllUsers(): Promise<User[]> {
    // Busca TODOS os usuários sem nenhum filtro aplicado
    const response = await api.get('/users');
    return response.data.data || response.data;
  }
};