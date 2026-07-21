import React, { useState } from 'react';
import { CashRegister } from '../types';

// ERRCOM119: formatCurrency estava ausente, causando crash silencioso (tela vazia)
const formatCurrency = (value: number) =>
  `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface CashRegisterReportProps {
  cashRegister: CashRegister;
  onClose: () => void;
}

const CashRegisterReport: React.FC<CashRegisterReportProps> = ({ cashRegister, onClose }) => {
  const [hasPrinted, setHasPrinted] = useState(false);

  const isPartial = cashRegister.status === 'open';
  const reportTitle = isPartial ? 'LEITURA X (PARCIAL)' : 'FECHAMENTO DE CAIXA';
  const shortId = isPartial
    ? cashRegister.id.replace('PARTIAL-', '').slice(-8).toUpperCase()
    : new Date(cashRegister.closedAt || cashRegister.openedAt).toLocaleDateString('pt-BR').split('/').join('');

  const paymentLabels: Record<string, string> = {
    dinheiro: 'DINHEIRO',
    pix: 'PIX',
    debito: 'DÉBITO',
    credito: 'CRÉDITO',
  };

  // ERRCOM128: Calcular sangrias e suprimentos para o saldo
  const totalWithdrawals = (cashRegister.withdrawals || []).reduce((acc, w) => acc + w.amount, 0);
  const totalDeposits = (cashRegister.deposits || []).reduce((acc, d) => acc + d.amount, 0);

  // REFCOM128: SALDO REAL EM CAIXA = Abertura + TODAS as vendas (Dinheiro + PIX + Débito + Crédito) + Suprimentos - Sangrias
  const totalVendas = (cashRegister.salesByPayment?.dinheiro || 0) +
    (cashRegister.salesByPayment?.pix || 0) +
    (cashRegister.salesByPayment?.debito || 0) +
    (cashRegister.salesByPayment?.credito || 0);
  const saldo = (cashRegister.initialAmount || 0) + totalVendas + totalDeposits - totalWithdrawals;

  const handlePrint = () => {
    setHasPrinted(true);
    window.print();
  };

  const handleClose = () => {
    if (!hasPrinted) {
      const confirmed = window.confirm(
        '⚠️ Você ainda não imprimiu o relatório.\nDeseja fechar mesmo assim?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <>
      {/* ERRCOM119: Estilos de impressão térmica 80mm */}
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .receipt-paper { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
          .receipt-paper {
            width: 76mm !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Container — não usa fixed aqui pois o AdminDashboard já fornece o overlay */}
      <div className="relative z-10 flex items-start justify-center w-full py-2">
        <div className="receipt-paper bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-y-auto max-h-[80vh]">

          {/* Header */}
          <div className="text-center py-5 px-4 border-b border-dashed border-gray-300">
            <p className="font-black text-gray-900 tracking-widest text-sm" style={{ fontFamily: 'Courier New, monospace' }}>
              VERSIORY STORE
            </p>
            <p className="font-bold text-gray-800 text-xs mt-1 tracking-wider" style={{ fontFamily: 'Courier New, monospace' }}>
              {reportTitle}
            </p>
            <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Courier New, monospace' }}>
              ID: #{shortId}
            </p>
          </div>

          {/* Corpo */}
          <div className="px-4 py-3 space-y-1 text-xs" style={{ fontFamily: 'Courier New, monospace' }}>

            {/* Cabeçalho de operação */}
            <div className="flex justify-between">
              <span className="text-gray-600">ABERTURA:</span>
              <span className="font-bold text-gray-900 text-right">
                {new Date(cashRegister.openedAt).toLocaleString('pt-BR')}
              </span>
            </div>
            {cashRegister.closedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">FECHAMENTO:</span>
                <span className="font-bold text-gray-900 text-right">
                  {new Date(cashRegister.closedAt).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">OPERADOR:</span>
              <span className="font-bold text-gray-900">{cashRegister.openedBy || 'Operador'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">STATUS:</span>
              <span className={`font-black ${isPartial ? 'text-orange-500' : 'text-green-600'}`}>
                {isPartial ? 'CONFERÊNCIA ABERTA' : 'CAIXA ENCERRADO'}
              </span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Resumo Financeiro */}
            <p className="font-black text-gray-900 underline uppercase mb-1">Resumo Financeiro</p>
            <div className="flex justify-between">
              <span className="text-gray-600">VALOR ABERTURA:</span>
              <span className="font-bold text-gray-900">{formatCurrency(cashRegister.initialAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VENDAS NO PERÍODO:</span>
              <span className="font-bold text-gray-900">{formatCurrency(cashRegister.totalSales || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">QTD PEDIDOS:</span>
              <span className="font-bold text-gray-900">{cashRegister.totalOrders || 0}</span>
            </div>
            {/* REFCOM152: Exibe o total de descontos aplicados */}
            {cashRegister.totalDiscounts && cashRegister.totalDiscounts > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-gray-600">DESCONTOS APLICADOS:</span>
                <span className="font-bold text-right">-{formatCurrency(cashRegister.totalDiscounts)}</span>
              </div>
            )}
            {/* REFCOM164: Exibe os cancelamentos do período */}
            {cashRegister.cancelledOrders && cashRegister.cancelledOrders > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="text-gray-600">CANCELAMENTOS ({cashRegister.cancelledOrders}):</span>
                <span className="font-bold text-right">-{formatCurrency(cashRegister.cancelledAmount || 0)}</span>
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* ERRCOM128: Detalhamento de Sangrias e Suprimentos */}
            {(cashRegister.withdrawals?.length > 0 || cashRegister.deposits?.length > 0) && (
              <>
                <p className="font-black text-gray-900 underline uppercase mb-1">Movimentações de Caixa</p>
                {cashRegister.deposits?.map((d, i) => (
                  <div key={`dep-${i}`} className="flex justify-between text-blue-600">
                    <span>SUPRIMENTO:</span>
                    <span className="font-bold">+{formatCurrency(d.amount)}</span>
                  </div>
                ))}
                {cashRegister.withdrawals?.map((w, i) => (
                  <div key={`wit-${i}`} className="flex justify-between text-red-600">
                    <span>SANGRIA:</span>
                    <span className="font-bold">-{formatCurrency(w.amount)}</span>
                  </div>
                ))}
                {cashRegister.withdrawals?.map((w, i) => (
                  <p key={`mot-${i}`} className="text-[9px] text-gray-500 italic mb-1">Motivo: {w.reason}</p>
                ))}
                <div className="border-t border-dashed border-gray-300 my-2" />
              </>
            )}

            {/* Total por forma de pagamento */}
            <p className="font-black text-gray-900 underline uppercase mb-1">Total por Forma de Pagto (QTD / VALOR)</p>
            {Object.entries(cashRegister.salesByPayment || {}).map(([method, amount]) => {
              const count = (cashRegister.salesByPaymentCount as Record<string, number>)?.[method] || 0;
              return (
                <div key={method} className="flex justify-between">
                  <span className="text-gray-700">{paymentLabels[method] || method.toUpperCase()}:</span>
                  <span className="font-bold text-gray-900">({count}) {formatCurrency(amount as number)}</span>
                </div>
              );
            })}

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Saldo em Caixa */}
            <div className="flex justify-between items-center py-1">
              <div>
                <span className="font-black text-gray-900 uppercase text-sm">Saldo Real em Caixa:</span>
                <p className="text-[9px] text-gray-400">(Abertura + Todas as Vendas + Suprimentos - Sangrias)</p>
              </div>
              <span className="font-black text-green-600 text-sm">{formatCurrency(saldo)}</span>
            </div>

            {/* Seção exclusiva de Fechamento */}
            {!isPartial && (
              <>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">VALOR INFORMADO:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(cashRegister.actualAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DIFERENÇA:</span>
                  <span className={`font-bold ${(cashRegister.difference || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(Math.abs(cashRegister.difference || 0))}
                    {(cashRegister.difference || 0) > 0 && ' (SOBRA)'}
                    {(cashRegister.difference || 0) < 0 && ' (FALTA)'}
                  </span>
                </div>
              </>
            )}

            {/* Nota parcial */}
            {isPartial && (
              <>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <p className="text-center text-gray-500 italic text-[10px] leading-relaxed">
                  Relatório de conferência parcial.<br />O caixa continua em operação.
                </p>
              </>
            )}

            {/* Assinaturas — apenas no Fechamento */}
            {!isPartial && (
              <>
                <div className="border-t border-dashed border-gray-300 my-3" />
                <div className="mt-6 mb-1 border-b border-gray-400 mx-4" />
                <p className="text-center text-[10px] text-gray-500">ASSINATURA DO OPERADOR</p>
                <div className="mt-8 mb-1 border-b border-gray-400 mx-4" />
                <p className="text-center text-[10px] text-gray-500">ASSINATURA DO GERENTE</p>
              </>
            )}

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Rodapé */}
            <p className="text-center text-[10px] text-gray-500 uppercase">
              EMITIDO EM: {new Date().toLocaleString('pt-BR')}
            </p>
            <p className="text-center text-[10px] text-gray-500 uppercase">
              {isPartial ? 'CONFERÊNCIA NÃO FISCAL' : 'FECHAMENTO NÃO FISCAL'}
            </p>
            <p className="text-center text-[10px] text-gray-400 mt-1">www.versiory.store</p>
          </div>

          {/* Botões de ação — ocultos na impressão */}
          <div className="print-hidden px-4 pb-4 pt-3 flex gap-3 border-t border-gray-100">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={async () => {
                // REFCOM139: Abrir em janela dedicada para evitar duplicação
                const { generateCashReportHTML } = await import('../utils/cashReportGenerator');
                const html = generateCashReportHTML(cashRegister as any);
                const win = window.open('', '_blank', 'width=420,height=700');
                if (win) { win.document.write(html); win.document.close(); }
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              📄 PDF
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            >
              ✕ Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CashRegisterReport;
