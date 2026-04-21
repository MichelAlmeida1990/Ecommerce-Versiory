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

            {/* ERRCOM114: Histórico de Status Timeline */}
            {(orderData.statusHistory && orderData.statusHistory.length > 0) ? (
              <div className="md:col-span-2 border-t border-slate-100 pt-6">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Acompanhamento e Histórico</p>
                <div className="space-y-4 ml-2">
                  {orderData.statusHistory.map((h, i) => (
                    <div key={i} className="flex gap-4 items-start relative">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                        <div className="w-2 h-2 bg-versiory-coral w-3 h-3 rounded-full"></div>
                      </div>
                      {i !== orderData.statusHistory!.length - 1 && <div className="absolute left-4 top-8 bottom-[-16px] w-[2px] bg-slate-100"></div>}
                      <div className="pt-1">
                        <p className="font-bold text-slate-900">{getStatusLabel(h.status as any)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(h.date).toLocaleString('pt-BR')}</p>
                        {h.notes && <p className="text-sm text-slate-600 mt-1.5 p-3 bg-slate-50 rounded-lg">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ERRCOM115: Botão WhatsApp com o Lojista */}
            <div className="md:col-span-2 border-t border-slate-100 pt-6 flex justify-center">
              <a href={`https://wa.me/5511958540171?text=Olá, gostaria de falar sobre o pedido ${orderData.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-2xl font-black transition-all shadow-lg shadow-green-500/20 active:scale-95">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Falar com o Lojista
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ERRCOM107: Selo de Site Seguro Google */}
      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
          <img
            src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
            alt="Google Safe Browsing"
            className="h-5 opacity-80"
          />
          <div className="h-4 w-px bg-slate-200"></div>
          <a
            href={`https://transparencyreport.google.com/safe-browsing/search?url=${window.location.origin}`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
          >
            🛡️ Site Seguro: Validado pelo Google
          </a>
        </div>
        <p className="text-[10px] text-slate-400 font-medium italic">Sua navegação e dados estão protegidos por criptografia de ponta a ponta.</p>
      </div>
    </div>
  );
};

export default Tracking;
