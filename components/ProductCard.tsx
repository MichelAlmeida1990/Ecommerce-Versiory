
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedSize?: string, selectedColor?: string) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showSizeError, setShowSizeError] = useState(false);
  const [showColorError, setShowColorError] = useState(false);

  const handleAddToCart = () => {
    let hasError = false;
    
    if (product.sizes && !selectedSize) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 2000);
      hasError = true;
    }
    
    if (product.colors && !selectedColor) {
      setShowColorError(true);
      setTimeout(() => setShowColorError(false), 2000);
      hasError = true;
    }
    
    if (hasError) return;
    
    onAddToCart(product, selectedSize || undefined, selectedColor || undefined);
    setSelectedSize('');
    setSelectedColor('');
  };

  const getStockForSizeColor = (size: string, color: string) => {
    if (!product.stockBySizeColor) return 0;
    const key = `${size}-${color}`;
    return product.stockBySizeColor[key] || 0;
  };

  return (
    <div className="group relative bg-blue-50 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-blue-200 flex flex-col h-full">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
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
        
        <div className="mb-4 rounded-2xl bg-slate-900 p-4 text-white shadow-md">
          <p className="text-sm line-clamp-2 font-medium leading-relaxed text-white">
            {product.description}
          </p>
        </div>

        {product.sizes && (
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-700 mb-2 block">Tamanho:</label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.split(',').map(size => {
                const trimmedSize = size.trim();
                let sizeStock = 0;
                
                if (product.colors && product.stockBySizeColor) {
                  product.colors.split(',').forEach(color => {
                    sizeStock += getStockForSizeColor(trimmedSize, color.trim());
                  });
                } else {
                  sizeStock = product.stockBySize?.[trimmedSize] || 0;
                }
                
                const isAvailable = sizeStock > 0;
                const isSelected = selectedSize === trimmedSize;
                
                return (
                  <button
                    key={trimmedSize}
                    onClick={() => isAvailable && setSelectedSize(trimmedSize)}
                    disabled={!isAvailable}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-versiory-coral text-white ring-2 ring-versiory-coral ring-offset-2'
                        : isAvailable
                        ? 'bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {trimmedSize}
                  </button>
                );
              })}
            </div>
            {showSizeError && (
              <p className="text-xs text-red-600 font-bold mt-2 animate-pulse">
                ⚠️ Selecione um tamanho
              </p>
            )}
          </div>
        )}

        {product.colors && (
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-700 mb-2 block">Cor:</label>
            <div className="flex flex-wrap gap-2">
              {product.colors.split(',').map(color => {
                const trimmedColor = color.trim();
                let colorStock = 0;
                
                if (selectedSize && product.stockBySizeColor) {
                  colorStock = getStockForSizeColor(selectedSize, trimmedColor);
                } else if (product.sizes && product.stockBySizeColor) {
                  product.sizes.split(',').forEach(size => {
                    colorStock += getStockForSizeColor(size.trim(), trimmedColor);
                  });
                }
                
                const isAvailable = colorStock > 0;
                const isSelected = selectedColor === trimmedColor;
                
                return (
                  <button
                    key={trimmedColor}
                    onClick={() => isAvailable && setSelectedColor(trimmedColor)}
                    disabled={!isAvailable}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-versiory-coral text-white ring-2 ring-versiory-coral ring-offset-2'
                        : isAvailable
                        ? 'bg-white text-slate-900 hover:bg-slate-100 border-2 border-slate-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {trimmedColor}
                  </button>
                );
              })}
            </div>
            {showColorError && (
              <p className="text-xs text-red-600 font-bold mt-2 animate-pulse">
                ⚠️ Selecione uma cor
              </p>
            )}
          </div>
        )}
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Preço Premium</span>
            <span className="text-2xl font-black text-slate-900">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <button 
            onClick={handleAddToCart}
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
