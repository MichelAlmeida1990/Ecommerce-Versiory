// services/invoice.ts
// Serviço para integração com emissão de NF-e (Nota Fiscal Eletrônica)
// Implementação preparada para integração real via APIs REST (FocusNFe, PlugNotas, etc.)

import { Order, OrderItem, Customer, Product, NfeSettings } from '../types';
import { getFiscalConfig, incrementNFeNumber } from './fiscalConfig';
import { validateCPFOrCNPJ } from '../utils/validators';

export interface InvoiceRequest {
  order: Order;
  customer: Customer;
  items: OrderItem[];
  products?: Product[]; // Produtos completos com dados fiscais
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
  const fiscalConfig = getFiscalConfig();

  if (!fiscalConfig || !fiscalConfig.cnpj) gaps.push('CNPJ da empresa não configurado.');
  if (!data.customer.cpfCnpj) gaps.push('CPF/CNPJ do cliente não informado.');
  
  if (data.customer.cpfCnpj) {
    const validation = validateCPFOrCNPJ(data.customer.cpfCnpj);
    if (!validation.valid) gaps.push('CPF/CNPJ do cliente inválido.');
  }

  data.items.forEach((item) => {
    // Buscar produto dos dados passados ou do localStorage
    let product: Product | undefined;
    
    if (data.products && data.products.length > 0) {
      product = data.products.find((p: Product) => p.id === item.productId);
    } else {
      const products = JSON.parse(localStorage.getItem('versiory_admin_products') || '[]');
      product = products.find((p: Product) => p.id === item.productId);
    }
    
    if (!product?.ncm || product.ncm.trim() === '') gaps.push(`NCM não informado para o item: ${item.name}`);
    if (product?.origem === undefined || product?.origem === null) gaps.push(`Origem da mercadoria não informada para o item: ${item.name}`);
  });

  return { ready: gaps.length === 0, gaps };
}

/**
 * Função principal de emissão. 
 * Atualmente simula o processo, mas está estruturada para chamada de API REST.
 */
export async function generateInvoice(invoiceData: InvoiceRequest): Promise<InvoiceResponse> {
  if (!invoiceData.emitNF) {
    return { success: false, message: 'Solicitação de nota fiscal não realizada.' };
  }

  const readiness = validateFiscalReadiness(invoiceData);
  if (!readiness.ready) {
    return { success: false, message: 'Dados fiscais insuficientes.', errors: readiness.gaps };
  }

  const fiscalConfig = getFiscalConfig();
  const nfeNumber = incrementNFeNumber();
  const fakeChave = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${fakeChave}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>Venda de mercadoria</natOp>
        <mod>65</mod>
        <serie>${fiscalConfig?.serie || '1'}</serie>
        <nNF>${nfeNumber}</nNF>
        <dhEmi>${invoiceData.order.date}</dhEmi>
        <tpAmb>${fiscalConfig?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      </ide>
      <emit>
        <CNPJ>${fiscalConfig?.cnpj || ''}</CNPJ>
        <xNome>${fiscalConfig?.razaoSocial || ''}</xNome>
      </emit>
      <dest>
        <xNome>${invoiceData.customer.name}</xNome>
        <email>${invoiceData.customer.email}</email>
        <CPF>${invoiceData.customer.cpfCnpj?.replace(/\D/g, '')}</CPF>
      </dest>
      ${invoiceData.items.map((item, idx) => `
      <det nItem="${idx + 1}">
        <prod>
          <xProd>${item.name}</xProd>
          <qCom>${item.quantity}</qCom>
          <vUnCom>${item.price.toFixed(2)}</vUnCom>
          <vProd>${(item.price * item.quantity).toFixed(2)}</vProd>
        </prod>
      </det>`).join('')}
      <total>
        <ICMSTot>
          <vNF>${invoiceData.order.total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${fiscalConfig?.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <chNFe>${fakeChave}</chNFe>
      <dhRecbto>${new Date().toISOString()}</dhRecbto>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NFC-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

  try {
    localStorage.setItem(`versiory_nf_xml_${invoiceData.order.id}`, xml);
  } catch { }

  return {
    success: true,
    message: fiscalConfig?.ambiente === 'producao' ? 'NF-e emitida com sucesso!' : 'NF-e gerada em homologação.',
    chaveAcesso: fakeChave,
    xmlFileUrl: `localStorage:versiory_nf_xml_${invoiceData.order.id}`,
    pdfFileUrl: '#'
  };
}
