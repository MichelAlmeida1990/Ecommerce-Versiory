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
}

export const generateCashReportHTML = (data: CashRegisterData): string => {
  const isPartial = !data.closedAt;
  const title = isPartial ? 'LEITURA X (PARCIAL)' : 'FECHAMENTO DE CAIXA';

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
        }
        @page { margin: 0; size: auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
        .title { font-size: 1.2em; font-weight: bold; margin: 0; }
        .info { font-size: 0.9em; margin: 2px 0; }
        .section { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 3px; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .bold { font-weight: bold; }
        .footer { text-align: center; font-size: 0.8em; margin-top: 15px; border-top: 1px dashed #000; padding-top: 5px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <p class="title">VERSIORY STORE</p>
        <p class="info">${title}</p>
        <p class="info">ID: #${data.id.slice(-8)}</p>
      </div>

      <div class="info">
        <div class="row"><span>ABERTURA:</span> <span>${new Date(data.openedAt).toLocaleString('pt-BR')}</span></div>
        ${data.closedAt ? `<div class="row"><span>FECHAMENTO:</span> <span>${new Date(data.closedAt).toLocaleString('pt-BR')}</span></div>` : ''}
        <div class="row"><span>OPERADOR:</span> <span>${data.openedBy}</span></div>
        <div class="row"><span>STATUS:</span> <span class="bold">${isPartial ? 'ABERTO' : 'FECHADO'}</span></div>
      </div>

      <div class="section">
        <div class="row bold"><span>VALOR ABERTURA:</span> <span>${formatCurrency(data.initialAmount)}</span></div>
        <div class="row bold"><span>VENDAS NO PERIODO:</span> <span>${formatCurrency(data.totalSales)}</span></div>
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
        <div class="section-title">TOTAL POR PAGAMENTO</div>
        <div class="row"><span>DINHEIRO:</span> <span>${formatCurrency(data.salesByPayment.dinheiro)}</span></div>
        <div class="row"><span>PIX:</span> <span>${formatCurrency(data.salesByPayment.pix)}</span></div>
        <div class="row"><span>DEBITO:</span> <span>${formatCurrency(data.salesByPayment.debito)}</span></div>
        <div class="row"><span>CREDITO:</span> <span>${formatCurrency(data.salesByPayment.credito)}</span></div>
      </div>

      <div class="section" style="border-top: 2px solid #000;">
        <div class="row bold" style="font-size: 1.1em;">
          <span>VALOR APURADO:</span>
          <span>${formatCurrency(data.expectedAmount)}</span>
        </div>
        ${!isPartial ? `
        <div class="row bold"><span>VALOR INFORMADO:</span> <span>${formatCurrency(data.actualAmount)}</span></div>
        <div class="row bold"><span>DIFERENÇA:</span> <span>${formatCurrency(data.difference)}</span></div>
        ` : ''}
      </div>

      <div class="footer">
        <p>${new Date().toLocaleString('pt-BR')}</p>
        <p>CONFERENCIA DE CAIXA</p>
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
