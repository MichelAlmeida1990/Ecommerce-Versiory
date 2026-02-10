import React, { useState, useEffect } from 'react';
import { Product } from './types';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Senha admin simples - em produção, usar sistema mais seguro
const ADMIN_PASSWORD = 'versiory2024';

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Carregar produtos do localStorage ou usar os produtos padrão
  useEffect(() => {
    const savedProducts = localStorage.getItem('versiory_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Importar produtos padrão
      import('./constants').then(({ PRODUCTS }) => {
        setProducts(PRODUCTS);
        localStorage.setItem('versiory_products', JSON.stringify(PRODUCTS));
      });
    }
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

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} error={error} />;
  }

  return (
    <AdminDashboard 
      products={products}
      onLogout={handleLogout}
      onUpdateProducts={handleUpdateProducts}
    />
  );
};

export default AdminApp;
