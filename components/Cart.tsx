
import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const whatsappNumber = '5511958540171';
  const [isCheckoutInfoOpen, setIsCheckoutInfoOpen] = useState(false);

  const buildWhatsAppMessage = () => {
    const lines = items.map(item => (
      `- ${item.name} x${item.quantity} (R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
    ));
    return [
      'Ola! Gostaria de finalizar meu pedido:',
      ...lines,
      `Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Podem me ajudar com o pagamento?'
    ].join('\n');
  };

  const handleWhatsAppCheckout = () => {
    const message = buildWhatsAppMessage();
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCheckoutInfo = () => {
    setIsCheckoutInfoOpen(true);
  };

  const handleCloseCheckoutInfo = () => {
    setIsCheckoutInfoOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          <div className="p-6 border-b border-[#f1e2d5] flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-versiory-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Carrinho
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Seu carrinho está vazio</h3>
                <p className="text-slate-500 mt-1">Que tal adicionar alguns itens incríveis?</p>
                <button 
                  onClick={onClose}
                  className="mt-6 text-versiory-coral font-bold hover:text-[#ff8368]"
                >
                  Voltar às compras
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.image} className="w-20 h-20 object-cover rounded-xl border border-slate-100" alt={item.name} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-versiory-coral font-bold mt-1">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-lg font-bold min-w-[44px] h-11"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-2 font-bold text-slate-700 min-w-[44px] text-center text-lg">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-lg font-bold min-w-[44px] h-11"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-6 bg-[#fff6ef] border-t border-[#f1e2d5] space-y-4">
              <div className="flex justify-between items-center text-slate-500">
                <span>Subtotal</span>
                <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Frete</span>
                <span className="text-emerald-600 font-bold">Grátis</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-xl font-bold text-slate-800">Total</span>
                <span className="text-2xl font-black text-versiory-coral">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full bg-versiory-ink hover:bg-[#1b2a3a] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-[0.98]"
              >
                Finalizar no WhatsApp
              </button>
              <button
                onClick={handleOpenCheckoutInfo}
                className="w-full mt-3 border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-lg bg-white/80 hover:bg-white transition-colors"
              >
                Checkout com pagamento (em breve)
              </button>
            </div>
          )}
        </div>
      </div>

      {isCheckoutInfoOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseCheckoutInfo} />
          <div className="relative w-full max-w-lg bg-versiory-ivory rounded-3xl shadow-2xl p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-3xl font-black text-slate-900">Checkout em breve</h3>
              <button onClick={handleCloseCheckoutInfo} className="p-2 hover:bg-white rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-600 mt-3 leading-relaxed text-base">
              Estamos finalizando os meios de pagamento. Por enquanto, podemos concluir seu pedido pelo WhatsApp.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleWhatsAppCheckout}
                className="flex-1 bg-versiory-ink hover:bg-[#1b2a3a] text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] text-base"
              >
                Ir para WhatsApp
              </button>
              <button
                onClick={handleCloseCheckoutInfo}
                className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-2xl font-bold bg-white/80 hover:bg-white transition-colors text-base"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
