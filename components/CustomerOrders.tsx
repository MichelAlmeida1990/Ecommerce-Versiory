import React, { useState, useEffect } from 'react';
import { Order, Customer, Product } from '../types';
import DanfePreview from './DanfePreview';
import { fetchAddressByCep } from '../services/cep';

interface CustomerOrdersProps {
  customerEmail: string;
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string; // ERRCOM084
}

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ customerEmail, isOpen, onClose, initialOrderId }) => {
  const [orders, setOrders] = useState<(Order & { emitNF?: boolean })[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { emitNF?: boolean }) | null>(null);
  const [isPreviewingDanfe, setIsPreviewingDanfe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    id: '',
    country: 'Brasil',
    type: 'shipping' as const
  });
  const [loadingCep, setLoadingCep] = useState(false);

  const canCancelOrder = (order: Order) => {
    if (order.status === 'cancelled' || order.status === 'delivered') return false;
    const orderDate = new Date(order.date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const openCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    if (!cancelReason.trim()) {
      alert('⚠️ Por favor, informe o motivo do cancelamento.');
      return;
    }

    if (cancelReason.trim().length < 10) {
      alert('⚠️ O motivo deve ter pelo menos 10 caracteres.');
      return;
    }

    setIsCancelling(true);
    try {
      const { saveOrder, getProducts, saveProduct, saveInventoryMovement } = await import('../services/firebase');

      // Atualizar status do pedido com motivo do cancelamento
      const updatedOrder = {
        ...orderToCancel,
        status: 'cancelled' as const,
        notes: `CANCELADO PELO CLIENTE: ${cancelReason.trim()}${orderToCancel.notes ? '\n\n' + orderToCancel.notes : ''}`,
        cancelledAt: new Date().toISOString(),
        cancelReason: cancelReason.trim()
      };
      await saveOrder(updatedOrder);

      // Devolver estoque e registrar movimentação
      const products = await getProducts();
      for (const item of orderToCancel.items) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.category !== 'Serviços') { // ERRCOM104: Não estornar estoque de serviços
          const previousStock = product.stock || 0;
          const newStock = previousStock + item.quantity;

          // Atualizar estoque
          await saveProduct({ ...product, stock: newStock });

          // Registrar movimentação de estoque
          const movement = {
            id: Date.now() + item.productId,
            productId: item.productId,
            productName: item.name || product.name,
            type: 'in' as const,
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Devolução - Pedido ${orderToCancel.id} cancelado pelo cliente`,
            date: new Date().toISOString(),
            user: customerEmail
          };
          await saveInventoryMovement(movement);
        }
      }

      // Atualizar lista local
      setOrders(orders.map(o => o.id === orderToCancel.id ? updatedOrder : o));
      setSelectedOrder(null);
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason('');

      alert('✅ Pedido cancelado com sucesso!\n\nO estoque foi devolvido e o valor será estornado conforme política da loja.');
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert('❌ Erro ao cancelar pedido. Tente novamente.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!selectedOrder) return;

    if (!addressForm.zipCode || !addressForm.street || !addressForm.number || !addressForm.city || !addressForm.state) {
      alert('⚠️ Por favor, preencha todos os campos obrigatórios do endereço.');
      return;
    }

    setIsUpdatingAddress(true);
    try {
      const { saveOrder } = await import('../services/firebase');
      const formattedAddress = `${addressForm.street}, ${addressForm.number}${addressForm.complement ? ' - ' + addressForm.complement : ''}, ${addressForm.neighborhood}, ${addressForm.city} - ${addressForm.state}, CEP: ${addressForm.zipCode}`;

      const updatedOrder = {
        ...selectedOrder,
        address: formattedAddress
      };

      await saveOrder(updatedOrder);

      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      setIsEditingAddress(false);
      alert('✅ Endereço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      alert('❌ Erro ao atualizar endereço. Tente novamente.');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleCepBlur = async () => {
    if (addressForm.zipCode.length >= 8) {
      setLoadingCep(true);
      try {
        const data = await fetchAddressByCep(addressForm.zipCode);
        if (data) {
          setAddressForm(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const startEditingAddress = () => {
    if (!selectedOrder) return;

    // Tentar extrair os dados do endereço formatado
    const addressString = selectedOrder.address || '';
    const cepMatch = addressString.match(/CEP:\s?(\d{5}-?\d{3})/i);
    const streetMatch = addressString.match(/^([^,]+),?\s*(\d+)?/); // Rua, Número
    const neighborhoodMatch = addressString.match(/-\s*([^,]+),\s*([^,]+)\/([A-Z]{2})/); // Bairro, Cidade/UF

    setAddressForm({
      zipCode: cepMatch ? cepMatch[1] : '',
      street: streetMatch ? streetMatch[1].trim() : '',
      number: streetMatch && streetMatch[2] ? streetMatch[2].trim() : '',
      complement: addressString.match(/complemento:\s*([^,]+)/i)?.[1] || '', // Assuming complement is explicitly mentioned
      neighborhood: addressString.match(/-\s*([^,]+),\s*[^,]+\/[A-Z]{2}/i)?.[1] || '',
      city: addressString.match(/,\s*([^,]+)\s*-\s*[A-Z]{2}/i)?.[1] || '',
      state: addressString.match(/([A-Z]{2})\s*,\s*CEP/i)?.[1] || '',
      id: selectedOrder.id, // Use order ID as address ID for now
      country: 'Brasil',
      type: 'shipping'
    });

    setIsEditingAddress(true);
  };

  useEffect(() => {
    if (isOpen && customerEmail) {
      loadOrders();
    }
  }, [isOpen, customerEmail]);

  // ERRCOM084: Auto-select order if initialOrderId is provided
  useEffect(() => {
    if (isOpen && initialOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === initialOrderId);
      if (found) {
        setSelectedOrder(found);
      }
    }
  }, [isOpen, initialOrderId, orders]);

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
      cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
      returned: { label: 'Devolvido', color: 'text-purple-600', bg: 'bg-purple-50', icon: '🔄' },
      budget: { label: 'Orçamento', color: 'text-slate-500', bg: 'bg-slate-100', icon: '📝' }
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
                          {order.trackingCode && (
                            <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100">
                              <span className="text-[10px] font-black uppercase tracking-widest">🚚 {order.carrier || 'Correios'}: {order.trackingCode}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 mb-6">
                          {order.items.slice(0, 3).map((item, iidx) => (
                            <button
                              key={iidx}
                              onClick={() => setSelectedOrder(order)}
                              className="flex items-center gap-4 w-full text-left hover:bg-slate-50 p-2 rounded-2xl transition-all group"
                            >
                              <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <img src={item.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate group-hover:text-versiory-coral transition-colors">{item.name || 'Produto Versiory'}</p>
                                <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mb-1">{item.description || 'Nenhuma descrição disponível'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  {item.quantity} unidade(s) • R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  {item.selectedSize && ` • Tam: ${item.selectedSize}`}
                                  {item.selectedColor && ` • Cor: ${item.selectedColor}`}
                                </p>
                              </div>
                              <svg className="w-5 h-5 text-slate-300 group-hover:text-versiory-coral transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
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
                          {canCancelOrder(order) && (
                            <button
                              onClick={() => openCancelModal(order)}
                              disabled={isCancelling}
                              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ❌ Cancelar Pedido
                            </button>
                          )}
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
                  Realizado em {new Date(selectedOrder.date).toLocaleDateString('pt-BR')} às {selectedOrder.orderTime || new Date(selectedOrder.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                      <p className="text-amber-700 text-xs font-medium mb-4 leading-relaxed">Seu pedido foi reservado, mas só será processado após a confirmação do pagamento no sistema e disponibilidade em estoque.</p>
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
                            'Olá! Gostaria de finalizar o pagamento deste pedido, poderia verificar se ainda tem em estoque, quais são as formas de pagamento e os próximos passos?'
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

              {/* ERRCOM094: Alerta especial para status de devolução */}
              {selectedOrder.status === 'returned' && (
                <div className="bg-purple-50 border border-purple-200 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🔄</div>
                    <div className="flex-1">
                      <h5 className="font-black text-purple-900 text-lg leading-none mb-2">Devolução em Processamento</h5>
                      <p className="text-purple-700 text-xs font-medium mb-4 leading-relaxed">
                        Sua devolução foi registrada e está sendo processada. A equipe de suporte entrará em contato em até 48h úteis com os próximos passos.
                      </p>
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <p className="text-purple-800 text-xs font-medium">
                          <strong>Protocolo:</strong> {selectedOrder.id}-DEV<br />
                          <strong>Status:</strong> Aguardando análise da devolução<br />
                          <strong>Previsão:</strong> Até 48h úteis
                        </p>
                      </div>
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
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</p>
                          {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid' || selectedOrder.status === 'processing') && (
                            <button
                              onClick={startEditingAddress}
                              className="text-[10px] font-bold text-versiory-coral hover:underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-600 leading-relaxed">
                          {selectedOrder.address || 'Endereço registrado no pedido.'}
                        </p>
                      </div>
                      {selectedOrder.estimatedDelivery && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Estimado</p>
                          <p className="text-sm font-black text-slate-900 mt-1">
                            <img src="/api/placeholder/16/16" alt="" className="w-4 h-4 inline mr-1" />
                            {selectedOrder.estimatedDelivery}
                          </p>
                        </div>
                      )}

                      {/* ERRCOM023: Seção de Rastreamento */}
                      {selectedOrder.trackingCode && (
                        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                          <h5 className="font-black text-blue-900 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="text-lg">Track</span> Rastreamento da Entrega
                          </h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-700">Transportadora:</span>
                              <span className="text-xs font-black text-blue-900">{selectedOrder.carrier || 'Correios'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-700">Código:</span>
                              <span className="text-xs font-black text-blue-900 font-mono">{selectedOrder.trackingCode}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-700">Status:</span>
                              <span className="text-xs font-black text-green-600">Em trânsito</span>
                            </div>
                          </div>
                          <button
                            onClick={() => trackOrder(selectedOrder.trackingCode!)}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            Rastrear no Site da Transportadora
                          </button>
                        </div>
                      )}

                      {/* ERRCOM101: Histórico de Status */}
                      {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                        <div className="mt-6">
                          <h5 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Histórico do Pedido</h5>
                          <div className="space-y-4">
                            {selectedOrder.statusHistory.map((entry, hidx) => (
                              <div key={hidx} className="flex gap-4 relative">
                                {hidx < selectedOrder.statusHistory!.length - 1 && (
                                  <div className="absolute left-[11px] top-6 bottom-[-20px] w-0.5 bg-slate-100"></div>
                                )}
                                <div className="mt-1 w-6 h-6 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                  <div className={`w-2 h-2 rounded-full ${hidx === selectedOrder.statusHistory!.length - 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                </div>
                                <div className="flex-1 pb-2">
                                  <div className="flex justify-between items-start">
                                    <p className="text-xs font-black text-slate-900">{getStatusConfig(entry.status as any).label}</p>
                                    <p className="text-[9px] font-bold text-slate-400">{new Date(entry.date).toLocaleDateString('pt-BR')} às {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  {entry.notes && <p className="text-[10px] text-slate-500 mt-1 italic">"{entry.notes}"</p>}
                                </div>
                              </div>
                            )).reverse()}
                          </div>
                        </div>
                      )}
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
                      {/* REFCOM135: Exibir informações de parcelamento */}
                      {selectedOrder.paymentMethod === 'credito' && selectedOrder.installments && selectedOrder.installments > 1 && (
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">💳 Parcelamento</span>
                            <span className="text-xs font-bold text-blue-300">{selectedOrder.installments}x de R$ {(selectedOrder.total / selectedOrder.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {selectedOrder.installmentDetails && (
                            <div className="space-y-2">
                              {selectedOrder.installmentDetails.map((inst, i) => (
                                <div key={i} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg">
                                  <span className="text-slate-300">Parcela {inst.number}</span>
                                  <span className="font-bold text-white">R$ {inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  {inst.status === 'paid' && <span className="text-[9px] text-emerald-400 font-black ml-2">PAGA</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Produtos Adquiridos</h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-6 group w-full text-left bg-slate-50 p-4 rounded-3xl transition-all"
                    >
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white border border-slate-100 flex-shrink-0">
                        <img src={item.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover transition-transform duration-700" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h5 className="font-black text-slate-900 text-lg leading-tight mb-1 group-hover:text-versiory-coral transition-colors">{item.name || 'Produto Versiory'}</h5>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3 leading-relaxed whitespace-pre-wrap">{item.description || 'Este item foi selecionado em nossa coleção premium.'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs font-black bg-white border border-slate-100 px-4 py-1.5 rounded-full text-slate-600 uppercase tracking-widest">Qtd: {item.quantity}</span>
                          {item.selectedSize && <span className="text-xs font-black bg-white border border-slate-100 px-4 py-1.5 rounded-full text-slate-600 uppercase tracking-widest">Tam: {item.selectedSize}</span>}
                          {item.selectedColor && <span className="text-xs font-black bg-white border border-slate-100 px-4 py-1.5 rounded-full text-slate-600 uppercase tracking-widest">Cor: {item.selectedColor}</span>}
                          <span className="font-black text-2xl text-versiory-ink ml-auto">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                  {canCancelOrder(selectedOrder) && (
                    <button
                      onClick={() => openCancelModal(selectedOrder)}
                      disabled={isCancelling}
                      className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      ❌ Cancelar Pedido
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const { generateReceiptHTML } = await import('../utils/receiptGenerator');
                      const receiptContent = generateReceiptHTML({
                        orderId: selectedOrder.id,
                        date: new Date(selectedOrder.date).toLocaleDateString('pt-BR'),
                        orderTime: selectedOrder.orderTime || new Date(selectedOrder.date).toLocaleTimeString('pt-BR'),
                        customerName: selectedOrder.customerName,
                        customerEmail: selectedOrder.customerEmail,
                        customerAddress: selectedOrder.address,
                        customerPhone: selectedOrder.customerPhone,
                        customerCpfCnpj: selectedOrder.customerCpfCnpj,
                        items: selectedOrder.items as any,
                        total: selectedOrder.total,
                        paymentMethod: selectedOrder.paymentMethod,
                        salesChannel: selectedOrder.salesChannel || 'online',
                        installments: selectedOrder.installments, // REFCOM135.2
                        installmentDetails: selectedOrder.installmentDetails, // REFCOM135.2
                        discountAmount: selectedOrder.discountAmount, // REFCOM151
                        discountType: selectedOrder.discountType, // REFCOM151
                        couponCode: selectedOrder.couponCode // REFCOM151
                      });
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(receiptContent);
                        printWindow.document.close();
                      }
                    }}
                    className="flex-1 md:flex-none border-2 border-slate-200 hover:border-versiory-ink text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    📄 Baixar Recibo
                  </button>
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
                  <button
                    onClick={() => {
                      const message = [
                        `🆘 *SUPORTE AO PEDIDO - ${selectedOrder.id}*`,
                        '',
                        `Olá! Preciso de ajuda com meu pedido.`,
                        `Status Atual: ${getStatusConfig(selectedOrder.status).label}`,
                        '',
                        `*DETALHE O PROBLEMA:*`,
                        '...'
                      ].join('\n');
                      const url = `https://wa.me/5511958540171?text=${encodeURIComponent(message)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 md:flex-none border-2 border-green-200 hover:border-green-500 text-green-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    💬 Suporte WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const itemsList = selectedOrder.items.map(item =>
                        `• ${item.name} x${item.quantity}`
                      ).join('\n');
                      const message = [
                        `📦 *DÚVIDA SOBRE PEDIDO - ${selectedOrder.id}*`,
                        '',
                        `*DETALHES:*`,
                        `Status: ${getStatusConfig(selectedOrder.status).label}`,
                        `Total: R$ ${selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        '',
                        `*ITENS:*`,
                        itemsList,
                        '',
                        'Olá! Gostaria de falar sobre este pedido específico. Pode me ajudar?'
                      ].join('\n');
                      window.open(`https://wa.me/5511958540171?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="flex-1 md:flex-none bg-emerald-50 text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    ℹ️ Falar do Pedido
                  </button>
                  <button
                    onClick={() => {
                      const itemsList = selectedOrder.items.map(item =>
                        `• ${item.name} x${item.quantity}`
                      ).join('\n');
                      const message = [
                        `📦 *DÚVIDA SOBRE PEDIDO - ${selectedOrder.id}*`,
                        '',
                        `*DETALHES:*`,
                        `Status: ${getStatusConfig(selectedOrder.status).label}`,
                        `Total: R$ ${selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        '',
                        `*ITENS:*`,
                        itemsList,
                        '',
                        'Olá! Gostaria de falar sobre este pedido específico. Pode me ajudar?'
                      ].join('\n');
                      window.open(`https://wa.me/5511958540171?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="flex-1 md:flex-none bg-emerald-50 text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    💬 Falar do Pedido
                  </button>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-full md:w-auto px-8 py-4 font-black text-slate-400 hover:text-slate-900 transition-colors uppercase text-[10px] tracking-widest">
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Endereço */}
      {isEditingAddress && selectedOrder && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isUpdatingAddress && setIsEditingAddress(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-6">📍 Editar Endereço</h3>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">CEP</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                  onBlur={handleCepBlur}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                />
                {loadingCep && <span className="absolute right-4 top-10 text-[10px] font-bold text-versiory-coral animate-pulse">Buscando...</span>}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rua/Avenida</label>
                <input
                  type="text"
                  placeholder="Nome da rua"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Número</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={addressForm.number}
                    onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Complemento</label>
                  <input
                    type="text"
                    placeholder="Apto..."
                    value={addressForm.complement}
                    onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={addressForm.neighborhood}
                  onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cidade</label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">UF</label>
                  <input
                    type="text"
                    placeholder="SP"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-center outline-none focus:ring-2 ring-versiory-coral/20 transition-all text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleUpdateAddress}
                disabled={isUpdatingAddress}
                className="flex-1 bg-versiory-ink hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isUpdatingAddress ? 'Salvando...' : 'Salvar Alteração'}
              </button>
              <button
                onClick={() => setIsEditingAddress(false)}
                disabled={isUpdatingAddress}
                className="flex-1 border-2 border-slate-100 text-slate-400 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
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

      {/* Modal de Cancelamento */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isCancelling && setShowCancelModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-3xl">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-900">Cancelar Pedido</h3>
                  <p className="text-sm text-slate-500 font-medium">Pedido #{orderToCancel.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-600">Valor do Pedido:</span>
                  <span className="text-xl font-black text-slate-900">R$ {orderToCancel.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Prazo para cancelamento:</span>
                  <span className="text-sm font-black text-green-600">
                    {7 - Math.floor((new Date().getTime() - new Date(orderToCancel.date).getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Motivo do Cancelamento *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Por favor, informe o motivo do cancelamento (mínimo 10 caracteres)...\n\nExemplos:\n- Encontrei um preço melhor\n- Não preciso mais do produto\n- Comprei por engano\n- Prazo de entrega muito longo"
                  className="w-full h-32 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-versiory-coral focus:bg-white outline-none transition-all resize-none font-medium text-slate-900"
                  disabled={isCancelling}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-slate-400 font-medium">
                    {cancelReason.length < 10 ? `Faltam ${10 - cancelReason.length} caracteres` : '✅ Motivo válido'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {cancelReason.length}/500
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6">
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  📌 Ao cancelar, o estoque será devolvido automaticamente e o valor será estornado conforme política da loja.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !isCancelling && setShowCancelModal(false)}
                  disabled={isCancelling}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-black transition-all disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling || cancelReason.trim().length < 10}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar Cancelamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
