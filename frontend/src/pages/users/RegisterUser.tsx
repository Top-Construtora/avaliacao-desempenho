import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseUsers, useSupabaseTeams, useSupabaseDepartments } from '../../hooks/useSupabaseData';
import { userService } from '../../services/user.service';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { UserProfileFields } from '../../components/UserProfileFields';
import { 
  Users, Shield, Mail, Calendar, 
  X, Check, AlertCircle, Briefcase, UserCheck, 
  Sparkles, Crown, User, Phone, CalendarDays, Upload,
  Eye, EyeOff, Save, Loader2,
  CheckCircle2, ChevronDown, UserPlus, Building2,
  FileText, UserCog, GitBranch,
  Route, Layers, TrendingUp
} from 'lucide-react';

interface Track {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
}

interface Position {
  id: string;
  position_id: string;
  track_id: string;
  class_id: string;
  base_salary: number;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  position?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
}

const RegisterUser = () => {
  const navigate = useNavigate();
  
  // Hooks do Supabase
  const { users, loading: usersLoading, reload: reloadUsers } = useSupabaseUsers();
  const { teams, loading: teamsLoading } = useSupabaseTeams();
  const { departments, loading: depsLoading } = useSupabaseDepartments();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados adicionais para trilhas e cargos
  const [tracks, setTracks] = useState<Track[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    isLeader: false,
    isDirector: false,
    teamIds: [] as string[],
    profileType: 'regular' as 'regular' | 'leader' | 'director',
    phone: '',
    birthDate: '',
    joinDate: new Date().toISOString().split('T')[0],
    profileImage: null as string | null,
    reportsTo: '',
    departmentId: '',
    trackId: '',
    positionId: '',
    internLevel: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
    contractType: 'CLT' as 'CLT' | 'PJ',
    
    // Novos campos de perfil pessoal
    gender: null as any,
    has_children: false,
    marital_status: null as any,
    hobbies: '',
    favorite_color: '',
    supports_team: false,
    team_name: '',
    practices_sports: false,
    sports: [] as string[]
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Carregar trilhas
  useEffect(() => {
    const loadTracks = async () => {
      setTracksLoading(true);
      try {
        const { data, error } = await supabase
          .from('career_tracks')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setTracks(data || []);
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
        toast.error('Erro ao carregar trilhas');
      } finally {
        setTracksLoading(false);
      }
    };

    loadTracks();
  }, []);

  // Carregar cargos
  useEffect(() => {
    const loadPositions = async () => {
      setPositionsLoading(true);
      try {
        const { data: trackPositions, error: trackError } = await supabase
          .from('track_positions')
          .select('*')
          .order('order_index');
        
        if (trackError) throw trackError;

        if (trackPositions && trackPositions.length > 0) {
          const positionIds = trackPositions.map(tp => tp.position_id);
          const { data: positionsData, error: positionsError } = await supabase
            .from('job_positions')
            .select('id, name, code, description')
            .in('id', positionIds);

          if (!positionsError && positionsData) {
            const positionsMap = positionsData.reduce((acc, pos) => {
              acc[pos.id] = pos;
              return acc;
            }, {} as Record<string, any>);

            const enrichedPositions = trackPositions.map(tp => ({
              ...tp,
              position: positionsMap[tp.position_id] || null
            }));

            setPositions(enrichedPositions);
          } else {
            setPositions(trackPositions);
          }
        } else {
          setPositions([]);
        }
      } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        toast.error('Erro ao carregar cargos');
      } finally {
        setPositionsLoading(false);
      }
    };

    loadPositions();
  }, []);

  // Filtrar trilhas por departamento
  useEffect(() => {
    if (formData.departmentId) {
      const filtered = tracks.filter(track => track.department_id === formData.departmentId);
      setFilteredTracks(filtered);
      if (!filtered.find(t => t.id === formData.trackId)) {
        setFormData(prev => ({ ...prev, trackId: '', positionId: '', internLevel: 'A' }));
      }
    } else {
      setFilteredTracks([]);
      setFormData(prev => ({ ...prev, trackId: '', positionId: '', internLevel: 'A' }));
    }
  }, [formData.departmentId, tracks]);

  // Filtrar cargos por trilha
  useEffect(() => {
    if (formData.trackId) {
      const filtered = positions.filter(pos => pos.track_id === formData.trackId);
      setFilteredPositions(filtered);
      if (!filtered.find(p => p.id === formData.positionId)) {
        setFormData(prev => ({ ...prev, positionId: '', internLevel: 'A' }));
      }
    } else {
      setFilteredPositions([]);
      setFormData(prev => ({ ...prev, positionId: '', internLevel: 'A' }));
    }
  }, [formData.trackId, positions]);

  // Atualizar position quando positionId mudar
  useEffect(() => {
    if (formData.positionId) {
      const selectedPosition = positions.find(p => p.id === formData.positionId);
      if (selectedPosition) {
        const positionName = selectedPosition.position?.name || selectedPosition.position_id;
        setFormData(prev => ({ 
          ...prev, 
          position: positionName
        }));
      }
    }
  }, [formData.positionId, positions]);

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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a formatação com a máscara
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) errors.email = 'Email é obrigatório';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (!formData.password.trim()) errors.password = 'Senha é obrigatória';
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    if (!formData.departmentId) errors.departmentId = 'Departamento é obrigatório';
    if (!formData.trackId) errors.trackId = 'Trilha é obrigatória';
    if (!formData.positionId) errors.positionId = 'Cargo é obrigatório';
    if (!formData.internLevel) errors.internLevel = 'Internível é obrigatório';
    if (formData.phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(formData.phone)) {
      errors.phone = 'Telefone inválido';
    }
    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      if (age < 16) errors.birthDate = 'Idade mínima: 16 anos';
      if (age > 100) errors.birthDate = 'Data de nascimento inválida';
    }
    
    if (!formData.joinDate) {
      errors.joinDate = 'Data de admissão é obrigatória';
    } else {
      const joinDate = new Date(formData.joinDate);
      const today = new Date();
      
      if (joinDate > today) {
        errors.joinDate = 'Data de admissão não pode ser futura';
      }
      
      if (formData.birthDate) {
        const birthDate = new Date(formData.birthDate);
        const minWorkAge = new Date(birthDate);
        minWorkAge.setFullYear(minWorkAge.getFullYear() + 16);
        
        if (joinDate < minWorkAge) {
          errors.joinDate = 'Data de admissão inválida (colaborador teria menos de 16 anos)';
        }
      }
    }
    
    if (formData.teamIds.length === 0 && formData.profileType !== 'director') {
      errors.teams = 'Selecione pelo menos um time';
    }
    if (formData.profileType === 'regular' && !formData.reportsTo) {
      errors.reportsTo = 'Selecione um líder';
    }
    if (formData.profileType === 'leader' && !formData.reportsTo) {
      errors.reportsTo = 'Selecione um diretor';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Usar a nova API que não cria sessão
      const user = await userService.createUserWithAuth({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        position: formData.position.trim(),
        is_leader: formData.profileType !== 'regular',
        is_director: formData.profileType === 'director',
        phone: formData.phone || null,
        birth_date: formData.birthDate || null,
        join_date: formData.joinDate || null, 
        profile_image: formData.profileImage || null,
        reports_to: formData.reportsTo || null,
        department_id: formData.departmentId || null,
        track_id: formData.trackId || null,
        position_id: formData.positionId || null,
        intern_level: formData.internLevel || 'A',
        contract_type: formData.contractType || 'CLT',
        
        // Novos campos
        gender: formData.gender,
        has_children: formData.has_children,
        marital_status: formData.marital_status,
        hobbies: formData.hobbies || null,
        favorite_color: formData.favorite_color || null,
        supports_team: formData.supports_team,
        team_name: formData.supports_team ? formData.team_name : null,
        practices_sports: formData.practices_sports,
        sports: formData.practices_sports ? formData.sports : []
      });

      // Adicionar usuário aos times, se especificado
      if (formData.teamIds && formData.teamIds.length > 0 && formData.profileType !== 'director') {
        const teamMembers = formData.teamIds.map(teamId => ({
          team_id: teamId,
          user_id: user.id,
        }));

        await supabase
          .from('team_members')
          .insert(teamMembers);
      }

      await reloadUsers();
      toast.success('Usuário criado com sucesso!');
      
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.response?.data?.error || 'Erro ao processar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  if (usersLoading || teamsLoading || depsLoading || tracksLoading || positionsLoading) {
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
              <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-500 dark:text-primary-400 mr-2 sm:mr-3 flex-shrink-0" />
              Cadastrar Usuário
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Adicione novos colaboradores ao sistema
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
        {/* Profile Type Selection */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
            Tipo de Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                value: 'regular',
                label: 'Colaborador',
                description: 'Membro da equipe com acesso padrão',
                icon: UserCheck,
                gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
                selectedBg: 'bg-secondary-50 dark:bg-secondary-900/20',
                selectedBorder: 'border-secondary-500 dark:border-secondary-400',
                selectedText: 'text-secondary-700 dark:text-secondary-300'
              },
              {
                value: 'leader',
                label: 'Líder',
                description: 'Gerencia equipes e avaliações',
                icon: Crown,
                gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
                selectedBg: 'bg-primary-50 dark:bg-primary-900/20',
                selectedBorder: 'border-primary-500 dark:border-primary-400',
                selectedText: 'text-primary-700 dark:text-primary-300'
              },
              {
                value: 'director',
                label: 'Diretor',
                description: 'Acesso completo ao sistema',
                icon: Sparkles,
                gradient: 'from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700',
                selectedBg: 'bg-gray-50 dark:bg-gray-900/20',
                selectedBorder: 'border-gray-500 dark:border-gray-400',
                selectedText: 'text-gray-700 dark:text-gray-300'
              }
            ].map((type) => (
              <label 
                key={type.value}
                className={`relative flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                  formData.profileType === type.value 
                    ? `${type.selectedBg} ${type.selectedBorder} shadow-lg`
                    : 'bg-gray-50/50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="profileType"
                  value={type.value}
                  checked={formData.profileType === type.value}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    profileType: e.target.value as any,
                    isLeader: e.target.value !== 'regular',
                    isDirector: e.target.value === 'director'
                  })}
                  className="sr-only"
                />
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${type.gradient} shadow-md`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  {formData.profileType === type.value && (
                    <div className="bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md">
                      <Check className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                    </div>
                  )}
                </div>
                <h4 className={`font-bold text-base mb-1 ${
                  formData.profileType === type.value ? type.selectedText : 'text-gray-900 dark:text-gray-100'
                }`}>{type.label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Contract Type Selection */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
            Tipo de Contrato
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                value: 'CLT',
                label: 'CLT',
                description: 'Contrato de trabalho com carteira assinada',
                icon: Shield,
                gradient: 'from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700',
                selectedBg: 'bg-primary-50 dark:bg-primary-900/20',
                selectedBorder: 'border-primary-500 dark:border-primary-400',
                selectedText: 'text-primary-700 dark:text-primary-300'
              },
              {
                value: 'PJ',
                label: 'PJ',
                description: 'Pessoa Jurídica - Prestador de serviços',
                icon: Briefcase,
                gradient: 'from-secondary-500 to-secondary-600 dark:from-secondary-600 dark:to-secondary-700',
                selectedBg: 'bg-secondary-50 dark:bg-secondary-900/20',
                selectedBorder: 'border-secondary-500 dark:border-secondary-400',
                selectedText: 'text-secondary-700 dark:text-secondary-300'
              }
            ].map((type) => (
              <label 
                key={type.value}
                className={`relative flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                  formData.contractType === type.value 
                    ? `${type.selectedBg} ${type.selectedBorder} shadow-lg`
                    : 'bg-gray-50/50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="contractType"
                  value={type.value}
                  checked={formData.contractType === type.value}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    contractType: e.target.value as 'CLT' | 'PJ'
                  })}
                  className="sr-only"
                />
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${type.gradient} shadow-md`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  {formData.contractType === type.value && (
                    <div className="bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md">
                      <Check className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                    </div>
                  )}
                </div>
                <h4 className={`font-bold text-base mb-1 ${
                  formData.contractType === type.value ? type.selectedText : 'text-gray-900 dark:text-gray-100'
                }`}>{type.label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Basic Information */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
            Informações Básicas
          </h3>
          
          {/* Profile Image */}
          <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Foto do Perfil
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div 
                  className="h-24 w-24 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group border-2 border-dashed border-gray-300 dark:border-gray-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Upload</span>
                    </div>
                  )}
                </div>
                {formData.profileImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, profileImage: null });
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Clique para fazer upload</p>
                <p className="text-xs mt-1">JPG, PNG ou GIF (máx. 5MB)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  formErrors.name 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                }`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email corporativo *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    formErrors.email 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha temporária *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    formErrors.password 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    formErrors.phone 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              {formErrors.phone && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de nascimento
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="date"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.birthDate 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              {formErrors.birthDate && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.birthDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Admissão *
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="date"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.joinDate 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {formErrors.joinDate && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.joinDate}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Career Information */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
            Informações de Carreira
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.departmentId 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  disabled={depsLoading}
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              {formErrors.departmentId && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.departmentId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trilha *
              </label>
              <div className="relative">
                <Route className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.trackId 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.trackId}
                  onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
                  disabled={!formData.departmentId || tracksLoading}
                >
                  <option value="">
                    {!formData.departmentId ? 'Selecione um departamento primeiro' : 'Selecione uma trilha'}
                  </option>
                  {filteredTracks.map(track => (
                    <option key={track.id} value={track.id}>{track.name}</option>
                  ))}
                </select>
              </div>
              {formErrors.trackId && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.trackId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cargo *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.positionId 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.positionId}
                  onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                  disabled={!formData.trackId || positionsLoading}
                >
                  <option value="">
                    {!formData.trackId ? 'Selecione uma trilha primeiro' : 'Selecione um cargo'}
                  </option>
                  {filteredPositions.map(position => {
                    const positionName = position.position?.name || position.position_id;
                    return (
                      <option key={position.id} value={position.id}>
                        {positionName}
                      </option>
                    );
                  })}
                </select>
              </div>
              {formErrors.positionId && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.positionId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Internível *
              </label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.internLevel 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.internLevel}
                  onChange={(e) => setFormData({ ...formData, internLevel: e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' })}
                  disabled={!formData.positionId}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
              {formErrors.internLevel && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.internLevel}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selecione o nível de senioridade dentro do cargo
              </p>
            </div>
          </div>
        </motion.div>

        {/* Novos campos de perfil pessoal */}
        <UserProfileFields
          formData={formData}
          onChange={handleProfileFieldChange}
        />

        {/* Team Allocation */}
        {formData.profileType !== 'director' && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
              Alocação em Times *
            </h3>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
              {teams.map(team => (
                <label key={team.id} className={`flex items-center p-4 rounded-xl cursor-pointer transition-all group ${
                  formData.teamIds.includes(team.id)
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-400'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400"
                    checked={formData.teamIds.includes(team.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, teamIds: [...formData.teamIds, team.id] });
                      } else {
                        setFormData({ ...formData, teamIds: formData.teamIds.filter(id => id !== team.id) });
                      }
                    }}
                  />
                  <div className="ml-4 flex-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 block">{team.name}</span>
                    {team.department && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Depto: {team.department.name}
                      </span>
                    )}
                  </div>
                  {formData.teamIds.includes(team.id) && (
                    <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400 ml-2" />
                  )}
                </label>
              ))}
            </div>
            {formErrors.teams && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {formErrors.teams}
              </p>
            )}
          </motion.div>
        )}

        {/* Hierarchy */}
        {(formData.profileType === 'regular' || formData.profileType === 'leader') && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <GitBranch className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
              Hierarquia
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reporta para *
              </label>
              <div className="relative">
                <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  className={`w-full pl-12 pr-10 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.reportsTo 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
                  }`}
                  value={formData.reportsTo}
                  onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                >
                  <option value="">
                    {formData.profileType === 'regular' ? 'Selecione um líder' : 'Selecione um diretor'}
                  </option>
                  {users
                    .filter(u => {
                      if (formData.profileType === 'regular') {
                        return u.is_leader || u.is_director;
                      }
                      return u.is_director;
                    })
                    .map(superior => (
                      <option key={superior.id} value={superior.id}>
                        {superior.name} - {superior.position}
                        {superior.is_director && ' (Diretor)'}
                        {superior.is_leader && !superior.is_director && ' (Líder)'}
                      </option>
                    ))}
                </select>
              </div>
              {formErrors.reportsTo && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.reportsTo}
                </p>
              )}
              {formData.profileType === 'leader' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Líderes devem reportar para um diretor
                </p>
              )}
            </div>
          </motion.div>
        )}
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
            onClick={() => navigate('/users')}
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
            {isLoading ? 'Salvando...' : 'Salvar Usuário'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterUser;