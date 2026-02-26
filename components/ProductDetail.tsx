import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar produto por ID (mock ou API)
    // Substitua por chamada real à API
    const products = JSON.parse(localStorage.getItem('versiory_products') || '[]');
    const found = products.find((p: Product) => String(p.id) === String(id));
    setProduct(found || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Produto não encontrado</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-indigo-600 font-medium hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagem */}
        <div>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-auto rounded-xl object-cover"
          />
        </div>
        {/* Detalhes */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
          <p className="text-lg text-gray-700 mb-2">{product.description}</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-indigo-600">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mb-4">Estoque: {product.stock ?? 0}</p>
          <button
            onClick={() => {
              // Dispatch custom event for cart addition (handled by App.tsx)
              const event = new CustomEvent('addToCart', { detail: { product } });
              window.dispatchEvent(event);
            }}
            disabled={product.stock === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
