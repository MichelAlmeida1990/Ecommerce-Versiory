
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useIsFavorite } from '../utils/favorites';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedSize?: string, selectedColor?: string) => void;
  onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showSizeError, setShowSizeError] = useState(false);
  const [showColorError, setShowColorError] = useState(false);
  // REFCOM214: Estado para controlar expansão das características do serviço
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [isFavorited, toggleFavorite] = useIsFavorite(product.id);

  const handleAddToCart = () => {
    const isService = product.category === 'Serviços';
    let hasError = false;

    // REFCOM216: Validação para produtos regulares
    if (!isService && product.sizes && !selectedSize) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 2000);
      hasError = true;
    }

    if (!isService && product.colors && !selectedColor) {
      setShowColorError(true);
      setTimeout(() => setShowColorError(false), 2000);
      hasError = true;
    }

    // REFCOM216: Validação para serviços - exigir tipo e horário se estiverem definidos
    if (isService && product.sizes && !selectedSize) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 2000);
      hasError = true;
    }

    if (isService && product.colors && !selectedColor) {
      setShowColorError(true);
      setTimeout(() => setShowColorError(false), 2000);
      hasError = true;
    }

    if (hasError) return;

    // REFCOM216: Validação de estoque para produtos e serviços
    let stock = product.stock || 0;
    if (selectedSize && selectedColor && product.stockBySizeColor) {
      stock = product.stockBySizeColor[`${selectedSize}-${selectedColor}`] || 0;
    } else if (selectedSize && product.stockBySize) {
      stock = product.stockBySize[selectedSize] || 0;
    }

    // REFCOM216: Validar estoque para serviços também
    if (stock <= 0) {
      alert('⚠️ Este item (nesta variação) está temporariamente sem estoque.');
      return;
    }

    // REFCOM216: Para serviços com tamanhos/cores definidos, passar os valores selecionados
    // Para serviços sem tamanhos/cores definidos, passar undefined
    const shouldPassSizeColor = isService ? (product.sizes || product.colors) : true;
    onAddToCart(
      product, 
      shouldPassSizeColor ? (selectedSize || undefined) : undefined, 
      shouldPassSizeColor ? (selectedColor || undefined) : undefined
    );
    setSelectedSize('');
    setSelectedColor('');
  };

  const getStockForSizeColor = (size: string, color: string) => {
    if (!product.stockBySizeColor) return 0;
    const key = `${size}-${color}`;
    return product.stockBySizeColor[key] || 0;
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:border-slate-200 flex flex-col h-full">
      <div
        className="aspect-square overflow-hidden cursor-pointer relative bg-slate-50"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badge de desconto */}
        {(() => {
          const price = product.priceEcommerce || product.price;
          if (product.priceEcommerce && product.priceEcommerce < product.price) {
            const pct = Math.round((1 - product.priceEcommerce / product.price) * 100);
            return (
              <span className="absolute top-3 left-3 bg-versiory-coral text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                -{pct}%
              </span>
            );
          }
          return null;
        })()}
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 shadow-sm uppercase tracking-wide">
            {product.category}
          </div>
        </div>
        {/* Favorito */}
        <button
          type="button"
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center transition-all ${isFavorited ? 'text-versiory-coral opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-versiory-coral'}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-base font-bold text-slate-900 leading-snug cursor-pointer hover:text-versiory-coral transition-colors line-clamp-2 min-h-[2.5rem]"
          onClick={() => onViewDetails(product)}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mt-1.5 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xs ${i < Math.round(product.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
          ))}
          <span className="text-[11px] text-slate-400 font-medium ml-1">({product.reviews})</span>
        </div>

        {product.category === 'Serviços' && product.serviceAttributes && (
          <div className="mb-3">
            <button
              onClick={() => setShowServiceDetails(!showServiceDetails)}
              className="text-[10px] font-bold uppercase tracking-widest text-versiory-coral hover:text-versiory-ink transition-colors text-left"
            >
              {showServiceDetails ? '▼ Menos detalhes' : '▶ Mais detalhes'}
            </button>
            {showServiceDetails && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-700 whitespace-pre-line">{product.serviceAttributes.caracteristicas || product.serviceAttributes.descricao || ''}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">
              R$ {(product.priceEcommerce || product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {product.priceEcommerce && product.priceEcommerce < product.price && (
              <span className="text-xs text-slate-400 line-through">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          {product.installments && product.installments > 1 && (
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              ou {product.installments}x de R$ {((product.priceEcommerce || product.price) / product.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onViewDetails(product)}
              className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-versiory-coral transition-colors text-center py-2"
            >
              Ver detalhes
            </button>
            <button
              onClick={() => onViewDetails(product)}
              className="flex-1 bg-versiory-ink hover:bg-versiory-coral text-white text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all active:scale-95 shadow-md"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
