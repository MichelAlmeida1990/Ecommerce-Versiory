import React, { useMemo, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = '5511958540171';
  const supportHours = 'Seg-Sex 9h-18h';

  const handleWhatsAppSupport = () => {
    const message = 'Olá! Gostaria de suporte com meus produtos Versiory.';
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed right-6 bottom-6 z-[100] flex flex-col items-end gap-4 animate-in fade-in duration-700">
      {isOpen && (
        <div className="w-[320px] sm:w-[360px] bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#075e54] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl relative">
                👩‍💼
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#075e54] rounded-full animate-pulse"></span>
              </div>
              <div>
                <h4 className="font-black text-lg">Suporte Versiory</h4>
                <p className="text-white/70 text-xs">Normalmente responde em minutos</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="ml-auto p-2 hover:bg-white/10 rounded-full transition-all"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-[#e5ddd5] space-y-4 max-h-[300px] overflow-y-auto">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-slate-800 text-sm relative">
              <p className="font-medium">Olá! 👋</p>
              <p className="mt-1">Como podemos ajudar você hoje? Nossa equipe está pronta para tirar suas dúvidas sobre prazos, trocas ou produtos.</p>
              <span className="text-[10px] text-slate-400 absolute right-3 bottom-1">09:00</span>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-slate-100 italic text-slate-400 text-xs text-center">
            Atendimento disponível: {supportHours}
          </div>

          <div className="p-4 bg-white">
            <button
              onClick={handleWhatsAppSupport}
              className="w-full bg-[#25d366] hover:bg-[#128c7e] text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-green-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Abrir WhatsApp
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 focus:outline-none"
        >
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
            <span className="text-slate-800 font-bold text-sm">Precisa de ajuda?</span>
          </div>
          <div className="bg-versiory-coral text-white w-16 h-16 rounded-full shadow-2xl shadow-versiory-coral/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h8m-8 4h5m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#25d366] border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">!</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
