
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedSize?: string, selectedColor?: string) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    let hasError = false;
    
    if (product.sizes && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      hasError = true;
    }
    
    if (product.colors && !selectedColor) {
      setColorError(true);
      setTimeout(() => setColorError(false), 2000);
      hasError = true;
    }
    
    if (hasError) return;
    
    onAddToCart(product, selectedSize, selectedColor);
    onClose();
  };

  const getStockForSizeColor = (size: string, color: string) => {
    if (!product.stockBySizeColor) return 0;
    const key = `${size}-${color}`;
    return product.stockBySizeColor[key] || 0;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-blue-50 border border-blue-200 w-full max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-blue-50/80 p-2 rounded-full hover:bg-blue-100 shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="lg:w-1/2 h-48 sm:h-64 md:h-80 lg:h-auto">
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
            <h3 className="text-xl font-bold text-white mb-3">Sobre este produto</h3>
            <p className="leading-relaxed text-base text-white">
              {product.description}
            </p>
          </div>

          {product.sizes && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">📏 Selecione o Tamanho</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.split(',').map(size => {
                  const trimmedSize = size.trim();
                  let sizeStock = 0;
                  
                  if (product.colors && product.stockBySizeColor) {
                    // Se tem cores, soma estoque de todas as cores para este tamanho
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
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        isSelected
                          ? 'bg-versiory-coral text-white shadow-lg scale-105'
                          : isAvailable
                          ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-versiory-coral'
                          : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                      }`}
                    >
                      {trimmedSize}
                    </button>
                  );
                })}
              </div>
              {sizeError && (
                <p className="text-red-500 font-bold mt-2 animate-pulse">⚠️ Selecione um tamanho</p>
              )}
            </div>
          )}

          {product.colors && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">🎨 Selecione a Cor</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.split(',').map(color => {
                  const trimmedColor = color.trim();
                  let colorStock = 0;
                  
                  if (selectedSize && product.stockBySizeColor) {
                    colorStock = getStockForSizeColor(selectedSize, trimmedColor);
                  } else if (product.sizes && product.stockBySizeColor) {
                    // Soma estoque de todos os tamanhos para esta cor
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
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        isSelected
                          ? 'bg-versiory-coral text-white shadow-lg scale-105'
                          : isAvailable
                          ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-versiory-coral'
                          : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                      }`}
                    >
                      {trimmedColor}
                      {isAvailable && selectedSize && <span className="text-xs ml-1">({colorStock})</span>}
                    </button>
                  );
                })}
              </div>
              {colorError && (
                <p className="text-red-500 font-bold mt-2 animate-pulse">⚠️ Selecione uma cor</p>
              )}
            </div>
          )}

          <div className="flex gap-4 sticky bottom-0 bg-blue-50 pt-4">
            <button 
              onClick={handleAddToCart}
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
