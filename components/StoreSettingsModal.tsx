import React, { useState } from 'react';

interface StoreSettings {
  name: string;
  logoUrl: string;
  domain: string;
  timezone: string;
  currency: string;
}

const DEFAULT: StoreSettings = {
  name: '',
  logoUrl: '',
  domain: '',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
};

export const StoreSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('versiory_store_settings');
      return saved ? JSON.parse(saved) : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  const save = () => {
    localStorage.setItem('versiory_store_settings', JSON.stringify(settings));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Configurações da Loja</h2>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Nome da loja" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="URL do logo" value={settings.logoUrl} onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Domínio" value={settings.domain} onChange={e => setSettings({ ...settings, domain: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Fuso horário" value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Moeda" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })} />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancelar</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsModal;
