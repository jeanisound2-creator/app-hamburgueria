'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, USERS, ENTREGAS_MOCK, calcularResumo } from '@/lib/auth';
import { User, Entrega, ResumoEntregador } from '@/lib/types';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  LogOut,
  Plus,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';

export default function GerentePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>(ENTREGAS_MOCK);
  const [showNovaEntrega, setShowNovaEntrega] = useState(false);
  const [periodo, setPeriodo] = useState<'7dias' | 'mes' | 'anual'>('7dias');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'gerente') {
      router.push('/');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const entregadores = USERS.filter(u => u.role === 'entregador');

  // Calcular resumos por entregador
  const resumos: ResumoEntregador[] = entregadores.map(entregador => {
    const resumo = calcularResumo(entregador.id);
    return {
      entregadorId: entregador.id,
      nome: entregador.name,
      ...resumo
    };
  });

  // Totais gerais
  const totais = resumos.reduce((acc, r) => ({
    valorArrecadado: acc.valorArrecadado + r.valorArrecadado,
    valorAReceber: acc.valorAReceber + r.valorAReceber,
    valorTotalRecebido: acc.valorTotalRecebido + r.valorTotalRecebido,
    totalEntregas: acc.totalEntregas + r.totalEntregas
  }), { valorArrecadado: 0, valorAReceber: 0, valorTotalRecebido: 0, totalEntregas: 0 });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/cf7f340e-666e-47e3-b604-3f6e61928774.png" 
                alt="Star Burguer" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Gerencial</h1>
                <p className="text-sm text-gray-400">Bem-vindo, {user.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-gray-400 text-sm mb-1">A Receber</p>
            <p className="text-3xl font-bold text-white">
              R$ {totais.valorAReceber.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Entregas</p>
            <p className="text-3xl font-bold text-white">{totais.totalEntregas}</p>
          </div>
        </div>

        {/* Botão Nova Entrega */}
        <div className="mb-6">
          <button
            onClick={() => setShowNovaEntrega(!showNovaEntrega)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold rounded-lg transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Entrega/Lançamento</span>
          </button>
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
                    Entregas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Arrecadado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    A Receber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Recebido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {resumos.map((resumo) => (
                  <tr key={resumo.entregadorId} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{resumo.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{resumo.totalEntregas}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-400 font-semibold">
                        R$ {resumo.valorArrecadado.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-yellow-400 font-semibold">
                        R$ {resumo.valorAReceber.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-400 font-semibold">
                        R$ {resumo.valorTotalRecebido.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Entregas Recentes */}
        <div className="mt-8 bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Entregas Recentes</h2>
          </div>
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
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {entregas.slice(0, 10).map((entrega) => {
                  const entregador = USERS.find(u => u.id === entrega.entregadorId);
                  return (
                    <tr key={entrega.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(entrega.data).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{entregador?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                          {entrega.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400 font-semibold">
                          R$ {entrega.valor.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entrega.status === 'pago' ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Pago
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400 text-sm">
                            <Clock className="w-4 h-4" />
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
