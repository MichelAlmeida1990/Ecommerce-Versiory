import React from 'react';
import { Order, Customer } from '../types';

interface DanfePreviewProps {
    order: Order;
    customer: Customer;
    onClose: () => void;
}

const DanfePreview: React.FC<DanfePreviewProps> = ({ order, customer, onClose }) => {
    const chaveAcesso = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')).join(' ');
    const protocolo = "3141300004001 80";
    const dataEmissao = new Date(order.date).toLocaleString('pt-BR');
    const valorTotalItens = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const desconto = 8.00; // Valor fixo para exemplo conforme imagem
    const valorAPagar = valorTotalItens - desconto;
    const valorPago = valorAPagar + 20.00; // Exemplo de troco
    const troco = valorPago - valorAPagar;

    const downloadXml = () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${chaveAcesso.replace(/\s/g, '')}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>Venda de mercadoria</natOp>
        <mod>65</mod>
        <serie>1</serie>
        <nNF>${order.id.split('-')[1] || '000000001'}</nNF>
        <dhEmi>${order.date}</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000199</CNPJ>
        <xNome>Versiory Store LTDA</xNome>
        <email>contato@versiory.com</email>
      </emit>
      <dest>
        <xNome>${customer.name}</xNome>
        <email>${customer.email}</email>
      </dest>
      <det>
        ${order.items.map((item, idx) => `
        <nItem>${idx + 1}</nItem>
        <prod>
          <xProd>${item.name}</xProd>
          <qCom>${item.quantity}</qCom>
          <vUnCom>${item.price.toFixed(2)}</vUnCom>
          <vProd>${(item.price * item.quantity).toFixed(2)}</vProd>
        </prod>
        `).join('')}
      </det>
      <total>
        <ICMSTot>
          <vNF>${order.total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <chNFe>${chaveAcesso.replace(/\s/g, '')}</chNFe>
      <dhRecbto>${new Date().toISOString()}</dhRecbto>
      <nProt>${protocolo}</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NFC-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nfce-${order.id}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] rounded-none border-[1px] border-black">
                {/* Toolbar */}
                <div className="bg-slate-100 p-4 border-b border-slate-300 flex justify-between items-center no-print">
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.print()}
                            className="bg-versiory-ink text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimir NFC-e
                        </button>
                        <button
                            onClick={downloadXml}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Baixar XML
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Paper Content - NFC-e Style */}
                <div className="p-8 overflow-y-auto bg-white font-mono text-[9pt] leading-snug text-black nfce-container">
                    <style>{`
                        @media print {
                            .no-print { display: none !important; }
                            body { padding: 0; background: white; }
                            .nfce-container { padding: 0 !important; width: 80mm; margin: 0 auto; }
                            .fixed { position: relative !important; }
                            .max-w-lg { max-width: none !important; border: none !important; box-shadow: none !important; }
                        }
                        .dotted-line { border-top: 1px dotted black; margin: 8px 0; }
                    `}</style>

                    {/* Cabeçalho */}
                    <div className="text-center mb-4">
                        <div className="font-bold text-sm uppercase">Versiory Store LTDA</div>
                        <div className="text-[8pt]">CNPJ: 12.345.678/0001-99</div>
                        <div className="text-[8pt]">Rua do Comércio, 123 - Centro, São Paulo - SP</div>
                        <div className="font-bold mt-2 uppercase">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</div>
                    </div>

                    <div className="dotted-line"></div>

                    {/* Tabela de Itens */}
                    <div className="grid grid-cols-12 font-bold border-b border-black mb-1 pb-1">
                        <div className="col-span-2">Código</div>
                        <div className="col-span-4">Descrição</div>
                        <div className="col-span-2 text-right">Qtd</div>
                        <div className="col-span-2 text-right">Vl Unit</div>
                        <div className="col-span-2 text-right">Vl Total</div>
                    </div>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 mb-1">
                            <div className="col-span-2">{String(item.productId).slice(0, 6)}</div>
                            <div className="col-span-4 uppercase truncate">{item.name}</div>
                            <div className="col-span-2 text-right">{item.quantity} UN</div>
                            <div className="col-span-2 text-right">{item.price.toFixed(2)}</div>
                            <div className="col-span-2 text-right">{(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    ))}

                    <div className="dotted-line"></div>

                    {/* Totais */}
                    <div className="flex justify-between">
                        <div>Qtde. total de itens</div>
                        <div>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</div>
                    </div>
                    <div className="flex justify-between">
                        <div>Valor total R$</div>
                        <div>{valorTotalItens.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between">
                        <div>Desconto R$</div>
                        <div>{desconto.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between font-bold text-sm mt-1">
                        <div>Valor a Pagar R$</div>
                        <div>{valorAPagar.toFixed(2)}</div>
                    </div>

                    {/* Pagamento */}
                    <div className="flex justify-between mt-2">
                        <div>FORMA PAGAMENTO</div>
                        <div>VALOR PAGO R$</div>
                    </div>
                    <div className="flex justify-between">
                        <div>Cartão de Crédito</div>
                        <div>{valorPago.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between">
                        <div>Troco R$</div>
                        <div>{troco.toFixed(2)}</div>
                    </div>

                    <div className="dotted-line"></div>

                    {/* Chave de Acesso e QR Code Container */}
                    <div className="flex gap-4 items-start">
                        <div className="flex-grow">
                            <div className="text-center font-bold mb-1">Consulte pela Chave de Acesso em</div>
                            <div className="text-center text-[7pt] mb-1">www.nfe.fazenda.gov.br/portal/consulta</div>
                            <div className="text-center font-bold break-all text-[8pt]">{chaveAcesso}</div>

                            <div className="mt-4 border-t border-black pt-2">
                                <div className="uppercase font-bold">Consumidor - CPF {customer.cpfCnpj || '000.000.000-00'}</div>
                                <div className="uppercase">{customer.name}</div>
                            </div>

                            <div className="mt-2 text-[7pt]">
                                <div className="font-bold">NFC-e nº 000000001  Série 001  {dataEmissao}</div>
                                <div>Protocolo de autorização: {protocolo}</div>
                                <div>Data de autorização: {dataEmissao}</div>
                            </div>
                        </div>

                        {/* QR Code Realista (SVG) */}
                        <div className="w-32 h-32 flex-shrink-0 border border-black p-1 flex items-center justify-center bg-white self-center">
                            <svg viewBox="0 0 21 21" className="w-full h-full shape-rendering-crispEdges" fill="black">
                                {/* Quadrados de Posição (Finders) */}
                                <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm1 1h3v3H2V2z" />
                                <path d="M14 0h7v7h-7V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2z" />
                                <path d="M0 14h7v7H0v-7zm1 1v5h5v-5H1zm1 1h3v3H2v-3z" />

                                {/* Padding dos Finders */}
                                <path fill="white" d="M7 0h1v8H0v-1h7V0zM13 0h1v8h7v-1h-7V0zM0 13h8v8h-1v-7H0v-1z" />

                                {/* Corpo do QR Code (Densenso) */}
                                {Array.from({ length: 441 }).map((_, i) => {
                                    const x = i % 21;
                                    const y = Math.floor(i / 21);

                                    // Pular áreas dos finders e seus arredores
                                    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return null;

                                    // Padrão pseudo-aleatório denso (gera 60% de preenchimento)
                                    const seed = (x * 7) + (y * 13);
                                    if ((seed % 10) < 6) {
                                        return <rect key={i} x={x} y={y} width="1" height="1" />;
                                    }
                                    return null;
                                })}

                                {/* Linhas de Timing e Micro-ajustes */}
                                <path d="M8 6h5v1H8zm-2 2v5h1V8z" />
                                <path d="M16 16h1v1h-1z" />
                            </svg>
                        </div>
                    </div>

                    <div className="dotted-line"></div>

                    <div className="text-center text-[7pt] uppercase mt-2">
                        Tributos Totais Incidentes (Lei Federal 12.741/2012): R$ {(valorAPagar * 0.18).toFixed(2)}
                    </div>
                    <div className="text-center italic text-[8pt] mt-2">
                        Obrigado pela preferência!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DanfePreview;
