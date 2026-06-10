import { Order, CartItem } from '../types';

interface ReceiptData {
  orderId: string;
  date: string;
  orderTime?: string; // ERRCOM083
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCpfCnpj?: string; // ERRCOM070
  items: CartItem[];
  total: number;
  paymentMethod?: string;
  notes?: string;
  storePolicies?: string;
  isBudget?: boolean;
  salesChannel?: string; // ERRCOM081
  installments?: number; // REFCOM135
  installmentDetails?: any[]; // REFCOM135
  discountAmount?: number; // REFCOM151
  discountType?: string; // REFCOM151
  couponCode?: string; // REFCOM151
}

export const generateReceiptHTML = (data: ReceiptData): string => {
  const { orderId, date, orderTime, customerName, customerAddress, customerPhone, customerEmail, customerCpfCnpj, items, total, paymentMethod, notes, storePolicies, isBudget, salesChannel, discountAmount, discountType, couponCode } = data;

  // Verificar se há serviços no pedido
  const hasServices = items.some(item => item.category === 'Serviços');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${isBudget ? 'Orçamento' : 'Cupom de Venda'} - ${orderId}</title>
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
        .payment-method { margin-top: 5px; font-weight: bold; font-size: 1em; display: flex; justify-content: space-between; }
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
        <p class="title">${isBudget ? 'ORÇAMENTO' : 'VERSIORY STORE'}</p>
        ${isBudget ? '<p class="info">Versiory Store</p>' : '<p class="info">Transformando Ideias em Sucesso</p>'}
        <p class="info">----------------------------</p>
        <p class="info">${isBudget ? 'ORÇAMENTO' : 'PEDIDO'}: ${orderId}</p>
        <p class="info">DATA: ${date} ${orderTime || new Date().toLocaleTimeString('pt-BR')}</p>
        <div class="no-print" style="margin-bottom: 10px; text-align: center;">
          <button onclick="window.print()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%;">
            💾 Baixar PDF / Imprimir
          </button>
        </div>
      </div>
      
      <div class="info">
        <strong>CLIENTE:</strong> ${customerName}<br>
        ${customerPhone ? `<strong>TELEFONE:</strong> ${customerPhone}<br>` : ''}
        ${customerEmail ? `<strong>E-MAIL:</strong> ${customerEmail}<br>` : ''}
        ${customerCpfCnpj ? `<strong>CPF/CNPJ:</strong> ${customerCpfCnpj}<br>` : ''}
        ${customerAddress ? `<strong>ENDEREÇO:</strong> ${customerAddress}<br>` : ''}
        ${salesChannel ? `<strong>ORIGEM:</strong> ${salesChannel.toUpperCase()}` : ''}
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
    const itemPrice = (item as any).pricePOS || item.price; // REFCOM134: PDV usa pricePOS
    // REFCOM153: Não mostrar parcelamento por item, usar apenas o parcelamento do pedido
    return `
              <tr>
                <td>
                  ${item.name}${variantInfo ? ' (' + variantInfo + ')' : ''}
                </td>
                <td style="text-align:right">${item.quantity}</td>
                <td style="text-align:right">R$ ${(itemPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>

      ${discountAmount && discountAmount > 0 ? `
      <div class="discount" style="display:flex; justify-content:space-between; margin-top:5px; font-size:11px; color:#d32f2f;">
        <span>DESCONTO${couponCode ? ` (${couponCode})` : ''}:</span>
        <span>-R$ ${discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      ` : ''}

      <div class="total">
        <span>TOTAL</span>
        <span>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>

      ${paymentMethod && !isBudget ? `
      <div class="payment-method">
        <span>FORMA PAGTO:</span>
        <span>${paymentMethod.toUpperCase()}</span>
      </div>
      ` : ''}

      ${(data as any).installments && (data as any).installments > 1 && paymentMethod && !isBudget ? `
      <div class="payment-method" style="font-size:0.85em; color:#444;">
        <span>PARCELAMENTO:</span>
        <span>Parcelado em ${(data as any).installments}x de R$ ${((data.total) / (data as any).installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      ${(data as any).installmentDetails ? `
      <div style="font-size:0.75em; color:#666; margin-top:2px; padding-left:4px;">
        ${(data as any).installmentDetails.map((inst: any) => `<div>- Parcela ${inst.number}: R$ ${inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${inst.status === 'paid' ? 'Paga' : 'Pendente'})</div>`).join('')}
      </div>
      ` : ''}
      ` : ''}

      ${notes ? `
        <div class="info" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
          <strong>OBSERVAÇÕES:</strong><br>
          ${notes}
        </div>
      ` : ''}
      
      ${hasServices ? `
        <div class="service-details">
          <div class="service-title">${isBudget ? 'POLÍTICAS E GARANTIA' : 'DETALHAMENTO DE SERVIÇOS'}</div>
          ${storePolicies ? `<p>${storePolicies.replace(/\\n/g, '<br>')}</p>` : `
          <p>Este documento inclui prestação de serviços. Os detalhes técnicos, garantias e condições de execução seguem o contrato padrão da oficina/loja.</p>
          <p><strong>Garantia de Serviço:</strong> 90 dias (conforme CDC) para mão de obra, exceto mau uso ou desgaste natural.</p>
          `}
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
