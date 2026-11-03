import React, { useState, useEffect } from 'react';

interface Plan { id: string; name: string; price: number; }

const KEY = 'versiory_plans';

export const PlanManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    try { setPlans(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { setPlans([]); }
  }, []);

  const persist = (next: Plan[]) => { setPlans(next); localStorage.setItem(KEY, JSON.stringify(next)); };

  const add = () => {
    if (!name.trim()) return;
    persist([...plans, { id: `${Date.now()}`, name: name.trim(), price: Number(price) || 0 }]);
    setName(''); setPrice('');
  };

  const remove = (id: string) => persist(plans.filter((p) => p.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Gestão de Planos</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-24 border rounded-lg px-3 py-2" placeholder="Preço" value={price} onChange={e => setPrice(e.target.value)} />
          <button onClick={add} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Add</button>
        </div>
        <ul className="space-y-2 max-h-60 overflow-auto">
          {plans.map((p) => (
            <li key={p.id} className="flex justify-between items-center border rounded-lg p-2 text-sm">
              <span>{p.name} — R$ {p.price}</span>
              <button onClick={() => remove(p.id)} className="text-red-600">✕</button>
            </li>
          ))}
          {plans.length === 0 && <p className="text-slate-500 text-sm">Nenhum plano.</p>}
        </ul>
      </div>
    </div>
  );
};

export default PlanManagementModal;
