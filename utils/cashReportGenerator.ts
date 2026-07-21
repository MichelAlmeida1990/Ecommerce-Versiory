const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface CashMovement {
  amount: number;
  reason: string;
  type: 'deposit' | 'withdrawal';
}

interface CashRegisterData {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  initialAmount: number;
  totalSales: number;
  totalOrders: number;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  withdrawals: CashMovement[];
  deposits: CashMovement[];
  salesByPayment: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
  };
  salesByPaymentCount: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
  };
  totalDiscounts?: number; // REFCOM171: Total de descontos aplicados
  cancelledOrders?: number; // REFCOM171: Quantidade de pedidos cancelados
  cancelledAmount?: number; // REFCOM171: Valor total dos pedidos cancelados
}

export const generateCashReportHTML = (data: CashRegisterData): string => {
  const isPartial = !data.closedAt;
  const title = isPartial ? 'LEITURA X (PARCIAL)' : 'FECHAMENTO DE CAIXA';
  const shortId = isPartial
    ? data.id.replace('PARTIAL-', '').slice(-8).toUpperCase()
    : new Date(data.closedAt || data.openedAt).toLocaleDateString('pt-BR').split('/').join('');
  const titleWithId = isPartial ? `${title} – ${shortId}` : `${title} - ${shortId}`;
  const headerColor = isPartial ? '#475569' : '#000000';
  const bgColor = isPartial ? '#f8fafc' : '#ffffff';

  // REFCOM128: Calcular o saldo de forma robusta e idêntica ao CashRegisterReport
  const totalVendas = (data.salesByPayment?.dinheiro || 0) +
    (data.salesByPayment?.pix || 0) +
    (data.salesByPayment?.debito || 0) +
    (data.salesByPayment?.credito || 0);
  const totalDeposits = (data.deposits || []).reduce((acc, d) => acc + d.amount, 0);
  const totalWithdrawals = (data.withdrawals || []).reduce((acc, w) => acc + w.amount, 0);
  const expectedBalance = (data.initialAmount || 0) + totalVendas + totalDeposits - totalWithdrawals;
  const computedDifference = data.closedAt ? (data.actualAmount - expectedBalance) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titleWithId}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Courier New', Courier, monospace; 
          width: 72mm; 
          margin: 0; 
          padding: 4mm; 
          color: #000; 
          line-height: 1.2; 
          font-size: 11px;
          background-color: ${bgColor};
        }
        @page { margin: 0; size: auto; }
        .header { 
          text-align: center; 
          border-bottom: 2px solid ${headerColor}; 
          padding-bottom: 5px; 
          margin-bottom: 10px; 
        }
        .title { 
          font-size: 1.3em; 
          font-weight: 900; 
          margin: 0; 
          color: ${headerColor};
          text-transform: uppercase;
        }
        .info { font-size: 0.95em; margin: 3px 0; }
        .section { margin-top: 10px; border-top: 1px dashed #666; padding-top: 5px; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 3px; font-size: 1.1em; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .bold { font-weight: bold; }
        .footer { text-align: center; font-size: 0.85em; margin-top: 15px; border-top: 1px dashed #000; padding-top: 5px; }
        .highlight { background: #eee; padding: 2px 4px; font-weight: bold; }
        .signature-area { margin-top: 30px; text-align: center; }
        .signature-line { border-top: 1px solid #000; width: 80%; margin: 20px auto 5px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <p class="title">VERSIORY STORE</p>
        <p class="info" style="font-weight: bold; font-size: 1.1em;">${titleWithId}</p>
        <p class="info">ID: #${shortId}</p>
      </div>

      <div class="info">
        <div class="row"><span>ABERTURA:</span> <span>${new Date(data.openedAt).toLocaleString('pt-BR', { hour12: false })}</span></div>
        ${data.closedAt ? `<div class="row"><span>FECHAMENTO:</span> <span>${new Date(data.closedAt).toLocaleString('pt-BR', { hour12: false })}</span></div>` : ''}
        <div class="row"><span>OPERADOR:</span> <span>${data.openedBy}</span></div>
        <div class="row"><span>STATUS:</span> <span class="bold" style="color: ${isPartial ? '#f59e0b' : '#10b981'}">${isPartial ? 'CONFERÊNCIA ABERTA' : 'CAIXA ENCERRADO'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">RESUMO FINANCEIRO</div>
        <div class="row"><span>VALOR ABERTURA:</span> <span class="bold">${formatCurrency(data.initialAmount)}</span></div>
        <div class="row"><span>VENDAS NO PERÍODO:</span> <span class="bold">${formatCurrency(data.totalSales)}</span></div>
        <div class="row"><span>QTD PEDIDOS:</span> <span>${data.totalOrders}</span></div>
        ${data.totalDiscounts && data.totalDiscounts > 0 ? `<div class="row"><span>DESCONTOS APLICADOS:</span> <span class="bold" style="color: #f59e0b;">-${formatCurrency(data.totalDiscounts)}</span></div>` : ''}
        ${data.cancelledOrders && data.cancelledOrders > 0 ? `<div class="row"><span>PEDIDOS CANCELADOS:</span> <span class="bold" style="color: #ef4444;">${data.cancelledOrders} (${formatCurrency(data.cancelledAmount || 0)})</span></div>` : ''}
      </div>

      ${data.withdrawals.length > 0 ? `
      <div class="section">
        <div class="section-title">SANGRIAS (RETIRADAS)</div>
        ${data.withdrawals.map(w => `
          <div class="row"><span>- ${w.reason.slice(0, 18)}:</span> <span>${formatCurrency(w.amount)}</span></div>
        `).join('')}
      </div>
      ` : ''}

      ${data.deposits.length > 0 ? `
      <div class="section">
        <div class="section-title">SUPRIMENTOS (ENTRADAS)</div>
        ${data.deposits.map(d => `
          <div class="row"><span>+ ${d.reason.slice(0, 18)}:</span> <span>${formatCurrency(d.amount)}</span></div>
        `).join('')}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">DIVISÃO POR FORMA DE PAGTO</div>
        <div class="row"><span>DINHEIRO:</span> <span>${formatCurrency(data.salesByPayment.dinheiro)} (${data.salesByPaymentCount?.dinheiro || 0})</span></div>
        <div class="row"><span>PIX:</span> <span>${formatCurrency(data.salesByPayment.pix)} (${data.salesByPaymentCount?.pix || 0})</span></div>
        <div class="row"><span>DÉBITO:</span> <span>${formatCurrency(data.salesByPayment.debito)} (${data.salesByPaymentCount?.debito || 0})</span></div>
        <div class="row"><span>CRÉDITO:</span> <span>${formatCurrency(data.salesByPayment.credito)} (${data.salesByPaymentCount?.credito || 0})</span></div>
      </div>

      <div class="section">
        <div class="section-title">DETALHES DO SALDO EM CAIXA</div>
        <div class="row"><span>ABERTURA:</span> <span>${formatCurrency(data.initialAmount)}</span></div>
        <div class="row"><span>+ VENDAS:</span> <span>${formatCurrency(totalVendas)}</span></div>
        <div class="row"><span>+ SUPRIMENTOS:</span> <span>${formatCurrency(totalDeposits)}</span></div>
        <div class="row"><span>- SANGRIAS:</span> <span>-${formatCurrency(totalWithdrawals)}</span></div>
        <div class="row" style="border-top: 1px dashed #666; padding-top: 3px; margin-top: 3px;">
          <span class="bold">= SALDO ESPERADO:</span>
          <span class="bold">${formatCurrency(expectedBalance)}</span>
        </div>
      </div>

      <div class="section" style="border-top: 2px solid #000;">
        <div class="row bold" style="font-size: 1.25em; margin-top: 8px;">
          <span>SALDO REAL CAIXA:</span>
          <span>${formatCurrency(expectedBalance)}</span>
        </div>
        ${!isPartial ? `
        <div class="row bold" style="margin-top: 10px;"><span>VALOR INFORMADO:</span> <span>${formatCurrency(data.actualAmount)}</span></div>
        <div class="row bold" style="${computedDifference < 0 ? 'color: red;' : ''}">
          <span>DIFERENÇA:</span> 
          <span>${formatCurrency(computedDifference)}</span>
          ${computedDifference > 0 ? ' (SOBRA)' : ''}
          ${computedDifference < 0 ? ' (FALTA)' : ''}
        </div>
        ` : `
        <div style="text-align: center; margin-top: 15px; font-style: italic; color: #444; font-size: 10px; border: 1px solid #ccc; padding: 5px;">
          LEITURA X DE CONFERÊNCIA PARCIAL.<br>MOVIMENTAÇÃO EM CURSO.
        </div>
        `}
      </div>

      ${!isPartial ? `
      <div class="signature-area">
        <div class="signature-line"></div>
        <p class="info">ASSINATURA DO OPERADOR</p>
        
        <div class="signature-line" style="margin-top: 30px;"></div>
        <p class="info">ASSINATURA DO GERENTE</p>
      </div>
      ` : ''}

      <div class="footer">
        <p>EMITIDO EM: ${new Date().toLocaleString('pt-BR')}</p>
        <p>${isPartial ? 'CONFERÊNCIA NÃO FISCAL' : 'FECHAMENTO NÃO FISCAL'}</p>
        <p>www.versiory.store</p>
      </div>

      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};
