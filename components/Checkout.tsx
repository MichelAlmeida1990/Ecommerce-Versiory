import React, { useState } from 'react';
import { CartItem } from '../types';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  customerEmail: string;
  customerAddress: string;
  onOrderComplete: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  customerEmail, 
  customerAddress,
  onOrderComplete 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'whatsapp'>('whatsapp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  };

  const handleCheckout = async () => {
    if (!customerEmail || !customerAddress) {
      alert('Por favor, faça login e configure seu endereço antes de finalizar a compra.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      const orderData = {
        id: orderId,
        customerEmail: customerEmail,
        customerName: customerEmail.split('@')[0], // Nome simples baseado no email
        date: new Date().toISOString(),
        total: total,
        status: 'pending',
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),
        notes: orderNotes
      };

      // Salvar pedido no localStorage (compatível com admin)
      const existingOrders = JSON.parse(localStorage.getItem('versiory_orders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('versiory_orders', JSON.stringify(existingOrders));

      // Atualizar informações do cliente
      const existingCustomers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
      const customerIndex = existingCustomers.findIndex((c: any) => c.email === customerEmail);
      
      if (customerIndex >= 0) {
        existingCustomers[customerIndex].totalOrders = (existingCustomers[customerIndex].totalOrders || 0) + 1;
        existingCustomers[customerIndex].totalSpent = (existingCustomers[customerIndex].totalSpent || 0) + total;
      } else {
        existingCustomers.push({
          id: existingCustomers.length + 1,
          name: customerEmail.split('@')[0],
          email: customerEmail,
          phone: '',
          totalOrders: 1,
          totalSpent: total
        });
      }
      localStorage.setItem('versiory_customers', JSON.stringify(existingCustomers));

      // Redirecionar baseado no método de pagamento
      if (paymentMethod === 'whatsapp') {
        const message = buildWhatsAppMessage(orderId);
        const url = `https://wa.me/5511958540171?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else if (paymentMethod === 'pix') {
        alert('Pagamento via PIX em desenvolvimento. Seu pedido foi registrado com sucesso!');
      } else if (paymentMethod === 'credit') {
        alert('Pagamento via cartão em desenvolvimento. Seu pedido foi registrado com sucesso!');
      }

      onOrderComplete();
      onClose();
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const buildWhatsAppMessage = (orderId: string) => {
    const lines = [
      `🛒 *NOVO PEDIDO - ${orderId}*`,
      '',
      '*DADOS DO CLIENTE:*',
      `📧 Email: ${customerEmail}`,
      `📍 Endereço: ${customerAddress}`,
      '',
      '*ITENS DO PEDIDO:*',
      ...items.map(item => 
        `• ${item.name} x${item.quantity} - R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ),
      '',
      `*TOTAL: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
      '',
      orderNotes ? `*Observações:* ${orderNotes}` : '',
      '',
      'Por favor, confirmem o pedido e informem os próximos passos para o pagamento. Obrigado! 🙏'
    ];
    return lines.join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-200 flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-900">Finalizar Pedido</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Resumo do Pedido */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">Resumo do Pedido</h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">Qtd: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900">
                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
              
              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-versiory-coral">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados de Entrega */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">Dados de Entrega</h4>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="mb-3">
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-medium text-slate-900">{customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Endereço de Entrega</p>
                <p className="font-medium text-slate-900 whitespace-pre-line">{customerAddress}</p>
              </div>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">Método de Pagamento</h4>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-versiory-coral transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="whatsapp"
                  checked={paymentMethod === 'whatsapp'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">WhatsApp</p>
                  <p className="text-sm text-slate-600">Finalize seu pedido diretamente pelo WhatsApp</p>
                </div>
                <span className="text-green-600">✓ Recomendado</span>
              </label>

              <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-versiory-coral transition-colors opacity-50">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                  disabled
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">PIX</p>
                  <p className="text-sm text-slate-600">Pagamento instantâneo via PIX (em breve)</p>
                </div>
                <span className="text-slate-400">Em breve</span>
              </label>

              <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-versiory-coral transition-colors opacity-50">
                <input
                  type="radio"
                  name="payment"
                  value="credit"
                  checked={paymentMethod === 'credit'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                  disabled
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Cartão de Crédito</p>
                  <p className="text-sm text-slate-600">Parcele em até 12x (em breve)</p>
                </div>
                <span className="text-slate-400">Em breve</span>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">Observações (opcional)</h4>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Alguma informação adicional sobre seu pedido?"
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-versiory-coral"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </span>
              ) : (
                'Finalizar Pedido'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
