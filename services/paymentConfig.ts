import { PaymentConfig } from '../types';

const PAYMENT_CONFIG_KEY = 'versiory_payment_config';

export const getPaymentConfig = (): PaymentConfig | null => {
  const stored = localStorage.getItem(PAYMENT_CONFIG_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
};

export const savePaymentConfig = (config: PaymentConfig): void => {
  localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(config));
};

export const getDefaultPaymentConfig = (): PaymentConfig => ({
  debitRate: 1.99, // Taxa Débito (%)
  creditRate: 2.99, // Taxa Crédito à vista (%)
  installmentRates: {
    2: 3.49,
    3: 4.49,
    4: 5.49,
    5: 6.49,
    6: 7.49,
    10: 9.99
  },
  pixRate: 0.99, // Taxa PIX (%)
  anticipationRate: 1.99, // Taxa antecipação (%)
  receiptDays: 30, // Prazo de recebimento (dias)
  processors: {
    cielo: { enabled: true },
    rede: { enabled: false },
    getnet: { enabled: false },
    stone: { enabled: false }
  }
});
