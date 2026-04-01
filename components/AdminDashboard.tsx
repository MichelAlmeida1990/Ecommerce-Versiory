import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Product,
  CategoryItem,
  Order,
  Customer,
  TrackingItem,
  InventoryMovement,
  Expense,
  SizeChart
} from '../types';
import PdvCheckoutModal from './PdvCheckoutModal';
import FiscalConfigModal from './FiscalConfigModal';
import FiscalFields from './FiscalFields';
import ImageGallery from './ImageGallery';
import SizeChartEditor from './SizeChartEditor';
import SizeStockManager from './SizeStockManager';
import ProductSizeSelector from './ProductSizeSelector';
import { sanitizeData } from '../services/utils';
import ProductMediaShowcase from './ProductMediaShowcase';
import CashRegisterReport from './CashRegisterReport';
import { saveProduct } from '../services/firebase';

interface AdminDashboardProps {
  products: Product[];
  categories: CategoryItem[];
  orders: Order[];
  customers: Customer[];
  tracking: TrackingItem[];
  inventoryMovements: InventoryMovement[];
  expenses: Expense[];
  userRole: 'admin' | 'seller';
  onLogout: () => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateTracking: (tracking: TrackingItem[]) => void;
  onUpdateInventoryMovements: (movements: InventoryMovement[]) => void;
  onUpdateExpenses: (expenses: Expense[]) => void;
}

type TabKey =
  | 'dashboard'
  | 'pdv'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'tracking'
  | 'inventory'
  | 'financial'
  | 'fiscal';

type StockFilter = 'all' | 'low' | 'out' | 'normal';

type TrackingStatus = TrackingItem['status'];

type OrderStatus = Order['status'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-versiory-coral/20 text-versiory-coral',
  delivered: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-slate-800 text-white',
  budget: 'bg-purple-100 text-purple-800',
  returned: 'bg-orange-100 text-orange-800'
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Aguardando Pagamento',
  paid: 'Pagamento Efetuado',
  processing: 'Em Processamento',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  budget: 'Orçamento',
  returned: 'Devolução'
};

const TRACKING_COLORS: Record<TrackingStatus, string> = {
  posted: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-yellow-100 text-yellow-800',
  out_for_delivery: 'bg-versiory-coral/20 text-versiory-coral',
  delivered: 'bg-green-100 text-green-800',
  delayed: 'bg-slate-800 text-white'
};

const TRACKING_LABELS: Record<TrackingStatus, string> = {
  posted: 'Postado',
  in_transit: 'Em Transito',
  out_for_delivery: 'Saiu para Entrega',
  delivered: 'Entregue',
  delayed: 'Atrasado'
};

const BASE_CATEGORIES = ['Eletrônicos', 'Moda', 'Casa', 'Esportes', 'Cama, Mesa e Banho', 'Serviços'];

const BEDDING_SIZES = {
  'Lençol': 'Solteiro (88x188cm), Casal (138x188cm), Queen (158x198cm), King (186x198cm)',
  'Edredom': 'Solteiro (150x220cm), Casal (180x220cm), Queen (220x240cm), King (240x260cm)',
  'Colcha': 'Solteiro (150x220cm), Casal (180x220cm), Queen (220x240cm), King (240x260cm)',
  'Fronha': 'Padrão (50x70cm), Queen/King (50x90cm)',
  'Toalha de Banho': 'Padrão (70x140cm), Gigante (90x150cm), Banhão (100x150cm)',
  'Toalha de Rosto': 'Padrão (50x80cm)',
  'Toalha de Mesa': '4 lugares (140x140cm), 6 lugares (140x210cm), 8 lugares (160x270cm)'
};

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const formatOrderId = (id: string | number) => `#${id.toString().padStart(4, '0')}`;

// ERRCOM026: Corrigido para usar data local (evita fuso horário UTC -1 dia)
const formatDate = (value: string) => {
  if (!value) return '';
  // Se formato YYYY-MM-DD, parsear como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
  }
  // ISO string com horário
  const dt = new Date(value);
  return new Date(dt.getTime() + dt.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR');
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  orders,
  customers,
  tracking,
  inventoryMovements,
  expenses,
  userRole,
  onLogout,
  onUpdateProducts,
  onUpdateCategories,
  onUpdateOrders,
  onUpdateCustomers,
  onUpdateTracking,
  onUpdateInventoryMovements,
  onUpdateExpenses
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(userRole === 'seller' ? 'pdv' : 'dashboard');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [isFiscalConfigOpen, setIsFiscalConfigOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // ERRCOM110: Ferramenta de Resgate Total (Corrigida e Refatorada para ser mais robusta)
  const handleDeepRescue = async () => {
    console.log("🚀 [RESCUE] Iniciando busca exaustiva em todas as chaves do navegador...");
    let keysFound: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      // Ignoramos chaves internas do Firebase/Vite/Mixpanel
      if (key.includes('firebase') || key.includes('session') || key.includes('vite')) continue;
      
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value || '');
        
        // Heurística para identificar uma lista de produtos:
        // 1. É um array
        // 2. Tem pelo menos um item
        // 3. O primeiro item tem propriedades comuns de produto (name, price, id)
        // 4. E, idealmente, tem dados de variação (sizes, colors, stockBySize)
        const isLikelyProductList = Array.isArray(parsed) && parsed.length > 0 && 
                                    (parsed[0].name && parsed[0].price !== undefined && parsed[0].id !== undefined);
        
        if (isLikelyProductList) {
          const hasVariationData = parsed.some((p: any) => p.sizes || p.colors || p.stockBySize || p.stockBySizeColor);
          
          if (hasVariationData) { // Priorizamos listas com dados de variação
            keysFound.push(key);
            console.log(`🎯 [RESCUE] Backup de PRODUTOS DETALHADOS encontrado! Chave: "${key}" com ${parsed.length} itens.`, parsed);

            if (window.confirm(`🚨 DADOS DE PRODUTOS DETALHADOS LOCALIZADOS!\n\nA chave "${key}" contém ${parsed.length} produtos com tamanhos/cores.\n\nDeseja substituir os dados atuais do Firebase por este backup?`)) {
              setIsSubmitting(true);
              const { saveProduct } = await import('../services/firebase');
              for (const p of parsed) {
                const sanitized = sanitizeData(p);
                // Garantir campos fiscais básicos se ausentes
                if (!sanitized.ncm) sanitized.ncm = '00000000';
                if (!sanitized.unidade) sanitized.unidade = 'UN';
                await saveProduct(sanitized);
              }
              window.alert("✅ SUCESSO! Banco de dados restaurado. A página será atualizada.");
              window.location.reload();
              return;
            }
          } else { // Listas de produtos sem variação, apenas para log
            console.log(`💡 [RESCUE] Candidato a lista de produtos (sem variações) encontrado na chave: "${key}" com ${parsed.length} itens.`, parsed);
          }
        }
      } catch (e) {
        // console.warn(`⚠️ [RESCUE] Falha ao processar chave ${key} (não é JSON ou formato inesperado).`);
      }
    }

    if (keysFound.length === 0) {
      window.alert("❌ Nenhum backup de produtos detalhados (com tamanhos/cores) foi encontrado neste computador.\n\nSugestão: Verifique se você não cadastrou os produtos em aba anônima ou em outro navegador. Se você tiver um backup JSON, use o botão 'Baixar Dump para Análise' e me envie o arquivo.");
    }
  };

  // Função auxiliar para baixar tudo do LocalStorage para análise externa
  const downloadLocalStorageDump = () => {
    const dump = JSON.stringify(localStorage, null, 2);
    const blob = new Blob([dump], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_navegador_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // BUGFIX #15: Função para parser de valores decimais padrão brasileiro (2.226,89) ou americano (2226.89)
  const parseBrazilianFloat = (value: string): number => {
    if (!value) return 0;
    let clean = value.trim();
    // Se tiver vírgula, tratamos como formato BR (2.226,89)
    if (clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
    // Remove qualquer outro caractere não numérico exceto o ponto
    clean = clean.replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
  };


  const handleDownloadNFXml = (orderId?: string) => {
    const key = orderId ? `versiory_nf_xml_${orderId}` : 'versiory_nf_xml';
    const xml = localStorage.getItem(key);
    if (!xml) {
      alert('Nenhum arquivo XML encontrado.');
      return;
    }
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nfe-${orderId || 'versiory'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // BUGFIX #1 & #11: Função auxiliar para gerenciar baixa de estoque de forma consistente
  const updateStockProgressively = async (order: Order, type: 'decrement' | 'increment'): Promise<Product[]> => {
    const { saveProduct, saveInventoryMovement } = await import('../services/firebase');
    const updatedProductsList = [...products];
    const movements: InventoryMovement[] = [];

    for (const item of order.items) {
      const productIndex = updatedProductsList.findIndex(p => p.id === item.productId);
      if (productIndex === -1) continue;

      const p = updatedProductsList[productIndex];
      // Ignorar se for item sem estoque (opcional, dependendo se serviços tem estoque)
      // Mas a regra diz baixar estoque se tiver, então seguimos:
      
      const qty = item.quantity;
      const factor = type === 'decrement' ? -1 : 1;
      const newTotalStock = Math.max(0, (p.stock || 0) + (qty * factor));

      let newStockBySize = { ...(p.stockBySize || {}) };
      let newStockBySizeColor = { ...(p.stockBySizeColor || {}) };

      if (item.selectedSize && item.selectedColor && p.stockBySizeColor) {
        const key = `${item.selectedSize}-${item.selectedColor}`;
        newStockBySizeColor[key] = Math.max(0, (newStockBySizeColor[key] || 0) + (qty * factor));
        newStockBySize[item.selectedSize] = Math.max(0, (newStockBySize[item.selectedSize] || 0) + (qty * factor));
      } else if (item.selectedSize && p.stockBySize) {
        newStockBySize[item.selectedSize] = Math.max(0, (newStockBySize[item.selectedSize] || 0) + (qty * factor));
      }

      const updatedProduct: Product = {
        ...p,
        stock: newTotalStock,
        stockBySize: (p.sizes && Object.keys(newStockBySize).length > 0) ? newStockBySize : p.stockBySize,
        stockBySizeColor: (p.colors && Object.keys(newStockBySizeColor).length > 0) ? newStockBySizeColor : p.stockBySizeColor
      };

      // Sanitizar e salvar
      const sanitized = sanitizeData(updatedProduct);
      const saved = await saveProduct(sanitized);
      updatedProductsList[productIndex] = saved;

      // Registrar movimento de estoque
      movements.push({
        id: Date.now() + movements.length,
        productId: p.id,
        productName: p.name,
        type: type === 'decrement' ? 'out' : 'in',
        quantity: qty,
        previousStock: p.stock || 0,
        newStock: newTotalStock,
        reason: `Pedido ${order.id} - Status ${order.status}`,
        date: new Date().toISOString(),
        user: 'Sistema'
      });
    }

    if (movements.length > 0) {
      for (const m of movements) {
        await saveInventoryMovement(m);
      }
      onUpdateInventoryMovements([...inventoryMovements, ...movements]);
    }

    return updatedProductsList;
  };

  const [inventorySearch, setInventorySearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'Eletrônicos',
    image: '',
    images: [],
    description: '',
    rating: 0,
    reviews: 0,
    stock: 0,
    stockBySize: {},
    colors: '',
    stockBySizeColor: {},
    sizes: '',
    sizeChart: {},
    ncm: '',
    gtin: '',
    gtinTrib: '',
    cfop: '5102',
    cst: '00',
    origem: 0,
    unidade: 'UN',
    peso: 0,
    usoReformaTributaria: false,
    aliquotaCbs: 0,
    aliquotaIbs: 0,
    aliquotaIs: 0,
    cClassTrib: '',
    installments: 1
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    availableSizes: [] as string[],
    sizeType: 'none' as 'clothing' | 'shoes' | 'accessories' | 'none'
  });

  // PDV State
  const [pdvCart, setPdvCart] = useState<{ product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[]>([]);
  const [pdvSearch, setPdvSearch] = useState('');
  const [isPdvCheckoutModalOpen, setIsPdvCheckoutModalOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: number]: string }>({});
  const [pdvProductModal, setPdvProductModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [pdvModalSelection, setPdvModalSelection] = useState<{ size: string; color: string }>({ size: '', color: '' });
  const [cashRegister, setCashRegister] = useState<{ isOpen: boolean; openingAmount: number; currentBalance: number; openedAt: string | null }>(() => {
    const saved = localStorage.getItem('versiory_cash_register');
    return saved ? JSON.parse(saved) : {
      isOpen: false,
      openingAmount: 0,
      currentBalance: 0,
      openedAt: null
    };
  });

  // Sistema de caixa completo
  const [cashWithdrawals, setCashWithdrawals] = useState<Array<{ id: string; amount: number; reason: string; timestamp: string }>>(() => {
    const saved = localStorage.getItem('versiory_cash_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });
  const [cashDeposits, setCashDeposits] = useState<Array<{ id: string; amount: number; reason: string; timestamp: string }>>(() => {
    const saved = localStorage.getItem('versiory_cash_deposits');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [cashMovementForm, setCashMovementForm] = useState({ type: 'withdrawal', amount: 0, reason: '' });
  const [cashRegisterHistory, setCashRegisterHistory] = useState<Array<any>>(() => {
    const saved = localStorage.getItem('versiory_cash_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCashReportOpen, setIsCashReportOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);
  const [cashRegisterForm, setCashRegisterForm] = useState({ amount: 0 });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [orderStatusForm, setOrderStatusForm] = useState({
    orderId: '',
    status: 'pending' as OrderStatus,
    notes: ''
  });

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isDrillDownModalOpen, setIsDrillDownModalOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{ date: string, orderIds: string[] } | null>(null);
  const lastClickRef = useRef<{ time: number, index: number } | null>(null);

  const handleChartClick = (e: any) => {
    if (!e || !e.activeLabel) return;
    
    // Encontrar os dados do ponto clicado
    const data = last30DaysData.find(d => d.name === e.activeLabel);
    if (!data || !data.orderIds || data.orderIds.length === 0) return;

    const now = Date.now();
    const index = e.activeTooltipIndex;

    // Simulação de Double Click mais robusta
    if (lastClickRef.current && lastClickRef.current.index === index && (now - lastClickRef.current.time) < 500) {
      setDrillDownData({ date: data.fullDate || data.name, orderIds: data.orderIds });
      setIsDrillDownModalOpen(true);
      lastClickRef.current = null;
    } else {
      lastClickRef.current = { time: now, index };
      // Opcional: Feedback visual de primeiro clique
    }
  };
  const [trackingForm, setTrackingForm] = useState({
    orderId: '',
    carrier: '',
    code: '',
    status: 'posted' as TrackingStatus
  });

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    productId: '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 1,
    reason: '',
    selectedSize: '',
    selectedColor: ''
  });

  const [expandedSizes, setExpandedSizes] = useState<{ [key: string]: boolean }>({});

  const toggleSizeExpansion = (productId: number, size: string) => {
    const key = `${productId}-${size}`;
    setExpandedSizes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [isSizeManagerModalOpen, setIsSizeManagerModalOpen] = useState(false);
  const [sizeManagerProductId, setSizeManagerProductId] = useState<number | null>(null);
  const [tempStockBySize, setTempStockBySize] = useState<{ [size: string]: number }>({});
  const [tempStockBySizeColor, setTempStockBySizeColor] = useState<{ [key: string]: number }>({});

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'fixed' as Expense['category'],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // ERRCOM027: Filtro de data dos lançamentos financeiros
  const [financialDateFilter, setFinancialDateFilter] = useState({ from: '', to: '' });

  // ERRCOM047: Busca de pedido por número
  const [orderSearch, setOrderSearch] = useState('');

  // ERRCOM035: Busca de cliente por nome
  const [customerSearch, setCustomerSearch] = useState('');

  // ERRCOM046: Detalhe do pedido
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // ERRCOM022: Histórico de pedidos do cliente
  const [customerOrderHistory, setCustomerOrderHistory] = useState<{ customer: Customer; orders: Order[] } | null>(null);

  // ERRCOM029/030: Modal de vendas por forma de pagamento
  const [paymentBreakdownModal, setPaymentBreakdownModal] = useState<{ channel: 'pdv' | 'online'; orders: Order[] } | null>(null);

  const categoryOptions = useMemo(() => {
    const productCategories = products.map(product => product.category).filter(Boolean);
    const storedCategories = categories.map(cat => cat.name);
    const merged = [...BASE_CATEGORIES, ...storedCategories, ...productCategories];
    return Array.from(new Set(merged));
  }, [categories, products]);

  // Persistência do Caixa (Salvamento)
  useEffect(() => {
    localStorage.setItem('versiory_cash_register', JSON.stringify(cashRegister));
  }, [cashRegister]);

  useEffect(() => {
    localStorage.setItem('versiory_cash_withdrawals', JSON.stringify(cashWithdrawals));
  }, [cashWithdrawals]);

  useEffect(() => {
    localStorage.setItem('versiory_cash_deposits', JSON.stringify(cashDeposits));
  }, [cashDeposits]);

  useEffect(() => {
    localStorage.setItem('versiory_cash_history', JSON.stringify(cashRegisterHistory));
  }, [cashRegisterHistory]);

  const stats = useMemo(() => {
    // BUGFIX #4 & #10: Unificar lógica de faturamento para Dashboard, Pedidos e Financeiro
    const revenueOrders = orders.filter(order => {
      if (order.isBudget || order.status === 'cancelled') return false;

      const hasServiceOnly = order.items?.every(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.category === 'Serviços';
      });

      if (hasServiceOnly) return ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);
      
      const isConfirmed = ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);
      const isPdvImmediate = order.salesChannel === 'physical' && order.status !== 'pending';
      
      return isConfirmed || isPdvImmediate;
    });

    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    return {
      totalProducts: products.length,
      // BUGFIX #6: Excluir cancelados da contagem total de pedidos do Dashboard
      totalOrders: orders.filter(o => !o.isBudget && o.status !== 'cancelled').length,
      totalCustomers: customers.length,
      totalRevenue
    };
  }, [products, orders, customers]);

  const last30DaysData = useMemo(() => {
    const data = [];
    const today = new Date();
    // Ajustar para o final do dia local para garantir que pegamos as últimas 24h corretamente no loop
    today.setHours(23, 59, 59, 999);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // ERRCOM105: Usar data local (YYYY-MM-DD) em vez de UTC para o bucket do gráfico
      const dateStr = d.toLocaleDateString('en-CA'); // en-CA retorna YYYY-MM-DD
      const shortDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      const dayOrders = orders.filter(o => {
        const orderLocalDate = new Date(o.date).toLocaleDateString('en-CA');
        if (orderLocalDate !== dateStr || o.isBudget || o.status === 'cancelled') return false;

        // BUGFIX #10: Aplicar a mesma regra de receita do stats para o gráfico
        const hasServiceOnly = o.items?.every(item => {
          const product = products.find(p => p.id === item.productId);
          return product?.category === 'Serviços';
        });

        if (hasServiceOnly) return ['paid', 'processing', 'shipped', 'delivered'].includes(o.status);
        
        const isConfirmed = ['paid', 'processing', 'shipped', 'delivered'].includes(o.status);
        const isPdvImmediate = o.salesChannel === 'physical' && o.status !== 'pending';
        
        return isConfirmed || isPdvImmediate;
      });

      const faturamento = dayOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        name: shortDate,
        fullDate: dateStr,
        Pedidos: dayOrders.length,
        Faturamento: faturamento,
        orderIds: dayOrders.map(o => o.id)
      });
    }
    return data;
  }, [orders]);

  const finalDashboardTop5 = useMemo(() => {
    const productSales: Record<number, { count: number, revenue: number }> = {};
    orders.filter(o => !o.isBudget && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)).forEach(order => {
      order.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { count: 0, revenue: 0 };
        }
        productSales[item.productId].count += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([id, s]) => ({
        product: products.find(p => p.id === Number(id)),
        ...s
      }))
      .filter(p => p.product)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders, products]);


  const recentOrders = useMemo(() =>
    [...orders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [orders]
  );

  const filteredProductsList = useMemo(() => {
    return products
      .filter(p => {
        const q = productSearch.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) || 
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          String(p.id).includes(productSearch)
        );
      })
      .sort((a, b) => (a.id || 0) - (b.id || 0));
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    let filtered = orderFilter === 'all' ? orders : orders.filter(order => order.status === orderFilter);
    // ERRCOM047: Filtro por número do pedido
    if (orderSearch.trim()) {
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase())
      );
    }
    return filtered;
  }, [orders, orderFilter, orderSearch]);

  const inventoryStats = useMemo(() => {
    const totalStockValue = products.reduce(
      (sum, product) => sum + (product.price * (product.stock || 0)),
      0
    );
    const lowStockItems = products.filter(product => {
      const stock = product.stock || 0;
      const threshold = product.minStock ?? 10;
      return stock > 0 && stock < threshold;
    }).length;
    const outOfStockItems = products.filter(product => (product.stock || 0) === 0).length;
    const totalItemsInStock = products.reduce(
      (sum, product) => sum + (product.stock || 0),
      0
    );

    return { totalStockValue, lowStockItems, outOfStockItems, totalItemsInStock };
  }, [products]);

  // ERRCOM035: Clientes filtrados por busca
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;

    const search = customerSearch.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  const filteredInventoryProducts = useMemo(() => {
    const search = inventorySearch.toLowerCase();
    return products.filter(product => {
      const stock = product.stock || 0;
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const threshold = product.minStock ?? 10;
      let matchesFilter = true;
      if (stockFilter === 'low') {
        matchesFilter = stock > 0 && stock < threshold;
      } else if (stockFilter === 'out') {
        matchesFilter = stock === 0;
      } else if (stockFilter === 'normal') {
        matchesFilter = stock >= threshold;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, inventorySearch, stockFilter]);

  const financialStats = useMemo(() => {
    const revenueOrders = orders.filter(order => {
      if (order.isBudget) return false;
      const hasService = order.items?.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.category === 'Serviços';
      });
      if (hasService) return order.status === 'delivered';
      return ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);
    });

    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const pdvRevenue = revenueOrders.filter(o => o.salesChannel === 'physical').reduce((sum, order) => sum + order.total, 0);
    const onlineRevenue = revenueOrders.filter(o => !o.salesChannel || o.salesChannel === 'online').reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, pdvRevenue, onlineRevenue, totalExpenses, netProfit, profitMargin };
  }, [orders, expenses, products]);

  // ERRCOM114: Validação de sincronização de estoque (diagnóstico)
  const validateStockConsistency = (product: Product): boolean => {
    if (!product.sizes && !product.colors) return true; // Only applies to products with variations

    let totalCalculatedStock = 0;
    if (product.sizes && product.colors && product.stockBySizeColor) {
      totalCalculatedStock = Object.values(product.stockBySizeColor).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
    } else if (product.sizes && product.stockBySize) {
      totalCalculatedStock = Object.values(product.stockBySize).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
    } else if (product.colors && product.stockBySizeColor && !product.sizes) { // Only colors, no sizes
      totalCalculatedStock = Object.values(product.stockBySizeColor).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
    }

    const stockGeneral = product.stock || 0;

    if (totalCalculatedStock !== stockGeneral) {
      console.warn(`⚠️ Inconsistência de estoque detectada no produto ${product.name} (ID: ${product.id}):`, {
        estoqueGeral: stockGeneral,
        somaPorVariacao: totalCalculatedStock,
        diferenca: Math.abs(totalCalculatedStock - stockGeneral)
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    // Run consistency check on products load, for diagnostic purposes
    products.forEach(validateStockConsistency);
  }, [products]);

  const recentTransactions = useMemo(() => {
    const revenue = orders.map(order => ({
      id: order.id,
      description: `Venda ${order.salesChannel === 'physical' ? 'PDV' : 'Online'} - ${order.customerName}`,
      amount: order.total,
      type: 'revenue' as const,
      date: order.date,
      category: order.salesChannel === 'physical' ? 'Venda PDV' : 'Venda Online',
      notes: order.notes || ''
    }));

    const expenseItems = expenses.map(expense => ({
      id: String(expense.id),
      description: expense.description,
      amount: -expense.amount,
      type: 'expense' as const,
      date: expense.date,
      category: expense.category,
      expenseId: expense.id,
      notes: expense.notes || '' // Novo: exibir observações
    }));

    const all = [...revenue, ...expenseItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ERRCOM027: Filtro por período
    if (financialDateFilter.from || financialDateFilter.to) {
      return all.filter(t => {
        const d = t.date.split('T')[0];
        if (financialDateFilter.from && d < financialDateFilter.from) return false;
        if (financialDateFilter.to && d > financialDateFilter.to) return false;
        return true;
      });
    }
    return all.slice(0, 50);
  }, [orders, expenses, financialDateFilter]);

  // ERRCOM033: Estatísticas de clientes
  const customerStats = useMemo(() => {
    const activeOrders = orders.filter(o => !o.isBudget);
    const pdvCustomerIds = new Set(
      activeOrders.filter(o => o.salesChannel === 'physical').map(o => o.customerId)
    );
    const onlineCustomerIds = new Set(
      activeOrders.filter(o => !o.salesChannel || o.salesChannel === 'online').map(o => o.customerId)
    );

    // Revenue logic should match stats calc
    const revenueOrders = orders.filter(order => {
      if (order.isBudget) return false;
      const hasService = order.items?.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.category === 'Serviços';
      });
      if (hasService) return order.status === 'delivered';
      return ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);
    });

    const totalRevenue = revenueOrders.reduce((s, o) => s + o.total, 0);
    const avgTicket = customers.length > 0 ? totalRevenue / customers.length : 0;
    return {
      total: customers.length,
      pdv: pdvCustomerIds.size,
      online: onlineCustomerIds.size,
      avgTicket
    };
  }, [customers, orders, products]);


  const lowStockProducts = useMemo(() =>
    products.filter(product => {
      const stock = product.stock || 0;
      const threshold = product.minStock ?? 10;
      return stock > 0 && stock < threshold;
    }),
    [products]
  );



  const resetProductForm = () => {
    setProductForm({
      name: '',
      price: 0,
      category: 'Eletrônicos',
      image: '',
      images: [],
      description: '',
      rating: 0,
      reviews: 0,
      stock: 0,
      stockBySize: {},
      sizes: '',
      sizeChart: {},
      ncm: '',
      cfop: '5102',
      cst: '00',
      origem: 0,
      unidade: 'UN',
      peso: 0,
      usoReformaTributaria: false,
      aliquotaCbs: 0,
      aliquotaIbs: 0,
      aliquotaIs: 0,
      cClassTrib: '',
      gtin: '',
      gtinTrib: ''
    });
    setEditingProductId(null);
    setIsCustomCategory(false);
    setCustomCategory('');
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      setProductForm(product);
      setEditingProductId(product.id);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      resetProductForm();
    }
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const handleProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedCategory = isCustomCategory
      ? customCategory.trim()
      : (productForm.category || '').toString();

    if (!trimmedCategory) {
      window.alert('Informe a categoria do produto.');
      return;
    }

    if (!productForm.image) {
      window.alert('Envie uma imagem do produto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { saveProduct } = await import('../services/firebase');

      // Inicializar stockBySize e stockBySizeColor se houver variações
      let stockBySize = productForm.stockBySize || {};
      let stockBySizeColor = productForm.stockBySizeColor || {};

      const sizeArray = productForm.sizes ? productForm.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
      const colorArray = productForm.colors ? productForm.colors.split(',').map(c => c.trim()).filter(c => c) : [];

      if (sizeArray.length > 0) {
        if (colorArray.length > 0) {
          // Tem Tamanho e Cor -> Usar stockBySizeColor
          if (!productForm.stockBySizeColor || Object.keys(productForm.stockBySizeColor).length === 0) {
            const combinations: string[] = [];
            sizeArray.forEach(s => colorArray.forEach(c => combinations.push(`${s}-${c}`)));

            const stockPerComb = Math.floor((productForm.stock || 0) / combinations.length);
            const remainder = (productForm.stock || 0) % combinations.length;

            stockBySizeColor = {};
            combinations.forEach((key, index) => {
              stockBySizeColor[key] = stockPerComb + (index < remainder ? 1 : 0);
            });
          } else {
            // BUGFIX #2: Se já existem, garantir que o stock total seja a soma das variações
            // Ou se o usuário editou o total manualmente, avisar ou redistribuir.
            // Aqui vamos assumir que a soma das variações manda se elas já existirem.
            const totalFromVariants = Object.values(productForm.stockBySizeColor).reduce((s, q) => s + (Number(q) || 0), 0);
            if (totalFromVariants !== productForm.stock) {
               // Se o usuário mudou o total manualmente no campo principal, limpamos para forçar redistribuição
               // OU matemos a soma. Vamos manter a soma para evitar perda de dados acidental.
               productForm.stock = totalFromVariants;
            }
          }
          stockBySize = {}; // Limpar stockBySize simples se tem cores
        } else {
          // Apenas Tamanho -> Usar stockBySize
          if (!productForm.stockBySize || Object.keys(productForm.stockBySize).length === 0) {
            const stockPerSize = Math.floor((productForm.stock || 0) / sizeArray.length);
            const remainder = (productForm.stock || 0) % sizeArray.length;

            stockBySize = {};
            sizeArray.forEach((size, index) => {
              stockBySize[size] = stockPerSize + (index < remainder ? 1 : 0);
            });
          } else {
            const totalFromVariants = Object.values(productForm.stockBySize).reduce((s, q) => s + (Number(q) || 0), 0);
            if (totalFromVariants !== productForm.stock) {
               productForm.stock = totalFromVariants;
            }
          }
          stockBySizeColor = {}; // Limpar stockBySizeColor se não tem cores
        }
      }

      const payload: Product = {
        ...(productForm as Product),
        category: trimmedCategory,
        stock: productForm.stock || 0,
        stockBySize: stockBySize,
        stockBySizeColor: stockBySizeColor,
        sizes: productForm.sizes || '',
        colors: productForm.colors || '',
        images: productForm.images || [],
        sizeChart: productForm.sizeChart || {},
        ncm: productForm.ncm || '',
        cfop: productForm.cfop || '5102',
        cst: productForm.cst || '00',
        origem: productForm.origem ?? 0,
        cest: productForm.cest || '',
        unidade: productForm.unidade || 'UN',
        peso: productForm.peso || 0,
        aliquotaIcms: productForm.aliquotaIcms || 0,
        aliquotaPis: productForm.aliquotaPis || 0,
        aliquotaCofins: productForm.aliquotaCofins || 0,
        aliquotaIpi: productForm.aliquotaIpi || 0,
        codigoBeneficio: productForm.codigoBeneficio || '',
        usoReformaTributaria: productForm.usoReformaTributaria || false,
        aliquotaCbs: productForm.aliquotaCbs || 0,
        aliquotaIbs: productForm.aliquotaIbs || 0,
        aliquotaIs: productForm.aliquotaIs || 0,
        cClassTrib: productForm.cClassTrib || '',
        gtin: productForm.gtin || '',
        gtinTrib: productForm.gtinTrib || ''
      };



      if (!editingProductId) {
        payload.id = Math.max(0, ...products.map(product => product.id)) + 1;
      } else {
        payload.id = editingProductId;
      }

      const savedProduct = await saveProduct(sanitizeData(payload), payload.image);

      if (editingProductId) {
        const updatedProducts = products.map(product =>
          product.id === editingProductId ? savedProduct : product
        );
        onUpdateProducts(updatedProducts);
      } else {
        onUpdateProducts([...products, savedProduct]);
      }

      if (isCustomCategory && customCategory) {
        const { saveCategory } = await import('../services/firebase');
        const newCat: CategoryItem = {
          id: Date.now().toString(),
          name: customCategory.trim(),
          description: 'Nova categoria'
        };
        await saveCategory(newCat);
        onUpdateCategories([...categories, newCat]);
      }

      closeProductModal();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      window.alert("Erro ao salvar produto no banco de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductDelete = async (id: number) => {
    // Verificar se existe movimentações ou pedidos vinculados
    const hasOrders = orders.some(order =>
      order.items?.some(item => item.productId === id)
    );
    const hasMovements = inventoryMovements.some(m => m.productId === id);

    if (hasOrders || hasMovements) {
      window.alert('❌ Este produto não pode ser excluído pois possui pedidos ou movimentações de estoque vinculadas. Por normas fiscais, a exclusão é bloqueada.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) return;
    try {
      const { deleteProductItem } = await import('../services/firebase');
      await deleteProductItem(id);
      onUpdateProducts(products.filter(product => product.id !== id));
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      window.alert("Erro ao excluir produto do banco de dados.");
    }
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height *= MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width *= MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // Compress as JPEG with 70% quality
          setProductForm(prev => ({ ...prev, image: compressedBase64 }));
        }
      };
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const openCategoryModal = (category?: CategoryItem) => {
    if (category) {
      setEditingCategoryId(category.id);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        availableSizes: category.availableSizes || [],
        sizeType: category.sizeType || 'none'
      });
    } else {
      setEditingCategoryId(null);
      setCategoryForm({
        name: '',
        description: '',
        availableSizes: [],
        sizeType: 'none'
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) {
      window.alert('Informe o nome da categoria.');
      return;
    }

    try {
      const { saveCategory } = await import('../services/firebase');

      const categoryData: any = {
        id: editingCategoryId || name.toLowerCase().replace(/\s+/g, '_'),
        name,
        description: categoryForm.description.trim(),
        sizeType: categoryForm.sizeType
      };

      if (categoryForm.sizeType !== 'none' && categoryForm.availableSizes) {
        categoryData.availableSizes = categoryForm.availableSizes;
      }

      await saveCategory(categoryData);

      if (editingCategoryId) {
        onUpdateCategories(categories.map(c => c.id === editingCategoryId ? categoryData : c));
      } else {
        onUpdateCategories([...categories, categoryData as CategoryItem]);
      }

      setIsCategoryModalOpen(false);
      setEditingCategoryId(null);

    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar categoria.");
    }
  };

  const handleCategoryDelete = async (categoryId: string) => {
    // ERRCOM017: Bloquear exclusão se houver produtos vinculados
    const categoryName = categories.find(c => c.id === categoryId)?.name;
    const hasProducts = products.some(p => p.category === categoryName);
    if (hasProducts) {
      window.alert(`❌ Não é possível excluir a categoria "${categoryName}" pois ela possui produtos vinculados. Remova ou reclassifique os produtos antes de excluir a categoria.`);
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      const { deleteCategoryItem } = await import('../services/firebase');
      await deleteCategoryItem(categoryId);
      onUpdateCategories(categories.filter(category => category.id !== categoryId));
    } catch (error) {
      console.error(error);
      window.alert("Erro ao excluir categoria.");
    }
  };

  const openOrderStatusModal = (order: Order) => {
    setOrderStatusForm({
      orderId: order.id,
      status: order.status,
      notes: order.notes || ''
    });
    setIsOrderStatusModalOpen(true);
  };

  const handleOrderStatusSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { saveOrder } = await import('../services/firebase');
      const orderToUpdate = orders.find(o => o.id === orderStatusForm.orderId);
      if (!orderToUpdate) return;

      const updatedOrder: Order = { ...orderToUpdate, status: orderStatusForm.status, notes: orderStatusForm.notes };
      let finalProducts = products;

      // BUGFIX #12: Evitar loop de soma duplicada e garantir exclusão do saldo ao cancelar/voltar para pendente
      if (updatedOrder.salesChannel === 'physical' && !updatedOrder.isBudget) {
        const isAccountingStatus = ['delivered', 'paid', 'processing', 'shipped'].includes(updatedOrder.status);
        const wasAccountingStatus = ['delivered', 'paid', 'processing', 'shipped'].includes(orderToUpdate.status);

        if (isAccountingStatus && !orderToUpdate.accountedInCash) {
          setCashRegister(prev => ({ ...prev, currentBalance: prev.currentBalance + updatedOrder.total }));
          updatedOrder.accountedInCash = true;
        } else if (!isAccountingStatus && orderToUpdate.accountedInCash) {
          setCashRegister(prev => ({ ...prev, currentBalance: Math.max(0, prev.currentBalance - updatedOrder.total) }));
          updatedOrder.accountedInCash = false;
        }
      }

      // BUGFIX #1 & #11: Baixa de estoque somente ao acionar "Entregue" para Online e Serviços
      const isDelivered = updatedOrder.status === 'delivered';
      const wasDelivered = orderToUpdate.status === 'delivered';

      if (isDelivered && !wasDelivered && !updatedOrder.stockDecremented) {
        // Momento do decremento: Se PDV Products já baixou, adjustStock cuidará de não baixar duplicado se gerenciado corretamente
        // Mas a regra diz: baixa instantânea no PDV (produtos) vs No Pedido (Serviços/Online).
        // Vamos filtrar os itens que DEVEM baixar agora.
        const itemsToDecrement = updatedOrder.items.filter(item => {
          const product = products.find(p => p.id === item.productId);
          const isService = product?.category === 'Serviços';
          const isOnline = updatedOrder.salesChannel === 'online' || !updatedOrder.salesChannel;
          return isService || isOnline;
        });

        if (itemsToDecrement.length > 0) {
          finalProducts = await updateStockProgressively({ ...updatedOrder, items: itemsToDecrement }, 'decrement');
        }
        updatedOrder.stockDecremented = true;
      } else if (!isDelivered && wasDelivered && updatedOrder.stockDecremented) {
        // Estorno de estoque se saiu de Entregue para qualquer outro status (incluindo Cancelado)
        const itemsToIncrement = updatedOrder.items.filter(item => {
          const product = products.find(p => p.id === item.productId);
          const isService = product?.category === 'Serviços';
          const isOnline = updatedOrder.salesChannel === 'online' || !updatedOrder.salesChannel;
          return isService || isOnline;
        });

        if (itemsToIncrement.length > 0) {
          finalProducts = await updateStockProgressively({ ...updatedOrder, items: itemsToIncrement }, 'increment');
        }
        updatedOrder.stockDecremented = false;
      } else if (updatedOrder.status === 'cancelled' && !wasDelivered) {
        // Se cancelou mas nunca foi entregue, precisamos devolver o que baixou NO CHECKOUT (PDV Produtos)
        const isPdv = updatedOrder.salesChannel === 'physical';
        if (isPdv) {
          const itemsToIncrement = updatedOrder.items.filter(item => {
            const product = products.find(p => p.id === item.productId);
            return product?.category !== 'Serviços';
          });
          if (itemsToIncrement.length > 0) {
            finalProducts = await updateStockProgressively({ ...updatedOrder, items: itemsToIncrement }, 'increment');
          }
        }
      }

      await saveOrder(updatedOrder);

      const updatedOrders = orders.map(order =>
        order.id === orderStatusForm.orderId ? updatedOrder : order
      );

      onUpdateProducts(finalProducts);
      onUpdateOrders(updatedOrders);
      setIsOrderStatusModalOpen(false);
    } catch (err) {
      console.error(err);
      window.alert("Erro ao atualizar pedido");
    }
  };

  const openTrackingModal = (track?: TrackingItem) => {
    if (track) {
      setTrackingForm({
        orderId: track.orderId,
        carrier: track.carrier,
        code: track.code,
        status: track.status
      });
    } else {
      setTrackingForm({ orderId: '', carrier: '', code: '', status: 'posted' });
    }
    setIsTrackingModalOpen(true);
  };

  const handleTrackingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trackingForm.orderId) {
      window.alert('Selecione um pedido.');
      return;
    }

    try {
      const { saveTrackingItem } = await import('../services/firebase');

      const newTracking: TrackingItem = {
        orderId: trackingForm.orderId,
        carrier: trackingForm.carrier,
        code: trackingForm.code,
        status: trackingForm.status,
        lastUpdate: new Date().toISOString()
      };

      await saveTrackingItem(newTracking);

      const updatedList = tracking.filter(item => item.orderId !== trackingForm.orderId);
      updatedList.push(newTracking);
      onUpdateTracking(updatedList);
      setIsTrackingModalOpen(false);
    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar rastreamento");
    }
  };

  const openInventoryModal = (productId?: number) => {
    setInventoryForm({
      productId: productId ? String(productId) : '',
      type: 'in',
      quantity: 1,
      reason: '',
      selectedSize: '',
      selectedColor: ''
    });
    setIsInventoryModalOpen(true);
  };

  const handleInventorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const productId = parseInt(inventoryForm.productId, 10);
    if (!productId) {
      window.alert('Selecione um produto.');
      return;
    }

    const product = products.find(item => item.id === productId);
    if (!product) return;

    // Se o produto tem tamanhos, validar seleção (apenas para movimentação de estoque)
    if (product.sizes && !inventoryForm.selectedSize) {
      window.alert('Selecione um tamanho para movimentação de estoque.');
      return;
    }

    const currentStock = product.stock || 0;
    let newStock = currentStock;
    let newStockBySize = { ...(product.stockBySize || {}) };

    // Se tem tamanho selecionado, trabalhar com estoque por tamanho
    if (inventoryForm.selectedSize && product.sizes) {
      const currentSizeStock = newStockBySize[inventoryForm.selectedSize] || 0;
      let newSizeStock = currentSizeStock;

      if (inventoryForm.type === 'in') {
        newSizeStock = currentSizeStock + inventoryForm.quantity;
        newStock = currentStock + inventoryForm.quantity;
      } else if (inventoryForm.type === 'out') {
        if (currentSizeStock < inventoryForm.quantity) {
          window.alert('Estoque insuficiente para esta saida.');
          return;
        }
        newSizeStock = currentSizeStock - inventoryForm.quantity;
        newStock = currentStock - inventoryForm.quantity;
      } else {
        newSizeStock = inventoryForm.quantity;
        const diff = newSizeStock - currentSizeStock;
        newStock = currentStock + diff;
      }

      newStockBySize[inventoryForm.selectedSize] = newSizeStock;
    } else if (inventoryForm.selectedSize && inventoryForm.selectedColor && product.colors && product.sizes) {
      // Se tem tamanho e cor selecionados
      let newStockBySizeColor = { ...(product.stockBySizeColor || {}) };
      const combKey = `${inventoryForm.selectedSize}-${inventoryForm.selectedColor}`;
      const currentCombStock = newStockBySizeColor[combKey] || 0;
      let newCombStock = currentCombStock;

      if (inventoryForm.type === 'in') {
        newCombStock = currentCombStock + inventoryForm.quantity;
        newStock = currentStock + inventoryForm.quantity;
      } else if (inventoryForm.type === 'out') {
        if (currentCombStock < inventoryForm.quantity) {
          window.alert('Estoque insuficiente para esta saída.');
          return;
        }
        newCombStock = currentCombStock - inventoryForm.quantity;
        newStock = currentStock - inventoryForm.quantity;
      } else {
        newCombStock = inventoryForm.quantity;
        const diff = newCombStock - currentCombStock;
        newStock = currentStock + diff;
      }

      newStockBySizeColor[combKey] = newCombStock;
    } else {
      // Produto sem tamanhos
      if (inventoryForm.type === 'in') {
        newStock = currentStock + inventoryForm.quantity;
      } else if (inventoryForm.type === 'out') {
        if (currentStock < inventoryForm.quantity) {
          window.alert('Estoque insuficiente para esta saida.');
          return;
        }
        newStock = currentStock - inventoryForm.quantity;
      } else {
        newStock = inventoryForm.quantity;
      }
    }

    try {
      const { saveInventoryMovement, saveProduct } = await import('../services/firebase');

      const movement: InventoryMovement = {
        id: Date.now(),
        productId,
        productName: product.name,
        type: inventoryForm.type,
        quantity: inventoryForm.quantity,
        previousStock: currentStock,
        newStock,
        reason: inventoryForm.reason,
        date: new Date().toISOString(),
        user: 'Admin'
      };

      // Criar objeto limpo sem valores undefined
      const updatedProduct: Product = {
        ...product,
        stock: newStock
      };

      // Só adicionar stockBySize se tiver tamanhos
      if (product.sizes && Object.keys(newStockBySize).length > 0) {
        updatedProduct.stockBySize = newStockBySize;
      }
      if (product.colors && product.sizes) {
        const newStockBySizeColor = { ...(product.stockBySizeColor || {}) };
        if (inventoryForm.selectedSize && inventoryForm.selectedColor) {
          const combKey = `${inventoryForm.selectedSize}-${inventoryForm.selectedColor}`;
          const currentCombStock = newStockBySizeColor[combKey] || 0;
          let newCombStock = currentCombStock;

          if (inventoryForm.type === 'in') {
            newCombStock = currentCombStock + inventoryForm.quantity;
          } else if (inventoryForm.type === 'out') {
            newCombStock = Math.max(0, currentCombStock - inventoryForm.quantity);
          } else {
            newCombStock = inventoryForm.quantity;
          }

          newStockBySizeColor[combKey] = newCombStock;
        }
        if (Object.keys(newStockBySizeColor).length > 0) {
          updatedProduct.stockBySizeColor = newStockBySizeColor;
        }
      }

      await Promise.all([
        saveInventoryMovement(movement),
        saveProduct(sanitizeData(updatedProduct))
      ]);

      const updatedProducts = products.map(item =>
        item.id === productId ? updatedProduct : item
      );

      onUpdateProducts(updatedProducts);
      onUpdateInventoryMovements([...inventoryMovements, movement]);
      setIsInventoryModalOpen(false);
    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar movimento de estoque");
    }
  };

  const addToPdvCart = (product: Product, size?: string, color?: string) => {
    // Se o produto tem variantes mas não foram passadas, usar do estado global (compatibilidade com busca direta)
    const finalSize = size || pdvModalSelection.size || selectedSizes[product.id];
    const finalColor = color || pdvModalSelection.color; // Cor geralmente vem do modal no PDV

    if (product.sizes && !finalSize) {
      window.alert('Selecione um tamanho antes de adicionar ao carrinho.');
      return;
    }

    if (product.colors && !finalColor) {
      window.alert('Selecione uma cor antes de adicionar ao carrinho.');
      return;
    }

    // Verificar estoque específico
    let availableStock = product.stock || 0;
    if (finalSize && finalColor && product.stockBySizeColor) {
      availableStock = product.stockBySizeColor[`${finalSize}-${finalColor}`] || 0;
    } else if (finalSize && product.stockBySize) {
      availableStock = product.stockBySize[finalSize] || 0;
    }

    if (availableStock <= 0) {
      window.alert('Produto/Variante sem estoque!');
      return;
    }

    setPdvCart(prev => {
      const existing = prev.find(item =>
        item.product.id === product.id &&
        item.selectedSize === finalSize &&
        item.selectedColor === finalColor
      );

      if (existing) {
        if (existing.quantity >= availableStock) {
          window.alert('Quantidade máxima em estoque atingida.');
          return prev;
        }

        return prev.map(item =>
          (item.product.id === product.id && item.selectedSize === finalSize && item.selectedColor === finalColor)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { product, quantity: 1, selectedSize: finalSize, selectedColor: finalColor }];
    });
  };

  const removeFromPdvCart = (productId: number, selectedSize?: string, selectedColor?: string) => {
    setPdvCart(prev => prev.filter(item =>
      !(item.product.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
    ));
  };

  const updatePdvItemQuantity = (productId: number, newQuantity: number, selectedSize?: string, selectedColor?: string) => {
    if (newQuantity <= 0) {
      removeFromPdvCart(productId, selectedSize, selectedColor);
      return;
    }

    // Check against stock
    const productItem = pdvCart.find(item =>
      item.product.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor
    );

    if (productItem) {
      let maxStock = productItem.product.stock || 0;
      if (selectedSize && selectedColor && productItem.product.stockBySizeColor) {
        maxStock = productItem.product.stockBySizeColor[`${selectedSize}-${selectedColor}`] || 0;
      } else if (selectedSize && productItem.product.stockBySize) {
        maxStock = productItem.product.stockBySize[selectedSize] || 0;
      }

      if (newQuantity > maxStock) {
        window.alert('Quantidade máxima em estoque atingida.');
        return;
      }
    }

    setPdvCart(prev => prev.map(item =>
      (item.product.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handlePdvCheckout = () => {
    if (pdvCart.length === 0) {
      window.alert('O carrinho está vazio.');
      return;
    }
    // ERRCOM050: Bloquear venda com caixa fechado
    if (!cashRegister.isOpen) {
      window.alert('⚠️ O Caixa está fechado. Abra o caixa antes de realizar vendas.');
      setIsCashRegisterModalOpen(true); // Open cash register modal to prompt opening
      return;
    }
    setIsPdvCheckoutModalOpen(true);
  };

  const handlePdvCheckoutSubmit = async (customerData: { name: string; phone: string; email: string; cpf: string; notes: string; address?: string; isBudget?: boolean }, order: Order) => {
    const isBudget = order.isBudget || false;

    // ERRCOM99: Orçamentos não exigem caixa aberto, pois não geram movimentação financeira imediata
    if (!isBudget && !cashRegister.isOpen) {
      window.alert('⚠️ O Caixa está fechado. Abra o caixa antes de realizar vendas.');
      setIsPdvCheckoutModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const { saveOrder, saveProduct, saveCustomer, getCustomers } = await import('../services/firebase');

      // Se estivermos editando, preservamos o ID original
      const orderId = editingOrder ? editingOrder.id : (isBudget ? `ORC-${Date.now()}` : `PDV-${Date.now()}`);
      order.id = orderId;

      // BUGFIX: Buscar lista fresca do Firestore para evitar estado stale
      const freshCustomers = await getCustomers();
      let customer = freshCustomers.find(c => (c.phone === customerData.phone && customerData.phone) || (c.email === customerData.email && customerData.email));

      // BUGFIX: Sanitizar customerPhone — Firestore rejeita campos 'undefined'
      if (!order.customerPhone) delete (order as any).customerPhone;

      // 1. Atualizar ou Criar Cliente (Sanitizado para evitar erro de 'undefined' no Firestore)
      if (customer) {
        if (!isBudget) {
          customer.totalOrders = (customer.totalOrders || 0) + 1;
          customer.totalSpent = (customer.totalSpent || 0) + order.total;
        }
        customer.cpfCnpj = customerData.cpf || customer.cpfCnpj;
        order.customerId = customer.id;

        // Sanitização profunda para evitar crashing no Firestore por campos undefined
        const sanitizedCustomer = sanitizeData(customer);
        await saveCustomer(sanitizedCustomer);
        // Atualizar lista local com dados do cliente atualizado
        onUpdateCustomers(freshCustomers.map(c => c.id === customer!.id ? sanitizedCustomer : c));
      } else {
        const newCustomer: Customer = {
          id: Date.now(),
          name: customerData.name,
          email: order.customerEmail,
          ...(customerData.phone ? { phone: customerData.phone } : {}),
          ...(customerData.cpf ? { cpfCnpj: customerData.cpf } : {}),
          addresses: [],
          totalOrders: isBudget ? 0 : 1,
          totalSpent: isBudget ? 0 : order.total,
          createdAt: new Date().toISOString(),
          orderHistory: []
        };
        order.customerId = newCustomer.id;

        const sanitizedNewCustomer = sanitizeData(newCustomer);
        await saveCustomer(sanitizedNewCustomer);
        // BUGFIX: Usar freshCustomers (lista do Firestore) em vez de customers (prop stale)
        onUpdateCustomers([...freshCustomers, newCustomer]);
      }

      // 2. Atualizar Estoque (Somente se não for orçamento)
      const updatedProducts = [...products];
      if (!isBudget) {
        const itemsToDecrement = pdvCart.filter(item => item.product.category !== 'Serviços');
        
        for (const item of itemsToDecrement) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
          if (productIndex !== -1) {
            const p = { ...updatedProducts[productIndex] }; // Create a mutable copy
            p.stock = Math.max(0, (p.stock || 0) - item.quantity);

            if (item.selectedSize) {
              if (p.stockBySize) {
                p.stockBySize = {
                  ...p.stockBySize,
                  [item.selectedSize]: Math.max(0, (p.stockBySize[item.selectedSize] || 0) - item.quantity)
                };
              }

              if (item.selectedColor && p.stockBySizeColor) {
                const key = `${item.selectedSize}-${item.selectedColor}`;
                p.stockBySizeColor = {
                  ...p.stockBySizeColor,
                  [key]: Math.max(0, (p.stockBySizeColor[key] || 0) - item.quantity)
                };
              }
            }

            const sanitizedProduct = sanitizeData(p);
            const saved = await saveProduct(sanitizedProduct);
            updatedProducts[productIndex] = saved;
          }
        }
        // Se houve itens decrementados (produtos físicos), marcar no pedido
        if (itemsToDecrement.length > 0) {
          order.stockDecremented = itemsToDecrement.length === pdvCart.length; // Se todos baixaram, marca true. Se tem serviço pendente, false.
        }

        onUpdateProducts(updatedProducts);
      }

      // 3. Salvar Pedido/Orçamento (Sanitizado)
      // Se tiver serviço, status inicial é pending
      const hasService = pdvCart.some(item => item.product.category === 'Serviços');
      if (hasService && !isBudget) {
        order.status = 'pending';
      }

      const sanitizedOrder = sanitizeData(order);
      await saveOrder(sanitizedOrder);

      // 4. Atualizar UI e Estado Local
      const updated = editingOrder
        ? orders.map(o => o.id === order.id ? order : o)
        : [...orders, order];

      onUpdateOrders(updated);
      
      // ERRCOM100: Orçamentos NÃO limpam o carrinho para permitir finalizar a venda em seguida
      if (!isBudget) {
        setPdvCart([]);
      }
      
      setEditingOrder(null);

      // 5. Atualizar saldo do caixa (Somente se não for orçamento E não for serviço pendente)
      if (!isBudget && !hasService) {
        setCashRegister(prev => ({
          ...prev,
          currentBalance: prev.currentBalance + order.total
        }));
      }
      
      console.log(`${isBudget ? 'Orçamento' : 'Venda'} finalizada com sucesso:`, order.id);

    } catch (error: any) {
      console.error('Erro crítico ao finalizar venda:', error);
      const msg = error?.message || 'Verifique o console ou tente novamente.';
      window.alert(`Ocorreu um erro ao processar a operação.\n\nDetalhe: ${msg}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções de movimentação de caixa
  const handleCashMovement = () => {
    if (!cashMovementForm.amount || cashMovementForm.amount <= 0) {
      window.alert('Informe um valor válido.');
      return;
    }

    if (!cashMovementForm.reason.trim()) {
      window.alert('Informe o motivo da movimentação.');
      return;
    }

    const movement = {
      id: Date.now().toString(),
      amount: cashMovementForm.amount,
      reason: cashMovementForm.reason,
      timestamp: new Date().toISOString()
    };

    if (cashMovementForm.type === 'withdrawal') {
      if (cashMovementForm.amount > cashRegister.currentBalance) {
        window.alert('Saldo insuficiente para esta sangria.');
        return;
      }
      setCashWithdrawals(prev => [...prev, movement]);
      setCashRegister(prev => ({
        ...prev,
        currentBalance: prev.currentBalance - cashMovementForm.amount
      }));
    } else {
      setCashDeposits(prev => [...prev, movement]);
      setCashRegister(prev => ({
        ...prev,
        currentBalance: prev.currentBalance + cashMovementForm.amount
      }));
    }

    setCashMovementForm({ type: 'withdrawal', amount: 0, reason: '' });
    setIsCashMovementModalOpen(false);
    window.alert(`${cashMovementForm.type === 'withdrawal' ? 'Sangria' : 'Suprimento'} registrado com sucesso!`);
  };

  const handleShowPartialReport = () => {
    if (!cashRegister.isOpen) return;

    // Calcular vendas parciais por forma de pagamento
    const registerOpenedAt = new Date(cashRegister.openedAt!).getTime();
    const registerOrders = orders.filter(o =>
      o.salesChannel === 'physical' &&
      new Date(o.date).getTime() >= registerOpenedAt &&
      (o.status === 'paid' || o.status === 'delivered' || o.status === 'processing' || o.status === 'shipped')
    );

    const salesByPayment = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };
    const salesByPaymentCount = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };

    registerOrders.forEach(o => {
      const method = (o.paymentMethod || 'dinheiro').toLowerCase() as keyof typeof salesByPayment;
      if (salesByPayment[method] !== undefined) {
        salesByPayment[method] += o.total;
        salesByPaymentCount[method] += 1;
      }
    });

    const partialReport = {
      id: `PARTIAL-${Date.now()}`,
      openedAt: cashRegister.openedAt!,
      closedAt: null,
      openedBy: 'Operador',
      status: 'open' as const,
      initialAmount: cashRegister.openingAmount,
      currentBalance: cashRegister.currentBalance,
      totalSales: Math.max(0, cashRegister.currentBalance - cashRegister.openingAmount - cashDeposits.reduce((acc, d) => acc + d.amount, 0) + cashWithdrawals.reduce((acc, w) => acc + w.amount, 0)),
      totalOrders: registerOrders.length,
      expectedAmount: cashRegister.currentBalance,
      actualAmount: cashRegister.currentBalance,
      difference: 0,
      withdrawals: cashWithdrawals,
      deposits: cashDeposits,
      salesByPayment,
      salesByPaymentCount
    };

    // Usamos o histórico apenas para exibição no modal
    setCashRegisterHistory(prev => [...prev, partialReport]);
    setIsCashReportOpen(true);
  };

  const handlePrintCashReport = async (report: any) => {
    try {
      const { generateCashReportHTML } = await import('../utils/cashReportGenerator');
      const html = generateCashReportHTML(report);
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      window.print(); // Fallback
    }
  };

  const handleCashRegisterClose = () => {
    const actualAmountStr = window.prompt('Informe o valor total em dinheiro no caixa:');
    if (actualAmountStr === null) return;

    // BUGFIX #15: Usar o parser brasileiro para garantir centavos
    const actual = parseBrazilianFloat(actualAmountStr);
    const expected = cashRegister.currentBalance;
    const difference = actual - expected;

    // Calcular vendas reais por forma de pagamento no período deste caixa
    const registerOpenedAt = new Date(cashRegister.openedAt!).getTime();
    const registerOrders = orders.filter(o =>
      o.salesChannel === 'physical' &&
      new Date(o.date).getTime() >= registerOpenedAt &&
      (o.status === 'paid' || o.status === 'delivered' || o.status === 'processing' || o.status === 'shipped')
    );

    const salesByPayment = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };
    const salesByPaymentCount = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };

    registerOrders.forEach(o => {
      const method = (o.paymentMethod || 'dinheiro').toLowerCase() as keyof typeof salesByPayment;
      if (salesByPayment[method] !== undefined) {
        salesByPayment[method] += o.total;
        salesByPaymentCount[method] += 1;
      }
    });

    const closedRegister = {
      id: Date.now().toString(),
      openedAt: cashRegister.openedAt!,
      closedAt: new Date().toISOString(),
      openedBy: 'Operador',
      closedBy: 'Operador',
      status: 'closed' as const,
      initialAmount: cashRegister.openingAmount,
      expectedAmount: expected,
      actualAmount: actual,
      difference: difference,
      // BUGFIX #7 (ERRCOM069/092): Cálculo correto de Vendas Totais (Isolando faturamento puro)
      // Vendas = (Saldo Final - Abertura - Suprimentos + Sangrias)
      totalSales: Math.max(0, expected - cashRegister.openingAmount - cashDeposits.reduce((acc, d) => acc + d.amount, 0) + cashWithdrawals.reduce((acc, w) => acc + w.amount, 0)),
      totalOrders: registerOrders.length,
      salesByPayment,
      salesByPaymentCount,
      withdrawals: cashWithdrawals,
      deposits: cashDeposits,
      notes: difference !== 0 ? `${difference > 0 ? 'Sobra' : 'Falta'} de R$ ${Math.abs(difference).toFixed(2)}` : undefined
    };

    // Salvar no histórico
    setCashRegisterHistory(prev => [...prev, closedRegister]);

    // Resetar caixa atual
    setCashRegister({
      isOpen: false,
      openingAmount: 0,
      currentBalance: 0,
      openedAt: null
    });
    setCashWithdrawals([]);
    setCashDeposits([]);

    // Abrir relatório
    setIsCashReportOpen(true);
    setIsCashRegisterModalOpen(false);
  };

  const openExpenseModal = (expense?: Expense) => {
    if (expense) {
      setExpenseForm({
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes || ''
      });
      setEditingExpenseId(expense.id);
    } else {
      setExpenseForm({
        description: '',
        category: 'fixed',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setEditingExpenseId(null);
    }
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!expenseForm.description.trim()) {
      window.alert('Informe a descricao da despesa.');
      return;
    }

    try {
      const { saveExpense } = await import('../services/firebase');

      const expense: Expense = {
        id: editingExpenseId || Date.now(),
        description: expenseForm.description,
        category: expenseForm.category,
        amount: expenseForm.amount,
        date: expenseForm.date,
        notes: expenseForm.notes,
        user: 'Admin'
      };

      await saveExpense(expense);

      if (editingExpenseId) {
        const updated = expenses.map(e => e.id === editingExpenseId ? expense : e);
        onUpdateExpenses(updated);
      } else {
        const updated = [...expenses, expense];
        onUpdateExpenses(updated);
      }

      setIsExpenseModalOpen(false);
      setEditingExpenseId(null);
    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar despesa");
    }
  };

  const handleEditOrder = (order: Order) => {
    // Reconstruir o carrinho do PDV a partir dos itens do pedido
    const newCart = order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return {
          product,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor
        };
      }
      return null;
    }).filter(Boolean) as { product: Product; quantity: number; selectedSize?: string; selectedColor?: string }[];

    if (newCart.length === 0) {
      window.alert('Não foi possível carregar os produtos deste pedido para edição (podem ter sido excluídos).');
      return;
    }

    setPdvCart(newCart);
    setEditingOrder(order);
    setActiveTab('pdv');
    setSelectedOrderDetail(null);
    window.alert(`Editando Pedido ${order.id}. Você foi redirecionado para o PDV para alterar os itens.`);
  };

  const handleExpenseDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      const { deleteExpense } = await import('../services/firebase');
      await deleteExpense(id);
      onUpdateExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error(error);
      window.alert("Erro ao excluir despesa");
    }
  };

  const downloadCsv = (filename: string, rows: Record<string, string | number>[]) => {
    if (rows.length === 0) return;
    const csv = [Object.keys(rows[0]).join(',')]
      .concat(rows.map(row => Object.values(row).join(',')))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const generateInventoryReport = () => {
    const report: any[] = [];
    
    products.forEach(product => {
      if (product.sizes && product.stockBySize) {
        product.sizes.split(',').forEach(size => {
          const trimmedSize = size.trim();
          const sizeStock = product.stockBySize?.[trimmedSize] || 0;
          report.push({
            ID: product.id,
            Produto: product.name,
            Tamanho: trimmedSize,
            Categoria: product.category,
            'Estoque Atual': sizeStock,
            'Estoque Minimo': product.minStock || 10,
            'Valor Unitario': product.price.toFixed(2),
            'Valor Total': (sizeStock * product.price).toFixed(2)
          });
        });
      } else {
        report.push({
          ID: product.id,
          Produto: product.name,
          Tamanho: '-',
          Categoria: product.category,
          'Estoque Atual': product.stock || 0,
          'Estoque Minimo': product.minStock || 10,
          'Valor Unitario': product.price.toFixed(2),
          'Valor Total': ((product.stock || 0) * product.price).toFixed(2)
        });
      }
    });
    downloadCsv(`relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`, report);
  };

  const generateFinancialReport = () => {
    const report = [
      ...orders.map(order => ({
        Data: formatDate(order.date),
        Tipo: 'Receita',
        Descricao: `Venda ${order.salesChannel === 'physical' ? 'PDV' : 'Online'} - ${order.customerName}`,
        Categoria: order.salesChannel === 'physical' ? 'Venda PDV' : 'Venda Online',
        Valor: order.total
      })),
      ...expenses.map(expense => ({
        Data: formatDate(expense.date),
        Tipo: 'Despesa',
        Descricao: expense.description,
        Categoria: expense.category,
        Valor: -expense.amount
      }))
    ];
    downloadCsv(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`, report);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1f4b] via-[#0a1b3d] to-[#08122b]">
      <div className="bg-versiory-ink/70 backdrop-blur-xl text-white shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-versiory-coral rounded-xl flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36 20 H64 L50 43 L36 20 Z" fill="white" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black truncate max-w-[200px] sm:max-w-none">{userRole === 'admin' ? 'Painel Administrativo' : 'Painel do Vendedor'}</h1>
                <p className="text-gray-400 text-sm">Versiory Store</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {/* ERRCOM038: Botão Suporte WhatsApp */}
              <button
                onClick={() => window.open('https://wa.me/5511958540171?text=Olá! Preciso de suporte no painel Versiory Store.', '_blank')}
                className="bg-green-600 hover:bg-green-700 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 text-sm sm:text-base order-2 sm:order-1"
              >
                <span>💬</span> <span className="hidden sm:inline">Suporte</span>
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 px-4 sm:px-6 py-2 rounded-xl font-medium transition-all text-sm sm:text-base order-1 sm:order-2"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 tablet-desktop-container relative">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 mb-6 sticky top-0 z-50">
          <div className="flex flex-wrap gap-1 p-2">
            {(
              userRole === 'admin'
                ? [
                  ['dashboard', 'Dashboard'],
                  ['pdv', 'PDV Loja'],
                  ['products', 'Produtos'],
                  ['categories', 'Categorias'],
                  ['orders', 'Pedidos'],
                  ['customers', 'Clientes'],
                  ['tracking', 'Rastreamento'],
                  ['inventory', 'Estoque'],
                  ['financial', 'Financeiro'],
                  ['fiscal', 'Fiscal/NF-e']
                ]
                : [
                  ['pdv', 'PDV Loja'],
                  ['products', 'Produtos'],
                  ['customers', 'Clientes'],
                  ['orders', 'Pedidos'],
                  ['fiscal', 'Fiscal/NF-e']
                ]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabKey)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === key
                  ? 'bg-versiory-coral text-white'
                  : 'hover:bg-white/10 text-slate-100'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* ERRCOM111: Painel de Resgate de Dados */}
            <div className="bg-amber-500/10 border-2 border-amber-500/30 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">🆘</div>
                <div>
                  <h4 className="text-amber-500 font-black text-sm uppercase">Resgate de Dados Perdidos</h4>
                  <p className="text-slate-400 text-xs mt-1">Recupere tamanhos, cores e estoque salvos no navegador antes do Firebase.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={downloadLocalStorageDump} // Este botão agora funciona
                  className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-3 rounded-2xl font-bold text-xs transition-all border border-white/10"
                >
                  📥 Baixar Dump para Análise
                </button>
                <button 
                  onClick={handleDeepRescue} 
                  className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                >
                Iniciar Varredura Profunda
                </button>
              </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1b2a47] rounded-xl p-6 border border-white/5 shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">{stats.totalProducts}</div>
                <div className="text-slate-400 font-medium text-sm">Total Produtos</div>
              </div>
              <div className="bg-[#1b2a47] rounded-xl p-6 border border-white/5 shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">{stats.totalOrders}</div>
                <div className="text-slate-400 font-medium text-sm">Total Pedidos</div>
              </div>
              <div className="bg-[#1b2a47] rounded-xl p-6 border border-white/5 shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-slate-400 font-medium text-sm">Faturamento</div>
              </div>
              <div className="bg-[#1b2a47] rounded-xl p-6 border border-white/5 shadow-lg">
                <div className="text-3xl font-bold text-white mb-2">{stats.totalCustomers}</div>
                <div className="text-slate-400 font-medium text-sm">Clientes</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#17223b] rounded-xl p-6 border border-white/5 shadow-lg">
                <h3 className="text-white font-bold mb-6">Vendas por Dia (últimos 30 dias)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last30DaysData} onClick={handleChartClick}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => value} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fbbf24' }}
                      />
                      <Line type="monotone" dataKey="Pedidos" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#17223b] rounded-xl p-6 border border-white/5 shadow-lg">
                <h3 className="text-white font-bold mb-6">Faturamento por Dia (últimos 30 dias)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={last30DaysData} 
                      onClick={handleChartClick}
                      onDoubleClick={(data: any) => {
                        // ERRCOM076: Drill-down suporte clique duplo
                        if (data && data.activePayload && data.activePayload[0]) {
                          const payload = data.activePayload[0].payload;
                          setDrillDownData({
                            date: payload.name,
                            orderIds: payload.orderIds || []
                          });
                          setIsDrillDownModalOpen(true);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                        cursor={{ fill: '#ffffff10' }}
                      />
                      <Bar dataKey="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-2 font-bold italic">💡 Clique duplo em um dia para ver os pedidos.</p>
              </div>
            </div>

            {/* Bottom Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#243558] rounded-xl p-6 shadow-lg border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">🏆</span>
                  <h3 className="text-lg font-bold text-white">Top 5 Produtos Mais Vendidos</h3>
                </div>
                <div className="space-y-3">
                  {finalDashboardTop5.map((item, index) => (
                    <div key={item.product?.id} className="bg-[#1b2a47] rounded-xl p-4 flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-slate-300 text-slate-800' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          {index + 1}º
                        </div>
                        <img src={item.product?.image} alt={item.product?.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                        <div>
                          <p className="font-bold text-white text-sm">{item.product?.name}</p>
                          <p className="text-xs text-slate-400">{item.product?.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-versiory-coral font-bold text-sm">{item.count} vendas</div>
                        <div className="text-xs text-slate-400">{formatCurrency(item.revenue)}</div>
                        <div className="text-xs text-green-400 mt-1">{item.product?.stock || 0} em estoque</div>
                      </div>
                    </div>
                  ))}
                  {finalDashboardTop5.length === 0 && <p className="text-slate-400 text-sm">Nenhuma venda registrada.</p>}
                </div>
              </div>

              <div className="bg-[#243558] rounded-xl p-6 shadow-lg border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6">Pedidos Recentes</h3>
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <div key={order.id} className="bg-[#1b2a47] rounded-xl p-4 flex items-center justify-between border border-white/5">
                      <div>
                        <div className="font-bold text-white text-sm mb-1">{formatOrderId(order.id)} - {order.customerName}</div>
                        <div className="text-xs text-slate-400">{formatDate(order.date)} - {formatCurrency(order.total)}</div>
                      </div>
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${order.status === 'delivered' ? 'bg-slate-100 text-slate-800' : order.status === 'pending' || order.status === 'processing' ? 'bg-blue-100 text-blue-800' : STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-800'}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  ))}
                  {recentOrders.length === 0 && <p className="text-slate-400 text-sm">Nenhum pedido recente.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pdv' && (
          <div className="flex flex-col tablet-desktop-flex gap-6">
            {/* Left Column: Product Search & List */}
            <div className="flex-1 space-y-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 tablet-desktop-padding overflow-hidden flex flex-col h-full max-h-[85vh]">
                <div className="p-6 pb-4 border-b border-white/10 sticky top-0 bg-[#0a1b3d]/90 backdrop-blur-md z-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-white tablet-desktop-text">Adicionar Produtos</h2>
                    <input
                      type="text"
                      value={pdvSearch}
                      onChange={e => setPdvSearch(e.target.value)}
                      placeholder="Buscar por nome ou categoria..."
                      className="px-4 py-2 border border-white/20 bg-white/5 backdrop-blur-md text-white rounded-lg focus:ring-2 focus:ring-versiory-coral outline-none w-64"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 tablet-desktop-grid gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">
                  {products
                    .filter(p => p.name.toLowerCase().includes(pdvSearch.toLowerCase()) || p.category.toLowerCase().includes(pdvSearch.toLowerCase()))
                    .map(product => (
                      <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover bg-white" />
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-sm line-clamp-2">{product.name}</h4>
                            <span className="text-slate-300 text-xs">{product.category}</span>
                            {(product.sizes || product.colors) && (
                              <div className="text-xs text-blue-300 mt-1">
                                {product.sizes && `Tamanhos disponíveis`}
                                {product.sizes && product.colors && ' • '}
                                {product.colors && `Cores disponíveis`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          <div>
                            <p className="font-black text-white text-lg">{formatCurrency(product.price)}</p>
                            {product.installments && product.installments > 1 && (
                              <p className="text-[10px] text-versiory-coral font-bold -mt-1">
                                ou {product.installments}x de {formatCurrency(product.price / product.installments)}
                              </p>
                            )}
                            <p className="text-xs text-green-400">
                              {product.stock || 0} em estoque
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (!cashRegister.isOpen) {
                                window.alert('🔒 Abra o caixa antes de adicionar produtos.');
                                setIsCashRegisterModalOpen(true);
                                return;
                              }
                              if (product.sizes || product.colors) {
                                setPdvProductModal({ isOpen: true, product });
                                setPdvModalSelection({ size: '', color: '' });
                              } else {
                                addToPdvCart(product);
                              }
                            }}
                            disabled={(product.stock || 0) <= 0}
                            className="bg-versiory-coral hover:bg-[#ff8368] disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-transform active:scale-95"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  {products.length === 0 && (
                    <div className="col-span-full text-center text-slate-300 py-8">
                      Nenhum produto cadastrado.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Pos Cart */}
            <div className="w-full md:w-[380px] lg:w-[400px] bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 tablet-desktop-padding flex flex-col md:h-[calc(100vh-200px)] md:sticky md:top-6">
              <h2 className="text-xl font-black text-white mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                <span>Carrinho (PDV)</span>
                <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full text-slate-200">
                  {pdvCart.reduce((sum, item) => sum + item.quantity, 0)} itens
                </span>
              </h2>

              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Caixa</p>
                    <p className={`text-sm font-bold ${cashRegister.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                      {cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCashRegisterModalOpen(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${cashRegister.isOpen
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                      }`}
                  >
                    {cashRegister.isOpen ? 'FECHAR CAIXA' : 'ABRIR CAIXA'}
                  </button>
                </div>
                {cashRegister.isOpen && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
                    <span className="text-slate-400">Saldo atual:</span>
                    <span className="text-white font-bold">{formatCurrency(cashRegister.currentBalance)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar mb-6">
                {pdvCart.map((item, index) => (
                  <div key={`${item.product.id}-${item.selectedSize || 'no-size'}-${item.selectedColor || 'no-color'}-${index}`} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <p className="text-sm font-bold text-white line-clamp-1">{item.product.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.selectedSize && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                              TAM: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="text-[10px] bg-versiory-coral/20 text-versiory-coral px-1.5 py-0.5 rounded border border-versiory-coral/30">
                              COR: {item.selectedColor}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{formatCurrency(item.product.price)} / un</p>
                      </div>
                      <button onClick={() => removeFromPdvCart(item.product.id, item.selectedSize, item.selectedColor)} className="text-slate-400 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                        <button
                          onClick={() => updatePdvItemQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                          className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-md transition-colors"
                        >-</button>
                        <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updatePdvItemQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                          className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-md transition-colors"
                        >+</button>
                      </div>
                      <p className="font-bold text-white">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}

                {pdvCart.length === 0 && (
                  <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>Adicione produtos<br />para iniciar uma venda</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 mt-auto">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-300">Total a pagar:</span>
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(pdvCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}
                  </span>
                </div>
                <button
                  onClick={handlePdvCheckout}
                  disabled={pdvCart.length === 0 || isSubmitting || !cashRegister.isOpen}
                  className="w-full bg-versiory-coral hover:bg-[#ff8368] disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-versiory-coral/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Finalizando...
                    </>
                  ) : !cashRegister.isOpen ? (
                    '🔒 Abra o Caixa para Vender'
                  ) : (
                    'Finalizar Venda (PDV)'
                  )}
                </button>

                <button
                  onClick={handleShowPartialReport}
                  disabled={!cashRegister.isOpen}
                  className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-versiory-coral/20 mt-3 flex flex-col items-center justify-center gap-0.5"
                >
                  <span>Leitura X</span>
                </button>
                <div className="mt-2 flex items-start gap-1 justify-center px-2">
                  <span className="text-yellow-400 text-[10px]">⚠️</span>
                  <p className="text-[9px] font-bold text-slate-400 text-center leading-tight">
                    Resumo das vendas realizadas até o momento, para conferência parcial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-black text-white">Gerenciar Produtos</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Buscar produtos..." // ERRCOM092: Fix busca por descrição
                    className="w-full px-4 py-2 border border-white/20 bg-white/10 backdrop-blur-md text-white rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {userRole === 'admin' && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!window.confirm('Sincronizar estoque por tamanho com estoque geral?\n\nIsso vai distribuir o estoque geral igualmente entre as variações (tamanhos/cores).')) return;
                        try {
                          const { saveProduct } = await import('../services/firebase');
                          const updatedProductsList = [...products];
                          let updatedCount = 0;

                          for (let i = 0; i < updatedProductsList.length; i++) {
                            const product = updatedProductsList[i];
                            if (product.sizes) {
                              const sizeArray = product.sizes.split(',').map(s => s.trim()).filter(s => s);
                              const colorArray = product.colors ? product.colors.split(',').map(c => c.trim()).filter(c => c) : [];
                              const totalStock = product.stock || 0;

                              if (colorArray.length > 0) {
                                // Sincronizar por Tamanho + Cor
                                const combinations: string[] = [];
                                sizeArray.forEach(s => colorArray.forEach(c => combinations.push(`${s}-${c}`)));

                                const stockPerComb = Math.floor(totalStock / combinations.length);
                                let remainder = totalStock % combinations.length;

                                const stockBySizeColor: { [key: string]: number } = {};
                                combinations.forEach((key, index) => {
                                  stockBySizeColor[key] = stockPerComb + (index < remainder ? 1 : 0);
                                });

                                const updatedProduct = { ...product, stockBySizeColor, stockBySize: {} };
                                await saveProduct(updatedProduct);
                                updatedProductsList[i] = updatedProduct;
                                updatedCount++;
                              } else {
                                // Sincronizar apenas por Tamanho
                                const stockPerSize = Math.floor(totalStock / sizeArray.length);
                                let remainder = totalStock % sizeArray.length;

                                const stockBySize: { [key: string]: number } = {};
                                sizeArray.forEach((size, index) => {
                                  stockBySize[size] = stockPerSize + (index < remainder ? 1 : 0);
                                });

                                const updatedProduct = { ...product, stockBySize, stockBySizeColor: {} };
                                await saveProduct(updatedProduct);
                                updatedProductsList[i] = updatedProduct;
                                updatedCount++;
                              }
                            }
                          }

                          onUpdateProducts(updatedProductsList);
                          window.alert(`${updatedCount} produtos sincronizados com sucesso!`);
                        } catch (error) {
                          console.error(error);
                          window.alert('Erro ao sincronizar produtos.');
                        }
                      }}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all text-xs"
                    >
                      🔄 Sincronizar <span className="hidden lg:inline">Estoque</span>
                    </button>
                    <button
                      onClick={() => openProductModal()}
                      className="flex-1 sm:flex-none bg-versiory-coral text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg text-sm"
                    >
                      + Novo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ERRCOM031: Top 5 Produtos Mais Vendidos */}
            {finalDashboardTop5.some(p => p.count > 0) && (
              <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5">
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏆</span> Top 5 Produtos Mais Vendidos
                </h3>
                <div className="space-y-2">
                  {finalDashboardTop5.filter(p => p.count > 0).map(({ product, count, revenue }, idx) => (
                    <div key={product?.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-slate-400 text-white' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/20 text-white'
                        }`}>{idx + 1}°</span>
                      <img src={product?.image} alt={product?.name} className="w-10 h-10 rounded-lg object-cover bg-white" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white line-clamp-1">{product?.name}</p>
                        <p className="text-xs text-slate-400">{product?.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-versiory-coral">{count} vendas</p>
                        <p className="text-xs text-slate-400">{formatCurrency(revenue || (product?.price * count))}</p>
                        <p className="text-xs text-green-400">{product?.stock ?? 0} em estoque</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProductsList.map(product => (
                <div key={product.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden hover:scale-[1.02] transition-transform">
                  <div className="relative h-48 bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-versiory-coral text-white px-3 py-1 rounded-full text-sm font-bold">
                      #{product.id}
                    </div>
                    {(product.stock || 0) === 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        SEM ESTOQUE
                      </div>
                    )}
                    {(product.stock || 0) > 0 && (product.stock || 0) < (product.minStock ?? 10) && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        ESTOQUE BAIXO
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white line-clamp-2 mb-1">{product.name}</h3>
                        <span className="inline-block px-2 py-1 bg-white/10 text-slate-200 text-xs rounded-lg">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    {/* ERRCOM003: Descrição com quebra de linha */}
                    <p className="text-sm text-slate-300 line-clamp-2 mb-4 whitespace-pre-wrap">{product.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Preço</div>
                        <div className="text-lg font-bold text-white">{formatCurrency(product.price)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Estoque</div>
                        <div className={`text-lg font-bold ${(product.stock || 0) < (product.minStock ?? 10) ? 'text-red-400' : 'text-white'}`}>
                          {product.stock || 0} un
                        </div>
                        <div className="text-xs text-slate-400">Mín: {product.minStock ?? 10} un</div>
                      </div>
                    </div>

                    {product.sizes && (
                      <div className="mb-4">
                        <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Estoque Detalhado:</div>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.split(',').map(size => {
                            const trimmedSize = size.trim();
                            const isExpanded = expandedSizes[`${product.id}-${trimmedSize}`];
                            const colors = product.colors ? product.colors.split(',').map(c => c.trim()).filter(c => c) : [];

                            if (colors.length > 0 && product.stockBySizeColor) {
                              const totalSizeStock = colors.reduce((sum, color) => {
                                const key = `${trimmedSize}-${color}`;
                                return sum + (product.stockBySizeColor?.[key] || 0);
                              }, 0);

                              if (totalSizeStock === 0) return null;

                              return (
                                <div key={trimmedSize} className="flex flex-col">
                                  <button
                                    onClick={() => toggleSizeExpansion(product.id, trimmedSize)}
                                    className={`inline-flex items-center rounded-lg px-2 py-1 border transition-all hover:scale-105 active:scale-95 ${isExpanded
                                      ? 'bg-versiory-coral/20 border-versiory-coral text-white'
                                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                      } text-[10px]`}
                                  >
                                    <span className="font-bold mr-1">{trimmedSize}:</span>
                                    <span className="font-black">{totalSizeStock}</span>
                                    <span className={`ml-1 opacity-60 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </span>
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-1 mt-1 pl-2 border-l-2 border-versiory-coral/30 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                      {colors.map(color => {
                                        const qty = product.stockBySizeColor?.[`${trimmedSize}-${color}`] || 0;
                                        if (qty === 0) return null;
                                        return (
                                          <div key={color} className="flex items-center gap-1 text-[9px] text-slate-400">
                                            <span className="w-1 h-1 rounded-full bg-versiory-coral/50"></span>
                                            <span>{color}:</span>
                                            <span className="text-white font-bold">{qty}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              const sizeStock = product.stockBySize?.[trimmedSize] || 0;
                              if (sizeStock === 0) return null;
                              return (
                                <span key={trimmedSize} className="inline-flex items-center bg-white/5 rounded-lg px-2 py-1 border border-white/10 text-[10px] text-slate-300">
                                  <span className="font-bold text-versiory-coral mr-1">{trimmedSize}:</span>
                                  <span className="font-black">{sizeStock}</span>
                                </span>
                              );
                            }
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-sm font-medium text-white ml-1">{product.rating}</span>
                      </div>
                      <span className="text-xs text-slate-400">({product.reviews} avaliações)</span>
                    </div>

                    {userRole === 'admin' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openProductModal(product)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => {
                            setSizeManagerProductId(product.id);
                            setTempStockBySize(product.stockBySize || {});
                            setTempStockBySizeColor(product.stockBySizeColor || {});
                            setIsSizeManagerModalOpen(true);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
                        >
                          📏 Tamanhos
                        </button>
                        {/* ERRCOM044: Botão Mais Detalhes */}
                        <button
                          onClick={() => {
                            alert(`📋 Detalhes Técnicos: ${product.name}\n\nID: #${product.id}\nCategoria: ${product.category}\nPreço: ${formatCurrency(product.price)}\nEstoque Total: ${product.stock || 0} unidades\nEstoque Mínimo: ${product.minStock ?? 10} unidades\n\nDescrição:\n${product.description || 'Nenhuma descrição disponível'}\n\nDados Fiscais:\nNCM: ${product.ncm || 'N/A'}\nCFOP: ${product.cfop || 'N/A'}\nCST: ${product.cst || 'N/A'}\nOrigem: ${product.origem ?? 'N/A'}\nUnidade: ${product.unidade || 'N/A'}\nPeso: ${product.peso || 'N/A'} kg\nGTIN: ${product.gtin || 'N/A'}\n\nAlíquotas:\nICMS: ${product.aliquotaIcms || 0}%\nPIS: ${product.aliquotaPis || 0}%\nCOFINS: ${product.aliquotaCofins || 0}%\nIPI: ${product.aliquotaIpi || 0}%`);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
                        >
                          📋 Mais Detalhes
                        </button>
                        <button
                          onClick={() => handleProductDelete(product.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                    {userRole === 'seller' && (
                      <div className="text-center text-slate-400 text-sm py-2">
                        Somente consulta
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-white mb-2">Nenhum produto cadastrado</h3>
                <p className="text-slate-300 mb-6">Comece adicionando seu primeiro produto</p>
                {userRole === 'admin' && (
                  <button
                    onClick={() => openProductModal()}
                    className="bg-versiory-coral text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg"
                  >
                    + Adicionar Primeiro Produto
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">Gerenciar Categorias</h2>
              <button
                onClick={() => openCategoryModal()}
                className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg hover:-translate-y-1 active:scale-95"
              >
                + Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div key={category.id} className="bg-slate-800/40 backdrop-blur-md rounded-xl p-6 shadow-lg border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCategoryModal(category)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Editar Categoria"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleCategoryDelete(category.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Excluir Categoria"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-4">{category.description}</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Produtos nesta categoria:</p>
                    {products.filter(product => product.category === category.name).map(p => (
                      <button
                        key={p.id}
                        onClick={() => openProductModal(p)}
                        className="w-full text-left p-2 rounded-lg bg-white/5 border border-white/5 hover:border-versiory-coral/50 hover:bg-white/10 transition-all group flex items-center gap-3"
                      >
                        <img src={p.image} alt="" className="w-8 h-8 rounded object-cover bg-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-versiory-coral transition-colors">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{formatCurrency(p.price)} • {p.stock || 0} un</p>
                        </div>
                        <svg className="w-3 h-3 text-slate-500 group-hover:text-versiory-coral transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                    {products.filter(product => product.category === category.name).length === 0 && (
                      <p className="text-xs text-slate-500 italic pl-2">Nenhum produto cadastrado.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {/* ERRCOM031B: Cards de total e status de pedidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              <div className="col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="text-xl font-black text-white">{formatCurrency(orders.filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)).reduce((s, o) => s + o.total, 0))}</div>
                <div className="text-slate-300 text-xs font-medium mt-1">Valor Total de Pedidos</div>
              </div>
              {(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(status => (
                <div key={status} className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20">
                  <div className="text-lg font-black text-white">{orders.filter(o => o.status === status).length}</div>
                  <div className="text-xs text-slate-300">{STATUS_LABELS[status]}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
              <h2 className="text-xl font-black text-white">Gerenciar Pedidos</h2>
              <div className="flex flex-wrap gap-3">
                {/* ERRCOM047: Busca por número do pedido */}
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="🔍 Buscar pedido ou cliente..."
                  className="px-4 py-2 border border-white/20 bg-white/5 text-white rounded-xl text-sm focus:ring-2 focus:ring-versiory-coral outline-none w-64"
                />
                <button
                  onClick={() => handleDownloadNFXml()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
                >
                  📄 Baixar XML NF-e
                </button>
                <select
                  value={orderFilter}
                  onChange={event => setOrderFilter(event.target.value as OrderStatus | 'all')}
                  className="px-3 py-2 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-lg text-sm focus:ring-2 focus:ring-versiory-coral outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Aguardando Pagamento</option>
                  <option value="paid">Pagamento Efetuado</option>
                  <option value="processing">Em Processamento</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-white/15 backdrop-blur-md border-b border-white/25">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Pedido</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Status</th>
                      {/* ERRCOM018: Coluna de Observação */}
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Observação</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        {/* ERRCOM046: Clicar no número do pedido abre detalhe */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-versiory-coral">
                          <button onClick={() => setSelectedOrderDetail(order)} className="hover:underline font-bold">
                            {formatOrderId(order.id)}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{formatDate(order.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        {/* ERRCOM018: Campo observação */}
                        <td className="px-6 py-4 text-sm text-slate-300 max-w-[180px] truncate" title={order.notes || ''}>
                          {order.notes || <span className="text-slate-500 italic text-xs">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                          <button
                            onClick={() => openOrderStatusModal(order)}
                            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                          >
                            Atualizar Status
                          </button>
                          {order.isBudget && (
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                            >
                              Converter em Venda
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'customers' && (
          <div>
            <h2 className="text-xl font-black text-white mb-4">Gerenciar Clientes</h2>

            {/* ERRCOM033: Cards de métricas de clientes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-black text-white">{customerStats.total}</div>
                <div className="text-slate-300 text-sm">Total Clientes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-black text-green-400">{customerStats.pdv}</div>
                <div className="text-slate-300 text-sm">Clientes PDV</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-black text-blue-400">{customerStats.online}</div>
                <div className="text-slate-300 text-sm">Clientes Online</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-black text-versiory-coral">{formatCurrency(customerStats.avgTicket)}</div>
                <div className="text-slate-300 text-sm">Ticket Médio</div>
              </div>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="🔍 Buscar cliente por nome, email ou telefone..."
                className="px-4 py-3 border border-white/20 bg-white/5 backdrop-blur-md text-white rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none w-full"
              />
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/15 backdrop-blur-md border-b border-white/25">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Telefone</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Pedidos</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Cadastro</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {[...filteredCustomers].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(customer => (
                      <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">#{customer.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.phone}</td>
                        {/* ERRCOM022: Clicar na quantidade de pedidos abre histórico */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              // ERRCOM109: Filtrar histórico por ID se disponível, email apenas se não for vazio
                              const custOrders = orders.filter(o => 
                                (o.customerId && o.customerId === customer.id) || 
                                (customer.email && customer.email.length > 5 && o.customerEmail === customer.email)
                              );
                              setCustomerOrderHistory({ customer, orders: custOrders });
                            }}
                            className="text-versiory-coral hover:underline font-bold"
                          >
                            {customer.totalOrders} pedidos
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                          {formatDate(customer.createdAt || '')}
                          {formatCurrency(customer.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'tracking' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">Rastreamento</h2>
              <button
                onClick={() => openTrackingModal()}
                className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg hover:-translate-y-1 active:scale-95"
              >
                + Novo Rastreamento
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/15 backdrop-blur-md border-b border-white/25">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Pedido</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Transportadora</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Codigo</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Atualizacao</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tracking.map(track => (
                      <tr key={track.orderId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{track.orderId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{track.carrier}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{track.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${TRACKING_COLORS[track.status]}`}>
                            {TRACKING_LABELS[track.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{formatDate(track.lastUpdate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openTrackingModal(track)}
                            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                          >
                            Atualizar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{formatCurrency(inventoryStats.totalStockValue)}</div>
                <div className="text-slate-100 font-medium text-sm">Valor em Estoque</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{inventoryStats.lowStockItems}</div>
                <div className="text-slate-100 font-medium text-sm">Estoque Baixo</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{inventoryStats.outOfStockItems}</div>
                <div className="text-slate-100 font-medium text-sm">Esgotados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{inventoryStats.totalItemsInStock}</div>
                <div className="text-slate-100 font-medium text-sm">Itens em Estoque</div>
              </div>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-4">
                <h3 className="text-lg font-bold text-slate-100 mb-3">Alertas de Estoque Baixo</h3>
                <div className="space-y-2">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/20">
                      <div>
                        <span className="font-medium text-slate-100">{product.name}</span>
                        <span className="text-sm text-slate-200 ml-2">({product.stock || 0} unidades)</span>
                      </div>
                      <button
                        onClick={() => openInventoryModal(product.id)}
                        className="bg-versiory-coral hover:bg-[#ff8368] text-white px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        Reabastecer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <input
                value={inventorySearch}
                onChange={event => setInventorySearch(event.target.value)}
                placeholder="Buscar por produto ou categoria"
                className="flex-1 px-4 py-2 border border-white/20 bg-white/5 backdrop-blur-md text-white rounded-lg focus:ring-2 focus:ring-versiory-coral outline-none"
              />
              <select
                value={stockFilter}
                onChange={event => setStockFilter(event.target.value as StockFilter)}
                className="px-4 py-2 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-lg focus:ring-2 focus:ring-versiory-coral outline-none"
              >
                <option value="all">Todos</option>
                <option value="low">Estoque Baixo</option>
                <option value="out">Esgotados</option>
                <option value="normal">Normal</option>
              </select>
              <button
                onClick={generateInventoryReport}
                className="bg-versiory-ink hover:bg-[#1b2a3a] text-white px-4 py-2 rounded-lg"
              >
                Exportar CSV
              </button>
            </div>

            {/* BUGFIX #14: Filtros de Status de Estoque */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'all', label: 'Todos os Produtos', icon: '📦' },
                { id: 'low', label: 'Estoque Baixo', icon: '⚠️' },
                { id: 'out', label: 'Sem Estoque', icon: '❌' },
                { id: 'normal', label: 'Estoque Normal', icon: '✅' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setStockFilter(filter.id as StockFilter)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${stockFilter === filter.id
                    ? 'bg-versiory-coral text-white shadow-lg'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                    }`}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventoryProducts.map(product => {
                const stock = product.stock || 0;
                const totalValue = stock * product.price;
                let statusLabel = 'Normal';
                let statusClass = 'bg-green-100 text-green-800';
                const threshold = product.minStock ?? 10;
                if (stock === 0) {
                  statusLabel = 'Esgotado';
                  statusClass = 'bg-red-100 text-red-800';
                } else if (stock < threshold) {
                  statusLabel = 'Estoque Baixo';
                  statusClass = 'bg-yellow-100 text-yellow-800';
                }

                return (
                  <div key={product.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden hover:scale-[1.02] transition-transform">
                    <div className="relative h-48 bg-white">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-versiory-coral text-white px-3 py-1 rounded-full text-sm font-bold">
                        #{product.id}
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white line-clamp-2 mb-1">{product.name}</h3>
                          <span className="inline-block px-2 py-1 bg-white/10 text-slate-200 text-xs rounded-lg">
                            {product.category}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Estoque Atual</div>
                          <div className="text-2xl font-black text-white">{stock}</div>
                          <div className="text-xs text-slate-400">Mín: {product.minStock ?? 10} un</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Valor Unit.</div>
                          <div className="text-lg font-bold text-white">{formatCurrency(product.price)}</div>
                          <div className="text-xs text-green-400 font-medium">Total: {formatCurrency(totalValue)}</div>
                        </div>
                      </div>

                      {product.sizes && (
                        <div className="mb-4">
                          <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Estoque por tamanho:</div>
                          <div className="flex flex-wrap gap-2">
                            {product.sizes.split(',').map(size => {
                              const trimmedSize = size.trim();
                              const isExpanded = expandedSizes[`inv-${product.id}-${trimmedSize}`]; // usar prefixo inv para não conflitar com a aba produtos se necessário, ou manter igual
                              const colors = product.colors ? product.colors.split(',').map(c => c.trim()).filter(c => c) : [];

                              if (colors.length > 0 && product.stockBySizeColor) {
                                const totalSizeStock = colors.reduce((sum, color) => {
                                  const key = `${trimmedSize}-${color}`;
                                  return sum + (product.stockBySizeColor?.[key] || 0);
                                }, 0);

                                if (totalSizeStock === 0) return null;

                                return (
                                  <div key={trimmedSize} className="flex flex-col">
                                    <button
                                      onClick={() => {
                                        const key = `inv-${product.id}-${trimmedSize}`;
                                        setExpandedSizes(prev => ({ ...prev, [key]: !prev[key] }));
                                      }}
                                      className={`inline-flex items-center rounded-lg px-2 py-1 border transition-all hover:scale-105 active:scale-95 ${isExpanded
                                        ? 'bg-green-500/20 border-green-500 text-green-300'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                        } text-[10px]`}
                                    >
                                      <span className="font-bold mr-1">{trimmedSize}:</span>
                                      <span className="font-black">{totalSizeStock}</span>
                                      <span className={`ml-1 opacity-60 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </span>
                                    </button>
                                    {isExpanded && (
                                      <div className="ml-1 mt-1 pl-2 border-l-2 border-green-500/30 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {colors.map(color => {
                                          const qty = product.stockBySizeColor?.[`${trimmedSize}-${color}`] || 0;
                                          if (qty === 0) return null;
                                          return (
                                            <div key={color} className="flex items-center gap-1 text-[9px] text-slate-400">
                                              <span className="w-1 h-1 rounded-full bg-green-500/50"></span>
                                              <span>{color}:</span>
                                              <span className="text-white font-bold">{qty}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              } else {
                                const sizeStock = product.stockBySize?.[trimmedSize] || 0;
                                if (sizeStock === 0) return null;
                                return (
                                  <span key={trimmedSize} className={`px-2 py-1 text-[10px] rounded-lg border font-medium ${sizeStock > 0 ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                                    }`}>
                                    {trimmedSize}: {sizeStock}
                                  </span>
                                );
                              }
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => openInventoryModal(product.id)}
                        className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg"
                      >
                        📦 Movimentar Estoque
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredInventoryProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-white mb-2">Nenhum produto encontrado</h3>
                <p className="text-slate-300">Ajuste os filtros para ver mais produtos</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentBreakdownModal({ channel: 'pdv', orders: orders.filter(o => (o.salesChannel === 'physical' || !o.salesChannel) && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) })}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/20 transition-all text-left"
              >
                <div className="text-2xl font-bold text-slate-100">{formatCurrency(financialStats.totalRevenue)}</div>
                <div className="text-slate-100 font-medium text-sm">Receita Total — clique para detalhes</div>
              </button>
              <button
                onClick={() => setPaymentBreakdownModal({ channel: 'pdv', orders: orders.filter(o => o.salesChannel === 'physical' && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) })}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/20 transition-all text-left"
              >
                <div className="text-2xl font-bold text-green-400">{formatCurrency(financialStats.pdvRevenue)}</div>
                <div className="text-slate-100 font-medium text-sm">Vendas PDV — clique para detalhes</div>
              </button>
              <button
                onClick={() => setPaymentBreakdownModal({ channel: 'online', orders: orders.filter(o => (!o.salesChannel || o.salesChannel === 'online') && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) })}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/20 transition-all text-left"
              >
                <div className="text-2xl font-bold text-blue-400">{formatCurrency(financialStats.onlineRevenue)}</div>
                <div className="text-slate-100 font-medium text-sm">Vendas Online — clique para detalhes</div>
              </button>
              <button
                onClick={() => {
                  const expensesList = expenses.map(e => ({
                    ...e,
                    categoryLabel: e.category === 'fixed' ? 'Fixa' : e.category === 'variable' ? 'Variável' : e.category === 'investment' ? 'Investimento' : 'Emergencial'
                  }));
                  if (expensesList.length > 0) {
                    alert(`Despesas Totais: ${formatCurrency(financialStats.totalExpenses)}\n\nDetalhamento:\n${expensesList.map(e => `• ${e.description} (${e.categoryLabel}): ${formatCurrency(e.amount)}`).join('\n')}`);
                  } else {
                    alert('Nenhuma despesa cadastrada.');
                  }
                }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/20 transition-all text-left"
              >
                <div className="text-2xl font-bold text-slate-100">{formatCurrency(financialStats.totalExpenses)}</div>
                <div className="text-slate-100 font-medium text-sm">Despesas — clique para detalhes</div>
              </button>
              <button
                onClick={() => {
                  alert(`Lucro Líquido: ${formatCurrency(financialStats.netProfit)}\n\nCálculo:\nReceita Total: ${formatCurrency(financialStats.totalRevenue)}\n(-) Despesas: ${formatCurrency(financialStats.totalExpenses)}\n(=) Lucro Líquido: ${formatCurrency(financialStats.netProfit)}`);
                }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/20 transition-all text-left"
              >
                <div className="text-2xl font-bold text-slate-100">{formatCurrency(financialStats.netProfit)}</div>
                <div className="text-slate-100 font-medium text-sm">Lucro Líquido — clique para detalhes</div>
              </button>
              <button
                onClick={() => {
                  alert(`Margem de Lucro: ${financialStats.profitMargin.toFixed(1)}%\n\nCálculo:\nLucro Líquido: ${formatCurrency(financialStats.netProfit)}\nReceita Total: ${formatCurrency(financialStats.totalRevenue)}\nMargem = (Lucro / Receita) × 100\nMargem = ${financialStats.profitMargin.toFixed(2)}%`);
                }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:bg-white/20 transition-all text-left"
              >
                <div className="text-2xl font-bold text-slate-100">{financialStats.profitMargin.toFixed(1)}%</div>
                <div className="text-slate-100 font-medium text-sm">Margem de Lucro — clique para detalhes</div>
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <button
                onClick={() => openExpenseModal()}
                className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg hover:-translate-y-1 active:scale-95"
              >
                + Lancar Despesa
              </button>
              <button
                onClick={generateFinancialReport}
                className="bg-versiory-ink hover:bg-[#1b2a3a] text-white px-4 py-2 rounded-lg"
              >
                Exportar CSV
              </button>
            </div>

            {/* ERRCOM029/030: Cards clicáveis PDV e Online por forma de pagamento */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => setPaymentBreakdownModal({ channel: 'pdv', orders: orders.filter(o => o.salesChannel === 'physical' && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) })}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-left hover:bg-white/20 transition-all"
              >
                <div className="text-lg font-black text-green-400">{formatCurrency(financialStats.pdvRevenue)}</div>
                <div className="text-slate-300 text-sm">Vendas PDV — clique para ver por forma de pagamento</div>
              </button>
              <button
                onClick={() => setPaymentBreakdownModal({ channel: 'online', orders: orders.filter(o => (!o.salesChannel || o.salesChannel === 'online') && ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) })}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-left hover:bg-white/20 transition-all"
              >
                <div className="text-lg font-black text-blue-400">{formatCurrency(financialStats.onlineRevenue)}</div>
                <div className="text-slate-300 text-sm">Vendas Online — clique para ver por forma de pagamento</div>
              </button>
            </div>

            {/* ERRCOM027: Filtro de data */}
            <div className="flex flex-wrap gap-3 items-center mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <span className="text-slate-300 text-sm font-bold">Filtrar por período:</span>
              <input type="date" value={financialDateFilter.from} onChange={e => setFinancialDateFilter(p => ({ ...p, from: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:ring-2 focus:ring-versiory-coral outline-none" />
              <span className="text-slate-400 text-sm">até</span>
              <input type="date" value={financialDateFilter.to} onChange={e => setFinancialDateFilter(p => ({ ...p, to: e.target.value }))}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:ring-2 focus:ring-versiory-coral outline-none" />
              {(financialDateFilter.from || financialDateFilter.to) && (
                <button onClick={() => setFinancialDateFilter({ from: '', to: '' })} className="text-slate-400 hover:text-white text-sm underline">Limpar</button>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4">
              <h3 className="text-lg font-bold text-white mb-4">Transacoes Recentes</h3>
              <div className="space-y-3">
                {recentTransactions.map(transaction => (
                  <button
                    key={`${transaction.type}-${transaction.id}`}
                    onClick={() => {
                      if (transaction.type === 'revenue') {
                        const order = orders.find(o => o.id === transaction.id);
                        if (order) setSelectedOrderDetail(order);
                      } else if (transaction.type === 'expense' && 'expenseId' in transaction) {
                        openExpenseModal(expenses.find(e => e.id === transaction.expenseId));
                      }
                    }}
                    className="w-full flex justify-between items-center p-4 bg-white/5 border border-white/15 rounded-xl hover:bg-white/10 transition-all text-left cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-100">{transaction.description}</div>
                      <div className="text-sm text-slate-200">
                        {formatDate(transaction.date)} - {transaction.category}
                      </div>
                      {/* Novo: Observações */}
                      {'notes' in transaction && transaction.notes && (
                        <div className="text-xs text-slate-400 mt-1 italic">{transaction.notes as string}</div>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className={`font-bold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        <div className="text-xs text-slate-200">
                          {transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                        </div>
                      </div>
                      {transaction.type === 'expense' && 'expenseId' in transaction && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openExpenseModal(expenses.find(e => e.id === transaction.expenseId))}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleExpenseDelete(transaction.expenseId!)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                {recentTransactions.length === 0 && (
                  <p className="text-sm text-slate-200">Nenhuma transacao recente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fiscal' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-white">Configurações Fiscais e NF-e</h2>
              {userRole === 'admin' && (
                <button
                  onClick={() => setIsFiscalConfigOpen(true)}
                  className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all"
                >
                  ⚙️ Configurar Dados Fiscais
                </button>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Notas Fiscais Emitidas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/15 border-b border-white/25">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase">Pedido</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase">Data</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase">Valor</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.filter(o => o.emitNF).map(order => (
                      <tr key={order.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-sm font-medium text-slate-100">{formatOrderId(order.id)}</td>
                        <td className="px-6 py-4 text-sm text-slate-100">{order.customerName}</td>
                        <td className="px-6 py-4 text-sm text-slate-100">{formatDate(order.date)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-100">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDownloadNFXml(order.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium"
                          >
                            📄 Baixar XML
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.filter(o => o.emitNF).length === 0 && (
                  <p className="text-center text-slate-300 py-8">Nenhuma NF-e emitida ainda.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {
        isProductModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white border-0 shadow-2xl rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {editingProductId ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                  <p className="text-slate-500 mt-1 text-sm">
                    Preencha as informacoes detalhadas para a vitrine da loja.
                  </p>
                </div>
                <button
                  onClick={closeProductModal}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleProductSubmit}
                className="flex-1 overflow-y-auto p-6 md:p-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
              >

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                  {/* Left Column: Basic Info */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                        Informacoes Basicas
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Produto *</label>
                          <input
                            type="text"
                            value={productForm.name || ''}
                            onChange={event => setProductForm(prev => ({ ...prev, name: event.target.value }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                            placeholder="Ex: Tenis Esportivo Nike Air"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Categoria *</label>
                            <select
                              value={isCustomCategory ? '__new__' : productForm.category}
                              onChange={event => {
                                const value = event.target.value;
                                if (value === '__new__') {
                                  setIsCustomCategory(true);
                                  setProductForm(prev => ({ ...prev, category: '' }));
                                } else {
                                  setIsCustomCategory(false);
                                  setCustomCategory('');
                                  setProductForm(prev => ({ ...prev, category: value }));
                                }
                              }}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                            >
                              {categoryOptions.map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                              <option value="__new__">+ Nova categoria...</option>
                            </select>
                          </div>
                          {isCustomCategory && (
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Nova Categoria *</label>
                              <input
                                type="text"
                                value={customCategory}
                                onChange={event => {
                                  setCustomCategory(event.target.value);
                                  setProductForm(prev => ({ ...prev, category: event.target.value }));
                                }}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                                placeholder="Ex: Acessorios"
                                required
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tamanhos (Opcional)</label>
                            <input
                              type="text"
                              value={productForm.sizes || ''}
                              onChange={event => setProductForm(prev => ({ ...prev, sizes: event.target.value }))}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                              placeholder={productForm.category === 'Cama, Mesa e Banho' ? 'Digite o tipo: Lençol, Edredom, Toalha de Banho, etc.' : 'Ex: P, M, G, GG'}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              💡 Separe por vírgula. Use o botão "📏 Tamanhos" no card do produto para gerenciar estoque por tamanho.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Cores (Opcional)</label>
                            <input
                              type="text"
                              value={productForm.colors || ''}
                              onChange={event => setProductForm(prev => ({ ...prev, colors: event.target.value }))}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                              placeholder="Ex: Preto, Branco, Vermelho, Azul"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              🎨 Separe por vírgula. Se usar cores + tamanhos, gerencie estoque por combinação (ex: M-Preto).
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Descricao Detalhada *</label>
                          <textarea
                            rows={6}
                            value={productForm.description || ''}
                            onChange={event => setProductForm(prev => ({ ...prev, description: event.target.value }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 resize-none"
                            placeholder="Dica: Use quebras de linha para criar topicos (como na Amazon)."
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pricing, Inventory & Media */}
                  <div className="space-y-6">

                    {/* Pricing block */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">2</span>
                        Preco e Estoque
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Preco de Venda (R$) *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={productForm.price || ''}
                              onChange={event => setProductForm(prev => ({ ...prev, price: parseFloat(event.target.value) }))}
                              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-white text-slate-900 text-lg font-bold"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Quantidade em Estoque *</label>
                          <input
                            type="number"
                            min="0"
                            value={productForm.stock ?? 0}
                            onChange={event => setProductForm(prev => ({ ...prev, stock: parseInt(event.target.value, 10) }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-white text-slate-900 text-lg font-bold"
                            required
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Parcelamento Máx. (x)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={productForm.installments || 1}
                            onChange={event => setProductForm(prev => ({ ...prev, installments: parseInt(event.target.value, 10) }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-white text-slate-900 text-lg font-bold"
                            disabled={productForm.category !== 'Serviços' && !isCustomCategory}
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Apenas para Serviços.</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Estoque Mínimo (alerta) <span className="text-slate-400 font-normal">— padrão: 10</span></label>
                          <input
                            type="number"
                            min="0"
                            value={productForm.minStock ?? 10}
                            onChange={event => setProductForm(prev => ({ ...prev, minStock: parseInt(event.target.value, 10) }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-white text-slate-900"
                          />
                          <p className="text-xs text-slate-500 mt-1">O sistema emite alerta quando o estoque for menor que este valor.</p>
                        </div>
                      </div>
                    </div>

                    {/* Media block */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">3</span>
                        Midia
                      </h4>
                      <div className="flex gap-6 items-start">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Imagem Principal</label>
                          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:border-versiory-coral hover:bg-white transition-all text-center cursor-pointer overflow-hidden group">
                            {productForm.image ? (
                              <img src={productForm.image} alt="Preview" className="mx-auto h-32 object-contain group-hover:opacity-50 transition-opacity" />
                            ) : (
                              <div className="py-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm font-medium text-slate-600">Clique para upload</p>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={event => handleImageUpload(event.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="w-1/3">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Avaliacao</label>
                          <p className="text-xs text-slate-500 mb-2">Estrelas.</p>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={productForm.rating || 5}
                            onChange={event => setProductForm(prev => ({ ...prev, rating: parseFloat(event.target.value) }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-white text-slate-900 mb-3"
                          />
                          <p className="text-xs text-slate-500 mb-2">Qtd Avaliacoes.</p>
                          <input
                            type="number"
                            min="0"
                            value={productForm.reviews || 0}
                            onChange={event => setProductForm(prev => ({ ...prev, reviews: parseInt(event.target.value, 10) }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <ImageGallery
                      images={productForm.images || []}
                      onImagesChange={(images) => {
                        setProductForm(prev => ({
                          ...prev,
                          images,
                          image: prev.image || images[0] || ''
                        }));
                      }}
                    />


                    {productForm.sizes && (
                      <SizeChartEditor
                        sizeChart={productForm.sizeChart}
                        onChange={(sizeChart) => setProductForm(prev => ({ ...prev, sizeChart }))}
                        availableSizes={productForm.sizes.split(',').map(s => s.trim()).filter(s => s)}
                      />
                    )}

                    <FiscalFields
                      productForm={productForm}
                      onChange={(field, value) => setProductForm(prev => ({ ...prev, [field]: value }))}
                    />

                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-4">
                  <button
                    type="button"
                    onClick={closeProductModal}
                    className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold bg-white hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-versiory-ink hover:bg-[#1b2a3a] text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-versiory-ink/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Salvando...
                      </>
                    ) : (
                      'Salvar Produto'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">
                  {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>

              </div>
              <form
                onSubmit={handleCategorySubmit}
                className="p-6 space-y-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
              >

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Nome da Categoria</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={event => setCategoryForm(prev => ({ ...prev, name: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Descricao</label>
                  <textarea
                    rows={3}
                    value={categoryForm.description}
                    onChange={event => setCategoryForm(prev => ({ ...prev, description: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Tipo de Tamanho</label>
                  <select
                    value={categoryForm.sizeType}
                    onChange={event => setCategoryForm(prev => ({ ...prev, sizeType: event.target.value as any }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  >
                    <option value="none">Sem tamanhos</option>
                    <option value="clothing">Roupas (P, M, G, GG)</option>
                    <option value="shoes">Calçados (34, 35, 36...)</option>
                    <option value="accessories">Acessórios (Único, P, M, G)</option>
                  </select>
                </div>
                {categoryForm.sizeType !== 'none' && (
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">Tamanhos Disponíveis</label>
                    <input
                      type="text"
                      value={categoryForm.availableSizes.join(', ')}
                      onChange={event => setCategoryForm(prev => ({
                        ...prev,
                        availableSizes: event.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                      placeholder={categoryForm.sizeType === 'clothing' ? 'P, M, G, GG' : categoryForm.sizeType === 'shoes' ? '34, 35, 36, 37, 38, 39, 40' : 'Único, P, M, G'}
                    />
                    <p className="text-xs text-gray-500 mt-1">Separe os tamanhos por vírgula</p>
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all"
                  >
                    Salvar Categoria
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isOrderStatusModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Atualizar Status - {formatOrderId(orderStatusForm.orderId)}</h3>
              </div>
              <form onSubmit={handleOrderStatusSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Status</label>
                  <select
                    value={orderStatusForm.status}
                    onChange={event => setOrderStatusForm(prev => ({ ...prev, status: event.target.value as OrderStatus }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label || value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Observacoes</label>
                  <textarea
                    rows={3}
                    value={orderStatusForm.notes}
                    onChange={event => setOrderStatusForm(prev => ({ ...prev, notes: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all"
                  >
                    Atualizar Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOrderStatusModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isTrackingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Adicionar Rastreamento</h3>
              </div>
              <form onSubmit={handleTrackingSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Pedido</label>
                  <select
                    value={trackingForm.orderId}
                    onChange={event => setTrackingForm(prev => ({ ...prev, orderId: event.target.value }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Selecione um pedido</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        {formatOrderId(order.id)} - {order.customerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Transportadora</label>
                  <input
                    type="text"
                    value={trackingForm.carrier}
                    onChange={event => setTrackingForm(prev => ({ ...prev, carrier: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Codigo de Rastreamento</label>
                  <input
                    type="text"
                    value={trackingForm.code}
                    onChange={event => setTrackingForm(prev => ({ ...prev, code: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Status do Envio</label>
                  <select
                    value={trackingForm.status}
                    onChange={event => setTrackingForm(prev => ({ ...prev, status: event.target.value as TrackingStatus }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  >
                    <option value="posted">Postado</option>
                    <option value="in_transit">Em Transito</option>
                    <option value="out_for_delivery">Saiu para Entrega</option>
                    <option value="delivered">Entregue</option>
                    <option value="delayed">Atrasado</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all"
                  >
                    Salvar Rastreamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTrackingModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isInventoryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Movimentacao de Estoque</h3>
              </div>
              <form onSubmit={handleInventorySubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Produto</label>
                  <select
                    value={inventoryForm.productId}
                    onChange={event => setInventoryForm(prev => ({ ...prev, productId: event.target.value, selectedSize: '' }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Estoque: {product.stock || 0}){product.sizes ? ' - Com tamanhos' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {inventoryForm.productId && products.find(p => p.id === parseInt(inventoryForm.productId))?.sizes && (
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">Tamanho</label>
                    <select
                      value={inventoryForm.selectedSize}
                      onChange={event => setInventoryForm(prev => ({ ...prev, selectedSize: event.target.value }))}
                      className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Selecione um tamanho</option>
                      {products.find(p => p.id === parseInt(inventoryForm.productId))?.sizes?.split(',').map(size => {
                        const trimmedSize = size.trim();
                        const product = products.find(p => p.id === parseInt(inventoryForm.productId));
                        const sizeStock = product?.stockBySize?.[trimmedSize] || 0;
                        return (
                          <option key={trimmedSize} value={trimmedSize}>
                            {trimmedSize} (Estoque: {sizeStock})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                {inventoryForm.productId && products.find(p => p.id === parseInt(inventoryForm.productId))?.colors && ( // ERRCOM052: Show color if product has colors, regardless of sizes
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">Cor</label>
                    <select
                      value={inventoryForm.selectedColor}
                      onChange={event => setInventoryForm(prev => ({ ...prev, selectedColor: event.target.value }))}
                      className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Selecione uma cor</option>
                      {products.find(p => p.id === parseInt(inventoryForm.productId))?.colors?.split(',').map(color => {
                        const trimmedColor = color.trim();
                        const product = products.find(p => p.id === parseInt(inventoryForm.productId));
                        let combKey = '';
                        if (inventoryForm.selectedSize) combKey = `${inventoryForm.selectedSize}-${trimmedColor}`;
                        else if (product && !product.sizes) combKey = trimmedColor; // If product has colors but no sizes, key is just color

                        const colorStock = combKey ? product?.stockBySizeColor?.[combKey] || 0 : (product?.stock || 0); // Fallback to total stock if no size selected

                        return (
                          <option key={trimmedColor} value={trimmedColor}>
                            {trimmedColor} {combKey && `(Estoque: ${colorStock})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                {inventoryForm.productId && !products.find(p => p.id === parseInt(inventoryForm.productId))?.sizes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 Este produto não tem tamanhos configurados. Para adicionar tamanhos, edite o produto na aba "Produtos".
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Tipo</label>
                  <select
                    value={inventoryForm.type}
                    onChange={event => setInventoryForm(prev => ({ ...prev, type: event.target.value as 'in' | 'out' | 'adjustment' }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  >
                    <option value="in">Entrada</option>
                    <option value="out">Saida</option>
                    <option value="adjustment">Ajuste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryForm.quantity}
                    onChange={event => setInventoryForm(prev => ({ ...prev, quantity: parseInt(event.target.value, 10) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Motivo</label>
                  <input
                    type="text"
                    value={inventoryForm.reason}
                    onChange={event => setInventoryForm(prev => ({ ...prev, reason: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all"
                  >
                    Salvar Movimentacao
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInventoryModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">{editingExpenseId ? 'Editar Despesa' : 'Lancar Despesa'}</h3>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Descricao</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={event => setExpenseForm(prev => ({ ...prev, description: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Categoria</label>
                  <select
                    value={expenseForm.category}
                    onChange={event => setExpenseForm(prev => ({ ...prev, category: event.target.value as Expense['category'] }))}
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  >
                    <option value="fixed">Fixa</option>
                    <option value="variable">Variavel</option>
                    <option value="investment">Investimento</option>
                    <option value="emergency">Emergencial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={event => setExpenseForm(prev => ({ ...prev, amount: parseFloat(event.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={event => setExpenseForm(prev => ({ ...prev, date: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Observacoes</label>
                  <textarea
                    rows={3}
                    value={expenseForm.notes}
                    onChange={event => setExpenseForm(prev => ({ ...prev, notes: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl transition-all"
                  >
                    {editingExpenseId ? 'Salvar Alterações' : 'Lancar Despesa'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Modal de Checkout PDV */}
      <PdvCheckoutModal
        isOpen={isPdvCheckoutModalOpen}
        onClose={() => setIsPdvCheckoutModalOpen(false)}
        onClearCart={() => setPdvCart([])}
        cart={pdvCart}
        onSubmit={handlePdvCheckoutSubmit}
        isSubmitting={isSubmitting}
        editingOrder={editingOrder}
      />

      {/* Modal Gerenciador de Tamanhos */}
      {isSizeManagerModalOpen && sizeManagerProductId && (() => {
        const product = products.find(p => p.id === sizeManagerProductId);
        if (!product) return null;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900">Gerenciar Tamanhos - {product.name}</h3>
                  <button
                    onClick={() => setIsSizeManagerModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <SizeStockManager
                  sizes={product.sizes!.split(',').map(s => s.trim()).filter(s => s)}
                  colors={product.colors ? product.colors.split(',').map(c => c.trim()).filter(c => c) : undefined}
                  stockBySize={tempStockBySize}
                  stockBySizeColor={tempStockBySizeColor}
                  onChange={(data) => {
                    if (data.stockBySize) setTempStockBySize(data.stockBySize);
                    if (data.stockBySizeColor) setTempStockBySizeColor(data.stockBySizeColor);
                  }}
                />
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setIsSizeManagerModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const { saveProduct } = await import('../services/firebase');
                    let totalStock = 0;
                    if (product.colors && product.colors.trim()) {
                      totalStock = Object.values(tempStockBySizeColor).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                    } else {
                      totalStock = Object.values(tempStockBySize).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                    }

                    const updatedProduct = {
                      ...product,
                      stock: totalStock,
                      stockBySize: tempStockBySize,
                      stockBySizeColor: tempStockBySizeColor
                    };

                    try {
                      setIsSubmitting(true);
                      await saveProduct(updatedProduct);

                      const updatedProducts = products.map(p =>
                        p.id === sizeManagerProductId ? updatedProduct : p
                      );
                      onUpdateProducts(updatedProducts);
                      setIsSizeManagerModalOpen(false);
                    } catch (error) {
                      console.error(error);
                      window.alert('Erro ao salvar estoque');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <FiscalConfigModal
        isOpen={isFiscalConfigOpen}
        onClose={() => setIsFiscalConfigOpen(false)}
      />

      {/* Modal de Seleção de Produto PDV */}
      {
        pdvProductModal.isOpen && pdvProductModal.product && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-0 sm:p-4">
            <div className="bg-gradient-to-br from-[#0b1f4b] to-[#08122b] rounded-none sm:rounded-[32px] shadow-2xl border-none sm:border border-white/20 w-full max-w-lg h-full sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              {/* Header com Nome e Botão Fechar */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-white">{pdvProductModal.product.name}</h3>
                  <p className="text-white/60 text-xs">{pdvProductModal.product.category}</p>
                </div>
                <button
                  onClick={() => setPdvProductModal({ isOpen: false, product: null })}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Conteúdo com Scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div className="lg:bg-white/5 p-2 rounded-2xl border border-white/10 flex justify-center bg-white shadow-inner">
                  <img src={pdvProductModal.product.image} className="h-40 sm:h-48 w-auto object-contain" alt="" />
                </div>

                <div className="space-y-6">
                  {pdvProductModal.product.sizes && (
                    <div>
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Tamanho</label>
                      <div className="grid grid-cols-4 gap-2">
                        {pdvProductModal.product.sizes.split(',').map(size => {
                          const trimmedSize = size.trim();
                          let stock = 0;
                          if (pdvProductModal.product!.colors && pdvProductModal.product!.stockBySizeColor) {
                            pdvProductModal.product!.colors.split(',').forEach(c => {
                              stock += pdvProductModal.product!.stockBySizeColor?.[`${trimmedSize}-${c.trim()}`] || 0;
                            });
                          } else {
                            stock = pdvProductModal.product!.stockBySize?.[trimmedSize] || 0;
                          }
                          const isSelected = pdvModalSelection.size === trimmedSize;
                          const isAvailable = stock > 0;
                          return (
                            <button
                              key={trimmedSize}
                              onClick={() => isAvailable && setPdvModalSelection({ ...pdvModalSelection, size: trimmedSize })}
                              disabled={!isAvailable}
                              className={`py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${isSelected ? 'bg-versiory-coral text-white scale-105' : isAvailable ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20 line-through'}`}
                            >
                              {trimmedSize}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {pdvProductModal.product.colors && (
                    <div>
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Cor</label>
                      <div className="grid grid-cols-3 gap-2">
                        {pdvProductModal.product.colors.split(',').map(color => {
                          const trimmedColor = color.trim();
                          let colorStock = 0;
                          if (pdvModalSelection.size && pdvProductModal.product!.stockBySizeColor) {
                            colorStock = pdvProductModal.product!.stockBySizeColor[`${pdvModalSelection.size}-${trimmedColor}`] || 0;
                          } else if (pdvProductModal.product!.sizes && pdvProductModal.product!.stockBySizeColor) {
                            pdvProductModal.product!.sizes.split(',').forEach(s => {
                              colorStock += pdvProductModal.product!.stockBySizeColor?.[`${s.trim()}-${trimmedColor}`] || 0;
                            });
                          } else {
                            colorStock = pdvProductModal.product!.stock || 0;
                          }
                          const isAvailable = colorStock > 0;
                          const isSelected = pdvModalSelection.color === trimmedColor;
                          return (
                            <button
                              key={trimmedColor}
                              onClick={() => isAvailable && setPdvModalSelection({ ...pdvModalSelection, color: trimmedColor })}
                              disabled={!isAvailable}
                              className={`py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isSelected ? 'bg-versiory-coral text-white scale-105' : isAvailable ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20 line-through'}`}
                            >
                              <span className="truncate block px-1">{trimmedColor}</span>
                              {isAvailable && <span className="text-[9px] block opacity-60">({colorStock})</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Fixo */}
              <div className="p-6 border-t border-white/10 bg-white/5 shrink-0">
                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Preço Unitário</span>
                  <span className="text-3xl font-black text-white">{formatCurrency(pdvProductModal.product.price)}</span>
                </div>
                <button
                  onClick={() => {
                    const product = pdvProductModal.product!;
                    if (product.sizes && product.sizes.trim() !== '' && !pdvModalSelection.size) return alert('⚠️ Selecione um tamanho');
                    if (product.colors && !pdvModalSelection.color) return alert('⚠️ Selecione uma cor');
                    setSelectedSizes(prev => ({ ...prev, [product.id]: pdvModalSelection.size }));
                    addToPdvCart(product);
                    setPdvProductModal({ isOpen: false, product: null });
                    setPdvModalSelection({ size: '', color: '' });
                  }}
                  className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl shadow-versiory-coral/20 flex items-center justify-center gap-3"
                >
                  <span>🛒</span> Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ERRCOM046: Modal de Detalhe do Pedido */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setSelectedOrderDetail(null)}>
          <div className="bg-gradient-to-br from-[#0b1f4b] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-white">Pedido {formatOrderId(selectedOrderDetail.id)}</h3>
              <button onClick={() => setSelectedOrderDetail(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-sm text-slate-300 mb-4">
              <p><span className="font-bold text-white">Cliente:</span> {selectedOrderDetail.customerName}</p>
              <p><span className="font-bold text-white">E-mail:</span> {selectedOrderDetail.customerEmail}</p>
              {selectedOrderDetail.customerPhone && <p><span className="font-bold text-white">Telefone:</span> {selectedOrderDetail.customerPhone}</p>}
              {selectedOrderDetail.customerCpfCnpj && <p><span className="font-bold text-white">CPF/CNPJ:</span> {selectedOrderDetail.customerCpfCnpj}</p>}
              <p><span className="font-bold text-white">Data:</span> {formatDate(selectedOrderDetail.date)} {selectedOrderDetail.orderTime ? `às ${selectedOrderDetail.orderTime}` : ''}</p>
              <p><span className="font-bold text-white">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedOrderDetail.status]}`}>{STATUS_LABELS[selectedOrderDetail.status]}</span></p>
              <p><span className="font-bold text-white">Canal:</span> {selectedOrderDetail.salesChannel === 'physical' ? 'PDV' : 'Online'}</p>
              {selectedOrderDetail.address && <p><span className="font-bold text-white">Endereço:</span> {selectedOrderDetail.address}</p>}
              {selectedOrderDetail.notes && <p><span className="font-bold text-white">Observação:</span> {selectedOrderDetail.notes}</p>}

              <div className="pt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    let phone = selectedOrderDetail.customerPhone || '';
                    
                    if (!phone && selectedOrderDetail.customerEmail?.includes('@pdv.local')) {
                      phone = selectedOrderDetail.customerEmail.replace('@pdv.local', '');
                    }

                    const cleanPhone = phone.replace(/\D/g, '');
                    if (!cleanPhone) {
                      window.alert('Telefone do cliente não disponível.');
                      return;
                    }

                    const message = `Olá ${selectedOrderDetail.customerName}, o status do seu pedido ${formatOrderId(selectedOrderDetail.id)} foi atualizado para: ${STATUS_LABELS[selectedOrderDetail.status]}. Notas: ${selectedOrderDetail.notes || 'N/A'}`;
                    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Notificar Cliente
                </button>

                <button
                  onClick={() => handleEditOrder(selectedOrderDetail)}
                  className="bg-versiory-ink hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  ✏️ Editar Pedido
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Deseja cancelar este pedido?')) {
                      orderStatusForm.orderId = selectedOrderDetail.id;
                      orderStatusForm.status = 'cancelled';
                      handleOrderStatusSubmit(new Event('submit') as any);
                      setSelectedOrderDetail(null);
                    }
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  🗑️ Cancelar
                </button>
              </div>
            </div>
            <h4 className="font-bold text-white mb-2">Itens</h4>
            <div className="space-y-2 mb-4">
              {selectedOrderDetail.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.name || `Produto #${item.productId}`}</p>
                    {item.selectedSize && <p className="text-slate-400 text-xs">Tamanho: {item.selectedSize}</p>}
                    {item.selectedColor && <p className="text-slate-400 text-xs">Cor: {item.selectedColor}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-white">{item.quantity}x {formatCurrency(item.price)}</p>
                    <p className="text-versiory-coral font-bold">{formatCurrency(item.quantity * item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white font-bold">Total</span>
              <span className="text-2xl font-black text-versiory-coral">{formatCurrency(selectedOrderDetail.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ERRCOM022: Modal de Histórico do Cliente */}
      {customerOrderHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setCustomerOrderHistory(null)}>
          <div className="bg-gradient-to-br from-[#0b1f4b] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-white">Histórico: {customerOrderHistory.customer.name}</h3>
              <button onClick={() => setCustomerOrderHistory(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            {customerOrderHistory.orders.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-3">
                {customerOrderHistory.orders.map(o => (
                  <div key={o.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold">{formatOrderId(o.id)}</p>
                      <p className="text-slate-400 text-xs">{formatDate(o.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-versiory-coral font-black">{formatCurrency(o.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ERRCOM029/030: Modal de Vendas por Forma de Pagamento */}
      {paymentBreakdownModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setPaymentBreakdownModal(null)}>
          <div className="bg-gradient-to-br from-[#0b1f4b] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-white">Vendas {paymentBreakdownModal.channel === 'pdv' ? 'PDV' : 'Online'} por Pagamento</h3>
              <button onClick={() => setPaymentBreakdownModal(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            {(() => {
              const byMethod: Record<string, number> = {};
              paymentBreakdownModal.orders.forEach(o => {
                const method = (o as any).paymentMethod || 'Não informado';
                byMethod[method] = (byMethod[method] || 0) + o.total;
              });
              return (
                <div className="space-y-3">
                  {Object.entries(byMethod).map(([method, total]) => (
                    <div key={method} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-white font-medium">{method}</span>
                      <span className="text-versiory-coral font-black">{formatCurrency(total)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-white font-black">{formatCurrency(paymentBreakdownModal.orders.reduce((s, o) => s + o.total, 0))}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal de Detalhamento de Vendas (Drill-down) */}
      {isDrillDownModalOpen && drillDownData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-gradient-to-br from-[#0b1f4b] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-white">Pedidos do Dia {drillDownData.date}</h3>
                <p className="text-white/60 text-sm">{drillDownData.orderIds.length} pedidos encontrados</p>
              </div>
              <button 
                onClick={() => setIsDrillDownModalOpen(false)} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10">
                <div className="col-span-1">ID</div>
                <div className="col-span-1">Origem</div>
                <div className="col-span-2">Cliente</div>
                <div className="col-span-1 text-right">Total</div>
              </div>
              
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {drillDownData.orderIds.length > 0 ? (
                  drillDownData.orderIds.map(id => {
                    const order = orders.find(o => o.id === id);
                    if (!order) return null;
                    
                    const hasService = order.items?.some(item => {
                      const p = products.find(prod => prod.id === item.productId);
                      return p?.category === 'Serviços';
                    });

                    return (
                      <div 
                        key={id} 
                        onClick={() => {
                          setSelectedOrderDetail(order);
                          setIsDrillDownModalOpen(false);
                        }}
                        className="grid grid-cols-5 gap-4 items-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all cursor-pointer group"
                      >
                        <div className="col-span-1 font-black text-blue-400 group-hover:text-blue-300">
                          {formatOrderId(order.id)}
                        </div>
                        <div className="col-span-1">
                          {order.isBudget ? (
                            <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-bold border border-purple-500/30">Orçamento</span>
                          ) : order.salesChannel === 'physical' ? (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-bold border border-blue-500/30">Loja/PDV</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold border border-emerald-500/30">Site</span>
                          )}
                          {hasService && (
                            <span className="ml-1 text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-bold border border-orange-500/30">🛠️</span>
                          )}
                        </div>
                        <div className="col-span-2 text-white font-medium truncate text-sm">
                          {order.customerName}
                        </div>
                        <div className="col-span-1 text-right text-versiory-coral font-black">
                          {formatCurrency(order.total)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-slate-500 italic">Nenhum pedido encontrado para esta data.</p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-[10px] text-slate-500 font-medium">Clique em um pedido para ver os detalhes completos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Caixa (Abertura/Fechamento) */}
      {isCashRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
          <div className="bg-gradient-to-br from-[#0b1f4b] via-[#0a1b3d] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 p-8 max-w-sm w-full">
            <h3 className="text-2xl font-black text-white mb-6">
              {cashRegister.isOpen ? 'Fechar Caixa' : 'Abrir Caixa'}
            </h3>

            {!cashRegister.isOpen ? (
              <div className="space-y-4">
                <p className="text-white/60 text-sm">Informe o valor de abertura (fundo de caixa):</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashRegisterForm.amount}
                    onChange={e => setCashRegisterForm({ amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/20 text-white rounded-xl pl-12 pr-4 py-4 text-xl font-bold focus:ring-2 focus:ring-versiory-coral outline-none"
                    placeholder="0,00"
                  />
                </div>
                <button
                  onClick={() => {
                    setCashRegister({
                      isOpen: true,
                      openingAmount: cashRegisterForm.amount,
                      currentBalance: cashRegisterForm.amount,
                      openedAt: new Date().toISOString()
                    });
                    setIsCashRegisterModalOpen(false);
                    setCashRegisterForm({ amount: 0 });
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl"
                >
                  ABRIR CAIXA AGORA
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCashMovementForm({ type: 'withdrawal', amount: 0, reason: '' });
                      setIsCashMovementModalOpen(true);
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-all"
                  >
                    💸 Sangria
                  </button>
                  <button
                    onClick={() => {
                      setCashMovementForm({ type: 'deposit', amount: 0, reason: '' });
                      setIsCashMovementModalOpen(true);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all"
                  >
                    💰 Suprimento
                  </button>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Abertura:</span>
                    <span className="text-white font-bold">{formatCurrency(cashRegister.openingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Vendas no período:</span>
                    <span className="text-white font-bold">{formatCurrency(cashRegister.currentBalance - cashRegister.openingAmount)}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-sm font-black text-white uppercase tracking-widest">Saldo Final:</span>
                    <span className="text-2xl font-black text-green-400">{formatCurrency(cashRegister.currentBalance)}</span>
                  </div>
                </div>

                <p className="text-red-400 text-xs font-bold text-center">
                  ⚠️ Ao fechar o caixa, você não poderá realizar novas vendas no PDV até abri-lo novamente.
                </p>

                <button
                  onClick={handleCashRegisterClose}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl"
                >
                  FECHAR CAIXA AGORA
                </button>
              </div>
            )}

            <button
              onClick={() => setIsCashRegisterModalOpen(false)}
              className="w-full mt-4 text-white/40 hover:text-white font-bold text-sm transition-colors py-2"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* Modal de Movimentação de Caixa */}
      {isCashMovementModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
          <div className="bg-gradient-to-br from-[#0b1f4b] via-[#0a1b3d] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 p-8 max-w-sm w-full">
            <h3 className="text-2xl font-black text-white mb-6">
              {cashMovementForm.type === 'withdrawal' ? 'Sangria' : 'Suprimento'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-white mb-2">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashMovementForm.amount}
                    onChange={e => setCashMovementForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/20 text-white rounded-xl pl-12 pr-4 py-4 text-xl font-bold focus:ring-2 focus:ring-versiory-coral outline-none"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-white mb-2">Motivo</label>
                <textarea
                  value={cashMovementForm.reason}
                  onChange={e => setCashMovementForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-versiory-coral outline-none resize-none"
                  rows={3}
                  placeholder="Informe o motivo..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCashMovementModalOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCashMovement}
                  className={`flex-1 px-6 py-3 rounded-xl font-black text-lg transition-all shadow-xl ${cashMovementForm.type === 'withdrawal'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                >
                  {cashMovementForm.type === 'withdrawal' ? '💸 Sangria' : '💰 Suprimento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatório de Caixa */}
      {isCashReportOpen && cashRegisterHistory.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-500" onClick={() => {
            const last = cashRegisterHistory[cashRegisterHistory.length - 1];
            if (last?.id?.startsWith('PARTIAL-')) {
              setCashRegisterHistory(prev => prev.filter(h => h.id !== last.id));
            }
            setIsCashReportOpen(false);
          }} />

          {/* Modal Container with Glassmorphism */}
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#0b1f4b]/95 via-[#0a1b3d]/98 to-[#08122b] backdrop-blur-2xl rounded-[40px] shadow-[0_0_100px_rgba(37,99,235,0.2)] border border-white/20 max-h-[92vh] overflow-y-auto custom-scrollbar transform transition-all animate-in fade-in zoom-in duration-300">
            {/* Animated Background Glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-versiory-coral/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="p-10 pb-6 flex justify-between items-start sticky top-0 bg-transparent backdrop-blur-lg z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-blue-500/20 text-blue-400 p-2 rounded-xl border border-blue-500/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {cashRegisterHistory[cashRegisterHistory.length - 1]?.id?.startsWith('PARTIAL-') ? 'Leitura X' : 'Fechamento de Caixa'}
                  </h3>
                </div>
                <p className="text-slate-400 font-bold text-sm ml-11 italic opacity-80">
                  ID: <span className="text-blue-400 font-black">#{cashRegisterHistory[cashRegisterHistory.length - 1]?.id?.slice(-8)}</span>
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handlePrintCashReport(cashRegisterHistory[cashRegisterHistory.length - 1])}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
                >
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
                <button
                  onClick={() => {
                    const last = cashRegisterHistory[cashRegisterHistory.length - 1];
                    if (last?.id?.startsWith('PARTIAL-')) {
                      setCashRegisterHistory(prev => prev.filter(h => h.id !== last.id));
                    }
                    setIsCashReportOpen(false);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-10 pb-12 space-y-8">
              {cashRegisterHistory.slice(-1).map(register => (
                <div key={register.id} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                  {/* Info Grid - Modern Glass Style */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Abertura</span>
                      <p className="text-white font-black text-sm">{new Date(register.openedAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Fechamento</span>
                      <p className="text-white font-black text-sm">
                        {register.closedAt ? new Date(register.closedAt).toLocaleString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Operador</span>
                      <p className="text-white font-black text-sm">{register.openedBy}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Status Atual</span>
                      <p className={`font-black text-sm uppercase flex items-center gap-1.5 ${register.status === 'open' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${register.status === 'open' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                        {register.status === 'open' ? 'Aberto' : 'Fechado'}
                      </p>
                    </div>
                  </div>

                  {/* Main Metrics Card Container */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Abertura */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-blue-600/20 to-blue-900/40 p-6 rounded-[32px] border border-blue-500/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                      <span className="text-blue-400 font-black text-[11px] uppercase tracking-widest block mb-1">Fundo de Caixa</span>
                      <span className="text-white font-black text-3xl tracking-tighter">{formatCurrency(register.initialAmount)}</span>
                      <div className="mt-4 flex items-center gap-2 text-blue-300/60 text-[10px] font-bold">
                        <span>💰 Capital Inicial</span>
                      </div>
                    </div>

                    {/* Vendas */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-600/20 to-emerald-900/40 p-6 rounded-[32px] border border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>
                      <span className="text-emerald-400 font-black text-[11px] uppercase tracking-widest block mb-1">Total em Vendas</span>
                      <span className="text-white font-black text-3xl tracking-tighter">{formatCurrency(register.totalSales)}</span>
                      <div className="mt-4 flex items-center gap-2 text-emerald-300/60 text-[10px] font-bold">
                        <span>📈 {register.totalOrders} Pedidos</span>
                      </div>
                    </div>

                    {/* Apurado */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-purple-600/20 to-purple-900/40 p-6 rounded-[32px] border border-purple-500/30 hover:shadow-[0_0_30px_rgba(147,51,234,0.1)] transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all"></div>
                      <span className="text-purple-400 font-black text-[11px] uppercase tracking-widest block mb-1">Saldo Estimado</span>
                      <span className="text-white font-black text-3xl tracking-tighter">{formatCurrency(register.expectedAmount)}</span>
                      <div className="mt-4 flex items-center gap-2 text-purple-300/60 text-[10px] font-bold">
                        <span>💵 Disponível em Caixa</span>
                      </div>
                    </div>
                  </div>

                  {/* Movements Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sangrias */}
                    <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-white text-lg flex items-center gap-2">
                          <span className="p-2 bg-orange-500/20 rounded-xl text-orange-400">💸</span>
                          Sangrias
                        </h4>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 border border-white/10">
                          {register.withdrawals.length} itens
                        </span>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {register.withdrawals.length > 0 ? register.withdrawals.map((withdrawal: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-red-500/5 hover:bg-red-500/10 p-4 rounded-2xl border border-red-500/10 transition-colors group">
                            <div className="flex flex-col">
                              <span className="text-red-300 text-xs font-bold">{withdrawal.reason}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{new Date(withdrawal.timestamp).toLocaleTimeString('pt-BR')}</span>
                            </div>
                            <span className="text-red-400 font-black text-base group-hover:scale-110 transition-transform">-{formatCurrency(withdrawal.amount)}</span>
                          </div>
                        )) : (
                          <p className="text-slate-600 text-xs text-center py-4 italic">Nenhuma sangria registrada.</p>
                        )}
                      </div>
                    </div>

                    {/* Suprimentos */}
                    <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-white text-lg flex items-center gap-2">
                          <span className="p-2 bg-blue-500/20 rounded-xl text-blue-400">💰</span>
                          Suprimentos
                        </h4>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400 border border-white/10">
                          {register.deposits.length} itens
                        </span>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {register.deposits.length > 0 ? register.deposits.map((deposit: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-blue-500/5 hover:bg-blue-500/10 p-4 rounded-2xl border border-blue-500/10 transition-colors group">
                            <div className="flex flex-col">
                              <span className="text-blue-300 text-xs font-bold">{deposit.reason}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{new Date(deposit.timestamp).toLocaleTimeString('pt-BR')}</span>
                            </div>
                            <span className="text-blue-400 font-black text-base group-hover:scale-110 transition-transform">+{formatCurrency(deposit.amount)}</span>
                          </div>
                        )) : (
                          <p className="text-slate-600 text-xs text-center py-4 italic">Nenhum suprimento registrado.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods Section */}
                  <div className="bg-white/5 rounded-[40px] border border-white/10 p-8 shadow-inner">
                    <h4 className="font-black text-white text-xl mb-8 flex items-center gap-2">
                      <span className="p-2 bg-versiory-coral/20 rounded-2xl text-versiory-coral">📊</span>
                      Divisão por Forma de Pagamento
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-default">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block mb-1">Dinheiro</span>
                        <p className="text-white font-black text-xl tracking-tighter">{formatCurrency(register.salesByPayment.dinheiro)} <span className="text-[10px] text-slate-400 font-bold opacity-70">({register.salesByPaymentCount?.dinheiro || 0})</span></p>
                      </div>
                      <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-default">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block mb-1">PIX</span>
                        <p className="text-white font-black text-xl tracking-tighter">{formatCurrency(register.salesByPayment.pix)} <span className="text-[10px] text-slate-400 font-bold opacity-70">({register.salesByPaymentCount?.pix || 0})</span></p>
                      </div>
                      <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-default">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block mb-1">Débito</span>
                        <p className="text-white font-black text-xl tracking-tighter">{formatCurrency(register.salesByPayment.debito)} <span className="text-[10px] text-slate-400 font-bold opacity-70">({register.salesByPaymentCount?.debito || 0})</span></p>
                      </div>
                      <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-all cursor-default">
                        <span className="text-slate-500 font-bold text-[10px] uppercase block mb-1">Crédito</span>
                        <p className="text-white font-black text-xl tracking-tighter">{formatCurrency(register.salesByPayment.credito)} <span className="text-[10px] text-slate-400 font-bold opacity-70">({register.salesByPaymentCount?.credito || 0})</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Final Reconciliation Section (Only for closed reports or if difference is set) */}
                  {(register.status === 'closed' || register.difference !== 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-black/40 rounded-[40px] border border-white/10">
                      <div className="flex justify-between items-center p-6 bg-white/5 rounded-[32px] border border-white/10">
                        <div className="flex flex-col">
                          <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Informado</span>
                          <span className="text-white font-black text-2xl tracking-tighter">{formatCurrency(register.actualAmount)}</span>
                        </div>
                        <div className={`p-4 rounded-3xl font-black text-sm shadow-xl flex flex-col items-center ${register.difference === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          register.difference < 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                            'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                          <span className="text-[10px] opacity-70 mb-0.5">ESTADO</span>
                          {register.difference === 0 ? 'COMPLETO' : register.difference < 0 ? 'QUEBRA' : 'SOBRA'}
                        </div>
                      </div>

                      <div className={`flex flex-col justify-center items-center p-6 rounded-[32px] border transition-all ${register.difference === 0 ? 'bg-emerald-500/10 border-emerald-500/20' :
                        register.difference < 0 ? 'bg-red-500/10 border-red-500/20' :
                          'bg-blue-500/10 border-blue-500/20'
                        }`}>
                        <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Divergência Total</span>
                        <span className={`text-3xl font-black tracking-tighter ${register.difference === 0 ? 'text-emerald-400' :
                          register.difference < 0 ? 'text-red-400' : 'text-blue-400'
                          }`}>
                          {register.difference === 0 ? 'R$ 0,00' : formatCurrency(register.difference)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ERRCOM051: Modal de Relatório de Caixa */}
      {isCashReportOpen && cashRegisterHistory.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-500" onClick={() => {
            const last = cashRegisterHistory[cashRegisterHistory.length - 1];
            if (last?.id?.startsWith('PARTIAL-')) {
              setCashRegisterHistory(prev => prev.filter(h => h.id !== last.id));
            }
            setIsCashReportOpen(false);
          }} />
          <CashRegisterReport
            cashRegister={cashRegisterHistory[cashRegisterHistory.length - 1]}
            onClose={() => setIsCashReportOpen(false)}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-versiory-ink to-slate-900 text-white py-8 mt-12 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <p className="text-white/80 text-sm font-medium">Área restrita. Acesso exclusivo para administradores. Todas as ações são monitoradas.</p>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-medium transition-all mt-2"
          >
            Sair
          </button>
          <p className="text-white/60 text-xs mt-2">© {new Date().getFullYear()} Versiory Store. Todos os direitos reservados. | <span className="font-bold">Versão 2.4.5 (Estável)</span></p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
