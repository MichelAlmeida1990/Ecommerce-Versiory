import React, { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  message: string;
  createdAt: number;
}

const KEY = 'versiory_announcements';

export const GlobalAnnouncementsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      setItems([]);
    }
  }, []);

  const persist = (next: Announcement[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!text.trim()) return;
    persist([{ id: `${Date.now()}`, message: text.trim(), createdAt: Date.now() }, ...items]);
    setText('');
  };

  const remove = (id: string) => persist(items.filter((i) => i.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Avisos Globais</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Mensagem do aviso" value={text} onChange={e => setText(e.target.value)} />
          <button onClick={add} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Adicionar</button>
        </div>
        <ul className="space-y-2 max-h-60 overflow-auto">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between items-center border rounded-lg p-2 text-sm">
              <span>{i.message}</span>
              <button onClick={() => remove(i.id)} className="text-red-600">✕</button>
            </li>
          ))}
          {items.length === 0 && <p className="text-slate-500 text-sm">Nenhum aviso.</p>}
        </ul>
      </div>
    </div>
  );
};

export default GlobalAnnouncementsModal;
