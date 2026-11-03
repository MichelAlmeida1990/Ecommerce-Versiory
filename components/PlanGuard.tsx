import React, { useState } from 'react';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { PlanId, PLAN_LABELS, PLAN_PRICES, PLAN_MODULES } from '../config/planConfig';
import { saveSubscription } from '../services/subscriptionService';
import { STORE_WHATSAPP_NUMBER } from '../utils/constants';

interface PlanGuardProps {
  module: string;
  moduleLabel?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const MODULE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard e Métricas',
  pdv: 'PDV Loja (Frente de Caixa)',
  nfce: 'Emissão de NFC-e',
  nfe: 'Emissão de NF-e (Modelo 55)',
  produtos: 'Cadastro de Produtos',
  pedidos: 'Gestão de Pedidos',
  etiquetas: 'Gerador de Etiquetas',
  usuarios_permissoes: 'Gestão de Usuários e Permissões',
  clientes: 'Cadastro de Clientes',
  estoque: 'Controle de Estoque e Inventário',
  financeiro: 'Módulo Financeiro (DRE/Caixa)',
  curva_abc: 'Análise de Curva ABC',
  ecommerce: 'Configuração da Loja Virtual',
  marketplace: 'Integração Mercado Livre e Shopee',
  categorias: 'Gestão de Categorias',
  cupons: 'Gestão de Cupons de Desconto',
  rastreamento: 'Rastreamento de Entregas',
  assistente_virtual: 'Assistente Virtual Inteligente'
};

const PlanGuard: React.FC<PlanGuardProps> = ({ module, moduleLabel, children, fallback }) => {
  const planAccess = usePlanAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('max');
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!planAccess.hasModule(module)) {
    if (fallback) return <>{fallback}</>;

    const displayName = moduleLabel || MODULE_NAMES[module] || module;

    const handleRequestUpgrade = async (plan: PlanId) => {
      setLoading(true);
      try {
        const subId = `sub_${Date.now()}`;
        const userEmail = localStorage.getItem('versiory_last_user') || 'admin';
        await saveSubscription({
          id: subId,
          userId: userEmail,
          planId: plan,
          status: 'pending',
          amount: PLAN_PRICES[plan],
          requestedAt: new Date().toISOString()
        });
        setRequested(true);
      } catch (e) {
        console.error('Erro ao solicitar upgrade:', e);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto my-8">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-4xl mb-5 border border-amber-200/60 shadow-inner">
            🔒
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-versiory-coral mb-1">
            Recurso Exclusivo
          </span>
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            Módulo {displayName}
          </h3>
          <p className="text-slate-600 max-w-md text-sm leading-relaxed mb-6">
            O módulo <strong>{displayName}</strong> faz parte de planos superiores do ecossistema Versiory. Faça o upgrade agora para desbloquear esta funcionalidade.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-black/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Conhecer Planos e Fazer Upgrade</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Modal de Upgrade */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => { setShowUpgradeModal(false); setRequested(false); }}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-versiory-coral">Planos Versiory</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">Evolua seu negócio</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                  Desbloqueie ferramentas avançadas para automatizar suas vendas e crescer sem limites.
                </p>
              </div>

              {requested ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    ✓
                  </div>
                  <h4 className="text-2xl font-black text-emerald-900 mb-2">Solicitação enviada com sucesso!</h4>
                  <p className="text-emerald-700 text-sm max-w-md mx-auto mb-6">
                    Nossa equipe já recebeu seu pedido para o plano <strong>{PLAN_LABELS[selectedPlan]}</strong>. A ativação ocorre em até 1 hora útil.
                  </p>
                  <div className="flex justify-center gap-3">
                    <a
                      href={`https://wa.me/${STORE_WHATSAPP_NUMBER || '5511958540171'}?text=${encodeURIComponent(
                        `Olá! Acabei de solicitar o upgrade para o plano ${PLAN_LABELS[selectedPlan]} no painel da minha loja. Poderia confirmar a ativação?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors"
                    >
                      Confirmar no WhatsApp
                    </a>
                    <button
                      onClick={() => { setShowUpgradeModal(false); setRequested(false); }}
                      className="border border-emerald-300 text-emerald-800 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {(['start', 'go', 'max'] as PlanId[]).map((plan) => {
                    const isSelected = selectedPlan === plan;
                    const isMax = plan === 'max';
                    return (
                      <div
                        key={plan}
                        onClick={() => setSelectedPlan(plan)}
                        className={`rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col relative ${
                          isSelected
                            ? 'border-versiory-coral bg-versiory-coral/5 shadow-xl scale-[1.02]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {isMax && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-versiory-coral text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                            Mais Completo
                          </span>
                        )}
                        <h4 className="text-xl font-black text-slate-900">{PLAN_LABELS[plan]}</h4>
                        <div className="mt-3 mb-4">
                          <span className="text-3xl font-black text-slate-900">
                            R$ {PLAN_PRICES[plan].toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-slate-500 text-xs font-medium">/mês</span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 mb-6 flex-1">
                          {PLAN_MODULES[plan].map((mod) => (
                            <div key={mod} className="flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className={mod === module ? 'font-black text-slate-900 underline' : ''}>
                                {MODULE_NAMES[mod] || mod}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestUpgrade(plan);
                          }}
                          disabled={loading}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                            isSelected
                              ? 'bg-versiory-coral hover:bg-[#ff8368] text-white shadow-md'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          {loading && isSelected ? 'Enviando...' : `Escolher ${PLAN_LABELS[plan]}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default PlanGuard;
