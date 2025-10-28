import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Users,
  Handshake,
  PieChart,
  Settings,
  LogOut,
  Layers,
  RotateCcw,
  Grid3X3,
  DollarSign,
  UserPlus,
  BookOpen,
  Plus,
  ChevronDown,
  Building,
  Upload,
  User,
} from 'lucide-react';
import { useAuth, useUserRole } from '../context/AuthContext';
import logo from '../../assets/images/logo.png';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

interface NavItem {
  label: string;
  icon: any;
  path?: string;
  allowedRoles?: Array<'director' | 'leader' | 'collaborator'>;
  hideForRoles?: Array<'director' | 'leader' | 'collaborator'>;
  hasDropdown?: boolean;
  subItems?: NavItem[];
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isDirector, isLeader, role } = useUserRole();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Definir itens de navegação com permissões
  const navItems: NavItem[] = [
    {
      label: 'Página Inicial',
      icon: Home,
      path: '/',
    },
    {
      label: 'Cadastrar',
      icon: Plus,
      hasDropdown: true,
      allowedRoles: ['director', 'master'],
      subItems: [
        {
          label: 'Cadastrar Usuário',
          icon: UserPlus,
          path: '/register/user',
        },
        {
          label: 'Cadastrar Time',
          icon: Users,
          path: '/register/team',
        },
        {
          label: 'Cadastrar Departamento',
          icon: Building,
          path: '/register/department',
        },
      ],
    },
    {
      label: 'Gerenciar',
      icon: Layers,
      hasDropdown: true,
      allowedRoles: ['director', 'master'],
      subItems: [
        {
          label: 'Gerenciar Usuários',
          icon: User,
          path: '/users',
        },
        {
          label: 'Gerenciar Times',
          icon: Users,
          path: '/teams',
        },
        {
          label: 'Gerenciar Departamentos',
          icon: Building,
          path: '/departments',
        },
      ],
    },
    {
      label: 'Cargos e Salários',
      icon: DollarSign,
      path: '/salary',
      allowedRoles: ['director', 'master']
    },
    {
      label: 'Gerenciar PDI',
      icon: BookOpen,
      path: '/pdi',
      allowedRoles: ['director', 'leader']
    },
    {
      label: 'Gerenciar Ciclos',
      icon: RotateCcw,
      path: '/cycle',
      allowedRoles: ['director', 'master'],
    },
    {
      label: 'Autoavaliação',
      icon: FileText,
      path: '/self-evaluation',
      hideForRoles: ['director'],
    },
    {
      label: 'Avaliação do Líder',
      icon: Users,
      path: '/leader-evaluation',
      allowedRoles: ['leader', 'director', 'master'],
    },
    {
      label: 'Gerenciar Avaliações',
      icon: Settings,
      path: '/evaluation-management',
      allowedRoles: ['master', 'director'],
    },
    {
      label: 'Upload em Lote',
      icon: Upload,
      path: '/bulk-evaluation-upload',
      allowedRoles: ['master'],
    },
    {
      label: 'Consenso',
      icon: Handshake,
      path: '/consensus',
      allowedRoles: ['director', 'master'],
    },
    {
      label: 'Matriz 9 Box',
      icon: Grid3X3,
      path: '/nine-box',
      allowedRoles: ['director', 'master'],
    },
    {
      label: 'Relatórios',
      icon: PieChart,
      path: '/reports',
      allowedRoles: ['director', 'master'],
    },
    {
      label: 'Guia NineBox',
      icon: BookOpen,
      path: '/nine-box-guide',
      allowedRoles: ['director', 'leader'],
    },
  ];

  // Filtrar itens baseado no papel do usuário
  const filteredNavItems = navItems.filter(item => {
    if (item.hideForRoles && item.hideForRoles.includes(role as 'director' | 'leader' | 'collaborator')) {
      return false;
    }
    
    if (item.allowedRoles && !item.allowedRoles.includes(role as 'director' | 'leader' | 'collaborator')) {
      return false;
    }
    
    return true;
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between pl-2 pr-4 border-b border-gray-700/50">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <img 
            src={logo} 
            alt="Logo da empresa" 
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <div key={item.label}>
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                      ${openDropdown === item.label
                        ? 'bg-gray-800/50 text-white' 
                        : 'text-white/70 hover:bg-gray-800/50 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <AnimatePresence>
                    {openDropdown === item.label && item.subItems && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path!}
                              className={({ isActive }) => `
                                flex items-center px-4 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200
                                ${isActive 
                                  ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white border border-teal-500/40 shadow-lg shadow-teal-500/10' 
                                  : 'text-white/60 hover:bg-gray-800/30 hover:text-white/90'
                                }
                              `}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                              <span>{subItem.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <NavLink
                  to={item.path!}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white border border-teal-500/40 shadow-lg shadow-teal-500/10' 
                      : 'text-white/70 hover:bg-gray-800/50 hover:text-white'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Separador e opções inferiores */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-[15px] font-medium rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white border border-teal-500/40 shadow-lg shadow-teal-500/10' 
                : 'text-white/70 hover:bg-gray-800/50 hover:text-white'
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Configurações</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-[15px] font-medium rounded-lg text-white/70 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col bg-dark-navy w-64 fixed h-full z-30">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden flex flex-col bg-dark-navy fixed h-full w-64 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}