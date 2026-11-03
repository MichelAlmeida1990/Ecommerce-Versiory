import React, { useState } from 'react';

const INTEGRATIONS = ['Mercado Livre', 'Shopee', 'Pagamento', 'SMTP', 'WhatsApp'];

export const MarketplaceIntegrationsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('versiory_integrations') || '{}');
    } catch {
      return {};
    }
  });

  const toggle = (name: string) => {
    const next = { ...enabled, [name]: !enabled[name] };
    setEnabled(next);
    localStorage.setItem('versiory_integrations', JSON.stringify(next));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Marketplace de Integrações</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <ul className="space-y-2">
          {INTEGRATIONS.map((name) => (
            <li key={name} className="flex justify-between items-center border rounded-lg p-3">
              <span>{name}</span>
              <button
                onClick={() => toggle(name)}
                className={`px-3 py-1 rounded-lg text-sm text-white ${enabled[name] ? 'bg-green-600' : 'bg-slate-400'}`}
              >
                {enabled[name] ? 'Ativo' : 'Inativo'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MarketplaceIntegrationsModal;
