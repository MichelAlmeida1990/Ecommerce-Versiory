import React, { useMemo } from 'react';
import { Product, Order } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CurvaAbcAnalysisProps {
  products: Product[];
  orders: Order[];
  dateFrom?: string;
  dateTo?: string;
  channelFilter?: 'all' | 'physical' | 'online';
  classFilter?: 'all' | 'A' | 'B' | 'C';
  calculationPeriod?: number;
}

interface ProductRevenue {
  id: number;
  name: string;
  revenue: number;
  quantity: number;
}

interface ProductAnalysis extends ProductRevenue {
  classification: 'A' | 'B' | 'C';
  percentage: number;
  accumulatedPercentage: number;
  currentStock: number;
  minStock: number;
  cmd: number;
  coverageDays: number;
  suggestedPurchase: number;
  alertLevel: 'red' | 'orange' | 'green' | 'blue';
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const CurvaAbcAnalysis: React.FC<CurvaAbcAnalysisProps> = ({
  products,
  orders,
  dateFrom,
  dateTo,
  channelFilter = 'all',
  classFilter = 'all',
  calculationPeriod = 30,
}) => {
  const productMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.date);
      if (dateFrom) {
        const start = new Date(dateFrom + 'T00:00:00');
        if (orderDate < start) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo + 'T23:59:59');
        if (orderDate > end) return false;
      }
      if (channelFilter !== 'all' && order.salesChannel !== channelFilter) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, channelFilter]);

  const revenueByProduct = useMemo(() => {
    const map = new Map<number, ProductRevenue>();
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.productId;
        const existing = map.get(productId) || { id: productId, name: '', revenue: 0, quantity: 0 };
        existing.revenue += item.price * item.quantity;
        existing.quantity += item.quantity;
        existing.name = productMap.get(productId)?.name || `Produto #${productId}`;
        map.set(productId, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, productMap]);

  const totalRevenue = revenueByProduct.reduce((sum, item) => sum + item.revenue, 0);
  const totalQuantity = revenueByProduct.reduce((sum, item) => sum + item.quantity, 0);

  const classified = useMemo(() => {
    let accumulated = 0;
    return revenueByProduct.map(item => {
      accumulated += item.revenue;
      const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
      const accumulatedPercentage = totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (accumulatedPercentage <= 80) classification = 'A';
      else if (accumulatedPercentage <= 95) classification = 'B';

      const product = productMap.get(item.id);
      const currentStock = product?.stock || 0;
      const minStock = product?.minStock || 0;
      const cmd = calculationPeriod > 0 ? item.quantity / calculationPeriod : 0;
      const coverageDays = cmd > 0 ? currentStock / cmd : (currentStock > 0 ? 999 : 0);
      const suggestedPurchase = Math.max(0, Math.round((cmd * 15) - currentStock));

      let alertLevel: 'red' | 'orange' | 'green' | 'blue' = 'green';
      if (coverageDays <= 2) alertLevel = 'red';
      else if (coverageDays <= 10) alertLevel = 'orange';
      else if (coverageDays <= 60) alertLevel = 'green';
      else alertLevel = 'blue';

      return {
        ...item,
        classification,
        percentage,
        accumulatedPercentage,
        currentStock,
        minStock,
        cmd,
        coverageDays,
        suggestedPurchase,
        alertLevel,
      } as ProductAnalysis;
    });
  }, [revenueByProduct, totalRevenue, productMap, calculationPeriod]);

  const stats = useMemo(() => {
    const a = classified.filter(i => i.classification === 'A');
    const b = classified.filter(i => i.classification === 'B');
    const c = classified.filter(i => i.classification === 'C');
    return {
      a: { count: a.length, revenue: a.reduce((s, i) => s + i.revenue, 0), quantity: a.reduce((s, i) => s + i.quantity, 0) },
      b: { count: b.length, revenue: b.reduce((s, i) => s + i.revenue, 0), quantity: b.reduce((s, i) => s + i.quantity, 0) },
      c: { count: c.length, revenue: c.reduce((s, i) => s + i.revenue, 0), quantity: c.reduce((s, i) => s + i.quantity, 0) },
    };
  }, [classified]);

  const paretoData = useMemo(() => {
    return classified.map(item => ({
      name: item.name.length > 20 ? item.name.slice(0, 20) + '...' : item.name,
      faturamento: Number(item.revenue.toFixed(2)),
      acumulada: Number(item.accumulatedPercentage.toFixed(2)),
    }));
  }, [classified]);

  const pieData = useMemo(() => {
    return [
      { name: 'Classe A', value: Number(stats.a.revenue.toFixed(2)) },
      { name: 'Classe B', value: Number(stats.b.revenue.toFixed(2)) },
      { name: 'Classe C', value: Number(stats.c.revenue.toFixed(2)) },
    ];
  }, [stats]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredClassified = useMemo(() => {
    if (classFilter === 'all') return classified;
    return classified.filter(item => item.classification === classFilter);
  }, [classified, classFilter]);

  const alertIcon = (level: 'red' | 'orange' | 'green' | 'blue') => {
    if (level === 'red') return '🔴';
    if (level === 'orange') return '🟠';
    if (level === 'blue') return '🔵';
    return '🟢';
  };

  const alertLabel = (level: 'red' | 'orange' | 'green' | 'blue') => {
    if (level === 'red') return 'Ruptura iminente';
    if (level === 'orange') return 'Atenção / risco próximo';
    if (level === 'blue') return 'Excesso de estoque';
    return 'Estoque saudável';
  };

  const alertAction = (level: 'red' | 'orange' | 'green' | 'blue') => {
    if (level === 'red') return 'Comprar imediatamente';
    if (level === 'orange') return 'Planejar compra em breve';
    if (level === 'blue') return 'Evitar compras, criar promoção para girar estoque';
    return 'Nenhuma ação necessária';
  };

  const formatNumber = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <h2 className="text-2xl font-black text-white mb-4">Curva ABC de Produtos</h2>
        <p className="text-slate-300 text-sm mb-6">
          Classificação baseada no faturamento dos produtos vendidos em pedidos.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="text-xs font-black text-slate-400 uppercase">Filtro classe:</label>
          {(['all', 'A', 'B', 'C'] as const).map(option => (
            <button
              key={option}
              onClick={() => {}}
              className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                classFilter === option
                  ? 'bg-versiory-coral text-white'
                  : 'bg-white/5 text-slate-300 border border-white/20 hover:bg-white/10'
              }`}
            >
              {option === 'all' ? 'Tudo' : `Curva ${option}`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs font-black text-slate-400 uppercase">Período cálculo:</label>
            <span className="text-white text-sm font-bold">{calculationPeriod} dias</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
            <div className="text-green-300 text-sm font-bold uppercase">Classe A</div>
            <div className="text-white text-2xl font-black">{stats.a.count} produtos</div>
            <div className="text-green-200 text-sm">Faturamento: {formatCurrency(stats.a.revenue)}</div>
            <div className="text-green-200 text-sm">Qtd: {stats.a.quantity} un</div>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4">
            <div className="text-yellow-300 text-sm font-bold uppercase">Classe B</div>
            <div className="text-white text-2xl font-black">{stats.b.count} produtos</div>
            <div className="text-yellow-200 text-sm">Faturamento: {formatCurrency(stats.b.revenue)}</div>
            <div className="text-yellow-200 text-sm">Qtd: {stats.b.quantity} un</div>
          </div>
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
            <div className="text-red-300 text-sm font-bold uppercase">Classe C</div>
            <div className="text-white text-2xl font-black">{stats.c.count} produtos</div>
            <div className="text-red-200 text-sm">Faturamento: {formatCurrency(stats.c.revenue)}</div>
            <div className="text-red-200 text-sm">Qtd: {stats.c.quantity} un</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-2">Pareto - Faturamento Total</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={paretoData} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="acumulada" name="% Acumulada" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-2">Distribuição de Faturamento</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Faturamento total</span>
                <span className="text-white font-bold">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-300">Vendas ignoradas (Classe C)</span>
                <span className="text-white font-bold">{formatCurrency(stats.c.revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Valor descartado</span>
                <span className="text-white font-bold">{formatCurrency(stats.c.revenue)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-200 px-2 py-1 rounded-lg border border-red-500/30">🔴 menor/igual 2 dias — Ruptura iminente — Comprar imediatamente</span>
            <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-200 px-2 py-1 rounded-lg border border-orange-500/30">🟠 menor/igual 10 dias — Atencao — Planejar compra em breve</span>
            <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-200 px-2 py-1 rounded-lg border border-green-500/30">🟢 11 a 60 dias — Estoque saudavel — Nenhuma acao</span>
            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-200 px-2 py-1 rounded-lg border border-blue-500/30">🔵 maior 60 dias — Excesso — Evitar compras / criar promocao</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/20 text-slate-300">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Produto</th>
                <th className="py-2 px-2 text-right">Qtd Vendida</th>
                <th className="py-2 px-2 text-right">Faturamento</th>
                <th className="py-2 px-2 text-right">% do Total</th>
                <th className="py-2 px-2 text-right">% Acumulada</th>
                <th className="py-2 px-2 text-center">Classe</th>
                <th className="py-2 px-2 text-right">Cobertura (dias)</th>
                <th className="py-2 px-2 text-right">Estoque Atual</th>
                <th className="py-2 px-2 text-right">Sugestão de Compra</th>
                <th className="py-2 px-2 text-center">AL</th>
              </tr>
            </thead>
            <tbody>
              {filteredClassified.map((item, idx) => (
                <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-2 px-2 text-slate-300">{idx + 1}</td>
                  <td className="py-2 px-2 text-white font-medium">{item.name}</td>
                  <td className="py-2 px-2 text-right text-slate-200">{item.quantity}</td>
                  <td className="py-2 px-2 text-right text-slate-200">{formatCurrency(item.revenue)}</td>
                  <td className="py-2 px-2 text-right text-slate-200">{item.percentage.toFixed(2)}%</td>
                  <td className="py-2 px-2 text-right text-slate-200">{item.accumulatedPercentage.toFixed(2)}%</td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        item.classification === 'A'
                          ? 'bg-green-500/30 text-green-200'
                          : item.classification === 'B'
                          ? 'bg-yellow-500/30 text-yellow-200'
                          : 'bg-red-500/30 text-red-200'
                      }`}
                    >
                      {item.classification}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-slate-200">{formatNumber(item.coverageDays)}</td>
                  <td className="py-2 px-2 text-right text-slate-200">{formatNumber(item.currentStock)}</td>
                  <td className="py-2 px-2 text-right text-slate-200">{formatNumber(item.suggestedPurchase)}</td>
                  <td className="py-2 px-2 text-center" title={`${alertLabel(item.alertLevel)} - ${alertAction(item.alertLevel)}`}>
                    <span className="text-base leading-none">{alertIcon(item.alertLevel)}</span>
                    <div className="text-[10px] text-slate-300 leading-tight mt-0.5">{alertLabel(item.alertLevel)}</div>
                    {(item.alertLevel === 'red' || item.alertLevel === 'orange') && (
                      <button
                        onClick={() => alert(`Reabastecer ${item.name}\nSugestão: ${formatNumber(item.suggestedPurchase)} unidades`)}
                        className="mt-1 text-[10px] font-black uppercase bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-lg border border-white/20 transition-all"
                      >
                        Reabastecer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredClassified.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400">
                    Nenhum dado de venda disponível para análise.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurvaAbcAnalysis;
