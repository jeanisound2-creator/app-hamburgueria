// Tipos do sistema de gestão Star Burguer

export type UserRole = 'gerente' | 'entregador';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  chavePix?: string;
}

export interface Entrega {
  id: string;
  entregadorId: string;
  data: string;
  valor: number;
  tipo: 'entrega' | 'diaria' | 'caixinha' | 'desconto';
  descricao?: string;
  status: 'pendente' | 'pago';
  dataPagamento?: string;
}

export interface Pagamento {
  id: string;
  entregador_id: string;
  valor: number;
  data: string;
  gerente_id: string;
  created_at: string;
}

export interface ResumoEntregador {
  entregadorId: string;
  nome: string;
  valorArrecadado: number;
  valorAReceber: number;
  valorTotalRecebido: number;
  totalEntregas: number;
}

export interface PeriodoRelatorio {
  inicio: string;
  fim: string;
  tipo: '7dias' | 'mes' | 'anual';
}
