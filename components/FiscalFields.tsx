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
  const [isManualNcm, setIsManualNcm] = useState(false);

  useEffect(() => {
    if (productForm.category) {
      const suggestions = getNCMsByCategory(productForm.category);
      setNcmSuggestions(suggestions);

      // Se houver sugestões e o NCM estiver vazio, marcamos como não manual inicialmente
      if (!productForm.ncm && suggestions.length > 0) {
        onChange('ncm', suggestions[0].code);
        setIsManualNcm(false);
      } else if (!suggestions.length || (productForm.ncm && !suggestions.some(s => s.code === productForm.ncm))) {
        // Se o NCM atual não está nas sugestões ou não há sugestões, ativa manual
        setIsManualNcm(true);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">
                NCM * <span className="text-xs font-normal text-slate-500">(8 dígitos)</span>
              </label>
              {ncmSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsManualNcm(!isManualNcm)}
                  className="text-xs font-bold text-versiory-coral hover:underline"
                >
                  {isManualNcm ? '🔄 Usar sugestões' : '✏️ Digitar manualmente'}
                </button>
              )}
            </div>

            {!isManualNcm && ncmSuggestions.length > 0 ? (
              <select
                value={productForm.ncm || ''}
                onChange={e => onChange('ncm', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900 animate-in fade-in duration-200"
              >
                <option value="">Selecione um NCM sugerido</option>
                {ncmSuggestions.map(ncm => (
                  <option key={ncm.code} value={ncm.code}>
                    {ncm.code} - {ncm.description}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={productForm.ncm || ''}
                onChange={e => onChange('ncm', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900 animate-in fade-in duration-200"
                placeholder="Ex: 61102000"
                maxLength={10}
              />
            )}

            {productForm.ncm && productForm.ncm.replace(/\D/g, '').length !== 8 && (
              <p className="text-xs text-red-600 mt-1">⚠️ NCM deve ter 8 dígitos numéricos</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              GTIN / EAN <span className="text-xs font-normal text-slate-500">(Cód. Barras)</span>
            </label>
            <input
              type="text"
              value={productForm.gtin || ''}
              onChange={e => onChange('gtin', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
              placeholder="Ex: 7891234567890"
              maxLength={14}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Deixe em branco ou use "SEM GTIN" se o produto não possuir.
            </p>
          </div>
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
              Peso (kg) *
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={productForm.peso || ''}
              onChange={e => onChange('peso', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
              placeholder="0.000"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              CEST <span className="text-xs font-normal text-slate-500">(Subst. Tributária)</span>
            </label>
            <input
              type="text"
              value={productForm.cest || ''}
              onChange={e => onChange('cest', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
              placeholder="Ex: 28.040.00"
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Cód. Benefício <span className="text-xs font-normal text-slate-500">(Opcional)</span>
            </label>
            <input
              type="text"
              value={productForm.codigoBeneficio || ''}
              onChange={e => onChange('codigoBeneficio', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
              placeholder="Ex: PR800001"
            />
          </div>
        </div>

        <div className="bg-white/50 p-4 rounded-xl border border-amber-100">
          <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            📊 Alíquotas de Impostos (%)
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ICMS</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.aliquotaIcms ?? ''}
                onChange={e => onChange('aliquotaIcms', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">PIS</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.aliquotaPis ?? ''}
                onChange={e => onChange('aliquotaPis', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">COFINS</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.aliquotaCofins ?? ''}
                onChange={e => onChange('aliquotaCofins', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">IPI</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.aliquotaIpi ?? ''}
                onChange={e => onChange('aliquotaIpi', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>


        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onChange('usoReformaTributaria', !productForm.usoReformaTributaria);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none focus:ring-2 focus:ring-versiory-coral focus:ring-offset-2 ${productForm.usoReformaTributaria ? 'bg-versiory-coral ring-2 ring-versiory-coral/20' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${productForm.usoReformaTributaria ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
              <div>
                <span className="text-sm font-bold text-slate-800">Novo Modelo de Tributação (IBS/CBS)</span>
                <p className="text-xs text-slate-500">
                  Conforme Reforma Tributária (Emenda Constitucional nº 132/2023).
                  <a href="https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2025/dezembro/comunicado-conjunto" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 font-bold">Ler Comunicado Oficial</a>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange('usoReformaTributaria', !productForm.usoReformaTributaria)}
              className={`text-[10px] font-black px-3 py-1 rounded-full transition-all duration-300 ${productForm.usoReformaTributaria ? 'bg-green-100 text-green-700 shadow-sm border border-green-200' : 'bg-slate-200 text-slate-500 border border-slate-300'}`}
            >
              {productForm.usoReformaTributaria ? 'ATIVO' : 'INATIVO'}
            </button>
          </div>

          {productForm.usoReformaTributaria && (
            <div className="pt-2 border-t border-blue-100 animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    CBS (%) <span className="text-[10px] font-normal text-slate-400">(Federal)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.aliquotaCbs ?? ''}
                    onChange={e => onChange('aliquotaCbs', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    IBS (%) <span className="text-[10px] font-normal text-slate-400">(Est./Mun.)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.aliquotaIbs ?? ''}
                    onChange={e => onChange('aliquotaIbs', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    IS (%) <span className="text-[10px] font-normal text-slate-400">(Seletivo)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.aliquotaIs ?? ''}
                    onChange={e => onChange('aliquotaIs', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-versiory-coral"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  cClassTrib <span className="text-[10px] font-normal text-slate-400">(Classe Tributária Reforma 2026)</span>
                </label>
                <input
                  type="text"
                  value={productForm.cClassTrib || ''}
                  onChange={e => onChange('cClassTrib', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none bg-white text-slate-900"
                  placeholder="Ex: 01.01.01"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Este código define a regra de tributação no novo sistema IVA Dual.
                </p>
              </div>
            </div>
          )}
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
