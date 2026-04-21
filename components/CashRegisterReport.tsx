import React, { useState } from 'react';
import { CashRegister } from '../types';

interface CashRegisterReportProps {
  cashRegister: CashRegister;
  onClose: () => void;
}

const CashRegisterReport: React.FC<CashRegisterReportProps> = ({ cashRegister, onClose }) => {
  const [hasPrinted, setHasPrinted] = useState(false);

  const handlePrint = () => {
    setHasPrinted(true);
    window.print();
  };

  const handleClose = () => {
    if (!hasPrinted) {
      window.alert('⚠️ IMPRESSÃO OBRIGATÓRIA\n\nPor favor, imprima o Relatório de Fechamento de Caixa antes de sair. Esta ação garante que os valores sejam registrados fisicamente e digitalmente.');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* ERRCOM110: Estilos específicos para impressão térmica (80mm) */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .fixed {
            position: static !important;
            display: block !important;
            padding: 0 !important;
          }
          .bg-black\\/60 {
            display: none !important;
          }
          .rounded-3xl {
            border-radius: 0 !important;
          }
          .shadow-2xl {
            box-shadow: none !important;
          }
          .max-w-2xl {
            max-width: 100% !important;
            width: 80mm !important;
            margin: 0 auto !important;
          }
          .max-h-\\[90vh\\] {
            max-height: none !important;
            overflow: visible !important;
          }
          .p-8 {
            padding: 10mm 5mm !important;
          }
          .bg-gray-50, .bg-blue-50, .bg-green-50, .bg-amber-50, .bg-gray-900 {
            background-color: white !important;
            border: 1px solid #eee !important;
            color: black !important;
            padding: 4mm !important;
            margin-bottom: 5mm !important;
          }
          .text-white {
            color: black !important;
          }
          .border-white\\/20 {
            border-color: #000 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          h3, h4 {
            color: black !important;
            border-bottom: 1px dashed #000;
            padding-bottom: 2mm;
            margin-bottom: 4mm;
          }
          .font-black {
            font-weight: 900 !important;
          }
          .grid {
            display: block !important;
          }
          .grid > div {
            margin-bottom: 3mm;
            border-bottom: 1px dotted #eee;
            padding-bottom: 1mm;
          }
        }
      `}</style>

      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-200 flex justify-between items-center print:border-black">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Relatório de Fechamento</h3>
            <p className="text-sm text-gray-500 mt-1">Caixa #{cashRegister.id.slice(0, 8)}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full print:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Informações do Caixa */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h4 className="font-black text-gray-700 text-sm uppercase mb-4">Informações do Caixa</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Abertura:</p>
                <p className="font-bold text-gray-900">
                  {new Date(cashRegister.openedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Fechamento:</p>
                <p className="font-bold text-gray-900">
                  {cashRegister.closedAt ? new Date(cashRegister.closedAt).toLocaleString('pt-BR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Operador:</p>
                <p className="font-bold text-gray-900">{cashRegister.openedBy}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Status:</p>
                <p className={`font-bold ${cashRegister.status === 'open' ? 'text-green-600' : 'text-gray-600'}`}>
                  {cashRegister.status === 'open' ? 'Aberto' : 'Fechado'}
                </p>
              </div>
            </div>
          </div>

          {/* Resumo de Vendas por Canal (ERRCOM110) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total Pedidos</p>
              <p className="text-2xl font-black text-blue-900">{cashRegister.totalOrders}</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Faturamento Bruto</p>
              <p className="text-2xl font-black text-emerald-900">{formatCurrency(cashRegister.totalSales)}</p>
            </div>
          </div>

          {/* Resumo de Vendas */}
          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="font-black text-blue-900 text-sm uppercase mb-4">Resumo de Vendas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-700 font-medium text-sm">Total de Pedidos:</p>
                <p className="text-3xl font-black text-blue-900">{cashRegister.totalOrders}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium text-sm">Total Vendido:</p>
                <p className="text-3xl font-black text-blue-900">
                  R$ {cashRegister.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Por Forma de Pagamento */}
          <div className="bg-green-50 rounded-2xl p-6">
            <h4 className="font-black text-green-900 text-sm uppercase mb-4">Por Forma de Pagamento</h4>
            <div className="space-y-3">
              {Object.entries(cashRegister.salesByPayment).map(([method, amount]) => {
                const count = cashRegister.salesByPaymentCount?.[method as keyof typeof cashRegister.salesByPaymentCount] || 0;
                return (
                  <div key={method} className="flex justify-between items-center">
                    <span className="font-bold text-green-800 capitalize">
                      {method === 'dinheiro' ? 'DINHEIRO' :
                        method === 'pix' ? 'PIX' :
                          method === 'debito' ? 'DÉBITO' :
                            method === 'credito' ? 'CRÉDITO' : method.toUpperCase()}:
                    </span>
                    <div className="text-right">
                      <div className="font-black text-green-900">
                        R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-green-700">
                        ({count})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Movimentações */}
          <div className="bg-amber-50 rounded-2xl p-6">
            <h4 className="font-black text-amber-900 text-sm uppercase mb-4">Movimentações</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-800">Troco Inicial:</span>
                <span className="font-black text-amber-900">
                  R$ {cashRegister.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {cashRegister.withdrawals.length > 0 && (
                <div>
                  <p className="font-bold text-amber-800 mb-2">Sangrias:</p>
                  {cashRegister.withdrawals.map((w) => (
                    <div key={w.id} className="flex justify-between text-sm ml-4 mb-1">
                      <span className="text-amber-700">{w.reason}</span>
                      <span className="font-bold text-red-600">
                        -R$ {w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {cashRegister.deposits.length > 0 && (
                <div>
                  <p className="font-bold text-amber-800 mb-2">Suprimentos:</p>
                  {cashRegister.deposits.map((d) => (
                    <div key={d.id} className="flex justify-between text-sm ml-4 mb-1">
                      <span className="text-amber-700">{d.reason}</span>
                      <span className="font-bold text-green-600">
                        +R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fechamento */}
          {cashRegister.status === 'closed' && (
            <div className="bg-gray-900 text-white rounded-2xl p-6">
              <h4 className="font-black text-sm uppercase mb-4">Fechamento</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Esperado:</span>
                  <span className="font-black text-xl">
                    R$ {cashRegister.expectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Contado:</span>
                  <span className="font-black text-xl">
                    R$ {(cashRegister.actualAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/20">
                  <span className="font-bold">Diferença:</span>
                  <span className={`font-black text-2xl ${(cashRegister.difference || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(cashRegister.difference || 0) >= 0 ? '+' : ''}R$ {(cashRegister.difference || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {(cashRegister.difference || 0) > 0 && ' (SOBRA)'}
                    {(cashRegister.difference || 0) < 0 && ' (FALTA)'}
                  </span>
                </div>
              </div>

              {cashRegister.notes && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="font-bold text-sm mb-2">Observações:</p>
                  <p className="text-sm text-gray-300">{cashRegister.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-200 flex gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all"
          >
            🖨️ Imprimir Relatório
          </button>
          <button
            onClick={handleClose}
            className={`flex-1 ${hasPrinted ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-red-100 text-red-500 cursor-not-allowed'} py-3 rounded-xl font-bold transition-all`}
          >
            {hasPrinted ? 'Fechar' : 'Imprima antes de Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashRegisterReport;
