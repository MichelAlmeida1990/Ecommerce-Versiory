
import React from 'react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-versiory-ivory w-full max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="lg:w-1/2 h-64 sm:h-80 lg:h-auto">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="lg:w-1/2 p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#fff1e7] text-versiory-coral text-sm font-bold rounded-full uppercase tracking-widest">
              {product.category}
            </span>
            <div className="flex items-center text-amber-500">
              <span className="text-base">★</span>
              <span className="text-base font-bold ml-1">{product.rating}</span>
              <span className="text-slate-400 text-sm ml-1">({product.reviews} avaliações)</span>
            </div>
          </div>

          <h2 className="text-4xl font-black text-slate-800 mb-4">{product.name}</h2>
          
          <div className="text-5xl font-black text-versiory-coral mb-6">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>

          <div className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
            <h3 className="text-xl font-bold">Sobre este produto</h3>
            <p className="mt-3 leading-relaxed text-base text-white/90">
              {product.description}
            </p>
          </div>

          <div className="flex gap-4 sticky bottom-0 bg-versiory-ivory pt-4">
            <button 
              onClick={() => onAddToCart(product)}
              className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-bold py-4 rounded-2xl shadow-xl shadow-black/10 transition-all active:scale-[0.98] text-base"
            >
              Adicionar ao Carrinho
            </button>
            <button className="p-4 border-2 border-[#f1e2d5] rounded-2xl hover:bg-[#fff1e7] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
