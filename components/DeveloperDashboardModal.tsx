import React, { useState, useEffect } from 'react';

export const DeveloperDashboardModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stats, setStats] = useState({ mrr: 0, arr: 0, active: 0, trial: 0, suspended: 0 });

  useEffect(() => {
    try {
      const tenants = JSON.parse(localStorage.getItem('versiory_tenants') || '[]');
      const active = tenants.filter((t: any) => t.status === 'active');
      const trial = tenants.filter((t: any) => t.status === 'trial');
      const suspended = tenants.filter((t: any) => t.status === 'suspended');
      const mrr = active.reduce((s: number, t: any) => s + (t.monthlyValue || 0), 0);
      setStats({ mrr, arr: mrr * 12, active: active.length, trial: trial.length, suspended: suspended.length });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Dashboard do Developer</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <ul className="space-y-2">
          <li className="flex justify-between border rounded-lg p-3"><span>MRR</span><span className="font-bold">R$ {stats.mrr.toFixed(2)}</span></li>
          <li className="flex justify-between border rounded-lg p-3"><span>ARR</span><span className="font-bold">R$ {stats.arr.toFixed(2)}</span></li>
          <li className="flex justify-between border rounded-lg p-3"><span>Lojas ativas</span><span className="font-bold">{stats.active}</span></li>
          <li className="flex justify-between border rounded-lg p-3"><span>Em trial</span><span className="font-bold">{stats.trial}</span></li>
          <li className="flex justify-between border rounded-lg p-3"><span>Suspensas</span><span className="font-bold">{stats.suspended}</span></li>
        </ul>
      </div>
    </div>
  );
};

export default DeveloperDashboardModal;
