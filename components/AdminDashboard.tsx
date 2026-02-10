import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface AdminDashboardProps {
  products: Product[];
  onLogout: () => void;
  onUpdateProducts: (products: Product[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, 
  onLogout, 
  onUpdateProducts 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'Eletrônicos',
    image: '',
    description: '',
    rating: 0,
    reviews: 0
  });

  const baseCategories = ['Eletrônicos', 'Moda', 'Casa', 'Esportes'];
  const categories = Array.from(
    new Set([...baseCategories, ...products.map(product => product.category)])
  );

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      category: 'Eletrônicos',
      image: '',
      description: '',
      rating: 0,
      reviews: 0
    });
    setIsCustomCategory(false);
    setCustomCategory('');
    setEditingProduct(null);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setFormData(product);
      setEditingProduct(product);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCategory = isCustomCategory ? customCategory.trim() : (formData.category || '').toString();
    if (!trimmedCategory) {
      window.alert('Informe a categoria do produto.');
      return;
    }

    if (!formData.image) {
      window.alert('Envie uma imagem do produto.');
      return;
    }

    const payload: Product = {
      ...formData as Product,
      category: trimmedCategory
    };
    
    if (editingProduct) {
      // Editar produto existente
      const updatedProducts = products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...payload }
          : p
      );
      onUpdateProducts(updatedProducts);
    } else {
      // Adicionar novo produto
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id)) + 1,
        ...payload
      };
      onUpdateProducts([...products, newProduct]);
    }
    
    closeModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      onUpdateProducts(updatedProducts);
    }
  };

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
      return;
    }

    setIsCustomCategory(false);
    setCustomCategory('');
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData(prev => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-versiory-ink text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-versiory-coral rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36 20 H64 L50 43 L36 20 Z" fill="white" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black">Painel Administrativo</h1>
                <p className="text-gray-400 text-sm">Versiory Store</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-medium transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-black text-versiory-coral">{products.length}</div>
            <div className="text-gray-600 font-medium">Total Produtos</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-black text-versiory-teal">
              {products.filter(p => p.category === 'Eletrônicos').length}
            </div>
            <div className="text-gray-600 font-medium">Eletrônicos</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-black text-versiory-gold">
              {products.filter(p => p.category === 'Moda').length}
            </div>
            <div className="text-gray-600 font-medium">Moda</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl font-black text-purple-500">
              {products.reduce((acc, p) => acc + p.reviews, 0)}
            </div>
            <div className="text-gray-600 font-medium">Total Avaliações</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900">Gerenciar Produtos</h2>
          <button
            onClick={() => openModal()}
            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg hover:-translate-y-1 active:scale-95"
          >
            + Novo Produto
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Avaliação</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{product.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-versiory-ivory text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                        <span className="text-yellow-400 ml-1">★</span>
                        <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openModal(product)}
                          className="bg-versiory-coral hover:bg-[#ff8368] text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-all min-h-[44px]"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-black text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={isCustomCategory ? '__new__' : formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__new__">Nova categoria...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Imagem do Produto
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  />
                  {formData.image && (
                    <div className="mt-3">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Avaliação (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Nº de Avaliações
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reviews}
                    onChange={(e) => handleInputChange('reviews', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                  required
                />
              </div>

              {isCustomCategory && (
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    Nova Categoria
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none"
                    placeholder="Ex.: Beleza"
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-3 rounded-xl transition-all shadow-lg hover:-translate-y-1 active:scale-95"
                >
                  {editingProduct ? 'Atualizar Produto' : 'Criar Produto'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
