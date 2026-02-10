
import React from 'react';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DiamondLogo = () => (
  <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top Center Facet - Dark Blue (Escuro) */}
    <path d="M36 20 H64 L50 43 L36 20 Z" fill="#0f172a" />
    
    {/* Top Left Facet - Green (Verde) */}
    <path d="M12 35 L30 18 L32 40 L12 35 Z" fill="#6b8f71" />
    
    {/* Top Right Facet - Yellow (Amarelo) */}
    <path d="M88 35 L70 18 L68 40 L88 35 Z" fill="#f3b45c" />
    
    {/* Bottom Left Facet - Purple (Roxo) */}
    <path d="M22 46 L47 48 L50 88 L22 46 Z" fill="#ff6b4a" />
    
    {/* Bottom Right Facet - Cyan (Ciano) */}
    <path d="M78 46 L53 48 L50 88 L78 46 Z" fill="#1b9aaa" />
    
    {/* Subtle glow/shadow for depth */}
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick, searchQuery, onSearchChange }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fff7ef]/90 backdrop-blur-xl border-b border-[#eadfce] h-20 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex items-center justify-between gap-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="transition-transform group-hover:scale-110 duration-500">
            <DiamondLogo />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none font-display">VersioryStore</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Transformando ideias em sucesso</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <input 
            type="text" 
            placeholder="Qual o seu próximo passo para o sucesso?" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/70 border border-[#eadfce] rounded-2xl py-3 px-12 focus:bg-white focus:ring-4 ring-[#ffe1d2] outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-3 text-slate-500 hover:bg-[#fff1e5] rounded-2xl transition-colors md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <button className="p-3 text-slate-500 hover:bg-[#fff1e5] rounded-2xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <button 
            onClick={onCartClick}
            className="relative p-3 bg-versiory-ink text-white rounded-2xl shadow-lg hover:shadow-black/20 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline font-bold pr-1">Carrinho</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-versiory-coral text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
