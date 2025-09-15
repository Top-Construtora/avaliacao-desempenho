import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, Info, Save, Send } from 'lucide-react';
import Button from '../../components/Button';
import PotentialAndPDI from '../../components/PotentialAndPDI';
import { useEvaluation } from '../../hooks/useEvaluation';
import { pdiService } from '../../services/pdiService';
import { useAuth } from '../../context/AuthContext';
import type { UserWithDetails } from '../../types/supabase';

// Define ActionItem and PdiData interfaces here to ensure consistency
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

const PdiManagement: React.FC = () => {
  const { employees } = useEvaluation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [pdiData, setPdiData] = useState<PdiData>({
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: []
  });
  const [loadingPDI, setLoadingPDI] = useState<boolean>(false);
  const [isSavingPDI, setIsSavingPDI] = useState<boolean>(false);

  // Load PDI when selectedEmployeeId changes
  useEffect(() => {
    const fetchPdi = async () => {
      if (selectedEmployeeId) {
        setLoadingPDI(true);
        const employeeProfile = employees.find(emp => emp.id === selectedEmployeeId);
        
        // Reset PDI data before loading new one
        setPdiData({
          colaboradorId: selectedEmployeeId,
          colaborador: employeeProfile?.name || '',
          cargo: employeeProfile?.position || '',
          departamento: employeeProfile?.departments?.map(dep => dep.name).join(', ') || 'Não definido',
          periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          curtosPrazos: [],
          mediosPrazos: [],
          longosPrazos: [],
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
        });

        try {
          const loadedPdi = await pdiService.getPDI(selectedEmployeeId);
          if (loadedPdi) {
            // Transform API data to component format
            const transformedPdi = pdiService.transformPDIDataFromAPI(loadedPdi);
            setPdiData({
              ...transformedPdi,
              colaboradorId: selectedEmployeeId,
              colaborador: employeeProfile?.name || '',
              cargo: employeeProfile?.position || '',
              departamento: employeeProfile?.departments?.map(dep => dep.name).join(', ') || 'Não definido'
            });
            toast.success('PDI carregado com sucesso!');
          } else {
            toast('Nenhum PDI encontrado para este colaborador. Crie um novo!');
          }
        } catch (error) {
          console.error('Erro ao carregar PDI:', error);
          toast.error('Erro ao carregar PDI.');
        } finally {
          setLoadingPDI(false);
        }
      }
    };
    fetchPdi();
  }, [selectedEmployeeId, employees]);

  const handleSavePDI = useCallback(async () => {
    if (!pdiData.colaboradorId) {
      toast.error('Selecione um colaborador para salvar o PDI.');
      return;
    }

    const allPdiActionItems = [
      ...pdiData.curtosPrazos,
      ...pdiData.mediosPrazos,
      ...pdiData.longosPrazos
    ];

    if (allPdiActionItems.length === 0) {
      toast.error('Adicione pelo menos um item ao Plano de Desenvolvimento Individual (PDI) antes de salvar.');
      return;
    }

    const pdiGoals = allPdiActionItems.map(item => 
      `Competência: ${item.competencia || 'N/A'}. Resultados Esperados: ${item.resultadosEsperados || 'N/A'}.`
    );

    const pdiActions = allPdiActionItems.map(item => 
      `Como desenvolver: ${item.comoDesenvolver || 'N/A'} (Prazo: ${item.calendarizacao || 'N/A'}, Status: ${item.status || 'N/A'}, Observação: ${item.observacao || 'N/A'}).`
    );

    // Transform PDI data to new API format
    const pdiToSave = pdiService.transformPDIDataForAPI(pdiData);

    setIsSavingPDI(true);
    try {
      await pdiService.savePDI(pdiToSave);
      toast.success('PDI salvo/atualizado com sucesso!');
      
      // Refresh the PDI data to get the updated version
      const refreshedPdi = await pdiService.getPDI(pdiData.colaboradorId);
      if (refreshedPdi) {
        const transformedPdi = pdiService.transformPDIDataFromAPI(refreshedPdi);
        const employeeProfile = employees.find(emp => emp.id === pdiData.colaboradorId);
        setPdiData({
          ...transformedPdi,
          colaboradorId: pdiData.colaboradorId,
          colaborador: employeeProfile?.name || '',
          cargo: employeeProfile?.position || '',
          departamento: employeeProfile?.departments?.map(dep => dep.name).join(', ') || 'Não definido'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      toast.error('Erro ao salvar PDI.');
    } finally {
      setIsSavingPDI(false);
    }
  }, [pdiData, employees]);

  const handlePdiSubmit = async () => {
    // For PDI Management page, "submit" is effectively "save"
    await handleSavePDI();
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 dark:text-primary-400 mr-3" />
                Gerenciar PDI
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Visualize e edite Planos de Desenvolvimento Individual</p>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Selecione o Colaborador
            </label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-10 py-3 rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 appearance-none cursor-pointer"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={loadingPDI}
              >
                <option value="">Escolha um colaborador...</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          {selectedEmployee && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <BookOpen className="inline h-4 w-4 mr-1" />
                  PDI Período
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                  {pdiData.periodo || 'Não definido'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Info className="inline h-4 w-4 mr-1" />
                  Última Atualização
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                  {pdiData.dataAtualizacao ? new Date(pdiData.dataAtualizacao).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* PDI Content */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingPDI ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <PotentialAndPDI
                currentStep={3} // Force step 3 to show PDI section
                potentialItems={[]} // Not used here
                setPotentialItems={() => {}} // Not used here
                pdiData={pdiData}
                setPdiData={setPdiData}
                handlePreviousStep={() => {}} // Not used here
                handleNextStep={() => {}} // Not used here
                handleSave={handleSavePDI} // Use the local save handler
                handleSubmit={handlePdiSubmit} // Use the local submit handler (which calls save)
                isSaving={isSavingPDI}
                loading={loadingPDI}
                canProceedToStep3={() => true}
                selectedEmployee={selectedEmployee}
              />
              
              {/* Botão de salvamento flutuante */}
              <div className="fixed bottom-8 right-8 z-50">
                <Button
                  variant="primary"
                  onClick={handleSavePDI}
                  icon={<Save size={20} />}
                  size="lg"
                  disabled={isSavingPDI || loadingPDI}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  {isSavingPDI ? 'Salvando...' : 'Salvar PDI'}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 mb-6">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Selecione um colaborador
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              Escolha um colaborador no menu acima para visualizar ou editar o PDI.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PdiManagement;
