import React, { useState, useEffect } from 'react';
import { Order, Customer, Product } from '../types';
import DanfePreview from './DanfePreview';

interface CustomerOrdersProps {
  customerEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ customerEmail, isOpen, onClose }) => {
  const [orders, setOrders] = useState<(Order & { emitNF?: boolean })[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { emitNF?: boolean }) | null>(null);
  const [isPreviewingDanfe, setIsPreviewingDanfe] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && customerEmail) {
      loadOrders();
    }
  }, [isOpen, customerEmail]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { getOrders, getProducts } = await import('../services/firebase');
      const allOrders = await getOrders();
      const customerOrders = allOrders.filter((order) => order.customerEmail === customerEmail);
      const products = await getProducts();

      // Enriquecer pedidos com dados dos produtos
      customerOrders.forEach(order => {
        order.items.forEach(item => {
          if (!item.name || !item.image) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              if (!item.name) item.name = product.name;
              if (!item.image) item.image = product.image;
              if (!item.description) item.description = product.description;
            }
          }
        });
      });

      customerOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(customerOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
    }
    setLoading(false);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Aguardando Pagamento', color: 'text-amber-600', bg: 'bg-amber-50', icon: '🕒' },
      paid: { label: 'Pagamento Confirmado', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
      processing: { label: 'Processando', color: 'text-blue-600', bg: 'bg-blue-50', icon: '📦' },
      shipped: { label: 'Em Trânsito', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '🚚' },
      delivered: { label: 'Entregue', color: 'text-slate-600', bg: 'bg-slate-50', icon: '🏠' },
      cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50', icon: '❌' }
    };
    return configs[status as keyof typeof configs] || { label: status, color: 'text-slate-600', bg: 'bg-slate-50', icon: '📄' };
  };

  const trackOrder = (code: string) => {
    window.open(`https://www.linkcorreios.com.br/?id=${code}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[40px] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/40">
          <div>
            <h3 className="text-3xl font-black text-slate-900 leading-none">Meus <span className="text-versiory-coral">Pedidos</span></h3>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">{orders.length} pedidos realizados</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-versiory-coral border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Sincronizando com a nuvem...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
              <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Sem pedidos por aqui</h3>
              <p className="text-slate-500 font-medium mb-8">Parece que você ainda não realizou nenhuma compra conosco.</p>
              <button onClick={onClose} className="bg-versiory-ink text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-black/10 hover:scale-105 transition-all">Explorar Coleção</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders.map((order, idx) => {
                const config = getStatusConfig(order.status);
                return (
                  <div
                    key={order.id}
                    className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-versiory-coral/20 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 animate-in slide-in-from-bottom-8"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {order.id}
                          </span>
                          <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                            <span>{config.icon}</span> {config.label}
                          </span>
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Order Items Preview - More expressive like big stores */}
                        <div className="space-y-4 mb-6">
                          {order.items.slice(0, 3).map((item, iidx) => (
                            <div key={iidx} className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                <img src={item.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate">{item.name || 'Produto Versiory'}</p>
                                <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mb-1">{item.description || 'Nenhuma descrição disponível'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.quantity} unidade(s) • R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs font-black text-versiory-coral mt-2">+ {order.items.length - 3} outros itens neste pedido</p>
                          )}
                        </div>
                      </div>

                      <div className="md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                          <p className="text-3xl font-black text-slate-900 leading-tight">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div className="space-y-3 mt-8">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-full bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-900 p-4 rounded-2xl font-black text-sm transition-all"
                          >
                            Detalhes do Pedido
                          </button>
                          {order.trackingCode && (
                            <button
                              onClick={() => trackOrder(order.trackingCode!)}
                              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                            >
                              🚚 Rastrear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DETALHES DO PEDIDO OVERLAY (REFINED AMERICANAS STYLE) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h4 className="text-2xl font-black text-slate-900">Pedido <span className="text-versiory-coral">{selectedOrder.id}</span></h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Realizado em {new Date(selectedOrder.date).toLocaleDateString('pt-BR')} às {new Date(selectedOrder.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Visual Order Progress Bar */}
              <div className="relative px-4 pt-4 pb-8 border-b border-slate-50 mb-4">
                <div className="flex justify-between relative z-10">
                  {['pending', 'paid', 'processing', 'shipped', 'delivered'].map((step, sidx) => {
                    const steps = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
                    const currentIndex = steps.indexOf(selectedOrder.status);
                    const isCompleted = steps.indexOf(step) <= currentIndex;
                    const isCurrent = step === selectedOrder.status;

                    return (
                      <div key={step} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'
                          } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                          {isCompleted ? '✓' : sidx + 1}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter text-center max-w-[60px] ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                          {getStatusConfig(step).label}
                        </span>
                      </div>
                    );
                  })}
                  {/* Progress Line */}
                  <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 -z-10">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${(Math.max(0, ['pending', 'paid', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status)) / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pending Payment Alert */}
              {selectedOrder.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">💳</div>
                    <div className="flex-1">
                      <h5 className="font-black text-amber-900 text-lg leading-none mb-2">Aguardando seu Pagamento</h5>
                      <p className="text-amber-700 text-xs font-medium mb-4 leading-relaxed">Seu pedido foi reservado, mas só será processado após a confirmação do pagamento no sistema.</p>
                      <button
                        onClick={() => {
                          const itemsList = selectedOrder.items.map(item =>
                            `• ${item.name} x${item.quantity} - R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          ).join('\n');

                          const message = [
                            `🛒 *PAGAMENTO PENDENTE - ${selectedOrder.id}*`,
                            '',
                            '*ITENS DO PEDIDO:*',
                            itemsList,
                            '',
                            `*TOTAL: R$ ${selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
                            '',
                            'Olá! Gostaria de finalizar o pagamento deste pedido. Quais são as chaves PIX ou próximos passos?'
                          ].join('\n');

                          const url = `https://wa.me/5511958540171?text=${encodeURIComponent(message)}`;
                          window.open(url, '_blank');
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-200 transition-all active:scale-95"
                      >
                        Finalizar Pagamento Agora
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Logística e Entrega</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatário</p>
                        <p className="text-sm font-black text-slate-900 mt-1">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</p>
                        <p className="text-sm font-bold text-slate-600 leading-relaxed mt-1">
                          {localStorage.getItem('versiory_user') ? JSON.parse(localStorage.getItem('versiory_user')!).address : 'Endereço registrado no pedido.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Financeiro</h4>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                      <div className="flex justify-between items-center text-slate-400 uppercase text-[9px] font-black tracking-widest">
                        <span>Soma dos Itens</span>
                        <span className="text-white">R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 uppercase text-[9px] font-black tracking-widest">
                        <span>Taxa de Entrega</span>
                        <span className="text-emerald-400">Cortesia Grátis</span>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                        <span className="text-[10px] font-black uppercase tracking-widest">Valor do Pedido</span>
                        <span className="text-3xl font-black">R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Produtos Adquiridos</h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-6 group">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                        <img src={item.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h5 className="font-black text-slate-900 text-lg leading-tight mb-1">{item.name || 'Produto Versiory'}</h5>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3 leading-relaxed">{item.description || 'Este item foi selecionado em nossa coleção premium.'}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 uppercase tracking-widest">Qtd: {item.quantity}</span>
                          <span className="font-black text-2xl text-versiory-ink">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-3 w-full md:w-auto">
                  {selectedOrder.emitNF && selectedOrder.status === 'paid' && (
                    <button
                      onClick={() => setIsPreviewingDanfe(true)}
                      className="flex-1 md:flex-none border-2 border-slate-200 hover:border-versiory-ink text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Ver Nota Fiscal
                    </button>
                  )}
                  {selectedOrder.emitNF && selectedOrder.status !== 'paid' && (
                    <div className="flex-1 md:flex-none bg-slate-100 text-slate-400 px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest text-center flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed">
                      🕒 NF Disponível após Confirmação
                    </div>
                  )}
                  {selectedOrder.trackingCode && (
                    <button
                      onClick={() => trackOrder(selectedOrder.trackingCode!)}
                      className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-105 transition-all"
                    >
                      Rastrear Entrega
                    </button>
                  )}
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-full md:w-auto px-8 py-4 font-black text-slate-400 hover:text-slate-900 transition-colors uppercase text-[10px] tracking-widest">
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NF-e (DANFE) Preview Modal */}
      {isPreviewingDanfe && selectedOrder && (
        <DanfePreview
          order={selectedOrder}
          customer={{
            id: selectedOrder.customerId || 0,
            name: selectedOrder.customerName || '',
            email: selectedOrder.customerEmail,
            phone: '',
            addresses: [],
            totalOrders: 0,
            totalSpent: 0,
            createdAt: '',
            orderHistory: []
          }}
          onClose={() => setIsPreviewingDanfe(false)}
        />
      )}
    </div>
  );
};

export default CustomerOrders;
