import React, { useState, useEffect } from 'react';
import {
  Product,
  CategoryItem,
  Order,
  Customer,
  TrackingItem,
  InventoryMovement,
  Expense
} from './types';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Senha admin simples - em produção, usar sistema mais seguro
const ADMIN_PASSWORD = 'versiory2024';
const BASE_CATEGORIES = ['Eletrônicos', 'Moda', 'Casa', 'Esportes'];

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tracking, setTracking] = useState<TrackingItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Carregar dados do localStorage ou usar valores padrão
  useEffect(() => {
    const savedProducts = localStorage.getItem('versiory_products');

    const loadDefaults = async () => {
      const { PRODUCTS } = await import('./constants');
      const defaultProducts = PRODUCTS.map(product => ({
        ...product,
        stock: product.stock ?? 20,
        sizes: product.sizes ?? ''
      }));
      setProducts(defaultProducts);
      localStorage.setItem('versiory_products', JSON.stringify(defaultProducts));
      return defaultProducts;
    };

    const normalizeProducts = (list: Product[]) =>
      list.map(product => ({
        ...product,
        stock: product.stock ?? 0,
        sizes: product.sizes ?? ''
      }));

    const initProducts = savedProducts ? normalizeProducts(JSON.parse(savedProducts)) : null;

    const loadAll = async () => {
      const productList = initProducts ?? await loadDefaults();

      const savedCategories = localStorage.getItem('versiory_categories');
      const categoryList = savedCategories
        ? (JSON.parse(savedCategories) as CategoryItem[])
        : BASE_CATEGORIES.map(category => ({
            id: category.toLowerCase().replace(/\s+/g, '_'),
            name: category,
            description: `Produtos de ${category.toLowerCase()}`
          }));
      if (!savedCategories) {
        localStorage.setItem('versiory_categories', JSON.stringify(categoryList));
      }

      const savedOrders = localStorage.getItem('versiory_orders');
      const orderList = savedOrders
        ? (JSON.parse(savedOrders) as Order[])
        : [
            {
              id: 'ORD-001',
              customerId: 1,
              customerName: 'Joao Silva',
              date: new Date('2024-01-15').toISOString(),
              total: 899.90,
              status: 'paid',
              items: [{ productId: productList[0]?.id || 1, name: 'Headphone Wireless Pro', quantity: 1, price: 899.90 }],
              notes: ''
            },
            {
              id: 'ORD-002',
              customerId: 2,
              customerName: 'Maria Santos',
              date: new Date('2024-01-16').toISOString(),
              total: 1249.00,
              status: 'processing',
              items: [{ productId: productList[1]?.id || 2, name: 'Relogio Inteligente S3', quantity: 1, price: 1249.00 }],
              notes: ''
            }
          ];
      if (!savedOrders) {
        localStorage.setItem('versiory_orders', JSON.stringify(orderList));
      }

      const savedCustomers = localStorage.getItem('versiory_customers');
      const customerList = savedCustomers
        ? (JSON.parse(savedCustomers) as Customer[])
        : [
            {
              id: 1,
              name: 'Joao Silva',
              email: 'joao@email.com',
              phone: '(11) 98765-4321',
              totalOrders: 1,
              totalSpent: 899.90
            },
            {
              id: 2,
              name: 'Maria Santos',
              email: 'maria@email.com',
              phone: '(11) 91234-5678',
              totalOrders: 1,
              totalSpent: 1249.00
            }
          ];
      if (!savedCustomers) {
        localStorage.setItem('versiory_customers', JSON.stringify(customerList));
      }

      const savedTracking = localStorage.getItem('versiory_tracking');
      const trackingList = savedTracking ? (JSON.parse(savedTracking) as TrackingItem[]) : [];
      if (!savedTracking) {
        localStorage.setItem('versiory_tracking', JSON.stringify(trackingList));
      }

      const savedInventory = localStorage.getItem('versiory_inventory_movements');
      const inventoryList = savedInventory ? (JSON.parse(savedInventory) as InventoryMovement[]) : [];
      if (!savedInventory) {
        localStorage.setItem('versiory_inventory_movements', JSON.stringify(inventoryList));
      }

      const savedExpenses = localStorage.getItem('versiory_expenses');
      const expenseList = savedExpenses ? (JSON.parse(savedExpenses) as Expense[]) : [];
      if (!savedExpenses) {
        localStorage.setItem('versiory_expenses', JSON.stringify(expenseList));
      }

      setProducts(productList);
      setCategories(categoryList);
      setOrders(orderList);
      setCustomers(customerList);
      setTracking(trackingList);
      setInventoryMovements(inventoryList);
      setExpenses(expenseList);
    };

    loadAll();
  }, []);

  const handleLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setError('');
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('versiory_products', JSON.stringify(updatedProducts));
  };

  const handleUpdateCategories = (updatedCategories: CategoryItem[]) => {
    setCategories(updatedCategories);
    localStorage.setItem('versiory_categories', JSON.stringify(updatedCategories));
  };

  const handleUpdateOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('versiory_orders', JSON.stringify(updatedOrders));
  };

  const handleUpdateCustomers = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    localStorage.setItem('versiory_customers', JSON.stringify(updatedCustomers));
  };

  const handleUpdateTracking = (updatedTracking: TrackingItem[]) => {
    setTracking(updatedTracking);
    localStorage.setItem('versiory_tracking', JSON.stringify(updatedTracking));
  };

  const handleUpdateInventoryMovements = (updatedMovements: InventoryMovement[]) => {
    setInventoryMovements(updatedMovements);
    localStorage.setItem('versiory_inventory_movements', JSON.stringify(updatedMovements));
  };

  const handleUpdateExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    localStorage.setItem('versiory_expenses', JSON.stringify(updatedExpenses));
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} error={error} />;
  }

  return (
    <AdminDashboard 
      products={products}
      categories={categories}
      orders={orders}
      customers={customers}
      tracking={tracking}
      inventoryMovements={inventoryMovements}
      expenses={expenses}
      onLogout={handleLogout}
      onUpdateProducts={handleUpdateProducts}
      onUpdateCategories={handleUpdateCategories}
      onUpdateOrders={handleUpdateOrders}
      onUpdateCustomers={handleUpdateCustomers}
      onUpdateTracking={handleUpdateTracking}
      onUpdateInventoryMovements={handleUpdateInventoryMovements}
      onUpdateExpenses={handleUpdateExpenses}
    />
  );
};

export default AdminApp;
