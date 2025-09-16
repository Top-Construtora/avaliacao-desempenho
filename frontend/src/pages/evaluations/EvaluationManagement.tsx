import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Users, BookOpen, User as UserIcon, Target, CheckCircle, XCircle, Clock, Search, Filter, Calendar, Save, Edit, ChevronDown, AlertCircle
} from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import { evaluationService } from '../../services/evaluation.service';
import UserEvaluationCard from './UserEvaluationCard';
import type { User } from '../../types/user';
import type { Evaluation, EvaluationCycle } from '../../types/evaluation.types';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';

interface EvaluationWithUser extends Evaluation {
  employee?: User;
  evaluator?: User;
}

interface PdiItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5'; // 1: Não iniciado, 2: Em andamento, 3: Pausado, 4: Cancelado, 5: Concluído
  observacoes: string;
}

interface UserEvaluationData {
  user: User;
  // Autoavaliação - Toolkit (campos de texto)
  selfEvaluation: {
    toolkit: {
      conhecimentos: string[];
      ferramentas: string[];
      forcasInternas: string[];
      qualidades: string[];
    };
    // Competências (notas de 1-4)
    competencies: {
      technical: { [key: string]: number | null };
      behavioral: { [key: string]: number | null };
      deliveries: { [key: string]: number | null };
    };
    finalScore: number;
  };
  // Toolkit Profissional (notas de 1-4)
  toolkit: {
    conhecimentos: number;
    ferramentas: number;
    forcasInternas: number;
    qualidades: number;
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
    finalScore: number;
  };
  // Consenso
  consensus: {
    technical: { [key: string]: number | null };
    behavioral: { [key: string]: number | null };
    deliveries: { [key: string]: number | null };
    notes: string;
  };
  pdi: {
    curtosPrazos: PdiItem[];
    mediosPrazos: PdiItem[];
    longosPrazos: PdiItem[];
  };
  // Status de salvamento individual
  isSaving: boolean;
  lastSaved?: Date;
  saveError?: string;
}

const EvaluationManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationWithUser[]>([]);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'bulk-evaluation'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [usersEvaluationData, setUsersEvaluationData] = useState<UserEvaluationData[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  // Verifica se o usuário tem permissão (master ou director)
  const hasPermission = user?.is_master || user?.is_director;

  useEffect(() => {
    loadUsers();
    loadEvaluations();
    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle && users.length > 0) {
      initializeUsersEvaluationData();
    }
  }, [selectedCycle, users]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    try {
      // Carrega TODOS os usuários do sistema - colaboradores, líderes e diretores
      console.log('🔄 Iniciando carregamento de TODOS os usuários sem filtros...');
      const userData = await userService.getAllUsers();
      console.log('✅ Dados recebidos do backend:', userData?.length || 0, 'usuários');


      // Função helper para verificar se é líder (mais robusta)
      const isLeader = (user: any) => {
        // Método 1: Verificação pelos campos booleanos
        const leader = user.is_leader === true || user.is_leader === 'true' || user.is_leader === 1;
        const director = user.is_director === true || user.is_director === 'true' || user.is_director === 1;

        // Método 2: Verificação por cargo (fallback)
        const cargoLideranca = user.position && (
          user.position.toLowerCase().includes('gerente') ||
          user.position.toLowerCase().includes('diretor') ||
          user.position.toLowerCase().includes('coordenador') ||
          user.position.toLowerCase().includes('líder') ||
          user.position.toLowerCase().includes('lider') ||
          user.position.toLowerCase().includes('supervisor') ||
          user.position.toLowerCase().includes('head') ||
          user.position.toLowerCase().includes('manager')
        );

        return leader || director || cargoLideranca;
      };

      // DEBUG SIMPLIFICADO - mostrar dados brutos
      console.log('🔍 DADOS BRUTOS - Primeiros 5 usuários:');
      userData.slice(0, 5).forEach((user, i) => {
        console.log(`User ${i+1}: ${user.name}`, {
          is_leader: user.is_leader,
          is_director: user.is_director,
          tipo_leader: typeof user.is_leader,
          tipo_director: typeof user.is_director
        });
      });

      // Valores únicos
      const valoresLeader = [...new Set(userData.map(u => u.is_leader))];
      const valoresDirector = [...new Set(userData.map(u => u.is_director))];
      console.log('🎯 Valores únicos is_leader:', valoresLeader);
      console.log('🎯 Valores únicos is_director:', valoresDirector);

      const leaders = userData.filter(isLeader);
      const directors = userData.filter(u => u.is_director === true || u.is_director === 'true' || u.is_director === 1);
      const collaborators = userData.filter(u => !isLeader(u));

      console.log(`🎯 RESUMO COMPLETO DOS USUÁRIOS CARREGADOS:`);
      console.log(`Total de usuários: ${userData.length}`);
      console.log(`- Diretores: ${directors.length}`);
      console.log(`- Líderes (não-diretores): ${leaders.length - directors.length}`);
      console.log(`- Colaboradores: ${collaborators.length}`);

      if (leaders.length === 0) {
        console.log('⚠️ IMPORTANTE: Função isLeader() não está detectando líderes.');
        console.log('💡 Vamos tentar detectar de outras formas...');

        // Tentar diferentes métodos de detecção
        const leadersMethod1 = userData.filter(u => u.is_leader);
        const leadersMethod2 = userData.filter(u => u.is_director);
        const leadersMethod3 = userData.filter(u => Boolean(u.is_leader) || Boolean(u.is_director));

        console.log('Líderes (método 1 - truthy is_leader):', leadersMethod1.length);
        console.log('Líderes (método 2 - truthy is_director):', leadersMethod2.length);
        console.log('Líderes (método 3 - Boolean cast):', leadersMethod3.length);

        if (leadersMethod1.length > 0) {
          console.log('Exemplo de usuário com is_leader truthy:', leadersMethod1[0]);
        }
        if (leadersMethod2.length > 0) {
          console.log('Exemplo de usuário com is_director truthy:', leadersMethod2[0]);
        }
      }

      setUsers(userData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const loadCycles = async () => {
    try {
      const cycleData = await evaluationService.getEvaluationCycles();
      setCycles(cycleData);
      // Seleciona o ciclo ativo por padrão
      const activeCycle = cycleData.find(c => c.status === 'open');
      if (activeCycle) {
        setSelectedCycle(activeCycle.id);
      }
    } catch (error) {
      console.error('Erro ao carregar ciclos:', error);
      toast.error('Erro ao carregar ciclos');
    }
  };

  const initializeUsersEvaluationData = () => {
    const initialData: UserEvaluationData[] = users.map(user => ({
      user,
      selfEvaluation: {
        toolkit: {
          conhecimentos: [''],
          ferramentas: [''],
          forcasInternas: [''],
          qualidades: ['']
        },
        competencies: {
          technical: competencyCategories.technical.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
          behavioral: competencyCategories.behavioral.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
          deliveries: competencyCategories.deliveries.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        },
        finalScore: 0
      },
      toolkit: {
        conhecimentos: 0,
        ferramentas: 0,
        forcasInternas: 0,
        qualidades: 0
      },
      leaderEvaluation: {
        technical: competencyCategories.technical.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        behavioral: competencyCategories.behavioral.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        deliveries: competencyCategories.deliveries.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        potential: {
          funcaoSubsequente: null,
          aprendizadoContinuo: null,
          alinhamentoCultural: null,
          visaoSistemica: null
        },
        finalScore: 0
      },
      consensus: {
        technical: competencyCategories.technical.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        behavioral: competencyCategories.behavioral.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        deliveries: competencyCategories.deliveries.reduce((acc, comp) => ({ ...acc, [comp.name]: null }), {}),
        notes: ''
      },
      pdi: {
        curtosPrazos: [],
        mediosPrazos: [],
        longosPrazos: []
      },
      isSaving: false,
      lastSaved: undefined,
      saveError: undefined
    }));
    setUsersEvaluationData(initialData);
  };

  const updateSelfEvaluationScore = (
    userId: string, 
    category: 'technical' | 'behavioral' | 'deliveries', 
    competencyName: string, 
    score: number | null
  ) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        const updated = {
          ...userData,
          selfEvaluation: {
            ...userData.selfEvaluation,
            competencies: {
              ...userData.selfEvaluation.competencies,
              [category]: {
                ...userData.selfEvaluation.competencies[category],
                [competencyName]: score
              }
            },
            finalScore: calculateEvaluationAverages({
              technical: { ...userData.selfEvaluation.competencies.technical, ...(category === 'technical' ? { [competencyName]: score } : {}) },
              behavioral: { ...userData.selfEvaluation.competencies.behavioral, ...(category === 'behavioral' ? { [competencyName]: score } : {}) },
              deliveries: { ...userData.selfEvaluation.competencies.deliveries, ...(category === 'deliveries' ? { [competencyName]: score } : {}) }
            })
          },
          saveError: undefined
        };
        return updated;
      }
      return userData;
    }));
  };

  const updateLeaderEvaluationScore = (
    userId: string, 
    category: 'technical' | 'behavioral' | 'deliveries', 
    competencyName: string, 
    score: number | null
  ) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        const updated = {
          ...userData,
          leaderEvaluation: {
            ...userData.leaderEvaluation,
            [category]: {
              ...userData.leaderEvaluation[category],
              [competencyName]: score
            },
            finalScore: calculateEvaluationAverages({
              ...userData.leaderEvaluation,
              [category]: {
                ...userData.leaderEvaluation[category],
                [competencyName]: score
              }
            })
          },
          saveError: undefined
        };
        return updated;
      }
      return userData;
    }));
  };

  // Função para atualizar potencial
  const updatePotentialScore = (
    userId: string,
    potentialField: 'funcaoSubsequente' | 'aprendizadoContinuo' | 'alinhamentoCultural' | 'visaoSistemica',
    score: number | null
  ) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        return {
          ...userData,
          leaderEvaluation: {
            ...userData.leaderEvaluation,
            potential: {
              ...userData.leaderEvaluation.potential,
              [potentialField]: score
            }
          },
          saveError: undefined
        };
      }
      return userData;
    }));
  };

  // Função para atualizar consenso
  const updateConsensusScore = (
    userId: string,
    category: 'technical' | 'behavioral' | 'deliveries',
    competencyName: string,
    score: number | null
  ) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        return {
          ...userData,
          consensus: {
            ...userData.consensus,
            [category]: {
              ...userData.consensus[category],
              [competencyName]: score
            }
          },
          saveError: undefined
        };
      }
      return userData;
    }));
  };

  // Função para atualizar notas do consenso
  const updateConsensusNotes = (userId: string, notes: string) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        return {
          ...userData,
          consensus: {
            ...userData.consensus,
            notes
          },
          saveError: undefined
        };
      }
      return userData;
    }));
  };

  // Função para atualizar toolkit
  const updateToolkitData = (userId: string, section: string, index: number, value: string) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        const newArray = [...userData.selfEvaluation.toolkit[section as keyof typeof userData.selfEvaluation.toolkit] as string[]];
        newArray[index] = value;
        return {
          ...userData,
          selfEvaluation: {
            ...userData.selfEvaluation,
            toolkit: {
              ...userData.selfEvaluation.toolkit,
              [section]: newArray
            }
          },
          saveError: undefined
        };
      }
      return userData;
    }));
  };

  // Função para adicionar item ao toolkit
  const addToolkitItem = (userId: string, section: string) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        const currentArray = userData.selfEvaluation.toolkit[section as keyof typeof userData.selfEvaluation.toolkit] as string[];
        return {
          ...userData,
          selfEvaluation: {
            ...userData.selfEvaluation,
            toolkit: {
              ...userData.selfEvaluation.toolkit,
              [section]: [...currentArray, '']
            }
          }
        };
      }
      return userData;
    }));
  };

  // Função para remover item do toolkit
  const removeToolkitItem = (userId: string, section: string, index: number) => {
    setUsersEvaluationData(prev => prev.map(userData => {
      if (userData.user.id === userId) {
        const currentArray = userData.selfEvaluation.toolkit[section as keyof typeof userData.selfEvaluation.toolkit] as string[];
        if (currentArray.length > 1) {
          const newArray = currentArray.filter((_, i) => i !== index);
          return {
            ...userData,
            selfEvaluation: {
              ...userData.selfEvaluation,
              toolkit: {
                ...userData.selfEvaluation.toolkit,
                [section]: newArray
              }
            }
          };
        }
      }
      return userData;
    }));
  };

  // Função para salvamento individual
  const handleSaveIndividual = async (userId: string) => {
    const userData = usersEvaluationData.find(u => u.user.id === userId);
    if (!userData || !selectedCycle) {
      toast.error('Dados não encontrados ou ciclo não selecionado');
      return;
    }

    // Set saving state
    setUsersEvaluationData(prev => prev.map(u => 
      u.user.id === userId 
        ? { ...u, isSaving: true, saveError: undefined }
        : u
    ));

    try {
      await evaluationService.saveBulkEvaluations({
        cycleId: selectedCycle,
        evaluations: [{
          userId: userData.user.id,
          selfEvaluation: userData.selfEvaluation,
          leaderEvaluation: userData.leaderEvaluation,
          consensus: userData.consensus,
          toolkit: userData.toolkit,
          pdi: userData.pdi
        }]
      });

      // Update success state
      setUsersEvaluationData(prev => prev.map(u => 
        u.user.id === userId 
          ? { ...u, isSaving: false, lastSaved: new Date(), saveError: undefined }
          : u
      ));
      
      toast.success(`Avaliação de ${userData.user.name} salva com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao salvar avaliação individual:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Update error state
      setUsersEvaluationData(prev => prev.map(u => 
        u.user.id === userId 
          ? { ...u, isSaving: false, saveError: errorMessage }
          : u
      ));
      
      toast.error(`Erro ao salvar avaliação: ${errorMessage}`);
    }
  };

  // Função para adicionar item ao PDI
  const addPdiItem = (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    const newItem: PdiItem = {
      id: Date.now().toString(),
      competencia: '',
      calendarizacao: '',
      comoDesenvolver: '',
      resultadosEsperados: '',
      status: '1',
      observacoes: ''
    };

    setUsersEvaluationData(prev => prev.map(userData => 
      userData.user.id === userId 
        ? {
            ...userData,
            pdi: {
              ...userData.pdi,
              [prazo]: [...userData.pdi[prazo], newItem]
            },
            saveError: undefined
          }
        : userData
    ));
  };

  // Função para remover item do PDI
  const removePdiItem = (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', itemId: string) => {
    setUsersEvaluationData(prev => prev.map(userData => 
      userData.user.id === userId 
        ? {
            ...userData,
            pdi: {
              ...userData.pdi,
              [prazo]: userData.pdi[prazo].filter(item => item.id !== itemId)
            },
            saveError: undefined
          }
        : userData
    ));
  };

  // Função para atualizar item do PDI
  const updatePdiItem = (
    userId: string, 
    prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', 
    itemId: string, 
    field: keyof PdiItem, 
    value: string
  ) => {
    setUsersEvaluationData(prev => prev.map(userData => 
      userData.user.id === userId 
        ? {
            ...userData,
            pdi: {
              ...userData.pdi,
              [prazo]: userData.pdi[prazo].map(item => 
                item.id === itemId 
                  ? { ...item, [field]: value }
                  : item
              )
            },
            saveError: undefined
          }
        : userData
    ));
  };

  // Função para toggle do card
  const toggleCardExpansion = (userId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const calculateEvaluationAverages = (evaluation: { 
    technical: { [key: string]: number | null };
    behavioral: { [key: string]: number | null };
    deliveries: { [key: string]: number | null };
  }) => {
    // Definir os pesos para cada categoria
    const weights = {
      technical: 0.5,    // 50%
      behavioral: 0.3,   // 30%
      deliveries: 0.2    // 20% (organizacionais)
    };
    
    const categories = ['technical', 'behavioral', 'deliveries'] as const;
    const categoryAverages: { [key: string]: number } = {};
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Calcular a média de cada categoria
    categories.forEach(category => {
      const scores = Object.values(evaluation[category]).filter(score => score !== null) as number[];
      if (scores.length > 0) {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        categoryAverages[category] = average;
        
        // Adicionar ao cálculo ponderado
        weightedSum += average * weights[category];
        totalWeight += weights[category];
      }
    });
    
    // Retornar a média ponderada com até 3 casas decimais
    return totalWeight > 0 
      ? Number((weightedSum / totalWeight).toFixed(3))
      : 0;
  };

  const loadEvaluations = async () => {
    try {
      // TODO: Implementar serviço para buscar todas as avaliações
      // const evaluationData = await evaluationService.getAllEvaluations();
      // setEvaluations(evaluationData);
      setEvaluations([]);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      toast.error('Erro ao carregar avaliações');
    }
  };

  // Função helper para verificar se é líder (reutilizada)
  const isLeaderUser = (user: any) => {
    // Método 1: Verificação pelos campos booleanos
    const leader = user.is_leader === true || user.is_leader === 'true' || user.is_leader === 1;
    const director = user.is_director === true || user.is_director === 'true' || user.is_director === 1;

    // Método 2: Verificação por cargo (fallback)
    const cargoLideranca = user.position && (
      user.position.toLowerCase().includes('gerente') ||
      user.position.toLowerCase().includes('diretor') ||
      user.position.toLowerCase().includes('coordenador') ||
      user.position.toLowerCase().includes('líder') ||
      user.position.toLowerCase().includes('lider') ||
      user.position.toLowerCase().includes('supervisor') ||
      user.position.toLowerCase().includes('head') ||
      user.position.toLowerCase().includes('manager')
    );

    return leader || director || cargoLideranca;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' ||
                       (roleFilter === 'leaders' && isLeaderUser(user)) ||
                       (roleFilter === 'collaborators' && !isLeaderUser(user));

    return matchesSearch && matchesRole;
  });

  const getEvaluationStatus = (userId: string, type: 'self' | 'leader') => {
    const evaluation = evaluations.find(e => e.employee_id === userId && e.type === type);
    return evaluation?.status || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-primary-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-accent-600" />;
      default:
        return <XCircle className="w-4 h-4 text-secondary-500" />;
    }
  };

  const saveAllEvaluations = async () => {
    if (!selectedCycle) {
      toast.error('Selecione um ciclo antes de salvar');
      return;
    }

    // Filtrar apenas avaliações que têm dados preenchidos
    const evaluationsToSave = usersEvaluationData.filter(userData => {
      const hasSelfEvaluation = Object.keys(userData.selfEvaluation.competencies.technical).length > 0 ||
                               Object.keys(userData.selfEvaluation.competencies.behavioral).length > 0 ||
                               Object.keys(userData.selfEvaluation.competencies.deliveries).length > 0;
      
      const hasLeaderEvaluation = (userData.leaderEvaluation?.technical && Object.keys(userData.leaderEvaluation.technical).length > 0) ||
                                 (userData.leaderEvaluation?.behavioral && Object.keys(userData.leaderEvaluation.behavioral).length > 0) ||
                                 (userData.leaderEvaluation?.deliveries && Object.keys(userData.leaderEvaluation.deliveries).length > 0);
      
      const hasToolkit = userData.selfEvaluation?.toolkit && (
        (userData.selfEvaluation.toolkit.conhecimentos && userData.selfEvaluation.toolkit.conhecimentos.some(item => item.trim() !== '')) ||
        (userData.selfEvaluation.toolkit.ferramentas && userData.selfEvaluation.toolkit.ferramentas.some(item => item.trim() !== '')) ||
        (userData.selfEvaluation.toolkit.forcasInternas && userData.selfEvaluation.toolkit.forcasInternas.some(item => item.trim() !== '')) ||
        (userData.selfEvaluation.toolkit.qualidades && userData.selfEvaluation.toolkit.qualidades.some(item => item.trim() !== ''))
      );
      
      return hasSelfEvaluation || hasLeaderEvaluation || hasToolkit;
    });

    if (evaluationsToSave.length === 0) {
      toast.error('Nenhuma avaliação foi preenchida');
      return;
    }

    setSaving(true);
    try {
      const evaluationData = evaluationsToSave.map(userData => ({
        userId: userData.user.id,
        selfEvaluation: userData.selfEvaluation,
        leaderEvaluation: userData.leaderEvaluation,
        toolkit: userData.toolkit,
        pdi: userData.pdi
      }));

      await evaluationService.saveBulkEvaluations({
        cycleId: selectedCycle,
        evaluations: evaluationData
      });

      toast.success(`${evaluationsToSave.length} avaliações salvas com sucesso!`);
      
      // Recarregar dados após salvar
      loadEvaluations();
    } catch (error) {
      console.error('Erro ao salvar avaliações:', error);
      toast.error('Erro ao salvar avaliações');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700 rounded-xl shadow-primary-500/20 dark:shadow-secondary-600/30 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Users className="w-8 h-8 mr-3" />
              Gerenciamento de Avaliações
            </h1>
            <p className="text-primary-100 dark:text-secondary-100 mt-2 text-lg">
              Gerencie autoavaliações, avaliações do líder e PDIs para todos os usuários: colaboradores, líderes e diretores
            </p>
          </div>
        </div>
      </div>

      {/* Cycle Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Seleção de Ciclo
          </h2>
          <Calendar className="w-5 h-5 text-primary-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ciclo de Avaliação
            </label>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Selecione um ciclo...</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.title} ({cycle.status})
                </option>
              ))}
            </select>
          </div>
          {selectedCycle && (
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={saveAllEvaluations}
                disabled={saving || usersEvaluationData.every(u => {
                  const hasSelfEvaluation = (u.selfEvaluation?.competencies?.technical && Object.keys(u.selfEvaluation.competencies.technical).length > 0) ||
                                           (u.selfEvaluation?.competencies?.behavioral && Object.keys(u.selfEvaluation.competencies.behavioral).length > 0) ||
                                           (u.selfEvaluation?.competencies?.deliveries && Object.keys(u.selfEvaluation.competencies.deliveries).length > 0);
                  const hasLeaderEvaluation = (u.leaderEvaluation?.technical && Object.keys(u.leaderEvaluation.technical).length > 0) ||
                                             (u.leaderEvaluation?.behavioral && Object.keys(u.leaderEvaluation.behavioral).length > 0) ||
                                             (u.leaderEvaluation?.deliveries && Object.keys(u.leaderEvaluation.deliveries).length > 0);
                  const hasToolkit = u.selfEvaluation?.toolkit && (
                    (u.selfEvaluation.toolkit.conhecimentos && u.selfEvaluation.toolkit.conhecimentos.some(item => item.trim() !== '')) ||
                    (u.selfEvaluation.toolkit.ferramentas && u.selfEvaluation.toolkit.ferramentas.some(item => item.trim() !== '')) ||
                    (u.selfEvaluation.toolkit.forcasInternas && u.selfEvaluation.toolkit.forcasInternas.some(item => item.trim() !== '')) ||
                    (u.selfEvaluation.toolkit.qualidades && u.selfEvaluation.toolkit.qualidades.some(item => item.trim() !== ''))
                  );
                  return !(hasSelfEvaluation || hasLeaderEvaluation || hasToolkit);
                })}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Todas Avaliações'}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Visão Geral', icon: BookOpen },
              { id: 'bulk-evaluation', name: 'Avaliação em Lote', icon: Edit, disabled: !selectedCycle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as 'overview' | 'bulk-evaluation')}
                disabled={tab.disabled}
                className={`${
                  activeTab === tab.id && !tab.disabled
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : tab.disabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuários (colaboradores, líderes, diretores)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
              >
                <option value="all">Todos os Usuários</option>
                <option value="collaborators">Apenas Colaboradores</option>
                <option value="leaders">Apenas Líderes/Diretores</option>
              </select>
            </div>
            {activeTab !== 'overview' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="in-progress">Em Andamento</option>
                  <option value="completed">Completa</option>
                </select>
              </div>
            )}
          </div>

          {/* Bulk Evaluation Tab */}
          {activeTab === 'bulk-evaluation' && selectedCycle && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Avaliação em Lote - {cycles.find(c => c.id === selectedCycle)?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Preencha as notas e PDIs para todos os usuários: colaboradores, líderes e diretores
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usersEvaluationData.filter(u => {
                      const hasSelfEvaluation = Object.keys(u.selfEvaluation.competencies.technical).length > 0 ||
                                               (u.selfEvaluation?.competencies?.behavioral && Object.keys(u.selfEvaluation.competencies.behavioral).length > 0) ||
                                               (u.selfEvaluation?.competencies?.deliveries && Object.keys(u.selfEvaluation.competencies.deliveries).length > 0);
                      const hasLeaderEvaluation = (u.leaderEvaluation?.technical && Object.keys(u.leaderEvaluation.technical).length > 0) ||
                                                 (u.leaderEvaluation?.behavioral && Object.keys(u.leaderEvaluation.behavioral).length > 0) ||
                                                 (u.leaderEvaluation?.deliveries && Object.keys(u.leaderEvaluation.deliveries).length > 0);
                      const hasToolkit = u.selfEvaluation?.toolkit && (
                        (u.selfEvaluation.toolkit.conhecimentos && u.selfEvaluation.toolkit.conhecimentos.some(item => item.trim() !== '')) ||
                        (u.selfEvaluation.toolkit.ferramentas && u.selfEvaluation.toolkit.ferramentas.some(item => item.trim() !== '')) ||
                        (u.selfEvaluation.toolkit.forcasInternas && u.selfEvaluation.toolkit.forcasInternas.some(item => item.trim() !== '')) ||
                        (u.selfEvaluation.toolkit.qualidades && u.selfEvaluation.toolkit.qualidades.some(item => item.trim() !== ''))
                      );
                      return hasSelfEvaluation || hasLeaderEvaluation || hasToolkit;
                    }).length} de {usersEvaluationData.length} avaliados
                  </span>
                </div>
              </div>

              {/* Evaluation Form */}
              <div className="space-y-4">
                {usersEvaluationData.filter(userData => {
                  const user = userData.user;
                  const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       user.email.toLowerCase().includes(searchTerm.toLowerCase());

                  const matchesRole = roleFilter === 'all' ||
                                     (roleFilter === 'leaders' && isLeaderUser(user)) ||
                                     (roleFilter === 'collaborators' && !isLeaderUser(user));

                  return matchesSearch && matchesRole;
                }).map((userData) => {
                  const isExpanded = expandedCards.has(userData.user.id);
                  const hasAnyData = (
                    Object.values(userData.selfEvaluation.competencies.technical).some(v => v !== null) ||
                    Object.values(userData.selfEvaluation.competencies.behavioral).some(v => v !== null) ||
                    Object.values(userData.selfEvaluation.competencies.deliveries).some(v => v !== null) ||
                    Object.values(userData.leaderEvaluation.technical).some(v => v !== null) ||
                    Object.values(userData.leaderEvaluation.behavioral).some(v => v !== null) ||
                    Object.values(userData.leaderEvaluation.deliveries).some(v => v !== null) ||
                    userData.pdi.curtosPrazos.length > 0 || userData.pdi.mediosPrazos.length > 0 || userData.pdi.longosPrazos.length > 0
                  );
                  
                  const hasSelfEval = Object.values(userData.selfEvaluation.competencies.technical).some(v => v !== null) ||
                    Object.values(userData.selfEvaluation.competencies.behavioral).some(v => v !== null) ||
                    Object.values(userData.selfEvaluation.competencies.deliveries).some(v => v !== null);
                  
                  const hasLeaderEval = Object.values(userData.leaderEvaluation.technical).some(v => v !== null) ||
                    Object.values(userData.leaderEvaluation.behavioral).some(v => v !== null) ||
                    Object.values(userData.leaderEvaluation.deliveries).some(v => v !== null);
                  
                  const hasPDI = userData.pdi.curtosPrazos.length > 0 || userData.pdi.mediosPrazos.length > 0 || userData.pdi.longosPrazos.length > 0;
                  
                  return (
                    <motion.div
                      key={userData.user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {/* Card Header */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                        onClick={() => toggleCardExpansion(userData.user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                              {userData.user.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                                <span>{userData.user.name}</span>
                                {(userData.user.is_director === true || userData.user.is_director === 'true' || userData.user.is_director === 1) && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                    Diretor
                                  </span>
                                )}
                                {(userData.user.is_leader === true || userData.user.is_leader === 'true' || userData.user.is_leader === 1) && !(userData.user.is_director === true || userData.user.is_director === 'true' || userData.user.is_director === 1) && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                    Líder
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {userData.user.position}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* Status Indicators */}
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                hasSelfEval ? 'bg-primary-500' : 'bg-gray-300'
                              }`} title="Autoavaliação" />
                              <div className={`w-2 h-2 rounded-full ${
                                hasLeaderEval ? 'bg-secondary-500' : 'bg-gray-300'
                              }`} title="Avaliação Líder" />
                              <div className={`w-2 h-2 rounded-full ${
                                hasPDI ? 'bg-accent-600' : 'bg-gray-300'
                              }`} title="PDI" />
                            </div>
                            
                            {userData.isSaving && (
                              <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
                            )}
                            
                            {userData.lastSaved && !userData.isSaving && (
                              <CheckCircle className="w-4 h-4 text-primary-500" title="Salvo" />
                            )}
                            
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </motion.div>
                          </div>
                        </div>
                        
                        {userData.saveError && (
                          <div className="mt-2 p-2 bg-secondary-50 dark:bg-secondary-900/20 rounded text-sm text-secondary-600 dark:text-secondary-400">
                            {userData.saveError}
                          </div>
                        )}
                      </div>
                      
                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
                          >
                            <div className="p-4">
                              <UserEvaluationCard
                                userData={userData}
                                toolkitSections={toolkitSections}
                                competencyCategories={competencyCategories}
                                onUpdateToolkitData={updateToolkitData}
                                onAddToolkitItem={addToolkitItem}
                                onRemoveToolkitItem={removeToolkitItem}
                                onUpdateSelfEvaluationScore={updateSelfEvaluationScore}
                                onUpdateLeaderEvaluationScore={updateLeaderEvaluationScore}
                                onUpdatePotentialScore={updatePotentialScore}
                                onUpdateConsensusScore={updateConsensusScore}
                                onUpdateConsensusNotes={updateConsensusNotes}
                                onAddPdiItem={addPdiItem}
                                onRemovePdiItem={removePdiItem}
                                onUpdatePdiItem={updatePdiItem}
                                onSaveIndividual={handleSaveIndividual}
                                selectedCycle={selectedCycle}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserIcon className="w-8 h-8 text-primary-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                        Autoavaliações
                      </p>
                      <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                        {evaluations.filter(e => e.type === 'self').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-secondary-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-400">
                        Avaliações do Líder
                      </p>
                      <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        {evaluations.filter(e => e.type === 'leader').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 text-accent-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-accent-700 dark:text-accent-400">
                        PDIs
                      </p>
                      <p className="text-2xl font-bold text-accent-900 dark:text-accent-100">
                        {/* TODO: Contar PDIs */}
                        0
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User List Overview */}
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-full flex items-center justify-center text-white font-semibold shadow-primary-500/20">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                            <span>{user.name}</span>
                            {(user.is_director === true || user.is_director === 'true' || user.is_director === 1) && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                Diretor
                              </span>
                            )}
                            {(user.is_leader === true || user.is_leader === 'true' || user.is_leader === 1) && !(user.is_director === true || user.is_director === 'true' || user.is_director === 1) && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                Líder
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.position} • {user.department?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(getEvaluationStatus(user.id, 'self'))}
                          <span className="text-xs text-gray-600 dark:text-gray-400">Auto</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(getEvaluationStatus(user.id, 'leader'))}
                          <span className="text-xs text-gray-600 dark:text-gray-400">Líder</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar navegação para detalhes
                          }}
                        >
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar seus filtros de busca.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EvaluationManagement;