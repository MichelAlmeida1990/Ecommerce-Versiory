import React from 'react';
import { SizeChart } from '../types';

interface SizeChartEditorProps {
  sizeChart: SizeChart | undefined;
  onChange: (sizeChart: SizeChart) => void;
  availableSizes: string[];
}

// Tabelas padrão de medidas
const STANDARD_CHARTS = {
  clothing: {
    'P': { chest: 88, waist: 74, hip: 94, length: 68 },
    'M': { chest: 94, waist: 80, hip: 100, length: 70 },
    'G': { chest: 100, waist: 86, hip: 106, length: 72 },
    'GG': { chest: 106, waist: 92, hip: 112, length: 74 },
    'XG': { chest: 112, waist: 98, hip: 118, length: 76 }
  },
  shoes: {
    '34': { length: 22.5, width: 8.5 },
    '35': { length: 23.0, width: 8.7 },
    '36': { length: 23.5, width: 8.9 },
    '37': { length: 24.0, width: 9.1 },
    '38': { length: 24.5, width: 9.3 },
    '39': { length: 25.0, width: 9.5 },
    '40': { length: 25.5, width: 9.7 },
    '41': { length: 26.0, width: 9.9 },
    '42': { length: 26.5, width: 10.1 },
    '43': { length: 27.0, width: 10.3 },
    '44': { length: 27.5, width: 10.5 }
  },
  pants: {
    '36': { waist: 76, hip: 92, length: 100 },
    '38': { waist: 80, hip: 96, length: 102 },
    '40': { waist: 84, hip: 100, length: 104 },
    '42': { waist: 88, hip: 104, length: 106 },
    '44': { waist: 92, hip: 108, length: 108 },
    '46': { waist: 96, hip: 112, length: 110 }
  }
};

const SizeChartEditor: React.FC<SizeChartEditorProps> = ({
  sizeChart = {},
  onChange,
  availableSizes
}) => {
  const measurements = [
    { key: 'chest', label: 'Peito (cm)', icon: '👕' },
    { key: 'waist', label: 'Cintura (cm)', icon: '📏' },
    { key: 'hip', label: 'Quadril (cm)', icon: '📐' },
    { key: 'length', label: 'Comprimento (cm)', icon: '📏' },
    { key: 'width', label: 'Largura (cm)', icon: '↔️' }
  ];

  const updateMeasurement = (size: string, measurement: string, value: number) => {
    const updatedChart = {
      ...sizeChart,
      [size]: {
        ...sizeChart[size as keyof SizeChart],
        [measurement]: value
      }
    };
    onChange(updatedChart);
  };

  const applyStandardChart = (type: 'clothing' | 'shoes' | 'pants') => {
    const standardChart = STANDARD_CHARTS[type];
    const newChart: SizeChart = { ...sizeChart };

    availableSizes.forEach(size => {
      if (standardChart[size as keyof typeof standardChart]) {
        newChart[size as keyof SizeChart] = {
          ...newChart[size as keyof SizeChart],
          ...(standardChart[size as keyof typeof standardChart] as any)
        };
      }
    });

    onChange(newChart);
  };


  if (availableSizes.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-sm">
          Configure os tamanhos disponíveis primeiro para adicionar medidas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">📏</span>
          Régua de Medição
        </h4>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyStandardChart('clothing')}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-all"
            title="Aplicar medidas padrão de roupas"
          >
            👕 Roupas
          </button>
          <button
            type="button"
            onClick={() => applyStandardChart('pants')}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-all"
            title="Aplicar medidas padrão de calças"
          >
            👖 Calças
          </button>
          <button
            type="button"
            onClick={() => applyStandardChart('shoes')}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-all"
            title="Aplicar medidas padrão de calçados"
          >
            👟 Calçados
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="text-left py-2 px-3 text-sm font-bold text-slate-700">Medida</th>
              {availableSizes.map(size => (
                <th key={size} className="text-center py-2 px-3 text-sm font-bold text-slate-700 min-w-[80px]">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measurements.map(({ key, label, icon }) => (
              <tr key={key} className="border-b border-slate-200">
                <td className="py-3 px-3 text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    {label}
                  </div>
                </td>
                {availableSizes.map(size => (
                  <td key={`${size}-${key}`} className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={sizeChart[size as keyof SizeChart]?.[key as keyof SizeChart[keyof SizeChart]] || ''}
                      onChange={(e) => updateMeasurement(size, key, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-slate-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none"
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>💡 Dica:</strong> Use os botões acima para aplicar medidas padrão automaticamente.
          Você pode ajustar os valores depois se necessário.
        </p>
      </div>
    </div>
  );
};

export default SizeChartEditor;