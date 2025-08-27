import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  Users, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Calculator,
  Target,
  FileText,
  User as UserIcon
} from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useEvaluation } from '../../hooks/useEvaluation';
import { userService } from '../../services/user.service';
import { evaluationService } from '../../services/evaluation.service';
import type { User } from '../../types/user';
import type { EvaluationCycle } from '../../types/evaluation.types';

interface UserEvaluationData {
  userId: string;
  user: User;
  // Autoavaliação - Toolkit (campos de texto)
  selfEvaluation: {
    conhecimentos: string[];
    ferramentas: string[];
    forcasInternas: string[];
    qualidades: string[];
    // Competências (notas de 1-4)
    competencies: {
      technical: { [key: string]: number | null };
      behavioral: { [key: string]: number | null };
      deliveries: { [key: string]: number | null };
    };
  };
  // Avaliação do Líder (notas de 1-4)
  leaderEvaluation: {
    technical: { [key: string]: number | null };
    behavioral: { [key: string]: number | null };
    deliveries: { [key: string]: number | null };
    // Potencial (notas de 1-4)
    potential: {
      funcaoSubsequente: number | null;
      aprendizadoContinuo: number | null;
      alinhamentoCultural: number | null;
      visaoSistemica: number | null;
    };
  };
  // PDI (Plano de Desenvolvimento Individual)
  pdi: {
    shortTermGoals: string;
    mediumTermGoals: string;
    longTermGoals: string;
    developmentActions: string;
    resources: string;
    timeline: string;
  };
  // Status
  isComplete: boolean;
  hasErrors: boolean;
  errorMessages: string[];
  // Status de salvamento individual
  isSaving: boolean;
  lastSaved?: Date;
  saveError?: string;
}

const BulkEvaluationUpload: React.FC = () => {
  const { user } = useAuth();
  const { cycles, loadCycles } = useEvaluation();
  
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [evaluationData, setEvaluationData] = useState<UserEvaluationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'errors'>('all');

  // Seções do Toolkit
  const toolkitSections = [
    { key: 'conhecimentos', label: 'Conhecimentos' },
    { key: 'ferramentas', label: 'Ferramentas' },
    { key: 'forcasInternas', label: 'Forças Internas' },
    { key: 'qualidades', label: 'Qualidades' }
  ];

  // Competências para avaliação
  const competencyCategories = {
    technical: EVALUATION_COMPETENCIES.technical,
    behavioral: EVALUATION_COMPETENCIES.behavioral,
    deliveries: EVALUATION_COMPETENCIES.deliveries
  };

  // Verificar permissão (apenas master)
  const hasPermission = user?.is_master;

  useEffect(() => {
    if (hasPermission) {
      loadCycles();
      loadUsers();
    }
  }, [hasPermission]);

  useEffect(() => {
    if (selectedCycle && users.length > 0) {
      initializeEvaluationData();
    }
  }, [selectedCycle, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Carregar usuários ativos, excluindo diretores
      const userData = await userService.getUsers({ 
        active: true, 
        is_director: false 
      });
      setUsers(userData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const initializeEvaluationData = () => {
    const initialData: UserEvaluationData[] = users.map(user => ({
      userId: user.id,
      user,
      selfEvaluation: {
        conhecimentos: [''],
        ferramentas: [''],
        forcasInternas: [''],
        qualidades: [''],
        competencies: {
          technical: competencyCategories.technical.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
          behavioral: competencyCategories.behavioral.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
          deliveries: competencyCategories.deliveries.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        }
      },
      leaderEvaluation: {
        technical: competencyCategories.technical.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        behavioral: competencyCategories.behavioral.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        deliveries: competencyCategories.deliveries.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        potential: {
          funcaoSubsequente: null,
          aprendizadoContinuo: null,
          alinhamentoCultural: null,
          visaoSistemica: null,
        },
      },
      pdi: {
        shortTermGoals: '',
        mediumTermGoals: '',
        longTermGoals: '',
        developmentActions: '',
        resources: '',
        timeline: '',
      },
      isComplete: false,
      hasErrors: false,
      errorMessages: [],
      isSaving: false,
      lastSaved: undefined,
      saveError: undefined,
    }));
    setEvaluationData(initialData);
  };

  const updateEvaluationData = (userId: string, section: keyof UserEvaluationData, field: string, value: any) => {
    setEvaluationData(prev => prev.map(item => {
      if (item.userId === userId) {
        let updated = { ...item };
        
        // Handle nested competencies updates
        if (field.includes('.')) {
          const [nestedSection, category] = field.split('.');
          updated = {
            ...updated,
            [section]: {
              ...updated[section],
              [nestedSection]: {
                ...updated[section][nestedSection as keyof typeof updated[typeof section]],
                [category]: value
              }
            }
          };
        } else {
          updated = {
            ...updated,
            [section]: {
              ...updated[section],
              [field]: value
            }
          };
        }
        
        // Validar e atualizar status
        const validationResult = validateUserData(updated);
        updated.isComplete = validationResult.isComplete;
        updated.hasErrors = validationResult.hasErrors;
        updated.errorMessages = validationResult.errorMessages;
        
        // Reset save error when data changes
        if (updated.saveError) {
          updated.saveError = undefined;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const validateUserData = (userData: UserEvaluationData) => {
    const errors: string[] = [];
    
    // Validar competências da autoavaliação (1-4)
    const selfCompetencyScores = [
      ...Object.values(userData.selfEvaluation.competencies.technical),
      ...Object.values(userData.selfEvaluation.competencies.behavioral),
      ...Object.values(userData.selfEvaluation.competencies.deliveries)
    ];
    if (selfCompetencyScores.some(score => score !== null && (score < 1 || score > 4))) {
      errors.push('Notas das competências da autoavaliação devem estar entre 1 e 4');
    }
    
    // Validar avaliação do líder (1-4)
    const leaderScores = [
      ...Object.values(userData.leaderEvaluation.technical),
      ...Object.values(userData.leaderEvaluation.behavioral),
      ...Object.values(userData.leaderEvaluation.deliveries)
    ];
    if (leaderScores.some(score => score !== null && (score < 1 || score > 4))) {
      errors.push('Notas da avaliação do líder devem estar entre 1 e 4');
    }
    
    // Validar potencial (1-4)
    const potentialScores = Object.values(userData.leaderEvaluation.potential);
    if (potentialScores.some(score => score !== null && (score < 1 || score > 4))) {
      errors.push('Notas de potencial devem estar entre 1 e 4');
    }
    
    // Verificar completude (pelo menos uma seção preenchida)
    const hasToolkit = ['conhecimentos', 'ferramentas', 'forcasInternas', 'qualidades'].some(key => 
      (userData.selfEvaluation[key as keyof typeof userData.selfEvaluation] as string[]).some(item => item.trim() !== '')
    );
    const hasSelfCompetencies = selfCompetencyScores.some(score => score !== null);
    const hasLeaderEvaluation = leaderScores.some(score => score !== null);
    const hasPotential = potentialScores.some(score => score !== null);
    const hasPDI = Object.values(userData.pdi).some(value => value.trim() !== '');
    
    const isComplete = hasToolkit || hasSelfCompetencies || hasLeaderEvaluation || hasPotential || hasPDI;
    
    return {
      isComplete,
      hasErrors: errors.length > 0,
      errorMessages: errors
    };
  };

  const filteredEvaluationData = evaluationData.filter(item => {
    const matchesSearch = item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'complete' && item.isComplete) ||
                         (statusFilter === 'incomplete' && !item.isComplete) ||
                         (statusFilter === 'errors' && item.hasErrors);
                         
    return matchesSearch && matchesStatus;
  });

  const getCompletionStats = () => {
    const total = evaluationData.length;
    const complete = evaluationData.filter(item => item.isComplete).length;
    const withErrors = evaluationData.filter(item => item.hasErrors).length;
    
    return { total, complete, withErrors, percentage: total > 0 ? (complete / total) * 100 : 0 };
  };

  const handleSave = async () => {
    if (!selectedCycle) {
      toast.error('Selecione um ciclo de avaliação');
      return;
    }

    try {
      setSaving(true);
      
      // Filtrar apenas dados completos
      const dataToSave = evaluationData.filter(item => item.isComplete && !item.hasErrors);
      
      if (dataToSave.length === 0) {
        toast.error('Nenhum dado válido para salvar');
        return;
      }

      // Salvar avaliações em lote
      const result = await evaluationService.bulkSaveEvaluations(selectedCycle, dataToSave);
      
      if (result.errors.length > 0) {
        toast.error(`${result.success} avaliações salvas. ${result.errors.length} com erro.`);
        console.error('Erros ao salvar:', result.errors);
      } else {
        toast.success(`${result.success} avaliações salvas com sucesso!`);
      }
      
    } catch (error) {
      console.error('Erro ao salvar avaliações:', error);
      toast.error('Erro ao salvar avaliações');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividual = async (userId: string) => {
    if (!selectedCycle) {
      toast.error('Selecione um ciclo de avaliação');
      return;
    }

    const userData = evaluationData.find(item => item.userId === userId);
    if (!userData) {
      toast.error('Dados do usuário não encontrados');
      return;
    }

    if (userData.hasErrors) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    // Set saving state
    setEvaluationData(prev => prev.map(item => 
      item.userId === userId 
        ? { ...item, isSaving: true, saveError: undefined }
        : item
    ));

    try {
      // Save individual user evaluation
      const result = await evaluationService.bulkSaveEvaluations(selectedCycle, [userData]);
      
      if (result.errors.length > 0) {
        throw new Error(result.errors[0]);
      }

      // Update success state
      setEvaluationData(prev => prev.map(item => 
        item.userId === userId 
          ? { ...item, isSaving: false, lastSaved: new Date(), saveError: undefined }
          : item
      ));
      
      toast.success(`Avaliação de ${userData.user.name} salva com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao salvar avaliação individual:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Update error state
      setEvaluationData(prev => prev.map(item => 
        item.userId === userId 
          ? { ...item, isSaving: false, saveError: errorMessage }
          : item
      ));
      
      toast.error(`Erro ao salvar avaliação: ${errorMessage}`);
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      initializeEvaluationData();
      toast.success('Dados limpos com sucesso');
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Apenas usuários Master podem acessar esta funcionalidade.
          </p>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-blue-500" />
              Upload em Lote - Avaliações
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie autoavaliações (toolkit + competências), avaliações do líder e PDIs em lote
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading || saving}
              className="flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!selectedCycle || stats.complete === 0 || saving}
              className="flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : `Salvar (${stats.complete})`}
            </Button>
          </div>
        </div>

        {/* Seleção de Ciclo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ciclo de Avaliação *
            </label>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
            >
              <option value="">Selecione um ciclo</option>
              {cycles.map(cycle => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.title} ({cycle.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estatísticas */}
        {selectedCycle && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Total de Usuários
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Completos
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {stats.complete}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Calculator className="w-8 h-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    Progresso
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Com Erros
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {stats.withErrors}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      {selectedCycle && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
              >
                <option value="all">Todos</option>
                <option value="complete">Completos</option>
                <option value="incomplete">Incompletos</option>
                <option value="errors">Com Erros</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      {selectedCycle && (
        <div className="space-y-6">
          {filteredEvaluationData.map((item) => (
            <UserEvaluationCard
              key={item.userId}
              data={item}
              toolkitSections={toolkitSections}
              competencyCategories={competencyCategories}
              onUpdateData={updateEvaluationData}
              onSaveIndividual={handleSaveIndividual}
              selectedCycle={selectedCycle}
            />
          ))}
          
          {filteredEvaluationData.length === 0 && selectedCycle && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar os filtros de busca.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Componente para cada card de usuário
interface ToolkitSection {
  key: string;
  label: string;
}

interface UserEvaluationCardProps {
  data: UserEvaluationData;
  toolkitSections: ToolkitSection[];
  competencyCategories: {
    technical: any[];
    behavioral: any[];
    deliveries: any[];
  };
  onUpdateData: (userId: string, section: keyof UserEvaluationData, field: string, value: any) => void;
  onSaveIndividual: (userId: string) => void;
  selectedCycle: string;
}

const UserEvaluationCard: React.FC<UserEvaluationCardProps> = ({
  data,
  toolkitSections,
  competencyCategories,
  onUpdateData,
  onSaveIndividual,
  selectedCycle
}) => {
  const getStatusIcon = () => {
    if (data.hasErrors) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (data.isComplete) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
  };

  const ScoreInput: React.FC<{
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
  }> = ({ value, onChange, placeholder }) => (
    <input
      type="number"
      min="1"
      max="4"
      step="0.1"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder={placeholder}
      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {data.user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {data.user.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.user.position} • {data.user.department?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {data.lastSaved && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Salvo {data.lastSaved.toLocaleTimeString()}
              </span>
            )}
            {data.saveError && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                Erro ao salvar
              </span>
            )}
            {data.hasErrors && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                Erros encontrados
              </span>
            )}
            {data.isComplete ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Completo
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Incompleto
              </span>
            )}
            <button
              onClick={() => onSaveIndividual(data.userId)}
              disabled={data.isSaving || data.hasErrors || !selectedCycle}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.isSaving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : data.hasErrors || !selectedCycle
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {data.isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
        
        {(data.errorMessages.length > 0 || data.saveError) && (
          <div className="mt-4 space-y-2">
            {data.errorMessages.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="space-y-2">
                  {data.errorMessages.map((error, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {data.saveError && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  Erro ao salvar: {data.saveError}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seções Colapsáveis */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {/* Autoavaliação - Toolkit */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('toolkit')}
            className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Autoavaliação - Toolkit
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Conhecimentos, ferramentas, forças internas e qualidades
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSectionCompletion('toolkit') && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {expandedSections.toolkit ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
          
          <AnimatePresence>
            {expandedSections.toolkit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {toolkitSections.map((section) => (
                    <div key={section.key} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {section.label}
                      </label>
                      <div className="space-y-2">
                        {(data.selfEvaluation[section.key as keyof typeof data.selfEvaluation] as string[] || ['']).map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newArray = [...(data.selfEvaluation[section.key as keyof typeof data.selfEvaluation] as string[])];
                                newArray[index] = e.target.value;
                                onUpdateData(data.userId, 'selfEvaluation', section.key, newArray);
                              }}
                              placeholder={`Ex: ${section.label.toLowerCase()}...`}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentArray = data.selfEvaluation[section.key as keyof typeof data.selfEvaluation] as string[];
                                if (currentArray.length > 1) {
                                  const newArray = currentArray.filter((_, i) => i !== index);
                                  onUpdateData(data.userId, 'selfEvaluation', section.key, newArray);
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentArray = data.selfEvaluation[section.key as keyof typeof data.selfEvaluation] as string[];
                            onUpdateData(data.userId, 'selfEvaluation', section.key, [...currentArray, '']);
                          }}
                          className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar {section.label}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Autoavaliação - Competências */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('selfCompetencies')}
            className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Autoavaliação - Competências
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avaliação das próprias competências (escala 1-4)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSectionCompletion('selfCompetencies') && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {expandedSections.selfCompetencies ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
          
          <AnimatePresence>
            {expandedSections.selfCompetencies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-6">
                  {Object.entries(competencyCategories).map(([category, competencies]) => (
                    <div key={category} className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                        {category === 'technical' ? '🔧 Competências Técnicas' : 
                         category === 'behavioral' ? '🤝 Competências Comportamentais' : 
                         '🎯 Competências Organizacionais'}
                      </h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {competencies.map((competency: any) => (
                          <div key={competency.name} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {competency.name}
                            </label>
                            <div className="flex items-center space-x-2">
                              <ScoreInput
                                value={data.selfEvaluation.competencies[category as keyof typeof data.selfEvaluation.competencies][competency.name]}
                                onChange={(value) => {
                                  const newCompetencies = {
                                    ...data.selfEvaluation.competencies[category as keyof typeof data.selfEvaluation.competencies],
                                    [competency.name]: value
                                  };
                                  onUpdateData(data.userId, 'selfEvaluation', `competencies.${category}`, newCompetencies);
                                }}
                                placeholder="1-4"
                              />
                              <span className="text-xs text-gray-500">/4</span>
                            </div>
                            {competency.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {competency.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avaliação do Líder */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('leaderEvaluation')}
            className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Avaliação do Líder
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avaliação das competências pelo líder (escala 1-4)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSectionCompletion('leaderEvaluation') && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {expandedSections.leaderEvaluation ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
          
          <AnimatePresence>
            {expandedSections.leaderEvaluation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-6">
                  {Object.entries(competencyCategories).map(([category, competencies]) => (
                    <div key={category} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                        {category === 'technical' ? '🔧 Competências Técnicas' : 
                         category === 'behavioral' ? '🤝 Competências Comportamentais' : 
                         '🎯 Competências Organizacionais'}
                      </h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {competencies.map((competency: any) => (
                          <div key={competency.name} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {competency.name}
                            </label>
                            <div className="flex items-center space-x-2">
                              <ScoreInput
                                value={data.leaderEvaluation[category as keyof typeof data.leaderEvaluation][competency.name] as number | null}
                                onChange={(value) => {
                                  const newCompetencies = {
                                    ...data.leaderEvaluation[category as keyof typeof data.leaderEvaluation],
                                    [competency.name]: value
                                  };
                                  onUpdateData(data.userId, 'leaderEvaluation', category, newCompetencies);
                                }}
                                placeholder="1-4"
                              />
                              <span className="text-xs text-gray-500">/4</span>
                            </div>
                            {competency.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {competency.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PDI */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('pdi')}
            className="w-full flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  PDI - Plano de Desenvolvimento Individual
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Objetivos, ações e cronograma de desenvolvimento
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSectionCompletion('pdi') && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {expandedSections.pdi ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
          
          <AnimatePresence>
            {expandedSections.pdi && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-6">
                  {/* Objetivos */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                      🎯 Objetivos de Desenvolvimento
                    </h5>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          📅 Curto Prazo (6 meses)
                        </label>
                        <textarea
                          value={data.pdi.shortTermGoals}
                          onChange={(e) => onUpdateData(data.userId, 'pdi', 'shortTermGoals', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          rows={4}
                          placeholder="Ex: Completar curso de liderança, melhorar comunicação com equipe..."
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          📈 Médio Prazo (1 ano)
                        </label>
                        <textarea
                          value={data.pdi.mediumTermGoals}
                          onChange={(e) => onUpdateData(data.userId, 'pdi', 'mediumTermGoals', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          rows={4}
                          placeholder="Ex: Assumir responsabilidades de gestão, certificação profissional..."
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          🚀 Longo Prazo (2+ anos)
                        </label>
                        <textarea
                          value={data.pdi.longTermGoals}
                          onChange={(e) => onUpdateData(data.userId, 'pdi', 'longTermGoals', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          rows={4}
                          placeholder="Ex: Posição de liderança sênior, especialização em área específica..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plano de Ação */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                      📋 Plano de Ação
                    </h5>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          🎓 Ações de Desenvolvimento
                        </label>
                        <textarea
                          value={data.pdi.developmentActions}
                          onChange={(e) => onUpdateData(data.userId, 'pdi', 'developmentActions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          rows={4}
                          placeholder="Ex: Treinamentos, cursos, mentorias, projetos especiais..."
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          💰 Recursos Necessários
                        </label>
                        <textarea
                          value={data.pdi.resources}
                          onChange={(e) => onUpdateData(data.userId, 'pdi', 'resources', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          rows={4}
                          placeholder="Ex: Orçamento para cursos, tempo para estudos, ferramentas..."
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          ⏰ Cronograma
                        </label>
                        <textarea
                          value={data.pdi.timeline}
                          onChange={(e) => onUpdateData(data.userId, 'pdi', 'timeline', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          rows={4}
                          placeholder="Ex: Q1: Inscrição no curso, Q2: Início do projeto, Q3: Avaliação..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default BulkEvaluationUpload;