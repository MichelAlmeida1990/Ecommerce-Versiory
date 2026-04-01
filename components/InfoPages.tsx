import React from 'react';

type InfoPageType = 'about' | 'privacy' | 'terms' | 'faq' | 'returns' | 'shipping' | 'payment' | null;

interface InfoPagesProps {
  page: InfoPageType;
  onClose: () => void;
}

const CONTENT: Record<NonNullable<InfoPageType>, { title: string; body: React.ReactNode }> = {
  about: {
    title: 'Sobre Nós',
    body: (
      <div className="space-y-4 text-slate-600">
        <p>A <strong>Versiory Store</strong> é uma loja virtual dedicada a oferecer produtos de qualidade com a melhor experiência de compra.</p>
        <p>Nossa missão é transformar ideias em sucesso, conectando clientes a produtos incríveis com atendimento personalizado e entrega rápida.</p>
        <p>Trabalhamos com os melhores fornecedores para garantir qualidade, segurança e satisfação em cada pedido.</p>
      </div>
    )
  },
  privacy: {
    title: 'Política de Privacidade',
    body: (
      <div className="space-y-4 text-slate-600">
        <p>Seus dados pessoais são tratados com total segurança e confidencialidade.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Coletamos apenas os dados necessários para processar seus pedidos.</li>
          <li>Não compartilhamos suas informações com terceiros sem seu consentimento.</li>
          <li>Utilizamos criptografia para proteger seus dados de pagamento.</li>
          <li>Você pode solicitar a exclusão dos seus dados a qualquer momento.</li>
        </ul>
      </div>
    )
  },
  terms: {
    title: 'Termos de Uso',
    body: (
      <div className="space-y-4 text-slate-600">
        <p>Ao utilizar nossa plataforma, você concorda com os seguintes termos:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>As informações fornecidas devem ser verdadeiras e atualizadas.</li>
          <li>É proibido o uso da plataforma para fins ilícitos.</li>
          <li>Os preços e disponibilidade de produtos podem ser alterados sem aviso prévio.</li>
          <li>A Versiory Store reserva-se o direito de cancelar pedidos suspeitos de fraude.</li>
        </ul>
      </div>
    )
  },
  faq: {
    title: 'Perguntas Frequentes',
    body: (
      <div className="space-y-4 text-slate-600">
        {[
          { q: 'Como rastrear meu pedido?', a: 'Acesse "Minha Conta" > "Meus Pedidos" para ver o código de rastreamento.' },
          { q: 'Qual o prazo de entrega?', a: 'O prazo varia de 3 a 10 dias úteis dependendo da sua região.' },
          { q: 'Posso trocar ou devolver um produto?', a: 'Sim, aceitamos trocas e devoluções em até 7 dias após o recebimento.' },
          { q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário.' },
          { q: 'Como entrar em contato com o suporte?', a: 'Pelo WhatsApp (11) 95854-0171 ou pelo botão de suporte na loja.' },
        ].map(({ q, a }) => (
          <div key={q} className="border-b border-slate-100 pb-4">
            <p className="font-bold text-slate-900 mb-1">{q}</p>
            <p>{a}</p>
          </div>
        ))}
      </div>
    )
  },
  returns: {
    title: 'Trocas e Devoluções',
    body: (
      <div className="space-y-4 text-slate-600">
        <p>Nossa política de trocas e devoluções é simples e transparente:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Prazo de 7 dias corridos após o recebimento para solicitar troca ou devolução.</li>
          <li>O produto deve estar em perfeito estado, sem uso e com embalagem original.</li>
          <li>O frete de devolução é por conta da Versiory Store em caso de defeito.</li>
          <li>O reembolso é processado em até 5 dias úteis após recebermos o produto.</li>
        </ul>
        <p>Para iniciar uma troca, entre em contato pelo WhatsApp: (11) 95854-0171.</p>
      </div>
    )
  },
  shipping: {
    title: 'Informações de Entrega',
    body: (
      <div className="space-y-4 text-slate-600">
        <p>Entregamos para todo o Brasil com frete grátis!</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Sudeste:</strong> 3 a 5 dias úteis</li>
          <li><strong>Sul e Centro-Oeste:</strong> 5 a 7 dias úteis</li>
          <li><strong>Nordeste e Norte:</strong> 7 a 10 dias úteis</li>
        </ul>
        <p>Após a confirmação do pagamento, seu pedido é processado em até 1 dia útil.</p>
        <p>Você receberá o código de rastreamento por e-mail assim que o pedido for despachado.</p>
      </div>
    )
  },
  payment: {
    title: 'Formas de Pagamento',
    body: (
      <div className="space-y-4 text-slate-600">
        <p>Aceitamos as seguintes formas de pagamento:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>PIX:</strong> Aprovação imediata com 5% de desconto.</li>
          <li><strong>Cartão de Crédito:</strong> Até 12x sem juros nas principais bandeiras.</li>
          <li><strong>Boleto Bancário:</strong> Prazo de 3 dias úteis para compensação.</li>
          <li><strong>Cartão de Débito:</strong> Aprovação imediata.</li>
        </ul>
        <p>Todas as transações são processadas com criptografia SSL para sua segurança.</p>
      </div>
    )
  }
};

const InfoPages: React.FC<InfoPagesProps> = ({ page, onClose }) => {
  if (!page) return null;

  const { title, body } = CONTENT[page];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-8 py-6">
          {body}
        </div>
      </div>
    </div>
  );
};

export default InfoPages;
