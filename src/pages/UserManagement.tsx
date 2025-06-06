import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useUsers } from '../context/UserContext';
import Button from '../components/Button';
import { 
 Users, Edit, Trash2, Search, Filter, Building, UserPlus,
 Shield, Mail, Calendar, X, AlertCircle, Briefcase,
 UserCheck, UsersIcon, MoreVertical, Star, ChevronRight,
 ArrowUpDown, Sparkles, Hash, Info, ChevronLeft, Zap,
 Crown, Target, Layers, Eye, EyeOff, Copy, Download,
 FolderPlus, UserCog, MapPin, FileText, BarChart,
 User, Phone, CalendarDays, Camera, Upload, Link2,
 GitBranch, Network, UserX, ArrowRight, ArrowLeft, Plus,
 Grid3x3, List, CheckCircle, FileSpreadsheet, FileDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
 interface jsPDF {
   autoTable: (options: any) => jsPDF;
 }
}

type TabType = 'users' | 'teams' | 'departments';
type ViewMode = 'grid' | 'list';
type ExportFormat = 'excel' | 'notion' | 'pdf';

const UserManagement = () => {
 const navigate = useNavigate();
 const { 
   users, teams, departments, updateUser, deleteUser,
   updateTeam, deleteTeam, updateDepartment,
   deleteDepartment, getUserById, getTeamById, getDepartmentById,
   removeHierarchicalRelation, getSubordinates,
   getLeader, calculateAge
 } = useUsers();

 const [activeTab, setActiveTab] = useState<TabType>('users');
 const [searchTerm, setSearchTerm] = useState('');
 const [showFilters, setShowFilters] = useState(false);
 const [selectedDepartment, setSelectedDepartment] = useState('');
 const [selectedTeam, setSelectedTeam] = useState('');
 const [showOnlyLeaders, setShowOnlyLeaders] = useState(false);
 const [viewMode, setViewMode] = useState<ViewMode>('grid');
 const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');
 const [showEditModal, setShowEditModal] = useState(false);
 const [editingItem, setEditingItem] = useState<any>(null);
 const [editType, setEditType] = useState<'user' | 'team' | 'department'>('user');
 const [showExportMenu, setShowExportMenu] = useState(false);

 const handleEdit = (type: 'user' | 'team' | 'department', item: any) => {
   setEditType(type);
   setEditingItem(item);
   setShowEditModal(true);
 };

 const handleDelete = (type: 'user' | 'team' | 'department', id: string) => {
   if (window.confirm('Tem certeza que deseja excluir?')) {
     if (type === 'user') {
       deleteUser(id);
     } else if (type === 'team') {
       deleteTeam(id);
     } else if (type === 'department') {
       deleteDepartment(id);
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
       toast.success('Ações em massa em desenvolvimento');
       break;
   }
 };

 const exportToExcel = () => {
   let data: any[] = [];
   let filename = '';

   if (activeTab === 'users') {
     data = filteredUsers.map(user => ({
       Nome: user.name,
       Email: user.email,
       Cargo: user.position,
       Tipo: user.isDirector ? 'Diretor' : user.isLeader ? 'Líder' : 'Colaborador',
       Departamentos: user.departmentIds.map(id => departments.find(d => d.id === id)?.name).join(', '),
       Times: user.teamIds.map(id => teams.find(t => t.id === id)?.name).join(', '),
       'Data de Entrada': new Date(user.joinDate).toLocaleDateString('pt-BR'),
       Telefone: user.phone || '-',
       Idade: user.age || '-',
       'Reporta para': user.reportsTo ? users.find(u => u.id === user.reportsTo)?.name : '-'
     }));
     filename = 'usuarios.xlsx';
   } else if (activeTab === 'teams') {
     data = filteredTeams.map(team => ({
       Nome: team.name,
       Departamento: departments.find(d => d.id === team.departmentId)?.name || '-',
       Responsável: team.responsibleId ? getUserById(team.responsibleId)?.name : '-',
       'Qtd. Membros': team.memberIds.length,
       Descrição: team.description || '-',
       'Criado em': new Date(team.createdAt).toLocaleDateString('pt-BR')
     }));
     filename = 'times.xlsx';
   } else {
     data = filteredDepartments.map(dept => ({
       Nome: dept.name,
       Descrição: dept.description || '-',
       Responsável: dept.responsibleId ? getUserById(dept.responsibleId)?.name : '-',
       'Qtd. Times': teams.filter(t => t.departmentId === dept.id).length,
       'Qtd. Pessoas': users.filter(u => u.departmentIds.includes(dept.id)).length,
       'Criado em': new Date(dept.createdAt).toLocaleDateString('pt-BR')
     }));
     filename = 'departamentos.xlsx';
   }

   const ws = XLSX.utils.json_to_sheet(data);
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
   XLSX.writeFile(wb, filename);
   toast.success('Dados exportados para Excel!');
 };

 const exportToNotion = () => {
   let markdownContent = '';

   if (activeTab === 'users') {
     markdownContent = `# Lista de Usuários\n\n`;
     markdownContent += `| Nome | Email | Cargo | Tipo | Departamento | Time |\n`;
     markdownContent += `|------|-------|-------|------|--------------|------|\n`;
     
     filteredUsers.forEach(user => {
       const userDepts = user.departmentIds.map(id => departments.find(d => d.id === id)?.name).join(', ');
       const userTeams = user.teamIds.map(id => teams.find(t => t.id === id)?.name).join(', ');
       const type = user.isDirector ? 'Diretor' : user.isLeader ? 'Líder' : 'Colaborador';
       
       markdownContent += `| ${user.name} | ${user.email} | ${user.position} | ${type} | ${userDepts} | ${userTeams} |\n`;
     });
   } else if (activeTab === 'teams') {
     markdownContent = `# Lista de Times\n\n`;
     markdownContent += `| Nome | Departamento | Responsável | Membros | Descrição |\n`;
     markdownContent += `|------|--------------|-------------|---------|------------|\n`;
     
     filteredTeams.forEach(team => {
       const dept = departments.find(d => d.id === team.departmentId)?.name || '-';
       const responsible = team.responsibleId ? getUserById(team.responsibleId)?.name : '-';
       
       markdownContent += `| ${team.name} | ${dept} | ${responsible} | ${team.memberIds.length} | ${team.description || '-'} |\n`;
     });
   } else {
     markdownContent = `# Lista de Departamentos\n\n`;
     markdownContent += `| Nome | Descrição | Responsável | Times | Pessoas |\n`;
     markdownContent += `|------|-----------|-------------|-------|----------|\n`;
     
     filteredDepartments.forEach(dept => {
       const responsible = dept.responsibleId ? getUserById(dept.responsibleId)?.name : '-';
       const teamCount = teams.filter(t => t.departmentId === dept.id).length;
       const userCount = users.filter(u => u.departmentIds.includes(dept.id)).length;
       
       markdownContent += `| ${dept.name} | ${dept.description || '-'} | ${responsible} | ${teamCount} | ${userCount} |\n`;
     });
   }

   const blob = new Blob([markdownContent], { type: 'text/markdown' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `${activeTab}_notion.md`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
   
   toast.success('Dados exportados em formato Notion!');
 };

 const exportToPDF = () => {
   const doc = new jsPDF();
   let title = '';
   let headers: string[] = [];
   let data: any[][] = [];

   if (activeTab === 'users') {
     title = 'Lista de Usuários';
     headers = ['Nome', 'Email', 'Cargo', 'Tipo', 'Data de Entrada'];
     data = filteredUsers.map(user => [
       user.name,
       user.email,
       user.position,
       user.isDirector ? 'Diretor' : user.isLeader ? 'Líder' : 'Colaborador',
       new Date(user.joinDate).toLocaleDateString('pt-BR')
     ]);
   } else if (activeTab === 'teams') {
     title = 'Lista de Times';
     headers = ['Nome', 'Departamento', 'Responsável', 'Membros'];
     data = filteredTeams.map(team => [
       team.name,
       departments.find(d => d.id === team.departmentId)?.name || '-',
       team.responsibleId ? getUserById(team.responsibleId)?.name || '-' : '-',
       team.memberIds.length.toString()
     ]);
   } else {
     title = 'Lista de Departamentos';
     headers = ['Nome', 'Responsável', 'Times', 'Pessoas'];
     data = filteredDepartments.map(dept => [
       dept.name,
       dept.responsibleId ? getUserById(dept.responsibleId)?.name || '-' : '-',
       teams.filter(t => t.departmentId === dept.id).length.toString(),
       users.filter(u => u.departmentIds.includes(dept.id)).length.toString()
     ]);
   }

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

   doc.save(`${activeTab}.pdf`);
   toast.success('PDF gerado com sucesso!');
 };

 const handleExport = (format: ExportFormat) => {
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

 const filteredUsers = useMemo(() => {
   return users
     .filter(user => {
       const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.position.toLowerCase().includes(searchTerm.toLowerCase());
       
       const matchesDepartment = !selectedDepartment || user.departmentIds.includes(selectedDepartment);
       const matchesTeam = !selectedTeam || user.teamIds.includes(selectedTeam);
       const matchesLeader = !showOnlyLeaders || user.isLeader;

       return matchesSearch && matchesDepartment && matchesTeam && matchesLeader;
     })
     .sort((a, b) => {
       switch (sortBy) {
         case 'name':
           return a.name.localeCompare(b.name);
         case 'date':
           return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
         case 'department':
           const deptA = departments.find(d => a.departmentIds[0] === d.id)?.name || '';
           const deptB = departments.find(d => b.departmentIds[0] === d.id)?.name || '';
           return deptA.localeCompare(deptB);
         default:
           return 0;
       }
     });
 }, [users, searchTerm, selectedDepartment, selectedTeam, showOnlyLeaders, sortBy, departments]);

 const filteredTeams = useMemo(() => {
   return teams.filter(team => {
     const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesDepartment = !selectedDepartment || team.departmentId === selectedDepartment;
     return matchesSearch && matchesDepartment;
   });
 }, [teams, searchTerm, selectedDepartment]);

 const filteredDepartments = useMemo(() => {
   return departments.filter(dept => 
     dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
   );
 }, [departments, searchTerm]);

 const stats = useMemo(() => ({
   totalUsers: users.length,
   totalLeaders: users.filter(u => u.isLeader && !u.isDirector).length,
   totalDirectors: users.filter(u => u.isDirector).length,
   totalCollaborators: users.filter(u => !u.isLeader).length,
   totalTeams: teams.length,
   totalDepartments: departments.length,
 }), [users, teams, departments]);

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

 const renderUserCard = (user: typeof users[0]) => {
   const userTeams = teams.filter(team => user.teamIds.includes(team.id));
   const userDepartments = departments.filter(dept => user.departmentIds.includes(dept.id));
   const subordinates = getSubordinates(user.id);
   const leader = getLeader(user.id);
   
   return (
     <motion.div
       layout
       variants={itemVariants}
       whileHover={{ y: -4, transition: { duration: 0.2 } }}
       className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
     >
       {/* Header com gradiente */}
       <div className={`h-2 bg-gradient-to-r ${
         user.isDirector 
           ? 'from-gray-700 to-gray-800' 
           : user.isLeader 
             ? 'from-primary-500 to-primary-600' 
             : 'from-secondary-500 to-secondary-600'
       }`} />
       
       <div className="p-6">
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center space-x-4">
             <div className="relative">
               {user.profileImage ? (
                 <img 
                   src={user.profileImage} 
                   alt={user.name}
                   className="h-14 w-14 rounded-2xl object-cover shadow-md"
                 />
               ) : (
                 <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-md bg-gradient-to-br ${
                   user.isDirector 
                     ? 'from-gray-700 to-gray-900' 
                     : user.isLeader 
                       ? 'from-primary-500 to-primary-700' 
                       : 'from-secondary-500 to-secondary-700'
                 }`}>
                   {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                 </div>
               )}
               {user.isDirector && (
                 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
                   <Shield className="h-3.5 w-3.5 text-gray-700" />
                 </div>
               )}
               {user.isLeader && !user.isDirector && (
                 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
                   <Crown className="h-3.5 w-3.5 text-primary-500" />
                 </div>
               )}
             </div>
             
             <div className="flex-1 min-w-0">
               <h3 className="font-bold text-gray-900 text-lg truncate">{user.name}</h3>
               <p className="text-sm text-gray-600 truncate">{user.position}</p>
               {(user.isDirector || user.isLeader) && (
                 <div className="mt-2">
                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                     user.isDirector
                       ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                       : 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-800 border border-primary-200'
                   }`}>
                     {user.isDirector ? 'Diretor' : 'Líder'}
                   </span>
                 </div>
               )}
             </div>
           </div>
           
           <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
               onClick={() => handleEdit('user', user)}
               className="p-2 hover:bg-primary-50 rounded-xl transition-all hover:text-primary-600"
               title="Editar"
             >
               <Edit className="h-4 w-4" />
             </button>
             <button
               onClick={() => handleDelete('user', user.id)}
               className="p-2 hover:bg-red-50 rounded-xl transition-all hover:text-red-600"
               title="Excluir"
             >
               <Trash2 className="h-4 w-4" />
             </button>
           </div>
         </div>

         <div className="space-y-3">
           <div className="flex items-center text-gray-600 group/item hover:text-primary-600 transition-colors">
             <Mail className="h-4 w-4 mr-3 text-gray-400 group-hover/item:text-primary-500" />
             <span className="text-sm truncate">{user.email}</span>
           </div>
           
           {user.phone && (
             <div className="flex items-center text-gray-600 group/item hover:text-primary-600 transition-colors">
               <Phone className="h-4 w-4 mr-3 text-gray-400 group-hover/item:text-primary-500" />
               <span className="text-sm">{user.phone}</span>
             </div>
           )}
           
           <div className="flex items-center text-gray-600">
             <Calendar className="h-4 w-4 mr-3 text-gray-400" />
             <span className="text-sm">
               Desde {new Date(user.joinDate).toLocaleDateString('pt-BR', { 
                 month: 'short', 
                 year: 'numeric' 
               })}
             </span>
           </div>
           
           {user.age && (
             <div className="flex items-center text-gray-600">
               <CalendarDays className="h-4 w-4 mr-3 text-gray-400" />
               <span className="text-sm">{user.age} anos</span>
             </div>
           )}
         </div>

         {(leader || subordinates.length > 0) && (
           <div className="pt-4 mt-4 border-t border-gray-100">
             {leader && (
               <div className="flex items-center text-sm text-gray-600 mb-2 group/item hover:text-primary-600 transition-colors">
                 <GitBranch className="h-4 w-4 mr-3 text-gray-400 group-hover/item:text-primary-500" />
                 <span>Reporta para: </span>
                 <span className="font-semibold text-gray-800 ml-1 group-hover/item:text-primary-700">{leader.name}</span>
               </div>
             )}
             {subordinates.length > 0 && (
               <div className="flex items-center text-sm text-gray-600">
                 <Network className="h-4 w-4 mr-3 text-gray-400" />
                 <span className="font-medium">{subordinates.length} subordinado{subordinates.length > 1 ? 's' : ''}</span>
               </div>
             )}
           </div>
         )}

         {userTeams.length > 0 && (
           <div className="pt-4 mt-4 border-t border-gray-100">
             <div className="flex flex-wrap gap-2">
               {userTeams.map(team => (
                 <span
                   key={team.id}
                   className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-secondary-50 to-secondary-100 text-secondary-700 border border-secondary-200"
                 >
                   <UsersIcon className="h-3 w-3 mr-1.5" />
                   {team.name}
                 </span>
               ))}
             </div>
           </div>
         )}
       </div>
     </motion.div>
   );
 };

 const renderTeamCard = (team: typeof teams[0]) => {
   const department = getDepartmentById(team.departmentId);
   const responsible = team.responsibleId ? getUserById(team.responsibleId) : null;
   const members = users.filter(u => team.memberIds.includes(u.id));
   
   return (
     <motion.div
       layout
       variants={itemVariants}
       whileHover={{ y: -4, transition: { duration: 0.2 } }}
       className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
     >
       <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-600" />
       
       <div className="p-6">
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center space-x-4">
             <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md">
               <UsersIcon className="h-6 w-6 text-white" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="font-bold text-gray-900 text-lg truncate">{team.name}</h3>
               {team.description && (
                 <p className="text-sm text-gray-600 mt-1 line-clamp-2">{team.description}</p>
               )}
             </div>
           </div>
           
           <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
               onClick={() => handleEdit('team', team)}
               className="p-2 hover:bg-primary-50 rounded-xl transition-all hover:text-primary-600"
             >
               <Edit className="h-4 w-4" />
             </button>
             <button
               onClick={() => handleDelete('team', team.id)}
               className="p-2 hover:bg-red-50 rounded-xl transition-all hover:text-red-600"
             >
               <Trash2 className="h-4 w-4" />
             </button>
           </div>
         </div>

         <div className="space-y-3">
           {department && (
             <div className="flex items-center text-sm text-gray-600 group/item hover:text-primary-600 transition-colors">
               <Building className="h-4 w-4 mr-3 text-gray-400 group-hover/item:text-primary-500" />
               <span className="font-medium">{department.name}</span>
             </div>
           )}

           {responsible && (
             <div className="flex items-center text-sm text-gray-600 group/item hover:text-primary-600 transition-colors">
               <UserCog className="h-4 w-4 mr-3 text-gray-400 group-hover/item:text-primary-500" />
               <span>Líder: <span className="font-medium">{responsible.name}</span></span>
             </div>
           )}

           <div className="flex items-center text-sm text-gray-600">
             <Users className="h-4 w-4 mr-3 text-gray-400" />
             <span className="font-medium">{members.length} {members.length === 1 ? 'membro' : 'membros'}</span>
           </div>
         </div>

         {members.length > 0 && (
           <div className="pt-4 mt-4 border-t border-gray-100">
             <div className="flex -space-x-2">
               {members.slice(0, 5).map(member => (
                 <div
                   key={member.id}
                   className="relative group/avatar"
                   title={member.name}
                 >
                   {member.profileImage ? (
                     <img
                       src={member.profileImage}
                       alt={member.name}
                       className="h-9 w-9 rounded-full border-2 border-white shadow-sm group-hover/avatar:z-10 transition-all"
                     />
                   ) : (
                     <div className="h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-xs font-bold text-white shadow-sm group-hover/avatar:z-10 transition-all">
                       {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                     </div>
                   )}
                 </div>
               ))}
               {members.length > 5 && (
                 <div className="h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
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

 const renderDepartmentCard = (department: typeof departments[0]) => {
   const deptTeams = teams.filter(t => t.departmentId === department.id);
   const deptUsers = users.filter(u => u.departmentIds.includes(department.id));
   const responsible = department.responsibleId ? getUserById(department.responsibleId) : null;
   
   return (
     <motion.div
       layout
       variants={itemVariants}
       whileHover={{ y: -4, transition: { duration: 0.2 } }}
       className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
     >
       <div className="h-2 bg-gradient-to-r from-accent-500 to-accent-600" />
       
       <div className="p-6">
         <div className="flex items-start justify-between mb-4">
           <div className="flex items-center space-x-4">
             <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-md">
               <Building className="h-6 w-6 text-white" />
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="font-bold text-gray-900 text-lg truncate">{department.name}</h3>
               {department.description && (
                 <p className="text-sm text-gray-600 mt-1 line-clamp-2">{department.description}</p>
               )}
             </div>
           </div>
           
           <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
               onClick={() => handleEdit('department', department)}
               className="p-2 hover:bg-primary-50 rounded-xl transition-all hover:text-primary-600"
             >
               <Edit className="h-4 w-4" />
             </button>
             <button
               onClick={() => handleDelete('department', department.id)}
               className="p-2 hover:bg-red-50 rounded-xl transition-all hover:text-red-600"
             >
               <Trash2 className="h-4 w-4" />
             </button>
           </div>
         </div>

         <div className="space-y-3">
           {responsible && (
             <div className="flex items-center text-sm text-gray-600 group/item hover:text-primary-600 transition-colors">
               <UserCog className="h-4 w-4 mr-3 text-gray-400 group-hover/item:text-primary-500" />
               <span>Responsável: <span className="font-medium">{responsible.name}</span></span>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center text-sm text-gray-600">
               <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
               <span className="font-medium">{deptTeams.length} {deptTeams.length === 1 ? 'time' : 'times'}</span>
             </div>
             <div className="flex items-center text-sm text-gray-600">
               <User className="h-4 w-4 mr-2 text-gray-400" />
               <span className="font-medium">{deptUsers.length} {deptUsers.length === 1 ? 'pessoa' : 'pessoas'}</span>
             </div>
           </div>

           <div className="flex items-center text-sm text-gray-600">
             <Calendar className="h-4 w-4 mr-3 text-gray-400" />
             <span>Criado em {new Date(department.createdAt).toLocaleDateString('pt-BR')}</span>
           </div>
         </div>
       </div>
     </motion.div>
   );
 };

 return (
   <div className="space-y-4 sm:space-y-6">
     {/* Header */}
     <motion.div
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8"
     >
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
         <div className="flex items-center space-x-4">
           <div>
             <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
               <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary-500 mr-2 sm:mr-3 flex-shrink-0" />
               Gerenciar Usuários
             </h1>
             <p className="text-gray-600 mt-1 text-sm sm:text-base">
               Visualize e gerencie usuários, times e departamentos
             </p>
           </div>
         </div>

         <Button
           variant="primary"
           onClick={() => navigate('/users/new')}
           icon={<Plus size={18} />}
           size="lg"
         >
           Novo Cadastro
         </Button>
       </div>

       {/* Stats com gradientes */}
       <motion.div 
         className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
         variants={containerVariants}
         initial="hidden"
         animate="visible"
       >
         <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 text-center shadow-lg">
           <div className="relative z-10">
             <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
             <p className="text-sm text-gray-300 font-medium">Usuários</p>
           </div>
           <Users className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-700 opacity-50" />
         </motion.div>
         
         <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 rounded-xl p-4 text-center shadow-lg">
           <div className="relative z-10">
             <p className="text-2xl font-bold text-white">{stats.totalDirectors}</p>
             <p className="text-sm text-gray-200 font-medium">Diretores</p>
           </div>
           <Shield className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-600 opacity-50" />
         </motion.div>
         
         <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl p-4 text-center shadow-lg">
           <div className="relative z-10">
             <p className="text-2xl font-bold text-white">{stats.totalLeaders}</p>
             <p className="text-sm text-primary-100 font-medium">Líderes</p>
           </div>
           <Crown className="absolute -bottom-2 -right-2 h-16 w-16 text-primary-400 opacity-50" />
         </motion.div>
         
         <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 rounded-xl p-4 text-center shadow-lg">
           <div className="relative z-10">
             <p className="text-2xl font-bold text-white">{stats.totalCollaborators}</p>
             <p className="text-sm text-secondary-100 font-medium">Colaboradores</p>
           </div>
           <UserCheck className="absolute -bottom-2 -right-2 h-16 w-16 text-secondary-400 opacity-50" />
         </motion.div>
         
         <motion.div 
            variants={itemVariants} 
            className="relative overflow-hidden rounded-xl p-4 text-center shadow-lg"
            style={{ background: 'linear-gradient(to bottom right, #247B7B, #1B5B5B)' }}
          >
          <div className="relative z-10">
            <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
            <p className="text-sm text-teal-100 font-medium">Times</p>
          </div>
          <UsersIcon 
            className="absolute -bottom-2 -right-2 h-16 w-16 text-teal-300 opacity-50" 
          />
          </motion.div>

         
         <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 rounded-xl p-4 text-center shadow-lg">
           <div className="relative z-10">
             <p className="text-2xl font-bold text-white">{stats.totalDepartments}</p>
             <p className="text-sm text-accent-100 font-medium">Departamentos</p>
           </div>
           <Building className="absolute -bottom-2 -right-2 h-16 w-16 text-accent-400 opacity-50" />
         </motion.div>
       </motion.div>
     </motion.div>

     {/* Content */}
     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
         {/* Tabs melhoradas */}
         <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl">
           {[
             { id: 'users', label: 'Usuários', icon: Users },
             { id: 'teams', label: 'Times', icon: UsersIcon },
             { id: 'departments', label: 'Departamentos', icon: Building }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as TabType)}
               className={`relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center space-x-2 ${
                 activeTab === tab.id
                   ? 'bg-white text-gray-900 shadow-sm'
                   : 'text-gray-600 hover:text-gray-900'
               }`}
             >
               <tab.icon className="h-4 w-4" />
               <span>{tab.label}</span>
               {activeTab === tab.id && (
                 <motion.div
                   layoutId="activeTab"
                   className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
               )}
             </button>
           ))}
         </div>

         {/* Actions com ícones melhorados */}
         <div className="flex items-center space-x-3">
           <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5">
             <button
               onClick={() => setViewMode('grid')}
               className={`p-2 rounded-lg transition-all ${
                 viewMode === 'grid'
                   ? 'bg-white text-primary-600 shadow-sm'
                   : 'text-gray-400 hover:text-gray-600'
               }`}
               title="Visualização em grade"
             >
               <Grid3x3 className="h-4 w-4" />
             </button>
             <button
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-lg transition-all ${
                 viewMode === 'list'
                   ? 'bg-white text-primary-600 shadow-sm'
                   : 'text-gray-400 hover:text-gray-600'
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
                 ? 'bg-primary-100 text-primary-600' 
                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
             }`}
           >
             <Filter className="h-4 w-4" />
           </button>

           <div className="relative group">
             <button className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
               <MoreVertical className="h-4 w-4" />
             </button>
             <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
               <button
                 onClick={() => handleQuickAction('import')}
                 className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
               >
                 <Upload className="h-4 w-4 text-gray-400" />
                 <span>Importar dados</span>
               </button>
               <button
                 onClick={() => handleQuickAction('export')}
                 className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
               >
                 <Download className="h-4 w-4 text-gray-400" />
                 <span>Exportar lista</span>
               </button>
               <div className="border-t border-gray-100 my-2" />
               <button
                 onClick={() => handleQuickAction('bulk')}
                 className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
               >
                 <Copy className="h-4 w-4 text-gray-400" />
                 <span>Ações em massa</span>
               </button>
             </div>
           </div>
         </div>
       </div>

       {/* Search and Filters */}
       <div className="space-y-4">
         <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
           <input
             type="text"
             placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : activeTab === 'teams' ? 'times' : 'departamentos'}...`}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 bg-gray-50/50 placeholder-gray-500"
           />
         </div>

         <AnimatePresence>
           {showFilters && activeTab === 'users' && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden"
             >
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Departamento
                   </label>
                   <select
                     value={selectedDepartment}
                     onChange={(e) => setSelectedDepartment(e.target.value)}
                     className="w-full rounded-xl border-gray-200 bg-white"
                   >
                     <option value="">Todos</option>
                     {departments.map(dept => (
                       <option key={dept.id} value={dept.id}>{dept.name}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Time
                   </label>
                   <select
                     value={selectedTeam}
                     onChange={(e) => setSelectedTeam(e.target.value)}
                     className="w-full rounded-xl border-gray-200 bg-white"
                   >
                     <option value="">Todos</option>
                     {teams.map(team => (
                       <option key={team.id} value={team.id}>{team.name}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Ordenar por
                   </label>
                   <select
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as any)}
                     className="w-full rounded-xl border-gray-200 bg-white"
                   >
                     <option value="name">Nome</option>
                     <option value="date">Data de entrada</option>
                     <option value="department">Departamento</option>
                   </select>
                 </div>

                 <div className="flex items-end">
                   <label className="flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       checked={showOnlyLeaders}
                       onChange={(e) => setShowOnlyLeaders(e.target.checked)}
                       className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                     />
                     <span className="text-sm font-medium text-gray-700">Apenas líderes</span>
                   </label>
                 </div>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>

       {/* Content Grid */}
       <div className="mt-6">
         <AnimatePresence mode="wait">
           {activeTab === 'users' && (
             <motion.div
               key="users"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit={{ opacity: 0 }}
               className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
             >
               {filteredUsers.map(user => renderUserCard(user))}
             </motion.div>
           )}

           {activeTab === 'teams' && (
             <motion.div
               key="teams"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit={{ opacity: 0 }}
               className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
             >
               {filteredTeams.map(team => renderTeamCard(team))}
             </motion.div>
           )}

           {activeTab === 'departments' && (
             <motion.div
               key="departments"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit={{ opacity: 0 }}
               className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
             >
               {filteredDepartments.map(dept => renderDepartmentCard(dept))}
             </motion.div>
           )}
         </AnimatePresence>
       </div>

       {/* Empty States */}
       {activeTab === 'users' && filteredUsers.length === 0 && (
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center py-12"
         >
           <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
             <UserX className="h-10 w-10 text-gray-400" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
           <p className="text-gray-500 mb-6">Tente ajustar os filtros ou realizar uma nova busca</p>
           <Button
             variant="primary"
             onClick={() => navigate('/users/new')}
             icon={<Plus size={18} />}
           >
             Cadastrar Usuário
           </Button>
         </motion.div>
       )}

       {activeTab === 'teams' && filteredTeams.length === 0 && (
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center py-12"
         >
           <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
             <UsersIcon className="h-10 w-10 text-gray-400" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum time encontrado</h3>
           <p className="text-gray-500 mb-6">Crie o primeiro time da organização</p>
           <Button
             variant="primary"
             onClick={() => navigate('/users/new')}
             icon={<Plus size={18} />}
           >
             Criar Time
           </Button>
         </motion.div>
       )}

       {activeTab === 'departments' && filteredDepartments.length === 0 && (
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center py-12"
         >
           <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
             <Building className="h-10 w-10 text-gray-400" />
           </div>
           <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum departamento encontrado</h3>
           <p className="text-gray-500 mb-6">Crie o primeiro departamento da organização</p>
           <Button
             variant="primary"
             onClick={() => navigate('/users/new')}
             icon={<Plus size={18} />}
           >
             Criar Departamento
           </Button>
         </motion.div>
       )}
     </div>

     {/* Export Menu Modal */}
     <AnimatePresence>
       {showExportMenu && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           onClick={() => setShowExportMenu(false)}
         >
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4"
             onClick={(e) => e.stopPropagation()}
           >
             <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
               <Download className="h-5 w-5 mr-2 text-primary-500" />
               Exportar Dados
             </h2>
             
             <div className="space-y-3">
               <button
                 onClick={() => handleExport('excel')}
                 className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border border-green-200 text-green-700 font-medium text-left flex items-center space-x-3 transition-all"
               >
                 <FileSpreadsheet className="h-5 w-5" />
                 <div className="flex-1">
                   <p className="font-semibold">Excel</p>
                   <p className="text-xs text-green-600">Arquivo .xlsx para análises</p>
                 </div>
               </button>

               <button
                 onClick={() => handleExport('notion')}
                 className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border border-gray-200 text-gray-700 font-medium text-left flex items-center space-x-3 transition-all"
               >
                 <FileText className="h-5 w-5" />
                 <div className="flex-1">
                   <p className="font-semibold">Notion</p>
                   <p className="text-xs text-gray-600">Markdown para importar</p>
                 </div>
               </button>

               <button
                 onClick={() => handleExport('pdf')}
                 className="w-full p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl border border-red-200 text-red-700 font-medium text-left flex items-center space-x-3 transition-all"
               >
                 <FileDown className="h-5 w-5" />
                 <div className="flex-1">
                   <p className="font-semibold">PDF</p>
                   <p className="text-xs text-red-600">Documento para impressão</p>
                 </div>
               </button>
             </div>

             <button
               onClick={() => setShowExportMenu(false)}
               className="w-full mt-4 p-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
             >
               Cancelar
             </button>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
};

export default UserManagement;