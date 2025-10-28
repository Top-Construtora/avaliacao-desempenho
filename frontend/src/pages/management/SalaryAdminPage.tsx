import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Building, GitBranch, Plus, ChevronRight,
  Trash2, Save, X, Settings, BarChart3, 
} from 'lucide-react';

// Importações corretas dos serviços
import Button from '../../components/Button';
import { RoleGuard } from '../../components/RoleGuard';
import { departmentsService } from '../../services/departments.service';
import { salaryService, CareerTrack } from '../../services/salary.service';

// Interface para Department estendida com active
interface DepartmentWithActive {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  responsibleId?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
}

// --- Componente Principal da Página de Administração ---
const SalaryAdminPage = () => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<CareerTrack[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithActive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTrackModal, setShowCreateTrackModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Buscar departamentos primeiro
      let departmentsData: DepartmentWithActive[] = [];
      try {
        const departmentsResponse = await departmentsService.getDepartments();
        departmentsData = Array.isArray(departmentsResponse) ? departmentsResponse : [];
        
        // Mapear para garantir que temos a estrutura correta
        departmentsData = departmentsData.map(dept => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          manager_id: dept.manager_id,
          responsibleId: dept.responsibleId,
          active: (dept as any).active !== false, // Default true se não especificado
          created_at: dept.created_at,
          updated_at: dept.updated_at,
          createdAt: dept.createdAt
        }));
        
        // Filtrar apenas departamentos ativos
        departmentsData = departmentsData.filter(dept => dept.active !== false);
        
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error);
        departmentsData = [];
      }

      // Buscar trilhas - com tratamento de erro mais específico
      let tracksData: CareerTrack[] = [];
      try {
        const tracksResponse = await salaryService.getTracks();
        tracksData = Array.isArray(tracksResponse) ? tracksResponse : [];
      } catch (error: any) {
        console.error('Erro ao carregar trilhas:', error);
        
        // Se for erro 404 ou 500, significa que talvez a tabela não exista ainda
        if (error.response?.status === 404 || error.response?.status === 500) {
          console.warn('Sistema de trilhas pode não estar configurado ainda no backend');
          toast('Sistema de trilhas em configuração. Continue para criar a primeira trilha.');
        }
        
        tracksData = [];
      }

      setTracks(tracksData);
      setDepartments(departmentsData);
      
      if (departmentsData.length === 0) {
        toast('Nenhum departamento ativo encontrado. Crie departamentos primeiro através do menu "Gerenciar Usuários".');
      }
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      toast.error('Falha ao carregar dados iniciais.');
      setTracks([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = async (formData: any) => {
    try {
      // Adicionar campos obrigatórios e converter para snake_case
      const trackData = {
        name: formData.name,
        code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '_'),
        description: formData.description || '',
        department_id: formData.department_id,
        active: true
      };

      const newTrack = await salaryService.createTrack(trackData);
      setTracks(prev => [...prev, newTrack]);
      toast.success('Trilha de carreira criada com sucesso!');
      setShowCreateTrackModal(false);
      // Navega para a página de detalhes da nova trilha para continuar a configuração
      navigate(`/salary/tracks/${newTrack.id}`);
    } catch (error: any) {
      console.error('Erro detalhado ao criar trilha:', error);
      
      // Tratamento de erro mais específico
      if (error.response) {
        // Erro da API
        console.error('Resposta de erro da API:', error.response);
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           'Erro ao criar a trilha. Verifique os dados e tente novamente.';
        toast.error(errorMessage);
      } else if (error.request) {
        // Sem resposta do servidor
        console.error('Sem resposta do servidor:', error.request);
        toast.error('Erro de conexão com o servidor. Verifique sua conexão.');
      } else {
        // Outro tipo de erro
        toast.error('Erro ao criar a trilha: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta trilha e todos os seus cargos associados?')) return;
    try {
      await salaryService.deleteTrack(trackId);
      setTracks(prev => prev.filter(t => t.id !== trackId));
      toast.success('Trilha excluída com sucesso.');
    } catch (error) {
      toast.error('Erro ao excluir a trilha.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['director']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* --- Cabeçalho --- */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <Settings className="h-7 w-7 text-primary-600 mr-3" />
                  Administração de Carreiras
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Crie e gerencie as trilhas de carreira por departamento.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate('/salary-management')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visão Geral
                </Button>
                <Button onClick={() => setShowCreateTrackModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Nova Trilha
                </Button>
              </div>
            </div>
          </motion.div>

          {/* --- Lista de Trilhas de Carreira --- */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.1 }} 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <GitBranch className="text-primary-600" />
              Trilhas de Carreira Criadas
            </h2>
            
            {tracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tracks.map(track => {
                  const department = departments.find(d => d.id === track.department_id);
                  return (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {track.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                            <Building className="h-3 w-3" />
                            {department?.name || 'Departamento não encontrado'}
                          </p>
                          {track.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {track.description}
                            </p>
                          )}
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              track.active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {track.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteTrack(track.id)} 
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            title="Excluir trilha"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => navigate(`/salary/tracks/${track.id}`)}
                          className="w-full"
                        >
                          <span className="inline-flex items-center">
                            Gerenciar Cargos
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </span>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
                <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Nenhuma trilha de carreira foi criada ainda.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Comece clicando em "Criar Nova Trilha".
                </p>
              </div>
            )}
          </motion.div>

          {/* --- Modal de Criação de Trilha --- */}
          <AnimatePresence>
            {showCreateTrackModal && (
              <CreateTrackModal
                departments={departments}
                onSave={handleCreateTrack}
                onClose={() => setShowCreateTrackModal(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </RoleGuard>
  );
};

// --- Componente do Modal para Criar Trilha ---
interface CreateTrackModalProps {
  departments: DepartmentWithActive[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const CreateTrackModal = ({ departments, onSave, onClose }: CreateTrackModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    description: ''
  });

  const handleSaveClick = () => {
    if (!formData.name || !formData.department_id) {
      toast.error('Por favor, preencha o nome e selecione um departamento.');
      return;
    }
    onSave(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Criar Nova Trilha de Carreira
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento *
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione um departamento</option>
              {departments.length > 0 ? (
                departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Nenhum departamento disponível
                </option>
              )}
            </select>
            {departments.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Nenhum departamento encontrado. Crie departamentos através do menu "Gerenciar Usuários".
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Trilha *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Trilha de Engenharia, Trilha Comercial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código (opcional)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: ENG, COM (será gerado automaticamente se vazio)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Descreva brevemente esta trilha de carreira"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveClick}
            disabled={!formData.name || !formData.department_id || departments.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar e Continuar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SalaryAdminPage;