'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, getEntregadores, getLancamentos, getPagamentos, calcularResumo, deletarLancamento, salvarPagamento } from '@/lib/auth';
import { User, Pagamento } from '@/lib/types';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  LogOut,
  Plus,
  CheckCircle,
  Clock,
  Calendar,
  Trash2,
  RefreshCw,
  CreditCard,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

type AbaAtiva = 'dashboard' | 'pagamentos';

// Modal de Confirmação Customizado
function ModalConfirmacao({ 
  aberto, 
  titulo, 
  mensagem, 
  onConfirmar, 
  onCancelar 
}: { 
  aberto: boolean; 
  titulo: string; 
  mensagem: string; 
  onConfirmar: () => void; 
  onCancelar: () => void; 
}) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">{titulo}</h3>
        </div>
        <p className="text-gray-300 mb-6">{mensagem}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirmar}
            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-all"
          >
            Confirmar
          </button>
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Alerta Customizado
function ModalAlerta({ 
  aberto, 
  titulo, 
  mensagem, 
  tipo = 'info',
  onFechar 
}: { 
  aberto: boolean; 
  titulo: string; 
  mensagem: string; 
  tipo?: 'success' | 'error' | 'info';
  onFechar: () => void; 
}) {
  if (!aberto) return null;

  const cores = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className={`w-6 h-6 ${cores[tipo]}`} />
          <h3 className="text-xl font-bold text-white">{titulo}</h3>
        </div>
        <p className="text-gray-300 mb-6">{mensagem}</p>
        <button
          onClick={onFechar}
          className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function GerentePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entregadores, setEntregadores] = useState<User[]>([]);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('dashboard');
  
  // Estados para pagamento
  const [entregadorSelecionado, setEntregadorSelecionado] = useState<string>('');
  const [valorPagamento, setValorPagamento] = useState<string>('');
  const [chavePix, setChavePix] = useState<string>('');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);

  // Estados para modais
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    onConfirmar: () => void;
  }>({
    aberto: false,
    titulo: '',
    mensagem: '',
    onConfirmar: () => {}
  });

  const [modalAlerta, setModalAlerta] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    tipo: 'success' | 'error' | 'info';
  }>({
    aberto: false,
    titulo: '',
    mensagem: '',
    tipo: 'info'
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    console.log('👤 [GERENTE] Usuário atual:', currentUser);
    
    if (!currentUser || currentUser.role !== 'gerente') {
      console.log('❌ [GERENTE] Acesso negado - redirecionando para login');
      router.push('/');
      return;
    }
    
    setUser(currentUser);
    carregarDados();

    // Atualizar dados a cada 3 segundos
    const intervalo = setInterval(() => {
      console.log('🔄 [GERENTE] Atualizando dados automaticamente...');
      carregarDadosSilencioso();
    }, 3000);

    return () => clearInterval(intervalo);
  }, [router]);

  // Atualizar chave PIX quando entregador for selecionado
  useEffect(() => {
    if (entregadorSelecionado) {
      const entregador = entregadores.find(e => e.id === entregadorSelecionado);
      console.log('🔑 [GERENTE] Entregador selecionado:', entregador);
      setChavePix(entregador?.chavePix || '');
    } else {
      setChavePix('');
    }
  }, [entregadorSelecionado, entregadores]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      console.log('📊 [GERENTE] Carregando dados do dashboard...');
      
      const [listaEntregadores, listaLancamentos, listaPagamentos] = await Promise.all([
        getEntregadores(),
        getLancamentos(),
        getPagamentos()
      ]);
      
      console.log('✅ [GERENTE] Dados carregados:', {
        entregadores: listaEntregadores.length,
        lancamentos: listaLancamentos.length,
        pagamentos: listaPagamentos.length
      });
      
      setEntregadores(listaEntregadores);
      setLancamentos(listaLancamentos);
      setPagamentos(listaPagamentos);
    } catch (error) {
      console.error('❌ [GERENTE] Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarDadosSilencioso = async () => {
    try {
      const [listaEntregadores, listaLancamentos, listaPagamentos] = await Promise.all([
        getEntregadores(),
        getLancamentos(),
        getPagamentos()
      ]);
      
      console.log('🔄 [GERENTE] Dados atualizados:', {
        entregadores: listaEntregadores.length,
        lancamentos: listaLancamentos.length,
        pagamentos: listaPagamentos.length
      });
      
      setEntregadores(listaEntregadores);
      setLancamentos(listaLancamentos);
      setPagamentos(listaPagamentos);
    } catch (error) {
      console.error('❌ [GERENTE] Erro ao atualizar dados:', error);
    }
  };

  const handleAtualizarManual = async () => {
    console.log('🔄 [GERENTE] Atualização manual solicitada');
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  };

  const handleLogout = () => {
    console.log('👋 [GERENTE] Fazendo logout...');
    logout();
    router.push('/');
  };

  const handleExcluirLancamento = async (lancamentoId: string) => {
    setModalConfirmacao({
      aberto: true,
      titulo: 'Confirmar Exclusão',
      mensagem: 'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
      onConfirmar: async () => {
        setModalConfirmacao({ ...modalConfirmacao, aberto: false });
        
        console.log('🗑️ [GERENTE] Excluindo lançamento:', lancamentoId);
        const resultado = await deletarLancamento(lancamentoId);
        
        if (resultado.success) {
          setModalAlerta({
            aberto: true,
            titulo: 'Sucesso!',
            mensagem: 'Lançamento excluído com sucesso!',
            tipo: 'success'
          });
          await carregarDados();
        } else {
          setModalAlerta({
            aberto: true,
            titulo: 'Erro',
            mensagem: 'Erro ao excluir lançamento. Tente novamente.',
            tipo: 'error'
          });
        }
      }
    });
  };

  const handleCopiarPix = () => {
    if (chavePix) {
      navigator.clipboard.writeText(chavePix);
      setPixCopiado(true);
      setTimeout(() => setPixCopiado(false), 2000);
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!entregadorSelecionado || !valorPagamento || !user) {
      setModalAlerta({
        aberto: true,
        titulo: 'Atenção',
        mensagem: 'Preencha todos os campos!',
        tipo: 'error'
      });
      return;
    }

    const valor = parseFloat(valorPagamento);
    if (isNaN(valor) || valor <= 0) {
      setModalAlerta({
        aberto: true,
        titulo: 'Atenção',
        mensagem: 'Valor inválido!',
        tipo: 'error'
      });
      return;
    }

    setModalConfirmacao({
      aberto: true,
      titulo: 'Confirmar Pagamento',
      mensagem: `Confirmar pagamento de R$ ${valor.toFixed(2)} para o entregador selecionado?`,
      onConfirmar: async () => {
        setModalConfirmacao({ ...modalConfirmacao, aberto: false });
        setProcessandoPagamento(true);
        console.log('💰 [PAGAMENTO] Processando pagamento...');

        const resultado = await salvarPagamento({
          entregadorId: entregadorSelecionado,
          valor: valor,
          gerenteId: user.id
        });

        if (resultado.success) {
          setModalAlerta({
            aberto: true,
            titulo: 'Sucesso!',
            mensagem: 'Pagamento confirmado com sucesso!',
            tipo: 'success'
          });
          setEntregadorSelecionado('');
          setValorPagamento('');
          setChavePix('');
          await carregarDados();
        } else {
          setModalAlerta({
            aberto: true,
            titulo: 'Erro',
            mensagem: 'Erro ao confirmar pagamento: ' + resultado.error,
            tipo: 'error'
          });
        }

        setProcessandoPagamento(false);
      }
    });
  };

  // Calcular totais gerais
  const calcularTotaisGerais = () => {
    const valorArrecadado = lancamentos.reduce((acc, l) => acc + parseFloat(l.total_geral || 0), 0);
    const valorTotalPago = pagamentos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
    const valorAPagar = valorArrecadado - valorTotalPago;

    return {
      valorArrecadado,
      valorAPagar,
      valorTotalPago,
      totalEntregas: lancamentos.length
    };
  };

  const totais = calcularTotaisGerais();

  // Calcular totais por entregador
  const calcularTotaisPorEntregador = (entregadorId: string) => {
    const lancamentosEntregador = lancamentos.filter(l => l.entregador_id === entregadorId);
    const pagamentosEntregador = pagamentos.filter(p => p.entregador_id === entregadorId);
    
    const arrecadado = lancamentosEntregador.reduce((acc, l) => acc + parseFloat(l.total_geral || 0), 0);
    const pago = pagamentosEntregador.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
    const aPagar = arrecadado - pago;

    return { arrecadado, pago, aPagar };
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Modais */}
      <ModalConfirmacao
        aberto={modalConfirmacao.aberto}
        titulo={modalConfirmacao.titulo}
        mensagem={modalConfirmacao.mensagem}
        onConfirmar={modalConfirmacao.onConfirmar}
        onCancelar={() => setModalConfirmacao({ ...modalConfirmacao, aberto: false })}
      />
      
      <ModalAlerta
        aberto={modalAlerta.aberto}
        titulo={modalAlerta.titulo}
        mensagem={modalAlerta.mensagem}
        tipo={modalAlerta.tipo}
        onFechar={() => setModalAlerta({ ...modalAlerta, aberto: false })}
      />

      {/* Header */}
      <header className="bg-black backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/fbb5cfe6-fb78-4954-8cdb-d393742808e8.png" 
                alt="Star Burguer" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Gerencial</h1>
                <p className="text-sm text-gray-400">Bem-vindo, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAtualizarManual}
                disabled={atualizando}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs de Navegação */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setAbaAtiva('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              abaAtiva === 'dashboard'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setAbaAtiva('pagamentos')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              abaAtiva === 'pagamentos'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Pagamentos
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Aba Dashboard */}
        {abaAtiva === 'dashboard' && (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Entregadores</p>
                <p className="text-3xl font-bold text-white">{entregadores.length}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Arrecadado</p>
                <p className="text-3xl font-bold text-white">
                  R$ {totais.valorArrecadado.toFixed(2)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">A Pagar</p>
                <p className="text-3xl font-bold text-white">
                  R$ {totais.valorAPagar.toFixed(2)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Lançamentos</p>
                <p className="text-3xl font-bold text-white">{totais.totalEntregas}</p>
              </div>
            </div>

            {/* Botão Nova Entrega */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/lancamento')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold rounded-lg transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Entrega/Lançamento</span>
              </button>
            </div>

            {/* Últimos Lançamentos */}
            <div className="mb-8 bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Últimos Lançamentos</h2>
                {lancamentos.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {lancamentos.length} {lancamentos.length === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                )}
              </div>
              {carregando ? (
                <div className="px-6 py-8 text-center text-gray-400">Carregando...</div>
              ) : lancamentos.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400">Nenhum lançamento registrado ainda</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Entregador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Diária
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Total Entregas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Caixinha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Total Geral
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {lancamentos.map((lancamento) => {
                        const entregador = entregadores.find(e => e.id === lancamento.entregador_id);
                        return (
                          <tr key={lancamento.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">
                                {new Date(lancamento.data).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{entregador?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                                {lancamento.periodo === 'almoco' ? 'Almoço' : 'Jantar'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-400 font-semibold">
                                R$ {parseFloat(lancamento.valor_diaria || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-yellow-400 font-semibold">
                                R$ {parseFloat(lancamento.total_entregas || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-purple-400 font-semibold">
                                R$ {parseFloat(lancamento.caixinha || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-400 font-bold">
                                R$ {parseFloat(lancamento.total_geral || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleExcluirLancamento(lancamento.id)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tabela de Entregadores */}
            <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Desempenho da Equipe</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Entregador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Lançamentos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Arrecadado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        A Pagar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {entregadores.map((entregador) => {
                      const lancamentosEntregador = lancamentos.filter(l => l.entregador_id === entregador.id);
                      const totaisEntregador = calcularTotaisPorEntregador(entregador.id);
                      
                      return (
                        <tr key={entregador.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{entregador.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{lancamentosEntregador.length}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-400 font-semibold">
                              R$ {totaisEntregador.arrecadado.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-yellow-400 font-semibold">
                              R$ {totaisEntregador.aPagar.toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Aba Pagamentos */}
        {abaAtiva === 'pagamentos' && (
          <>
            {/* Formulário de Pagamento */}
            <div className="mb-8 bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Realizar Pagamento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seleção de Entregador */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Selecione o Entregador
                  </label>
                  <select
                    value={entregadorSelecionado}
                    onChange={(e) => setEntregadorSelecionado(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">Selecione...</option>
                    {entregadores.map((entregador) => {
                      const totais = calcularTotaisPorEntregador(entregador.id);
                      return (
                        <option key={entregador.id} value={entregador.id}>
                          {entregador.name} - A Pagar: R$ {totais.aPagar.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Valor do Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Valor do Pagamento
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorPagamento}
                    onChange={(e) => setValorPagamento(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Chave PIX */}
              {entregadorSelecionado && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Chave PIX do Entregador
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chavePix || 'Não cadastrada'}
                      readOnly
                      className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
                    />
                    {chavePix && (
                      <button
                        onClick={handleCopiarPix}
                        className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all flex items-center gap-2"
                      >
                        {pixCopiado ? (
                          <>
                            <Check className="w-5 h-5" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copiar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Botão Confirmar Pagamento */}
              <div className="mt-6">
                <button
                  onClick={handleConfirmarPagamento}
                  disabled={!entregadorSelecionado || !valorPagamento || processandoPagamento}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processandoPagamento ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Pagamento
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Histórico de Pagamentos */}
            <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Histórico de Pagamentos</h2>
                {pagamentos.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {pagamentos.length} {pagamentos.length === 1 ? 'pagamento' : 'pagamentos'}
                  </span>
                )}
              </div>
              {carregando ? (
                <div className="px-6 py-8 text-center text-gray-400">Carregando...</div>
              ) : pagamentos.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400">Nenhum pagamento realizado ainda</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Entregador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Valor Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {pagamentos.map((pagamento) => {
                        const entregador = entregadores.find(e => e.id === pagamento.entregador_id);
                        return (
                          <tr key={pagamento.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">
                                {new Date(pagamento.data).toLocaleDateString('pt-BR')} às {new Date(pagamento.data).toLocaleTimeString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{entregador?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-400 font-bold">
                                R$ {parseFloat(pagamento.valor).toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
