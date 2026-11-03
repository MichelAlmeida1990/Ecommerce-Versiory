import React, { useState } from 'react';

export const SupportToolsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');

  const clearCache = () => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('versiory_cache_')) localStorage.removeItem(k);
      });
      setResult('Cache limpo.');
    } catch {
      setResult('Erro ao limpar cache.');
    }
  };

  const search = () => {
    setResult(`Busca por "${query}" — funcionalidade em desenvolvimento.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Ferramentas de Suporte</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <div className="space-y-2">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Busca global" value={query} onChange={e => setQuery(e.target.value)} />
          <button onClick={search} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Buscar</button>
        </div>
        <button onClick={clearCache} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm">Limpar cache</button>
        {result && <p className="text-sm text-slate-600">{result}</p>}
      </div>
    </div>
  );
};

export default SupportToolsModal;
