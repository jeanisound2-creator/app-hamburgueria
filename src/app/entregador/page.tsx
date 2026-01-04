'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, getLancamentos, getPagamentos, calcularResumo, atualizarChavePix } from '@/lib/auth';
import { User, Pagamento } from '@/lib/types';
import { 
  DollarSign, 
  TrendingUp, 
  LogOut,
  Clock,
  CheckCircle,
  Calendar,
  RefreshCw,
  Key,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

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

export default function EntregadorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [resumo, setResumo] = useState({
    valorArrecadado: 0,
    valorAReceber: 0,
    valorTotalRecebido: 0,
    totalEntregas: 0
  });
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [editandoPix, setEditandoPix] = useState(false);
  const [novaChavePix, setNovaChavePix] = useState('');
  const [salvandoPix, setSalvandoPix] = useState(false);

  // Estado para modal
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
    console.log('👤 [ENTREGADOR] Usuário atual:', currentUser);
    
    if (!currentUser || currentUser.role !== 'entregador') {
      console.log('❌ [ENTREGADOR] Acesso negado - redirecionando para login');
      router.push('/');
      return;
    }
    
    setUser(currentUser);
    setNovaChavePix(currentUser.chavePix || '');
    carregarDados(currentUser.id);

    // Atualizar dados a cada 5 segundos
    const intervalo = setInterval(() => {
      console.log('🔄 [ENTREGADOR] Atualizando dados automaticamente...');
      carregarDadosSilencioso(currentUser.id);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [router]);

  const carregarDados = async (entregadorId: string) => {
    setCarregando(true);
    try {
      console.log('📊 [ENTREGADOR] Carregando dados do dashboard...');
      
      const [listaLancamentos, listaPagamentos, dadosResumo] = await Promise.all([
        getLancamentos(entregadorId),
        getPagamentos(entregadorId),
        calcularResumo(entregadorId)
      ]);
      
      console.log('✅ [ENTREGADOR] Dados carregados:', {
        lancamentos: listaLancamentos.length,
        pagamentos: listaPagamentos.length,
        resumo: dadosResumo
      });
      
      setLancamentos(listaLancamentos);
      setPagamentos(listaPagamentos);
      setResumo(dadosResumo);
    } catch (error) {
      console.error('❌ [ENTREGADOR] Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarDadosSilencioso = async (entregadorId: string) => {
    try {
      const [listaLancamentos, listaPagamentos, dadosResumo] = await Promise.all([
        getLancamentos(entregadorId),
        getPagamentos(entregadorId),
        calcularResumo(entregadorId)
      ]);
      
      console.log('🔄 [ENTREGADOR] Dados atualizados:', {
        lancamentos: listaLancamentos.length,
        pagamentos: listaPagamentos.length
      });
      
      setLancamentos(listaLancamentos);
      setPagamentos(listaPagamentos);
      setResumo(dadosResumo);
    } catch (error) {
      console.error('❌ [ENTREGADOR] Erro ao atualizar dados:', error);
    }
  };

  const handleAtualizarManual = async () => {
    if (!user) return;
    console.log('🔄 [ENTREGADOR] Atualização manual solicitada');
    setAtualizando(true);
    await carregarDados(user.id);
    setAtualizando(false);
  };

  const handleSalvarChavePix = async () => {
    if (!user || !novaChavePix.trim()) {
      setModalAlerta({
        aberto: true,
        titulo: 'Atenção',
        mensagem: 'Por favor, digite uma chave PIX válida.',
        tipo: 'error'
      });
      return;
    }
    
    setSalvandoPix(true);
    try {
      console.log('💾 [ENTREGADOR] Salvando chave PIX:', novaChavePix);
      const sucesso = await atualizarChavePix(user.id, novaChavePix.trim());
      
      if (sucesso) {
        const userAtualizado = { ...user, chavePix: novaChavePix.trim() };
        setUser(userAtualizado);
        localStorage.setItem('user', JSON.stringify(userAtualizado));
        setEditandoPix(false);
        console.log('✅ [ENTREGADOR] Chave PIX salva com sucesso');
        
        setModalAlerta({
          aberto: true,
          titulo: 'Sucesso!',
          mensagem: 'Chave PIX salva com sucesso!',
          tipo: 'success'
        });
      } else {
        console.error('❌ [ENTREGADOR] Erro ao salvar chave PIX');
        setModalAlerta({
          aberto: true,
          titulo: 'Erro',
          mensagem: 'Erro ao salvar chave PIX. Tente novamente.',
          tipo: 'error'
        });
      }
    } catch (error) {
      console.error('❌ [ENTREGADOR] Erro ao salvar chave PIX:', error);
      setModalAlerta({
        aberto: true,
        titulo: 'Erro',
        mensagem: 'Erro ao salvar chave PIX. Tente novamente.',
        tipo: 'error'
      });
    } finally {
      setSalvandoPix(false);
    }
  };

  const handleCancelarEdicaoPix = () => {
    setNovaChavePix(user?.chavePix || '');
    setEditandoPix(false);
  };

  const handleLogout = () => {
    console.log('👋 [ENTREGADOR] Fazendo logout...');
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Modal */}
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
                <h1 className="text-xl font-bold text-white">Meu Dashboard</h1>
                <p className="text-sm text-gray-400">Olá, {user.name}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card Chave PIX */}
        <div className="mb-8 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Minha Chave PIX</h3>
                <p className="text-sm text-gray-400">Configure sua chave para receber pagamentos</p>
              </div>
            </div>
            {!editandoPix && (
              <button
                onClick={() => setEditandoPix(true)}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all text-sm font-medium"
              >
                {user.chavePix ? 'Editar' : 'Adicionar'}
              </button>
            )}
          </div>

          {editandoPix ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chave PIX (CPF, E-mail, Telefone ou Chave Aleatória)
                </label>
                <input
                  type="text"
                  value={novaChavePix}
                  onChange={(e) => setNovaChavePix(e.target.value)}
                  placeholder="Digite sua chave PIX"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSalvarChavePix}
                  disabled={salvandoPix || !novaChavePix.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Save className="w-4 h-4" />
                  {salvandoPix ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={handleCancelarEdicaoPix}
                  disabled={salvandoPix}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
              {user.chavePix ? (
                <div className="flex items-center justify-between">
                  <p className="text-white font-mono text-lg">{user.chavePix}</p>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    Configurada
                  </span>
                </div>
              ) : (
                <p className="text-gray-400 text-center">Nenhuma chave PIX configurada</p>
              )}
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Arrecadado</p>
            <p className="text-3xl font-bold text-white">
              R$ {resumo.valorArrecadado.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">A Receber</p>
            <p className="text-3xl font-bold text-white">
              R$ {resumo.valorAReceber.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Recebido</p>
            <p className="text-3xl font-bold text-white">
              R$ {resumo.valorTotalRecebido.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Entregas</p>
            <p className="text-3xl font-bold text-white">{resumo.totalEntregas}</p>
          </div>
        </div>

        {/* Histórico de Recebimentos */}
        <div className="mb-8 bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Histórico de Recebimentos</h2>
            {pagamentos.length > 0 && (
              <span className="text-sm text-gray-400">
                {pagamentos.length} {pagamentos.length === 1 ? 'recebimento' : 'recebimentos'}
              </span>
            )}
          </div>
          {carregando ? (
            <div className="px-6 py-8 text-center text-gray-400">Carregando...</div>
          ) : pagamentos.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">Nenhum recebimento ainda</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Valor Recebido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pagamentos.map((pagamento) => (
                    <tr key={pagamento.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(pagamento.data).toLocaleDateString('pt-BR')} às {new Date(pagamento.data).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400 font-bold">
                          R$ {parseFloat(pagamento.valor).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Recebido
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Meus Lançamentos */}
        <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Meus Lançamentos</h2>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {lancamentos.map((lancamento) => (
                    <tr key={lancamento.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(lancamento.data).toLocaleDateString('pt-BR')}
                        </div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
