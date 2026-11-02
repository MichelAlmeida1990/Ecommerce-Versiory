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
  subscribeToExpenses,
  getCategories,
  getCustomers,
  subscribeToCustomers,
  getTracking,
  saveCategory
} from './services/firebase';
import { getBillingStatus, getBillingConfig } from './services/billingConfig';
import { logAudit } from './services/firebase';
import { STORE_WHATSAPP_NUMBER } from './utils/constants';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'versiory2024';
const SELLER_PASSWORD = import.meta.env.VITE_SELLER_PASSWORD || 'vendedor2024';
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD || 'devsuporte2026';
const BASE_CATEGORIES = ['Eletrônicos', 'Moda', 'Casa', 'Esportes'];

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'seller' | 'dev'>('seller');
  const [devSetupSecret, setDevSetupSecret] = useState<string | null>(null);
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
    let unsubCustomers: (() => void) | undefined;

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

        // Clientes (REFCOM240): assinatura em tempo real para refletir na hora
        // alterações feitas pelo cliente no e-commerce (ex.: Data de Nascimento).
        unsubCustomers = subscribeToCustomers((data) => {
          setCustomers(data);
        });

        // Dados estáticos (categorias e rastreio) continuam com fetch único
        const [categoriesData, trackingData] = await Promise.all([
          getCategories(),
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
      if (unsubCustomers) unsubCustomers();
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

const handleLogin = async (password: string, role: 'admin' | 'seller' | 'dev', totpCode?: string) => {
    if (role !== 'dev') {
      const billing = getBillingStatus(getBillingConfig());
      if (billing.blocked) {
        setError('🔒 Acesso bloqueado por inadimplência. Regularize o pagamento para continuar.');
        return;
      }
    }

    const isValidPassword =
      (role === 'admin' && password === ADMIN_PASSWORD) ||
      (role === 'seller' && password === SELLER_PASSWORD) ||
      (role === 'dev' && password === DEV_PASSWORD);

    if (!isValidPassword) {
      setError('Senha incorreta para o perfil selecionado.');
      return;
    }

    // 2FA para perfil dev
    if (role === 'dev') {
      const { generateTotpSecret, verifyTotp, totpOtpAuthUrl } = await import('./utils/totp');
      let secret = localStorage.getItem('versiory_dev_totp_secret');
      if (!secret) {
        secret = generateTotpSecret();
        localStorage.setItem('versiory_dev_totp_secret', secret);
        setDevSetupSecret(secret);
        return;
      }
      const ok = await verifyTotp(secret, totpCode || '');
      if (!ok) {
        setError('Código 2FA inválido ou expirado.');
        return;
      }
    }

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
      logAudit({ action: 'login', userRole: role, details: 'Login no painel admin' });
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      setError('Erro ao fazer login.');
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
    if (devSetupSecret) {
      const url = `otpauth://totp/Versiory:Dev%20Versiory?secret=${devSetupSecret}&issuer=Versiory&digits=6&period=30`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <h2 className="text-xl font-bold">Configurar 2FA (Dev)</h2>
            <p className="text-sm text-slate-300">Escaneie o QR no app autenticador ou adicione manualmente:</p>
            <img src={qr} alt="QR 2FA" className="mx-auto rounded-lg bg-white p-2" />
            <div className="text-xs break-all bg-slate-700 p-2 rounded font-mono">{devSetupSecret}</div>
            <p className="text-xs text-slate-400">Depois faça login novamente informando o código de 6 dígitos.</p>
            <button onClick={() => setDevSetupSecret(null)} className="w-full py-2 bg-blue-600 rounded-lg font-bold">Continuar</button>
          </div>
        </div>
      );
    }
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
