import { Order, CartItem } from '../types';

interface ReceiptData {
  orderId: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  items: CartItem[];
  total: number;
  notes?: string;
}

export const generateReceiptHTML = (data: ReceiptData): string => {
  const { orderId, date, customerName, customerAddress, items, total, notes } = data;

  // Verificar se há serviços no pedido
  const hasServices = items.some(item => item.category === 'Serviços');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cupom de Venda - ${orderId}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Courier New', Courier, monospace; 
          width: 72mm; 
          margin: 0; 
          padding: 4mm; 
          color: #000; 
          line-height: 1.2; 
          font-size: 12px;
        }
        @page { 
          margin: 0; 
          size: auto;
        }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
        .title { font-size: 1.4em; font-weight: bold; margin: 0; }
        .info { font-size: 0.9em; margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { text-align: left; border-bottom: 1px dashed #000; font-size: 0.9em; padding-bottom: 2px; }
        td { padding: 3px 0; font-size: 0.9em; vertical-align: top; }
        .total { border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; font-weight: bold; font-size: 1.2em; display: flex; justify-content: space-between; }
        .service-details { margin-top: 10px; border: 1px solid #000; padding: 5px; font-size: 0.8em; }
        .service-title { font-weight: bold; text-align: center; border-bottom: 1px solid #000; margin-bottom: 3px; }
        .footer { text-align: center; font-size: 0.8em; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; padding-bottom: 20px; }
        .installments { font-size: 0.8em; margin-top: 2px; font-weight: bold; }
        @media print { 
          body { width: 72mm; } 
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <p class="title">VERSIORY STORE</p>
        <p class="info">Transformando Ideias em Sucesso</p>
        <p class="info">----------------------------</p>
        <p class="info">PEDIDO: ${orderId}</p>
        <p class="info">DATA: ${date}</p>
      </div>
      
      <div class="info">
        <strong>CLIENTE:</strong> ${customerName}<br>
        <strong>ENDEREÇO:</strong> ${customerAddress || 'Não informado'}
      </div>

      <table>
        <thead>
          <tr>
            <th>ITEM</th>
            <th style="text-align:right">QTD</th>
            <th style="text-align:right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
    const variantInfo = [item.selectedSize, item.selectedColor].filter(Boolean).join(' / ');
    return `
              <tr>
                <td>
                  ${item.name}${variantInfo ? ' (' + variantInfo + ')' : ''}
                  ${item.installments && item.installments > 1 ? `
                    <div class="installments">
                      Em até ${item.installments}x de R$ ${(item.price / item.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  ` : ''}
                </td>
                <td style="text-align:right">${item.quantity}</td>
                <td style="text-align:right">R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>

      <div class="total">
        <span>TOTAL</span>
        <span>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>

      ${notes ? `
        <div class="info" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
          <strong>OBSERVAÇÕES:</strong><br>
          ${notes}
        </div>
      ` : ''}
      
      ${hasServices ? `
        <div class="service-details">
          <div class="service-title">DETALHAMENTO DE SERVIÇOS</div>
          <p>Este cupom inclui prestação de serviços. Os detalhes técnicos, garantias e condições de execução seguem o contrato padrão da oficina/loja.</p>
          <p><strong>Garantia de Serviço:</strong> 90 dias (conforme CDC) para mão de obra, exceto mau uso ou desgaste natural.</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>ESTE DOCUMENTO NÃO TEM VALOR FISCAL</p>
        <p>Obrigado pela preferência!</p>
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
