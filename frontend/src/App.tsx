import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import UserManagement from './pages/users/UserManagement';
import TeamManagement from './pages/teams/TeamManagement';
import DepartmentManagement from './pages/departments/DepartmentManagement';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/home/Dashboard';
import SelfEvaluation from './pages/evaluations/SelfEvaluation';
import LeaderEvaluation from './pages/evaluations/LeaderEvaluation';
import NineBoxGuide from './pages/evaluations/NineBoxGuide';
import RegisterUser from './pages/users/RegisterUser';
import RegisterTeam from './pages/teams/RegisterTeam';
import RegisterDepartment from './pages/departments/RegisterDepartment';
import UserEdit from './pages/users/EditUser'; 
import EditTeam from './pages/teams/EditTeam'; 
import EditDepartment from './pages/departments/EditDepartment'; 
import Consensus from './pages/evaluations/Consensus';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';
import NineBoxMatrix from './pages/evaluations/NineBox';
import NotificationHistory from './pages/notifications/NotificationHistory';
import EvaluationDashboard from './pages/reports/EvaluationDashboard';
import CycleManagement from './pages/management/CycleManagement';
import SalaryAdminPage from './pages/management/SalaryAdminPage';
import TrackPositionsPage from './pages/carrer/TrackPositionsPage';
import CareerTrackDetail from './pages/carrer/CareerTrackDetail';
import PdiManagement from './pages/pdi/PdiManagement';
import EvaluationManagement from './pages/evaluations/EvaluationManagement';
import BulkEvaluationUpload from './pages/evaluations/BulkEvaluationUpload';

const USE_SUPABASE_AUTH = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

function App() {
  // Configuração do Toaster (comum para ambos os casos)
  const toasterConfig = {
    position: "bottom-right" as const,
    toastOptions: {
      style: {
        background: '#ffffff',
        color: '#363636',
        fontSize: '14px',
        maxWidth: '400px',
        padding: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.5rem',
      },
      success: {
        style: {
          background: '#10b981',
          color: '#ffffff',
        },
        iconTheme: {
          primary: '#ffffff',
          secondary: '#10b981',
        },
      },
      error: {
        style: {
          background: '#ef4444',
          color: '#ffffff',
        },
        iconTheme: {
          primary: '#ffffff',
          secondary: '#ef4444',
        },
      },
    },
  };

  if (USE_SUPABASE_AUTH) {
    // Versão com Supabase Auth
    return (
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <EvaluationProvider>
                <Toaster {...toasterConfig} />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />

                    <Route
                      path="self-evaluation"
                      element={
                        <ProtectedRoute allowedRoles={['collaborator', 'leader']}>
                          <SelfEvaluation />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="leader-evaluation"
                      element={
                        <ProtectedRoute allowedRoles={['leader', 'director']}>
                          <LeaderEvaluation />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="leader-evaluations"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EvaluationDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="consensus"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <Consensus />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="nine-box"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <NineBoxMatrix />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/salary/tracks/:trackId"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <TrackPositionsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="reports"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <Reports />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="settings" element={<Settings />} />
                    <Route path="notifications" element={<NotificationHistory />} />

                    <Route
                      path="users"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="salary"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <SalaryAdminPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Rotas de cadastro separadas */}
                    <Route
                      path="register/user"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <RegisterUser />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="register/team"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <RegisterTeam />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="register/department"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <RegisterDepartment />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/teams"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <TeamManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/departments"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <DepartmentManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Rotas de edição - UserEdit já existe e atende */}
                    <Route
                      path="users/edit/:id"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <UserEdit />
                        </ProtectedRoute>
                      }
                    />
                    {/* Novas rotas de edição para Time e Departamento */}
                    <Route
                      path="teams/edit/:id"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EditTeam />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="departments/edit/:id"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EditDepartment />
                        </ProtectedRoute>
                      }
                    />


                    <Route
                      path="cycle"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <CycleManagement />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="nine-box-guide"
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader']}>
                          <NineBoxGuide />
                        </ProtectedRoute>
                      }
                    />

                    {/* Career Track Detail */}
                    <Route
                      path="career-track/:trackId"
                      element={
                        <ProtectedRoute allowedRoles={['director', 'leader', 'collaborator']}>
                          <CareerTrackDetail />
                        </ProtectedRoute>
                      }
                    />
                    {/* Evaluation Management */}
                    <Route
                      path="evaluation-management"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <EvaluationManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Bulk Evaluation Upload */}
                    <Route
                      path="bulk-evaluation-upload"
                      element={
                        <ProtectedRoute allowedRoles={['director']}>
                          <BulkEvaluationUpload />
                        </ProtectedRoute>
                      }
                    />

                    {/* PDI Management (New Route) */}
                    <Route path="pdi" element={<ProtectedRoute allowedRoles={['director', 'leader']}><PdiManagement /></ProtectedRoute>} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EvaluationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  } else {
    // Versão sem Supabase Auth (mantida como estava, apenas com as novas rotas)
    return (
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <EvaluationProvider>
                <Toaster {...toasterConfig} />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="self-evaluation" element={<SelfEvaluation />} />
                    <Route path="leader-evaluation" element={<LeaderEvaluation />} />
                    <Route path="evaluation-management" element={<EvaluationManagement />} />
                    <Route path="bulk-evaluation-upload" element={<BulkEvaluationUpload />} />
                    <Route path="consensus" element={<Consensus />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/teams" element={<TeamManagement />} />
                    <Route path="/departments" element={<DepartmentManagement />} />
                    <Route path="nine-box" element={<NineBoxMatrix />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="notifications" element={<NotificationHistory />} />
                    <Route path="users" element={<UserManagement />} />

                    {/* Rotas de cadastro separadas */}
                    <Route path="register/user" element={<RegisterUser />} />
                    <Route path="register/team" element={<RegisterTeam />} />
                    <Route path="register/department" element={<RegisterDepartment />} />

                    <Route path="users/edit/:id" element={<UserEdit />} />
                    {/* Novas rotas de edição para Time e Departamento */}
                    <Route path="teams/edit/:id" element={<EditTeam />} />
                    <Route path="departments/edit/:id" element={<EditDepartment />} />

                    <Route path="cycle" element={<CycleManagement />} />
                    <Route path="leader-evaluations" element={<EvaluationDashboard />} />
                    <Route path="nine-box-guide" element={<NineBoxGuide />} />
                    <Route path="salary" element={<SalaryAdminPage />} />
                    <Route path="salary/tracks/:trackId" element={<TrackPositionsPage />} />
                    <Route path="career-track/:trackId" element={<CareerTrackDetail />} />
                    {/* PDI Management (New Route) */}
                    <Route path="pdi-management" element={<PdiManagement />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EvaluationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    );
  }
}

export default App;
