import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Plus, Minus, FileText, Brain, UserCheck, Target, 
  Save, CheckCircle, AlertCircle 
} from 'lucide-react';
import type { User } from '../../types/user';
import { EVALUATION_COMPETENCIES } from '../../types/evaluation.types';

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
    finalScore: number;
  };
  pdi: {
    shortTermGoals: string;
    mediumTermGoals: string;
    longTermGoals: string;
    developmentActions: string;
    resources: string;
    timeline: string;
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
  onUpdateUserPDI: (userId: string, field: keyof UserEvaluationData['pdi'], value: string) => void;
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
  onUpdateUserPDI,
  onSaveIndividual,
  selectedCycle
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    toolkit: boolean;
    selfCompetencies: boolean;
    leaderEvaluation: boolean;
    pdi: boolean;
  }>({
    toolkit: false,
    selfCompetencies: false,
    leaderEvaluation: false,
    pdi: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSectionCompletion = (section: 'toolkit' | 'selfCompetencies' | 'leaderEvaluation' | 'pdi') => {
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
        return leaderScores.some(score => score !== null);
      case 'pdi':
        return Object.values(userData.pdi).some(value => value.trim() !== '');
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
          value >= 3.5 ? 'bg-green-500 text-white' :
          value >= 2.5 ? 'bg-yellow-500 text-white' :
          'bg-red-500 text-white'
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Salvo {userData.lastSaved.toLocaleTimeString()}
              </span>
            )}
            {userData.saveError && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                Erro ao salvar
              </span>
            )}
            <button
              onClick={() => onSaveIndividual(userData.user.id)}
              disabled={userData.isSaving || !selectedCycle}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                userData.isSaving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : !selectedCycle
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {userData.isSaving ? (
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
        
        {userData.saveError && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              Erro ao salvar: {userData.saveError}
            </p>
          </div>
        )}

        {/* Progress Indicators */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'toolkit' as const, label: 'Toolkit', icon: FileText },
            { key: 'selfCompetencies' as const, label: 'Auto-Avaliação', icon: Brain },
            { key: 'leaderEvaluation' as const, label: 'Líder', icon: UserCheck },
            { key: 'pdi' as const, label: 'PDI', icon: Target }
          ].map(({ key, label, icon: Icon }) => {
            const isComplete = getSectionCompletion(key);
            return (
              <div key={key} className={`p-2 rounded-lg border-2 transition-all ${
                isComplete 
                  ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                  : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <Icon className={`w-4 h-4 ${
                    isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isComplete ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {label}
                  </span>
                  {isComplete && <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />}
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
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                          value={userData.pdi.shortTermGoals}
                          onChange={(e) => onUpdateUserPDI(userData.user.id, 'shortTermGoals', e.target.value)}
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
                          value={userData.pdi.mediumTermGoals}
                          onChange={(e) => onUpdateUserPDI(userData.user.id, 'mediumTermGoals', e.target.value)}
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
                          value={userData.pdi.longTermGoals}
                          onChange={(e) => onUpdateUserPDI(userData.user.id, 'longTermGoals', e.target.value)}
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
                          value={userData.pdi.developmentActions}
                          onChange={(e) => onUpdateUserPDI(userData.user.id, 'developmentActions', e.target.value)}
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
                          value={userData.pdi.resources}
                          onChange={(e) => onUpdateUserPDI(userData.user.id, 'resources', e.target.value)}
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
                          value={userData.pdi.timeline}
                          onChange={(e) => onUpdateUserPDI(userData.user.id, 'timeline', e.target.value)}
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

export default UserEvaluationCard;