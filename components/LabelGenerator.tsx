// REFCOM234: Tela de criacao e impressao de etiquetas de precificacao com codigo de barras EAN-13.
import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import {
  normalizeGtin,
  isValidEan13,
  generateUniqueEan13,
  buildEan13Svg,
  withCheckDigit,
} from '../utils/barcode';

interface LabelGeneratorProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  /** Produto que originou a navegacao pelo botao "Gerar Cod. Barras" do cadastro. */
  initialProductId?: number | null;
  isBillingRestricted?: boolean;
  onProductGtinSaved?: (gtin: string) => void;
}

type LabelSize = 'small' | 'medium' | 'large';
type LabelLayout = 'price-first' | 'barcode-first' | 'minimal';

/** Medidas em mm, usadas tanto no preview quanto no CSS de impressao. */
const SIZES: Record<LabelSize, { label: string; width: number; height: number }> = {
  small: { label: 'Pequena (38 x 25 mm)', width: 38, height: 25 },
  medium: { label: 'Media (50 x 30 mm)', width: 50, height: 30 },
  large: { label: 'Grande (70 x 40 mm)', width: 70, height: 40 },
};

const LAYOUTS: Record<LabelLayout, { label: string; description: string }> = {
  'price-first': { label: 'Preco em destaque', description: 'Preco grande, nome e barcode ao lado.' },
  'barcode-first': { label: 'Barcode em destaque', description: 'Codigo de barras grande e preco abaixo.' },
  minimal: { label: 'Compacto', description: 'Nome, preco e barcode em linhas compactas.' },
};

const formatCurrency = (value: number) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const LabelGenerator: React.FC<LabelGeneratorProps> = ({
  products,
  onUpdateProducts,
  initialProductId,
  isBillingRestricted,
  onProductGtinSaved,
}) => {
  const [productId, setProductId] = useState<number | ''>('');
  const [labelName, setLabelName] = useState('');
  const [labelPrice, setLabelPrice] = useState('');
  const [gtinInput, setGtinInput] = useState('');
  const [size, setSize] = useState<LabelSize>('medium');
  const [layout, setLayout] = useState<LabelLayout>('price-first');
  const [quantity, setQuantity] = useState(1);
  const [savedMessage, setSavedMessage] = useState('');

  // Gtin ja usados pelos produtos, para nunca gerar codigo duplicado.
  const usedGtins = useMemo(() => products.map(p => p.gtin), [products]);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === productId) || null,
    [products, productId],
  );

  // Ao chegar pelo botao "Gerar Cod. Barras" do cadastro, ja abre o produto correto.
  useEffect(() => {
    if (initialProductId == null) return;
    const product = products.find(p => p.id === initialProductId);
    if (!product) return;
    setProductId(product.id);
    setLabelName(product.name);
    setLabelPrice(String(product.price ?? ''));
    setGtinInput(normalizeGtin(product.gtin));
  }, [initialProductId, products]);

  // Ao trocar o produto manualmente, recarrega nome, preco e GTIN.
  const handleSelectProduct = (value: string) => {
    setSavedMessage('');
    if (!value) {
      setProductId('');
      setLabelName('');
      setLabelPrice('');
      setGtinInput('');
      return;
    }
    const id = Number(value);
    setProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      setLabelName(product.name);
      setLabelPrice(String(product.price ?? ''));
      setGtinInput(normalizeGtin(product.gtin));
    }
  };

  const normalizedGtin = normalizeGtin(gtinInput);
  const gtinIsValid = isValidEan13(normalizedGtin);
  const gtinLengthOk = normalizedGtin.length === 13;
  const priceNumber = Number(String(labelPrice).replace(',', '.'));

  const handleGtinChange = (value: string) => {
    const digits = normalizeGtin(value).slice(0, 13);
    // Completa o digito verificador assim que a base de 12 digitos esta pronta.
    if (digits.length === 12) {
      const completed = withCheckDigit(digits);
      if (completed) {
        setGtinInput(completed);
        return;
      }
    }
    setGtinInput(digits);
  };

  const handleGenerateGtin = () => {
    setGtinInput(generateUniqueEan13(normalizedGtin, usedGtins));
    setSavedMessage('');
  };

  /** REFCOM234 regra 1: grava o codigo gerado no campo GTIN/EAN do produto. */
  const handleSaveGtin = () => {
    if (!gtinIsValid) {
      alert('Gere ou informe um codigo EAN-13 valido antes de salvar.');
      return;
    }
    if (!selectedProduct) {
      alert('Selecione o produto que receberá o codigo GTIN/EAN.');
      return;
    }
    onUpdateProducts(
      products.map(p => (p.id === selectedProduct.id ? { ...p, gtin: normalizedGtin } : p)),
    );
    setSavedMessage(`Codigo ${normalizedGtin} salvo no produto "${selectedProduct.name}".`);
    onProductGtinSaved?.(normalizedGtin);
  };

  const barcodeSvg = useMemo(
    () => buildEan13Svg(normalizedGtin, { height: 46, moduleWidth: 1.6 }),
    [normalizedGtin],
  );

  const sizeInfo = SIZES[size];
  const quantityClamped = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
  const canPrint = gtinIsValid && labelName.trim().length > 0 && priceNumber > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Etiquetas de Preco</h2>
          <p className="text-sm text-slate-300 mt-1">
            Gere o codigo de barras EAN-13, salve no cadastro do produto e imprima a etiqueta de precificacao.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={!canPrint}
          className={`${canPrint ? 'bg-versiory-coral hover:bg-[#ff8368]' : 'bg-slate-500 cursor-not-allowed'} text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg`}
        >
          Imprimir Etiquetas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Configuracao */}
        <div className="lg:col-span-3 space-y-4 print-hidden">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">1. Produto e Codigo de Barras</h3>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Produto</label>
              <select
                value={productId}
                onChange={e => handleSelectProduct(e.target.value)}
                className="w-full px-4 py-3 border border-white/25 bg-white/70 rounded-xl text-slate-900 focus:ring-2 focus:ring-versiory-coral outline-none"
              >
                <option value="">Selecione um produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">GTIN / EAN</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={gtinInput}
                  onChange={e => handleGtinChange(e.target.value)}
                  placeholder="7890000000000"
                  className="flex-1 min-w-[200px] px-4 py-3 border border-white/25 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateGtin}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all"
                >
                  Gerar Cod. Barras
                </button>
              </div>
              <p className="text-xs mt-2">
                {gtinIsValid ? (
                  <span className="text-green-400">EAN-13 valido ({normalizedGtin.length}/13)</span>
                ) : normalizedGtin.length === 0 ? (
                  <span className="text-slate-400">Use o botao para gerar um EAN-13 com prefixo 789.</span>
                ) : gtinLengthOk ? (
                  <span className="text-red-400">Digito verificador invalido.</span>
                ) : (
                  <span className="text-slate-400">Informe ou gere 13 digitos.</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveGtin}
                disabled={!gtinIsValid || !selectedProduct || !!isBillingRestricted}
                className={`${gtinIsValid && selectedProduct && !isBillingRestricted ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-500 cursor-not-allowed'} text-white px-4 py-2 rounded-xl font-bold transition-all`}
              >
                Salvar GTIN no Produto
              </button>
              {savedMessage && <span className="text-xs text-green-400">{savedMessage}</span>}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">2. Conteudo da Etiqueta</h3>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Nome do Produto</label>
              <input
                type="text"
                value={labelName}
                onChange={e => setLabelName(e.target.value)}
                placeholder="Nome exibido na etiqueta"
                className="w-full px-4 py-3 border border-white/25 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Preco (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={labelPrice}
                onChange={e => setLabelPrice(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-3 border border-white/25 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">3. Tamanho, Layout e Quantidade</h3>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Tamanho da Etiqueta</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(SIZES) as LabelSize[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSize(key)}
                    className={`px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                      size === key ? 'bg-versiory-coral text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {SIZES[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Layout</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(LAYOUTS) as LabelLayout[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLayout(key)}
                    className={`px-3 py-3 rounded-xl text-left transition-all ${
                      layout === key ? 'bg-versiory-coral text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    <span className="block text-xs font-black">{LAYOUTS[key].label}</span>
                    <span className="block text-[10px] opacity-80 mt-1">{LAYOUTS[key].description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Quantidade de Etiquetas</label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-32 px-4 py-3 border border-white/25 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-versiory-coral outline-none"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 print-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">Pre-visualizacao</h3>
            <div className="bg-slate-200 rounded-xl p-4 flex justify-center">
              <LabelPreview
                size={size}
                layout={layout}
                name={labelName}
                price={priceNumber}
                barcodeSvg={barcodeSvg}
              />
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {sizeInfo.label} • {quantityClamped} etiqueta(s)
            </p>
            {!canPrint && (
              <p className="text-xs text-amber-300 mt-1">
                Informe nome, preco e um EAN-13 valido para habilitar a impressao.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Area impressa: uma pagina por etiqueta */}
      <div className="print-only">
        <style>{`
          @page { margin: 0; }
          @media print {
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
            .print-only { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}</style>
        {Array.from({ length: quantityClamped }).map((_, i) => (
          <div
            key={i}
            className="label-sheet print-only"
            style={{
              width: `${sizeInfo.width}mm`,
              height: `${sizeInfo.height}mm`,
              pageBreakAfter: i === quantityClamped - 1 ? 'auto' : 'always',
            }}
          >
            <LabelPreview
              size={size}
              layout={layout}
              name={labelName}
              price={priceNumber}
              barcodeSvg={barcodeSvg}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/** Etiqueta renderizada no preview e na impressao, com proporcao em mm. */
const LabelPreview: React.FC<{
  size: LabelSize;
  layout: LabelLayout;
  name: string;
  price: number;
  barcodeSvg: string;
}> = ({ size, layout, name, price, barcodeSvg }) => {
  const sizeInfo = SIZES[size];
  const scale = size === 'small' ? 0.85 : size === 'large' ? 1.25 : 1;

  if (layout === 'minimal') {
    return (
      <div
        className="label-card bg-white text-black overflow-hidden flex"
        style={{ width: `${sizeInfo.width}mm`, height: `${sizeInfo.height}mm` }}
      >
        <div className="flex-1 px-2 py-1 flex flex-col justify-center">
          <p className="font-bold truncate leading-tight" style={{ fontSize: `${6 * scale}pt` }}>{name || 'Nome do produto'}</p>
          <p className="font-black leading-tight" style={{ fontSize: `${11 * scale}pt` }}>{price > 0 ? formatCurrency(price) : 'R$ 0,00'}</p>
        </div>
        <div className="flex items-center px-1" style={{ width: `${sizeInfo.width * 0.42}mm` }} dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
      </div>
    );
  }

  if (layout === 'barcode-first') {
    return (
      <div
        className="label-card bg-white text-black overflow-hidden flex flex-col items-center justify-center px-1"
        style={{ width: `${sizeInfo.width}mm`, height: `${sizeInfo.height}mm` }}
      >
        <p className="font-bold text-center truncate w-full leading-tight" style={{ fontSize: `${6 * scale}pt` }}>{name || 'Nome do produto'}</p>
        <div className="w-full flex justify-center" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        <p className="font-black leading-tight mt-0.5" style={{ fontSize: `${12 * scale}pt` }}>{price > 0 ? formatCurrency(price) : 'R$ 0,00'}</p>
      </div>
    );
  }

  return (
    <div
      className="label-card bg-white text-black overflow-hidden"
      style={{ width: `${sizeInfo.width}mm`, height: `${sizeInfo.height}mm` }}
    >
      <div className="flex items-stretch" style={{ height: `${sizeInfo.height * 0.55}mm` }}>
        <div className="flex items-center px-2" style={{ width: `${sizeInfo.width * 0.38}mm` }}>
          <p className="font-black leading-none" style={{ fontSize: `${16 * scale}pt` }}>{price > 0 ? formatCurrency(price) : 'R$ 0,00'}</p>
        </div>
        <div className="flex-1 flex flex-col justify-center px-1" style={{ borderLeft: '1px solid #000' }}>
          <p className="font-bold leading-tight" style={{ fontSize: `${6.5 * scale}pt` }}>{name || 'Nome do produto'}</p>
          <div className="w-full flex justify-center mt-0.5" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        </div>
      </div>
    </div>
  );
};

export default LabelGenerator;
