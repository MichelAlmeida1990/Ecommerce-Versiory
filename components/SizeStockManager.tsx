import React from 'react';

interface SizeStockManagerProps {
  sizes: string[];
  colors?: string[];
  stockBySize?: { [size: string]: number };
  stockBySizeColor?: { [key: string]: number };
  onChange: (data: { stockBySize?: { [size: string]: number }, stockBySizeColor?: { [key: string]: number } }) => void;
}

const SizeStockManager: React.FC<SizeStockManagerProps> = ({
  sizes,
  colors,
  stockBySize = {},
  stockBySizeColor = {},
  onChange
}) => {
  const updateStock = (size: string, color: string | null, quantity: number) => {
    if (colors && colors.length > 0 && color) {
      const key = `${size}-${color}`;
      const updated = {
        ...stockBySizeColor,
        [key]: Math.max(0, quantity)
      };
      onChange({ stockBySizeColor: updated });
    } else {
      const updated = {
        ...stockBySize,
        [size]: Math.max(0, quantity)
      };
      onChange({ stockBySize: updated });
    }
  };

  const getTotalStock = () => {
    if (colors && colors.length > 0) {
      return Object.values(stockBySizeColor).reduce((sum, qty) => sum + qty, 0);
    }
    return Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0);
  };

  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm">📦</span>
        Estoque por Tamanho {colors && colors.length > 0 && '+ Cor'}
      </h4>
      
      {colors && colors.length > 0 ? (
        <div className="space-y-6">
          {sizes.map(size => (
            <div key={size} className="border border-slate-200 rounded-lg p-4">
              <h5 className="font-bold text-slate-800 mb-3">Tamanho: {size}</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {colors.map(color => {
                  const key = `${size}-${color}`;
                  return (
                    <div key={key} className="text-center">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {color}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stockBySizeColor[key] || 0}
                        onChange={(e) => updateStock(size, color, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {sizes.map(size => (
            <div key={size} className="text-center">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Tamanho {size}
              </label>
              <input
                type="number"
                min="0"
                value={stockBySize[size] || 0}
                onChange={(e) => updateStock(size, null, parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-800">Total em Estoque:</span>
          <span className="text-lg font-bold text-blue-900">{getTotalStock()} unidades</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        💡 O estoque total será calculado automaticamente somando {colors && colors.length > 0 ? 'todos os tamanhos e cores' : 'todos os tamanhos'}
      </div>
    </div>
  );
};

export default SizeStockManager;