import React, { useState, useEffect } from 'react';

export const UsageMetricsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [metrics, setMetrics] = useState({ orders: 0, products: 0, customers: 0 });

  useEffect(() => {
    try {
      const orders = JSON.parse(localStorage.getItem('versiory_orders') || '[]');
      const products = JSON.parse(localStorage.getItem('versiory_products') || '[]');
      const customers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
      setMetrics({ orders: orders.length, products: products.length, customers: customers.length });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Métricas de Uso</h2>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>
        <ul className="space-y-2">
          <li className="flex justify-between border rounded-lg p-3"><span>Pedidos</span><span className="font-bold">{metrics.orders}</span></li>
          <li className="flex justify-between border rounded-lg p-3"><span>Produtos</span><span className="font-bold">{metrics.products}</span></li>
          <li className="flex justify-between border rounded-lg p-3"><span>Clientes</span><span className="font-bold">{metrics.customers}</span></li>
        </ul>
      </div>
    </div>
  );
};

export default UsageMetricsModal;
