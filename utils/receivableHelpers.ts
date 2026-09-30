// REFCOM223/224/225/229: Helpers compartilhados do tratamento de vendas
// nas etapas Contas a Receber -> Transações Recentes.

import { Order } from '../types';

export const RECEIVABLE_STATUSES = ['open', 'paid', 'overdue'] as const;

/** Formas de pagamento aceitas na baixa (exatamente as exibidas nos selects do sistema). */
export const FINALIZADORAS = ['Dinheiro', 'PIX', 'Débito', 'Crédito'] as const;
export type Finalizadora = (typeof FINALIZADORAS)[number];

/**
 * Converte o paymentMethod bruto do pedido (dinheiro, pix, debito, credito, whatsapp...)
 * para a nomenclatura de finalizadora usada nas baixas.
 */
export const toFinalizadora = (raw?: string | null): Finalizadora | null => {
  const v = (raw || '').trim().toLowerCase();
  if (!v) return null;
  if (v === 'dinheiro') return 'Dinheiro';
  if (v === 'pix') return 'PIX';
  if (v === 'debito' || v === 'débito') return 'Débito';
  if (v === 'credito' || v === 'crédito') return 'Crédito';
  return null;
};

/** Rótulos de canal em português (exibidos no detalhe do lançamento). */
export const CHANNEL_LABELS: Record<string, string> = {
  physical: 'PDV Loja',
  online: 'E-commerce',
  whatsapp: 'WhatsApp',
};

export const channelLabel = (channel?: string | null, fallback?: string | null): string => {
  if (channel && CHANNEL_LABELS[channel]) return CHANNEL_LABELS[channel];
  const raw = (channel || fallback || '').toString().toLowerCase();
  if (CHANNEL_LABELS[raw]) return CHANNEL_LABELS[raw];
  if (raw === 'physical') return 'PDV Loja';
  if (raw === 'online') return 'E-commerce';
  return '-';
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Divide o valor total do pedido em N parcelas, garantindo que a soma
 * das parcelas seja exatamente igual ao total (diferença de centavos fica na última).
 */
export const splitInstallments = (total: number, installments: number): number[] => {
  const n = Math.max(1, Math.floor(installments || 1));
  if (n === 1) return [+total.toFixed(2)];
  const base = Math.floor((total / n) * 100) / 100;
  const rest = +(total - base * (n - 1)).toFixed(2);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? rest : base));
};

/** Datas de vencimento: 1ª parcela para hoje, demais somando meses. */
export const installmentDueDates = (installments: number, today = new Date()): string[] => {
  return Array.from({ length: Math.max(1, installments) }, (_, i) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + i);
    return d.toISOString().slice(0, 10);
  });
};

export interface ReceivableDraft {
  description: string;
  amount: number;
  dueDate: string;
  installmentNumber?: string;
}

/**
 * REFCOM223/224/225/229: Monta os lançamentos interdependentes de um pedido
 * (um por parcela) e um `installmentDetails` compatível com o pedido.
 */
export const buildInstallmentPlan = (order: Order): { drafts: ReceivableDraft[]; details: { id: string; number: string; amount: number; status: 'pending'; paymentMethod?: string }[] } => {
  const totalInstallments = order.installments && order.installments > 1 ? order.installments : 1;
  const amounts = splitInstallments(order.total, totalInstallments);
  const dates = installmentDueDates(totalInstallments);
  const method = toFinalizadora(order.paymentMethod) || undefined;

  const details = amounts.map((amount, i) => ({
    id: `${order.id}-inst-${i + 1}`,
    number: `${i + 1}/${totalInstallments}`,
    amount,
    status: 'pending' as const,
    paymentMethod: method,
  }));

  const drafts: ReceivableDraft[] = amounts.map((amount, i) => ({
    description:
      totalInstallments > 1
        ? `Pedido ${order.id} - Parcela ${i + 1}/${totalInstallments}`
        : `Pedido ${order.id} - ${channelLabel(order.salesChannel)}`,
    amount,
    dueDate: dates[i],
    installmentNumber: `${i + 1}/${totalInstallments}`,
  }));

  return { drafts, details };
};
