// services/invoice.ts
// Serviço para integração com emissão de NF-e (Nota Fiscal Eletrônica)
// Implementação preparada para integração real via APIs REST (FocusNFe, PlugNotas, etc.)

import { Order, OrderItem, Customer, Product, NfeSettings } from '../types';

export interface InvoiceRequest {
  order: Order;
  customer: Customer;
  items: OrderItem[];
  emitNF: boolean;
  settings?: NfeSettings; // Dados fiscais do emissor (cliente final)
}

export interface InvoiceResponse {
  success: boolean;
  xmlFileUrl?: string;
  pdfFileUrl?: string;
  chaveAcesso?: string; // Chave de 44 dígitos da NF-e
  message?: string;
  errors?: string[];
}

/**
 * Valida se todos os dados necessários para emissão real estão presentes.
 * Isso garante que o sistema esteja "no jeito" para o cliente final.
 */
export function validateFiscalReadiness(data: InvoiceRequest): { ready: boolean; gaps: string[] } {
  const gaps: string[] = [];

  // Validação do Cliente (Destinatário)
  if (!data.customer.cpfCnpj) gaps.push('CPF/CNPJ do cliente não informado.');
  if (!data.customer.addresses[0]?.ibgeCode) gaps.push('Código IBGE da cidade do cliente não informado.');

  // Validação dos Itens
  data.items.forEach((item, index) => {
    // Aqui assumimos que temos acesso aos produtos completos para checar NCM
    const products = JSON.parse(localStorage.getItem('versiory_products') || '[]');
    const product = products.find((p: Product) => p.id === item.productId);

    if (!product?.ncm) gaps.push(`NCM não informado para o item: ${item.name}`);
    if (!product?.origem && product?.origem !== 0) gaps.push(`Origem da mercadoria não informada para o item: ${item.name}`);
  });

  return {
    ready: gaps.length === 0,
    gaps
  };
}

/**
 * Função principal de emissão. 
 * Atualmente simula o processo, mas está estruturada para chamada de API REST.
 */
export async function generateInvoice(invoiceData: InvoiceRequest): Promise<InvoiceResponse> {
  if (!invoiceData.emitNF) {
    return { success: false, message: 'Solicitação de nota fiscal não realizada.' };
  }

  // Check de Prontidão (Pre-flight)
  const readiness = validateFiscalReadiness(invoiceData);
  if (!readiness.ready && invoiceData.settings?.ambiente === 'producao') {
    return {
      success: false,
      message: 'Dados fiscais insuficientes para emissão em produção.',
      errors: readiness.gaps
    };
  }

  // BLUEPRINT PARA INTEGRAÇÃO REAL:
  // const response = await fetch('https://api.focusnfe.com.br/v2/nfe', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Basic ${btoa(invoiceData.settings.apiToken + ':')}` },
  //   body: JSON.stringify(mapToApiFormat(invoiceData))
  // });

  // Simulando delay de processamento SEFAZ
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Geração de Chave de Acesso fictícia (44 dígitos)
  const fakeChave = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');

  // Simulando XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?><infNFe Id="NFe${fakeChave}" versao="4.00">...</infNFe>`;

  try {
    localStorage.setItem(`versiory_nf_xml_${invoiceData.order.id}`, xml);
  } catch { }

  return {
    success: true,
    message: invoiceData.settings?.ambiente === 'producao'
      ? 'NF-e emitida e autorizada com sucesso!'
      : 'Simulação de NF-e concluída. Sistema pronto para produção.',
    chaveAcesso: fakeChave,
    xmlFileUrl: `localStorage:versiory_nf_xml_${invoiceData.order.id}`,
    pdfFileUrl: '#' // Link para o DANFE gerado
  };
}
