import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, FileText, Target, CheckCircle, Clock,
  AlertCircle, TrendingUp, Grid3x3, Calendar, Filter,
  Download, Search, ChevronRight, Info, Award
} from 'lucide-react';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useUserRole } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import type { CycleDashboard } from '../../types/evaluation.types';

const EvaluationDashboard: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { dashboard, currentCycle, loading, loadDashboard } = useEvaluation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (cycleId) {
      loadDashboard(cycleId);
    }
  }, [cycleId, loadDashboard]);

  // Calculate statistics
  const stats = {
    totalEmployees: dashboard.length,
    selfCompleted: dashboard.filter(d => d.self_evaluation_status === 'completed').length,
    leaderCompleted: dashboard.filter(d => d.leader_evaluation_status === 'completed').length,
    consensusCompleted: dashboard.filter(d => d.consensus_status === 'completed').length,
    avgPerformance: dashboard
      .filter(d => d.consensus_score)
      .reduce((sum, d) => sum + (d.consensus_score || 0), 0) / 
      (dashboard.filter(d => d.consensus_score).length || 1),
    avgPotential: dashboard
      .filter(d => d.potential_score)
      .reduce((sum, d) => sum + (d.potential_score || 0), 0) / 
      (dashboard.filter(d => d.potential_score).length || 1)
  };

  // Filter employees
  const filteredEmployees = dashboard.filter(employee => {
    const matchesSearch = employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && !employee.self_evaluation_id;
    if (filterStatus === 'in-progress') return matchesSearch && employee.self_evaluation_id && !employee.consensus_id;
    if (filterStatus === 'completed') return matchesSearch && employee.consensus_status === 'completed';
    
    return matchesSearch;
  });

  const getStatusBadge = (employee: CycleDashboard) => {
    if (employee.consensus_status === 'completed') {
      return { color: 'bg-primary-100 text-primary-700', icon: CheckCircle, text: 'Concluído' };
    }
    if (employee.leader_evaluation_id) {
      return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Aguardando Consenso' };
    }
    if (employee.self_evaluation_id) {
      return { color: 'bg-blue-100 text-blue-700', icon: Clock, text: 'Em Avaliação' };
    }
    return { color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100', icon: AlertCircle, text: 'Pendente' };
  };

  const getNineBoxColor = (position?: number) => {
    if (!position) return 'bg-gray-100';
    const colors = {
      1: 'bg-red-100', 2: 'bg-accent-100', 3: 'bg-yellow-100',
      4: 'bg-indigo-100', 5: 'bg-blue-100', 6: 'bg-primary-100',
      7: 'bg-secondary-100', 8: 'bg-teal-100', 9: 'bg-emerald-100'
    };
    return colors[position as keyof typeof colors] || 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <BarChart3 className="h-7 w-7 text-primary-500 mr-3" />
              Dashboard de Avaliações
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentCycle?.title || 'Ciclo de Avaliação'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/nine-box')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
            >
              <Grid3x3 className="h-5 w-5 mr-2" />
              Ver Matriz 9-Box
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-900 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Total de Colaboradores</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Autoavaliações</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.selfCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-a-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-primary-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.selfCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Avaliações do Líder</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.leaderCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-secondary-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-secondary-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.leaderCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <Target className="h-8 w-8 text-secondary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Consensos Finalizados</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.consensusCompleted}/{stats.totalEmployees}
                </p>
                <div className="w-full bg-accent-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-accent-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.consensusCompleted / stats.totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
              <Award className="h-8 w-8 text-accent-400" />
            </div>
          </motion.div>
        </div>

        {/* Average Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Média de Performance</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.avgPerformance.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Média de Potencial</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.avgPotential.toFixed(2)}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="in-progress">Em Andamento</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        </div>
      </div>

        {/* Employees Table */}
        <div className="bg-white dark:bg-gray-900 dark:border-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Autoavaliação
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Avaliação Líder
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Potencial
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    9-Box
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                </th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee) => {
                const status = getStatusBadge(employee);
                const StatusIcon = status.icon;

                return (
                    <motion.tr
                    key={employee.employee_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.employee_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.position}
                        </div>
                        </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.text}
                        </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        {employee.self_evaluation_id ? (
                        <CheckCircle className="h-5 w-5 text-primary-500 mx-auto" />
                        ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mx-auto" />
                        )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        {employee.leader_evaluation_id ? (
                        <CheckCircle className="h-5 w-5 text-primary-500 mx-auto" />
                        ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mx-auto" />
                        )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.consensus_score?.toFixed(2) || '-'}
                        </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.potential_score?.toFixed(2) || '-'}
                        </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        {employee.ninebox_position && (
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${getNineBoxColor(employee.ninebox_position)}`}>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-100">
                            {employee.ninebox_position}
                            </span>
                        </div>
                        )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                        onClick={() => navigate(`/evaluation-details/${cycleId}/${employee.employee_id}`)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center ml-auto"
                        >
                        Ver detalhes
                        <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                    </td>
                    </motion.tr>
                );
                })}
            </tbody>
            </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum colaborador encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationDashboard;