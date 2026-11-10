import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant } from '../services/tenantService';
import { getTenants } from '../services/tenantService';
import { setSelectedTenant } from '../services/tenantContext';

const StoreSelector: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        const data = await getTenants();
        const active = data.filter(t => t.status === 'active' || t.status === 'trial');
        setTenants(active);
      } catch (e) {
        setError('Não foi possível carregar a lista de lojas.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadTenants();
  }, []);

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant.id);
    // Redireciona para a loja selecionada (subdomínio ou domínio principal com tenant selecionado)
    navigate(`/loja/${tenant.id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-versiory-coral border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Erro ao carregar lojas</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-bold px-6 py-3 rounded-2xl shadow-xl transition-all"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Nenhuma loja disponível</h2>
          <p className="text-slate-600 mb-6">
            Ainda não há lojas ativas na plataforma. Volte em breve ou crie a sua própria loja.
          </p>
          <a
            href="/criar-loja"
            className="bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-bold px-6 py-3 rounded-2xl shadow-xl transition-all block"
          >
            Criar minha loja
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/', { replace: true })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-versiory-ink to-slate-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 011 1m-6 0h6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter">VersioryStore</span>
              <span className="text-[10px] font-bold text-versiory-coral uppercase tracking-widest">Escolha sua loja</span>
            </div>
          </div>
          <a
            href="/"
            className="text-sm font-bold text-versiory-coral hover:text-versiory-coral/80 transition-colors"
          >
            ← Voltar à vitrine principal
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Escolha sua loja</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Acesse a loja onde deseja comprar. Cada loja tem seu próprio catálogo, preços e atendimento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant)}
              className="group bg-white rounded-3xl border border-slate-100 p-6 cursor-pointer hover:border-versiory-coral hover:shadow-xl hover:shadow-black/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-xl font-bold text-slate-700">
                      {tenant.storeName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-versiory-coral transition-colors">
                      {tenant.storeName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {tenant.ownerName}
                    </p>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  tenant.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {tenant.status === 'active' ? 'Ativa' : 'Trial'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-5 3c1.459 0 2.686.765 3.389 1.635l-.024.03a2 2 0 01-.011.306v6.019c0 .354.158.678.398.882l.004.003c.238.202.554.268.885.22l.012-.002c.331-.048.646-.271.825-.642a2 2 0 00-.02-.307L18.12 9.7c-.286-.469-.666-.74-1.113-.74h-3.33c-.447 0-.827.271-1.112.74z" />
                  </svg>
                  <span>{tenant.email}</span>
                </div>
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 011 1.188l-2 6.993a1 1 0 01-1.497 1.127l-1.627-.678a1 1 0 00-1.121 0L4.708 9.89a1 1 0 00-1.12 1.12l-.678 1.627a1 1 0 01-1.127 1.497l-2 6.993A1 1 0 013 19.28v3.28a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                    </svg>
                    <span>{tenant.phone}</span>
                  </div>
                )}
                {tenant.customDomain && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 002 2 2 2 0 012 2h2.945m-5.435-.033L14.194 9m6.7-6.006L18.186 6m-1.885 6.091a2.5 2.5 0 01-1.065 3.548 2.5 2.5 0 00-1.065-3.548z" />
                    </svg>
                    <a href={`https://${tenant.customDomain}`} target="_blank" rel="noopener noreferrer" className="text-versiory-coral hover:underline font-medium">
                      {tenant.customDomain}
                    </a>
                  </div>
                )}
                {tenant.subdomain && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 002 2 2 2 0 012 2h2.945m-5.435-.033L14.194 9m6.7-6.006L18.186 6m-1.885 6.091a2.5 2.5 0 01-1.065 3.548 2.5 2.5 0 00-1.065-3.548z" />
                    </svg>
                    <span className="text-mono text-slate-500">{tenant.subdomain}.versiory.com</span>
                  </div>
                )}
              </div>

              <button
                className="w-full bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-bold py-3 rounded-2xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2"
              >
                <span>Acessar loja</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm mb-4">
            Não encontrou a loja que procura? Crie a sua própria loja em poucos minutos.
          </p>
          <a
            href="/criar-loja"
            className="bg-gradient-to-r from-versiory-ink to-slate-900 hover:from-versiory-coral hover:to-[#ff8368] text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-black/10 transition-all inline-block"
          >
            Criar minha loja →
          </a>
        </div>
      </main>

      <footer className="bg-versiory-ink border-t border-slate-900/50 py-8 text-center">
        <p className="text-slate-400 text-xs">
          © {new Date().getFullYear()} Versiory Store. Plataforma multi-tenant de e-commerce.
        </p>
      </footer>
    </div>
  );
};

export default StoreSelector;
