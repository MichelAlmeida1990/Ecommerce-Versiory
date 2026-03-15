
import React, { useState } from 'react';
import { CartItem } from '../types';
import Checkout from './Checkout';

import { fetchAddressByCep } from '../services/cep';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number, selectedSize?: string, selectedColor?: string) => void;
  onRemove: (id: number, selectedSize?: string, selectedColor?: string) => void;
  customerEmail: string;
  customerAddress: string;
  onOrderComplete: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, customerEmail, customerAddress, onOrderComplete }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const whatsappNumber = '5511958540171';
  const [isCheckoutInfoOpen, setIsCheckoutInfoOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [loadingCep, setLoadingCep] = useState(false);

  const getMaxStock = (item: CartItem): number => {
    if (item.selectedSize && item.selectedColor && item.stockBySizeColor) {
      return item.stockBySizeColor[`${item.selectedSize}-${item.selectedColor}`] || 0;
    } else if (item.selectedSize && item.stockBySize) {
      return item.stockBySize[item.selectedSize] || 0;
    }
    return item.stock || 0;
  };

  const handleUpdateQuantity = (item: CartItem, delta: number) => {
    const maxStock = getMaxStock(item);
    const newQuantity = item.quantity + delta;

    if (newQuantity > maxStock) {
      alert(`⚠️ Estoque disponível: ${maxStock} unidades`);
      return;
    }

    onUpdateQuantity(item.id, delta, item.selectedSize, item.selectedColor);
  };

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

  const handleOpenCheckout = () => {
    // Usar a mesma lógica do firebase.ts para localizar o usuário logado
    const lastUserEmail = localStorage.getItem('versiory_last_user');
    let isAuthenticated = false;
    let hasAddress = false;

    if (lastUserEmail) {
      const savedUser = localStorage.getItem(`versiory_user_${lastUserEmail}`);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          isAuthenticated = !!parsed.email;
          hasAddress = !!parsed.address && parsed.address !== 'Endereço não informado';
        } catch { }
      }
    }

    // Fallback para customerEmail (prop do App.tsx) se o localStorage estiver inconsistente
    if (!isAuthenticated && customerEmail) {
      isAuthenticated = true;
      hasAddress = !!customerAddress && customerAddress !== 'Endereço não informado';
    }

    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openProfileModal'));
      return;
    }

    if (!hasAddress) {
      setIsAddressModalOpen(true);
      return;
    }

    setIsCheckoutOpen(true);
  };

  const handleCepBlur = async () => {
    const cleanCep = addressForm.zipCode.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      const data = await fetchAddressByCep(addressForm.zipCode);
      setLoadingCep(false);

      if (data) {
        setAddressForm(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street || !addressForm.number || !addressForm.city) {
      alert('Por favor, preencha os campos obrigatórios do endereço (Rua, Número e Cidade).');
      return;
    }

    const formattedAddress = `${addressForm.street}, ${addressForm.number}${addressForm.complement ? ', ' + addressForm.complement : ''} - ${addressForm.neighborhood}, ${addressForm.city}/${addressForm.state} - CEP: ${addressForm.zipCode}`;

    // Salvar na chave correta baseada no usuário atual
    const emailToUse = customerEmail || localStorage.getItem('versiory_last_user');
    if (emailToUse) {
      try {
        const { saveUserSession } = await import('../services/firebase');
        const key = `versiory_user_${emailToUse}`;
        const savedUser = localStorage.getItem(key);
        let userData: any = { email: emailToUse };

        if (savedUser) {
          try {
            userData = JSON.parse(savedUser);
          } catch { }
        }

        userData.address = formattedAddress;
        localStorage.setItem(key, JSON.stringify(userData));

        await saveUserSession(userData);

        setIsAddressModalOpen(false);
        setIsCheckoutOpen(true);

        window.dispatchEvent(new CustomEvent('addressUpdated', { detail: formattedAddress }));
      } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        alert('Erro ao salvar endereço. Tente novamente.');
      }
    } else {
      alert('Erro: Usuário não identificado. Por favor, faça login.');
    }
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
  };

  const handleCloseCheckoutInfo = () => {
    setIsCheckoutInfoOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-blue-50 border border-blue-200 shadow-2xl flex flex-col">
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
                <div key={`${item.id}-${item.selectedSize || 'no-size'}-${item.selectedColor || 'no-color'}`} className="flex gap-4">
                  <img src={item.image} className="w-20 h-20 object-cover rounded-xl border border-slate-100" alt={item.name} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                        <div className="flex gap-1 mt-1">
                          {item.selectedSize && (
                            <span className="inline-block px-2 py-1 bg-versiory-coral/20 text-versiory-coral text-xs font-bold rounded">
                              {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-600 text-xs font-bold rounded">
                              {item.selectedColor}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => onRemove(item.id, item.selectedSize, item.selectedColor)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-versiory-coral font-bold mt-1">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-lg font-bold min-w-[44px] h-11"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-2 font-bold text-slate-700 min-w-[44px] text-center text-lg">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-lg font-bold min-w-[44px] h-11"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Máx: {getMaxStock(item)}
                      </span>
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
                onClick={handleOpenCheckout}
                className="w-full bg-versiory-ink hover:bg-[#1b2a3a] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-[0.98]"
              >
                Finalizar Pedido
              </button>
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full mt-3 border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-lg bg-blue-50/80 hover:bg-blue-100 transition-colors"
              >
                Comprar via WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>

      <Checkout
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        items={items}
        customerEmail={customerEmail}
        customerAddress={customerAddress}
        onOrderComplete={onOrderComplete}
      />

      {isCheckoutInfoOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseCheckoutInfo} />
          <div className="relative w-full max-w-lg bg-blue-50 border border-blue-200 rounded-3xl shadow-2xl p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-3xl font-black text-slate-900">Checkout em breve</h3>
              <button onClick={handleCloseCheckoutInfo} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
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
                className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-2xl font-bold bg-blue-50/80 hover:bg-blue-100 transition-colors text-base"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddressModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-blue-100 rounded-[32px] shadow-2xl p-8 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-black text-slate-900">📍 Endereço de Entrega</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-6">Informe seu endereço para enviarmos seus produtos.</p>

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

              <div className="grid grid-cols-3 gap-4 font-bold">
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
                onClick={handleSaveAddress}
                className="flex-3 bg-versiory-ink hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all active:scale-[0.98] shadow-xl grow"
              >
                Salvar Endereço
              </button>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="flex-1 border border-slate-200 text-slate-500 py-4 rounded-2xl font-bold bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
