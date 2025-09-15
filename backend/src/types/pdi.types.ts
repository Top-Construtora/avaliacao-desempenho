export interface PDIItem {
    id?: string;
    competencia: string;
    resultadosEsperados: string;
    comoDesenvolver: string;
    calendarizacao: string;
    status: '1' | '2' | '3' | '4' | '5'; // 1: Não iniciado, 2: Em andamento, 3: Pausado, 4: Concluído, 5: Cancelado
    observacoes?: string;
    prazo: 'curto' | 'medio' | 'longo';
  }
  
  export interface PDIData {
    id?: string;
    employeeId: string;
    cycleId?: string;
    leaderEvaluationId?: string;
    items: PDIItem[];
    periodo?: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
  }