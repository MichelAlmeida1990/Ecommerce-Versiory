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
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'tracking'
  | 'inventory'
  | 'financial';

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
    sizes: ''
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

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
      sizes: ''
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

  const handleProductSubmit = (event: React.FormEvent) => {
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

    const payload: Product = {
      ...(productForm as Product),
      category: trimmedCategory,
      stock: productForm.stock || 0,
      sizes: productForm.sizes || ''
    };

    if (editingProductId) {
      const updatedProducts = products.map(product =>
        product.id === editingProductId ? { ...product, ...payload } : product
      );
      onUpdateProducts(updatedProducts);
    } else {
      const newProduct: Product = {
        id: Math.max(0, ...products.map(product => product.id)) + 1,
        ...payload
      };
      onUpdateProducts([...products, newProduct]);
    }

    closeProductModal();
  };

  const handleProductDelete = (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    onUpdateProducts(products.filter(product => product.id !== id));
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setProductForm(prev => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const openCategoryModal = () => {
    setCategoryForm({ name: '', description: '' });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) {
      window.alert('Informe o nome da categoria.');
      return;
    }

    const newCategory: CategoryItem = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description: categoryForm.description.trim()
    };

    onUpdateCategories([...categories, newCategory]);
    setIsCategoryModalOpen(false);
  };

  const handleCategoryDelete = (categoryId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    onUpdateCategories(categories.filter(category => category.id !== categoryId));
  };

  const openOrderStatusModal = (order: Order) => {
    setOrderStatusForm({
      orderId: order.id,
      status: order.status,
      notes: order.notes || ''
    });
    setIsOrderStatusModalOpen(true);
  };

  const handleOrderStatusSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const updatedOrders = orders.map(order =>
      order.id === orderStatusForm.orderId
        ? { ...order, status: orderStatusForm.status, notes: orderStatusForm.notes }
        : order
    );
    onUpdateOrders(updatedOrders);
    setIsOrderStatusModalOpen(false);
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

  const handleTrackingSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!trackingForm.orderId) {
      window.alert('Selecione um pedido.');
      return;
    }

    const updatedList = tracking.filter(item => item.orderId !== trackingForm.orderId);
    updatedList.push({
      orderId: trackingForm.orderId,
      carrier: trackingForm.carrier,
      code: trackingForm.code,
      status: trackingForm.status,
      lastUpdate: new Date().toISOString()
    });
    onUpdateTracking(updatedList);
    setIsTrackingModalOpen(false);
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

  const handleInventorySubmit = (event: React.FormEvent) => {
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

    const updatedProducts = products.map(item =>
      item.id === productId ? { ...item, stock: newStock } : item
    );

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

    onUpdateProducts(updatedProducts);
    onUpdateInventoryMovements([...inventoryMovements, movement]);
    setIsInventoryModalOpen(false);
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

  const handleExpenseSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!expenseForm.description.trim()) {
      window.alert('Informe a descricao da despesa.');
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      description: expenseForm.description,
      category: expenseForm.category,
      amount: expenseForm.amount,
      date: expenseForm.date,
      notes: expenseForm.notes,
      user: 'Admin'
    };

    onUpdateExpenses([...expenses, newExpense]);
    setIsExpenseModalOpen(false);
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
                ['products', 'Produtos'],
                ['categories', 'Categorias'],
                ['orders', 'Pedidos'],
                ['customers', 'Clientes'],
                ['tracking', 'Rastreamento'],
                ['inventory', 'Estoque'],
                ['financial', 'Financeiro']
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === key
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
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-black text-gray-900">
                {editingProductId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
            </div>

            <form onSubmit={handleProductSubmit} className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    value={productForm.name || ''}
                    onChange={event => setProductForm(prev => ({ ...prev, name: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Preco (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price || 0}
                    onChange={event => setProductForm(prev => ({ ...prev, price: parseFloat(event.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock ?? 0}
                    onChange={event => setProductForm(prev => ({ ...prev, stock: parseInt(event.target.value, 10) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Tamanhos</label>
                  <input
                    type="text"
                    value={productForm.sizes || ''}
                    onChange={event => setProductForm(prev => ({ ...prev, sizes: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    placeholder="Ex: P, M, G, GG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Categoria</label>
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
                    className="w-full px-4 py-3 border border-white/25 bg-white/70 backdrop-blur-md text-slate-900 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="__new__">Nova categoria...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Imagem do Produto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={event => handleImageUpload(event.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  />
                  {productForm.image && (
                    <div className="mt-3">
                      <img src={productForm.image} alt="Preview" className="h-24 w-24 rounded-xl object-cover border border-gray-200" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Avaliacao (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={productForm.rating || 0}
                    onChange={event => setProductForm(prev => ({ ...prev, rating: parseFloat(event.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">N de Avaliacoes</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.reviews || 0}
                    onChange={event => setProductForm(prev => ({ ...prev, reviews: parseInt(event.target.value, 10) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">Descricao</label>
                <textarea
                  value={productForm.description || ''}
                  onChange={event => setProductForm(prev => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  required
                />
              </div>

              {isCustomCategory && (
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">Nova Categoria</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={event => setCustomCategory(event.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    placeholder="Ex.: Beleza"
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all shadow-lg hover:-translate-y-1 active:scale-95"
                >
                  {editingProductId ? 'Atualizar Produto' : 'Criar Produto'}
                </button>
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
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
      )}

      {isOrderStatusModalOpen && (
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
      )}

      {isTrackingModalOpen && (
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
      )}

      {isInventoryModalOpen && (
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
      )}

      {isExpenseModalOpen && (
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
      )}
    </div>
  );
};

export default AdminDashboard;


