import React, { useState, useEffect } from 'react';
import { generateInvoice } from '../services/invoice';
import { CartItem, Order, OrderItem, Customer } from '../types';
import { getFiscalConfig } from '../services/fiscalConfig';
import { sanitizeData } from '../services/utils';
import { calculateInstallments } from '../utils/installments';
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
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credito' | 'whatsapp'>('whatsapp'); // REFCOM135.5: Alterado 'credit' para 'credito'
  const [installments, setInstallments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStorePickup, setIsStorePickup] = useState(false); // REFCOM169
  const [orderNotes, setOrderNotes] = useState('');
  const [emitNF, setEmitNF] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<'none' | 'generating' | 'ready'>('none');
  // REFCOM169: Endere莽o de Retire na Loja das Configura莽玫es Fiscais
  const [storePickupAddress, setStorePickupAddress] = useState('');

  // REFCOM169: Carregar endere莽o de Retire na Loja das Configura莽玫es Fiscais
  useEffect(() => {
    const fiscalConfig = getFiscalConfig();
    if (fiscalConfig?.enderecoRetireLoja) {
      setStorePickupAddress(fiscalConfig.enderecoRetireLoja);
    } else if (fiscalConfig?.endereco) {
      // Se n茫o houver endere莽o espec铆fico para Retire na Loja, usar o endere莽o principal
      const fullAddress = `${fiscalConfig.endereco}${fiscalConfig.cidade ? `, ${fiscalConfig.cidade}` : ''}${fiscalConfig.estado ? ` - ${fiscalConfig.estado}` : ''}${fiscalConfig.cep ? `, CEP: ${fiscalConfig.cep}` : ''}`;
      setStorePickupAddress(fullAddress);
    }
  }, []);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  // Resetar ao fechar
  React.useEffect(() => {
    if (!isOpen) {
      setOrderPlaced(false);
      // REFCOM093: Gerar novo c贸digo a cada abertura do checkout
      setOtpCode(Math.floor(1000 + Math.random() * 9000).toString());
      setOtpSent(false);
      setIsOtpVerified(false);
      setOtpError('');
    }
  }, [isOpen]);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('default');
  const [customAddress, setCustomAddress] = useState(customerAddress);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  // REFCOM093: Gerar c贸digo automaticamente ao montar (sem etapa de clique)
  const [otpCode, setOtpCode] = useState<string>(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [customerPhone, setCustomerPhone] = useState(''); // ERRCOM070
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState(''); // ERRCOM070
  const [customerBirthDate, setCustomerBirthDate] = useState(''); // REFCOM166/181: Data de Nascimento
  // ERRCOM080: Campos de endere莽o estruturados
  const [addressZip, setAddressZip] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');

  // C谩lculo robusto de e-mail e endere莽o efetivos (fallback para localStorage se prop estiver vazio)
  const { effectiveEmail, effectiveAddress } = React.useMemo(() => {
    let email = customerEmail;
    let address = customerAddress;
    try {
      const lastUser = localStorage.getItem('versiory_last_user');
      if (lastUser) {
        const savedUser = localStorage.getItem(`versiory_user_${lastUser}`);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (!email && parsed.email) email = parsed.email;
          if (!address && parsed.address) address = parsed.address;
        }
      }
    } catch { }
    return { effectiveEmail: email, effectiveAddress: address };
  }, [customerEmail, customerAddress]);
  const hasService = items.some(item => item.category === 'Servi莽os');

  const effectiveIsStorePickup = isStorePickup;

  const getItemPrice = (item: any, pickup: boolean) =>
    pickup ? (item.pricePOS || item.price) : (item.priceEcommerce || item.price);

  // Carregar dados do cliente ao abrir
  React.useEffect(() => {
    if (isOpen && effectiveEmail) {
      const loadCustomer = async () => {
        try {
          setIsLoadingCustomer(true);
          const { getCustomers } = await import('../services/firebase');
          const customers = await getCustomers();
          const found = customers.find(c => c.email === effectiveEmail);
          if (found) {
            setCustomerData(found);
            // ERRCOM100: Priorizar endere莽o padr茫o e evitar formul谩rio manual desnecess谩rio
            if (found.addresses && found.addresses.length > 0) {
              const defaultAddr = found.addresses.find(a => a.isDefault) || found.addresses[0];
              setSelectedAddressId(defaultAddr.id || 'default_0');
              const fullAddr = `${defaultAddr.street}, ${defaultAddr.number}${defaultAddr.complement ? ` - ${defaultAddr.complement}` : ''}, ${defaultAddr.neighborhood}, ${defaultAddr.city} - ${defaultAddr.state}, CEP: ${defaultAddr.zipCode}`;
              setCustomAddress(fullAddr);
            } else {
              setSelectedAddressId('manual');
              setCustomAddress(customerAddress || '');
            }
            if (found.phone) setCustomerPhone(found.phone);
            if (found.cpfCnpj) setCustomerCpfCnpj(found.cpfCnpj);
            if (found.birthDate) setCustomerBirthDate(found.birthDate); // REFCOM166/181
          } else {
            setSelectedAddressId('manual');
            setCustomAddress(customerAddress || '');
          }
        } catch (error) {
          console.error('Erro ao carregar dados do cliente:', error);
          setSelectedAddressId('manual');
        } finally {
          setIsLoadingCustomer(false);
        }
      };
      loadCustomer();
    }
  }, [isOpen, effectiveEmail, customerAddress]);

  // ERRCOM134: No checkout online, priorizar priceEcommerce
  // REFCOM169: Se for Retire na Loja, usar pricePOS
  // REFCOM211: Para servi莽os, aplicar pre莽o baseado no m茅todo de entrega (Retira Loja = pricePOS, Entrega Normal = priceEcommerce)
  const subtotal = items.reduce((sum, item) => {
    const activePrice = getItemPrice(item, effectiveIsStorePickup);
    return sum + activePrice * item.quantity;
  }, 0);
  const total = Math.max(0, subtotal - discount);

  // ERRCOM124: Valida莽茫o din芒mica de cupons via Firebase (substituindo hardcoded)
  const applyCoupon = async () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    if (!code) {
      setCouponError('Digite um cupom');
      return;
    }

    try {
      const { validateAndUseCoupon } = await import('../services/firebase');
      const { coupon, error } = await validateAndUseCoupon(code);

      if (error || !coupon) {
        setCouponError(error || 'Cupom inv谩lido ou expirado');
        return;
      }

      // Calcular desconto
      const d = coupon.tipo === 'percentual'
        ? subtotal * (coupon.valor / 100)
        : coupon.valor;

      setDiscount(Math.min(d, subtotal)); // desconto n茫o pode ser maior que subtotal
      setCouponApplied(true);
    } catch {
      setCouponError('Erro ao validar cupom. Tente novamente.');
    }
  };


  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  };

  const handleCheckout = async () => {
    if (!isOtpVerified) {
      alert('鈿狅笍 Por favor, digite o c贸digo de seguran莽a exibido acima para validar sua identidade antes de finalizar o pedido.');
      return;
    }

    if (orderPlaced) return; // Seguran莽a extra

    setOrderPlaced(true); // ERRCOM082: bloquear imediatamente antes de qualquer await
    setIsProcessing(true);

    try {
      const { saveOrder, getCustomers, saveCustomer, getProducts, saveProduct, saveInventoryMovement } = await import('../services/firebase');

      // ERRCOM112: Valida莽茫o de estoque em tempo real no checkout
      const currentProducts = await getProducts();
      for (const item of items) {
        if (item.category === 'Servi莽os') continue;
        const actualProduct = currentProducts.find(p => p.id === item.id);
        if (!actualProduct) {
          alert(`鉂� O produto ${item.name} n茫o est谩 mais dispon铆vel no cat谩logo.`);
          setIsProcessing(false);
          setOrderPlaced(false);
          return;
        }

        let availableStock = actualProduct.stock || 0;

        // Verifica varia莽玫es espec铆ficas de estoque
        if (item.selectedSize && item.selectedColor && actualProduct.stockBySizeColor && actualProduct.stockBySizeColor[`${item.selectedSize}-${item.selectedColor}`] !== undefined) {
          availableStock = Number(actualProduct.stockBySizeColor[`${item.selectedSize}-${item.selectedColor}`]);
        } else if (item.selectedSize && actualProduct.stockBySize && actualProduct.stockBySize[item.selectedSize] !== undefined) {
          availableStock = Number(actualProduct.stockBySize[item.selectedSize]);
        }

        if (item.quantity > availableStock) {
          alert(`鉂� Estoque insuficiente para ${item.name}. Desejado: ${item.quantity}, Dispon铆vel: ${availableStock}.`);
          setIsProcessing(false);
          setOrderPlaced(false);
          return;
        }
      }

      const orderId = generateOrderId();
      let fullName = customerData?.name || '';

      if (!fullName) {
        try {
          const lastUser = localStorage.getItem('versiory_last_user');
          if (lastUser) {
            const savedUser = localStorage.getItem(`versiory_user_${lastUser}`);
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              fullName = parsed.name || parsed.email.split('@')[0];
            }
          }
        } catch { }
      }
      if (!fullName) fullName = effectiveEmail.split('@')[0];

      // ERRCOM086 / ERRCOM070: Garantir que o telefone e CPF venham do estado atualizado (inputs) ou do customerData
      const finalPhone = customerPhone || customerData?.phone || '';
      const finalCpfCnpj = customerCpfCnpj || customerData?.cpfCnpj || '';

      // Consolidar endere莽o se for manual
      let finalAddress = customAddress;
      if (selectedAddressId === 'manual') {
        finalAddress = `${addressStreet}, ${addressNumber}${addressComplement ? ` - ${addressComplement}` : ''}, ${addressNeighborhood}, ${addressCity} - ${addressState}, CEP: ${addressZip}`;
      }

      const orderData: Order = {
        id: orderId,
        customerId: customerData?.id || 0,
        customerEmail: effectiveEmail,
        customerName: fullName,
        customerPhone: finalPhone || undefined,
        customerCpfCnpj: finalCpfCnpj || undefined, // ERRCOM070 / ERRCOM081
        customerBirthDate: customerBirthDate || undefined, // REFCOM193
        date: new Date().toISOString(),
        total: total,
        discountAmount: discount > 0 ? discount : undefined, // ERRCOM108
        couponCode: couponApplied ? couponCode.toUpperCase().trim() : undefined, // ERRCOM108
        status: 'reserved',
        address: effectiveIsStorePickup ? `Retirada na Loja - ${storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP'}` : finalAddress,
        estimatedDelivery: effectiveIsStorePickup ? 'Retirada imediata (Seg-Sex: 09h 脿s 18h)' : '5 a 10 dias 煤teis', // REFCOM169
        items: items.map(item => {
          const itemPrice = getItemPrice(item, effectiveIsStorePickup);

          const orderItem: any = {
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: itemPrice, // REFCOM169/REFCOM211
            priceEcommerce: itemPrice, // REFCOM169/REFCOM211: Salvar pre莽o correto baseado em categoria e isStorePickup
            image: item.image,
            description: item.description,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            installments: paymentMethod === 'credito' ? installments : 1
          };
          if (item.stockBySize) orderItem.stockBySize = item.stockBySize; // Include stockBySize
          if (item.stockBySizeColor) orderItem.stockBySizeColor = item.stockBySizeColor; // Include stockBySizeColor
          return orderItem;
        }),
        notes: orderNotes || '',
        salesChannel: 'online',
        orderTime: new Date().toLocaleTimeString('pt-BR'), // ERRCOM083
        // REFCOM223/REFCOM224: parcelamento vale para Cr茅dito e para WhatsApp (a combinar)
        installments: (paymentMethod === 'credito' || paymentMethod === 'whatsapp') ? installments : 1, // ERRCOM088
        paymentMethod: paymentMethod, // REFCOM135: Garantir que paymentMethod seja salvo
        stockDecremented: true, // REFCOM219: Marcar que estoque j谩 foi baixado no checkout (status reserved)
        installmentDetails: (paymentMethod === 'credito' || paymentMethod === 'whatsapp') && installments > 1 ? (() => {
          const cardRate = items[0]?.cardRate || 0;
          return calculateInstallments({
            total,
            installments,
            cardRate
          }).map((inst, i) => ({
            id: `${orderId}-inst-${i + 1}`,
            number: inst.number,
            amount: inst.amount,
            status: 'pending' as const,
            paymentMethod: paymentMethod === 'whatsapp' ? 'WhatsApp' : 'Credito'
          }));
        })() : undefined // REFCOM135: Gerar installmentDetails no checkout tamb茅m
      }; // REFCOM135.5: paymentMethod === 'credito' needs to be 'credito'

      // Atualizar no Firebase
      let targetCustomer: Customer;

      const finalCpfCnpjForSearch = customerCpfCnpj || customerData?.cpfCnpj || '';

      if (customerData) {
        targetCustomer = { ...customerData };
        if (customerBirthDate) targetCustomer.birthDate = customerBirthDate; // REFCOM166/181
        targetCustomer.totalOrders = (targetCustomer.totalOrders || 0) + 1;
        targetCustomer.totalSpent = (targetCustomer.totalSpent || 0) + total;
        if (!targetCustomer.orderHistory) targetCustomer.orderHistory = [];
        targetCustomer.orderHistory.push({ ...orderData, emitNF } as any);
        orderData.customerId = targetCustomer.id;
      } else {
        const customers = await getCustomers();
        let existing = customers.find(c => {
          if (finalCpfCnpjForSearch && c.cpfCnpj) {
            return c.cpfCnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === finalCpfCnpjForSearch.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          }
          if (!finalCpfCnpjForSearch && !c.cpfCnpj) {
            return c.email === effectiveEmail;
          }
          return false;
        });

        if (!existing && !finalCpfCnpjForSearch) {
          existing = customers.find(c => c.email === effectiveEmail);
        }

        if (existing) {
          targetCustomer = { ...existing };
          if (customerBirthDate) targetCustomer.birthDate = customerBirthDate; // REFCOM166/181
          targetCustomer.totalOrders = (targetCustomer.totalOrders || 0) + 1;
          targetCustomer.totalSpent = (targetCustomer.totalSpent || 0) + total;
          if (finalCpfCnpjForSearch && !targetCustomer.cpfCnpj) {
            targetCustomer.cpfCnpj = finalCpfCnpjForSearch;
          }
          if (!targetCustomer.orderHistory) targetCustomer.orderHistory = [];
          targetCustomer.orderHistory.push({ ...orderData, emitNF } as any);
          orderData.customerId = targetCustomer.id;
        } else {
          targetCustomer = {
            id: Date.now(),
            name: fullName,
            email: effectiveEmail,
            phone: customerPhone,
            cpfCnpj: finalCpfCnpjForSearch || undefined,
            birthDate: customerBirthDate || undefined, // REFCOM166/181
            totalOrders: 1,
            totalSpent: total,
            addresses: [],
            createdAt: new Date().toISOString(),
            orderHistory: [{ ...orderData, emitNF } as any]
          };
          orderData.customerId = targetCustomer.id;
        }
      }

      // ERRCOM082: Preven莽茫o de duplicatas
      setOrderPlaced(true);

      // BUGFIX: Sanitizar objetos antes de salvar 鈥� Firestore rejeita campos 'undefined'
      const sanitizedOrder = sanitizeData(orderData);
      const sanitizedCustomer = sanitizeData(targetCustomer);

      await Promise.all([
        saveOrder(sanitizedOrder),
        saveCustomer(sanitizedCustomer)
      ]);

        // REFCOM190/REFCOM199: Baixar estoque para pedido de e-commerce com status Reservado, incluindo servi莽os
        const allProducts = await getProducts();
        for (const item of items) {
          const productIndex = allProducts.findIndex(p => p.id === item.id);
          if (productIndex === -1) continue;
          const p = allProducts[productIndex];
        const previousStock = p.stock || 0;
        const newStock = Math.max(0, previousStock - item.quantity);

        const updatedProduct: any = { ...p, stock: newStock };

        if (item.selectedSize && p.stockBySize) {
          updatedProduct.stockBySize = {
            ...p.stockBySize,
            [item.selectedSize]: Math.max(0, (p.stockBySize[item.selectedSize] || 0) - item.quantity)
          };
        }

        if (item.selectedColor && p.stockBySizeColor) {
          const key = item.selectedSize ? `${item.selectedSize}-${item.selectedColor}` : item.selectedColor;
          updatedProduct.stockBySizeColor = {
            ...p.stockBySizeColor,
            [key]: Math.max(0, (p.stockBySizeColor[key] || 0) - item.quantity)
          };
        }

        const sanitizedProduct = sanitizeData(updatedProduct);
        await saveProduct(sanitizedProduct);

        const movement = {
          id: Date.now() + item.id,
          productId: item.id,
          productName: item.name,
          type: 'out' as const,
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Pedido ${orderId} - Status Reservado`,
          date: new Date().toISOString(),
          user: 'Sistema'
        };
        await saveInventoryMovement(movement);
      }

      if (emitNF) {
        setInvoiceStatus('generating');
        setTimeout(() => setInvoiceStatus('none'), 2000);
      }

      if (paymentMethod === 'whatsapp') {
        const message = buildWhatsAppMessage(orderId, fullName, effectiveEmail, effectiveIsStorePickup ? (storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP') : customAddress, paymentMethod);
        const { STORE_WHATSAPP_NUMBER } = await import('../services/firebase');
        const url = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else if (paymentMethod === 'credito') {
        // REFCOM161: Integra莽茫o WhatsApp autom谩tica para vendas em cr茅dito
        const message = buildWhatsAppMessage(orderId, fullName, effectiveEmail, effectiveIsStorePickup ? (storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP') : finalAddress, paymentMethod);
        const { STORE_WHATSAPP_NUMBER } = await import('../services/firebase');
        const url = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        alert('Pagamento via cart茫o em desenvolvimento. Seu pedido foi registrado com sucesso!');
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

  const buildWhatsAppMessage = (orderId: string, fullName: string, email: string, address: string, paymentMethod: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    const lines = [
      `馃洅 *NOVO PEDIDO - ${orderId}*`,
      '',
      '*DADOS DO CLIENTE:*',
      `馃懁 Nome: ${fullName}`,
      `馃摟 Email: ${email}`,
      `馃摓 Telefone: ${customerData?.phone || 'N茫o informado'}`,
      `馃啍 CPF/CNPJ: ${customerData?.cpfCnpj || 'N茫o informado'}`,
      `馃搷 *Endere莽o de Entrega:* ${address}`,
      effectiveIsStorePickup ? `馃彫 *MODALIDADE:* Retire na Loja` : `馃殮 *MODALIDADE:* Entrega via Transportadora`,
      '',
      '*DETALHES DA VENDA:*',
      `锟� Data da Venda: ${dateStr} ${timeStr}`,
      `馃挸 Forma de Pagto: ${paymentMethod === 'whatsapp' ? 'A combinar' : paymentMethod === 'credito' ? `CR脡DITO (${installments}x)` : paymentMethod.toUpperCase()}`,
      `馃彿锔� Origem: E-commerce (Site)`,
      '',
      '*ITENS DO PEDIDO:*',
      ...items.map(item => {
        const details = [];
        if (item.selectedSize) details.push(`Tamanho: ${item.selectedSize}`);
        if (item.selectedColor) details.push(`Cor: ${item.selectedColor}`);
        const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
        const unitPrice = getItemPrice(item, effectiveIsStorePickup);
        return `鈥� ${item.name}${detailsStr} x${item.quantity} - R$ ${(unitPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }),
      '',
      `*TOTAL: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
      '',
      // REFCOM255: Add installment details for parcelled purchases
      (paymentMethod === 'credito' || paymentMethod === 'whatsapp') && installments > 1 ? [
        '*PARCELAS:*',
        ...Array.from({ length: installments }, (_, i) => {
          const installmentNum = i + 1;
          const installmentAmount = (total / installments).toFixed(2);
          return `- Parcela ${installmentNum}/${installments}: R$ ${installmentAmount} (Pendente)`;
        }),
        ''
      ].join('\n') : '',
      orderNotes ? `*Observa莽玫es:* ${orderNotes}` : '',
      '',
      'Ol谩! Gostaria de finalizar o pagamento deste pedido, poderia verificar se ainda tem em estoque, quais s茫o as formas de pagamento e os pr贸ximos passos? 馃檹'
    ];
    return lines.filter(line => line !== '').join('\n');
  };

  const handlePrintReceipt = async () => {
    const { generateReceiptHTML } = await import('../utils/receiptGenerator');
    const orderId = generateOrderId();
    const { getFiscalConfig } = await import('../services/fiscalConfig');
    const fiscalConfig = getFiscalConfig();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR'); // ERRCOM081/083

    let customerPhone = undefined;
    try {
      const lastUser = localStorage.getItem('versiory_last_user');
      if (lastUser) {
        const savedUser = localStorage.getItem(`versiory_user_${lastUser}`);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.phone) customerPhone = parsed.phone;
        }
      }
    } catch { }

    const receiptContent = generateReceiptHTML({
      orderId,
      date: dateStr,
      orderTime: timeStr, // ERRCOM083
      customerName: customerData?.name || (effectiveEmail ? effectiveEmail.split('@')[0] : 'N茫o informado'),
      customerEmail: effectiveEmail,
      customerAddress: effectiveIsStorePickup ? `Retirada na Loja - ${storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP'}` : (customAddress || effectiveAddress),
      customerPhone: customerData?.phone || customerPhone,
      customerCpfCnpj: customerData?.cpfCnpj || undefined, // ERRCOM081
      customerBirthDate: customerData?.birthDate || customerBirthDate || undefined, // REFCOM193
      notes: orderNotes,
      storePolicies: fiscalConfig?.storePolicies,
      items: items.map(item => {
        const itemPrice = getItemPrice(item, effectiveIsStorePickup);
        return { ...item, productId: item.id, price: itemPrice, installments: paymentMethod === 'credito' ? installments : 1 };
      }), 
      total: total,
      // REFCOM224: Salvar 'WhatsApp' como forma de pagamento para identifica莽茫o no Contas a Receber
      paymentMethod: paymentMethod === 'whatsapp' ? 'WhatsApp' : paymentMethod, // REFCOM135: Salvar paymentMethod como 'credito' para verifica莽茫o correta
      salesChannel: paymentMethod === 'whatsapp' ? 'whatsapp' : 'online',
      // REFCOM224: vendas a combinar no WhatsApp tamb茅m podem ser parceladas
      installments: (paymentMethod === 'credito' || paymentMethod === 'whatsapp') ? installments : 1,
      discountAmount: discount > 0 ? discount : undefined, // REFCOM151
      discountType: 'fixed', // REFCOM151
      couponCode: couponApplied ? couponCode : undefined // REFCOM151
    });

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => {
          if (items.length > 0 && !orderPlaced) {
            if (window.confirm('Deseja realmente sair? Seu progresso no checkout ser谩 perdido.')) {
              onClose();
            }
          } else {
            onClose();
          }
        }}
      />

      <div className="relative w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-200 flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-900">Finalizar Pedido</h3>
          <button
            onClick={() => {
              if (items.length > 0 && !orderPlaced) {
                if (window.confirm('Deseja realmente sair?')) onClose();
              } else {
                onClose();
              }
            }}
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
                <div key={`${item.id}-${item.selectedSize || 'no-size'}-${item.selectedColor || 'no-color'}`} className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg shadow-md" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedSize && (
                          <span className="inline-block px-2 py-1 bg-versiory-coral/20 text-versiory-coral text-xs font-bold rounded">
                            Tamanho: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-600 text-xs font-bold rounded">
                            Cor: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Qtd: {item.quantity}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 whitespace-nowrap">
                    R$ {(getItemPrice(item, effectiveIsStorePickup) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}

              <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                    <span>Desconto ({couponCode.toUpperCase()})</span>
                    <span>- R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-xl font-black text-versiory-coral">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Campo de Cupom */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied}
                placeholder="Tem um cupom de desconto?"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-versiory-coral outline-none disabled:bg-slate-100"
              />
              <button
                onClick={couponApplied ? () => { setDiscount(0); setCouponApplied(false); setCouponCode(''); } : applyCoupon}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${couponApplied ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-versiory-ink text-white hover:brightness-110'
                  }`}
              >
                {couponApplied ? 'Remover' : 'Aplicar'}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-500 mt-1 ml-2">{couponError}</p>}
            {couponApplied && <p className="text-xs text-emerald-600 mt-1 ml-2 font-bold">鉁� Cupom aplicado com sucesso!</p>}
          </div>

          {/* Dados de Entrega */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">Dados de Entrega</h4>

            {/* REFCOM169: Op莽茫o Retire na Loja */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => { 
                  setIsStorePickup(false); 
                  if (customerData?.addresses && customerData.addresses.length > 0) {
                    const defaultAddr = customerData.addresses.find(a => a.isDefault) || customerData.addresses[0];
                    setSelectedAddressId(defaultAddr.id || 'default_0');
                    const fullAddr = `${defaultAddr.street}, ${defaultAddr.number}${defaultAddr.complement ? ` - ${defaultAddr.complement}` : ''}, ${defaultAddr.neighborhood}, ${defaultAddr.city} - ${defaultAddr.state}, CEP: ${defaultAddr.zipCode}`;
                    setCustomAddress(fullAddr);
                  } else {
                    setSelectedAddressId('manual');
                    setCustomAddress(customerAddress || '');
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${!isStorePickup ? 'border-versiory-coral bg-versiory-coral/5' : 'border-slate-100 bg-white'}`}
              >
                <span className="text-xl">馃殮</span>
                <span className="text-xs font-black uppercase">Entrega Normal</span>
              </button>
              <button
                onClick={() => { setIsStorePickup(true); setSelectedAddressId('store'); setCustomAddress(storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP'); }}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isStorePickup ? 'border-versiory-coral bg-versiory-coral/5' : 'border-slate-100 bg-white'}`}
              >
                <span className="text-xl">馃彧</span>
                <span className="text-xs font-black uppercase">Retire na Loja</span>
              </button>
            </div>

            {isStorePickup && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-in fade-in duration-300">
                <p className="text-sm font-bold text-blue-900 mb-2">馃搷 Endere莽o para Retirada:</p>
                <p className="text-xs text-blue-800 leading-relaxed">{storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP'}<br/>Segunda a Sexta: 09h 脿s 18h</p>
                <div className="mt-3 h-32 w-full rounded-xl overflow-hidden border border-blue-200 grayscale contrast-125">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(storePickupAddress || 'Rua do Com茅rcio, 123 - Centro, S茫o Paulo - SP')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full object-cover"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="text-[10px] text-blue-600 mt-2 font-bold italic">馃挕 Nesta modalidade voc锚 economiza no frete e paga pre莽o de loja f铆sica!</p>
              </div>
            )}

            {/* ERRCOM100: Sele莽茫o de Endere莽os Cadastrados */}
            {!isStorePickup && customerData && customerData.addresses && customerData.addresses.length > 0 ? (
              <div className="space-y-3 mb-4">
                <p className="text-sm text-slate-600 mb-2">Selecione um endere莽o:</p>
                {customerData.addresses.map((addr, idx) => (
                  <label
                    key={addr.id || idx}
                    className={`flex items-start p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedAddressId === (addr.id || String(idx))
                      ? 'border-versiory-coral bg-versiory-coral/5'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                  >
                    <input
                      type="radio"
                      name="address-selection"
                      className="mt-1 mr-3"
                      checked={selectedAddressId === (addr.id || String(idx))}
                      onChange={() => {
                        setSelectedAddressId(addr.id || String(idx));
                        const fullAddr = `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood}, ${addr.city} - ${addr.state}, CEP: ${addr.zipCode}`;
                        setCustomAddress(fullAddr);
                      }}
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-bold text-slate-900">{addr.street}, {addr.number}</p>
                      <p className="text-slate-600">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                      <p className="text-slate-500 text-xs">CEP: {addr.zipCode}</p>
                    </div>
                  </label>
                ))}

                <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedAddressId === 'manual'
                  ? 'border-versiory-coral bg-versiory-coral/5'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}>
                  <input
                    type="radio"
                    name="address-selection"
                    className="mr-3"
                    checked={selectedAddressId === 'manual'}
                    onChange={() => setSelectedAddressId('manual')}
                  />
                  <span className="text-sm font-bold text-slate-900">Outro endere莽o (digitar manual)</span>
                </label>
              </div>
            ) : !isLoadingCustomer ? (
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">Nenhum endere莽o cadastrado. Por favor, cadastre um endere莽o para entrega:</p>
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-versiory-coral border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">Buscando seus endere莽os...</p>
              </div>
            )}

            {/* ERRCOM100: Formul谩rio manual - s贸 aparece quando selecionado ou quando n茫o h谩 endere莽os */}
            {!isLoadingCustomer && (selectedAddressId === 'manual' || !customerData?.addresses?.length) && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="mb-3">
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-medium text-slate-900">{effectiveEmail || 'N茫o informado'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone Celular *</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      value={customerCpfCnpj}
                      onChange={(e) => setCustomerCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={customerBirthDate}
                      onChange={(e) => setCustomerBirthDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 mb-1">Endere莽o de Entrega</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CEP</label>
                      <input
                        type="text"
                        value={addressZip}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setAddressZip(val);
                          if (val.length === 8) {
                            fetch(`https://viacep.com.br/ws/${val}/json/`)
                              .then(res => res.json())
                              .then(data => {
                                if (!data.erro) {
                                  setAddressStreet(data.logradouro);
                                  setAddressNeighborhood(data.bairro);
                                  setAddressCity(data.localidade);
                                  setAddressState(data.uf);
                                }
                              });
                          }
                        }}
                        placeholder="00000-000"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        placeholder="Ex: Av. Paulista"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">N煤mero</label>
                      <input
                        type="text"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="123"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Complemento</label>
                      <input
                        type="text"
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        placeholder="Apt 42"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bairro</label>
                      <input
                        type="text"
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
                        placeholder="Centro"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cidade / UF</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                        />
                        <input
                          type="text"
                          value={addressState}
                          onChange={(e) => setAddressState(e.target.value.toUpperCase())}
                          className="w-16 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* M茅todo de Pagamento */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">M茅todo de Pagamento</h4>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-versiory-coral transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="whatsapp"
                  checked={paymentMethod === 'whatsapp'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'pix' | 'credito')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">WhatsApp</p>
                  <p className="text-sm text-slate-600">Finalize seu pedido diretamente pelo WhatsApp</p>
                </div>
                <span className="text-green-600">鉁� Recomendado</span>
              </label>

              <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-versiory-coral transition-colors opacity-50">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'pix' | 'credito')}
                  className="mr-3"
                  disabled
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">PIX</p>
                  <p className="text-sm text-slate-600">Pagamento instant芒neo via PIX (em breve)</p>
                </div>
                <span className="text-slate-400">Em breve</span>
              </label>

              <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-versiory-coral transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="credito"
                  checked={paymentMethod === 'credito'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'pix' | 'credito')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Cart茫o de Cr茅dito</p>
                  <p className="text-sm text-slate-600">Parcele em at茅 12x sem juros</p>
                </div>
              </label>

              {/* REFCOM223/REFCOM224: parcelamento dispon铆vel tanto para Cr茅dito quanto para
                  WhatsApp (a combinar), gerando lan莽amentos interdependentes no Contas a Receber. */}
              {(paymentMethod === 'credito' || paymentMethod === 'whatsapp') && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <label className="block text-sm font-black text-blue-900 mb-2">
                    Parcelamento {paymentMethod === 'whatsapp' ? '(a combinar)' : ''}
                  </label>
                  <select
                    value={installments}
                    onChange={e => setInstallments(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white font-bold text-slate-700"
                  >
                    {(() => {
                      // ERRCOM088: Calcular limite m谩ximo de parcelas baseado nos produtos do carrinho
                      const maxInstallments = Math.max(1, ...items.map(item => item.installments || 1));
                      const cardRate = items[0]?.cardRate || 0;
                      return [...Array(Math.min(maxInstallments, 12))].map((_, i) => {
                        const n = i + 1;
                        const installmentList = calculateInstallments({
                          total,
                          installments: n,
                          cardRate
                        });
                        const amount = installmentList[0]?.amount || total / n;
                        return (
                          <option key={n} value={n}>
                            {n}x de R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {n === 1 ? '(Sem juros)' : ''}
                          </option>
                        );
                      });
                    })()}
                  </select>
                  {installments > 1 && (
                    <p className="text-xs text-blue-800 font-bold mt-2">
                      Ser茫o gerados {installments} lan莽amentos interdependentes no Contas a Receber
                      quando o pedido for marcado como &quot;Pagamento Efetuado&quot;.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Observa莽玫es */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-4">Observa莽玫es (opcional)</h4>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Alguma informa莽茫o adicional sobre seu pedido?"
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-versiory-coral"
            />
          </div>

          {/* Valida莽茫o de Seguran莽a (REFCOM093) */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-lg">馃洝锔�</span> Valida莽茫o de Seguran莽a
            </h4>
            <p className="text-xs text-slate-600 mb-3">Para sua seguran莽a, valide o c贸digo abaixo antes de finalizar o pedido.</p>

            {!isOtpVerified ? (
              <div className="space-y-3">
                <div className="bg-amber-100 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-amber-800 font-bold mb-1">C脫DIGO DE SEGURAN脟A GERADO:</p>
                  <span className="text-3xl font-black text-amber-900 tracking-[0.4em] select-all">{otpCode}</span>
                  <p className="text-[10px] text-amber-700 mt-1">Anote este c贸digo e digite-o abaixo para confirmar.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Digite o c贸digo de 4 d铆gitos"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-center font-black tracking-[0.5em] focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength={4}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === otpCode && val.length === 4) {
                        setIsOtpVerified(true);
                        setOtpError('');
                      } else if (val.length === 4) {
                        setOtpError('C贸digo incorreto. Tente novamente.');
                      } else {
                        setOtpError('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      // Gerar novo c贸digo
                      setOtpCode(Math.floor(1000 + Math.random() * 9000).toString());
                      setIsOtpVerified(false);
                      setOtpError('');
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    title="Gerar novo c贸digo"
                  >
                    馃攧
                  </button>
                </div>
                {otpError && <p className="text-[10px] text-red-500 font-bold">{otpError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm">
                <span className="text-lg">鉁�</span> C贸digo validado com sucesso!
              </div>
            )}
          </div>

          {/* Bot玫es de A莽茫o */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrintReceipt}
              className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cupom
            </button>
            <button
              type="button"
              onClick={() => setEmitNF(true)}
              disabled={emitNF}
              className="flex-1 border border-blue-300 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {emitNF ? 'NF Solicitada' : 'Nota Fiscal'}
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || orderPlaced}
              className={`flex-1 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${orderPlaced ? 'bg-emerald-600' : 'bg-versiory-coral hover:bg-[#ff8368]'
                }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {invoiceStatus === 'generating' ? 'Gerando NF-e...' : 'Processando...'}
                </span>
              ) : (
                orderPlaced ? 'Pedido Conclu铆do!' : 'Finalizar Pedido'
              )}
            </button>
          </div>

          {emitNF && (
            <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in flip-in-x duration-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg">馃晵</div>
                <div>
                  <h5 className="font-black text-amber-900">Pedido Realizado com Sucesso!</h5>
                  <p className="text-sm text-amber-700 font-medium">Sua solicita莽茫o de Nota Fiscal foi registrada. Ela estar谩 dispon铆vel para download assim que o administrador confirmar seu pagamento.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 border border-amber-300 text-amber-800 py-3 rounded-xl font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Recibo
                </button>
                <button
                  onClick={() => {
                    const savedOrders = JSON.parse(localStorage.getItem('versiory_orders') || '[]');
                    const lastOrder = savedOrders[savedOrders.length - 1];
                    if (lastOrder) {
                      const message = buildWhatsAppMessage(lastOrder.id, lastOrder.customerName, effectiveEmail, lastOrder.address || effectiveAddress, 'whatsapp');
                      const url = `https://wa.me/5511958540171?text=${encodeURIComponent(message)}`;
                      window.open(url, '_blank');
                    }
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  WhatsApp
                </button>
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
