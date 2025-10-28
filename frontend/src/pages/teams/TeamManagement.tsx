import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/Button';
import { 
  Users, Edit, Trash2, Search, Filter, Building,
  MoreVertical, Copy, Download,
  UserCog, FileText, Upload, Plus,
  Grid3x3, List, FileSpreadsheet, FileDown,
  Loader2, Database, UsersIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import type { TeamWithDetails } from '../../types/supabase';
import { usePermissions, useUIPermissions, useOperationValidator } from '../../hooks/usePermissions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PermissionGuard, ActionGuard, UIGuard, OperationWarning } from '../../components/PermissionGuard';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ViewMode = 'grid' | 'list';
type ExportFormat = 'excel' | 'notion' | 'pdf';

const TeamManagement = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const uiPermissions = useUIPermissions();
  const operationValidator = useOperationValidator();
  
  const { teams, departments, loading, actions } = useSupabaseData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'date'>('name');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    type: string;
    data: any;
    callback: () => void;
  } | null>(null);

  const handleEdit = (team: TeamWithDetails) => {
    if (!permissions.canEditTeam(team.id, team.responsible_id ?? undefined)) {
      toast.error('Você não tem permissão para editar este time');
      return;
    }
    navigate(`/teams/edit/${team.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!permissions.hasPermission('teams', 'delete')) {
      toast.error('Você não tem permissão para esta ação');
      return;
    }

    const targetData = teams.find(t => t.id === id);

    if (!operationValidator.canExecute('delete_team', targetData)) {
      const errors = operationValidator.getValidationErrors('delete_team', targetData);
      toast.error(errors[0] || 'Operação não permitida');
      return;
    }

    const warnings = operationValidator.getValidationWarnings('delete_team', targetData);
    if (warnings.length > 0) {
      setPendingOperation({
        type: 'delete_team',
        data: targetData,
        callback: async () => {
          try {
            await actions.teams.delete(id);
            toast.success('Time removido com sucesso!');
          } catch (error) {
            toast.error('Erro ao remover time');
          }
        }
      });
      setShowWarning(true);
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este time?')) {
      try {
        await actions.teams.delete(id);
        toast.success('Time removido com sucesso!');
      } catch (error) {
        toast.error('Erro ao remover time');
      }
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'import':
        toast.success('Funcionalidade de importação em desenvolvimento');
        break;
      case 'export':
        setShowExportMenu(true);
        break;
      case 'bulk':
        if (!permissions.hasPermission('teams', 'delete')) {
          toast.error('Você não tem permissão para ações em massa');
          return;
        }
        toast.success('Ações em massa em desenvolvimento');
        break;
    }
  };

  const exportToExcel = () => {
    const data = filteredTeams.map(team => ({
      Nome: team.name,
      Departamento: team.department?.name || '-',
      Responsável: team.responsible?.name || '-',
      'Qtd. Membros': team.members?.length || 0,
      Descrição: team.description || '-',
      'Criado em': new Date(team.created_at).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Times');
    XLSX.writeFile(wb, 'times.xlsx');
    toast.success('Dados exportados para Excel!');
  };

  const exportToNotion = () => {
    let markdownContent = `# Lista de Times\n\n`;
    markdownContent += `| Nome | Departamento | Responsável | Membros | Descrição |\n`;
    markdownContent += `|------|--------------|-------------|---------|------------|\n`;
    
    filteredTeams.forEach(team => {
      const dept = team.department?.name || '-';
      const responsible = team.responsible?.name || '-';
      
      markdownContent += `| ${team.name} | ${dept} | ${responsible} | ${team.members?.length || 0} | ${team.description || '-'} |\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'times_notion.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados em formato Notion!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = 'Lista de Times';
    const headers = ['Nome', 'Departamento', 'Responsável', 'Membros'];
    const data = filteredTeams.map(team => [
      team.name,
      team.department?.name || '-',
      team.responsible?.name || '-',
      (team.members?.length || 0).toString()
    ]);

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [18, 176, 160] }
    });

    doc.save('times.pdf');
    toast.success('PDF gerado com sucesso!');
  };

  const handleExport = (format: ExportFormat) => {
    if (!uiPermissions.showExportButton) {
      toast.error('Você não tem permissão para exportar dados');
      return;
    }
    
    switch (format) {
      case 'excel':
        exportToExcel();
        break;
      case 'notion':
        exportToNotion();
        break;
      case 'pdf':
        exportToPDF();
        break;
    }
    setShowExportMenu(false);
  };

  const filteredTeams = useMemo(() => {
    return teams
      .filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesDepartment = !selectedDepartment || team.department_id === selectedDepartment;
        return matchesSearch && matchesDepartment;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'members':
            return (b.members?.length || 0) - (a.members?.length || 0);
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });
  }, [teams, searchTerm, selectedDepartment, sortBy]);

  const stats = useMemo(() => ({
    totalTeams: teams.length,
    totalMembers: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0),
    avgMembersPerTeam: teams.length > 0 ? Math.round(teams.reduce((acc, team) => acc + (team.members?.length || 0), 0) / teams.length) : 0,
    teamsWithoutResponsible: teams.filter(t => !t.responsible_id).length
  }), [teams]);

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

  const renderTeamCard = (team: TeamWithDetails) => {
    const department = team.department;
    const responsible = team.responsible;
    const members = team.members || [];
    
    return (
      <motion.div
        layout
        variants={itemVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 group"
      >
        <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-600 dark:from-primary-600 dark:to-secondary-700" />
        
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 shadow-md dark:shadow-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{team.description}</p>
              )}
            </div>
            <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
              <ActionGuard can={() => permissions.canEditTeam(team.id, team.responsible_id ?? undefined)}>
                <button
                  onClick={() => handleEdit(team)}
                  className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </ActionGuard>
              
              <ActionGuard can={permissions.canDeleteTeam}>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="p-2 rounded-xl transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </ActionGuard>
            </div>
          </div>

          <div className="space-y-3">
            {department && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Building className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
                <span className="font-medium truncate">{department.name}</span>
              </div>
            )}

            {responsible && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group/item hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <UserCog className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-400" />
                <span>Líder: <span className="font-medium truncate">{responsible.name}</span></span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{members.length} {members.length === 1 ? 'membro' : 'membros'}</span>
            </div>
          </div>

          {members.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="relative group/avatar"
                    title={member.name}
                  >
                    {member.profile_image ? (
                      <img
                        src={member.profile_image}
                        alt={member.name}
                        className="h-9 w-9 rounded-full border-2 border-white dark:border-gray-800 shadow-sm group-hover/avatar:z-10 transition-all"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-xs font-bold text-white shadow-sm group-hover/avatar:z-10 transition-all">
                        {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="h-9 w-9 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard resource="teams" action="read">
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
                  <Database className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 dark:text-secondary-400 mr-2 sm:mr-3 flex-shrink-0" />
                  Gerenciamento de Times
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Visualize e gerencie times da organização
                </p>
              </div>
            </div>

            <UIGuard show="showCreateTeamButton">
              <Button
                variant="primary"
                onClick={() => navigate('/register/team')}
                icon={<Plus size={18} />}
                size="lg"
              >
                Novo Time
              </Button>
            </UIGuard>
          </div>

          <motion.div 
            className="grid grid-cols-3 sm:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants} 
              className="relative overflow-hidden rounded-xl p-4 text-center shadow-lg"
              style={{ background: 'linear-gradient(to bottom right, #247B7B, #1B5B5B)' }}
            >
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
                <p className="text-sm text-teal-100 font-medium">Times</p>
              </div>
              <UsersIcon className="absolute -bottom-2 -right-2 h-16 w-16 text-teal-300 opacity-50" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
                <p className="text-sm text-primary-100 font-medium">Membros Total</p>
              </div>
              <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-primary-400 dark:text-primary-500 opacity-50" />
            </motion.div>
        
            
            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-xl p-4 text-center shadow-lg">
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white">{stats.teamsWithoutResponsible}</p>
                <p className="text-sm text-gray-200 font-medium">Sem Líder</p>
              </div>
              <UserCog className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-400 dark:text-gray-500 opacity-50" />
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-1.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm dark:shadow-lg'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title="Visualização em grade"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm dark:shadow-lg'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title="Visualização em lista"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all ${
                  showFilters 
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>

              <div className="relative group">
                <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                  <MoreVertical className="h-4 w-4" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => handleQuickAction('import')}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span>Importar dados</span>
                  </button>
                  <UIGuard show="showExportButton">
                    <button
                      onClick={() => handleQuickAction('export')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    >
                      <Download className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Exportar lista</span>
                    </button>
                  </UIGuard>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
                  <UIGuard show="showBulkActionsButton">
                    <button
                      onClick={() => handleQuickAction('bulk')}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Ações em massa</span>
                    </button>
                  </UIGuard>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar times..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 bg-gray-50/50 dark:bg-gray-700/50 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Departamento
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Todos</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Ordenar por
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="name">Nome</option>
                        <option value="members">Quantidade de membros</option>
                        <option value="date">Data de criação</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="teams"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
              >
                {filteredTeams.map(team => (
                  <div key={team.id}>
                    {renderTeamCard(team)}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {filteredTeams.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-6">
                <UsersIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum time encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Crie o primeiro time da organização</p>
              <UIGuard show="showCreateTeamButton">
                <Button
                  variant="primary"
                  onClick={() => navigate('/register/team')}
                  icon={<Plus size={18} />}
                >
                  Criar Time
                </Button>
              </UIGuard>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showExportMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
              onClick={() => setShowExportMenu(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl dark:shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
                  Exportar Dados
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 rounded-xl border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">Excel</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Arquivo .xlsx para análises</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('notion')}
                    className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600/30 dark:hover:to-gray-500/30 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileText className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">Notion</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Markdown para importar</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 rounded-xl border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 font-medium text-left flex items-center space-x-3 transition-all"
                  >
                    <FileDown className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">PDF</p>
                      <p className="text-xs text-red-600 dark:text-red-400">Documento para impressão</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowExportMenu(false)}
                  className="w-full mt-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showWarning && pendingOperation && (
          <OperationWarning
            operation={pendingOperation.type}
            targetData={pendingOperation.data}
            onConfirm={() => {
              pendingOperation.callback();
              setShowWarning(false);
              setPendingOperation(null);
            }}
            onCancel={() => {
              setShowWarning(false);
              setPendingOperation(null);
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default TeamManagement;