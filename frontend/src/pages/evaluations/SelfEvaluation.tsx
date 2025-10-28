import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Brain, 
  Wrench, 
  Award, 
  Plus, 
  X, 
  Save, 
  ArrowLeft,
  ArrowRight,
  Target,
  CheckCircle,
  Info,
  Shield,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  Zap,
  Pen,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/Button';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useAuth } from '../../context/AuthContext';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';
import { evaluationService } from '../../services/evaluation.service';

interface SelfEvaluationData {
  conhecimentos: string[];
  ferramentas: string[];
  forcasInternas: string[];
  qualidades: string[];
}

interface CompetencyScore {
  [key: string]: number;
}

interface Section {
  id: keyof SelfEvaluationData;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  items: string[];
}

const SelfEvaluation = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { currentCycle, saveSelfEvaluation, checkExistingEvaluation, loading } = useEvaluation();
  
  const [currentStep, setCurrentStep] = useState<'toolkit' | 'competencies'>('toolkit');
  const [formData, setFormData] = useState<SelfEvaluationData>({
    conhecimentos: [''],
    ferramentas: [''],
    forcasInternas: [''],
    qualidades: ['']
  });
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['competencias-tecnicas']));
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check for existing evaluation
  useEffect(() => {
    const checkExisting = async () => {
      if (currentCycle && user) {
        const exists = await checkExistingEvaluation(currentCycle.id, user.id, 'self');
        setHasExistingEvaluation(exists);
      }
    };
    checkExisting();
  }, [currentCycle, user, checkExistingEvaluation]);

  // Updated competency categories to match the new system
  const competencyCategories = [
    {
      id: 'competencias-tecnicas',
      title: 'Competências Técnicas',
      icon: Target,
      gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      items: EVALUATION_COMPETENCIES.technical.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description
      }))
    },
    {
      id: 'competencias-comportamentais',
      title: 'Competências Comportamentais',
      icon: Users,
      gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      items: EVALUATION_COMPETENCIES.behavioral.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description
      }))
    },
    {
      id: 'competencias-organizacionais',
      title: 'Competências Organizacionais',
      icon: Building,
      gradient: 'from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700',
      items: EVALUATION_COMPETENCIES.deliveries.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description
      }))
    }
  ];

  const addField = (section: keyof SelfEvaluationData) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], '']
    }));
  };

  const removeField = (section: keyof SelfEvaluationData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateField = (section: keyof SelfEvaluationData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? value : item)
    }));

    // Check if section is completed
    const sectionData = formData[section].map((item, i) => i === index ? value : item);
    const hasValidItems = sectionData.some(item => item.trim() !== '');
    
    if (hasValidItems) {
      setCompletedSections(prev => new Set(prev).add(section));
    } else {
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(section);
        return newSet;
      });
    }
  };

  const handleCompetencyScore = (competencyId: string, score: number) => {
    setCompetencyScores(prev => ({
      ...prev,
      [competencyId]: score
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNextStep = () => {
    const hasEmptySections = Object.entries(formData).some(([key, values]) => 
      values.every((value: string) => value.trim() === '')
    );

    if (hasEmptySections) {
      toast.error('Preencha pelo menos um item em cada seção');
      return;
    }

    setCurrentStep('competencies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (): Promise<void> => {
    if (!currentCycle || !user) {
      toast.error('Ciclo de avaliação não encontrado');
      return;
    }

    // Check if all competencies are evaluated
    const totalCompetencies = competencyCategories.reduce((sum, category) => sum + category.items.length, 0);
    const evaluatedCompetencies = Object.keys(competencyScores).length;

    if (evaluatedCompetencies < totalCompetencies) {
      toast.error('Avalie todas as competências antes de salvar');
      return;
    }

    const cleanedData = Object.entries(formData).reduce((acc, [key, values]) => {
      acc[key as keyof SelfEvaluationData] = values.filter((value: string) => value.trim() !== '');
      return acc;
    }, {} as SelfEvaluationData);

    // Prepare competencies for the new system
    const competencies = competencyCategories.flatMap(category => 
      category.items.map(item => {
        const competency = EVALUATION_COMPETENCIES[
          category.id === 'competencias-tecnicas' ? 'technical' : 
          category.id === 'competencias-comportamentais' ? 'behavioral' : 'deliveries'
        ].find(c => c.name === item.name);

        return {
          criterion_name: item.name,
          criterion_description: item.description,
          name: item.name,
          description: item.description,
          category: competency?.category || 'technical',
          score: competencyScores[item.id] || 0,
          written_response: ''
        };
      })
    );
    
    const saveDraft = async () => {
      if (!currentCycle?.id || !profile?.id) {
        toast.error('Informações necessárias não encontradas');
        return;
      }
    
      try {
        await evaluationService.saveSelfEvaluation({
          cycleId: currentCycle.id,
          employeeId: profile.id,
          competencies,
          knowledge: [],
          tools: [],
          strengths: [],
          qualities: [],
          observations: []
        });
        toast.success('Rascunho salvo!');
      } catch (error) {
        toast.error('Erro ao salvar rascunho');
      }
    };

    setIsSaving(true);
    try {
      await saveSelfEvaluation({
        cycleId: currentCycle.id,
        employeeId: user.id,
        competencies,
        knowledge: cleanedData.conhecimentos,
        tools: cleanedData.ferramentas,
        strengths: cleanedData.forcasInternas,
        qualities: cleanedData.qualidades,
        observations: []
      });
      
      toast.success('Autoavaliação completa salva com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao salvar autoavaliação');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if cycle is within valid dates
  const isCycleInValidPeriod = () => {
    if (!currentCycle) return false;
    
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    
    return today >= startDate && today <= endDate;
  };

  const getCyclePeriodMessage = () => {
    if (!currentCycle) return null;
    
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    
    if (today < startDate) {
      return {
        type: 'warning',
        message: `O período de avaliação iniciará em ${startDate.toLocaleDateString('pt-BR')}`
      };
    }
    
    if (today > endDate) {
      return {
        type: 'error',
        message: `O período de avaliação encerrou em ${endDate.toLocaleDateString('pt-BR')}`
      };
    }
    
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 7) {
      return {
        type: 'warning',
        message: `Atenção: ${daysRemaining} dias restantes para completar a avaliação`
      };
    }
    
    return null;
  };

  // Check if there's no active cycle or cycle is out of period
  if (!currentCycle || !isCycleInValidPeriod()) {
    const periodMessage = getCyclePeriodMessage();
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-primary-500 dark:text-primary-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {!currentCycle ? 'Nenhum ciclo de avaliação ativo' : 'Período de avaliação indisponível'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {periodMessage?.message || 'Aguarde a abertura de um novo ciclo de avaliação.'}
        </p>
        {currentCycle && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Ciclo:</strong> {currentCycle.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Período: {new Date(currentCycle.start_date).toLocaleDateString('pt-BR')} - {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
        {profile?.is_director && (
          <button
            onClick={() => window.location.href = '/cycle-management'}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }

  // Check if already evaluated
  if (hasExistingEvaluation) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          A avaliação já foi feita
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Você já completou sua autoavaliação para o ciclo: <strong>{currentCycle?.title}</strong>
        </p>
        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors w-full sm:w-auto"
          >
            Voltar ao início
          </button>
          {profile?.is_leader && (
            <button
              onClick={() => window.location.href = '/leader-evaluation'}
              className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors w-full sm:w-auto ml-0 sm:ml-2"
            >
              Avaliar Colaboradores
            </button>
          )}
        </div>
      </div>
    );
  }

  const sections: Section[] = [
    {
      id: 'conhecimentos',
      title: 'Conhecimentos',
      subtitle: 'Sei falar sobre:',
      icon: Brain,
      gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      items: formData.conhecimentos
    },
    {
      id: 'ferramentas',
      title: 'Ferramentas',
      subtitle: 'Sei usar:',
      icon: Wrench,
      gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
      borderColor: 'border-secondary-200 dark:border-secondary-700',
      iconBg: 'bg-gradient-to-br from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      items: formData.ferramentas
    },
    {
      id: 'forcasInternas',
      title: 'Forças Internas',
      subtitle: 'Me sustentam:',
      icon: Shield,
      gradient: 'from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      borderColor: 'border-accent-200 dark:border-accent-700',
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      items: formData.forcasInternas
    },
    {
      id: 'qualidades',
      title: 'Qualidades',
      subtitle: 'Tenho para oferecer:',
      icon: Award,
      gradient: 'from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700',
      bgColor: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-700',
      iconBg: 'bg-gradient-to-br from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700',
      items: formData.qualidades
    }
  ];

  const toolkitProgress = (completedSections.size / sections.length) * 100;
  const competencyProgress = (Object.keys(competencyScores).length / competencyCategories.reduce((sum, cat) => sum + cat.items.length, 0)) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      }
    }
  };

  const renderToolkitStep = () => (
    <>
      {/* Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 sm:space-y-6"
      >
        {sections.map((section: Section, sectionIndex) => {
          const IconComponent = section.icon;
          const isCompleted = completedSections.has(section.id);
          
          return (
            <motion.div
              key={section.id}
              variants={itemVariants}
              className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border ${isCompleted ? section.borderColor : 'border-gray-100 dark:border-gray-700'} overflow-hidden transition-all duration-300`}
            >
              {/* Section Header */}
              <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${isCompleted ? section.bgColor : 'bg-gray-50 dark:bg-gray-700/50'} border-b border-gray-100 dark:border-gray-700`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${section.iconBg} shadow-md`}>
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{section.title}</h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{section.subtitle}</p>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center space-x-1 sm:space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">Completo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  {section.items.map((item: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-2 sm:space-x-3 group"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={item}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(section.id, index, e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                          placeholder={`Digite ${section.title.toLowerCase()} ${index + 1}...`}
                        />
                        {item.trim() && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-2 sm:right-3 top-2 sm:top-3.5"
                          >
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
                          </motion.div>
                        )}
                      </div>
                      {section.items.length > 1 && (
                        <button
                          onClick={() => removeField(section.id, index)}
                          className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add More Button */}
                <button
                  onClick={() => addField(section.id)}
                  className={`mt-3 sm:mt-4 flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-2 border-dashed ${isCompleted ? section.borderColor : 'border-gray-300 dark:border-gray-600'} text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 group`}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="text-xs sm:text-sm font-medium">Adicionar mais</span>
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Tips Section */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-primary-100 dark:border-primary-800"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm sm:text-base">Dicas para uma boa autoavaliação</h3>
              <ul className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-primary-500 dark:text-primary-400 mr-2">•</span>
                  <span>Seja específico e honesto sobre suas competências</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 dark:text-primary-400 mr-2">•</span>
                  <span>Inclua tanto habilidades técnicas quanto comportamentais</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 dark:text-primary-400 mr-2">•</span>
                  <span>Pense em situações reais onde aplicou essas habilidades</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-between items-center pt-4 sm:pt-6 space-y-4 sm:space-y-0"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            size="lg"
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
            <span className="text-xs sm:text-sm text-center">
              {completedSections.size === sections.length ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Todas as seções completas!
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">{sections.length - completedSections.size} seções pendentes</span>
              )}
            </span>
            <Button
              variant="primary"
              onClick={handleNextStep}
              icon={<ArrowRight size={18} />}
              size="lg"
              disabled={completedSections.size !== sections.length}
              className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 w-full sm:w-auto"
            >
              Próxima Etapa
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );

  const renderCompetenciesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-4 sm:space-y-6"
    >
      {competencyCategories.map((category, categoryIndex) => {
        const IconComponent = category.icon;
        const isExpanded = expandedSections.has(category.id);
        const categoryProgress = category.items.filter(item => competencyScores[item.id] !== undefined).length / category.items.length * 100;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(category.id)}
              className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${category.bgColor} border-b ${category.borderColor} hover:opacity-90 transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${category.gradient} shadow-md`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{category.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {category.items.filter(item => competencyScores[item.id] !== undefined).length} de {category.items.length} competências avaliadas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-16 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${category.gradient} transition-all duration-300`}
                      style={{ width: `${categoryProgress}%` }}
                    />
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
                >
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIndex * 0.05 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 sm:mr-4">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{item.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                        {competencyScores[item.id] && (
                          <div className="text-center">
                            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              competencyScores[item.id] >= 4 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              competencyScores[item.id] >= 3 ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300' :
                              competencyScores[item.id] >= 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              Nota: {competencyScores[item.id]}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {[1, 2, 3, 4].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleCompetencyScore(item.id, rating)}
                            className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                              competencyScores[item.id] === rating
                                ? `${rating === 4 ? 'bg-green-500 dark:bg-green-600' : rating === 3 ? 'bg-primary-500 dark:bg-primary-600' : rating === 2 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-red-500 dark:bg-red-600'} text-white border-transparent shadow-lg transform scale-105`
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`text-xl sm:text-2xl font-bold mb-1 ${competencyScores[item.id] === rating ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{rating}</div>
                              <div className={`text-xs ${competencyScores[item.id] === rating ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {rating === 4 ? 'Excepcional' : rating === 3 ? 'Satisfatório' : rating === 2 ? 'Em Desenvolvimento' : 'Insatisfatório'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-center pt-4 sm:pt-6 space-y-4 sm:space-y-0"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentStep('toolkit')}
          icon={<ArrowLeft size={18} />}
          size="lg"
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Voltar
        </Button>
        
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 order-1 sm:order-2">
          <span className="text-xs sm:text-sm text-center">
            {competencyProgress === 100 ? (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 mr-1" />
                Todas as competências avaliadas!
              </span>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">{Math.round(competencyProgress)}% completo</span>
            )}
          </span>
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Save size={18} />}
            size="lg"
            disabled={competencyProgress < 100 || isSaving || loading}
            className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 w-full sm:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar Autoavaliação'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                {currentStep === 'toolkit' ? (
                  <>
                    <Pen className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-500 dark:text-accent-400 mr-2 sm:mr-3" />
                    <span className="break-words">Meu Toolkit Profissional</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 dark:text-secondary-400 mr-2 sm:mr-3" />
                    <span className="break-words">Autoavaliação de Competências</span>
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                {currentStep === 'toolkit' 
                  ? 'Construa seu perfil de competências e habilidades'
                  : 'Avalie suas competências técnicas, comportamentais e organizacionais'
                }
              </p>
              {currentCycle && (
                <p className="text-xs text-gray-500 mt-1">
                  Ciclo: {currentCycle.title} | Prazo: {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          
          {/* Period Alert */}
          {getCyclePeriodMessage() && (
            <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
              getCyclePeriodMessage()?.type === 'error' 
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
            }`}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{getCyclePeriodMessage()?.message}</p>
            </div>
          )}
          
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Progresso</p>
              <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                {Math.round(currentStep === 'toolkit' ? toolkitProgress : competencyProgress)}%
              </p>
            </div>
            <div className="relative">
              <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(currentStep === 'toolkit' ? toolkitProgress : competencyProgress) * 1.76} 176`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient">
                    <stop offset="0%" stopColor="#12b0a0" />
                    <stop offset="100%" stopColor="#1e6076" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full ${currentStep === 'toolkit' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'toolkit' ? 'bg-primary-500 dark:bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
              1
            </div>
            <span className="font-medium text-xs sm:text-sm hidden sm:inline">Toolkit Profissional</span>
          </div>
          
          <div className="w-8 sm:w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${currentStep === 'competencies' ? 'w-full bg-primary-500 dark:bg-primary-600' : 'w-0'}`} />
          </div>
          
          <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full ${currentStep === 'competencies' ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep === 'competencies' ? 'bg-secondary-500 dark:bg-secondary-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
              2
            </div>
            <span className="font-medium text-xs sm:text-sm hidden sm:inline">Competências</span>
          </div>
        </div>

        {/* Quick Stats for Toolkit Step */}
        {currentStep === 'toolkit' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
            {sections.map((section) => {
              const filledItems = section.items.filter(item => item.trim() !== '').length;
              const isCompleted = completedSections.has(section.id);
              
              return (
                <div 
                  key={section.id} 
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isCompleted ? section.borderColor : 'border-gray-200 dark:border-gray-600'} ${isCompleted ? section.bgColor : 'bg-gray-50 dark:bg-gray-700/50'} transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <section.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
                    {isCompleted && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400" />}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 sm:mt-2 break-words">{section.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{filledItems} itens</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Content based on current step */}
      <AnimatePresence mode="wait">
        {currentStep === 'toolkit' ? renderToolkitStep() : renderCompetenciesStep()}
      </AnimatePresence>
    </div>
  );
};

export default SelfEvaluation;