import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Briefcase, Calendar, Info, ChevronDown,
  AlertCircle, Building, Grid3x3
} from 'lucide-react';
import type { EvaluationCycle } from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { useEvaluation } from '../hooks/useEvaluation'; // Import useEvaluation to get getNineBoxByEmployeeId

interface LeaderEvaluationHeaderProps {
  currentStep: number;
  currentCycle: EvaluationCycle | null;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  subordinates: UserWithDetails[];
  loading: boolean;
  progress: number;
  periodMessage: { type: 'warning' | 'error', message: string } | null;
  pdiData: any; // PDI data passed from parent
  setPdiData: React.Dispatch<React.SetStateAction<any>>; // Setter for PDI data
  hasExistingEvaluation?: boolean;
}

const LeaderEvaluationHeader: React.FC<LeaderEvaluationHeaderProps> = ({
  currentStep,
  currentCycle,
  selectedEmployeeId,
  setSelectedEmployeeId,
  subordinates,
  loading,
  progress,
  periodMessage,
  pdiData,
  setPdiData,
  hasExistingEvaluation
}) => {
  const selectedEmployee = subordinates.find(emp => emp.id === selectedEmployeeId);
  const { getNineBoxByEmployeeId } = useEvaluation(); // Get the hook here
  const employeeNineBox = selectedEmployeeId ? getNineBoxByEmployeeId(selectedEmployeeId) : undefined;


  const getQuadrantDescription = (quadrant?: string) => {
    const descriptions: Record<string, string> = {
      'A1': 'Alto Potencial - Alto Desempenho',
      'A2': 'Alto Potencial - Médio Desempenho',
      'A3': 'Alto Potencial - Baixo Desempenho',
      'B1': 'Médio Potencial - Alto Desempenho',
      'B2': 'Médio Potencial - Médio Desempenho',
      'B3': 'Médio Potencial - Baixo Desempenho',
      'C1': 'Baixo Potencial - Alto Desempenho',
      'C2': 'Baixo Potencial - Médio Desempenho',
      'C3': 'Baixo Potencial - Baixo Desempenho'
    };
    return quadrant ? descriptions[quadrant] || 'Não avaliado' : 'Não avaliado';
  };

  const getQuadrantColor = (quadrant?: string) => {
    if (!quadrant) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    const colors: Record<string, string> = {
      'A1': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'A2': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      'A3': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'B1': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'B2': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      'B3': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'C1': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'C2': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      'C3': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[quadrant] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  React.useEffect(() => {
    if (employeeNineBox) {
      setPdiData((prev: any) => ({
        ...prev,
        nineBoxQuadrante: employeeNineBox.nine_box_position,
        nineBoxDescricao: getQuadrantDescription(employeeNineBox.nine_box_position)
      }));
    }
  }, [employeeNineBox, setPdiData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 dark:text-secondary-400 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="truncate">Avaliação do Líder</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 1 ? 'Etapa 1: Avalie as competências' :
               currentStep === 2 ? 'Etapa 2: Avalie o potencial' :
               'Etapa 3: Plano de Desenvolvimento Individual'}
            </p>
            {currentCycle && (
              <p className="text-xs text-gray-500 mt-1">
                Ciclo: {currentCycle.title} | Prazo: {new Date(currentCycle.end_date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {periodMessage && (
          <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
            periodMessage.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300'
          }`}>
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{periodMessage.message}</p>
          </div>
        )}

        {hasExistingEvaluation && selectedEmployeeId && (
          <div className="mt-4 p-3 rounded-lg flex items-start space-x-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">A avaliação já foi concluída. Você pode editá-la e reenviá-la para atualizar.</p>
          </div>
        )}

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Progresso</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{Math.round(progress)}%</p>
          </div>
          <div className="relative">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
                className="sm:hidden dark:stroke-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="4"
                fill="none"
                className="hidden sm:block dark:stroke-gray-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${progress * 1.26} 126`}
                strokeLinecap="round"
                className="sm:hidden"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress * 1.76} 176`}
                strokeLinecap="round"
                className="hidden sm:block"
              />
              <defs>
                <linearGradient id="progressGradient">
                  <stop offset="0%" stopColor="#1e6076" />
                  <stop offset="100%" stopColor="#12b0a0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecione o Colaborador
          </label>
          <div className="relative">
            <select
              id="employee-select"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 text-sm sm:text-base appearance-none text-gray-700 dark:text-gray-200"
              disabled={loading}
            >
              <option value="">Escolha um colaborador...</option>
              {loading ? (
                <option value="" disabled>Carregando...</option>
              ) : subordinates.length === 0 ? (
                <option value="" disabled>Nenhum colaborador subordinado</option>
              ) : (
                subordinates.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))
              )}
            </select>
            <Info className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          {subordinates.length === 0 && !loading && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Entre em contato com o RH para verificar suas permissões.
            </p>
          )}
        </div>

        {selectedEmployee && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Cargo
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                {selectedEmployee.position}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Departamento
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                {Array.isArray(selectedEmployee.departments)
                  ? selectedEmployee.departments.length > 0
                    ? selectedEmployee.departments.map(dep => dep.name).join(', ')
                    : 'Não definido'
                  : selectedEmployee.departments || 'Não definido'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEmployee && employeeNineBox && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Grid3x3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resultado Nine Box</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuadrantColor(pdiData.nineBoxQuadrante)}`}>
                  {pdiData.nineBoxQuadrante}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pdiData.nineBoxDescricao}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
            Período do PDI
          </label>
          <input
            type="text"
            className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
            value={pdiData.periodo}
            onChange={(e) => setPdiData((prev: any) => ({ ...prev, periodo: e.target.value }))}
            placeholder="Ex: 2024-2025"
          />
        </div>
      )}

      {selectedEmployeeId && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Competências</span>
          </div>
          <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Potencial</span>
          </div>
          <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <div className={`flex items-center ${currentStep >= 3 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 3 ? 'bg-primary-600 dark:bg-primary-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">PDI</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LeaderEvaluationHeader;