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
}

export const generateCashReportHTML = (data: CashRegisterData): string => {
  const isPartial = !data.closedAt;
  const title = isPartial ? 'LEITURA X (PARCIAL)' : 'FECHAMENTO DE CAIXA';
  const headerColor = isPartial ? '#475569' : '#000000'; // Slate-600 vs Black
  const bgColor = isPartial ? '#f8fafc' : '#ffffff';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - ${data.id.slice(-8)}</title>
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
        <p class="info" style="font-weight: bold; font-size: 1.1em;">${title}</p>
        <p class="info">ID: #${data.id.slice(-8)}</p>
      </div>

      <div class="info">
        <div class="row"><span>ABERTURA:</span> <span>${new Date(data.openedAt).toLocaleString('pt-BR')}</span></div>
        ${data.closedAt ? `<div class="row"><span>FECHAMENTO:</span> <span>${new Date(data.closedAt).toLocaleString('pt-BR')}</span></div>` : ''}
        <div class="row"><span>OPERADOR:</span> <span>${data.openedBy}</span></div>
        <div class="row"><span>STATUS:</span> <span class="bold" style="color: ${isPartial ? '#b45309' : '#15803d'}">${isPartial ? 'CONFERÊNCIA ABERTA' : 'CAIXA ENCERRADO'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">RESUMO FINANCEIRO</div>
        <div class="row"><span>VALOR ABERTURA:</span> <span class="bold">${formatCurrency(data.initialAmount)}</span></div>
        <div class="row"><span>VENDAS NO PERÍODO:</span> <span class="bold">${formatCurrency(data.totalSales)}</span></div>
        <div class="row"><span>QTD PEDIDOS:</span> <span>${data.totalOrders}</span></div>
      </div>

      ${data.withdrawals.length > 0 ? `
      <div class="section">
        <div class="section-title">SANGRIAS (RETIRADAS)</div>
        ${data.withdrawals.map(w => `
          <div class="row"><span>- ${w.reason.slice(0, 20)}</span> <span>${formatCurrency(w.amount)}</span></div>
        `).join('')}
      </div>
      ` : ''}

      ${data.deposits.length > 0 ? `
      <div class="section">
        <div class="section-title">SUPRIMENTOS (ENTRADAS)</div>
        ${data.deposits.map(d => `
          <div class="row"><span>+ ${d.reason.slice(0, 20)}</span> <span>${formatCurrency(d.amount)}</span></div>
        `).join('')}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">TOTAL POR FORMA DE PAGTO (QTD / VALOR)</div>
        <div class="row"><span>DINHEIRO:</span> <span>(${data.salesByPaymentCount?.dinheiro || 0}) ${formatCurrency(data.salesByPayment.dinheiro)}</span></div>
        <div class="row"><span>PIX:</span> <span>(${data.salesByPaymentCount?.pix || 0}) ${formatCurrency(data.salesByPayment.pix)}</span></div>
        <div class="row"><span>DÉBITO:</span> <span>(${data.salesByPaymentCount?.debito || 0}) ${formatCurrency(data.salesByPayment.debito)}</span></div>
        <div class="row"><span>CRÉDITO:</span> <span>(${data.salesByPaymentCount?.credito || 0}) ${formatCurrency(data.salesByPayment.credito)}</span></div>
      </div>

      <div class="section" style="border-top: 2px solid #000;">
        <div class="row bold" style="font-size: 1.2em; margin-top: 5px;">
          <span>SALDO EM CAIXA:</span>
          <span class="highlight">${formatCurrency(data.expectedAmount)}</span>
        </div>
        ${!isPartial ? `
        <div class="row bold" style="margin-top: 10px;"><span>VALOR INFORMADO:</span> <span>${formatCurrency(data.actualAmount)}</span></div>
        <div class="row bold" style="${data.difference < 0 ? 'color: red;' : ''}">
          <span>DIFERENÇA:</span> 
          <span>${formatCurrency(data.difference)}</span>
        </div>
        ` : `
        <div style="text-align: center; margin-top: 10px; font-style: italic; color: #666; font-size: 0.9em;">
          Relatório de conferência parcial. <br> O caixa continua em operação.
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
