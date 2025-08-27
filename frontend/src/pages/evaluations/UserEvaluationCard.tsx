import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Plus, Minus, FileText, Brain, UserCheck, Target, 
  Save, CheckCircle, AlertCircle, Star, Trash2, Edit2 
} from 'lucide-react';
import type { User } from '../../types/user';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';

interface PdiItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacoes: string;
}

interface UserEvaluationData {
  user: User;
  selfEvaluation: {
    toolkit: {
      conhecimentos: string[];
      ferramentas: string[];
      forcasInternas: string[];
      qualidades: string[];
    };
    competencies: {
      technical: { [key: string]: number | null };
      behavioral: { [key: string]: number | null };
      deliveries: { [key: string]: number | null };
    };
    finalScore: number;
  };
  toolkit: {
    conhecimentos: number;
    ferramentas: number;
    forcasInternas: number;
    qualidades: number;
  };
  leaderEvaluation: {
    technical: { [key: string]: number | null };
    behavioral: { [key: string]: number | null };
    deliveries: { [key: string]: number | null };
    potential?: {
      funcaoSubsequente: number | null;
      aprendizadoContinuo: number | null;
      alinhamentoCultural: number | null;
      visaoSistemica: number | null;
    };
    finalScore: number;
  };
  consensus?: {
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
  isSaving: boolean;
  lastSaved?: Date;
  saveError?: string;
}

interface UserEvaluationCardProps {
  userData: UserEvaluationData;
  toolkitSections: Array<{ key: string; label: string }>;
  competencyCategories: {
    technical: any[];
    behavioral: any[];
    deliveries: any[];
  };
  onUpdateToolkitData: (userId: string, section: string, index: number, value: string) => void;
  onAddToolkitItem: (userId: string, section: string) => void;
  onRemoveToolkitItem: (userId: string, section: string, index: number) => void;
  onUpdateSelfEvaluationScore: (userId: string, category: 'technical' | 'behavioral' | 'deliveries', competencyName: string, score: number | null) => void;
  onUpdateLeaderEvaluationScore: (userId: string, category: 'technical' | 'behavioral' | 'deliveries', competencyName: string, score: number | null) => void;
  onUpdatePotentialScore?: (userId: string, potentialField: 'funcaoSubsequente' | 'aprendizadoContinuo' | 'alinhamentoCultural' | 'visaoSistemica', score: number | null) => void;
  onUpdateConsensusScore?: (userId: string, category: 'technical' | 'behavioral' | 'deliveries', competencyName: string, score: number | null) => void;
  onUpdateConsensusNotes?: (userId: string, notes: string) => void;
  onAddPdiItem?: (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => void;
  onRemovePdiItem?: (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', itemId: string) => void;
  onUpdatePdiItem?: (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', itemId: string, field: keyof PdiItem, value: string) => void;
  onSaveIndividual: (userId: string) => void;
  selectedCycle: string;
}

const UserEvaluationCard: React.FC<UserEvaluationCardProps> = ({
  userData,
  toolkitSections,
  competencyCategories,
  onUpdateToolkitData,
  onAddToolkitItem,
  onRemoveToolkitItem,
  onUpdateSelfEvaluationScore,
  onUpdateLeaderEvaluationScore,
  onUpdatePotentialScore,
  onUpdateConsensusScore,
  onUpdateConsensusNotes,
  onAddPdiItem,
  onRemovePdiItem,
  onUpdatePdiItem,
  onSaveIndividual,
  selectedCycle
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    toolkit: boolean;
    selfCompetencies: boolean;
    leaderEvaluation: boolean;
    consensus: boolean;
    pdi: boolean;
  }>({
    toolkit: false,
    selfCompetencies: false,
    leaderEvaluation: false,
    consensus: false,
    pdi: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSectionCompletion = (section: 'toolkit' | 'selfCompetencies' | 'leaderEvaluation' | 'consensus' | 'pdi') => {
    switch (section) {
      case 'toolkit':
        return toolkitSections.some(s => 
          (userData.selfEvaluation.toolkit[s.key as keyof typeof userData.selfEvaluation.toolkit] as string[])
            .some(item => item.trim() !== '')
        );
      case 'selfCompetencies':
        const selfScores = [
          ...Object.values(userData.selfEvaluation.competencies.technical),
          ...Object.values(userData.selfEvaluation.competencies.behavioral),
          ...Object.values(userData.selfEvaluation.competencies.deliveries)
        ];
        return selfScores.some(score => score !== null);
      case 'leaderEvaluation':
        const leaderScores = [
          ...Object.values(userData.leaderEvaluation.technical),
          ...Object.values(userData.leaderEvaluation.behavioral),
          ...Object.values(userData.leaderEvaluation.deliveries)
        ];
        const leaderHasScores = leaderScores.some(score => score !== null);
        
        // Verificar também se há notas de potencial
        let potentialHasScores = false;
        if (userData.leaderEvaluation.potential) {
          const potentialScores = Object.values(userData.leaderEvaluation.potential);
          potentialHasScores = potentialScores.some(score => score !== null);
        }
        
        return leaderHasScores || potentialHasScores;
      case 'consensus':
        if (!userData.consensus) return false;
        const consensusScores = [
          ...Object.values(userData.consensus.technical),
          ...Object.values(userData.consensus.behavioral),
          ...Object.values(userData.consensus.deliveries)
        ];
        return consensusScores.some(score => score !== null) || 
               userData.consensus.notes.trim() !== '';
      case 'pdi':
        const allPdiItems = [...userData.pdi.curtosPrazos, ...userData.pdi.mediosPrazos, ...userData.pdi.longosPrazos];
        return allPdiItems.length > 0;
      default:
        return false;
    }
  };

  const ScoreInput: React.FC<{
    value: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
  }> = ({ value, onChange, placeholder }) => (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium transition-all"
      >
        <option value="">{placeholder || 'Selecione...'}</option>
        <option value="1">1 - Insuficiente</option>
        <option value="2">2 - Parcialmente Adequado</option>
        <option value="3">3 - Adequado</option>
        <option value="4">4 - Excelente</option>
      </select>
      {value && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          value >= 3.5 ? 'bg-primary-500 text-white' :
          value >= 2.5 ? 'bg-accent-500 text-white' :
          'bg-secondary-500 text-white'
        }`}>
          {value >= 3.5 ? '✓' : value >= 2.5 ? '○' : '!'}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      {/* Header do Usuário */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {userData.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                {userData.user.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userData.user.position} • {userData.user.department?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {userData.lastSaved && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                Salvo {userData.lastSaved.toLocaleTimeString()}
              </span>
            )}
            {userData.saveError && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                Erro ao salvar
              </span>
            )}
          </div>
        </div>
        
        {userData.saveError && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              Erro ao salvar: {userData.saveError}
            </p>
          </div>
        )}

        {/* Progress Indicators */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'toolkit' as const, label: 'Toolkit', icon: FileText },
            { key: 'selfCompetencies' as const, label: 'Auto-Avaliação', icon: Brain },
            { key: 'leaderEvaluation' as const, label: 'Líder', icon: UserCheck },
            { key: 'consensus' as const, label: 'Consenso', icon: Star },
            { key: 'pdi' as const, label: 'PDI', icon: Target }
          ].map(({ key, label, icon: Icon }) => {
            const isComplete = getSectionCompletion(key);
            return (
              <div key={key} className={`p-2 rounded-lg border-2 transition-all ${
                isComplete 
                  ? 'border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20' 
                  : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <Icon className={`w-4 h-4 ${
                    isComplete ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isComplete ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {label}
                  </span>
                  {isComplete && <CheckCircle className="w-3 h-3 text-primary-600 dark:text-primary-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seções Colapsáveis */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {/* Autoavaliação - Toolkit */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('toolkit')}
            className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
                <CheckCircle className="w-5 h-5 text-primary-500" />
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
                        {(userData.selfEvaluation.toolkit[section.key as keyof typeof userData.selfEvaluation.toolkit] as string[] || ['']).map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => onUpdateToolkitData(userData.user.id, section.key, index, e.target.value)}
                              placeholder={`Ex: ${section.label.toLowerCase()}...`}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => onRemoveToolkitItem(userData.user.id, section.key, index)}
                              className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => onAddToolkitItem(userData.user.id, section.key)}
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
            className="w-full flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
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
                <CheckCircle className="w-5 h-5 text-primary-500" />
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
                    <div key={category} className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
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
                            <ScoreInput
                              value={userData.selfEvaluation.competencies[category as keyof typeof userData.selfEvaluation.competencies][competency.name]}
                              onChange={(value) => {
                                onUpdateSelfEvaluationScore(userData.user.id, category as 'technical' | 'behavioral' | 'deliveries', competency.name, value);
                              }}
                              placeholder="Selecione nota (1-4)"
                            />
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
            className="w-full flex items-center justify-between p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Avaliação do Líder
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avaliação das competências e potencial pelo líder (escala 1-4)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSectionCompletion('leaderEvaluation') && (
                <CheckCircle className="w-5 h-5 text-primary-500" />
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
                    <div key={category} className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg">
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
                            <ScoreInput
                              value={userData.leaderEvaluation[category as keyof typeof userData.leaderEvaluation][competency.name] as number | null}
                              onChange={(value) => {
                                onUpdateLeaderEvaluationScore(userData.user.id, category as 'technical' | 'behavioral' | 'deliveries', competency.name, value);
                              }}
                              placeholder="Selecione nota (1-4)"
                            />
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
                  
                  {/* Indicadores de Potencial - Dentro da Avaliação do Líder */}
                  <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                      ⭐ Indicadores de Potencial
                    </h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Potencial para função subsequente */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Potencial para função subsequente
                        </label>
                        <ScoreInput
                          value={userData.leaderEvaluation.potential?.funcaoSubsequente || null}
                          onChange={(value) => {
                            if (onUpdatePotentialScore) {
                              onUpdatePotentialScore(userData.user.id, 'funcaoSubsequente', value);
                            }
                          }}
                          placeholder="Selecione nota (1-4)"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          O colaborador consegue assumir uma função subsequente no prazo de 1 ano?
                        </p>
                      </div>

                      {/* Aprendizado contínuo */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Aprendizado contínuo
                        </label>
                        <ScoreInput
                          value={userData.leaderEvaluation.potential?.aprendizadoContinuo || null}
                          onChange={(value) => {
                            if (onUpdatePotentialScore) {
                              onUpdatePotentialScore(userData.user.id, 'aprendizadoContinuo', value);
                            }
                          }}
                          placeholder="Selecione nota (1-4)"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Busca o desenvolvimento pessoal, profissional e o aprimoramento de conhecimentos.
                        </p>
                      </div>

                      {/* Alinhamento com Código Cultural */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Alinhamento com Código Cultural
                        </label>
                        <ScoreInput
                          value={userData.leaderEvaluation.potential?.alinhamentoCultural || null}
                          onChange={(value) => {
                            if (onUpdatePotentialScore) {
                              onUpdatePotentialScore(userData.user.id, 'alinhamentoCultural', value);
                            }
                          }}
                          placeholder="Selecione nota (1-4)"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Possui alinhamento com o Código Cultural da empresa.
                        </p>
                      </div>

                      {/* Visão sistêmica */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Visão sistêmica
                        </label>
                        <ScoreInput
                          value={userData.leaderEvaluation.potential?.visaoSistemica || null}
                          onChange={(value) => {
                            if (onUpdatePotentialScore) {
                              onUpdatePotentialScore(userData.user.id, 'visaoSistemica', value);
                            }
                          }}
                          placeholder="Selecione nota (1-4)"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Possui uma visão sistêmica da empresa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Consenso */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('consensus')}
            className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Consenso Final
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Notas finais de consenso para cada competência (escala 1-4)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getSectionCompletion('consensus') && (
                <CheckCircle className="w-5 h-5 text-primary-500" />
              )}
              {expandedSections.consensus ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
          
          <AnimatePresence>
            {expandedSections.consensus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-6">
                  {/* Competências de Consenso */}
                  {Object.entries(competencyCategories).map(([category, competencies]) => (
                    <div key={category} className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                        {category === 'technical' ? '🔧 Competências Técnicas - Consenso' : 
                         category === 'behavioral' ? '🤝 Competências Comportamentais - Consenso' : 
                         '🎯 Competências Organizacionais - Consenso'}
                      </h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {competencies.map((competency: any) => (
                          <div key={competency.name} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {competency.name}
                            </label>
                            <ScoreInput
                              value={userData.consensus?.[category as keyof typeof userData.consensus][competency.name] as number | null || null}
                              onChange={(value) => {
                                if (onUpdateConsensusScore) {
                                  onUpdateConsensusScore(userData.user.id, category as 'technical' | 'behavioral' | 'deliveries', competency.name, value);
                                }
                              }}
                              placeholder="Selecione nota (1-4)"
                            />
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

                  {/* Nota Final do Consenso */}
                  {userData.consensus && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h6 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                          ⭐ Nota Final do Consenso
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nota Final Calculada (com pesos)
                            </label>
                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {(() => {
                                // Calcular nota final do consenso com pesos
                                const weights = { technical: 0.5, behavioral: 0.3, deliveries: 0.2 };
                                const categories = ['technical', 'behavioral', 'deliveries'] as const;
                                let weightedSum = 0;
                                let totalWeight = 0;
                                
                                categories.forEach(category => {
                                  const categoryData = userData.consensus?.[category];
                                  if (categoryData) {
                                    const scores = Object.values(categoryData).filter(score => score !== null) as number[];
                                    if (scores.length > 0) {
                                      const categoryAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                                      weightedSum += categoryAverage * weights[category];
                                      totalWeight += weights[category];
                                    }
                                  }
                                });
                                
                                if (totalWeight > 0) {
                                  const result = weightedSum / totalWeight;
                                  return result > 0 ? result.toFixed(3) : '---';
                                }
                                return '---';
                              })()}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Técnicas: 50% • Comportamentais: 30% • Organizacionais: 20%
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Detalhamento por Categoria
                            </label>
                            {(() => {
                              const categories = ['technical', 'behavioral', 'deliveries'] as const;
                              const weights = { technical: 0.5, behavioral: 0.3, deliveries: 0.2 };
                              
                              return categories.map(category => {
                                const categoryData = userData.consensus?.[category];
                                if (!categoryData) return null;
                                
                                const scores = Object.values(categoryData).filter(score => score !== null) as number[];
                                const weight = weights[category];
                                
                                let displayValue = '---';
                                if (scores.length > 0) {
                                  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                                  displayValue = average > 0 ? average.toFixed(3) : '---';
                                }
                                
                                const categoryName = category === 'technical' ? 'Técnicas' : 
                                                   category === 'behavioral' ? 'Comportamentais' : 'Organizacionais';
                                
                                return (
                                  <div key={category} className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {categoryName} ({(weight * 100)}%):
                                    </span>
                                    <span className="font-medium">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observações do Consenso */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📝 Observações do Consenso
                    </label>
                    <textarea
                      value={userData.consensus?.notes || ''}
                      onChange={(e) => {
                        if (onUpdateConsensusNotes) {
                          onUpdateConsensusNotes(userData.user.id, e.target.value);
                        }
                      }}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                      rows={4}
                      placeholder="Registre aqui as principais discussões, decisões e planos acordados durante a reunião de consenso..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Documente os principais pontos discutidos na reunião de consenso, incluindo justificativas para as notas e próximos passos.
                      </p>
                    </div>
                  </div>
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
                <CheckCircle className="w-5 h-5 text-primary-500" />
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
                  {/* PDI Curto Prazo */}
                  <PdiSection
                    title="📅 Curto Prazo (6 meses)"
                    prazo="curtosPrazos"
                    items={userData.pdi.curtosPrazos}
                    userId={userData.user.id}
                    onAddItem={onAddPdiItem}
                    onRemoveItem={onRemovePdiItem}
                    onUpdateItem={onUpdatePdiItem}
                  />

                  {/* PDI Médio Prazo */}
                  <PdiSection
                    title="📈 Médio Prazo (1 ano)"
                    prazo="mediosPrazos"
                    items={userData.pdi.mediosPrazos}
                    userId={userData.user.id}
                    onAddItem={onAddPdiItem}
                    onRemoveItem={onRemovePdiItem}
                    onUpdateItem={onUpdatePdiItem}
                  />

                  {/* PDI Longo Prazo */}
                  <PdiSection
                    title="🚀 Longo Prazo (2+ anos)"
                    prazo="longosPrazos"
                    items={userData.pdi.longosPrazos}
                    userId={userData.user.id}
                    onAddItem={onAddPdiItem}
                    onRemoveItem={onRemovePdiItem}
                    onUpdateItem={onUpdatePdiItem}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botão de Salvar no Final */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-end space-x-4">
          {userData.lastSaved && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Última atualização: {userData.lastSaved.toLocaleString()}
            </span>
          )}
          <button
            onClick={() => onSaveIndividual(userData.user.id)}
            disabled={userData.isSaving || !selectedCycle}
            className={`flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all min-w-[140px] justify-center ${
              userData.isSaving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : !selectedCycle
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {userData.isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Avaliação
              </>
            )}
          </button>
        </div>
        
        {userData.saveError && (
          <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-800">
            <p className="text-sm text-secondary-700 dark:text-secondary-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {userData.saveError}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente para cada seção do PDI
interface PdiSectionProps {
  title: string;
  prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos';
  items: PdiItem[];
  userId: string;
  onAddItem?: (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => void;
  onRemoveItem?: (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', itemId: string) => void;
  onUpdateItem?: (userId: string, prazo: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos', itemId: string, field: keyof PdiItem, value: string) => void;
}

const PdiSection: React.FC<PdiSectionProps> = ({ 
  title, 
  prazo, 
  items, 
  userId, 
  onAddItem, 
  onRemoveItem, 
  onUpdateItem 
}) => {
  const getStatusLabel = (status: string) => {
    switch(status) {
      case '1': return 'Não iniciado';
      case '2': return 'Em andamento';
      case '3': return 'Pausado';
      case '4': return 'Cancelado';
      case '5': return 'Concluído';
      default: return 'Não iniciado';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case '1': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case '2': return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300';
      case '3': return 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-300';
      case '4': return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300';
      case '5': return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
          {title}
        </h5>
        <button
          onClick={() => onAddItem?.(userId, prazo)}
          className="flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum item de desenvolvimento adicionado
          </p>
          <button
            onClick={() => onAddItem?.(userId, prazo)}
            className="mt-3 text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            Adicionar primeiro item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <h6 className="font-medium text-gray-800 dark:text-gray-200">
                  Item {index + 1}
                </h6>
                <button
                  onClick={() => onRemoveItem?.(userId, prazo, item.id)}
                  className="text-secondary-500 hover:text-secondary-700 p-1"
                  title="Remover item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Competência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Competência a Desenvolver
                  </label>
                  <input
                    type="text"
                    value={item.competencia}
                    onChange={(e) => onUpdateItem?.(userId, prazo, item.id, 'competencia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="Ex: Liderança, Comunicação, Gestão de Projetos..."
                  />
                </div>

                {/* Calendarização */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Calendarização
                  </label>
                  <input
                    type="month"
                    value={item.calendarizacao}
                    onChange={(e) => onUpdateItem?.(userId, prazo, item.id, 'calendarizacao', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                {/* Como Desenvolver */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Como Desenvolver
                  </label>
                  <textarea
                    value={item.comoDesenvolver}
                    onChange={(e) => onUpdateItem?.(userId, prazo, item.id, 'comoDesenvolver', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    rows={2}
                    placeholder="Ex: Curso online, mentoria, prática em projetos..."
                  />
                </div>

                {/* Resultados Esperados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resultados Esperados
                  </label>
                  <textarea
                    value={item.resultadosEsperados}
                    onChange={(e) => onUpdateItem?.(userId, prazo, item.id, 'resultadosEsperados', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    rows={2}
                    placeholder="Ex: Melhor gestão de equipe, aumento de produtividade..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) => onUpdateItem?.(userId, prazo, item.id, 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="1">Não iniciado</option>
                    <option value="2">Em andamento</option>
                    <option value="3">Pausado</option>
                    <option value="4">Cancelado</option>
                    <option value="5">Concluído</option>
                  </select>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={item.observacoes}
                    onChange={(e) => onUpdateItem?.(userId, prazo, item.id, 'observacoes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    rows={2}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserEvaluationCard;