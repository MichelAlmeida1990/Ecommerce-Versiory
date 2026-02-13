
import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Category } from './types';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import ProductModal from './components/ProductModal';
import ChatWidget from './components/ChatWidget';
import CustomerOrders from './components/CustomerOrders';

const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileMode, setProfileMode] = useState<'login' | 'signup'>('login');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [currentUserAddress, setCurrentUserAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimeoutId, setToastTimeoutId] = useState<number | null>(null);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);

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

  useEffect(() => {
    const savedUser = localStorage.getItem('versiory_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as { email?: string; address?: string };
      if (parsed.email) {
        setIsAuthenticated(true);
        setCurrentUserEmail(parsed.email);
        setCurrentUserAddress(parsed.address || '');
      }
    }
  }, []);

  const handleProfileOpen = () => {
    setIsProfileOpen(true);
    setProfileError('');
  };

  const handleProfileClose = () => {
    setIsProfileOpen(false);
    setProfileError('');
  };

  const handleProfileLogin = () => {
    const savedUser = localStorage.getItem('versiory_user');
    if (!savedUser) {
      setProfileError('Nenhuma conta encontrada. Crie sua conta primeiro.');
      return;
    }

    const parsed = JSON.parse(savedUser) as { email?: string; password?: string; address?: string };
    if (parsed.email === profileEmail && parsed.password === profilePassword) {
      setIsAuthenticated(true);
      setCurrentUserEmail(parsed.email || '');
      setCurrentUserAddress(parsed.address || '');
      setProfileError('');
      setProfilePassword('');
      setIsProfileOpen(false);
      return;
    }

    setProfileError('E-mail ou senha invalidos.');
  };

  const handleProfileSignup = () => {
    const trimmedEmail = profileEmail.trim();
    const trimmedAddress = profileAddress.trim();
    if (!trimmedEmail || !profilePassword) {
      setProfileError('Preencha e-mail e senha.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileError('Informe um e-mail valido.');
      return;
    }

    if (profilePassword.length < 6) {
      setProfileError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (!trimmedAddress) {
      setProfileError('Informe o endereco para envio.');
      return;
    }

    const newUser = { email: trimmedEmail, password: profilePassword, address: trimmedAddress };
    localStorage.setItem('versiory_user', JSON.stringify(newUser));
    setIsAuthenticated(true);
    setCurrentUserEmail(trimmedEmail);
    setCurrentUserAddress(trimmedAddress);
    setProfileError('');
    setProfilePassword('');
    setProfileAddress('');
    setIsProfileOpen(false);
  };

  const handleProfileLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setCurrentUserAddress('');
    setIsEditingAddress(false);
    setAddressDraft('');
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
    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
    }
    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);
    setToastTimeoutId(timeoutId);
  };

  const handleEditAddress = () => {
    setAddressDraft(currentUserAddress);
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    const trimmed = addressDraft.trim();
    if (!trimmed) {
      setProfileError('Informe o endereco para envio.');
      return;
    }

    const savedUser = localStorage.getItem('versiory_user');
    if (!savedUser) {
      setProfileError('Conta nao encontrada.');
      return;
    }

    const parsed = JSON.parse(savedUser) as { email?: string; password?: string; address?: string };
    const updated = { ...parsed, address: trimmed };
    localStorage.setItem('versiory_user', JSON.stringify(updated));
    setCurrentUserAddress(trimmed);
    setIsEditingAddress(false);
    setProfileError('');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, products]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setToastMessage(`${product.name} adicionado ao carrinho!`);
    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
    }
    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 2200);
    setToastTimeoutId(timeoutId);
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const handleRemoveFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const categories: Category[] = ['Todos', 'Eletrônicos', 'Moda', 'Casa', 'Esportes'];
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 selection:bg-[#ffd7c8]">
      <Header 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onProfileClick={handleProfileOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-28">
        {/* Hero Section - Versiory Dark Mode Style */}
        <section className="relative h-64 sm:h-80 md:h-[450px] rounded-[2rem] md:rounded-[3rem] overflow-hidden mb-8 md:mb-12 bg-versiory-gradient shadow-2xl shadow-black/10 group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[2s] pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 md:px-20 text-white z-10 fade-up">
            <span className="text-versiory-gold font-black uppercase tracking-[0.3em] text-sm mb-4">Novo Drop Versiory</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 leading-none max-w-2xl font-display">
              Seu Estilo, <br/>
              <span className="text-versiory-accent">Seu Sucesso.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 md:mb-10 max-w-lg leading-relaxed font-medium">
              Transformando ideias em realidade através de produtos selecionados com precisão de diamante.
            </p>
            <div className="flex gap-3 sm:gap-4 -mt-2 sm:mt-0">
              <button
                onClick={() => scrollToId('product-grid')}
                className="bg-versiory-coral text-white px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-base md:px-10 md:py-4 rounded-2xl font-black hover:bg-[#ff8368] transition-all shadow-xl shadow-black/10 hover:-translate-y-1 active:scale-95"
              >
                Comprar Agora
              </button>
              <button
                onClick={() => scrollToId('category-scroll')}
                className="border-2 border-white/30 backdrop-blur-md text-white px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-base md:px-10 md:py-4 rounded-2xl font-black hover:bg-white/10 transition-all active:scale-95"
              >
                Ver Lookbook
              </button>
            </div>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-versiory-coral rounded-full blur-[120px] opacity-20 float-slow pointer-events-none"></div>
          <div className="absolute -top-20 right-20 w-64 h-64 bg-versiory-teal rounded-full blur-[100px] opacity-15 float-slow pointer-events-none"></div>
        </section>

        {/* Categories Scroller */}
        <div id="category-scroll" className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all border-2 ${
                activeCategory === cat 
                ? 'bg-versiory-ink text-white border-versiory-ink shadow-xl shadow-black/10 scale-105' 
                : 'bg-blue-50 text-slate-500 hover:text-slate-700 border-blue-200 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
                onViewDetails={setSelectedProduct}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="text-6xl mb-6">💎</div>
              <h3 className="text-2xl font-black text-slate-800">Buscando o sucesso...</h3>
              <p className="text-slate-400 mt-2 font-medium">Nenhum diamante encontrado nesta categoria hoje.</p>
              <button 
                onClick={() => setActiveCategory('Todos')}
                className="mt-8 text-versiory-coral font-bold hover:underline"
              >
                Voltar para todos os itens
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-24 bg-versiory-ink text-white py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M36 20 H64 L50 43 L36 20 Z" fill="#0f172a" />
                <path d="M12 35 L30 18 L32 40 L12 35 Z" fill="#6b8f71" />
                <path d="M88 35 L70 18 L68 40 L88 35 Z" fill="#f3b45c" />
                <path d="M22 46 L47 48 L50 88 L22 46 Z" fill="#ff6b4a" />
                <path d="M78 46 L53 48 L50 88 L78 46 Z" fill="#1b9aaa" />
              </svg>
              <h2 className="text-3xl font-black tracking-tighter font-display">VersioryStore</h2>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              Transformando ideias em sucesso. A curadoria definitiva para quem não aceita nada menos que o melhor.
            </p>
            <div className="flex gap-4">
              {['fb', 'ig', 'tw', 'li'].map(social => (
                <div key={social} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 cursor-pointer transition-colors border border-slate-700">
                  <span className="text-[10px] font-bold uppercase">{social}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-versiory-coral rounded-full"></span>
              Categorias
            </h3>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li className="hover:text-white transition-colors cursor-pointer">Eletrônicos de Elite</li>
              <li className="hover:text-white transition-colors cursor-pointer">Moda Versiory</li>
              <li className="hover:text-white transition-colors cursor-pointer">Casa e Design</li>
              <li className="hover:text-white transition-colors cursor-pointer">Equipamentos Esportivos</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
               <span className="w-1 h-6 bg-versiory-teal rounded-full"></span>
              Suporte
            </h3>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li className="hover:text-white transition-colors cursor-pointer">Rastrear Pedido</li>
              <li className="hover:text-white transition-colors cursor-pointer">Políticas de Devolução</li>
              <li className="hover:text-white transition-colors cursor-pointer">Envio Global</li>
              <li className="hover:text-white transition-colors cursor-pointer">Centro de Sucesso</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-versiory-gold rounded-full"></span>
              Newsletter
            </h3>
            <p className="text-slate-400 mb-6 font-medium">Receba insights e ofertas exclusivas Versiory.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Seu melhor e-mail" className="flex-1 bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl focus:ring-2 ring-versiory-coral outline-none text-white font-medium" />
              <button className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-black/20 active:scale-95">GO</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm font-medium gap-4">
          <p>© 2024 Versiory Store. Transformando ideias em sucesso.</p>
          <div className="flex flex-wrap items-center gap-6 mt-2 md:mt-0">
            <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-white cursor-pointer transition-colors">Termos e Condições</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
            <a 
              href="/admin.html" 
              className="inline-flex items-center px-6 py-2 rounded-lg bg-versiory-coral/20 border border-versiory-coral text-versiory-coral hover:bg-versiory-coral hover:text-white transition-all font-bold"
              target="_self"
            >
              🔐 Acesso Restrito
            </a>
          </div>
        </div>
      </footer>

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        customerEmail={currentUserEmail}
        customerAddress={currentUserAddress}
        onOrderComplete={handleOrderComplete}
      />

      <ProductModal 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {isProfileOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={handleProfileClose}
          />
          <div className="relative w-full max-w-md bg-blue-50 border border-blue-200 rounded-3xl shadow-2xl p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-black text-slate-900">
                {isAuthenticated ? 'Seu perfil' : 'Entrar ou criar conta'}
              </h3>
              <button
                onClick={handleProfileClose}
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isAuthenticated ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-blue-50/80 border border-blue-200 px-4 py-3 text-slate-700">
                  <span className="text-sm text-slate-500">Logado como</span>
                  <div className="font-bold text-slate-900">{currentUserEmail}</div>
                </div>
                <div className="rounded-2xl bg-blue-50/80 border border-blue-200 px-4 py-3 text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Endereco para envio</span>
                    {!isEditingAddress && (
                      <button
                        onClick={handleEditAddress}
                        className="text-sm font-semibold text-versiory-coral hover:text-[#ff8368]"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  {isEditingAddress ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={addressDraft}
                        onChange={(event) => setAddressDraft(event.target.value)}
                        rows={3}
                        className="w-full bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 ring-[#ffe1d2]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveAddress}
                          className="flex-1 bg-versiory-ink hover:bg-[#1b2a3a] text-white py-2 rounded-2xl font-bold transition-all active:scale-[0.98]"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setIsEditingAddress(false)}
                          className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-2xl font-bold bg-blue-50/80 hover:bg-blue-100 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 font-bold text-slate-900 whitespace-pre-line">
                      {currentUserAddress || 'Nao informado'}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleOpenCustomerOrders}
                  className="w-full bg-versiory-teal hover:bg-[#1b9aaa] text-white py-3 rounded-2xl font-bold transition-all"
                >
                  📦 Meus Pedidos
                </button>
                <button
                  onClick={handleProfileLogout}
                  className="w-full border border-slate-200 text-slate-700 py-3 rounded-2xl font-bold bg-blue-50/80 hover:bg-blue-100 transition-colors"
                >
                  Sair da conta
                </button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-slate-600">
                  {profileMode === 'login'
                    ? 'Entre com seu e-mail e senha.'
                    : 'Crie uma conta para acompanhar pedidos e favoritos.'}
                </p>

                <div className="mt-6 space-y-4">
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    className="w-full bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 ring-[#ffe1d2]"
                  />
                  <input
                    type="password"
                    placeholder="Sua senha"
                    value={profilePassword}
                    onChange={(event) => setProfilePassword(event.target.value)}
                    className="w-full bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 ring-[#ffe1d2]"
                  />
                  {profileMode === 'signup' && (
                    <textarea
                      placeholder="Endereco para envio"
                      value={profileAddress}
                      onChange={(event) => setProfileAddress(event.target.value)}
                      rows={3}
                      className="w-full bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 ring-[#ffe1d2]"
                    />
                  )}
                </div>

                {profileError && (
                  <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                    {profileError}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleProfileLogin}
                    className="flex-1 bg-versiory-ink hover:bg-[#1b2a3a] text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98]"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={handleProfileSignup}
                    className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-2xl font-bold bg-blue-50/80 hover:bg-blue-100 transition-colors"
                  >
                    Criar conta
                  </button>
                </div>

                <button
                  onClick={() => setProfileMode(profileMode === 'login' ? 'signup' : 'login')}
                  className="mt-4 w-full text-sm font-semibold text-versiory-coral hover:text-[#ff8368]"
                >
                  {profileMode === 'login'
                    ? 'Nao tenho conta, quero criar'
                    : 'Ja tenho conta, quero entrar'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ChatWidget />

      <CustomerOrders
        customerEmail={currentUserEmail}
        isOpen={isCustomerOrdersOpen}
        onClose={handleCloseCustomerOrders}
      />

      {toastMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[80]">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
