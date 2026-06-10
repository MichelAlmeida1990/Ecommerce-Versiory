import React from 'react';
import { Product } from '../types';

interface MarketplaceFieldsProps {
  formData: Partial<Product>;
  setFormData: (data: any) => void;
}

const MarketplaceFields: React.FC<MarketplaceFieldsProps> = ({ formData, setFormData }) => {
  return (
    <div className="bg-blue-50/50 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 space-y-4 mt-6">
      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
        <span className="text-2xl">🌐</span> Integração Marketplace
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID Mercado Livre (MLB)</label>
          <input
            type="text"
            value={formData.mlId || ''}
            onChange={(e) => setFormData({ ...formData, mlId: e.target.value })}
            placeholder="Ex: MLB123456789"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-versiory-coral text-slate-900"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID Shopee</label>
          <input
            type="text"
            value={formData.shopeeId || ''}
            onChange={(e) => setFormData({ ...formData, shopeeId: e.target.value })}
            placeholder="Ex: 23456789"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-versiory-coral text-slate-900"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Diferenciado Marketplace (R$)</label>
          <input
            type="number"
            value={formData.priceMarketplace || ''}
            onChange={(e) => setFormData({ ...formData, priceMarketplace: parseFloat(e.target.value) })}
            placeholder="0,00"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-versiory-coral text-slate-900 font-bold"
          />
          <p className="text-[10px] text-slate-400 mt-1 italic">
            * Use este campo para cobrir comissões sem alterar o preço da loja física ou e-commerce.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFields;