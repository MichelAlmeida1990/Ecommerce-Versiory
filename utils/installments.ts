export interface Installment {
  number: string;
  amount: number;
  status?: 'pending' | 'paid';
}

export interface InstallmentCalculationOptions {
  total: number;
  installments: number;
  cardRate?: number;
}

export const calculateInstallments = (options: InstallmentCalculationOptions): Installment[] => {
  const { total, installments, cardRate } = options;

  if (installments <= 1) {
    return [
      {
        number: '1/1',
        amount: total,
        status: 'pending'
      }
    ];
  }

  const baseAmount = total / installments;
  const rate = (cardRate || 0) / 100;

  if (rate === 0) {
    return Array.from({ length: installments }, (_, i) => ({
      number: `${i + 1}/${installments}`,
      amount: baseAmount,
      status: 'pending' as const
    }));
  }

  const result: Installment[] = [];
  let remaining = total;

  for (let i = 0; i < installments; i++) {
    if (i === 0) {
      const amount = Math.round(baseAmount * 100) / 100;
      result.push({
        number: `${i + 1}/${installments}`,
        amount,
        status: 'pending'
      });
      remaining -= amount;
    } else {
      const amount = Math.round(baseAmount * (1 + rate) * 100) / 100;
      result.push({
        number: `${i + 1}/${installments}`,
        amount,
        status: 'pending'
      });
      remaining -= amount;
    }
  }

  if (Math.abs(remaining) > 0.01 && result.length > 0) {
    result[result.length - 1].amount = Math.round((result[result.length - 1].amount + remaining) * 100) / 100;
  }

  return result;
};
