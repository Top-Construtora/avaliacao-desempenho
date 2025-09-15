import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Save, Send, AlertCircle, CheckCircle, Star, Award, BookOpen, Target, Rocket,
  Calendar, Lightbulb, MessageSquare, Plus, X, ChevronDown, ChevronUp, FileText, TrendingUp
} from 'lucide-react';
import Button from './Button';
import { useEvaluation } from '../hooks/useEvaluation';
import type { NineBoxData } from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { toast } from 'react-hot-toast'; // Import toast

interface PotentialItem {
  id: string;
  name: string;
  description: string;
  score?: number; // Score can be number or undefined
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

interface PotentialAndPDIProps {
  currentStep: number;
  potentialItems: PotentialItem[];
  setPotentialItems: React.Dispatch<React.SetStateAction<PotentialItem[]>>;
  pdiData: PdiData;
  setPdiData: React.Dispatch<React.SetStateAction<PdiData>>;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
  handleSave: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  isSaving: boolean;
  loading: boolean;
  canProceedToStep3: () => boolean;
  selectedEmployee: UserWithDetails | undefined;
}

const PotentialAndPDI: React.FC<PotentialAndPDIProps> = ({
  currentStep,
  potentialItems,
  setPotentialItems,
  pdiData,
  setPdiData,
  handlePreviousStep,
  handleNextStep,
  handleSave,
  handleSubmit,
  isSaving,
  loading,
  canProceedToStep3,
  selectedEmployee
}) => {
  const { getNineBoxByEmployeeId } = useEvaluation();
  const employeeNineBox: NineBoxData | undefined = selectedEmployee ? getNineBoxByEmployeeId(selectedEmployee.id) : undefined;

  const [expandedPdiSections, setExpandedPdiSections] = useState({
    curto: true,
    medio: false,
    longo: false,
  });

  const [editingPdiItemPrazo, setEditingPdiItemPrazo] = useState<'curto' | 'medio' | 'longo' | null>(null);
  const [newPdiItem, setNewPdiItem] = useState<Omit<ActionItem, 'id'> & { prazo: 'curto' | 'medio' | 'longo' | '' }>({
    competencia: '',
    calendarizacao: '',
    comoDesenvolver: '',
    resultadosEsperados: '',
    status: '1',
    observacao: '',
    prazo: ''
  });

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

  const handlePotentialScoreChange = (itemId: string, score: number) => {
    setPotentialItems((prev: PotentialItem[]) => prev.map(item => // Explicitly type prev
      item.id === itemId ? { ...item, score } : item
    ));
  };

  const togglePdiSection = (sectionKey: 'curto' | 'medio' | 'longo') => {
    setExpandedPdiSections((prev: { curto: boolean; medio: boolean; longo: boolean; }) => ({ // Explicitly type prev
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleNewPdiItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPdiItem((prev: Omit<ActionItem, 'id'> & { prazo: 'curto' | 'medio' | 'longo' | '' }) => ({ // Explicitly type prev
      ...prev,
      [name]: value
    }));
  };

  const addPdiItem = () => {
    if (!newPdiItem.competencia.trim() || !newPdiItem.comoDesenvolver.trim() || !newPdiItem.resultadosEsperados.trim() || !newPdiItem.prazo) {
      toast.error('Preencha todos os campos obrigatórios e selecione o prazo para o item de desenvolvimento.');
      return;
    }

    const newItem = { ...newPdiItem, id: Date.now().toString() };

    setPdiData((prev: PdiData) => { // Explicitly type prev
      if (newItem.prazo === 'curto') {
        return { ...prev, curtosPrazos: [...prev.curtosPrazos, newItem as ActionItem] };
      } else if (newItem.prazo === 'medio') {
        return { ...prev, mediosPrazos: [...prev.mediosPrazos, newItem as ActionItem] };
      } else if (newItem.prazo === 'longo') {
        return { ...prev, longosPrazos: [...prev.longosPrazos, newItem as ActionItem] };
      }
      return prev;
    });

    // Clear the form fields but keep it open
    setNewPdiItem({
      competencia: '',
      calendarizacao: '',
      comoDesenvolver: '',
      resultadosEsperados: '',
      status: '1',
      observacao: '',
      prazo: newPdiItem.prazo // Keep the selected prazo
    });
    toast.success('Item de PDI adicionado com sucesso!');
  };

  const removePdiItem = (idToRemove: string, prazo: 'curto' | 'medio' | 'longo') => {
    setPdiData((prev: PdiData) => { // Explicitly type prev
      if (prazo === 'curto') {
        return { ...prev, curtosPrazos: prev.curtosPrazos.filter(item => item.id !== idToRemove) };
      } else if (prazo === 'medio') {
        return { ...prev, mediosPrazos: prev.mediosPrazos.filter(item => item.id !== idToRemove) };
      } else if (prazo === 'longo') {
        return { ...prev, longosPrazos: prev.longosPrazos.filter(item => item.id !== idToRemove) };
      }
      return prev;
    });
    toast.success('Item de PDI removido.');
  };

  const updateActionItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: keyof ActionItem,
    value: any
  ) => {
    setPdiData((prev: PdiData) => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const openAddPdiItemForm = (prazo: 'curto' | 'medio' | 'longo') => {
    setNewPdiItem(prev => ({ ...prev, prazo }));
    setEditingPdiItemPrazo(prazo);
    setExpandedPdiSections(prev => ({ ...prev, [prazo]: true }));
  };

  const closeAddPdiItemForm = () => {
    setEditingPdiItemPrazo(null);
    setNewPdiItem({
      competencia: '',
      calendarizacao: '',
      comoDesenvolver: '',
      resultadosEsperados: '',
      status: '1',
      observacao: '',
      prazo: ''
    });
  };

  const potentialRatingLabels = {
    1: { label: 'Não atende o esperado', color: 'bg-red-500', darkColor: 'dark:bg-red-600' },
    2: { label: 'Em desenvolvimento', color: 'bg-accent-500', darkColor: 'dark:bg-accent-600' },
    3: { label: 'Atende ao esperado', color: 'bg-primary-500', darkColor: 'dark:bg-primary-600' },
    4: { label: 'Supera', color: 'bg-green-500', darkColor: 'dark:bg-green-600' }
  };

  const statusOptions = [
    { value: '1', label: 'Não iniciado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600' },
    { value: '2', label: 'Iniciado', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700' },
    { value: '3', label: 'Em andamento', color: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border-accent-300 dark:border-accent-700' },
    { value: '4', label: 'Quase concluído', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' },
    { value: '5', label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' }
  ];

  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo',
      subtitle: '0-6 meses',
      icon: BookOpen,
      gradient: 'from-primary-500 to-primary-600',
      darkGradient: 'dark:from-primary-600 dark:to-primary-700',
      bgColor: 'bg-primary-50',
      darkBgColor: 'dark:bg-primary-800',
      borderColor: 'border-primary-200',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
      description: 'Ações imediatas e de rápido impacto'
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo',
      subtitle: '6-12 meses',
      icon: Target,
      gradient: 'from-secondary-500 to-secondary-600',
      darkGradient: 'dark:from-secondary-600 dark:to-secondary-700', // Added dark mode gradient
      bgColor: 'bg-secondary-50',
      darkBgColor: 'dark:bg-secondary-800', 
      borderColor: 'border-secondary-200',
      iconBg: 'bg-gradient-to-br from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
      description: 'Desenvolvimento contínuo e estruturado'
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo',
      subtitle: '12-24 meses',
      icon: Rocket,
      gradient: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50',
      darkBgColor: 'dark:bg-accent-800',
      borderColor: 'border-accent-200',
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700',
      description: 'Visão estratégica e crescimento sustentável'
    }
  ];

  const renderActionItems = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    const categoryData = categories.find(cat => cat.key === category)!;
    const items = pdiData[category];
    const isExpanded = expandedPdiSections[category.replace('Prazos', '') as 'curto' | 'medio' | 'longo'];
    const isAddingItemToThisCategory = editingPdiItemPrazo === category.replace('Prazos', '') as 'curto' | 'medio' | 'longo';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <button
          onClick={() => togglePdiSection(category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${categoryData.bgColor} ${categoryData.darkBgColor} border-b ${categoryData.borderColor} hover:opacity-90 transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${categoryData.iconBg} shadow-md`}>
                <categoryData.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100">{categoryData.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-white mt-0.5 hidden sm:block">{categoryData.subtitle} • {categoryData.description}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:hidden">{categoryData.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">{items.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">itens</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
              className="p-4 sm:p-6 lg:p-8"
            >
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 && !isAddingItemToThisCategory ? (
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">Nenhum item de desenvolvimento adicionado</p>
                    <Button
                      variant="outline"
                      onClick={() => openAddPdiItemForm(category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
                      icon={<Plus size={16} />}
                      size="sm"
                    >
                      Adicionar Primeiro Item
                    </Button>
                  </div>
                ) : (
                  <>
                    {items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-600"
                      >
                        {/* Header do Item */}
                        <div className="flex items-start justify-between mb-4 sm:mb-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${categoryData.iconBg} flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md`}>
                              {itemIndex + 1}
                            </div>
                            <div>
                              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Item de Desenvolvimento
                              </h4>
                              <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium border ${statusOptions.find(s => s.value === item.status)?.color}`}>
                                {statusOptions.find(s => s.value === item.status)?.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removePdiItem(item.id, category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
                            className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          >
                            <X size={16} className="sm:hidden" />
                            <X size={20} className="hidden sm:block" />
                          </button>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                          {/* Competência a desenvolver */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              Competência a desenvolver
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                              value={item.competencia}
                              onChange={(e) => updateActionItem(category, item.id, 'competencia', e.target.value)}
                            />
                          </div>

                          {/* Calendarização */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                              Calendarização (Mês/Ano)
                            </label>
                            <input
                              type="month"
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-secondary-500 dark:focus:border-secondary-400 focus:ring-secondary-500 dark:focus:ring-secondary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              value={item.calendarizacao}
                              onChange={(e) => updateActionItem(category, item.id, 'calendarizacao', e.target.value)}
                            />
                          </div>

                          {/* Como desenvolver as competências */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Lightbulb className="h-4 w-4 mr-2 text-accent-600 dark:text-accent-400" />
                              Como desenvolver as competências
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-accent-500 dark:focus:border-accent-400 focus:ring-accent-500 dark:focus:ring-accent-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              rows={3}
                              placeholder="Descreva as ações e métodos para desenvolver esta competência..."
                              value={item.comoDesenvolver}
                              onChange={(e) => updateActionItem(category, item.id, 'comoDesenvolver', e.target.value)}
                            />
                          </div>

                          {/* Resultados Esperados */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              Resultados Esperados
                            </label>
                            <textarea
                              className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                              rows={3}
                              placeholder="Descreva os resultados esperados com o desenvolvimento desta competência..."
                              value={item.resultadosEsperados}
                              onChange={(e) => updateActionItem(category, item.id, 'resultadosEsperados', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                            {/* Status */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                Status
                              </label>
                              <select
                                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500 dark:focus:ring-green-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                                value={item.status}
                                onChange={(e) => updateActionItem(category, item.id, 'status', e.target.value as any)}
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Observação */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                                Observação
                              </label>
                              <textarea
                                className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-secondary-500 dark:focus:border-secondary-400 focus:ring-secondary-500 dark:focus:ring-secondary-400 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm sm:text-base"
                                rows={2}
                                placeholder="Observações adicionais..."
                                value={item.observacao}
                                onChange={(e) => updateActionItem(category, item.id, 'observacao', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Add New Item Button always visible if items exist, or if no items AND form is not open */}
                    {!isAddingItemToThisCategory && (
                        <div className="flex justify-center pt-4">
                            <Button
                            variant="outline"
                            onClick={() => openAddPdiItemForm(category.replace('Prazos', '') as 'curto' | 'medio' | 'longo')}
                            icon={<Plus size={16} />}
                            className="border-2 border-dashed hover:border-solid"
                            size="sm"
                            >
                            Adicionar Novo Item
                            </Button>
                        </div>
                    )}
                  </>
                )}

                {/* New Item Add Form - RENDERED INSIDE THE SECTION */}
                <AnimatePresence>
                {isAddingItemToThisCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8 overflow-hidden mt-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
                        Adicionar Novo Item de Desenvolvimento ({categoryData.title})
                      </h3>
                      <button
                        onClick={closeAddPdiItemForm}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="competencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Lightbulb size={16} className="mr-1 text-accent-500" />
                          Competência a desenvolver
                        </label>
                        <input
                          type="text"
                          id="competencia"
                          name="competencia"
                          value={newPdiItem.competencia}
                          onChange={handleNewPdiItemChange}
                          placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="calendarizacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Calendar size={16} className="mr-1 text-primary-500" />
                            Calendarização (Mês/Ano)
                          </label>
                          <input
                            type="month"
                            id="calendarizacao"
                            name="calendarizacao"
                            value={newPdiItem.calendarizacao}
                            onChange={handleNewPdiItemChange}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="comoDesenvolver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <FileText size={16} className="mr-1 text-secondary-500" />
                          Como desenvolver as competências
                        </label>
                        <textarea
                          id="comoDesenvolver"
                          name="comoDesenvolver"
                          value={newPdiItem.comoDesenvolver}
                          onChange={handleNewPdiItemChange}
                          placeholder="Descreva as ações e métodos para desenvolver esta competência..."
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                        ></textarea>
                      </div>

                      <div>
                        <label htmlFor="resultadosEsperados" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <TrendingUp size={16} className="mr-1 text-green-500" />
                          Resultados Esperados
                        </label>
                        <textarea
                          id="resultadosEsperados"
                          name="resultadosEsperados"
                          value={newPdiItem.resultadosEsperados}
                          onChange={handleNewPdiItemChange}
                          placeholder="Descreva os resultados esperados com o desenvolvimento desta competência..."
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <CheckCircle size={16} className="mr-1 text-cyan-500" />
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={newPdiItem.status}
                            onChange={handleNewPdiItemChange}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="observacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <MessageSquare size={16} className="mr-1 text-gray-500" />
                            Observação
                          </label>
                          <textarea
                            id="observacao"
                            name="observacao"
                            value={newPdiItem.observacao}
                            onChange={handleNewPdiItemChange}
                            placeholder="Observações adicionais..."
                            rows={1}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100"
                          ></textarea>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-4">
                        <Button
                          variant="outline"
                          onClick={closeAddPdiItemForm}
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={addPdiItem}
                          icon={<Plus size={18} />}
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          Adicionar Item
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4"
        >
          {/* Potential Evaluation */}
          <div className="space-y-4 sm:space-y-6">
            {potentialItems.map((item, index) => {
              const iconMap: { [key: string]: React.ElementType } = {
                'pot1': Rocket, 'pot2': BookOpen, 'pot3': Award, 'pot4': Target
              };
              const IconComponent = iconMap[item.id];

              const colorMap: { [key: string]: any } = {
                'pot1': {
                  gradient: 'from-primary-500 to-primary-600',
                  darkGradient: 'dark:from-primary-600 dark:to-primary-700',
                  bgColor: 'bg-primary-50',
                  darkBgColor: 'dark:bg-primary-900/20',
                  borderColor: 'border-primary-200',
                  darkBorderColor: 'dark:border-primary-700'
                },
                'pot2': {
                  gradient: 'from-secondary-500 to-secondary-600',
                  darkGradient: 'dark:from-secondary-600 dark:to-secondary-700',
                  bgColor: 'bg-secondary-50',
                  darkBgColor: 'dark:bg-secondary-900/20',
                  borderColor: 'border-secondary-200',
                  darkBorderColor: 'dark:border-secondary-700'
                },
                'pot3': {
                  gradient: 'from-accent-500 to-accent-600',
                  darkGradient: 'dark:from-accent-600 dark:to-accent-700',
                  bgColor: 'bg-accent-50',
                  darkBgColor: 'dark:bg-accent-900/20',
                  borderColor: 'border-accent-200',
                  darkBorderColor: 'dark:border-accent-700'
                },
                'pot4': {
                  gradient: 'from-gray-500 to-gray-600',
                  darkGradient: 'dark:from-gray-600 dark:to-gray-700',
                  bgColor: 'bg-gray-50',
                  darkBgColor: 'dark:bg-gray-900/20',
                  borderColor: 'border-gray-200',
                  darkBorderColor: 'dark:border-gray-700'
                }
              };

              const colors = colorMap[item.id];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className={`p-4 sm:p-6 ${colors.bgColor} ${colors.darkBgColor} border-b ${colors.borderColor} ${colors.darkBorderColor}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${colors.gradient} ${colors.darkGradient} shadow-md dark:shadow-lg flex-shrink-0 self-start`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 break-words">
                            {index + 1}. {item.name}
                          </h3>
                          {item.score && (
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${potentialRatingLabels[item.score as keyof typeof potentialRatingLabels].color} ${potentialRatingLabels[item.score as keyof typeof potentialRatingLabels].darkColor} text-white self-start sm:self-auto`}>
                              {potentialRatingLabels[item.score as keyof typeof potentialRatingLabels].label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      {[1, 2, 3, 4].map((rating) => {
                        const ratingInfo = potentialRatingLabels[rating as keyof typeof potentialRatingLabels];
                        return (
                          <button
                            key={rating}
                            onClick={() => handlePotentialScoreChange(item.id, rating)}
                            className={`py-3 sm:py-4 px-2 sm:px-4 rounded-xl border-2 transition-all duration-200 ${
                              item.score === rating
                                ? `${ratingInfo.color} ${ratingInfo.darkColor} text-white border-transparent shadow-lg transform scale-105`
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-xl sm:text-2xl font-bold mb-1">{rating}</div>
                              <div className="text-xs">
                                {ratingInfo.label}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Potential Score Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-accent-50 to-primary-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-accent-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent-600 dark:text-accent-400" />
              Análise de Potencial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-accent-200 dark:border-accent-700">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Média Geral</h4>
                <p className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">{calculatePotentialScores().final.toFixed(1)}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(calculatePotentialScores().final / 4) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-primary-200 dark:border-primary-700">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Critérios Avaliados</h4>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{potentialItems.filter(c => c.score).length}/{potentialItems.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {potentialItems.filter(c => c.score).length === potentialItems.length ? 'Avaliação completa' : 'Em andamento'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent-500 to-primary-600 dark:from-accent-600 dark:to-accent-700 p-4 sm:p-6 rounded-lg sm:rounded-xl text-white sm:col-span-2 lg:col-span-1">
                <h4 className="text-sm font-medium text-accent-100 dark:text-accent-200 mb-2">Classificação</h4>
                <p className="text-xl sm:text-2xl font-bold break-words">
                  {calculatePotentialScores().final >= 3.5 ? 'Alto Potencial' :
                   calculatePotentialScores().final >= 2.5 ? 'Potencial Médio' :
                   calculatePotentialScores().final >= 1.5 ? 'Potencial em Desenvolvimento' :
                   'Necessita Desenvolvimento'}
                </p>
                <p className="text-xs text-accent-100 dark:text-accent-200 mt-2">
                  Baseado na média das avaliações
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-2 text-sm">
              {potentialItems.some(item => item.score === undefined) ? (
                <>
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Complete todas as avaliações de potencial para prosseguir
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Avaliação de potencial completa! Prossiga para o PDI.
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                icon={<ArrowLeft size={18} />}
                size="lg"
                className="w-full sm:w-auto"
              >
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                icon={<Save size={18} />}
                size="lg"
                disabled={isSaving || loading}
                className="w-full sm:w-auto"
              >
                {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button
                variant="primary"
                onClick={handleNextStep}
                icon={<ArrowRight size={18} />}
                size="lg"
                disabled={!canProceedToStep3()}
                className="w-full sm:w-auto"
              >
                Próxima Etapa
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {renderActionItems(category.key)}
            </motion.div>
          ))}
        </motion.div>
      )}

    </>
  );
};

export default PotentialAndPDI;
