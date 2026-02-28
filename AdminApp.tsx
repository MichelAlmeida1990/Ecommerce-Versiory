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
import { PRODUCTS } from './constants';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import {
  getProducts,
  getCategories,
  getOrders,
  getCustomers,
  getTracking,
  getInventoryMovements,
  getExpenses,
  saveProduct,
  saveCategory
} from './services/firebase';

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

  // Carregar dados do Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData, ordersData, customersData, trackingData, inventoryData, expensesData] = await Promise.all([
          getProducts(),
          getCategories(),
          getOrders(),
          getCustomers(),
          getTracking(),
          getInventoryMovements(),
          getExpenses()
        ]);

        // Se não houver produtos, inicializar com dados padrão
        if (productsData.length === 0) {
          const defaultProducts = PRODUCTS.map(p => ({ ...p, stock: p.stock ?? 20, sizes: p.sizes ?? '' }));
          await Promise.all(defaultProducts.map(p => saveProduct(p)));
          setProducts(defaultProducts);
        } else {
          setProducts(productsData);
        }

        // Se não houver categorias, inicializar com categorias base
        if (categoriesData.length === 0) {
          const defaultCategories = BASE_CATEGORIES.map(cat => ({
            id: cat.toLowerCase().replace(/\s+/g, '_'),
            name: cat,
            description: `Produtos de ${cat.toLowerCase()}`
          }));
          await Promise.all(defaultCategories.map(c => saveCategory(c)));
          setCategories(defaultCategories);
        } else {
          setCategories(categoriesData);
        }

        setOrders(ordersData);
        setCustomers(customersData);
        setTracking(trackingData);
        setInventoryMovements(inventoryData);
        setExpenses(expensesData);
      } catch (error) {
        console.error('Erro ao carregar dados do Firebase:', error);
      }
    };

    loadData();
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
  };

  const handleUpdateCategories = (updatedCategories: CategoryItem[]) => {
    setCategories(updatedCategories);
  };

  const handleUpdateOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  };

  const handleUpdateCustomers = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
  };

  const handleUpdateTracking = (updatedTracking: TrackingItem[]) => {
    setTracking(updatedTracking);
  };

  const handleUpdateInventoryMovements = (updatedMovements: InventoryMovement[]) => {
    setInventoryMovements(updatedMovements);
  };

  const handleUpdateExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
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
