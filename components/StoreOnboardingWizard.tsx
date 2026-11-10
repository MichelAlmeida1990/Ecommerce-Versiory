import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanId } from '../config/planConfig';
import { PLAN_PRICES } from '../config/planConfig';
import { createPendingOnboarding, logAudit } from '../services/firebase';

type WizardStep = 'dados' | 'plano' | 'confirmacao' | 'sucesso';

interface FormData {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  subdomain: string;
  customDomain?: string;
  planId: PlanId;
}

const StoreOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('dados');
  const [form, setForm] = useState<FormData>({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    subdomain: '',
    planId: 'start',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStep = () => {
    setError(null);
    if (step === 'dados') {
      if (!form.storeName || !form.email || !form.subdomain) {
        setError('Preencha nome da loja, e-mail e subdomínio.');
        return;
      }
      // Validação simples de subdomínio (apenas alfanumérico e hífens)
      if (!/^[a-z0-9-]+$/.test(form.subdomain)) {
        setError('Subdomínio deve conter apenas letras minúsculas, números e hífens.');
        return;
      }
    }
    const steps: WizardStep[] = ['dados', 'plano', 'confirmacao', 'sucesso'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const prevStep = () => {
    setError(null);
    const steps: WizardStep[] = ['dados', 'plano', 'confirmacao', 'sucesso'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const subdomainId = form.subdomain.toLowerCase().replace(/\s+/g, '-');

      const monthlyValue = PLAN_PRICES[form.planId];

      await createPendingOnboarding({
        storeName: form.storeName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone || undefined,
        subdomain: subdomainId,
        customDomain: form.customDomain || undefined,
        planId: form.planId,
        monthlyValue,
        dueDay: 10
      });

      await logAudit({
        userRole: 'customer',
        action: 'onboarding_requested',
        entity: 'pending_onboarding',
        entityId: subdomainId,
        details: `Solicitação de onboarding para "${form.storeName}" (${subdomainId})`,
        tenantId: subdomainId
      });

      setStep('sucesso');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const steps: WizardStep[] = ['dados', 'plano', 'confirmacao', 'sucesso'];
  const currentIdx = steps.indexOf(step);
  const progress = ((currentIdx) / (steps.length - 1)) * 100;

  const stepLabels: Record<WizardStep, string> = {
    dados: 'Dados da loja',
    plano: 'Escolha do plano',
    confirmacao: 'Confirmação',
    sucesso: 'Concluído',
  };

  if (step === 'sucesso') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Solicitação enviada com sucesso!</h2>
          <p className="text-slate-600 mb-8">
            Sua loja <strong>{form.storeName}</strong> está em análise. Nossa equipe vai revisar e aprovar em breve.
          </p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-slate-400 text-xs mt-1">Status</span>
              <span className="font-bold text-amber-600">Aguardando aprovação</span>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-slate-400 text-xs mt-1">Subdomínio solicitado</span>
              <span className="font-mono text-sm text-slate-600">{form.subdomain}.versiory.com</span>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-slate-400 text-xs mt-1">Plano</span>
              <span className="font-bold text-slate-900">{form.planId.toUpperCase()}</span>
            </div>
            {form.customDomain && (
              <div className="flex items-start gap-3">
                <span className="text-slate-400 text-xs mt-1">Domínio personalizado</span>
                <span className="font-mono text-sm text-slate-600">{form.customDomain}</span>
              </div>
            )}
            <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
              <span className="text-slate-400 text-xs mt-1">Próximo passo</span>
              <span className="text-sm text-slate-600">Aguardar e-mail de confirmação com acesso ao painel admin</span>
            </div>
          </div>
          <div className="space-y-3">
            <a
              href="/admin.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-bold py-3 rounded-2xl shadow-xl transition-all block"
            >
              Acessar painel administrativo
            </a>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-white text-slate-600 font-bold py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all block"
            >
              Voltar à vitrine
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/criar-loja', { replace: true })}
            className="flex items-center gap-2 text-sm font-bold text-versiory-coral hover:text-versiory-coral/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
          <div className="text-sm font-bold text-slate-900">
            Criar loja • {stepLabels[step]}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        {/* Progresso */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            {steps.map((s, i) => (
              <span key={s} className={`text-center ${currentIdx >= i ? 'text-versiory-coral font-black' : 'text-slate-400'}`}>
                {stepLabels[s]}
              </span>
            ))}
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-versiory-ink to-slate-900 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {step === 'dados' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome da loja</label>
                  <input
                    type="text"
                    placeholder="Ex: Loja do João"
                    value={form.storeName}
                    onChange={e => setForm({ ...form, storeName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seu nome</label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={form.ownerName}
                    onChange={e => setForm({ ...form, ownerName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subdomínio</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="minha-loja"
                      value={form.subdomain}
                      onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none transition-all"
                      required
                    />
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">.versiory.com</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Ex: minha-loja.versiory.com</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Domínio personalizado (opcional)</label>
                <input
                  type="text"
                  placeholder="minhaloja.com.br"
                  value={form.customDomain || ''}
                  onChange={e => setForm({ ...form, customDomain: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-versiory-coral focus:border-versiory-coral outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">Você poderá configurar o DNS depois no painel admin.</p>
              </div>
            </>
          )}

          {step === 'plano' && (
            <div className="space-y-4">
              {[
                { id: 'start', name: 'Start', price: 'R$ 49', period: '/mês', desc: 'Para quem está começando' },
                { id: 'go', name: 'Go', price: 'R$ 99', period: '/mês', desc: 'Para lojas em crescimento' },
                { id: 'max', name: 'Max', price: 'R$ 199', period: '/mês', desc: 'Para lojas de grande porte' },
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setForm({ ...form, planId: p.id as PlanId })}
                  className={`w-full border rounded-3xl p-6 text-left transition-all ${
                    form.planId === p.id
                      ? 'border-versiory-coral bg-orange-50/50 shadow-lg shadow-orange-100/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{p.desc}</p>
                    </div>
                    <span className="text-2xl font-black text-slate-900">{p.price} <span className="text-sm font-medium text-slate-500">{p.period}</span></span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">Plano ideal para {p.desc.toLowerCase()}.</p>
                  {form.planId === p.id && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Selecionado
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 'confirmacao' && (
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Confirme seus dados</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Nome da loja</span>
                  <span className="font-medium text-slate-900">{form.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Proprietário</span>
                  <span className="font-medium text-slate-900">{form.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">E-mail</span>
                  <span className="font-medium text-slate-900">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Subdomínio</span>
                  <span className="font-mono font-medium text-slate-900">{form.subdomain}.versiory.com</span>
                </div>
                {form.customDomain && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Domínio personalizado</span>
                    <span className="font-mono font-medium text-slate-900">{form.customDomain}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Plano</span>
                  <span className="font-medium text-slate-900">{form.planId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200">
                  <span className="text-slate-600">Status inicial</span>
                  <span className="font-medium text-slate-900">Trial (7 dias grátis)</span>
                </div>
              </div>
              <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                <p className="font-bold mb-2">⚠️ Importante</p>
                <p className="text-amber-700">
                  Após a criação, acesse o painel administrativo para configurar seu e-mail de admin e vincular à loja.
                  O usuário Firebase Admin deve ser criado no Console do Firebase.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {step !== 'dados' && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Voltar
              </button>
            )}
            {step === 'sucesso' ? null : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl font-black text-white bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : step === 'confirmacao' ? 'Criar loja' : 'Próximo'}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default StoreOnboardingWizard;
