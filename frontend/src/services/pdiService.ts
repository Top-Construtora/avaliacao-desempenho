import { api } from '../config/api';
import { PDIItem } from '../types/pdi.types';

interface SavePDIParams {
  employeeId: string;
  cycleId?: string;
  leaderEvaluationId?: string;
  items: PDIItem[];
  periodo?: string;
}

export const pdiService = {
  // Salvar PDI
  async savePDI(params: SavePDIParams) {
    try {
      const response = await api.post('/pdi', params);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao salvar PDI:', error);
      throw error;
    }
  },

  // Buscar PDI do colaborador
  async getPDI(employeeId: string) {
    try {
      const response = await api.get(`/pdi/${employeeId}`);
      return response.data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Erro ao buscar PDI:', error);
      throw error;
    }
  },

  // Buscar PDIs por ciclo
  async getPDIsByCycle(cycleId: string) {
    try {
      const response = await api.get(`/pdi/cycle/${cycleId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar PDIs do ciclo:', error);
      throw error;
    }
  },

  // Transformar dados do PDI do formato do componente para o formato da API
  transformPDIDataForAPI(pdiData: any, cycleId?: string, leaderEvaluationId?: string): SavePDIParams {
    console.log('🔄 Transformando PDI para API:', pdiData);
    console.log('📊 Contadores:', {
      curtos: pdiData.curtosPrazos?.length || 0,
      medios: pdiData.mediosPrazos?.length || 0,
      longos: pdiData.longosPrazos?.length || 0
    });

    const items: PDIItem[] = [];

    // Adicionar itens de curto prazo
    if (pdiData.curtosPrazos && Array.isArray(pdiData.curtosPrazos)) {
      pdiData.curtosPrazos.forEach((item: any, index: number) => {
        console.log(`➕ Adicionando curto prazo ${index}:`, item);
        const { observacoes, ...cleanItem } = item; // Remove observacoes incorreto
        items.push({
          ...cleanItem,
          prazo: 'curto' as const,
          // Usar o nome correto do campo
          observacao: item.observacao || item.observacoes || ''
        });
      });
    }

    // Adicionar itens de médio prazo
    if (pdiData.mediosPrazos && Array.isArray(pdiData.mediosPrazos)) {
      pdiData.mediosPrazos.forEach((item: any, index: number) => {
        console.log(`➕ Adicionando médio prazo ${index}:`, item);
        const { observacoes, ...cleanItem } = item; // Remove observacoes incorreto
        items.push({
          ...cleanItem,
          prazo: 'medio' as const,
          // Usar o nome correto do campo
          observacao: item.observacao || item.observacoes || ''
        });
      });
    }

    // Adicionar itens de longo prazo
    if (pdiData.longosPrazos && Array.isArray(pdiData.longosPrazos)) {
      pdiData.longosPrazos.forEach((item: any, index: number) => {
        console.log(`➕ Adicionando longo prazo ${index}:`, item);
        const { observacoes, ...cleanItem } = item; // Remove observacoes incorreto
        items.push({
          ...cleanItem,
          prazo: 'longo' as const,
          // Usar o nome correto do campo
          observacao: item.observacao || item.observacoes || ''
        });
      });
    }

    console.log('✅ Total de itens transformados:', items.length);
    console.log('📋 Items finais:', items);

    const result = {
      employeeId: pdiData.colaboradorId,
      cycleId,
      leaderEvaluationId,
      items,
      periodo: pdiData.periodo
    };

    console.log('🚀 Dados finais para enviar à API:', result);
    return result;
  },

  // Transformar dados do PDI do formato da API para o formato do componente
  transformPDIDataFromAPI(apiData: any): any {
    console.log('🔍 Dados recebidos da API:', apiData);
    
    const pdiData = {
      id: apiData.id,
      colaboradorId: apiData.employee_id,
      colaborador: apiData.employee?.name || '',
      cargo: apiData.employee?.position || '',
      departamento: '',
      periodo: apiData.periodo || '',
      curtosPrazos: [] as any[],
      mediosPrazos: [] as any[],
      longosPrazos: [] as any[],
      dataCriacao: apiData.created_at,
      dataAtualizacao: apiData.updated_at
    };

    // Verificar se os dados vêm como items (novo formato) ou goals/actions (formato antigo)
    if (apiData.items && Array.isArray(apiData.items)) {
      console.log('📋 Processando items:', apiData.items);
      apiData.items.forEach((item: PDIItem, index: number) => {
        console.log(`📝 Item ${index}:`, item, 'Prazo:', item.prazo);
        const itemWithoutPrazo = { ...item };
        delete (itemWithoutPrazo as any).prazo;

        switch (item.prazo) {
          case 'curto':
            pdiData.curtosPrazos.push(itemWithoutPrazo);
            break;
          case 'medio':
            pdiData.mediosPrazos.push(itemWithoutPrazo);
            break;
          case 'longo':
            pdiData.longosPrazos.push(itemWithoutPrazo);
            break;
          default:
            console.log('⚠️ Item com prazo não reconhecido:', item.prazo);
            // Se não tem prazo definido, colocar em curto prazo por padrão
            pdiData.curtosPrazos.push(itemWithoutPrazo);
        }
      });
    }

    console.log('✅ PDI transformado:', {
      curtosPrazos: pdiData.curtosPrazos.length,
      mediosPrazos: pdiData.mediosPrazos.length,
      longosPrazos: pdiData.longosPrazos.length
    });

    return pdiData;
  }
};