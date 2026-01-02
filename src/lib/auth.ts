'use client';

import { User, Entrega } from './types';

// Base de usuários do sistema
export const USERS: User[] = [
  {
    id: '1',
    email: 'jeanisound@gmail.com',
    password: '123456',
    role: 'gerente',
    name: 'Gerente'
  },
  {
    id: '2',
    email: 'andresilva@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'André Silva'
  },
  {
    id: '3',
    email: 'matheusfernandes@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'Matheus Fernandes'
  },
  {
    id: '4',
    email: 'jamersonsilva@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'Jamerson Silva'
  },
  {
    id: '5',
    email: 'philipegabriel@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'Philipe Gabriel'
  },
  {
    id: '6',
    email: 'rafaelcardoso@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'Rafael Cardoso'
  },
  {
    id: '7',
    email: 'douglasdelmondes@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'Douglas Delmondes'
  },
  {
    id: '8',
    email: 'italorocha@starburguer.com.br',
    password: '123456',
    role: 'entregador',
    name: 'Italo Rocha'
  }
];

// Dados mockados de entregas para demonstração
export const ENTREGAS_MOCK: Entrega[] = [
  {
    id: '1',
    entregadorId: '2',
    data: new Date().toISOString(),
    valor: 150.00,
    tipo: 'entrega',
    descricao: 'Entregas do dia',
    status: 'pendente'
  },
  {
    id: '2',
    entregadorId: '2',
    data: new Date(Date.now() - 86400000).toISOString(),
    valor: 200.00,
    tipo: 'entrega',
    descricao: 'Entregas do dia',
    status: 'pago',
    dataPagamento: new Date().toISOString()
  },
  {
    id: '3',
    entregadorId: '3',
    data: new Date().toISOString(),
    valor: 180.00,
    tipo: 'entrega',
    descricao: 'Entregas do dia',
    status: 'pendente'
  }
];

// Autenticação
export function login(email: string, password: string): User | null {
  const user = USERS.find(u => u.email === email && u.password === password);
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  }
  return null;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
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
export function getEntregasByEntregador(entregadorId: string): Entrega[] {
  return ENTREGAS_MOCK.filter(e => e.entregadorId === entregadorId);
}

export function calcularResumo(entregadorId: string, periodo?: { inicio: Date; fim: Date }) {
  let entregas = getEntregasByEntregador(entregadorId);
  
  if (periodo) {
    entregas = entregas.filter(e => {
      const dataEntrega = new Date(e.data);
      return dataEntrega >= periodo.inicio && dataEntrega <= periodo.fim;
    });
  }

  const valorArrecadado = entregas.reduce((acc, e) => {
    if (e.tipo === 'desconto') return acc - e.valor;
    return acc + e.valor;
  }, 0);

  const valorAReceber = entregas
    .filter(e => e.status === 'pendente')
    .reduce((acc, e) => {
      if (e.tipo === 'desconto') return acc - e.valor;
      return acc + e.valor;
    }, 0);

  const valorTotalRecebido = entregas
    .filter(e => e.status === 'pago')
    .reduce((acc, e) => {
      if (e.tipo === 'desconto') return acc - e.valor;
      return acc + e.valor;
    }, 0);

  return {
    valorArrecadado,
    valorAReceber,
    valorTotalRecebido,
    totalEntregas: entregas.length
  };
}
