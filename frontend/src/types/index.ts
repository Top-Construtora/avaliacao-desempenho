export type Status = 'pending' | 'in-progress' | 'completed';

// Removido export * para evitar conflitos de tipo User

export type { UserRole, Permission, UserPermissions, AccessControl, AuditLog, SecurityValidation } from './auth';
export { ROLE_PERMISSIONS, hasPermission, ROUTE_ACCESS, validateSecurityOperation } from './auth';

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  joinDate: string;
  reportsTo?: string;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'behavioral' | 'deliveries';
  score?: number;
}

export interface Feedback {
  strengths: string;
  improvements: string;
  observations: string;
}

export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  date: string;
  status: Status;
  criteria: Criterion[];
  feedback: Feedback;
  technicalScore: number;
  behavioralScore: number;
  deliveriesScore: number;
  finalScore: number;
  lastUpdated: string;
  isDraft: boolean;
}

export interface EvaluationStats {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface HistoryFilters {
  employee: string;
  startDate: string;
  endDate: string;
  status: Status | 'all';
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  responsibleId?: string; 
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  responsibleId?: string; 
  memberIds: string[];
  description?: string;
  createdAt: string;
}

export interface UserLegacy {
  id: string;
  name: string;
  email: string;
  position: string;
  isLeader: boolean;
  isDirector: boolean; 
  teamIds: string[]; 
  departmentIds: string[]; 
  joinDate: string;
  avatar?: string;
  active: boolean;
  phone?: string;
  birthDate?: string;
  age?: number;
  reportsTo?: string; 
  profileImage?: string; 
}

export interface HierarchicalRelation {
  leaderId: string;
  subordinateId: string;
  createdAt: string;
}