import React, { useState } from 'react';
import { getTrackingItem, getOrder } from '../services/firebase';
import { TrackingItem, Order } from '../types';

const Tracking: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingItem | null>(null);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setTrackingData(null);
    setOrderData(null);

    try {
      // Tentar buscar o rastreamento primeiro
      const tracking = await getTrackingItem(orderId.trim());
      if (tracking) {
        setTrackingData(tracking);
        // Se achou rastreio, busca o pedido para mostrar dados básicos
        const order = await getOrder(orderId.trim());
        if (order) setOrderData(order);
      } else {
        // Se não tem rastreio, verifica se o pedido existe
        const order = await getOrder(orderId.trim());
        if (order) {
          setOrderData(order);
          setError('Pedido encontrado, mas o rastreamento ainda não foi postado.');
        } else {
          setError('Pedido não encontrado. Verifique o código informado.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao buscar o rastreamento.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: TrackingItem['status']) => {
    const labels: Record<string, string> = {
      posted: 'Postado',
      in_transit: 'Em Trânsito',
      out_for_delivery: 'Saiu para Entrega',
      delivered: 'Entregue',
      delayed: 'Atrasado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: TrackingItem['status']) => {
    const colors: Record<string, string> = {
      posted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      delayed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Rastrear Pedido</h1>
        <p className="text-lg text-slate-600">Insira o código do seu pedido para acompanhar a entrega.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Ex: ORD-123456789"
            className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-versiory-coral outline-none text-lg font-medium transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Rastrear'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-center font-medium animate-in fade-in duration-300">
          {error}
        </div>
      )}

      {orderData && (
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-8 border-b border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Pedido</p>
              <h2 className="text-2xl font-black text-slate-900">{orderData.id}</h2>
            </div>
            {trackingData && (
              <div className={`px-6 py-2 rounded-full font-bold text-sm ${getStatusColor(trackingData.status)}`}>
                {getStatusLabel(trackingData.status)}
              </div>
            )}
            {!trackingData && (
              <div className="px-6 py-2 rounded-full font-bold text-sm bg-yellow-100 text-yellow-800">
                Aguardando Postagem
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Detalhes da Entrega</p>
                <p className="text-slate-900 font-medium leading-relaxed">{orderData.address}</p>
                <p className="text-slate-500 text-sm mt-2">Previsão: {orderData.estimatedDelivery || '5 a 10 dias úteis'}</p>
              </div>

              {trackingData && (
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Transportadora / Código</p>
                  <p className="text-slate-900 font-bold">{trackingData.carrier}</p>
                  <p className="text-versiory-coral font-black mt-1">{trackingData.code}</p>
                  <p className="text-xs text-slate-400 mt-2">Última atualização: {new Date(trackingData.lastUpdate).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Resumo dos Itens</p>
              {orderData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">Qtd: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracking;
