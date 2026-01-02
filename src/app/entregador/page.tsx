'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, calcularResumo } from '@/lib/auth';
import { User } from '@/lib/types';
import { 
  DollarSign, 
  TrendingUp, 
  LogOut,
  Calendar,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react';

export default function EntregadorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [periodo, setPeriodo] = useState<'7dias' | 'mes' | 'anual'>('7dias');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'entregador') {
      router.push('/');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  // Calcular períodos
  const hoje = new Date();
  const periodos = {
    '7dias': {
      inicio: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000),
      fim: hoje
    },
    'mes': {
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      fim: hoje
    },
    'anual': {
      inicio: new Date(hoje.getFullYear(), 0, 1),
      fim: hoje
    }
  };

  const resumo7dias = calcularResumo(user.id, periodos['7dias']);
  const resumoMes = calcularResumo(user.id, periodos['mes']);
  const resumoAnual = calcularResumo(user.id, periodos['anual']);
  const resumoAtual = periodo === '7dias' ? resumo7dias : periodo === 'mes' ? resumoMes : resumoAnual;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/cf7f340e-666e-47e3-b604-3f6e61928774.png" 
                alt="Star Burguer" 
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Meu Dashboard</h1>
                <p className="text-sm text-gray-400">Olá, {user.name}</p>
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
        {/* Seletor de Período */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setPeriodo('7dias')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              periodo === '7dias'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              periodo === 'mes'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodo('anual')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              periodo === 'anual'
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Este Ano
          </button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Valor Arrecadado</p>
            <p className="text-3xl font-bold text-white">
              R$ {resumoAtual.valorArrecadado.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">A Receber</p>
            <p className="text-3xl font-bold text-white">
              R$ {resumoAtual.valorAReceber.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Recebido</p>
            <p className="text-3xl font-bold text-white">
              R$ {resumoAtual.valorTotalRecebido.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Entregas</p>
            <p className="text-3xl font-bold text-white">{resumoAtual.totalEntregas}</p>
          </div>
        </div>

        {/* Comparativo de Períodos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Últimos 7 Dias</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Arrecadado</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {resumo7dias.valorArrecadado.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">A Receber</p>
                <p className="text-xl font-bold text-yellow-400">
                  R$ {resumo7dias.valorAReceber.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entregas</p>
                <p className="text-xl font-bold text-white">{resumo7dias.totalEntregas}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Este Mês</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Arrecadado</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {resumoMes.valorArrecadado.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">A Receber</p>
                <p className="text-xl font-bold text-yellow-400">
                  R$ {resumoMes.valorAReceber.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entregas</p>
                <p className="text-xl font-bold text-white">{resumoMes.totalEntregas}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Este Ano</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Arrecadado</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {resumoAnual.valorArrecadado.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">A Receber</p>
                <p className="text-xl font-bold text-yellow-400">
                  R$ {resumoAnual.valorAReceber.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entregas</p>
                <p className="text-xl font-bold text-white">{resumoAnual.totalEntregas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informações Importantes</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Os valores são atualizados em tempo real pelo gerente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Pagamentos são realizados semanalmente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Você pode acompanhar seu desempenho por diferentes períodos</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
