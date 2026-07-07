import React, { useState, useEffect } from 'react';
import { Product, Customer, Order } from '../types';
import { validateCPFOrCNPJ } from '../utils/validators';
import { generateInvoice } from '../services/invoice';
import { getFiscalConfig } from '../services/fiscalConfig';
import { calculateInstallments } from '../utils/installments';
import DanfePreview from './DanfePreview';

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// REFCOM166/REFCOM181: Estado inicial do formulário de cliente (inclui endereço estruturado)
const EMPTY_CUSTOMER_FORM = {
  name: '', phone: '', email: '', cpf: '', birthDate: '', notes: '',
  address: '', customPolicies: '',
  street: '', number: '', neighborhood: '', city: '', state: '', zipCode: ''
};

interface PdvCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCart?: () => void;
  cart: { product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[];
  onSubmit: (customerData: { name: string; phone: string; email: string; cpf: string; emitNF: boolean; notes: string; customPolicies?: string; isBudget?: boolean }, order: Order) => Promise<void>;
  isSubmitting: boolean;
  editingOrder?: Order | null;
  discountAmount?: number;
  discountType?: 'fixo' | 'percentual';
  customers?: Customer[]; // REFCOM166_pesquisa_pdv: Lista de clientes para pesquisa
}

const PdvCheckoutModal: React.FC<PdvCheckoutModalProps> = ({
  isOpen,
  onClose,
  onClearCart,
  cart,
  onSubmit,
  isSubmitting,
  editingOrder,
  customers = [], // REFCOM166_pesquisa_pdv: Lista de clientes para pesquisa
  discountAmount = 0,
  discountType = 'fixo'
}) => {
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER_FORM);
  const [customerSearch, setCustomerSearch] = useState(''); // REFCOM166_pesquisa_pdv: Estado para pesquisa de clientes
  const [showCustomerResults, setShowCustomerResults] = useState(false); // REFCOM166_pesquisa_pdv: Mostrar resultados da pesquisa

  // REFCOM166_pesquisa_pdv: Filtrar clientes por nome, telefone ou CPF/CNPJ
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.cpfCnpj?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // REFCOM166/REFCOM181: Montar string de endereço (legado) a partir dos campos estruturados
  const buildAddressString = (f: typeof customerForm): string => {
    const parts: string[] = [];
    if (f.street) parts.push(f.street);
    if (f.number) parts.push(f.number);
    if (f.neighborhood) parts.push(f.neighborhood);
    if (f.city && f.state) parts.push(`${f.city}/${f.state}`);
    else if (f.city) parts.push(f.city);
    if (f.zipCode) parts.push(`CEP ${f.zipCode}`);
    return parts.length > 0 ? parts.join(', ') : f.address;
  };

  // REFCOM166/REFCOM181: Construir objeto Address a partir dos campos preenchidos
  const buildAddressObject = (f: typeof customerForm): Address | null => {
    if (!f.street && !f.city && !f.neighborhood) return null;
    return {
      id: `addr_${Date.now()}`,
      street: f.street,
      number: f.number,
      complement: f.address ? f.address : undefined,
      neighborhood: f.neighborhood,
      city: f.city,
      state: f.state,
      zipCode: f.zipCode,
      country: 'Brasil',
      type: 'shipping'
    };
  };

  // REFCOM166_pesquisa_pdv: Selecionar cliente da pesquisa
  const handleSelectCustomer = (customer: Customer) => {
    const addr = customer.addresses?.[0];
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      cpf: customer.cpfCnpj || '',
      birthDate: customer.birthDate || '',
      notes: '',
      address: customer.addresses?.[0]?.street ? `${customer.addresses[0].street}, ${customer.addresses[0].number} - ${customer.addresses[0].city}` : '',
      customPolicies: '',
      street: addr?.street || '',
      number: addr?.number || '',
      neighborhood: addr?.neighborhood || '',
      city: addr?.city || '',
      state: addr?.state || '',
      zipCode: addr?.zipCode || ''
    });
    setCustomerSearch('');
    setShowCustomerResults(false);
  };

  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('dinheiro');
  const [installments, setInstallments] = useState(1);
  const [emitNF, setEmitNF] = useState(false);
  const [isBudget, setIsBudget] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showDanfe, setShowDanfe] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);
  const [generatedCustomer, setGeneratedCustomer] = useState<Customer | null>(null);
  const [saleFinished, setSaleFinished] = useState(false);
  const [lastFinishedOrder, setLastFinishedOrder] = useState<Order | null>(null);
  // ERRCOM074/075: Orçamento gerado mas ainda NÃO salvo
  const [budgetPendingOrder, setBudgetPendingOrder] = useState<Order | null>(null);
  const [soldItems, setSoldItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [soldTotal, setSoldTotal] = useState(0);

  useEffect(() => {
    if (isOpen && editingOrder) {
      setCustomerForm({
        name: editingOrder.customerName || '',
        phone: editingOrder.customerPhone || '',
        email: editingOrder.customerEmail || '',
        cpf: editingOrder.customerCpfCnpj || '',
        birthDate: '',
        notes: editingOrder.notes || '',
        address: editingOrder.address || '',
        customPolicies: editingOrder.customPolicies || '',
        street: '', number: '', neighborhood: '', city: '', state: '', zipCode: ''
      });
      setEmitNF(editingOrder.emitNF || false);
      setIsBudget(editingOrder.isBudget || false);
      if (editingOrder.paymentMethod) setPaymentMethod(editingOrder.paymentMethod as any);
    } else if (isOpen && !saleFinished) {
      // ERRCOM106: Não resetar o formulário ao abrir se já houver dados (persiste do Orçamento para Venda)
      // A limpeza agora ocorre apenas em handleSubmit (após venda) ou explicitamente em Nova Venda
      setErrors([]);
      // Apenas resetar estados de controle, mantendo os dados do cliente
      setSaleFinished(false);
    }
  }, [isOpen, editingOrder]);

  // REFCOM134: Utilizar pricePOS para vendas no PDV
  const subtotal = cart.reduce((sum, item) => sum + ((item.product.pricePOS || item.product.price) * item.quantity), 0);
  const actualDiscount = discountType === 'percentual' ? subtotal * (discountAmount / 100) : discountAmount;
  const total = Math.max(0, subtotal - actualDiscount);

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

  // ERRCOM074/075: Gerar orçamento SEM salvar - apenas print preview
  const handleBudgetPreview = async () => {
    if (!customerForm.name.trim()) {
      setErrors(['Nome do cliente é obrigatório mesmo para orçamentos']);
      return;
    }
    setErrors([]);

    // Montar o pedido em memória (ainda NÃO salvo)
    const previewOrder: Order = {
      id: editingOrder ? editingOrder.id : 'ORC-PREVIEW',
      customerId: 0,
      customerName: customerForm.name,
      customerEmail: customerForm.email || (customerForm.phone ? `${customerForm.phone}@pdv.local` : ''),
      customerPhone: customerForm.phone || undefined,
      customerCpfCnpj: customerForm.cpf || undefined, // ERRCOM109
      date: new Date().toISOString(),
      total,
      status: 'pending',
      paymentMethod: undefined,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.pricePOS || item.product.price, // REFCOM134: usar preço PDV
        image: item.product.image,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        installments: item.product.installments
      })),
      salesChannel: 'physical',
      emitNF: false,
      notes: customerForm.notes,
      address: buildAddressString(customerForm),
      isBudget: true,
      customPolicies: customerForm.customPolicies
    };

    // Imprimir o orçamento
    const { generateReceiptHTML } = await import('../utils/receiptGenerator');
    const { getFiscalConfig } = await import('../services/fiscalConfig');
    const fiscalConfig = getFiscalConfig();
    const receiptHTML = generateReceiptHTML({
      orderId: 'ORC-PREVIEW',
      date: new Date().toLocaleString('pt-BR'),
      customerName: previewOrder.customerName,
      customerPhone: previewOrder.customerPhone,
      customerAddress: previewOrder.address || undefined,
      notes: previewOrder.notes,
      storePolicies: previewOrder.customPolicies || fiscalConfig?.storePolicies,
      items: cart.map(item => ({ ...item.product, quantity: item.quantity as any, category: item.product.category })),
      total,
      isBudget: true
    });
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
    }

    // Guardar em estado para confirmação posterior (ainda NÃO salvo no Firebase)
    setBudgetPendingOrder(previewOrder);
  };

  // ERRCOM074/075: Gravar orçamento somente após confirmação explícita
  const handleSaveBudget = async () => {
    if (!budgetPendingOrder) return;
    try {
      await onSubmit({ ...customerForm, emitNF: false, isBudget: true }, budgetPendingOrder);
      setSoldItems([...cart]);
      setSoldTotal(total);
      setLastFinishedOrder(budgetPendingOrder);
      setIsBudget(true);
      setSaleFinished(true);
      setBudgetPendingOrder(null);
    } catch (err: any) { }
  };

  // ERRCOM074/075: Confirmar como venda (a partir do orçamento previamente visualizado)
  const handleConfirmSaleFromBudget = async () => {
    if (!budgetPendingOrder) return;
    const saleOrder: Order = {
      ...budgetPendingOrder,
      id: editingOrder ? editingOrder.id : `PDV-${Date.now()}`,
      isBudget: false,
      status: 'delivered',
      paymentMethod
    };
    try {
      await onSubmit({ ...customerForm, emitNF: false, isBudget: false }, saleOrder);
      setSoldItems([...cart]);
      setSoldTotal(total);
      setLastFinishedOrder(saleOrder);
      setIsBudget(false);
      setSaleFinished(true);
      setBudgetPendingOrder(null);
      setCustomerForm({ ...EMPTY_CUSTOMER_FORM });
    } catch (err: any) { }
  };

  const handleSubmit = async (e?: React.FormEvent, forceBudget = false) => {
    if (e) e.preventDefault();
    
    // Se for clicado explicitamente em 'Gerar Orçamento' (forceBudget = true)
    if (forceBudget) {
      // ERRCOM074/075: Apenas gera preview - não salva no Firebase até confirmação na sub-tela
      await handleBudgetPreview();
      return;
    }

    if (!validateForm()) return;

    const order: Order = {
      id: editingOrder ? editingOrder.id : `PDV-${Date.now()}`,
      customerId: 0,
      customerName: customerForm.name,
      customerEmail: customerForm.email || (customerForm.phone ? `${customerForm.phone}@pdv.local` : ''),
      customerPhone: customerForm.phone || undefined,
      customerCpfCnpj: customerForm.cpf || undefined, // ERRCOM109/ERRCOM116
      date: new Date().toISOString(),
      total,
      status: 'delivered',
      paymentMethod,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.pricePOS || item.product.price, // REFCOM134: usar preço PDV
        image: item.product.image,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        installments: item.product.installments
      })),
      salesChannel: 'physical',
      emitNF,
      notes: customerForm.notes,
      address: buildAddressString(customerForm),
      isBudget: false,
      customPolicies: customerForm.customPolicies,
      installments: paymentMethod === 'credito' ? installments : 1,
      discountAmount: actualDiscount,
      discountType: discountType
    };

    if (emitNF) {
      // REFCOM166/REFCOM181: Reutilizar cliente existente (por CPF/CNPJ) para mesclar dados sem perder
      const existingCustomer = customers.find(c => c.cpfCnpj && c.cpfCnpj.trim() === customerForm.cpf.trim());
      const newAddress = buildAddressObject(customerForm);
      const mergedAddresses: Address[] = existingCustomer ? [...existingCustomer.addresses] : [];
      if (newAddress) {
        const shippingIdx = mergedAddresses.findIndex(a => a.type === 'shipping');
        if (shippingIdx >= 0) mergedAddresses[shippingIdx] = newAddress;
        else mergedAddresses.push(newAddress);
      }

      const customer: Customer = {
        id: existingCustomer ? existingCustomer.id : Date.now(),
        name: customerForm.name,
        email: order.customerEmail,
        phone: customerForm.phone,
        cpfCnpj: customerForm.cpf,
        birthDate: customerForm.birthDate || existingCustomer?.birthDate,
        addresses: mergedAddresses,
        totalOrders: existingCustomer ? existingCustomer.totalOrders + 1 : 1,
        totalSpent: (existingCustomer?.totalSpent || 0) + total,
        createdAt: existingCustomer?.createdAt || new Date().toISOString(),
        orderHistory: existingCustomer?.orderHistory || []
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

    try {
      await onSubmit({ ...customerForm, emitNF, isBudget: false }, order);

      if (!emitNF) {
        setSoldItems([...cart]);
        setSoldTotal(total);
        setLastFinishedOrder(order);
        setSaleFinished(true);
        setCustomerForm({ ...EMPTY_CUSTOMER_FORM });
        setEmitNF(false);
        setErrors([]);
        setIsBudget(false);
      }
    } catch (err: any) { }
  };

  const handleCloseDanfe = () => {
    setShowDanfe(false);
    setGeneratedOrder(null);
    setGeneratedCustomer(null);
    setCustomerForm({ ...EMPTY_CUSTOMER_FORM });
    setEmitNF(false);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  if (showDanfe && generatedOrder && generatedCustomer) {
    return <DanfePreview order={generatedOrder} customer={generatedCustomer} onClose={handleCloseDanfe} />;
  }



  const handlePrintReceipt = async () => {
    if (!lastFinishedOrder) {
      window.alert('Erro: Pedido não encontrado. Por favor, tente novamente.');
      return;
    }
    try {
      const { generateReceiptHTML } = await import('../utils/receiptGenerator');
      const fiscalConfig = getFiscalConfig();

      const isPdvPhone = lastFinishedOrder.customerEmail && lastFinishedOrder.customerEmail.includes('@pdv.local');
      const displayPhone = isPdvPhone ? lastFinishedOrder.customerEmail!.replace('@pdv.local', '') : undefined;
      const displayEmail = isPdvPhone ? undefined : lastFinishedOrder.customerEmail;

      const receiptHTML = generateReceiptHTML({
        orderId: lastFinishedOrder.id,
        date: new Date(lastFinishedOrder.date).toLocaleString('pt-BR'),
        customerName: lastFinishedOrder.customerName,
        customerPhone: displayPhone || lastFinishedOrder.customerPhone || undefined,
        customerEmail: displayEmail,
        customerCpfCnpj: lastFinishedOrder.customerCpfCnpj, // ERRCOM110
        customerAddress: lastFinishedOrder.address || undefined,
        notes: lastFinishedOrder.notes,
        storePolicies: lastFinishedOrder.customPolicies || fiscalConfig?.storePolicies,
        items: soldItems.map(item => ({ ...item.product, quantity: item.quantity as any, category: item.product.category })),
        total: soldTotal,
        paymentMethod: lastFinishedOrder.paymentMethod || undefined,
        isBudget: lastFinishedOrder.isBudget,
        salesChannel: lastFinishedOrder.salesChannel || 'physical',
        installments: lastFinishedOrder.installments, // REFCOM135
        installmentDetails: lastFinishedOrder.installmentDetails, // REFCOM135
        discountAmount: lastFinishedOrder.discountAmount, // REFCOM151
        discountType: lastFinishedOrder.discountType, // REFCOM151
        couponCode: lastFinishedOrder.couponCode // REFCOM151
      });

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
      } else {
        window.alert('Erro: Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativado.');
      }
    } catch (error) {
      console.error('Erro ao imprimir recibo:', error);
      window.alert('Erro ao imprimir recibo. Por favor, tente novamente.');
    }
  };

  // ERRCOM074/075: Tela de confirmação após visualizar orçamento - ANTES de salvar
  if (budgetPendingOrder) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📋</div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Orçamento Visualizado</h3>
          <p className="text-slate-500 mb-2 text-sm">O orçamento foi impresso/visualizado.</p>
          <p className="text-slate-400 mb-6 text-xs font-medium">⚠️ Ele ainda NÃO foi salvo no sistema. Escolha o que deseja fazer:</p>
          <div className="space-y-3">
            <button
              onClick={handleSaveBudget}
              disabled={isSubmitting}
              className="w-full bg-versiory-ink hover:bg-[#1b2a3a] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              📝 Gravar Orçamento
            </button>
            <button
              onClick={handleConfirmSaleFromBudget}
              disabled={isSubmitting}
              className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
            >
              ✅ Confirmar como Venda
            </button>
            <button
              onClick={() => { setBudgetPendingOrder(null); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all"
            >
              ✏️ Editar Dados
            </button>
            <button
              onClick={() => { setBudgetPendingOrder(null); onClose(); }}
              className="w-full text-slate-400 hover:text-slate-600 font-bold py-2 transition-all text-sm"
            >
              Cancelar (sem salvar)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (saleFinished) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">{isBudget ? 'Orçamento Salvo!' : 'Venda Finalizada!'}</h3>
          <p className="text-slate-500 mb-8">{isBudget ? 'Orçamento registrado com sucesso.' : 'O que deseja fazer agora?'}</p>
          <div className="space-y-3">
            <button
              onClick={handlePrintReceipt}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir {isBudget ? 'Orçamento' : 'Recibo'}
            </button>
            <button
              onClick={() => {
                if (onClearCart) onClearCart();
                setSaleFinished(false);
                setLastFinishedOrder(null);
                onClose();
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all"
            >
              Nova Venda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="absolute inset-0" 
        onClick={() => {
          if ((customerForm.name || customerForm.phone) && !saleFinished) {
            if (window.confirm('Deseja realmente fechar o checkout? Dados preenchidos serão perdidos.')) onClose();
          } else {
            onClose();
          }
        }}
      />
      <div className="relative bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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

          {/* REFCOM166_pesquisa_pdv: Campo de pesquisa de clientes */}
          <div className="relative">
            <label className="block text-sm font-black text-gray-700 mb-2">Pesquisar Cliente (Nome, Telefone ou CPF/CNPJ)</label>
            <input
              type="text"
              value={customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value);
                setShowCustomerResults(e.target.value.length > 0);
              }}
              onFocus={() => setShowCustomerResults(customerSearch.length > 0)}
              onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="🔍 Digite para buscar cliente cadastrado..."
            />
            {showCustomerResults && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.slice(0, 10).map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-bold text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.phone || ''} {customer.cpfCnpj ? `| ${customer.cpfCnpj}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">E-mail (opcional)</label>
            <input
              type="email"
              value={customerForm.email}
              onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="cliente@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Endereço (texto livre / complemento - opcional)</label>
            <input
              type="text"
              value={customerForm.address}
              onChange={e => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="Ex: Apto 12, Bloco B"
            />
          </div>

          {/* REFCOM166/REFCOM181: Campos de endereço estruturados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-gray-700 mb-2">Rua</label>
              <input
                type="text"
                value={customerForm.street}
                onChange={e => setCustomerForm(prev => ({ ...prev, street: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                placeholder="Ex: Rua das Flores"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Número</label>
              <input
                type="text"
                value={customerForm.number}
                onChange={e => setCustomerForm(prev => ({ ...prev, number: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Bairro</label>
              <input
                type="text"
                value={customerForm.neighborhood}
                onChange={e => setCustomerForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                placeholder="Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Cidade</label>
              <input
                type="text"
                value={customerForm.city}
                onChange={e => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Estado</label>
              <input
                type="text"
                value={customerForm.state}
                onChange={e => setCustomerForm(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                placeholder="SP"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-gray-700 mb-2">CEP</label>
              <input
                type="text"
                value={customerForm.zipCode}
                onChange={e => setCustomerForm(prev => ({ ...prev, zipCode: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Data de Nascimento (opcional)</label>
            <input
              type="date"
              value={customerForm.birthDate}
              onChange={e => setCustomerForm(prev => ({ ...prev, birthDate: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Observações / Notas do Serviço (opcional)</label>
            <textarea
              value={customerForm.notes}
              onChange={e => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              placeholder="Ex: Cliente vai retirar na segunda-feira..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Termos e Garantia (Editável para este pedido)</label>
            <textarea
              value={customerForm.customPolicies || getFiscalConfig()?.storePolicies || ''}
              onChange={e => setCustomerForm(prev => ({ ...prev, customPolicies: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none text-xs"
              placeholder="Políticas específicas para esta venda..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">Forma de Pagamento *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                { value: 'pix', label: 'PIX', icon: '📱' },
                { value: 'debito', label: 'Débito', icon: '💳' },
                { value: 'credito', label: 'Crédito', icon: '💳' }
              ].map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === method.value
                    ? 'border-versiory-coral bg-versiory-coral/10 text-versiory-coral'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl mb-1 block">{method.icon}</span>
                  <span className="text-sm font-bold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'credito' && (
            <div className="bg-white/50 p-4 rounded-xl border-2 border-blue-200 animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-black text-blue-900 mb-2">Parcelamento (Crédito)</label>
              <select
                value={installments}
                onChange={e => setInstallments(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white font-bold text-slate-700"
              >
                {(() => {
                  // ERRCOM088: Calcular limite máximo de parcelas baseado nos produtos do carrinho
                  const maxInstallments = Math.max(1, ...cart.map(item => item.product.installments || 1));
                  const cardRate = cart[0]?.product.cardRate || 0;
                  return [...Array(Math.min(maxInstallments, 12))].map((_, i) => {
                    const n = i + 1;
                    const installments = calculateInstallments({
                      total,
                      installments: n,
                      cardRate
                    });
                    const amount = installments[0]?.amount || total / n;
                    return (
                      <option key={n} value={n}>
                        {n}x de {formatCurrency(amount)} {n === 1 ? '(Sem juros)' : ''}
                      </option>
                    );
                  });
                })()}
              </select>
            </div>
          )}

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
            <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
              <span>Subtotal:</span>
              <span className="font-bold">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-emerald-600 mb-2">
                <span>Desconto ({discountType === 'percentual' ? `${discountAmount}%` : 'Fixo'}):</span>
                <span className="font-bold">- R$ {actualDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm font-black text-gray-900">Total a Pagar:</span>
              <span className="text-2xl font-black text-versiory-coral">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => handleSubmit(null as any, true)}
                disabled={isSubmitting}
                className="flex-1 bg-versiory-ink hover:bg-[#1b2a3a] text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                📝 Gerar Orçamento
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-coral-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {emitNF ? 'Gerando NF-e...' : 'Finalizando...'}
                  </>
                ) : (
                  editingOrder?.isBudget ? '✓ Converter em Venda' : (emitNF ? '✓ Finalizar com NF-e' : 'Confirmar Venda')
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PdvCheckoutModal;
