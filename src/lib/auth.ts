'use client';

import { User, Entrega } from './types';
import { supabase } from './supabase';

// Autenticação
export async function login(email: string, password: string): Promise<User | null> {
  try {
    console.log('🔐 [LOGIN] Iniciando autenticação para:', email);
    
    // Buscar usuário no banco de dados
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', password)
      .single();

    console.log('📊 [LOGIN] Resposta do banco:', { 
      sucesso: !!data, 
      erro: error?.message,
      usuario: data?.nome 
    });

    if (error) {
      console.error('❌ [LOGIN] Erro na query:', error);
      return null;
    }

    if (!data) {
      console.error('❌ [LOGIN] Nenhum usuário encontrado');
      return null;
    }

    // Determinar role do usuário
    let role: 'gerente' | 'entregador' = 'entregador';
    
    if (data.role) {
      role = data.role === 'gerente' ? 'gerente' : 'entregador';
      console.log('✅ [LOGIN] Role definido pelo campo "role":', role);
    }
    else if (data.tipo) {
      role = data.tipo === 'gerente' ? 'gerente' : 'entregador';
      console.log('✅ [LOGIN] Role definido pelo campo "tipo":', role);
    }
    else if (email.toLowerCase() === 'jeanisound@gmail.com') {
      role = 'gerente';
      console.log('✅ [LOGIN] Role definido por email (gerente):', role);
    }
    else if (data.nome && data.nome.toLowerCase().includes('gerente')) {
      role = 'gerente';
      console.log('✅ [LOGIN] Role definido pelo nome:', role);
    }
    else {
      console.log('✅ [LOGIN] Role padrão (entregador):', role);
    }

    const user: User = {
      id: data.id,
      email: data.email,
      password: data.senha,
      role: role,
      name: data.nome,
      chavePix: data.chave_pix
    };

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('💾 [LOGIN] Usuário salvo no localStorage');
    }

    console.log('✅ [LOGIN] Login bem-sucedido!', { 
      nome: user.name, 
      role: user.role,
      id: user.id 
    });
    
    return user;
  } catch (error) {
    console.error('❌ [LOGIN] Erro inesperado:', error);
    return null;
  }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    console.log('👋 [LOGOUT] Usuário deslogado');
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('👤 [AUTH] Usuário atual:', user.name, '-', user.role);
        return user;
      } catch (error) {
        console.error('❌ [AUTH] Erro ao parsear usuário do localStorage');
        return null;
      }
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function isGerente(): boolean {
  const user = getCurrentUser();
  return user?.role === 'gerente';
}

// Funções de gestão de entregas
export async function getEntregadores(): Promise<User[]> {
  try {
    console.log('📋 [ENTREGADORES] Buscando lista de entregadores...');
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ [ENTREGADORES] Erro ao buscar:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [ENTREGADORES] Nenhum usuário encontrado no banco');
      return [];
    }

    // Filtrar apenas entregadores
    const entregadores = data
      .filter(u => {
        const isGerente = 
          u.role === 'gerente' ||
          u.tipo === 'gerente' ||
          u.email?.toLowerCase() === 'jeanisound@gmail.com' ||
          u.nome?.toLowerCase().includes('gerente');
        
        return !isGerente;
      })
      .map(u => ({
        id: u.id,
        email: u.email,
        password: u.senha,
        role: 'entregador' as const,
        name: u.nome,
        chavePix: u.chave_pix
      }));

    console.log('✅ [ENTREGADORES] Encontrados:', entregadores.length);
    return entregadores;
  } catch (error) {
    console.error('❌ [ENTREGADORES] Erro inesperado:', error);
    return [];
  }
}

export async function getLancamentos(entregadorId?: string) {
  try {
    console.log('📋 [LANCAMENTOS] Buscando lançamentos...', entregadorId ? `(entregador: ${entregadorId})` : '(todos)');
    
    let query = supabase
      .from('lancamentos')
      .select('*')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (entregadorId) {
      query = query.eq('entregador_id', entregadorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [LANCAMENTOS] Erro ao buscar:', error);
      return [];
    }

    console.log('✅ [LANCAMENTOS] Encontrados:', data?.length || 0);
    console.log('📦 [LANCAMENTOS] Dados:', data);
    
    return data || [];
  } catch (error) {
    console.error('❌ [LANCAMENTOS] Erro inesperado:', error);
    return [];
  }
}

export async function getPagamentos(entregadorId?: string) {
  try {
    console.log('💰 [PAGAMENTOS] Buscando pagamentos...', entregadorId ? `(entregador: ${entregadorId})` : '(todos)');
    
    let query = supabase
      .from('pagamentos')
      .select('*')
      .order('data', { ascending: false });

    if (entregadorId) {
      query = query.eq('entregador_id', entregadorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [PAGAMENTOS] Erro ao buscar:', error);
      return [];
    }

    console.log('✅ [PAGAMENTOS] Encontrados:', data?.length || 0);
    
    return data || [];
  } catch (error) {
    console.error('❌ [PAGAMENTOS] Erro inesperado:', error);
    return [];
  }
}

export async function calcularResumo(entregadorId: string, periodo?: { inicio: Date; fim: Date }) {
  try {
    console.log('📊 [RESUMO] Calculando para entregador:', entregadorId);
    
    let queryLancamentos = supabase
      .from('lancamentos')
      .select('*')
      .eq('entregador_id', entregadorId);

    let queryPagamentos = supabase
      .from('pagamentos')
      .select('*')
      .eq('entregador_id', entregadorId);

    if (periodo) {
      const dataInicio = periodo.inicio.toISOString().split('T')[0];
      const dataFim = periodo.fim.toISOString().split('T')[0];
      queryLancamentos = queryLancamentos
        .gte('data', dataInicio)
        .lte('data', dataFim);
      queryPagamentos = queryPagamentos
        .gte('data', dataInicio)
        .lte('data', dataFim);
      console.log('📅 [RESUMO] Período:', dataInicio, 'até', dataFim);
    }

    const [lancamentosResult, pagamentosResult] = await Promise.all([
      queryLancamentos,
      queryPagamentos
    ]);

    if (lancamentosResult.error) {
      console.error('❌ [RESUMO] Erro ao buscar lançamentos:', lancamentosResult.error);
    }

    if (pagamentosResult.error) {
      console.error('❌ [RESUMO] Erro ao buscar pagamentos:', pagamentosResult.error);
    }

    const lancamentos = lancamentosResult.data || [];
    const pagamentos = pagamentosResult.data || [];

    const valorArrecadado = lancamentos.reduce((acc, l) => acc + parseFloat(l.total_geral || 0), 0);
    const valorTotalRecebido = pagamentos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
    const valorAReceber = valorArrecadado - valorTotalRecebido;

    console.log('✅ [RESUMO] Calculado:', {
      lancamentos: lancamentos.length,
      pagamentos: pagamentos.length,
      valorArrecadado: valorArrecadado.toFixed(2),
      valorTotalRecebido: valorTotalRecebido.toFixed(2),
      valorAReceber: valorAReceber.toFixed(2)
    });

    return {
      valorArrecadado,
      valorAReceber,
      valorTotalRecebido,
      totalEntregas: lancamentos.length
    };
  } catch (error) {
    console.error('❌ [RESUMO] Erro inesperado:', error);
    return {
      valorArrecadado: 0,
      valorAReceber: 0,
      valorTotalRecebido: 0,
      totalEntregas: 0
    };
  }
}

export async function salvarLancamento(lancamento: any) {
  try {
    console.log('💾 [SALVAR] Iniciando salvamento do lançamento:', lancamento);

    if (!lancamento.entregadorId) {
      console.error('❌ [SALVAR] Erro: entregadorId não fornecido');
      return { success: false, error: 'Entregador não selecionado' };
    }

    if (!lancamento.data) {
      console.error('❌ [SALVAR] Erro: data não fornecida');
      return { success: false, error: 'Data não fornecida' };
    }

    const dadosLancamento = {
      entregador_id: lancamento.entregadorId,
      data: lancamento.data,
      valor_diaria: parseFloat(lancamento.valorDiaria) || 0,
      periodo: lancamento.periodo,
      caixinha: parseFloat(lancamento.caixinha) || 0,
      total_entregas: parseFloat(lancamento.totalEntregas) || 0,
      total_geral: parseFloat(lancamento.totalGeral) || 0
    };

    console.log('📝 [SALVAR] Dados preparados:', dadosLancamento);

    const { data: lancamentoData, error: lancamentoError } = await supabase
      .from('lancamentos')
      .insert(dadosLancamento)
      .select()
      .single();

    if (lancamentoError) {
      console.error('❌ [SALVAR] Erro ao salvar lançamento:', lancamentoError);
      return { success: false, error: lancamentoError.message || 'Erro ao salvar lançamento' };
    }

    console.log('✅ [SALVAR] Lançamento salvo com sucesso:', lancamentoData.id);

    if (lancamento.entregas && lancamento.entregas.length > 0) {
      const entregasParaInserir = lancamento.entregas.map((e: any) => ({
        lancamento_id: lancamentoData.id,
        km: e.km,
        quantidade: parseInt(e.quantidade) || 0,
        valor_unitario: parseFloat(e.valorUnitario) || 0,
        subtotal: (parseInt(e.quantidade) || 0) * (parseFloat(e.valorUnitario) || 0)
      }));

      console.log('📦 [SALVAR] Inserindo entregas por KM:', entregasParaInserir.length);

      const { error: entregasError } = await supabase
        .from('entregas_por_km')
        .insert(entregasParaInserir);

      if (entregasError) {
        console.error('⚠️ [SALVAR] Erro ao salvar entregas por KM:', entregasError);
      } else {
        console.log('✅ [SALVAR] Entregas por KM salvas com sucesso');
      }
    }

    return { success: true, data: lancamentoData };
  } catch (error) {
    console.error('❌ [SALVAR] Erro inesperado:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function salvarPagamento(pagamento: {
  entregadorId: string;
  valor: number;
  gerenteId: string;
}) {
  try {
    console.log('💰 [SALVAR PAGAMENTO] Iniciando salvamento:', pagamento);

    const dadosPagamento = {
      entregador_id: pagamento.entregadorId,
      valor: pagamento.valor,
      gerente_id: pagamento.gerenteId,
      data: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pagamentos')
      .insert(dadosPagamento)
      .select()
      .single();

    if (error) {
      console.error('❌ [SALVAR PAGAMENTO] Erro:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [SALVAR PAGAMENTO] Pagamento salvo com sucesso:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [SALVAR PAGAMENTO] Erro inesperado:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function atualizarChavePix(userId: string, chavePix: string): Promise<boolean> {
  try {
    console.log('🔑 [ATUALIZAR PIX] Atualizando chave PIX para usuário:', userId);

    const { error } = await supabase
      .from('usuarios')
      .update({ chave_pix: chavePix })
      .eq('id', userId);

    if (error) {
      console.error('❌ [ATUALIZAR PIX] Erro:', error);
      return false;
    }

    console.log('✅ [ATUALIZAR PIX] Chave PIX atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [ATUALIZAR PIX] Erro inesperado:', error);
    return false;
  }
}

export async function deletarLancamento(lancamentoId: string) {
  try {
    console.log('🗑️ [DELETAR] Deletando lançamento:', lancamentoId);

    const { error: entregasError } = await supabase
      .from('entregas_por_km')
      .delete()
      .eq('lancamento_id', lancamentoId);

    if (entregasError) {
      console.error('⚠️ [DELETAR] Erro ao deletar entregas por KM:', entregasError);
    }

    const { error } = await supabase
      .from('lancamentos')
      .delete()
      .eq('id', lancamentoId);

    if (error) {
      console.error('❌ [DELETAR] Erro ao deletar lançamento:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [DELETAR] Lançamento deletado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('❌ [DELETAR] Erro inesperado:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}
