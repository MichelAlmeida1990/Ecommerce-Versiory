import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  trackingCode?: string;
  carrier?: string;
  notes?: string;
}

interface CustomerOrdersProps {
  customerEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ customerEmail, isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && customerEmail) {
      loadOrders();
    }
  }, [isOpen, customerEmail]);

  const loadOrders = () => {
    setLoading(true);
    
    // Carregar pedidos do localStorage (compatível com admin)
    const savedOrders = localStorage.getItem('versiory_orders');
    const savedTracking = localStorage.getItem('versiory_tracking');
    
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders);
      const customerOrders = allOrders.filter((order: any) => 
        order.customerEmail === customerEmail
      );
      
      // Adicionar informações de rastreamento
      if (savedTracking) {
        const trackingInfo = JSON.parse(savedTracking);
        customerOrders.forEach((order: Order) => {
          const tracking = trackingInfo.find((t: any) => t.orderId === order.id);
          if (tracking) {
            order.trackingCode = tracking.code;
            order.carrier = tracking.carrier;
          }
        });
      }
      
      // Ordenar por data (mais recentes primeiro)
      customerOrders.sort((a: Order, b: Order) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setOrders(customerOrders);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Aguardando Pagamento',
      paid: 'Pagamento Efetuado',
      processing: 'Em Processamento',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const trackOrder = () => {
    if (selectedOrder?.trackingCode) {
      const url = `https://www.linkcorreios.com.br/?id=${selectedOrder.trackingCode}`;
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-blue-50 border border-blue-200 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-blue-200 flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-900">Meus Pedidos</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-versiory-coral"></div>
              <p className="mt-4 text-slate-600">Carregando seus pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-slate-600">Você ainda não fez nenhuma compra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-blue-50 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Pedido {order.id}</h4>
                      <p className="text-slate-600 text-sm">
                        {new Date(order.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-slate-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                      </p>
                      <p className="font-bold text-slate-900 text-lg">
                        Total: R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button
                      onClick={() => openOrderDetails(order)}
                      className="bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-2 rounded-xl font-medium transition-all"
                    >
                      Ver Detalhes
                    </button>
                  </div>

                  {order.trackingCode && (
                    <div className="bg-blue-50 rounded-xl p-3 text-sm">
                      <p className="text-blue-800 font-medium">
                        📦 Código de rastreamento: {order.trackingCode}
                      </p>
                      {order.carrier && (
                        <p className="text-blue-600">Transportadora: {order.carrier}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeOrderDetails}
          />
          
          <div className="relative w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-blue-200 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Detalhes do Pedido {selectedOrder.id}</h3>
              <button
                onClick={closeOrderDetails}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-slate-600">Data do pedido</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedOrder.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-600 mb-1">Observações</p>
                    <p className="text-slate-900">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-4">Itens do Pedido</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900">{item.name}</h5>
                        <p className="text-sm text-slate-600">Quantidade: {item.quantity}</p>
                        <p className="font-bold text-versiory-coral">
                          R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#e6d7c7] pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-slate-900">Total do Pedido</span>
                  <span className="text-xl font-black text-versiory-coral">
                    R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {selectedOrder.trackingCode && (
                  <button
                    onClick={trackOrder}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all"
                  >
                    📦 Rastrear Pacote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
