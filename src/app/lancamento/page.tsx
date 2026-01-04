'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getEntregadores, salvarLancamento } from '@/lib/auth';
import { User } from '@/lib/types';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Save,
  Calculator
} from 'lucide-react';

interface EntregaPorKm {
  km: string;
  quantidade: number;
  valorUnitario: number;
}

const VALORES_POR_KM: { [key: string]: number } = {
  '1-2km': 4.00,
  '3km': 5.00,
  '4km': 5.00,
  '5km': 6.00,
  '6km': 6.00,
  '7km': 7.00,
  '8km': 8.00,
  '9km': 9.00,
  '10km': 10.00,
  '11km': 11.00,
  '12km': 12.00,
  '13km': 13.00,
};

export default function LancamentoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entregadores, setEntregadores] = useState<User[]>([]);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [entregadorId, setEntregadorId] = useState('');
  const [valorDiaria, setValorDiaria] = useState('');
  const [periodo, setPeriodo] = useState<'almoco' | 'jantar'>('almoco');
  const [caixinha, setCaixinha] = useState('');
  const [salvando, setSalvando] = useState(false);
  
  const [entregas, setEntregas] = useState<EntregaPorKm[]>(
    Object.keys(VALORES_POR_KM).map(km => ({
      km,
      quantidade: 0,
      valorUnitario: VALORES_POR_KM[km]
    }))
  );

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'gerente') {
      router.push('/');
      return;
    }
    setUser(currentUser);
    carregarEntregadores();
  }, [router]);

  const carregarEntregadores = async () => {
    const lista = await getEntregadores();
    setEntregadores(lista);
  };

  const handleQuantidadeChange = (km: string, quantidade: number) => {
    setEntregas(prev => 
      prev.map(e => 
        e.km === km ? { ...e, quantidade: Math.max(0, quantidade) } : e
      )
    );
  };

  const calcularTotalEntregas = () => {
    return entregas.reduce((total, e) => total + (e.quantidade * e.valorUnitario), 0);
  };

  const calcularTotalGeral = () => {
    const totalEntregas = calcularTotalEntregas();
    const diaria = parseFloat(valorDiaria) || 0;
    const caixinhaValor = parseFloat(caixinha) || 0;
    return totalEntregas + diaria + caixinhaValor;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entregadorId) {
      alert('Selecione um entregador');
      return;
    }

    setSalvando(true);

    const lancamento = {
      entregadorId,
      data,
      valorDiaria: parseFloat(valorDiaria) || 0,
      periodo,
      entregas: entregas.filter(e => e.quantidade > 0),
      caixinha: parseFloat(caixinha) || 0,
      totalEntregas: calcularTotalEntregas(),
      totalGeral: calcularTotalGeral()
    };

    console.log('Enviando lançamento:', lancamento);

    const resultado = await salvarLancamento(lancamento);

    console.log('Resultado do salvamento:', resultado);

    if (resultado.success) {
      alert('Lançamento registrado com sucesso!');
      router.push('/gerente');
    } else {
      const mensagemErro = resultado.error || 'Erro ao salvar lançamento. Tente novamente.';
      alert(`Erro: ${mensagemErro}`);
      console.error('Detalhes do erro:', resultado);
      setSalvando(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/gerente')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Lançamento de Entregas</h1>
              <p className="text-sm text-gray-400">Registre as entregas do dia</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Principal */}
          <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Informações Gerais</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Entregador */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selecionar Entregador
                </label>
                <select
                  value={entregadorId}
                  onChange={(e) => setEntregadorId(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Selecione um entregador</option>
                  {entregadores.map(entregador => (
                    <option key={entregador.id} value={entregador.id}>
                      {entregador.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor da Diária */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Valor da Diária
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorDiaria}
                  onChange={(e) => setValorDiaria(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Período
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="almoco"
                      checked={periodo === 'almoco'}
                      onChange={(e) => setPeriodo(e.target.value as 'almoco' | 'jantar')}
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-white">Almoço</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="jantar"
                      checked={periodo === 'jantar'}
                      onChange={(e) => setPeriodo(e.target.value as 'almoco' | 'jantar')}
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-white">Jantar</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Entregas por KM */}
          <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Quantidade de Entregas por KM</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Distância
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Valor Unitário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {entregas.map((entrega) => (
                    <tr key={entrega.km} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{entrega.km}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400 font-semibold">
                          R$ {entrega.valorUnitario.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={entrega.quantidade}
                          onChange={(e) => handleQuantidadeChange(entrega.km, parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-yellow-400 font-semibold">
                          R$ {(entrega.quantidade * entrega.valorUnitario).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-black">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                      Total Entregas:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg text-yellow-400 font-bold">
                        R$ {calcularTotalEntregas().toFixed(2)}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Caixinha */}
          <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Valores Adicionais</h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Caixinha (se houver)
              </label>
              <input
                type="number"
                step="0.01"
                value={caixinha}
                onChange={(e) => setCaixinha(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Resumo Total */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-yellow-400" />
                Resumo do Lançamento
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Valor da Diária:</span>
                <span className="text-white font-semibold">
                  R$ {(parseFloat(valorDiaria) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Entregas:</span>
                <span className="text-white font-semibold">
                  R$ {calcularTotalEntregas().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Caixinha:</span>
                <span className="text-white font-semibold">
                  R$ {(parseFloat(caixinha) || 0).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-yellow-500/20 pt-3 flex justify-between items-center">
                <span className="text-yellow-400 font-bold text-lg">TOTAL GERAL:</span>
                <span className="text-yellow-400 font-bold text-2xl">
                  R$ {calcularTotalGeral().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/gerente')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{salvando ? 'Salvando...' : 'Salvar Lançamento'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
