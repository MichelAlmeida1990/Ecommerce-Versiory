import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Product, CartItem, Category } from './types';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import ProductModal from './components/ProductModal';
import ChatWidget from './components/ChatWidget';
import CustomerOrders from './components/CustomerOrders';
import Account from './components/Account';
import LoginRegister from './components/LoginRegister';
import ProductDetail from './components/ProductDetail';

const PrivateRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean }> = ({ children, isAuthenticated }) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserAddress, setCurrentUserAddress] = useState('');
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLoginSuccess = (email: string, address: string) => {
    setCurrentUserEmail(email);
    setCurrentUserAddress(address);
    setIsAuthenticated(true);
    navigate('/');
  };

  useEffect(() => {
    const saved = localStorage.getItem('versiory_products');
    if (saved) {
      setProducts(JSON.parse(saved));
    } else {
      import('./constants').then(({ PRODUCTS }) => {
        setProducts(PRODUCTS);
        localStorage.setItem('versiory_products', JSON.stringify(PRODUCTS));
      });
    }

    const savedUser = localStorage.getItem('versiory_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as { email?: string; address?: string };
      if (parsed.email) {
        setIsAuthenticated(true);
        setCurrentUserEmail(parsed.email);
        setCurrentUserAddress(parsed.address || '');
      }
    }

    // Listen for addToCart custom events from ProductDetail
    const onAddToCartEvent = (e: Event) => {
      const evt = e as CustomEvent<{ product: Product }>;
      if (evt.detail?.product) {
        handleAddToCart(evt.detail.product);
        setIsCartOpen(true);
      }
    };
    window.addEventListener('addToCart', onAddToCartEvent as EventListener);
    const openProfile = () => setIsProfileOpen(true);
    const openHandler = openProfile as EventListener;
    const closeHandler = () => setIsProfileOpen(false);
    window.addEventListener('openProfileModal', openHandler);
    window.addEventListener('closeProfileModal', closeHandler as EventListener);
    return () => {
      window.removeEventListener('addToCart', onAddToCartEvent as EventListener);
      window.removeEventListener('openProfileModal', openHandler);
      window.removeEventListener('closeProfileModal', closeHandler as EventListener);
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.image,
        category: product.category
      }]);
    }
    setToastMessage(`${product.name} adicionado ao carrinho!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleOpenCustomerOrders = () => {
    setIsCustomerOrdersOpen(true);
  };

  const handleCloseCustomerOrders = () => {
    setIsCustomerOrdersOpen(false);
  };

  const handleOrderComplete = () => {
    setCartItems([]);
    setToastMessage('Pedido realizado com sucesso! Você receberá atualizações por email.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory !== 'Todos') {
      filtered = filtered.filter(product => product.category === activeCategory);
    }
    
    return filtered;
  }, [products, searchQuery, activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  return (
    <Router>
      <div className="min-h-screen bg-versiory-sand">
        <Header 
          cartItems={cartItems}
          onCartOpen={() => setIsCartOpen(true)}
          onProfileOpen={() => setIsProfileOpen(true)}
          isAuthenticated={isAuthenticated}
          currentUserEmail={currentUserEmail}
        />
        
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <Routes>
            <Route path="/" element={
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Bem-vindo à <span className="text-versiory-coral">Versiory Store</span>
                  </h1>
                  <p className="text-gray-600 text-lg">Transformando ideias em sucesso</p>
                </div>

                <div className="mb-8">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category as Category)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            activeCategory === category
                              ? 'bg-versiory-coral text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={setSelectedProduct}
                    />
                  ))}
                </div>
              </div>
            } />

            <Route
              path="/product/:id"
              element={<ProductDetail />}
            />

            <Route
              path="/account"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <Account />
                </PrivateRoute>
              }
            />

            <Route path="/login" element={<LoginRegister onClose={() => {}} onLoginSuccess={handleLoginSuccess} />} />
          </Routes>
        </main>

        <footer className="mt-24 bg-gradient-to-r from-versiory-ink to-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-2xl font-black mb-4 text-white">Versiory Store</h3>
                <p className="text-white mb-4 font-semibold">Transformando ideias em sucesso. Sua loja de confiança para produtos de qualidade.</p>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-white">Links Rápidos</h4>
                <ul className="space-y-2 text-white font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                  <li><a href="/admin.html" className="text-versiory-coral hover:brightness-110 transition-colors font-bold">Painel Admin</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 text-white">Atendimento</h4>
                <ul className="space-y-2 text-white font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Trocas e Devoluções</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Rastreamento</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Formas de Pagamento</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 text-center text-white font-semibold">
              <p>© {new Date().getFullYear()} Versiory Store. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          customerEmail={currentUserEmail}
          customerAddress={currentUserAddress}
          onOrderComplete={handleOrderComplete}
        />

        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />

        <ChatWidget />

        <CustomerOrders customerEmail={currentUserEmail} isOpen={isCustomerOrdersOpen} onClose={() => setIsCustomerOrdersOpen(false)} />

        {toastMessage && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[100] toast-enter">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-bold">{toastMessage}</span>
            </div>
          </div>
        )}

        {isProfileOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsProfileOpen(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
              <LoginRegister onClose={() => setIsProfileOpen(false)} onLoginSuccess={(email, address) => {
              handleLoginSuccess(email, address);
              setIsProfileOpen(false);
            }} />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default AppContent;
