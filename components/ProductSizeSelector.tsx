import React, { useState } from 'react';
import { Product } from '../types';

interface ProductSizeSelectorProps {
  product: Product;
  selectedSize?: string;
  onSizeSelect: (size: string) => void;
}

const ProductSizeSelector: React.FC<ProductSizeSelectorProps> = ({
  product,
  selectedSize,
  onSizeSelect
}) => {
  if (!product.sizes || !product.stockBySize) {
    return null;
  }

  const availableSizes = product.sizes.split(',').map(s => s.trim()).filter(s => s);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-white uppercase tracking-wide">
        Selecione o Tamanho:
      </label>
      <div className="grid grid-cols-3 gap-2">
        {availableSizes.map(size => {
          let currentStock = 0;
          if (product.colors && product.stockBySizeColor) {
            // If product has colors, sum up stock across all colors for this size
            product.colors.split(',').forEach(color => {
              currentStock += product.stockBySizeColor?.[`${size}-${color.trim()}`] || 0;
            });
          } else {
            currentStock = product.stockBySize?.[size] || 0;
          }
          const isAvailable = currentStock > 0;
          const isSelected = selectedSize === size;
          
          return (
            <button
              key={size}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSizeSelect(size)}
              className={`
                px-3 py-2.5 rounded-lg border-2 font-bold text-sm transition-all relative
                ${isSelected 
                  ? 'border-versiory-coral bg-versiory-coral text-white shadow-lg scale-105' 
                  : isAvailable
                    ? 'border-white/30 bg-white/10 text-white hover:border-versiory-coral hover:bg-white/20'
                    : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed line-through'
                }
              `}
            >
              <div className="text-center">
                <div className="text-base font-black">{size}</div>
                <div className={`text-[10px] font-medium mt-0.5 ${
                  isSelected ? 'text-white' : isAvailable ? 'text-green-300' : 'text-red-300'
                }`}>
                  {isAvailable ? `${currentStock} disp` : 'Esgotado'}
                </div>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-versiory-coral" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {!selectedSize && (
        <div className="text-xs text-yellow-300 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Selecione um tamanho para adicionar
        </div>
      )}
      
      {selectedSize && (
        <div className="text-xs text-green-300 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Tamanho {selectedSize} selecionado ({product.stockBySize?.[selectedSize] || 0} disponíveis)
        </div>
      )}
    </div>
  );
};

export default ProductSizeSelector;