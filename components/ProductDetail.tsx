import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/firebase';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');
  const [allImages, setAllImages] = useState<string[]>([]);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const products = await getProducts();
        const found = products.find((p: Product) => String(p.id) === String(id));
        setProduct(found || null);
        if (found) {
          const imgs = [found.image, ...(found.images || [])].filter(Boolean);
          setAllImages(imgs);
          setActiveImage(found.image);
          if (found.sizes && found.sizes.length > 0) {
            setSelectedSize(found.sizes[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-versiory-coral rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Produto não encontrado</h2>
        <p className="text-slate-500 mb-6">O item que você está procurando pode ter sido removido ou o link está incorreto.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-versiory-coral text-white px-8 py-3 rounded-full font-bold hover:bg-[#ff8368] transition-colors"
        >
          Voltar para a Loja
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    const event = new CustomEvent('addToCart', { detail: { product } });
    window.dispatchEvent(event);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Simulate opening the cart immediately
    const cartBtn = document.querySelector('[aria-label="Abrir carrinho"]') as HTMLButtonElement;
    if (cartBtn) cartBtn.click();
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex text-sm text-slate-500 mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button onClick={() => navigate('/')} className="hover:text-versiory-coral transition-colors">Loja</button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <span className="ml-1 md:ml-2">{product.category}</span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <span className="ml-1 md:ml-2 text-slate-700 truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 p-6 lg:p-12">

            {/* Left Column: Images */}
            <div className="mb-8 lg:mb-0">
              <div className="sticky top-24">
                <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-4 group">
                  <img
                    src={activeImage || product.image}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Thumbnails */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                  {allImages.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setActiveImage(img)}
                      className={`aspect-square rounded-xl border-2 p-1 cursor-pointer transition-all ${activeImage === img ? 'border-versiory-coral scale-110 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                      <img src={img} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover rounded-lg mix-blend-multiply" />
                    </div>
                  ))}
                </div>
              </div>
            </div>


            {/* Right Column: Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-2">
                  {product.name}
                </h1>

                {/* Review Stars */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <a href="#reviews" className="text-sm text-blue-600 hover:text-versiory-coral hover:underline font-medium">
                    (496 avaliações de clientes)
                  </a>
                </div>

                <div className="w-full h-px bg-slate-100 my-6"></div>

                {/* Price block */}
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-500 mb-2 tracking-wide">R$</span>
                    <span className="text-5xl font-black text-slate-900">
                      {Math.floor(product.price)}
                    </span>
                    <span className="text-xl font-bold text-slate-900 mb-2">
                      ,{Math.round((product.price % 1) * 100).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Em até <strong className="text-slate-900">12x de R$ {(product.price / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> sem juros
                  </p>
                </div>

                {/* Shipping & Stock */}
                <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-3 text-emerald-600 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Frete Grátis para todo o Brasil</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span>
                      Estoque disponível: <strong className={product.stock === 0 ? "text-red-500" : "text-emerald-600"}>{product.stock ?? 0} unidades</strong>
                    </span>
                  </div>
                </div>

                {/* Variations */}
                {product.sizes && product.sizes.trim().length > 0 && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-900">Tamanho: <span className="text-slate-500 font-normal">{selectedSize}</span></span>
                      {product.sizeChart && Object.keys(product.sizeChart).length > 0 && (
                        <a href="#medidas" className="text-sm text-blue-600 hover:underline">Guia de tamanhos</a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.split(',').map(s => s.trim()).filter(s => s).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[3rem] px-4 py-2 border-2 rounded-xl font-bold transition-all ${selectedSize === size
                            ? 'border-versiory-coral text-versiory-coral bg-[#fff6ef]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Régua de Medição (Tabela) */}
                {product.sizeChart && Object.keys(product.sizeChart).length > 0 && (
                  <div id="medidas" className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Guia de Medidas (cm)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-center border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="py-2 px-2 text-left text-slate-500 font-medium">Tamanho</th>
                            {['chest', 'waist', 'hip', 'length', 'width'].map(key => {
                              const labels: Record<string, string> = { chest: 'Peito', waist: 'Cintura', hip: 'Quadril', length: 'Compr.', width: 'Largura' };
                              const hasData = Object.values(product.sizeChart!).some(m => m[key as keyof typeof m]);
                              if (!hasData) return null;
                              return <th key={key} className="py-2 px-2 text-slate-500 font-medium">{labels[key]}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {product.sizes?.split(',').map(s => s.trim()).filter(s => s).map(size => {
                            const measures = product.sizeChart![size];
                            if (!measures) return null;
                            return (
                              <tr key={size} className={selectedSize === size ? "bg-white/60" : ""}>
                                <td className="py-2 px-2 text-left font-bold text-slate-900">{size}</td>
                                {['chest', 'waist', 'hip', 'length', 'width'].map(key => {
                                  if (!Object.values(product.sizeChart!).some(m => m[key as keyof typeof m])) return null;
                                  return <td key={key} className="py-2 px-2 text-slate-600">{measures[key as keyof typeof measures] || '-'}</td>;
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}


              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full flex items-center justify-center gap-2 bg-[#ffeedb] text-amber-900 border-2 border-[#ffdca1] hover:bg-[#ffe3bc] py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Adicionar ao Carrinho
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-versiory-coral/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comprar Agora
                </button>
              </div>

              {/* Secure Info */}
              <div className="mt-8 flex items-center justify-center sm:justify-start gap-6 text-sm text-slate-500 font-medium">
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Pagamento Seguro</span>
                </div>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Compra Garantida</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Product Specs / About */}
        <div className="mt-12 bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Sobre este item</h2>
          <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-li:text-slate-600 prose-li:marker:text-versiory-coral">
            <ul className="space-y-4">
              {product.description.split('\n').filter(line => line.trim() !== '').map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Simple specs table (Mocked for layout purpose) */}
          <div className="mt-10 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Detalhes Técnicos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">Marca</span>
                <span className="text-slate-600">Versiory</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">Categoria</span>
                <span className="text-slate-600">{product.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">Disponibilidade</span>
                <span className="text-slate-600">Pronta Entrega</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">Garantia</span>
                <span className="text-slate-600">90 dias da fábrica</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
