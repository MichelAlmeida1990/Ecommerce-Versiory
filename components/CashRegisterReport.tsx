import React, { useState } from 'react';
import { CashRegister } from '../types';

interface CashRegisterReportProps {
  cashRegister: CashRegister;
  onClose: () => void;
}

const CashRegisterReport: React.FC<CashRegisterReportProps> = ({ cashRegister, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-200 flex justify-between items-center print:border-black">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Relatório de Fechamento</h3>
            <p className="text-sm text-gray-500 mt-1">Caixa #{cashRegister.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full print:hidden">
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
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashRegisterReport;
