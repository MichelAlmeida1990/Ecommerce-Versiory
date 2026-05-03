import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Product,
  CategoryItem,
  Order,
  Customer,
  TrackingItem,
  InventoryMovement,
  Expense,
  SizeChart
} from '../types';
import PdvCheckoutModal from './PdvCheckoutModal';
import FiscalConfigModal from './FiscalConfigModal';
import FiscalFields from './FiscalFields';
import ImageGallery from './ImageGallery';
import SizeChartEditor from './SizeChartEditor';
import SizeStockManager from './SizeStockManager';
import ProductSizeSelector from './ProductSizeSelector';
import { sanitizeData } from '../services/utils';

// ... (restante do arquivo deve ser mantido)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1f4b] via-[#0a1b3d] to-[#08122b]">
      {/* ... conteúdo JSX ... */}
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-versiory-ink to-slate-900 text-white py-8 mt-12 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <p className="text-white/80 text-sm font-medium">Área restrita. Acesso exclusivo para administradores. Todas as ações são monitoradas.</p>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-medium transition-all mt-2"
          >
            Sair
          </button>
          <p className="text-white/60 text-xs mt-2">© {new Date().getFullYear()} Versiory Store. Todos os direitos reservados. | <span className="font-bold">Versão 2.4.6 (Estável)</span></p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
