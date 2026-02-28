import React, { useState } from 'react';
import { Product, Customer, Order } from '../types';
import { validateCPFOrCNPJ } from '../utils/validators';
import { generateInvoice } from '../services/invoice';
import DanfePreview from './DanfePreview';

interface PdvCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { product: Product; quantity: number }[];
  onSubmit: (customerData: { name: string; phone: string; cpf: string; emitNF: boolean }, order: Order) => Promise<void>;
  isSubmitting: boolean;
}

const PdvCheckoutModal: React.FC<PdvCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onSubmit,
  isSubmitting
}) => {
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', cpf: '' });
  const [emitNF, setEmitNF] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showDanfe, setShowDanfe] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);
  const [generatedCustomer, setGeneratedCustomer] = useState<Customer | null>(null);

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!customerForm.name.trim()) {
      newErrors.push('Nome do cliente é obrigatório');
    }

    if (emitNF) {
      if (!customerForm.cpf.trim()) {
        newErrors.push('CPF/CNPJ é obrigatório para emissão de NF-e');
      } else {
        const validation = validateCPFOrCNPJ(customerForm.cpf);
        if (!validation.valid) {
          newErrors.push('CPF/CNPJ inválido');
        }
      }

      // Validar se produtos têm NCM
      const productsWithoutNCM = cart.filter(item => !item.product.ncm || item.product.ncm.trim() === '');
      if (productsWithoutNCM.length > 0) {
        newErrors.push(`Produtos sem NCM cadastrado: ${productsWithoutNCM.map(i => i.product.name).join(', ')}`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const order: Order = {
      id: `PDV-${Date.now()}`,
      customerId: 0,
      customerName: customerForm.name,
      customerEmail: customerForm.phone ? `${customerForm.phone}@pdv.local` : 'pdv@versiory.local',
      date: new Date().toISOString(),
      total,
      status: 'delivered',
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image
      })),
      salesChannel: 'physical',
      emitNF
    };

    if (emitNF) {
      const customer: Customer = {
        id: Date.now(),
        name: customerForm.name,
        email: order.customerEmail,
        phone: customerForm.phone,
        cpfCnpj: customerForm.cpf,
        addresses: [],
        totalOrders: 1,
        totalSpent: total,
        createdAt: new Date().toISOString(),
        orderHistory: []
      };

      const invoiceResult = await generateInvoice({
        order,
        customer,
        items: order.items,
        products: cart.map(item => item.product),
        emitNF: true
      });

      if (invoiceResult.success) {
        order.nfeXml = invoiceResult.xmlFileUrl;
        setGeneratedOrder(order);
        setGeneratedCustomer(customer);
        setShowDanfe(true);
      } else {
        setErrors(invoiceResult.errors || [invoiceResult.message || 'Erro ao gerar NF-e']);
        return;
      }
    }

    await onSubmit(customerForm, order);
    
    if (!emitNF) {
      setCustomerForm({ name: '', phone: '', cpf: '' });
      setEmitNF(false);
      setErrors([]);
    }
  };

  const handleCloseDanfe = () => {
    setShowDanfe(false);
    setGeneratedOrder(null);
    setGeneratedCustomer(null);
    setCustomerForm({ name: '', phone: '', cpf: '' });
    setEmitNF(false);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  if (showDanfe && generatedOrder && generatedCustomer) {
    return <DanfePreview order={generatedOrder} customer={generatedCustomer} onClose={handleCloseDanfe} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-black text-gray-900">Dados do Cliente</h3>
          <p className="text-sm text-gray-600 mt-1">Informe os dados para finalizar a venda</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-100 border border-red-300 rounded-xl p-4">
              <p className="font-bold text-red-800 mb-2">⚠️ Erros encontrados:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Nome do Cliente *</label>
            <input
              type="text"
              value={customerForm.name}
              onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="Ex: João Silva"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Telefone</label>
            <input
              type="tel"
              value={customerForm.phone}
              onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="(11) 98765-4321"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">
              CPF/CNPJ {emitNF && '*'}
            </label>
            <input
              type="text"
              value={customerForm.cpf}
              onChange={e => setCustomerForm(prev => ({ ...prev, cpf: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="000.000.000-00"
              required={emitNF}
            />
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emitNF}
                onChange={e => setEmitNF(e.target.checked)}
                className="mt-1 w-5 h-5 text-versiory-coral focus:ring-versiory-coral border-gray-300 rounded"
              />
              <div>
                <p className="font-bold text-gray-900">Emitir Nota Fiscal (NF-e)</p>
                <p className="text-sm text-gray-600 mt-1">
                  Marque esta opção para gerar a NF-e automaticamente. O CPF/CNPJ será obrigatório.
                </p>
              </div>
            </label>
          </div>

          <div className="bg-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Total da Venda:</span>
              <span className="text-2xl font-black text-versiory-coral">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {emitNF ? 'Gerando NF-e...' : 'Finalizando...'}
                </>
              ) : (
                emitNF ? '✓ Finalizar com NF-e' : 'Confirmar Venda'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PdvCheckoutModal;
