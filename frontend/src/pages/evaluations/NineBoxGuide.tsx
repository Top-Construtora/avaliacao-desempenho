import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BookOpen,
  Info,
  Briefcase,
  UserCheck,
  GraduationCap,
  DollarSign,
  Target,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  TrendingDown,
  Activity,
  Award,
  Star,
  Rocket
} from 'lucide-react';

const NineBoxGuide = () => {
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  // Box definitions com posições corretas
  const boxes = [
    // Linha Superior (Alto Potencial)
    {
      id: '3',
      position: { row: 0, col: 0 },
      title: 'Enigma',
      subtitle: 'Iniciante ou com problema de gestão',
      performance: 'baixo',
      potential: 'alto',
      icon: HelpCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      gradient: 'from-yellow-400 to-amber-500 dark:from-yellow-600 dark:to-amber-700',
      details: {
        descricao: 'Excede expectativas quanto ao potencial. Pode estar na função errada ou ser iniciante.',
        atribuicoes: 'Manter na atribuição atual enquanto trabalha para melhorar o desempenho',
        mentoria: 'Designar mentor do Box 8 para aumentar desempenho rapidamente',
        desenvolvimento: 'Avaliar habilidades funcionais/técnicas. Plano detalhado para construir novas habilidades',
        recompensa: 'Baixo ou nenhum aumento no salário base. Incentivo simbólico se houver evolução',
        engajamento: 'Promover tarefas funcionais importantes. Participação em projetos especiais'
      }
    },
    {
      id: '6',
      position: { row: 0, col: 1 },
      title: 'Crescimento',
      subtitle: 'Progressão para alto desempenho',
      performance: 'médio',
      potential: 'alto',
      icon: TrendingUp,
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-300 dark:border-primary-700',
      textColor: 'text-primary-700 dark:text-primary-300',
      gradient: 'from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800',
      details: {
        descricao: 'Atende e muitas vezes excede expectativas. Potencial para mudanças na carreira.',
        atribuicoes: 'Trabalhos desafiadores e variados a cada 12-24 meses com aumento de responsabilidades',
        mentoria: 'Mentor sênior da alta gerência, preferencialmente dos Boxes 8 ou 9',
        desenvolvimento: 'Coaching externo para desenvolver liderança e habilidades técnicas',
        recompensa: 'Crescimento agressivo no salário-base. Pagar acima do mercado, bonificações de retenção',
        engajamento: 'Liderar forças-tarefas interfuncionais. Convites especiais para eventos externos'
      }
    },
    {
      id: '9',
      position: { row: 0, col: 2 },
      title: 'Futuro Líder',
      subtitle: 'Potencial além da função atual',
      performance: 'alto',
      potential: 'alto',
      icon: Rocket,
      bgColor: 'bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900/20 dark:to-primary-900/20',
      borderColor: 'border-secondary-300 dark:border-secondary-700',
      textColor: 'text-secondary-700 dark:text-secondary-300',
      gradient: 'from-secondary-400 to-primary-600 dark:from-secondary-600 dark:to-primary-800',
      details: {
        descricao: 'O melhor que existe. Atua bem em quase tudo. Aprende rápido e é engenhoso.',
        atribuicoes: 'Trabalhos desafiadores a cada 12-24 meses. Atribuições com alto risco e pensamento estratégico',
        mentoria: 'Mentor de nível superior dos boxes 6, 8 ou 9. Mentores de outras divisões',
        desenvolvimento: 'Coaching de alto grau com avaliação contínua e desenvolvimento de competências críticas',
        recompensa: 'Agressivo na base e incentivos. Pagar acima do mercado. Bonificação de ações',
        engajamento: 'Liderar forças-tarefas globais-chave. Reuniões externas. Monitoramento sério do RH'
      }
    },
    // Linha do Meio (Médio Potencial)
    {
      id: '2',
      position: { row: 1, col: 0 },
      title: 'Questionável',
      subtitle: 'Potencial para melhorar',
      performance: 'baixo',
      potential: 'médio',
      icon: AlertTriangle,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-700 dark:text-orange-300',
      gradient: 'from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800',
      details: {
        descricao: 'Pode ser novo ou não apresentar competência para função. Tem potencial não demonstrado.',
        atribuicoes: 'Encontrar a causa do problema. Desenvolver plano detalhado de habilidades',
        mentoria: 'Mentor do mesmo nível, preferencialmente do Box 5',
        desenvolvimento: 'Mentoria do gestor direto. Avaliações periódicas a cada 18-24 meses',
        recompensa: 'Baixo ou nenhum aumento no salário. Ainda não há o que recompensar',
        engajamento: 'Estabelecer metas focadas em poucas áreas importantes com resultados sólidos'
      }
    },
    {
      id: '5',
      position: { row: 1, col: 1 },
      title: 'Mantenedor',
      subtitle: 'Boa performance, espaço para crescer',
      performance: 'médio',
      potential: 'médio',
      icon: Activity,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-300 dark:border-blue-700',
      textColor: 'text-blue-700 dark:text-blue-300',
      gradient: 'from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800',
      details: {
        descricao: 'Atende consistentemente e ocasionalmente excede expectativas. Promovível um nível.',
        atribuicoes: 'Projetos com metas importantes e prazo apertado. Gerenciar grupo temporário',
        mentoria: 'Mentor do Box 8 (desenvolvimento vertical) ou Box 6 (desenvolvimento horizontal)',
        desenvolvimento: 'Mentoria do gestor direto. Participação em conferências e treinamentos',
        recompensa: 'Aumento moderado no salário. Pagar dentro da faixa de mercado',
        engajamento: 'Atividades relevantes, grupos de estudos e rede de contatos'
      }
    },
    {
      id: '8',
      position: { row: 1, col: 2 },
      title: 'Alto Impacto',
      subtitle: 'Contribuição de valor',
      performance: 'alto',
      potential: 'médio',
      icon: Award,
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-300 dark:border-teal-700',
      textColor: 'text-teal-700 dark:text-teal-300',
      gradient: 'from-teal-400 to-teal-600 dark:from-teal-600 dark:to-teal-800',
      details: {
        descricao: 'Produz resultados excepcionais. Pode ser promovido em múltiplas áreas.',
        atribuicoes: 'Gerenciar equipes interfuncionais. Atuar como consultor interno',
        mentoria: 'Mentor dos boxes 8 ou 9 em outra área. Pode mentorar outros dos boxes 5 ou 7',
        desenvolvimento: 'Coaching interno ou externo para competências de liderança',
        recompensa: 'Pagar na parte alta da faixa. Pagamentos agressivos em incentivos',
        engajamento: 'Liderar forças-tarefas importantes. Monitoramento constante do RH'
      }
    },
    // Linha Inferior (Baixo Potencial)
    {
      id: '1',
      position: { row: 2, col: 0 },
      title: 'Insuficiente',
      subtitle: 'Risco com desempenho',
      performance: 'baixo',
      potential: 'baixo',
      icon: TrendingDown,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      textColor: 'text-red-700 dark:text-red-300',
      gradient: 'from-red-400 to-red-600 dark:from-red-600 dark:to-red-800',
      details: {
        descricao: 'Não está alcançando resultados esperados. Menor valor em termos de ROI.',
        atribuicoes: 'Determinar o problema. Passar para atribuição apropriada ou encaminhar demissão',
        mentoria: 'Mentor com cargo superior se valer a pena. Monitorar de perto',
        desenvolvimento: 'Plano específico de melhoria do gestor direto. Máximo 30 dias para ação',
        recompensa: 'Congelar salário base. Evitar pagar incentivos',
        engajamento: 'Plano formal de melhoria. Avaliar valor para organização'
      }
    },
    {
      id: '4',
      position: { row: 2, col: 1 },
      title: 'Eficaz',
      subtitle: 'Especialista de alto valor',
      performance: 'médio',
      potential: 'baixo',
      icon: ShieldCheck,
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      gradient: 'from-indigo-400 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800',
      details: {
        descricao: 'Competente mas não promovível. Atingiu máximo potencial na carreira.',
        atribuicoes: 'Atividades de resolução de problemas. Revisão de produtos ou serviços',
        mentoria: 'Mentor do mesmo nível, preferencialmente do Box 7',
        desenvolvimento: 'Desenvolver especialização. Avaliações periódicas a cada 18-24 meses',
        recompensa: 'Pagar salário-base. Incentivo somente por desempenho',
        engajamento: 'Atividades onde conhecimentos sejam valorizados. Exposição a alto desempenho'
      }
    },
    {
      id: '7',
      position: { row: 2, col: 2 },
      title: 'Comprometimento',
      subtitle: 'Especialista difícil de substituir',
      performance: 'alto',
      potential: 'baixo',
      icon: Star,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-300 dark:border-purple-700',
      textColor: 'text-purple-700 dark:text-purple-300',
      gradient: 'from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800',
      details: {
        descricao: 'Produz trabalhos excepcionais. Altamente valioso para organização.',
        atribuicoes: 'Projetos com mudanças mensuráveis. Alavancar habilidades técnicas',
        mentoria: 'Mentor de outra empresa não concorrente. Atuar como mentor para outros',
        desenvolvimento: 'Coach interno sênior. Avaliações periódicas de liderança',
        recompensa: 'Salário na parte alta da faixa. Considerar bonificações de retenção',
        engajamento: 'Liderar força-tarefa funcional. Atuar como mentor e tutor'
      }
    }
  ];

  // Get box by position
  const getBoxByPosition = (row: number, col: number) => {
    return boxes.find(box => box.position.row === row && box.position.col === col);
  };

  // Matrix Component
  const MatrixView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <div className="relative">
          {/* Potencial Label - Vertical Left */}
          <div className="absolute -left-0 top-1/2 -translate-y-1/2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 -rotate-90 block whitespace-nowrap">Potencial →</span>
          </div>
          
          {/* Matrix Grid Container */}
          <div className="max-w-md mx-auto px-8">
            {/* Header - Performance labels */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Baixo</span>
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Médio</span>
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Alto</span>
              </div>
            </div>

            {/* Matrix boxes with side labels */}
            <div className="relative">
              {/* Right side labels - positioned absolutely */}
              <div className="absolute -right-16 top-0 h-full">
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-start">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Alto</span>
                  </div>
                  <div className="flex-1 flex items-center justify-start">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Médio</span>
                  </div>
                  <div className="flex-1 flex items-center justify-start">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Baixo</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Row 1 - Alto Potencial */}
                {[0, 1, 2].map(col => {
                  const box = getBoxByPosition(0, col);
                  if (!box) return <div key={`0-${col}`} />;
                  
                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBox(box.id)}
                      className={`
                        ${box.bgColor} ${box.borderColor} border-2 p-3 sm:p-4 cursor-pointer
                        hover:shadow-md dark:hover:shadow-lg aspect-square
                        ${selectedBox === box.id ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800 ring-primary-500 dark:ring-primary-400 shadow-lg dark:shadow-xl' : ''}
                        rounded-lg
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full space-y-1">
                        <box.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${box.textColor}`} />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{box.id}</span>
                        <span className={`text-xs font-medium ${box.textColor} text-center leading-tight`}>
                          {box.title}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Row 2 - Médio Potencial */}
                {[0, 1, 2].map(col => {
                  const box = getBoxByPosition(1, col);
                  if (!box) return <div key={`1-${col}`} />;
                  
                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBox(box.id)}
                      className={`
                        ${box.bgColor} ${box.borderColor} border-2 p-3 sm:p-4 cursor-pointer
                        hover:shadow-md dark:hover:shadow-lg aspect-square
                        ${selectedBox === box.id ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800 ring-primary-500 dark:ring-primary-400 shadow-lg dark:shadow-xl' : ''}
                        rounded-lg
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full space-y-1">
                        <box.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${box.textColor}`} />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{box.id}</span>
                        <span className={`text-xs font-medium ${box.textColor} text-center leading-tight`}>
                          {box.title}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Row 3 - Baixo Potencial */}
                {[0, 1, 2].map(col => {
                  const box = getBoxByPosition(2, col);
                  if (!box) return <div key={`2-${col}`} />;
                  
                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBox(box.id)}
                      className={`
                        ${box.bgColor} ${box.borderColor} border-2 p-3 sm:p-4 cursor-pointer
                        hover:shadow-md dark:hover:shadow-lg aspect-square
                        ${selectedBox === box.id ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800 ring-primary-500 dark:ring-primary-400 shadow-lg dark:shadow-xl' : ''}
                        rounded-lg
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full space-y-1">
                        <box.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${box.textColor}`} />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{box.id}</span>
                        <span className={`text-xs font-medium ${box.textColor} text-center leading-tight`}>
                          {box.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer - Desempenho label */}
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Desempenho →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 h-fit">
        {selectedBox ? (
          <>
            {(() => {
              const box = boxes.find(b => b.id === selectedBox);
              if (!box) return null;
              
              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${box.gradient} rounded-xl p-4 text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg backdrop-blur-sm">
                        <box.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold">Box {box.id}</h3>
                        <p className="text-white/90 font-medium">{box.title}</p>
                        <p className="text-white/75 text-sm">{box.subtitle}</p>
                      </div>
                    </div>
                  </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${box.bgColor} ${box.borderColor} border rounded-lg p-3`}>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Desempenho</p>
                        <p className={`font-semibold capitalize ${box.textColor}`}>{box.performance}</p>
                      </div>
                      <div className={`${box.bgColor} ${box.borderColor} border rounded-lg p-3`}>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Potencial</p>
                        <p className={`font-semibold capitalize ${box.textColor}`}>{box.potential}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Descrição</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{box.details.descricao}</p>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Atribuições</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{box.details.atribuicoes}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <UserCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mentoria</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{box.details.mentoria}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Desenvolvimento</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{box.details.desenvolvimento}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recompensa</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{box.details.recompensa}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Target className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Engajamento</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{box.details.engajamento}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <Info className="w-12 h-12 mb-3" />
            <p className="text-center font-medium">Selecione um box na matriz</p>
            <p className="text-center text-sm mt-1">Clique em qualquer posição para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
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
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-500 dark:text-accent-400 mr-2 sm:mr-3" />
                <span className="break-words">Guia Nine-Box</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                Compreenda o funcionamento da Matriz de avaliação de potencial e desempenho
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Matrix View */}
      <MatrixView />

      {/* Legend */}
      <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Legenda de Interpretação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Alto Potencial</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-400 dark:bg-red-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Baixo Desempenho: Investir no desenvolvimento</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Médio Desempenho: Focar no curto prazo</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Alto Desempenho: Preparar para função maior</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Médio Potencial</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-400 dark:bg-red-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Baixo Desempenho: Avaliar adequação</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Médio Desempenho: Investir para manter</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Alto Desempenho: Considerar promoção</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Baixo Potencial</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-400 dark:bg-red-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Baixo Desempenho: Avaliar movimentação</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Médio Desempenho: Movimentação horizontal</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Alto Desempenho: Manter e revisar remuneração</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default NineBoxGuide;