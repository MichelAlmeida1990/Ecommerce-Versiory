import { BillingConfig, BillingPhase } from '../types';

// REFCOM198: Configuração de faturamento/mensalidade
const BILLING_CONFIG_KEY = 'versiory_billing_config';

export const getBillingConfig = (): BillingConfig | null => {
  const stored = localStorage.getItem(BILLING_CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveBillingConfig = (config: BillingConfig): void => {
  localStorage.setItem(BILLING_CONFIG_KEY, JSON.stringify(config));
};

export const getDefaultBillingConfig = (): BillingConfig => ({
  dueDay: 15,
  value: 99.9,
  lastPaidMonth: '',
  whatsapp: '',
  pixKey: '',
  bankDetails: '',
  paymentConfirmed: false,
  paymentConfirmedAt: ''
});

export interface BillingStatus {
  phase: BillingPhase;
  dueDate: Date;                 // data de vencimento da fatura atual
  dueDateStr: string;            // dd/mm/aaaa
  daysRemaining: number;         // dias até o vencimento (quando ainda não venceu)
  daysOfAccess: number;          // dias de acesso restante após o vencimento
  blocked: boolean;              // bloqueio total do sistema
  blockAdmin: boolean;           // bloqueio do módulo administrativo (admin)
  restricted: boolean;           // acesso restrito (perfil vendedor)
  message: string;               // mensagem principal para o usuário
  detail: string;                // detalhe/contexto
  pendingConfirmation: boolean;  // pagamento confirmado aguardando 24h
}

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / (1000 * 60 * 60 * 24));
const fmt = (d: Date) => d.toLocaleDateString('pt-BR');

// Calcula o status de faturamento com base na data atual (vencimento sempre dia 15)
export const getBillingStatus = (config?: BillingConfig | null): BillingStatus => {
  const base: BillingStatus = {
    phase: 'normal',
    dueDate: new Date(),
    dueDateStr: '',
    daysRemaining: 0,
    daysOfAccess: 0,
    blocked: false,
    blockAdmin: false,
    restricted: false,
    message: '',
    detail: '',
    pendingConfirmation: false
  };

  if (!config) {
    base.message = 'Faturamento não configurado.';
    return base;
  }

  // Pagamento confirmado nos últimos 24h → acesso liberado (em regularização)
  if (config.paymentConfirmed && config.paymentConfirmedAt) {
    const diffH = (Date.now() - new Date(config.paymentConfirmedAt).getTime()) / (1000 * 60 * 60);
    if (diffH <= 24) {
      base.pendingConfirmation = true;
      base.message = 'Pagamento confirmado! Acesso será restabelecido em até 24h.';
      base.detail = 'Obrigado por regularizar sua fatura.';
      return base;
    }
  }

  const now = new Date();
  const dueDay = config.dueDay || 15;
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  base.dueDate = dueDate;
  base.dueDateStr = fmt(dueDate);

  // dias no mês atual
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // dia 5 do mês seguinte (fim da carência)
  const graceEnd = new Date(now.getFullYear(), now.getMonth(), dueDay);
  const daysToGraceEnd = (daysInMonth - dueDay) + 5; // dias entre dueDate e dia 5 do próximo mês

  if (now < dueDate) {
    const remaining = dayDiff(dueDate, now); // >0
    base.daysRemaining = remaining;
    if (remaining >= 10) {
      base.phase = 'normal';
      base.message = `Fatura em dia. Próximo vencimento em ${fmt(dueDate)}.`;
    } else {
      base.phase = 'normal';
      base.message = `Faltam ${remaining} dia(s) para o vencimento da Fatura. Clique para Efetuar o Pagamento!`;
      base.detail = `Vencimento: ${fmt(dueDate)}.`;
    }
    return base;
  }

  // Vencido (hoje >= dueDate)
  const overdue = dayDiff(now, dueDate); // >=0
  base.daysOfAccess = Math.max(0, 5 - overdue); // dias 15..19 → 5..1

  if (overdue <= 4) {
    // dia 15..19: aviso de vencimento, acesso normal
    base.phase = 'warning';
    base.message = `Sua Fatura venceu ${fmt(dueDate)}. Faltam ${base.daysOfAccess} dia(s) de acesso. Clique para Efetuar o Pagamento!`;
    base.detail = 'Acesso normal mantido até o dia 20.';
    return base;
  }

  if (overdue <= daysToGraceEnd) {
    // dia 20..fim do mês (restricted) e dia 1..5 do mês seguinte (grace)
    base.phase = 'restricted';
    base.restricted = true;
    base.blockAdmin = true;
    base.message = 'Acesso restrito: módulo administrativo bloqueado. Use o perfil Vendedor para operações de PDV.';
    base.detail = 'Regularize o pagamento para restabelecer o acesso completo.';
    return base;
  }

  // Após dia 5 do mês seguinte → bloqueio total
  base.phase = 'blocked';
  base.blocked = true;
  base.blockAdmin = true;
  base.restricted = true;
  base.message = 'Acesso suspenso por inadimplência. Regularize o pagamento para liberar o sistema.';
  base.detail = `Fatura venceu em ${fmt(dueDate)}.`;
  return base;
};

// Valor da fatura considerando mês inadimplente + mês corrente (REFCOM198 f/e)
export const getBillingDueAmount = (config?: BillingConfig | null): number => {
  if (!config) return 0;
  // Se já passou do vencimento do mês corrente, cobrar fatura atual + próxima
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), config.dueDay || 15);
  const overdue = now >= dueDate;
  return overdue ? config.value * 2 : config.value;
};
