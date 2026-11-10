import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';

export interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number, selectedSize?: string, selectedColor?: string) => void;
  onRemove: (id: number, selectedSize?: string, selectedColor?: string) => void;
  customerEmail?: string;
  customerAddress?: string;
  onOrderComplete?: () => void;
  onProceedToCheckout?: (couponCode?: string) => void;
}

const FREE_SHIPPING_THRESHOLD = 199;

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onProceedToCheckout
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [cep, setCep] = useState('');
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');

  // Fechar no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Evitar scroll no body quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getItemPrice = (item: CartItem): number => {
    return item.priceEcommerce !== undefined && item.priceEcommerce !== null
      ? item.priceEcommerce
      : (item.price || 0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);

  // Recalcular desconto se subtotal mudar
  useEffect(() => {
    if (couponApplied) {
      if (couponDiscount > subtotal) {
        setCouponDiscount(subtotal);
      }
    }
  }, [subtotal, couponApplied, couponDiscount]);

  // Regra de Frete Grátis
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  // Valor final de frete efetivo
  const effectiveShipping = qualifiesForFreeShipping ? 0 : (shippingCalculated ? shippingCost : 0);
  const total = Math.max(0, subtotal - couponDiscount + effectiveShipping);

  // Aplicar Cupom
  const handleApplyCoupon = async () => {
    const code = couponCode.toUpperCase().trim();
    if (!code) {
      setCouponError('Digite um cupom');
      return;
    }
    setCouponLoading(true);
    setCouponError('');

    try {
      const { previewCoupon } = await import('../services/firebase');
      const { coupon, error } = await previewCoupon(code, subtotal);

      if (error || !coupon) {
        setCouponError(error || 'Cupom inválido ou expirado');
        setCouponDiscount(0);
        setCouponApplied(false);
      } else {
        const discountAmount = coupon.tipo === 'percentual'
          ? subtotal * (coupon.valor / 100)
          : coupon.valor;
        setCouponDiscount(Math.min(discountAmount, subtotal));
        setCouponApplied(true);
      }
    } catch {
      setCouponError('Erro ao validar cupom.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
  };

  // Simular Frete
  const handleCalculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setShippingError('Digite um CEP válido (8 dígitos)');
      return;
    }

    setShippingLoading(true);
    setShippingError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setShippingError('CEP não encontrado');
        setShippingCalculated(false);
      } else {
        setShippingCalculated(true);
        // Regra simples: se não qualificou para frete grátis, valor padrão
        setShippingCost(qualifiesForFreeShipping ? 0 : 19.90);
      }
    } catch {
      setShippingError('Não foi possível calcular o frete.');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout(couponApplied ? couponCode : undefined);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-in slide-in-from-right">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-versiory-coral/15 flex items-center justify-center text-versiory-coral">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Meu Carrinho</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Fechar carrinho"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Barra de Progresso do Frete Grátis */}
          {items.length > 0 && (
            <div className={`p-4 border-b transition-colors ${
              qualifiesForFreeShipping ? 'bg-emerald-50/80 border-emerald-100' : 'bg-amber-50/70 border-amber-100'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{qualifiesForFreeShipping ? '🎉' : '🚚'}</span>
                <p className={`text-xs font-bold ${qualifiesForFreeShipping ? 'text-emerald-800' : 'text-amber-900'}`}>
                  {qualifiesForFreeShipping ? (
                    'Parabéns! Você ganhou Frete Grátis!'
                  ) : (
                    <>
                      Faltam <span className="font-black text-versiory-coral">R$ {missingForFreeShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> para <strong>Frete Grátis</strong>
                    </>
                  )}
                </p>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    qualifiesForFreeShipping ? 'bg-emerald-500' : 'bg-gradient-to-r from-versiory-coral to-[#ff8368]'
                  }`}
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Conteúdo do Carrinho */}
          {items.length === 0 ? (
            /* Empty State Ilustrado */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-versiory-coral/10 to-slate-100 flex items-center justify-center mb-6 shadow-inner relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-versiory-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div className="absolute top-2 right-2 w-4 h-4 bg-versiory-coral rounded-full animate-ping opacity-75" />
                <div className="absolute top-2 right-2 w-4 h-4 bg-versiory-coral rounded-full" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-2">Sua sacola está vazia</h4>
              <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
                Você ainda não adicionou nenhum item. Explore nossas categorias e descubra ofertas exclusivas!
              </p>
              <button
                onClick={onClose}
                className="w-full max-w-xs bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Explorar Produtos</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* Lista de Itens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
                {items.map((item) => {
                  const itemPrice = getItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;
                  const key = `${item.id}-${item.selectedSize || 'nosize'}-${item.selectedColor || 'nocolor'}`;

                  return (
                    <div key={key} className="pt-3 first:pt-0 flex gap-3.5 items-start group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate pr-1" title={item.name}>
                            {item.name}
                          </h4>
                          <button
                            onClick={() => onRemove(item.id, item.selectedSize, item.selectedColor)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remover produto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Variantes */}
                        {(item.selectedSize || item.selectedColor) && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.selectedSize && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                Tam: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                Cor: {item.selectedColor}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Preço e Controles */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div>
                            <span className="text-xs text-slate-400 block">
                              R$ {itemPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} un
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Seletor de Quantidade */}
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors font-bold text-sm"
                              title="Diminuir"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors font-bold text-sm"
                              title="Aumentar"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Cupom de Desconto */}
                <div className="pt-4 mt-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cupom de Desconto
                  </label>
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏷️</span>
                        <div>
                          <p className="text-xs font-black">{couponCode.toUpperCase()}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">
                            Desconto de R$ {couponDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Ex: PRIMEIRACOMPRA"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium uppercase outline-none focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-slate-900 hover:bg-versiory-coral text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? 'Validando...' : 'Aplicar'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-red-500 font-bold mt-1">{couponError}</p>
                  )}
                </div>

                {/* Cálculo de Frete */}
                <div className="pt-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Calcular Frete e Prazo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cep}
                      maxLength={9}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5, 8)}`;
                        setCep(v);
                      }}
                      placeholder="00000-000"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral"
                    />
                    <button
                      onClick={handleCalculateShipping}
                      disabled={shippingLoading || cep.replace(/\D/g, '').length !== 8}
                      className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {shippingLoading ? '...' : 'Calcular'}
                    </button>
                  </div>
                  {shippingError && (
                    <p className="text-[11px] text-red-500 font-bold mt-1">{shippingError}</p>
                  )}
                  {shippingCalculated && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Entrega Normal (4-7 dias)</span>
                        <span className="font-bold text-slate-900">
                          {qualifiesForFreeShipping ? (
                            <span className="text-emerald-600 font-black">Grátis</span>
                          ) : (
                            `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer com Resumo Financeiro e CTA */}
              <div className="p-5 border-t border-slate-200 bg-slate-50/80 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Desconto ({couponCode})</span>
                      <span>- R$ {couponDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Frete</span>
                    <span>
                      {qualifiesForFreeShipping ? (
                        <span className="text-emerald-600 font-bold">Grátis</span>
                      ) : shippingCalculated ? (
                        `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400">A calcular</span>
                      )}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                    <span className="text-sm font-black text-slate-900">Total</span>
                    <span className="text-xl font-black text-versiory-coral">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Selos de Confiança / Trust Badges */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs">🔒</span>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Compra Segura</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs">🚚</span>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Envio Rápido</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs">💳</span>
                    <span className="text-[10px] font-bold text-slate-600 leading-tight">Até 12x Cartão</span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Finalizar Compra</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-2 transition-colors"
                  >
                    Continuar comprando
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
