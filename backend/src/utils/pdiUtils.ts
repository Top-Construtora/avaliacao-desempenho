// ====================================
// UTILS PARA PDI (PLANO DE DESENVOLVIMENTO INDIVIDUAL)
// ====================================

export interface PDIItem {
  id: string;
  competencia: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  calendarizacao: string;
  status: '1' | '2' | '3'; // 1=Não iniciado, 2=Em andamento, 3=Concluído
  observacoes?: string;
  prazo: 'curto' | 'medio' | 'longo';
  created_at?: string;
  updated_at?: string;
}

export interface PDIData {
  employee_id: string;
  cycle_id?: string;
  items: PDIItem[];
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by?: string;
}

export class PDIUtils {
  
  // Validar estrutura de um item PDI
  static validatePDIItem(item: any): boolean {
    return !!(
      item.competencia && 
      item.comoDesenvolver && 
      item.resultadosEsperados && 
      item.prazo && 
      ['curto', 'medio', 'longo'].includes(item.prazo) &&
      item.status && 
      ['1', '2', '3'].includes(item.status)
    );
  }

  // Processar dados do PDI vindos do frontend
  static processPDIData(rawPdiData: any): PDIItem[] {
    const allItems: PDIItem[] = [];
    
    // Processar curtos prazos
    if (rawPdiData.curtosPrazos && Array.isArray(rawPdiData.curtosPrazos)) {
      allItems.push(...rawPdiData.curtosPrazos.map((item: any) => ({
        id: item.id || `curto_${Date.now()}_${Math.random()}`,
        competencia: item.competencia || '',
        comoDesenvolver: item.comoDesenvolver || '',
        resultadosEsperados: item.resultadosEsperados || '',
        calendarizacao: item.calendarizacao || '',
        status: item.status || '1',
        observacoes: item.observacoes || '',
        prazo: 'curto' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    // Processar médios prazos
    if (rawPdiData.mediosPrazos && Array.isArray(rawPdiData.mediosPrazos)) {
      allItems.push(...rawPdiData.mediosPrazos.map((item: any) => ({
        id: item.id || `medio_${Date.now()}_${Math.random()}`,
        competencia: item.competencia || '',
        comoDesenvolver: item.comoDesenvolver || '',
        resultadosEsperados: item.resultadosEsperados || '',
        calendarizacao: item.calendarizacao || '',
        status: item.status || '1',
        observacoes: item.observacoes || '',
        prazo: 'medio' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    // Processar longos prazos
    if (rawPdiData.longosPrazos && Array.isArray(rawPdiData.longosPrazos)) {
      allItems.push(...rawPdiData.longosPrazos.map((item: any) => ({
        id: item.id || `longo_${Date.now()}_${Math.random()}`,
        competencia: item.competencia || '',
        comoDesenvolver: item.comoDesenvolver || '',
        resultadosEsperados: item.resultadosEsperados || '',
        calendarizacao: item.calendarizacao || '',
        status: item.status || '1',
        observacoes: item.observacoes || '',
        prazo: 'longo' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    }

    return allItems.filter(item => this.validatePDIItem(item));
  }

  // Organizar items por prazo para o frontend
  static organizePDIItemsByTimeframe(items: PDIItem[]) {
    return {
      curtosPrazos: items.filter(item => item.prazo === 'curto'),
      mediosPrazos: items.filter(item => item.prazo === 'medio'),
      longosPrazos: items.filter(item => item.prazo === 'longo')
    };
  }

  // Calcular estatísticas do PDI
  static calculatePDIStats(items: PDIItem[]) {
    const total = items.length;
    const naoIniciados = items.filter(item => item.status === '1').length;
    const emAndamento = items.filter(item => item.status === '2').length;
    const concluidos = items.filter(item => item.status === '3').length;
    
    return {
      total,
      naoIniciados,
      emAndamento,
      concluidos,
      percentualConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0
    };
  }

  // Funções de título e descrição removidas - não são necessárias na estrutura simplificada

  // Validar dados completos do PDI
  static validatePDIData(pdiData: Partial<PDIData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pdiData.employee_id) {
      errors.push('employee_id é obrigatório');
    }

    if (!pdiData.items || !Array.isArray(pdiData.items)) {
      errors.push('items deve ser um array');
    } else {
      const invalidItems = pdiData.items.filter(item => !this.validatePDIItem(item));
      if (invalidItems.length > 0) {
        errors.push(`${invalidItems.length} itens com estrutura inválida`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}