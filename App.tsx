import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { getProducts, getCategories } from './services/firebase';


const PrivateRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean; isLoading: boolean }> = ({ children, isAuthenticated, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-versiory-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserAddress, setCurrentUserAddress] = useState('');
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);


  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getProducts();
        if (productsData.length > 0) {
          setProducts(productsData);
        } else {
          // Fallback para constants se Firebase estiver vazio
          import('./constants').then(({ PRODUCTS }) => {
            setProducts(PRODUCTS);
          });
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Fallback para constants em caso de erro
        import('./constants').then(({ PRODUCTS }) => {
          setProducts(PRODUCTS);
        });
      }
    };

    const loadUserSession = async () => {
      try {
        const { getUserSession } = await import('./services/firebase');
        const session = await getUserSession();
        if (session) {
          setIsAuthenticated(true);
          setCurrentUserEmail(session.email);
          setCurrentUserAddress(session.address || '');
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        const categoriesData = await getCategories();
        if (categoriesData.length > 0) {
          setCategoriesList(['Todos', ...categoriesData.map(c => c.name)]);
        } else {
          setCategoriesList(['Todos', 'Eletrônicos', 'Moda', 'Casa', 'Esportes', 'Cama, Mesa e Banho']);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setCategoriesList(['Todos', 'Eletrônicos', 'Moda', 'Casa', 'Esportes', 'Cama, Mesa e Banho']);
      }
    };

    loadProducts();
    loadCategories();
    loadUserSession();


    // Listen for addToCart custom events from ProductDetail
    const onAddToCartEvent = (e: Event) => {
      const evt = e as CustomEvent<{ product: Product }>;
      if (evt.detail?.product) {
        addToCart(evt.detail.product);
        setIsCartOpen(true);
      }
    };
    window.addEventListener('addToCart', onAddToCartEvent as EventListener);
    const openProfile = () => setIsProfileOpen(true);
    const openHandler = openProfile as EventListener;
    const closeHandler = () => setIsProfileOpen(false);
    window.addEventListener('openProfileModal', openHandler);
    window.addEventListener('closeProfileModal', closeHandler as EventListener);

    // Escutar atualizações de endereço vindas do Cart
    const onAddressUpdated = (e: Event) => {
      const evt = e as CustomEvent<{ address: string }>;
      if (evt.detail?.address) {
        setCurrentUserAddress(evt.detail.address);
      }
    };
    window.addEventListener('addressUpdated', onAddressUpdated as EventListener);

    return () => {
      window.removeEventListener('addToCart', onAddToCartEvent as EventListener);
      window.removeEventListener('openProfileModal', openHandler);
      window.removeEventListener('closeProfileModal', closeHandler as EventListener);
      window.removeEventListener('addressUpdated', onAddressUpdated as EventListener);
    };
  }, []);

  // Salvar sessão quando o estado de autenticação mudar
  useEffect(() => {
    const saveSession = async () => {
      if (isAuthenticated && currentUserEmail) {
        try {
          const { saveUserSession } = await import('./services/firebase');
          await saveUserSession({
            email: currentUserEmail,
            address: currentUserAddress,
            loginTime: Date.now()
          });
        } catch (error) {
          console.error('Erro ao salvar sessão:', error);
        }
      }
    };

    saveSession();
  }, [isAuthenticated, currentUserEmail, currentUserAddress]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string) => {
    setCartItems(prev => {
      const found = prev.find(i =>
        i.id === product.id &&
        i.selectedSize === selectedSize &&
        i.selectedColor === selectedColor
      );
      if (found) {
        return prev.map(i =>
          (i.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize, selectedColor }];
    });

    const details = [
      selectedSize,
      selectedColor
    ].filter(Boolean).join(' - ');

    setToastMessage(`${product.name}${details ? ` (${details})` : ''} adicionado ao carrinho`);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (id: number, selectedSize?: string, selectedColor?: string) => {
    setCartItems(prev => prev.filter(i =>
      !(i.id === id && i.selectedSize === selectedSize && i.selectedColor === selectedColor)
    ));
  };

  const handleOrderComplete = () => {
    setCartItems([]);
    setToastMessage('Pedido realizado com sucesso!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const categories: Category[] = categoriesList as Category[];


  return (
    <Router>
      <div className="min-h-screen flex flex-col selection:bg-[#ffd7c8]">
        <Header
          cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
          onProfileClick={() => window.dispatchEvent(new CustomEvent('openProfileModal'))}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isAuthenticated={isAuthenticated}
          userEmail={currentUserEmail}
          onLogout={async () => {
            try {
              const { clearUserSession } = await import('./services/firebase');
              await clearUserSession();
              setIsAuthenticated(false);
              setCurrentUserEmail('');
              setCurrentUserAddress('');
              setToastMessage('Logout realizado com sucesso!');
              setTimeout(() => setToastMessage(''), 3000);
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          }}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-28">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* Hero Banner com Imagem */}
                  <section className="mb-12 relative rounded-3xl overflow-hidden shadow-2xl h-[400px]">
                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop"
                      alt="Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
                    <div className="relative h-full flex items-center px-8 md:px-12">
                      <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-6xl font-black mb-4 text-white drop-shadow-lg">Versiory Store</h1>
                        <p className="text-xl md:text-2xl font-medium mb-6 text-white drop-shadow-md">Transformando ideias em sucesso.</p>
                        <div className="flex gap-4 flex-wrap">
                          <div className="bg-white px-6 py-3 rounded-full text-sm font-bold text-slate-900 shadow-lg hover:scale-105 transition-transform">
                            🚀 Frete Grátis Brasil
                          </div>
                          <div className="bg-white px-6 py-3 rounded-full text-sm font-bold text-slate-900 shadow-lg hover:scale-105 transition-transform">
                            🔒 Pagamento Seguro
                          </div>
                          <div className="bg-white px-6 py-3 rounded-full text-sm font-bold text-slate-900 shadow-lg hover:scale-105 transition-transform">
                            ⚡ Entrega Rápida
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Categorias</h2>
                    <p className="text-slate-600">Explore nossos produtos por categoria</p>
                  </section>

                  <div id="category-scroll" className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeCategory === cat
                          ? 'bg-versiory-ink text-white shadow-lg scale-105'
                          : 'bg-blue-50 text-slate-700 hover:bg-blue-100 hover:scale-105'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <section className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Produtos em Destaque</h2>
                    <p className="text-slate-600">{filteredProducts.length} produtos encontrados</p>
                  </section>

                  <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(p => (
                      <ProductCard key={p.id} product={p} onAddToCart={addToCart} onViewDetails={setSelectedProduct} />
                    ))}
                  </div>
                </>
              }
            />

            <Route path="/product/:id" element={<ProductDetail />} />

            <Route
              path="/account"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                  <Account />
                </PrivateRoute>
              }
            />

            <Route path="/login" element={<LoginRegister />} />
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
            <div className="border-t border-white/10 pt-8 flex flex-col items-center gap-4 text-center text-white font-semibold">
              {/* Selo Site Seguro — Google Transparency Report */}
              <a
                href="https://transparencyreport.google.com/safe-browsing/search?url=versiory.store"
                target="_blank"
                rel="noopener noreferrer"
                title="Verificar segurança deste site no Google Transparency Report"
                className="inline-flex items-center gap-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity active:scale-95 drop-shadow-lg"
                style={{ height: '48px', textDecoration: 'none' }}
              >
                {/* Escudo verde */}
                <div style={{ background: '#22c55e', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 6v5c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V6l-9-4z" fill="white" fillOpacity="0.9"/>
                    <path d="M9 12l2.5 2.5L15.5 9.5" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Texto */}
                <div style={{ background: 'linear-gradient(90deg,#1e1e1e,#2d2d2d)', padding: '0 14px', height: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em', lineHeight: 1.2 }}>SITE SEGURO</span>
                  <span style={{ color: '#9ca3af', fontSize: '9px', lineHeight: 1.3, marginTop: '2px' }}>Este site é seguro conforme<br/>Google Transparency Report</span>
                </div>
              </a>
              <p>© {new Date().getFullYear()} Versiory Store. Todos os direitos reservados. | <span className="font-bold">Versão 1.1.0</span></p>
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
              <LoginRegister
                onClose={() => setIsProfileOpen(false)}
                onLoginSuccess={(email, address) => {
                  setIsAuthenticated(true);
                  setCurrentUserEmail(email);
                  setCurrentUserAddress(address);
                  setIsProfileOpen(false);
                  setToastMessage('Login realizado com sucesso!');
                  setTimeout(() => setToastMessage(''), 3000);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
