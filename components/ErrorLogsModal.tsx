import React, { useState, useEffect } from 'react';
import { getErrorLogs, clearErrorLogs, ErrorLog } from '../utils/errorLogger';

export const ErrorLogsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);

  useEffect(() => {
    setLogs(getErrorLogs());
  }, []);

  const handleClear = () => {
    clearErrorLogs();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Logs de Erro (Frontend)</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <div className="flex justify-end">
          <button onClick={handleClear} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm">Limpar</button>
        </div>
        {logs.length === 0 ? (
          <p className="text-slate-500">Nenhum erro registrado.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="border rounded-lg p-3 text-sm">
                <div className="font-bold text-red-600">{l.message}</div>
                <div className="text-xs text-slate-500">{new Date(l.timestamp).toLocaleString()} · {l.source}</div>
                {l.stack && <pre className="text-xs mt-1 whitespace-pre-wrap break-all">{l.stack}</pre>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ErrorLogsModal;
