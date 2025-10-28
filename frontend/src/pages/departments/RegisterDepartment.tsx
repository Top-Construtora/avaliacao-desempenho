import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseUsers, useSupabaseDepartments } from '../../hooks/useSupabaseData';
import Button from '../../components/Button';
import { 
  Building, Sparkles, AlertCircle, ChevronDown, 
  Save, Loader2, Target
} from 'lucide-react';

const RegisterDepartment = () => {
  const navigate = useNavigate();
  
  // Hooks do Supabase
  const { users, loading: usersLoading } = useSupabaseUsers();
  const { loading: depsLoading, createDepartment, reload: reloadDeps } = useSupabaseDepartments();

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentDescription: '',
    departmentGoals: '',
    departmentResponsibleId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.departmentName.trim()) errors.departmentName = 'Nome do departamento é obrigatório';
    if (!formData.departmentResponsibleId) errors.responsible = 'Selecione um responsável';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await createDepartment({
        name: formData.departmentName.trim(),
        description: formData.departmentDescription.trim() || null,
        responsible_id: formData.departmentResponsibleId,
      });

      await reloadDeps();
      toast.success('Departamento cadastrado com sucesso!');
      
      setFormData({
        departmentName: '',
        departmentDescription: '',
        departmentGoals: '',
        departmentResponsibleId: '',
      });
      
      setTimeout(() => {
        navigate('/departments');
      }, 1500);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao processar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  if (usersLoading || depsLoading) {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Building className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-500 dark:text-accent-400 mr-2 sm:mr-3 flex-shrink-0" />
              Cadastrar Departamento
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Crie novos departamentos para estruturar a organização
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <Building className="h-5 w-5 mr-2 text-accent-500 dark:text-accent-400" />
            Informações do Departamento
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Departamento *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  formErrors.departmentName 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'
                }`}
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                placeholder="Ex: Vendas"
              />
              {formErrors.departmentName && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.departmentName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsável pelo Departamento *
              </label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.responsible
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'
                  }`}
                  value={formData.departmentResponsibleId}
                  onChange={(e) => setFormData({ ...formData, departmentResponsibleId: e.target.value })}
                >
                  <option value="">Selecione um responsável</option>
                  {users
                    .filter(u => (u.is_leader || u.is_director) && !u.is_master)
                    .sort((a, b) => {
                      // Ordena: diretores primeiro, depois líderes, e por nome
                      if (a.is_director && !b.is_director) return -1;
                      if (!a.is_director && b.is_director) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.is_director ? '(Diretor)' : '(Líder)'}
                      </option>
                    ))}
                </select>
              </div>
              {formErrors.responsible && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.responsible}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Selecione um líder ou diretor para ser responsável por este departamento
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição do Departamento
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                rows={4}
                value={formData.departmentDescription}
                onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
                placeholder="Descreva as responsabilidades e objetivos do departamento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Target className="inline h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                Metas e Objetivos
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                rows={4}
                value={formData.departmentGoals}
                onChange={(e) => setFormData({ ...formData, departmentGoals: e.target.value })}
                placeholder="Liste as principais metas do departamento..."
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/departments')}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
            icon={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          >
            {isLoading ? 'Salvando...' : 'Salvar Departamento'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterDepartment;