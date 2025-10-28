import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, BarChart3, Award } from 'lucide-react';

interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

interface SectionProps {
  id: string;
  title: string;
  weight: number;
  expanded: boolean;
  icon: React.ElementType;
  gradient: string;
  darkGradient: string;
  bgColor: string;
  darkBgColor: string;
  borderColor: string;
  darkBorderColor: string;
  items: CompetencyItem[];
}

interface EvaluationSectionProps {
  section: SectionProps;
  setSections: React.Dispatch<React.SetStateAction<SectionProps[]>>;
  sectionIndex: number;
  calculateScores: () => { technical: number; behavioral: number; organizational: number; final: number; }; // Adjusted return type
  isSaving: boolean;
}

const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  section,
  setSections,
  sectionIndex,
  calculateScores,
  isSaving,
}) => {
  const IconComponent = section.icon;
  const sectionProgress = (section.items.filter(item => item.score !== undefined).length / section.items.length) * 100;
  const scores = calculateScores(); // Get current scores

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));
  };

  const handleScoreChange = (sectionId: string, itemId: string, score: number) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? {
            ...s,
            items: s.items.map(item =>
              item.id === itemId ? { ...item, score } : item
            )
          }
        : s
    ));
  };

  const ratingLabels = {
    1: { label: 'Insatisfatório', color: 'bg-red-500', darkColor: 'dark:bg-red-600' },
    2: { label: 'Em Desenvolvimento', color: 'bg-accent-500', darkColor: 'dark:bg-accent-600' },
    3: { label: 'Satisfatório', color: 'bg-primary-500', darkColor: 'dark:bg-primary-600' },
    4: { label: 'Excepcional', color: 'bg-green-500', darkColor: 'dark:bg-green-600' }
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

  return (
    <>
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: sectionIndex * 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <button
          onClick={() => toggleSection(section.id)}
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${section.bgColor} ${section.darkBgColor} border-b ${section.borderColor} ${section.darkBorderColor} flex items-center justify-between hover:opacity-90 transition-all duration-200`}
        >
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${section.gradient} ${section.darkGradient} shadow-md dark:shadow-lg flex-shrink-0`}>
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex flex-col sm:flex-row sm:items-center">
                <span className="truncate">{section.title}</span>
                <span className={`mt-1 sm:mt-0 sm:ml-3 text-xs font-medium px-2 py-1 rounded-full ${section.bgColor} ${section.darkBgColor} text-gray-700 dark:text-gray-200 flex-shrink-0`}>
                  Peso {section.weight}%
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {section.items.filter(item => item.score !== undefined).length} de {section.items.length} competências avaliadas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            <div className="w-16 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${section.gradient} ${section.darkGradient} transition-all duration-300`}
                style={{ width: `${sectionProgress}%` }}
              />
            </div>
            {section.expanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {section.expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
            >
              {section.items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: itemIndex * 0.05 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 sm:mr-4">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                    {item.score && (
                      <div className="text-center sm:text-right flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${ratingLabels[item.score as keyof typeof ratingLabels].color} ${ratingLabels[item.score as keyof typeof ratingLabels].darkColor} text-white`}>
                          {ratingLabels[item.score as keyof typeof ratingLabels].label}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[1, 2, 3, 4].map((rating) => {
                      const ratingInfo = ratingLabels[rating as keyof typeof ratingLabels];
                      return (
                        <button
                          key={rating}
                          onClick={() => handleScoreChange(section.id, item.id, rating)}
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
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {section.id === 'organizational' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-primary-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary-600 dark:text-primary-400" />
            Resumo das Notas - Competências
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-primary-200 dark:border-primary-700">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Técnicas</h4>
              <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{scores.technical.toFixed(1)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 50%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(scores.technical / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-secondary-200 dark:border-secondary-700">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Comportamentais</h4>
              <p className="text-2xl sm:text-3xl font-bold text-secondary-600 dark:text-secondary-400">{scores.behavioral.toFixed(1)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 30%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(scores.behavioral / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-accent-200 dark:border-accent-700">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Organizacionais</h4>
              <p className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">{scores.organizational.toFixed(1)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peso 20%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(scores.organizational / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-secondary-600 dark:from-primary-600 dark:to-secondary-700 p-4 sm:p-6 rounded-xl text-white">
              <h4 className="text-sm font-medium text-primary-100 dark:text-primary-200 mb-1">Nota Final</h4>
              <p className="text-2xl sm:text-3xl font-bold">
                {scores.final.toFixed(3).replace(/\.?0+$/, '').replace(/(\.\d)$/, '$10')}
              </p>
              <p className="text-xs text-primary-100 dark:text-primary-200 mt-1">Média Ponderada</p>
              <div className="flex items-center mt-3">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm font-medium">
                  {scores.final >= 3.5 ? 'Excelente' : scores.final >= 2.5 ? 'Bom' : scores.final >= 1.5 ? 'Regular' : 'Necessita Melhoria'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default EvaluationSection;