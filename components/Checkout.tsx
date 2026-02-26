import React, { useState } from 'react';
import { generateInvoice } from '../services/invoice';
import { CartItem, Order, OrderItem, Customer } from '../types';

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
  const [emitNF, setEmitNF] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<'none' | 'generating' | 'ready'>('none');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  };

  const handleCheckout = async () => {
    if (!customerEmail || !customerAddress) {
      // Apenas fecha o modal, pois o Cart já cuida de abrir o login/cadastro
      if (onClose) onClose();
      return;
    }

    setIsProcessing(true);

    try {
      const orderId = generateOrderId();
      // Buscar nome completo do localStorage (versiory_user)
      let fullName = '';
      try {
        const savedUser = localStorage.getItem('versiory_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.address) {
            if (parsed.name) {
              fullName = parsed.name;
            } else if (parsed.email) {
              fullName = parsed.email.split('@')[0];
            }
          } else if (parsed && parsed.email) {
            fullName = parsed.email.split('@')[0];
          }
        }
      } catch { }
      if (!fullName) fullName = customerEmail.split('@')[0];

      const orderData: Order = {
        id: orderId,
        customerId: 0, // Will be updated below
        customerEmail: customerEmail,
        customerName: fullName,
        date: new Date().toISOString(),
        total: total,
        status: 'pending',
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          description: item.description
        })),
        notes: orderNotes
      };

      // Salvar pedido no localStorage (compatível com admin e CustomerOrders)
      const existingOrders = JSON.parse(localStorage.getItem('versiory_orders') || '[]');
      existingOrders.push({ ...orderData, emitNF });
      localStorage.setItem('versiory_orders', JSON.stringify(existingOrders));

      // Atualizar informações do cliente e seu histórico pessoal
      const savedCustomers = localStorage.getItem('versiory_customers');
      let customers: Customer[] = savedCustomers ? JSON.parse(savedCustomers) : [];
      const customerIndex = customers.findIndex((c) => c.email === customerEmail);

      if (customerIndex >= 0) {
        customers[customerIndex].totalOrders = (customers[customerIndex].totalOrders || 0) + 1;
        customers[customerIndex].totalSpent = (customers[customerIndex].totalSpent || 0) + total;
        if (fullName) customers[customerIndex].name = fullName;
        // Sincronizar histórico pessoal
        if (!customers[customerIndex].orderHistory) customers[customerIndex].orderHistory = [];
        customers[customerIndex].orderHistory.push({ ...orderData, emitNF } as any);
        orderData.customerId = customers[customerIndex].id;
      } else {
        const newCustomer: Customer = {
          id: Date.now(),
          name: fullName,
          email: customerEmail,
          phone: '',
          totalOrders: 1,
          totalSpent: total,
          addresses: [],
          createdAt: new Date().toISOString(),
          orderHistory: [{ ...orderData, emitNF } as any]
        };
        customers.push(newCustomer);
        orderData.customerId = newCustomer.id;
      }
      localStorage.setItem('versiory_customers', JSON.stringify(customers));

      // A emissão de NF-e agora é processada após a confirmação do pagamento pelo administrador.
      // Removemos a chamada automática de generateInvoice deste ponto.
      if (emitNF) {
        setInvoiceStatus('generating');
        // Apenas para efeito visual no frontend imediato, simulamos o registro da solicitação
        setTimeout(() => setInvoiceStatus('none'), 2000);
      }

      // Se emitir NF, o redirecionamento para o WhatsApp se torna manual no painel de sucesso
      // para garantir que o usuário veja e possa baixar a nota fiscal primeiro.
      if (paymentMethod === 'whatsapp' && !emitNF) {
        const message = buildWhatsAppMessage(orderId, fullName);
        const url = `https://wa.me/5511958540171?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else if (paymentMethod === 'pix') {
        alert('Pagamento via PIX em desenvolvimento. Seu pedido foi registrado com sucesso!');
      } else if (paymentMethod === 'credit') {
        alert('Pagamento via cartão em desenvolvimento. Seu pedido foi registrado com sucesso!');
      }

      onOrderComplete();

      if (!emitNF) {
        onClose();
      }

    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const buildWhatsAppMessage = (orderId: string, fullName: string) => {
    const lines = [
      `🛒 *NOVO PEDIDO - ${orderId}*`,
      '',
      '*DADOS DO CLIENTE:*',
      `👤 Nome: ${fullName}`,
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
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'pix' | 'credit')}
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
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'pix' | 'credit')}
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
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'pix' | 'credit')}
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
              type="button"
              onClick={() => setEmitNF(true)}
              disabled={emitNF}
              className="flex-1 border border-blue-300 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {emitNF ? 'Solicitação registrada' : 'Solicitar Nota Fiscal'}
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || invoiceStatus === 'ready'}
              className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {invoiceStatus === 'generating' ? 'Gerando NF-e...' : 'Processando...'}
                </span>
              ) : (
                invoiceStatus === 'ready' ? 'Pedido Concluído!' : 'Finalizar Pedido'
              )}
            </button>
          </div>

          {emitNF && (
            <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in flip-in-x duration-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg">🕒</div>
                <div>
                  <h5 className="font-black text-amber-900">Pedido Realizado com Sucesso!</h5>
                  <p className="text-sm text-amber-700 font-medium">Sua solicitação de Nota Fiscal foi registrada. Ela estará disponível para download assim que o administrador confirmar seu pagamento.</p>
                </div>
              </div>
              <div className="flex gap-3">
                {paymentMethod === 'whatsapp' && (
                  <button
                    onClick={() => {
                      const savedOrders = JSON.parse(localStorage.getItem('versiory_orders') || '[]');
                      const lastOrder = savedOrders[savedOrders.length - 1];
                      if (lastOrder) {
                        const message = buildWhatsAppMessage(lastOrder.id, lastOrder.customerName);
                        const url = `https://wa.me/5511958540171?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    Finalizar Pagamento WhatsApp
                  </button>
                )}
                <button onClick={onClose} className="px-6 border border-amber-200 text-amber-700 py-3 rounded-xl font-bold hover:bg-amber-100 transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
