import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderLogo from './HeaderLogo';
import { Product } from '../types';

interface HeaderProps {
  onCartClick: () => void;
  onProfileClick: () => void;
  cartCount: number;
  isAuthenticated?: boolean;
  userEmail?: string;
  onLogout?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  products?: Product[];
}

const Header: React.FC<HeaderProps> = ({
  onCartClick,
  onProfileClick,
  cartCount,
  isAuthenticated,
  userEmail,
  onLogout,
  searchQuery,
  onSearchChange,
  products = []
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!products || q.length < 2) return [];
    return products
      .filter(p => p.active !== false && (p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [products, searchQuery]);

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fff7ef]/90 backdrop-blur-xl border-b border-[#eadfce] h-20 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex items-center justify-between gap-8">
        {/* Logo Section */}
        <a href="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="transition-transform group-hover:scale-110 duration-500">
            <HeaderLogo />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter leading-none font-display">VersioryStore</span>
            <span className="text-[10px] font-bold text-versiory-coral uppercase tracking-widest leading-none mt-1 opacity-80">Premium Digital Store</span>
          </div>
        </a>

        {/* Search Bar */}
        <div className={`hidden md:flex flex-1 max-w-xl relative group transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-versiory-coral transition-colors z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Qual o seu próximo passo para o sucesso?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            className="w-full bg-blue-50/70 border border-blue-200 rounded-2xl py-3 pl-12 pr-4 focus:bg-blue-50 focus:ring-4 ring-[#ffe1d2] outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium relative z-0"
          />

          {/* Autocomplete Suggestions Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-slate-50 bg-slate-50/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Sugestões de Produtos</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {searchSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      navigate(`/product/${item.id}`);
                      setIsSearchFocused(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left group/item"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-100 group-hover/item:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover/item:text-versiory-coral transition-colors">
                        {item.name}
                      </p>
                      <span className="text-[10px] font-medium text-slate-500">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 pr-2">
                      R$ {(item.priceEcommerce || item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Profile/Login */}
          <div className="relative">
            <button
              onClick={() => isAuthenticated ? setIsUserMenuOpen(!isUserMenuOpen) : onProfileClick()}
              className="p-2 text-slate-500 hover:bg-[#fff1e5] rounded-2xl transition-colors relative group"
              aria-label="Perfil"
            >
              {isAuthenticated ? (
                <div className="w-9 h-9 rounded-full bg-versiory-coral flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {userEmail?.[0].toUpperCase()}
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {isAuthenticated && isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="px-5 py-2 border-b border-gray-50 mb-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sua Conta</p>
                  <p className="text-sm font-bold text-gray-900 truncate mt-1">{userEmail}</p>
                </div>
                <button
                  onClick={() => { navigate('/account'); setIsUserMenuOpen(false); }}
                  className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-[#fff1e5] flex items-center gap-3 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Minha Conta
                </button>
                <button
                  onClick={() => { navigate('/account'); setIsUserMenuOpen(false); }}
                  className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-[#fff1e5] flex items-center gap-3 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Meus Pedidos
                </button>
                <div className="border-t border-gray-50 mt-2 pt-2">
                  <button
                    onClick={() => { onLogout?.(); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-bold transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Busca mobile */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-slate-500 hover:bg-[#fff1e5] rounded-2xl transition-colors"
            aria-label="Buscar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            onClick={onCartClick}
            className="relative p-3.5 sm:p-3 bg-versiory-ink text-white rounded-2xl shadow-lg hover:shadow-black/20 transition-all active:scale-95 flex items-center gap-2 group shrink-0 mr-1 sm:mr-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:block font-black text-sm tracking-tight">Sacola</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-versiory-coral text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#fff7ef] shadow-sm animate-in zoom-in duration-300">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
    {isMobileSearchOpen && (
      <div className="fixed top-20 left-0 right-0 z-30 bg-[#fff7ef]/95 backdrop-blur-xl border-b border-[#eadfce] p-4 md:hidden shadow-lg">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-blue-50/70 border border-blue-200 rounded-2xl py-3 pl-12 pr-4 focus:bg-blue-50 focus:ring-4 ring-[#ffe1d2] outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
          />

          {searchSuggestions.length > 0 && (
            <div className="mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
              {searchSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(`/product/${item.id}`);
                    setIsMobileSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-500">{item.category}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    R$ {(item.priceEcommerce || item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
