import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StoreOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'start' as const,
      name: 'Start',
      price: 'R$ 49,00',
      period: '/mês',
      description: 'Ideal para quem está começando',
      features: ['Até 100 produtos', '1 domínio personalizado', 'Suporte por e-mail', 'Cupom de boas-vindas'],
      popular: false,
    },
    {
      id: 'go' as const,
      name: 'Go',
      price: 'R$ 99,00',
      period: '/mês',
      description: 'Para lojas em crescimento',
      features: ['Até 500 produtos', '2 domínios personalizados', 'Suporte por WhatsApp', 'Cupons ilimitados', 'Relatórios de vendas'],
      popular: true,
    },
    {
      id: 'max' as const,
      name: 'Max',
      price: 'R$ 199,00',
      period: '/mês',
      description: 'Para lojas de grande porte',
      features: ['Produtos ilimitados', 'Domínios ilimitados', 'Suporte prioritário', 'API e integrações', 'Relatórios avançados'],
      popular: false,
    },
  ];

  const handleStart = () => {
    setIsLoading(true);
    // Simula pequeno atraso para UX, depois vai para o wizard
    setTimeout(() => {
      setIsLoading(false);
      navigate('/criar-loja/cadastro', { replace: true });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/', { replace: true })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-versiory-ink to-slate-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 011 1m-6 0h6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter">VersioryStore</span>
              <span className="text-[10px] font-bold text-versiory-coral uppercase tracking-widest">Crie sua loja</span>
            </div>
          </div>
          <a
            href="/lojas"
            className="text-sm font-bold text-versiory-coral hover:text-versiory-coral/80 transition-colors"
          >
            Ver lojas existentes →
          </a>
        </div>
      </header>

      <section className="py-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-versiory-coral to-[#ff8368] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200/50">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">Transforme sua ideia em uma loja online</h1>
          <p className="text-xl text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
            Crie sua loja virtual em minutos. Sem mensalidade escondida, sem burocracia. Você escolhe o plano, configura seus produtos e começa a vender.
          </p>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-black text-lg px-10 py-5 rounded-3xl shadow-xl shadow-black/10 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Criando sua loja...</span>
              </>
            ) : (
              <>
                <span>Começar agora grátis</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>

          <p className="mt-6 text-sm text-slate-500">
            Trial de 7 dias grátis • Sem cartão de crédito • Cancela a qualquer momento
          </p>
        </div>
      </section>

      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Escolha o plano ideal para você</h2>
            <p className="text-slate-600">Todos os planos incluem trial gratuito de 7 dias</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-8 border border-slate-100 ${
                  plan.popular ? 'border-versiory-coral shadow-xl shadow-orange-100/50 relative' : ''
                } transition-all hover:border-slate-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-versiory-coral text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-slate-600">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-2xl font-bold transition-all ${
                    plan.popular
                      ? 'bg-versiory-coral text-white hover:bg-orange-600 shadow-lg shadow-orange-200/50'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {plan.popular ? 'Começar com Go' : 'Escolher ' + plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-8">Por que escolher o Versiory?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Multi-tenant</h3>
              <p className="text-sm text-slate-600">Cada loja tem seus dados isolados. Sem vazamento entre lojas.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Domínio próprio</h3>
              <p className="text-sm text-slate-600">Use seu próprio domínio ou um subdomínio gratuito *.versiory.com</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4m8 0V4m0 0a2 2 0 00-2-2h-4a2 2 0 00-2 2v0m0 0a2 2 0 012 2h4a2 2 0 012 2v0" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">100% Firebase</h3>
              <p className="text-sm text-slate-600">Sem servidores próprios. Escalável e gratuito no plano Spark.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-versiory-ink border-t border-slate-900/50 py-8 text-center">
        <p className="text-slate-400 text-xs">
          © {new Date().getFullYear()} Versiory Store. Plataforma multi-tenant de e-commerce.
        </p>
      </footer>
    </div>
  );
};

export default StoreOnboardingPage;
