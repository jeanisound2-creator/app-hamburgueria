'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = login(email, password);
      
      if (user) {
        // Redireciona baseado no perfil
        if (user.role === 'gerente') {
          router.push('/gerente');
        } else {
          router.push('/entregador');
        }
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/cf7f340e-666e-47e3-b604-3f6e61928774.png" 
            alt="Star Burguer" 
            className="h-32 w-32 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Star Burguer</h1>
          <p className="text-gray-400">Sistema de Gestão de Entregas</p>
        </div>

        {/* Card de Login */}
        <div className="bg-gray-900 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                placeholder="••••••"
                required
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span>Entrando...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Dica de teste */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Use as credenciais fornecidas para acessar o sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
