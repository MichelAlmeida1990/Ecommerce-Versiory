import React, { useMemo, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const whatsappNumber = '5511958540171';
  const supportHours = 'Seg-Sex 9h-18h';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Oi! Eu sou o atendimento Versiory :) Como posso ajudar hoje?'
        + ' Posso falar sobre prazos, trocas ou ajudar a escolher produtos.',
      time: 'agora'
    }
  ]);

  const quickReplies = useMemo(
    () => [
      'Quero ajuda para escolher um produto',
      'Qual o prazo de entrega?',
      'Politica de troca e devolucao',
      'Como funciona o pagamento?'
    ],
    []
  );

  const pushMessage = (role: 'user' | 'bot', text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        text,
        time: 'agora'
      }
    ]);
  };

  const botReply = (text: string) => {
    const lower = text.toLowerCase();

    if (lower.includes('prazo') || lower.includes('entrega')) {
      pushMessage('bot', 'Entregamos em 3-7 dias uteis nas capitais e 5-10 dias uteis em outras regioes.');
      return;
    }

    if (lower.includes('troca') || lower.includes('devolucao')) {
      pushMessage('bot', 'Voce pode solicitar troca ou devolucao em ate 7 dias apos o recebimento.');
      return;
    }

    if (lower.includes('pagamento')) {
      pushMessage('bot', 'No momento, o checkout completo esta em breve. Podemos finalizar pelo WhatsApp.');
      return;
    }

    if (lower.includes('ajuda') || lower.includes('escolher') || lower.includes('recomendar')) {
      pushMessage('bot', 'Me diga sua categoria preferida e faixa de preco que eu recomendo algo.');
      return;
    }

    pushMessage('bot', 'Perfeito! Me conte um pouco mais para eu te ajudar melhor.');
  };

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushMessage('user', trimmed);
    setInput('');
    setTimeout(() => botReply(trimmed), 400);
  };

  const handleWhatsAppSupport = () => {
    const message = 'Oi! Quero falar com um atendente sobre meu pedido.';
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed right-4 bottom-4 z-[70] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[92vw] max-w-sm bg-versiory-ivory shadow-2xl rounded-3xl border border-[#f1e2d5] overflow-hidden">
          <div className="bg-versiory-ink text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Atendimento</p>
              <h4 className="text-lg font-black">Versiory Chat</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fechar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    message.role === 'user'
                      ? 'bg-versiory-coral text-white'
                      : 'bg-white text-slate-700 border border-[#f1e2d5]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {quickReplies.map(reply => (
              <button
                key={reply}
                onClick={() => handleSend(reply)}
                className="text-xs font-semibold border border-[#ecdccc] text-slate-700 px-3 py-1 rounded-full bg-white/70 hover:bg-white"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="border-t border-[#f1e2d5] px-4 py-3 bg-[#fff8f1]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSend(input);
                  }
                }}
                placeholder="Digite sua mensagem"
                className="flex-1 bg-white border border-[#e6d7c7] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-[#ffe1d2]"
              />
              <button
                onClick={() => handleSend(input)}
                className="bg-versiory-ink text-white px-4 py-2 rounded-2xl text-sm font-bold hover:bg-[#1b2a3a]"
              >
                Enviar
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Atendimento humano: {supportHours}</span>
              <button
                onClick={handleWhatsAppSupport}
                className="text-versiory-coral font-semibold hover:text-[#ff8368]"
              >
                Falar com humano
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="bg-versiory-coral text-white px-5 py-4 rounded-full shadow-2xl shadow-black/10 font-bold flex items-center gap-2 hover:bg-[#ff8368]"
      >
        <span className="text-sm">Atendimento</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );
};

export default ChatWidget;
