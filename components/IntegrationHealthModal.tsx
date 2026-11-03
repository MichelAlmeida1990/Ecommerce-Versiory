import React, { useState, useEffect } from 'react';

interface HealthStatus {
  name: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
}

export const IntegrationHealthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [statuses, setStatuses] = useState<HealthStatus[]>([]);

  useEffect(() => {
    const list: HealthStatus[] = [];
    // SMTP
    try {
      const smtp = localStorage.getItem('versiory_smtp_config');
      list.push(smtp ? { name: 'SMTP (E-mail)', status: 'ok', detail: 'Configurado' } : { name: 'SMTP (E-mail)', status: 'warn', detail: 'Não configurado' });
    } catch {
      list.push({ name: 'SMTP (E-mail)', status: 'error', detail: 'Erro ao ler' });
    }
    // Payment
    try {
      const pay = localStorage.getItem('versiory_payment_config');
      list.push(pay ? { name: 'Pagamento', status: 'ok', detail: 'Configurado' } : { name: 'Pagamento', status: 'warn', detail: 'Não configurado' });
    } catch {
      list.push({ name: 'Pagamento', status: 'error', detail: 'Erro ao ler' });
    }
    // Mercado Livre token
    try {
      const ml = localStorage.getItem('versiory_ml_token');
      list.push(ml ? { name: 'Mercado Livre', status: 'ok', detail: 'Token presente' } : { name: 'Mercado Livre', status: 'warn', detail: 'Sem token' });
    } catch {
      list.push({ name: 'Mercado Livre', status: 'error', detail: 'Erro ao ler' });
    }
    // Shopee token
    try {
      const sh = localStorage.getItem('versiory_shopee_token');
      list.push(sh ? { name: 'Shopee', status: 'ok', detail: 'Token presente' } : { name: 'Shopee', status: 'warn', detail: 'Sem token' });
    } catch {
      list.push({ name: 'Shopee', status: 'error', detail: 'Erro ao ler' });
    }
    setStatuses(list);
  }, []);

  const color = (s: HealthStatus['status']) => s === 'ok' ? 'text-green-600' : s === 'warn' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Saúde das Integrações</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <ul className="space-y-2">
          {statuses.map((s) => (
            <li key={s.name} className="flex justify-between items-center border rounded-lg p-3">
              <span className="font-medium">{s.name}</span>
              <span className={color(s.status)}>{s.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IntegrationHealthModal;
