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
  getAdminSession,
  saveAdminSession,
  updateAdminActivity,
  clearAdminSession,
  AdminSession,
  subscribeToProducts,
  subscribeToOrders,
  subscribeToInventoryMovements,
  subscribeToExpenses
} from './services/firebase';

const ADMIN_PASSWORD = 'versiory2024';
const SELLER_PASSWORD = 'vendedor2024';
const BASE_CATEGORIES = ['Eletrônicos', 'Moda', 'Casa', 'Esportes'];

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'seller'>('seller');
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
        if (session && session.isAuthenticated) {
          setIsAuthenticated(true);
          setUserRole(session.role || 'seller');
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão admin:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);


  // Carregar dados em tempo real (ERRCOM111)
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubProducts: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubMovements: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;

    const startSubscriptions = async () => {
      try {
        // Produtos
        unsubProducts = subscribeToProducts((data) => {
          if (data.length === 0 && PRODUCTS && PRODUCTS.length > 0) {
            const defaultProducts = PRODUCTS.map(p => ({ ...p, stock: p.stock ?? 20, sizes: p.sizes ?? '', images: p.images ?? [] }));
            setProducts(defaultProducts);
          } else {
            setProducts(data);
          }
        });

        // Pedidos
        unsubOrders = subscribeToOrders((data) => {
          setOrders(data);
        });

        // Movimentações
        unsubMovements = subscribeToInventoryMovements((data) => {
          setInventoryMovements(data);
        });

        // Despesas
        unsubExpenses = subscribeToExpenses((data) => {
          setExpenses(data);
        });

        // Dados estáticos (categorias, clientes, rastreio) continuam com fetch único ou podem ser movidos também
        const [categoriesData, customersData, trackingData] = await Promise.all([
          getCategories(),
          getCustomers(),
          getTracking()
        ]);

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

        setCustomers(customersData);
        setTracking(trackingData);

      } catch (error) {
        console.error('Erro ao iniciar assinaturas em tempo real:', error);
        setError('Erro na conexão em tempo real. Algumas atualizações podem exigir atualização manual.');
      }
    };

    startSubscriptions();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
      if (unsubMovements) unsubMovements();
      if (unsubExpenses) unsubExpenses();
    };
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

    // Salvar sessão periodicamente a cada 30 segundos
    const saveInterval = setInterval(async () => {
      if (isAuthenticated) {
        try {
          await updateAdminActivity();
        } catch (error) {
          console.error('Erro ao salvar sessão periodicamente:', error);
        }
      }
    }, 30 * 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(saveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const handleLogin = async (password: string, role: 'admin' | 'seller') => {
    const isValidPassword =
      (role === 'admin' && password === ADMIN_PASSWORD) ||
      (role === 'seller' && password === SELLER_PASSWORD);

    if (isValidPassword) {
      try {
        await saveAdminSession({
          isAuthenticated: true,
          role,
          loginTime: Date.now(),
          lastActivity: Date.now()
        });
        setIsAuthenticated(true);
        setUserRole(role);
        setError('');
      } catch (error) {
        console.error('Erro ao salvar sessão:', error);
        setError('Erro ao fazer login.');
      }
    } else {
      setError('Senha incorreta para o perfil selecionado.');
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
      userRole={userRole}
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
