
import React, { useState, useMemo } from 'react';
import { PRODUCTS } from './constants';
import { Product, CartItem, Category } from './types';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import ProductModal from './components/ProductModal';
import ChatWidget from './components/ChatWidget';

const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-28">
        {/* Hero Section - Versiory Dark Mode Style */}
        <section className="relative h-64 md:h-[450px] rounded-[3rem] overflow-hidden mb-12 bg-versiory-gradient shadow-2xl shadow-black/10 group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[2s]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 text-white z-10 fade-up">
            <span className="text-versiory-gold font-black uppercase tracking-[0.3em] text-sm mb-4">Novo Drop Versiory</span>
            <h1 className="text-4xl md:text-7xl font-black mb-4 leading-none max-w-2xl font-display">
              Seu Estilo, <br/>
              <span className="text-versiory-accent">Seu Sucesso.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-lg leading-relaxed font-medium">
              Transformando ideias em realidade através de produtos selecionados com precisão de diamante.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => scrollToId('product-grid')}
                className="bg-versiory-coral text-white px-10 py-4 rounded-2xl font-black hover:bg-[#ff8368] transition-all shadow-xl shadow-black/10 hover:-translate-y-1 active:scale-95"
              >
                Comprar Agora
              </button>
              <button
                onClick={() => scrollToId('category-scroll')}
                className="border-2 border-white/30 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-black hover:bg-white/10 transition-all active:scale-95"
              >
                Ver Lookbook
              </button>
            </div>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-versiory-coral rounded-full blur-[120px] opacity-20 float-slow"></div>
          <div className="absolute -top-20 right-20 w-64 h-64 bg-versiory-teal rounded-full blur-[100px] opacity-15 float-slow"></div>
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
                : 'bg-versiory-ivory text-slate-500 hover:text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
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
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-16">
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
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm font-medium">
          <p>© 2024 Versiory Store. Transformando ideias em sucesso.</p>
          <div className="flex gap-8 mt-6 md:mt-0">
            <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-white cursor-pointer transition-colors">Termos e Condições</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
          </div>
        </div>
      </footer>

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
      />

      <ProductModal 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <ChatWidget />
    </div>
  );
};

export default App;
