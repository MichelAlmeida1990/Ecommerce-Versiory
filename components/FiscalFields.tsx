import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getNCMsByCategory, NCMOption } from '../utils/ncmDatabase';

interface FiscalFieldsProps {
  productForm: Partial<Product>;
  onChange: (field: keyof Product, value: any) => void;
}

const FiscalFields: React.FC<FiscalFieldsProps> = ({ productForm, onChange }) => {
  const [ncmSuggestions, setNcmSuggestions] = useState<NCMOption[]>([]);
  const [showNCMHelper, setShowNCMHelper] = useState(false);

  useEffect(() => {
    if (productForm.category) {
      const suggestions = getNCMsByCategory(productForm.category);
      setNcmSuggestions(suggestions);
      
      // Auto-preencher NCM se estiver vazio
      if (!productForm.ncm && suggestions.length > 0) {
        onChange('ncm', suggestions[0].code);
      }
    }
  }, [productForm.category]);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm">📋</span>
          Dados Fiscais (NF-e)
        </h4>
        <button
          type="button"
          onClick={() => setShowNCMHelper(!showNCMHelper)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showNCMHelper ? '❌ Fechar ajuda' : '❓ O que é NCM?'}
        </button>
      </div>

      {showNCMHelper && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <p className="font-bold text-blue-900 mb-2">📚 NCM - Nomenclatura Comum do Mercosul</p>
          <p className="text-blue-800 mb-2">
            Código de 8 dígitos obrigatório para emissão de NF-e. Identifica a natureza da mercadoria para fins tributários.
          </p>
          <p className="text-blue-700 text-xs">
            💡 O sistema sugere NCMs automaticamente baseado na categoria. Consulte seu contador para confirmar o código correto.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            NCM * <span className="text-xs font-normal text-slate-500">(8 dígitos)</span>
          </label>
          {ncmSuggestions.length > 0 && (
            <select
              value={productForm.ncm || ''}
              onChange={e => onChange('ncm', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900 mb-2"
            >
              <option value="">Selecione um NCM sugerido</option>
              {ncmSuggestions.map(ncm => (
                <option key={ncm.code} value={ncm.code}>
                  {ncm.code} - {ncm.description}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={productForm.ncm || ''}
            onChange={e => onChange('ncm', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
            placeholder="Ex: 6110.20.00"
            maxLength={10}
          />
          {productForm.ncm && productForm.ncm.length !== 8 && productForm.ncm.length !== 10 && (
            <p className="text-xs text-red-600 mt-1">⚠️ NCM deve ter 8 dígitos (ex: 6110.20.00)</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              CFOP * <span className="text-xs font-normal text-slate-500">(Código Fiscal)</span>
            </label>
            <select
              value={productForm.cfop || '5102'}
              onChange={e => onChange('cfop', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
            >
              <option value="5102">5102 - Venda dentro do estado</option>
              <option value="6102">6102 - Venda fora do estado</option>
              <option value="5405">5405 - Venda de prod. adquirido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              CST * <span className="text-xs font-normal text-slate-500">(Situação Tributária)</span>
            </label>
            <select
              value={productForm.cst || '00'}
              onChange={e => onChange('cst', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
            >
              <option value="00">00 - Tributada integralmente</option>
              <option value="20">20 - Com redução de base</option>
              <option value="40">40 - Isenta</option>
              <option value="41">41 - Não tributada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Origem *</label>
            <select
              value={productForm.origem ?? 0}
              onChange={e => onChange('origem', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
            >
              <option value="0">0 - Nacional</option>
              <option value="1">1 - Estrangeira (importação direta)</option>
              <option value="2">2 - Estrangeira (mercado interno)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Unidade *</label>
            <select
              value={productForm.unidade || 'UN'}
              onChange={e => onChange('unidade', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
            >
              <option value="UN">UN - Unidade</option>
              <option value="PC">PC - Peça</option>
              <option value="KG">KG - Quilograma</option>
              <option value="MT">MT - Metro</option>
              <option value="CX">CX - Caixa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Peso (kg) <span className="text-xs font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={productForm.peso || ''}
              onChange={e => onChange('peso', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
              placeholder="0.000"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-800">
            <strong>💡 Dica:</strong> Estes dados são obrigatórios para emissão de NF-e. 
            O NCM foi sugerido automaticamente baseado na categoria "{productForm.category}". 
            Consulte sempre seu contador para confirmar os códigos corretos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FiscalFields;
