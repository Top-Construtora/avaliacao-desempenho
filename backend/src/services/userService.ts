// backend/src/services/userService.ts
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';
import { User } from '../types';

export const userService = {
  async getUsers(filters?: {
    active?: boolean;
    is_leader?: boolean;
    is_director?: boolean;
    is_master?: boolean;
    reports_to?: string;
    // Novos filtros
    gender?: string;
    has_children?: boolean;
    marital_status?: string;
    supports_team?: boolean;
    practices_sports?: boolean;
    favorite_color?: string;
    sport?: string;
  }) {
    let query = supabaseAdmin.from('users').select('*');

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    if (filters?.is_leader !== undefined) {
      query = query.eq('is_leader', filters.is_leader);
    }
    if (filters?.is_director !== undefined) {
      query = query.eq('is_director', filters.is_director);
    }
    if (filters?.is_master !== undefined) {
      query = query.eq('is_master', filters.is_master);
    }
    if (filters?.reports_to) {
      query = query.eq('reports_to', filters.reports_to);
    }
    
    // Aplicar novos filtros
    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters?.has_children !== undefined) {
      query = query.eq('has_children', filters.has_children);
    }
    if (filters?.marital_status) {
      query = query.eq('marital_status', filters.marital_status);
    }
    if (filters?.supports_team !== undefined) {
      query = query.eq('supports_team', filters.supports_team);
    }
    if (filters?.practices_sports !== undefined) {
      query = query.eq('practices_sports', filters.practices_sports);
    }
    if (filters?.favorite_color) {
      query = query.eq('favorite_color', filters.favorite_color);
    }
    if (filters?.sport) {
      query = query.contains('sports', [filters.sport]);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch users');
    }

    // Debug dos dados do Supabase
    if (data && data.length > 0) {
      const leadersFromDB = data.filter(u => u.is_leader === true || u.is_director === true);
      const leadersLoose = data.filter(u => u.is_leader || u.is_director);

      console.log(`[BACKEND] Total usuários: ${data.length} | Líderes (strict): ${leadersFromDB.length} | Líderes (loose): ${leadersLoose.length}`);

      if (leadersLoose.length > 0) {
        console.log('[BACKEND] Primeiros líderes encontrados:', leadersLoose.slice(0, 2).map(u => ({
          name: u.name,
          is_leader: u.is_leader,
          is_director: u.is_director,
          type_leader: typeof u.is_leader,
          type_director: typeof u.is_director
        })));
      } else {
        // Se não encontrou líderes, mostrar tipos dos primeiros usuários
        console.log('[BACKEND] Nenhum líder encontrado. Tipos dos primeiros usuários:', data.slice(0, 2).map(u => ({
          name: u.name,
          is_leader: u.is_leader,
          is_director: u.is_director,
          type_leader: typeof u.is_leader,
          type_director: typeof u.is_director
        })));
      }
    }

    return data;
  },

  async getUserById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new ApiError(404, 'User not found');
    }

    return data;
  },

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    // Validar e preparar os dados
    const userToInsert = {
      ...userData,
      // Garantir que arrays vazios sejam tratados corretamente
      children_age_ranges: userData.has_children ? (userData.children_age_ranges || []) : [],
      sports: userData.practices_sports ? (userData.sports || []) : [],
      team_name: userData.supports_team ? userData.team_name : null,
      // Garantir valores padrão
      gender: userData.gender || null,
      has_children: userData.has_children || false,
      marital_status: userData.marital_status || null,
      hobbies: userData.hobbies || null,
      favorite_color: userData.favorite_color || null,
      supports_team: userData.supports_team || false,
      practices_sports: userData.practices_sports || false,
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userToInsert)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to create user');
    }

    return data;
  },

  async updateUser(id: string, updates: Partial<User>) {
    // Preparar atualizações incluindo novos campos
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Garantir que arrays vazios sejam tratados corretamente
    if ('children_age_ranges' in updateData && !updateData.has_children) {
      updateData.children_age_ranges = [];
    }
    
    if ('sports' in updateData && !updateData.practices_sports) {
      updateData.sports = [];
    }
    
    if ('team_name' in updateData && !updateData.supports_team) {
      updateData.team_name = null;
    }

    // Remover campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to update user');
    }

    return data;
  },

  async deleteUser(id: string) {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new ApiError(500, 'Failed to delete user');
    }
  },

  async createUserWithAuth(email: string, password: string, userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'email'>) {
    try {
      // Verificar se o email já existe na tabela users
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new ApiError(400, 'Email já cadastrado no sistema');
      }

      // Verificar se já existe um usuário no Auth com este email
      const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();

      let authUserId: string;
      let existingAuthUser = null;

      if (existingAuthUsers && existingAuthUsers.users.length > 0) {
        // Procurar o usuário com o email específico
        existingAuthUser = existingAuthUsers.users.find(
          user => user.email?.toLowerCase() === email.toLowerCase()
        );
      }

      if (existingAuthUser) {
        // Se o usuário já existe no Auth, usar o ID existente
        authUserId = existingAuthUser.id;
        
        // Atualizar a senha se necessário
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            position: userData.position
          }
        });
      } else {
        // Criar usuário no Auth usando Admin API (não cria sessão)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true, // Confirma o email automaticamente
          user_metadata: {
            name: userData.name,
            position: userData.position
          }
        });

        if (authError || !authData.user) {
          throw new ApiError(500, authError?.message || 'Erro ao criar usuário no sistema de autenticação');
        }

        authUserId = authData.user.id;
      }

      // Verificar se já existe um usuário com este ID na tabela users (pode acontecer se houver inconsistências)
      const { data: existingUserById } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (existingUserById) {
        // Se já existe um usuário com este ID mas com email diferente, há uma inconsistência
        if (existingUserById.email !== email.toLowerCase()) {
          throw new ApiError(500, 'Inconsistência detectada: ID de usuário já existe com email diferente');
        }
        // Se é o mesmo email, atualizar os dados e retornar
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUserId)
          .select()
          .single();

        if (updateError) {
          throw new ApiError(500, 'Erro ao atualizar usuário existente: ' + updateError.message);
        }

        return updatedUser;
      }

      // Preparar dados do usuário
      const userToInsert = {
        id: authUserId,
        email: email.toLowerCase(),
        ...userData,
        // Garantir que arrays vazios sejam tratados corretamente
        children_age_ranges: userData.has_children ? (userData.children_age_ranges || []) : [],
        sports: userData.practices_sports ? (userData.sports || []) : [],
        team_name: userData.supports_team ? userData.team_name : null,
        // Garantir valores padrão
        gender: userData.gender || null,
        has_children: userData.has_children || false,
        marital_status: userData.marital_status || null,
        hobbies: userData.hobbies || null,
        favorite_color: userData.favorite_color || null,
        supports_team: userData.supports_team || false,
        practices_sports: userData.practices_sports || false,
        active: true,
        join_date: userData.join_date || new Date().toISOString().split('T')[0]
      };

      // Criar perfil do usuário
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert(userToInsert)
        .select()
        .single();

      if (profileError) {
        // Se houver erro ao criar o perfil, deletar o usuário do Auth apenas se foi criado agora
        if (!existingAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        throw new ApiError(500, 'Erro ao criar perfil: ' + profileError.message);
      }

      return userProfile;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro ao criar usuário');
    }
  },

  async getSubordinates(leaderId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('reports_to', leaderId)
      .eq('active', true)
      .order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch subordinates');
    }

    return data;
  },

  // Novos métodos para estatísticas
  async getUserStatistics() {
    try {
      // Total por gênero
      const { data: genderStats } = await supabaseAdmin
        .from('users')
        .select('gender')
        .eq('active', true);

      // Total com filhos
      const { data: childrenStats } = await supabaseAdmin
        .from('users')
        .select('has_children')
        .eq('active', true)
        .eq('has_children', true);

      // Total que pratica esportes
      const { data: sportsStats } = await supabaseAdmin
        .from('users')
        .select('practices_sports')
        .eq('active', true)
        .eq('practices_sports', true);

      // Processar estatísticas
      const genderCount = genderStats?.reduce((acc: any, user) => {
        const gender = user.gender || 'nao_informado';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {});

      return {
        totalUsers: genderStats?.length || 0,
        genderDistribution: genderCount || {},
        usersWithChildren: childrenStats?.length || 0,
        usersPracticingSports: sportsStats?.length || 0
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user statistics');
    }
  }
};