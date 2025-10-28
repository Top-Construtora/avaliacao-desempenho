import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useAuth } from '../../context/AuthContext';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';
import { pdiService } from '../../services/pdiService';
import LeaderEvaluationHeader from '../../components/LeaderEvaluationHeader';
import EvaluationSection from '../../components/EvaluationSection';
import PotentialAndPDI from '../../components/PotentialAndPDI';
import { AlertCircle, CheckCircle, Save, ArrowRight, BookOpen, Target, Award, Info } from 'lucide-react';
import Button from '../../components/Button';
import { motion } from 'framer-motion';

// Define SectionProps interface for type consistency
interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number; // score can be number or undefined
}

interface SectionProps {
  id: string;
  title: string;
  weight: number;
  expanded: boolean;
  icon: React.ElementType; // Icon component from LucideReact
  gradient: string;
  darkGradient: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
  darkBorderColor: string;
  items: CompetencyItem[];
}

interface Scores {
  technical: number;
  behavioral: number;
  organizational: number;
  final: number;
}

// Define PotentialItem interface here or import it from PotentialAndPDI
interface PotentialItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PdiData {
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}


const LeaderEvaluation = () => {
  const navigate = useNavigate();
  const { currentCycle, saveLeaderEvaluation, checkExistingEvaluation, loadSubordinates, subordinates } = useEvaluation();
  const { user, profile } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Competências, 2: Potencial, 3: PDI
  const [loading, setLoading] = useState(true);
  const [hasExistingEvaluation, setHasExistingEvaluation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leaderEvaluationId, setLeaderEvaluationId] = useState<string | null>(null);
  const [pdiLoadedForEmployee, setPdiLoadedForEmployee] = useState<string | null>(null);

  const [sections, setSections] = useState<SectionProps[]>([ // Explicitly type sections state
    {
      id: 'technical',
      title: 'Competências Técnicas',
      weight: 50,
      expanded: true,
      icon: BookOpen, // Added icon
      gradient: 'from-primary-500 to-primary-600', // Added gradient
      darkGradient: 'dark:from-primary-600 dark:to-primary-700', // Added dark gradient
      bgColor: 'bg-primary-50', // Added background color
      darkBgColor: 'dark:bg-primary-900/20', // Added dark background color
      borderColor: 'border-primary-200', // Added border color
      darkBorderColor: 'dark:border-primary-700', // Added dark border color
      items: EVALUATION_COMPETENCIES.technical.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description,
        score: undefined // Explicitly allow undefined
      }))
    },
    {
      id: 'behavioral',
      title: 'Competências Comportamentais',
      weight: 30,
      expanded: false,
      icon: Target, // Added icon
      gradient: 'from-secondary-500 to-secondary-600', // Added gradient
      darkGradient: 'dark:from-secondary-600 dark:to-secondary-700', // Added dark gradient
      bgColor: 'bg-secondary-50', // Added background color
      darkBgColor: 'dark:bg-secondary-900/20', // Added dark background color
      borderColor: 'border-secondary-200', // Added border color
      darkBorderColor: 'dark:border-secondary-700', // Added dark border color
      items: EVALUATION_COMPETENCIES.behavioral.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description,
        score: undefined
      }))
    },
    {
      id: 'organizational',
      title: 'Competências Organizacionais',
      weight: 20,
      expanded: false,
      icon: Award, // Added icon
      gradient: 'from-accent-500 to-accent-600', // Added gradient
      darkGradient: 'dark:from-accent-600 dark:to-accent-700', // Added dark gradient
      bgColor: 'bg-accent-50', // Added background color
      darkBgColor: 'dark:bg-accent-900/20', // Added dark background color
      borderColor: 'border-accent-200', // Added border color
      darkBorderColor: 'dark:border-accent-700', // Added dark border color
      items: EVALUATION_COMPETENCIES.deliveries.map(comp => ({
        id: comp.name.toLowerCase().replace(/\s+/g, '-'),
        name: comp.name,
        description: comp.description,
        score: undefined
      }))
    }
  ]);

  const [potentialItems, setPotentialItems] = useState<PotentialItem[]>([ // Explicitly type potentialItems state
    {
      id: 'pot1',
      name: 'Potencial para função subsequente',
      description: 'O que você enxerga como potencial máximo deste parceiro do negócio: você acredita que ele consegue assumir uma função subsequente no prazo de 1 ano, dado o desempenho e a motivação sustentados até hoje?',
      score: undefined
    },
    {
      id: 'pot2',
      name: 'Aprendizado contínuo',
      description: 'Sobre o aprendizado contínuo: percebo que este busca o desenvolvimento pessoal, profissional e o aprimoramento de seus conhecimentos técnicos e acadêmicos.',
      score: undefined
    },
    {
      id: 'pot3',
      name: 'Alinhamento com Código Cultural',
      description: 'O parceiro de negócio possui alinhamento com o Código Cultural da TOP Construtora e Incorporadora.',
      score: undefined
    },
    {
      id: 'pot4',
      name: 'Visão sistêmica',
      description: 'O parceiro de negócio possui uma visão sistêmica da empresa.',
      score: undefined
    }
  ]);

  const [pdiData, setPdiData] = useState<PdiData>({ // Explicitly type pdiData state
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });

  // Load subordinates on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSubordinates();
      setLoading(false);
    };
    loadData();
  }, [loadSubordinates]);

  // Load existing PDI when employee is selected
  const loadExistingPDI = async (employeeId: string) => {
    try {
      const existingPDI = await pdiService.getPDI(employeeId);

      if (existingPDI) {
        const transformedPDI = pdiService.transformPDIDataFromAPI(existingPDI);
        setPdiData(prev => ({
          ...prev, // Keep current state first
          ...transformedPDI, // Then merge loaded PDI
          colaboradorId: employeeId,
          // Only use loaded data if prev is empty, otherwise keep prev (user might be editing)
          curtosPrazos: prev.curtosPrazos.length > 0 ? prev.curtosPrazos : transformedPDI.curtosPrazos,
          mediosPrazos: prev.mediosPrazos.length > 0 ? prev.mediosPrazos : transformedPDI.mediosPrazos,
          longosPrazos: prev.longosPrazos.length > 0 ? prev.longosPrazos : transformedPDI.longosPrazos,
        }));
        toast('PDI existente carregado para edição');
      }
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
      // Não mostrar erro se não houver PDI, é esperado
    }
  };

  // Check for existing evaluation and populate PDI data when employee is selected
  useEffect(() => {
    const checkAndPopulate = async () => {
      if (currentCycle && selectedEmployeeId) {
        const exists = await checkExistingEvaluation(currentCycle.id, selectedEmployeeId, 'leader');
        setHasExistingEvaluation(exists);
        if (exists) {
          toast('Avaliação já foi concluída para este colaborador. Você pode editá-la e reenviá-la.', {
            icon: '✅',
            duration: 4000,
          });
        }

        // Load existing PDI only once per employee
        if (pdiLoadedForEmployee !== selectedEmployeeId) {
          await loadExistingPDI(selectedEmployeeId);
          setPdiLoadedForEmployee(selectedEmployeeId);
        }

        // Only update employee info, not the PDI items
        const employeeProfile = subordinates.find(sub => sub.id === selectedEmployeeId);
        if (employeeProfile) {
          setPdiData((prev: PdiData) => ({
            ...prev, // Keep ALL previous state including PDI items
            colaboradorId: employeeProfile.id,
            colaborador: employeeProfile.name,
            cargo: employeeProfile.position,
            departamento: Array.isArray(employeeProfile.departments)
              ? employeeProfile.departments.map(dep => dep.name).join(', ')
              : employeeProfile.departments || 'Não definido',
            periodo: prev.periodo || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            dataCriacao: prev.dataCriacao || new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
          }));
        }
      } else if (!selectedEmployeeId) {
        // Reset PDI data when no employee is selected
        setPdiData({
          colaboradorId: '',
          colaborador: '',
          cargo: '',
          departamento: '',
          periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          curtosPrazos: [],
          mediosPrazos: [],
          longosPrazos: []
        });
        setPdiLoadedForEmployee(null);
      }
    };
    checkAndPopulate();
  }, [currentCycle, selectedEmployeeId, checkExistingEvaluation, subordinates, pdiLoadedForEmployee]);

  const calculateScores = (): Scores => {
    const newScores: Scores = { technical: 0, behavioral: 0, organizational: 0, final: 0 };

    sections.forEach(section => {
      const sectionScores = section.items.filter(item => item.score !== undefined).map(item => item.score || 0);
      if (sectionScores.length > 0) {
        const average = sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length;

        if (section.id === 'technical') newScores.technical = average;
        else if (section.id === 'behavioral') newScores.behavioral = average;
        else if (section.id === 'organizational') newScores.organizational = average;
      }
    });

    newScores.final = (
      (newScores.technical * 0.5) +
      (newScores.behavioral * 0.3) +
      (newScores.organizational * 0.2)
    );
    return newScores;
  };

  const calculatePotentialScores = () => {
    const scores = potentialItems.filter(item => item.score !== undefined).map(item => item.score || 0);
    if (scores.length === 0) return { results: 0, agility: 0, relationships: 0, final: 0 };

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      results: potentialItems[0]?.score || 0,
      agility: potentialItems[1]?.score || 0,
      relationships: ((potentialItems[2]?.score || 0) + (potentialItems[3]?.score || 0)) / 2,
      final: average
    };
  };

  const getProgress = () => {
    if (currentStep === 1) {
      const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
      const scoredItems = sections.reduce(
        (acc, section) => acc + section.items.filter(item => item.score !== undefined).length,
        0
      );
      return totalItems > 0 ? (scoredItems / totalItems) * 100 : 0;
    } else if (currentStep === 2) {
      const scoredItems = potentialItems.filter(item => item.score !== undefined).length;
      return potentialItems.length > 0 ? (scoredItems / potentialItems.length) * 100 : 0;
    } else {
      const allPdiItems = [...pdiData.curtosPrazos, ...pdiData.mediosPrazos, ...pdiData.longosPrazos];
      if (allPdiItems.length === 0) return 0;
      const completedItems = allPdiItems.filter(item => item.status === '5').length;
      return (completedItems / allPdiItems.length) * 100;
    }
  };

  const canProceedToStep2 = () => {
    return sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );
  };

  const canProceedToStep3 = () => {
    return potentialItems.every(item => item.score !== undefined);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && canProceedToStep3()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!currentCycle || !selectedEmployeeId || !profile?.id) {
      toast.error('Dados incompletos para enviar');
      return;
    }

    const allCompetenciesScored = sections.every(section =>
      section.items.every(item => item.score !== undefined)
    );

    const allPotentialScored = potentialItems.every(item => item.score !== undefined);

    if (!allCompetenciesScored || !allPotentialScored) {
      toast.error('Complete todas as avaliações de competências e potencial antes de enviar');
      return;
    }

    const totalPdiItems = pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;
    if (totalPdiItems === 0) {
      toast.error('Adicione pelo menos um item ao Plano de Desenvolvimento Individual (PDI) antes de enviar.');
      return;
    }

    const competencies = sections.flatMap(section =>
      section.items.map(item => {
        const originalComp = EVALUATION_COMPETENCIES[
          section.id === 'technical' ? 'technical' :
          section.id === 'behavioral' ? 'behavioral' : 'deliveries'
        ].find(c => c.name === item.name);

        return {
          id: item.id,
          criterion_name: item.name,
          criterion_description: item.description,
          category: originalComp?.category || 'technical',
          score: item.score!,
          weight: 1.0
        };
      })
    );

    setIsSaving(true);
    try {
      // 1. Criar a avaliação do líder
      // Primeiro salvamos sem o ID do leader evaluation
      await saveLeaderEvaluation({
        cycleId: currentCycle.id,
        employeeId: selectedEmployeeId,
        evaluatorId: profile.id,
        competencies,
        potentialScore: calculatePotentialScores().final,
        feedback: {
          strengths: 'Avaliação completa',
          improvements: '',
          observations: `Potencial: ${potentialItems.map(item => `${item.name}: ${item.score}`).join(', ')}`
        }
      });

      // 2. Salvar o PDI usando o novo serviço
      // Como não temos o ID da avaliação retornado, salvamos sem ele
      const pdiParams = pdiService.transformPDIDataForAPI(
        pdiData, 
        currentCycle.id,
        undefined // leaderEvaluationId será undefined por enquanto
      );

      await pdiService.savePDI(pdiParams);

      toast.success('Avaliação e PDI salvos com sucesso!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentCycle || !selectedEmployeeId || !profile?.id) {
      toast.error('Dados incompletos para salvar');
      return;
    }

    const competencies = sections.flatMap(section =>
      section.items
        .filter(item => item.score !== undefined)
        .map(item => {
          const originalComp = EVALUATION_COMPETENCIES[
            section.id === 'technical' ? 'technical' :
            section.id === 'behavioral' ? 'behavioral' : 'deliveries'
          ].find(c => c.name === item.name);

          return {
            id: item.id,
            criterion_name: item.name,
            criterion_description: item.description,
            category: originalComp?.category || 'technical',
            score: item.score!,
            weight: 1.0
          };
        })
    );

    const totalPdiItems = pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;
    if (competencies.length === 0 && totalPdiItems === 0) {
      toast.error('Avalie pelo menos uma competência ou adicione um item ao PDI antes de salvar');
      return;
    }

    const potentialScore = potentialItems.some(item => item.score !== undefined)
      ? calculatePotentialScores().final
      : undefined;

    setIsSaving(true);
    try {
      // Salvar avaliação como rascunho
      await saveLeaderEvaluation({
        cycleId: currentCycle.id,
        employeeId: selectedEmployeeId,
        evaluatorId: profile.id,
        competencies,
        potentialScore: potentialScore || 0,
        feedback: {
          strengths: '',
          improvements: '',
          observations: 'Avaliação salva como rascunho'
        }
      });

      // Se houver itens no PDI, salvar também
      if (totalPdiItems > 0) {
        const pdiParams = pdiService.transformPDIDataForAPI(
          pdiData, 
          currentCycle.id,
          undefined // Sem ID da avaliação por enquanto
        );
        
        await pdiService.savePDI(pdiParams);
      }

      toast.success('Rascunho salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação');
    } finally {
      setIsSaving(false);
    }
  };

  const isCycleInValidPeriod = (): boolean => { // Explicitly define return type
    if (!currentCycle) return false;
    const today = new Date();
    const startDate = new Date(currentCycle.start_date);
    const endDate = new Date(currentCycle.end_date);
    return today >= startDate && today <= endDate;
  };

  const getCyclePeriodMessage = (): { type: 'warning' | 'error', message: string } | null => { // Explicitly define return type
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
        message: `Atenção: ${daysRemaining} dias restantes para completar as avaliações`
      };
    }
    return null;
  };

  const selectedEmployee = subordinates.find(emp => emp.id === selectedEmployeeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
        {profile?.is_director && (
          <button
            onClick={() => window.location.href = '/cycle-management'}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <LeaderEvaluationHeader
        currentStep={currentStep}
        currentCycle={currentCycle}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        subordinates={subordinates}
        loading={loading}
        progress={getProgress()}
        periodMessage={getCyclePeriodMessage()} // Ensure this matches the type
        pdiData={pdiData}
        setPdiData={setPdiData}
        hasExistingEvaluation={hasExistingEvaluation}
      />

      {selectedEmployeeId && (
        <>
          {currentStep === 1 && (
            <>
              {sections.map((section, index) => (
                <EvaluationSection
                  key={section.id}
                  section={section}
                  setSections={setSections}
                  sectionIndex={index}
                  calculateScores={calculateScores}
                  isSaving={isSaving}
                />
              ))}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                  {!canProceedToStep2() ? (
                    <>
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Complete todas as competências para prosseguir
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Competências avaliadas! Prossiga para avaliar o potencial.
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button variant="outline" onClick={handleSaveDraft} icon={<Save size={18} />} size="lg" disabled={isSaving || loading}>
                    {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} icon={<ArrowRight size={18} />} size="lg" disabled={!canProceedToStep2()}>
                    Próxima Etapa
                  </Button>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <PotentialAndPDI
              currentStep={currentStep}
              potentialItems={potentialItems}
              setPotentialItems={setPotentialItems}
              pdiData={pdiData}
              setPdiData={setPdiData}
              handlePreviousStep={handlePreviousStep}
              handleNextStep={handleNextStep}
              handleSave={handleSaveDraft}
              handleSubmit={handleSubmit}
              isSaving={isSaving}
              loading={loading}
              canProceedToStep3={canProceedToStep3}
              selectedEmployee={selectedEmployee}
            />
          )}

          {currentStep === 3 && (
            <PotentialAndPDI
              currentStep={currentStep}
              potentialItems={potentialItems}
              setPotentialItems={setPotentialItems}
              pdiData={pdiData}
              setPdiData={setPdiData}
              handlePreviousStep={handlePreviousStep}
              handleNextStep={handleNextStep}
              handleSave={handleSaveDraft}
              handleSubmit={handleSubmit}
              isSaving={isSaving}
              loading={loading}
              canProceedToStep3={canProceedToStep3}
              selectedEmployee={selectedEmployee}
            />
          )}
        </>
      )}

      {!selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-secondary-100 to-primary-100 dark:from-secondary-900/20 dark:to-primary-900/20 mb-4 sm:mb-6">
              <Info className="h-8 w-8 sm:h-10 sm:w-10 text-secondary-600 dark:text-secondary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {subordinates.length === 0 && !loading ? 'Nenhum subordinado disponível' : 'Nenhum colaborador selecionado'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {subordinates.length === 0 && !loading
                ? profile?.is_leader && !profile?.is_director
                  ? 'Você não possui colaboradores subordinados para avaliar.'
                  : 'Entre em contato com o RH para verificar suas permissões.'
                : 'Selecione um colaborador acima para iniciar a avaliação de desempenho'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LeaderEvaluation;