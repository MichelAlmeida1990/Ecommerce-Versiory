import React, { useMemo, useState } from 'react';
import {
  Product,
  CategoryItem,
  Order,
  Customer,
  TrackingItem,
  InventoryMovement,
  Expense
} from '../types';
import PdvCheckoutModal from './PdvCheckoutModal';
import FiscalConfigModal from './FiscalConfigModal';
import FiscalFields from './FiscalFields';

interface AdminDashboardProps {
  products: Product[];
  categories: CategoryItem[];
  orders: Order[];
  customers: Customer[];
  tracking: TrackingItem[];
  inventoryMovements: InventoryMovement[];
  expenses: Expense[];
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
  cancelled: 'bg-slate-800 text-white'
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Aguardando Pagamento',
  paid: 'Pagamento Efetuado',
  processing: 'Em Processamento',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
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

const BASE_CATEGORIES = ['Eletrônicos', 'Moda', 'Casa', 'Esportes'];

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR');

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  orders,
  customers,
  tracking,
  inventoryMovements,
  expenses,
  onLogout,
  onUpdateProducts,
  onUpdateCategories,
  onUpdateOrders,
  onUpdateCustomers,
  onUpdateTracking,
  onUpdateInventoryMovements,
  onUpdateExpenses
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [isFiscalConfigOpen, setIsFiscalConfigOpen] = useState(false);
  
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
    description: '',
    rating: 0,
    reviews: 0,
    stock: 0,
    sizes: '',
    ncm: '',
    cfop: '5102',
    cst: '00',
    origem: 0,
    unidade: 'UN',
    peso: 0
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // PDV State
  const [pdvCart, setPdvCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [pdvSearch, setPdvSearch] = useState('');
  const [isPdvCheckoutModalOpen, setIsPdvCheckoutModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [orderStatusForm, setOrderStatusForm] = useState({
    orderId: '',
    status: 'pending' as OrderStatus,
    notes: ''
  });

  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
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
    reason: ''
  });

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'fixed' as Expense['category'],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categoryOptions = useMemo(() => {
    const productCategories = products.map(product => product.category).filter(Boolean);
    const storedCategories = categories.map(cat => cat.name);
    const merged = [...BASE_CATEGORIES, ...storedCategories, ...productCategories];
    return Array.from(new Set(merged));
  }, [categories, products]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalRevenue
    };
  }, [products, orders, customers]);

  const recentOrders = useMemo(() =>
    [...orders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter(order => order.status === orderFilter);
  }, [orders, orderFilter]);

  const inventoryStats = useMemo(() => {
    const totalStockValue = products.reduce(
      (sum, product) => sum + (product.price * (product.stock || 0)),
      0
    );
    const lowStockItems = products.filter(product => {
      const stock = product.stock || 0;
      return stock > 0 && stock < 10;
    }).length;
    const outOfStockItems = products.filter(product => (product.stock || 0) === 0).length;
    const totalItemsInStock = products.reduce(
      (sum, product) => sum + (product.stock || 0),
      0
    );

    return { totalStockValue, lowStockItems, outOfStockItems, totalItemsInStock };
  }, [products]);

  const filteredInventoryProducts = useMemo(() => {
    const search = inventorySearch.toLowerCase();
    return products.filter(product => {
      const stock = product.stock || 0;
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      let matchesFilter = true;
      if (stockFilter === 'low') {
        matchesFilter = stock > 0 && stock < 10;
      } else if (stockFilter === 'out') {
        matchesFilter = stock === 0;
      } else if (stockFilter === 'normal') {
        matchesFilter = stock >= 10;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, inventorySearch, stockFilter]);

  const financialStats = useMemo(() => {
    const totalRevenue = orders
      .filter(order => ['paid', 'processing', 'shipped', 'delivered'].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalExpenses, netProfit, profitMargin };
  }, [orders, expenses]);

  const recentTransactions = useMemo(() => {
    const revenue = orders.map(order => ({
      id: order.id,
      description: `Venda - ${order.customerName}`,
      amount: order.total,
      type: 'revenue' as const,
      date: order.date,
      category: 'Venda'
    }));

    const expenseItems = expenses.map(expense => ({
      id: String(expense.id),
      description: expense.description,
      amount: -expense.amount,
      type: 'expense' as const,
      date: expense.date,
      category: expense.category
    }));

    return [...revenue, ...expenseItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [orders, expenses]);

  const lowStockProducts = useMemo(() =>
    products.filter(product => {
      const stock = product.stock || 0;
      return stock > 0 && stock < 10;
    }),
    [products]
  );

  const resetProductForm = () => {
    setProductForm({
      name: '',
      price: 0,
      category: 'Eletrônicos',
      image: '',
      description: '',
      rating: 0,
      reviews: 0,
      stock: 0,
      sizes: '',
      ncm: '',
      cfop: '5102',
      cst: '00',
      origem: 0,
      unidade: 'UN',
      peso: 0
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

      const payload: Product = {
        ...(productForm as Product),
        category: trimmedCategory,
        stock: productForm.stock || 0,
        sizes: productForm.sizes || '',
        ncm: productForm.ncm || '',
        cfop: productForm.cfop || '5102',
        cst: productForm.cst || '00',
        origem: productForm.origem ?? 0,
        cest: productForm.cest || '',
        unidade: productForm.unidade || 'UN',
        peso: productForm.peso || 0
      };

      if (!editingProductId) {
        payload.id = Math.max(0, ...products.map(product => product.id)) + 1;
      } else {
        payload.id = editingProductId;
      }

      const savedProduct = await saveProduct(payload, payload.image);

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
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
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

  const openCategoryModal = () => {
    setCategoryForm({ name: '', description: '' });
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
      const newCategory: CategoryItem = {
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        description: categoryForm.description.trim()
      };

      await saveCategory(newCategory);
      onUpdateCategories([...categories, newCategory]);
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar categoria.");
    }
  };

  const handleCategoryDelete = async (categoryId: string) => {
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

      const updatedOrder = { ...orderToUpdate, status: orderStatusForm.status, notes: orderStatusForm.notes };
      await saveOrder(updatedOrder);

      const updatedOrders = orders.map(order =>
        order.id === orderStatusForm.orderId ? updatedOrder : order
      );
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
      reason: ''
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

    const currentStock = product.stock || 0;
    let newStock = currentStock;

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

      const updatedProduct = { ...product, stock: newStock };

      await Promise.all([
        saveInventoryMovement(movement),
        saveProduct(updatedProduct)
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

  const addToPdvCart = (product: Product) => {
    if ((product.stock || 0) <= 0) {
      window.alert('Produto sem estoque!');
      return;
    }

    setPdvCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.stock || 0)) {
          window.alert('Quantidade maxima em estoque atingida.');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromPdvCart = (productId: number) => {
    setPdvCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updatePdvItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromPdvCart(productId);
      return;
    }

    // Check against stock
    const productItem = pdvCart.find(item => item.product.id === productId);
    if (productItem && newQuantity > (productItem.product.stock || 0)) {
      window.alert('Quantidade maxima em estoque atingida.');
      return;
    }

    setPdvCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handlePdvCheckout = () => {
    if (pdvCart.length === 0) {
      window.alert('O carrinho está vazio.');
      return;
    }
    setIsPdvCheckoutModalOpen(true);
  };

  const handlePdvCheckoutSubmit = async (customerData: { name: string; phone: string; cpf: string }, order: Order) => {
    setIsSubmitting(true);
    try {
      const { saveOrder, saveProduct, saveCustomer, getCustomers } = await import('../services/firebase');
      const customers = await getCustomers();
      let customer = customers.find(c => c.phone === customerData.phone && customerData.phone);
      
      if (customer) {
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalSpent = (customer.totalSpent || 0) + order.total;
        customer.cpfCnpj = customerData.cpf || customer.cpfCnpj;
        order.customerId = customer.id;
        await saveCustomer(customer);
      } else {
        const newCustomer: Customer = {
          id: Date.now(),
          name: customerData.name,
          email: order.customerEmail,
          phone: customerData.phone,
          cpfCnpj: customerData.cpf,
          addresses: [],
          totalOrders: 1,
          totalSpent: order.total,
          createdAt: new Date().toISOString(),
          orderHistory: []
        };
        order.customerId = newCustomer.id;
        await saveCustomer(newCustomer);
        onUpdateCustomers([...customers, newCustomer]);
      }

      await saveOrder(order);
      const updatedProducts = [...products];
      for (const item of pdvCart) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
        if (productIndex !== -1) {
          const p = updatedProducts[productIndex];
          const newStock = Math.max(0, (p.stock || 0) - item.quantity);
          const saved = await saveProduct({ ...p, stock: newStock });
          updatedProducts[productIndex] = saved;
        }
      }
      onUpdateOrders([...orders, order]);
      onUpdateProducts(updatedProducts);
      setPdvCart([]);
      setIsPdvCheckoutModalOpen(false);
      if (!order.emitNF) {
        window.alert(`Venda finalizada!\n\nCliente: ${customerData.name}\nTotal: ${formatCurrency(order.total)}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      window.alert('Erro ao finalizar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openExpenseModal = () => {
    setExpenseForm({
      description: '',
      category: 'fixed',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
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

      const newExpense: Expense = {
        id: Date.now(),
        description: expenseForm.description,
        category: expenseForm.category,
        amount: expenseForm.amount,
        date: expenseForm.date,
        notes: expenseForm.notes,
        user: 'Admin'
      };

      await saveExpense(newExpense);
      onUpdateExpenses([...expenses, newExpense]);
      setIsExpenseModalOpen(false);
    } catch (error) {
      console.error(error);
      window.alert("Erro ao salvar despesa");
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
    const report = products.map(product => ({
      ID: product.id,
      Produto: product.name,
      Categoria: product.category,
      'Estoque Atual': product.stock || 0,
      'Estoque Minimo': 10,
      'Valor Unitario': product.price.toFixed(2),
      'Valor Total': ((product.stock || 0) * product.price).toFixed(2)
    }));
    downloadCsv(`relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`, report);
  };

  const generateFinancialReport = () => {
    const report = [
      ...orders.map(order => ({
        Data: formatDate(order.date),
        Tipo: 'Receita',
        Descricao: `Venda - ${order.customerName}`,
        Categoria: 'Venda',
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-versiory-coral rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36 20 H64 L50 43 L36 20 Z" fill="white" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black">Painel Administrativo</h1>
                <p className="text-gray-400 text-sm">Versiory Store</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-medium transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 mb-6">
          <div className="flex flex-wrap gap-1 p-2">
            {(
              [
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
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{stats.totalProducts}</div>
                <div className="text-slate-100 font-medium text-sm">Total Produtos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{stats.totalOrders}</div>
                <div className="text-slate-100 font-medium text-sm">Total Pedidos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-slate-100 font-medium text-sm">Faturamento</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                <div className="text-2xl font-bold text-slate-100">{stats.totalCustomers}</div>
                <div className="text-slate-100 font-medium text-sm">Clientes</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4">
              <h3 className="text-lg font-bold text-white mb-4">Pedidos Recentes</h3>
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/15 rounded-xl">
                    <div>
                      <div className="font-medium text-white">
                        {order.id} - {order.customerName}
                      </div>
                      <div className="text-sm text-slate-100">
                        {formatDate(order.date)} - {formatCurrency(order.total)}
                      </div>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-sm text-slate-200">Nenhum pedido recente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pdv' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Product Search & List */}
          <div className="flex-1 space-y-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Adicionar Produtos</h2>
                <input
                  type="text"
                  value={pdvSearch}
                  onChange={e => setPdvSearch(e.target.value)}
                  placeholder="Buscar por nome ou categoria..."
                  className="px-4 py-2 border border-white/20 bg-white/5 backdrop-blur-md text-white rounded-lg focus:ring-2 focus:ring-versiory-coral outline-none w-64"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {products
                  .filter(p => p.name.toLowerCase().includes(pdvSearch.toLowerCase()) || p.category.toLowerCase().includes(pdvSearch.toLowerCase()))
                  .map(product => (
                    <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover bg-white" />
                        <div>
                          <h4 className="font-bold text-white text-sm line-clamp-2">{product.name}</h4>
                          <span className="text-slate-300 text-xs">{product.category}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <p className="font-black text-white text-lg">{formatCurrency(product.price)}</p>
                          <p className={`text-xs ${product.stock && product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {product.stock || 0} em estoque
                          </p>
                        </div>
                        <button
                          onClick={() => addToPdvCart(product)}
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
          <div className="w-full lg:w-[400px] bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 flex flex-col h-[calc(100vh-200px)] sticky top-6">
            <h2 className="text-xl font-black text-white mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <span>Carrinho (PDV)</span>
              <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full text-slate-200">
                {pdvCart.reduce((sum, item) => sum + item.quantity, 0)} itens
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar mb-6">
              {pdvCart.map(item => (
                <div key={item.product.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <p className="text-sm font-bold text-white line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.product.price)} / un</p>
                    </div>
                    <button onClick={() => removeFromPdvCart(item.product.id)} className="text-slate-400 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                      <button
                        onClick={() => updatePdvItemQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-md transition-colors"
                      >-</button>
                      <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updatePdvItemQuantity(item.product.id, item.quantity + 1)}
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
                disabled={pdvCart.length === 0 || isSubmitting}
                className="w-full bg-versiory-coral hover:bg-[#ff8368] disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-versiory-coral/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Finalizando...
                  </>
                ) : (
                  'Finalizar Venda (PDV)'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white">Gerenciar Produtos</h2>
            <button
              onClick={() => openProductModal()}
              className="bg-versiory-coral text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg"
            >
              + Novo Produto
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/15 backdrop-blur-md border-b border-white/25">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">Preco</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">Avaliacao</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-300 uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                        #{product.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-100">{product.name}</div>
                            <div className="text-xs text-slate-300 line-clamp-1">{product.description}</div>
                            {product.sizes && (
                              <div className="text-xs text-slate-200">Tamanhos: {product.sizes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-white/5 border border-white/15 text-slate-100">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                        {product.stock ?? 0} unidades
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-slate-100">{product.rating}</span>
                          <span className="text-yellow-400 ml-1">★</span>
                          <span className="text-xs text-slate-300 ml-1">({product.reviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => openProductModal(product)}
                            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleProductDelete(product.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white">Gerenciar Categorias</h2>
            <button
              onClick={openCategoryModal}
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
                  <button
                    onClick={() => handleCategoryDelete(category.id)}
                    className="text-slate-1000 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-slate-300 text-sm mb-4">{category.description}</p>
                <div className="text-sm text-slate-400">
                  <span className="font-semibold">
                    {products.filter(product => product.category === category.name).length}
                  </span>{' '}
                  produtos
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white">Gerenciar Pedidos</h2>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadNFXml}
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

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/15 backdrop-blur-md border-b border-white/25">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Pedido</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{order.id}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openOrderStatusModal(order)}
                          className="bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                        >
                          Atualizar Status
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

      {activeTab === 'customers' && (
        <div>
          <h2 className="text-xl font-black text-white mb-6">Gerenciar Clientes</h2>
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
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Total Gasto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {customers.map(customer => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">#{customer.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{customer.totalOrders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
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

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/15 backdrop-blur-md border-b border-white/25">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Minimo</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Valor Unit.</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-100 uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredInventoryProducts.map(product => {
                    const stock = product.stock || 0;
                    const totalValue = stock * product.price;
                    let statusLabel = 'Normal';
                    let statusClass = 'bg-green-100 text-green-800';
                    if (stock === 0) {
                      statusLabel = 'Esgotado';
                      statusClass = 'bg-red-100 text-red-800';
                    } else if (stock < 10) {
                      statusLabel = 'Estoque Baixo';
                      statusClass = 'bg-yellow-100 text-yellow-800';
                    }

                    return (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">#{product.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover mr-3" />
                            <div>
                              <div className="text-sm font-medium text-slate-100">{product.name}</div>
                              <div className="text-xs text-slate-200">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">10</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-100">{formatCurrency(totalValue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openInventoryModal(product.id)}
                            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-3 py-2 rounded-xl font-medium transition-all"
                          >
                            Movimentar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="text-2xl font-bold text-slate-100">{formatCurrency(financialStats.totalRevenue)}</div>
              <div className="text-slate-100 font-medium text-sm">Receita Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="text-2xl font-bold text-slate-100">{formatCurrency(financialStats.totalExpenses)}</div>
              <div className="text-slate-100 font-medium text-sm">Despesas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="text-2xl font-bold text-slate-100">{formatCurrency(financialStats.netProfit)}</div>
              <div className="text-slate-100 font-medium text-sm">Lucro Liquido</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
              <div className="text-2xl font-bold text-slate-100">{financialStats.profitMargin.toFixed(1)}%</div>
              <div className="text-slate-100 font-medium text-sm">Margem de Lucro</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <button
              onClick={openExpenseModal}
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

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4">
            <h3 className="text-lg font-bold text-white mb-4">Transacoes Recentes</h3>
            <div className="space-y-3">
              {recentTransactions.map(transaction => (
                <div key={`${transaction.type}-${transaction.id}`} className="flex justify-between items-center p-4 bg-white/5 border border-white/15 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-100">{transaction.description}</div>
                    <div className="text-sm text-slate-200">
                      {formatDate(transaction.date)} - {transaction.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div className="text-xs text-slate-200">
                      {transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                    </div>
                  </div>
                </div>
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
            <button
              onClick={() => setIsFiscalConfigOpen(true)}
              className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all"
            >
              ⚙️ Configurar Dados Fiscais
            </button>
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
                      <td className="px-6 py-4 text-sm font-medium text-slate-100">{order.id}</td>
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

          <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 md:p-8">
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tamanhos / Variacoes</label>
                        <input
                          type="text"
                          value={productForm.sizes || ''}
                          onChange={event => setProductForm(prev => ({ ...prev, sizes: event.target.value }))}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                          placeholder="Ex: P, M, G ou 38, 40"
                        />
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
                    <div>
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
            <h3 className="text-xl font-black text-gray-900">Nova Categoria</h3>
          </div>
          <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
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
            <h3 className="text-xl font-black text-gray-900">Atualizar Status do Pedido</h3>
          </div>
          <form onSubmit={handleOrderStatusSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Status</label>
              <select
                value={orderStatusForm.status}
                onChange={event => setOrderStatusForm(prev => ({ ...prev, status: event.target.value as OrderStatus }))}
                className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
              >
                <option value="pending">Aguardando Pagamento</option>
                <option value="paid">Pagamento Efetuado</option>
                <option value="processing">Em Processamento</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
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
                    {order.id} - {order.customerName}
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
                onChange={event => setInventoryForm(prev => ({ ...prev, productId: event.target.value }))}
                className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                required
              >
                <option value="">Selecione um produto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Estoque: {product.stock || 0})
                  </option>
                ))}
              </select>
            </div>
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
            <h3 className="text-xl font-black text-gray-900">Lancar Despesa</h3>
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
                Lancar Despesa
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
    cart={pdvCart}
    onSubmit={handlePdvCheckoutSubmit}
    isSubmitting={isSubmitting}
  />

  <FiscalConfigModal
    isOpen={isFiscalConfigOpen}
    onClose={() => setIsFiscalConfigOpen(false)}
  />

  <footer className="bg-gradient-to-r from-versiory-ink to-slate-900 text-white py-8 mt-12 border-t border-white/10 text-center">
    <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
      <p className="text-white/80 text-sm font-medium">Área restrita. Acesso exclusivo para administradores. Todas as ações são monitoradas.</p>
      <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-medium transition-all mt-2"
      >
        Sair
      </button>
      <p className="text-white/60 text-xs mt-2">© {new Date().getFullYear()} Versiory Store. Todos os direitos reservados.</p>
    </div>
  </footer>
    </div >
  );
};

export default AdminDashboard;


