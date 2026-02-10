
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  return (
    <div className="group relative bg-versiory-ivory rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-[#ece1d3] flex flex-col h-full">
      <div 
        className="aspect-[4/5] overflow-hidden cursor-pointer relative"
        onClick={() => onViewDetails(product)}
      >
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
        />
        <div className="absolute top-4 left-4">
          <div className="bg-[#fff6ed]/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-slate-900 shadow-sm uppercase tracking-tighter">
            {product.category}
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <div className="bg-versiory-ink text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            Frete Gratis
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 
            className="text-xl font-black text-slate-900 leading-tight cursor-pointer hover:text-versiory-coral transition-colors"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center text-amber-500 text-xs font-black mb-4 gap-1">
          <span>★</span>
          <span className="text-slate-500">{product.rating}</span>
          <span className="text-slate-300 ml-1 font-medium">({product.reviews})</span>
        </div>
        
        <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
          {product.description}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Preço Premium</span>
            <span className="text-2xl font-black text-slate-900">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <button 
            onClick={() => onAddToCart(product)}
            className="bg-versiory-ink hover:bg-versiory-coral text-white p-4 rounded-2xl shadow-xl shadow-black/10 transition-all active:scale-90 group/btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover/btn:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
