import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Flag para evitar múltiplas renovações simultâneas
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Adiciona callbacks para serem chamados após o refresh
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Chama todos os callbacks após o refresh
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

export const api = {
  baseURL: API_BASE_URL,

  async request(endpoint: string, options: RequestInit = {}, isRetry = false) {
    const token = sessionStorage.getItem('access_token');

    // Headers padrão limpos
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Adiciona token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Não adiciona headers customizados que possam causar problemas
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Importante para CORS
      mode: 'cors', // Explicitamente define modo CORS
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`
        }));

        // Se for erro 401 e não for uma tentativa de retry, tenta renovar o token
        if (response.status === 401 && !isRetry) {
          try {
            // Se já está renovando, aguarda a renovação atual
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                subscribeTokenRefresh((newToken: string) => {
                  // Tenta novamente com o novo token
                  this.request(endpoint, options, true)
                    .then(resolve)
                    .catch(reject);
                });
              });
            }

            isRefreshing = true;

            // Tenta renovar a sessão com o Supabase
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !session) {
              throw new Error('Falha ao renovar sessão');
            }

            // Atualiza o token no sessionStorage
            sessionStorage.setItem('access_token', session.access_token);

            // Notifica todos os requests que estavam aguardando
            onTokenRefreshed(session.access_token);
            isRefreshing = false;

            // Tenta novamente a requisição com o novo token
            return this.request(endpoint, options, true);
          } catch (refreshError) {
            isRefreshing = false;
            // Se não conseguir renovar, redireciona para login
            console.error('Erro ao renovar token:', refreshError);
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = '/login?session_expired=true';
            throw new Error('Sessão expirada. Faça login novamente.');
          }
        }

        const error: any = new Error(errorData.message || errorData.error || 'API request failed');
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }
      
      // Verifica se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        
        // Se a resposta tem sucesso mas está estruturada diferente
        if (data.success === false) {
          const error: any = new Error(data.error || data.message || 'Request failed');
          error.response = {
            status: response.status,
            data: data
          };
          throw error;
        }
        
        return data;
      } else {
        // Se não for JSON, retorna como texto
        return await response.text();
      }
    } catch (error: any) {
      // Se for erro de rede/conexão
      if (!error.response) {
        error.request = true;
      }
      
      // Log de debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('API Request Error:', {
          endpoint,
          method: options.method || 'GET',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
      
      throw error;
    }
  },

  get(endpoint: string, customHeaders?: HeadersInit) {
    return this.request(endpoint, { 
      method: 'GET',
      headers: customHeaders 
    });
  },

  post(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  put(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  patch(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PATCH', 
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  delete(endpoint: string, customHeaders?: HeadersInit) {
    return this.request(endpoint, { 
      method: 'DELETE',
      headers: customHeaders
    });
  },
};