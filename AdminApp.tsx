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
  saveCategory,
  getAdminSession,
  saveAdminSession,
  updateAdminActivity,
  clearAdminSession,
  AdminSession
} from './services/firebase';

const ADMIN_PASSWORD = 'versiory2024';
const BASE_CATEGORIES = ['Eletrônicos', 'Moda', 'Casa', 'Esportes'];

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tracking, setTracking] = useState<TrackingItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getAdminSession();
        if (session?.isAuthenticated) {
          const now = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (now - session.lastActivity < twentyFourHours) {
            setIsAuthenticated(true);
            // Atualizar atividade ao carregar (sem await para não bloquear)
            updateAdminActivity().catch(console.error);
          } else {
            // Sessão expirada
            await clearAdminSession();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

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

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Verificar periodicamente se a sessão ainda é válida
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listener para salvar sessão quando a página fica oculta
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && isAuthenticated) {
        try {
          await updateAdminActivity();
        } catch (error) {
          console.error('Erro ao salvar sessão:', error);
        }
      }
    };

    // Listener para salvar sessão periodicamente
    const saveSessionPeriodically = async () => {
      if (isAuthenticated) {
        try {
          await updateAdminActivity();
        } catch (error) {
          console.error('Erro ao salvar sessão periodicamente:', error);
        }
      }
    };

    const checkAuthValidity = async () => {
      try {
        const session = await getAdminSession();
        if (!session || !session.isAuthenticated) {
          setIsAuthenticated(false);
          return;
        }

        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - session.lastActivity >= twentyFourHours) {
          await handleLogout();
        }
      } catch (error) {
        console.error('Erro ao verificar validade da sessão:', error);
      }
    };

    // Verificar a cada 5 minutos
    const validityInterval = setInterval(checkAuthValidity, 5 * 60 * 1000);
    // Salvar sessão a cada 30 segundos
    const saveInterval = setInterval(saveSessionPeriodically, 30 * 1000);
    
    // Listener para detectar atividade do usuário
    const handleActivity = async () => {
      if (isAuthenticated) {
        try {
          await updateAdminActivity();
        } catch (error) {
          console.error('Erro ao atualizar atividade:', error);
        }
      }
    };

    // Eventos que indicam atividade do usuário
    const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
    
    // Throttle para evitar muitas atualizações
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // Atualizar no máximo a cada minuto
        handleActivity();
        lastUpdate = now;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });
    
    return () => {
      clearInterval(validityInterval);
      clearInterval(saveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledUpdate);
      });
    };
  }, [isAuthenticated]);

  const handleLogin = async (password: string) => {
    if (password === ADMIN_PASSWORD) {
      try {
        await saveAdminSession({
          isAuthenticated: true,
          loginTime: Date.now(),
          lastActivity: Date.now()
        });
        setIsAuthenticated(true);
        setError('');
      } catch (error) {
        console.error('Erro ao salvar sessão:', error);
        setError('Erro ao fazer login.');
      }
    } else {
      setError('Senha incorreta.');
    }
  };

  const handleLogout = async () => {
    try {
      await clearAdminSession();
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1f4b] via-[#0a1b3d] to-[#08122b] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

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
