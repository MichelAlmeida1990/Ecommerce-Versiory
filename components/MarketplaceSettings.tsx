import React, { useState, useEffect } from 'react';
import { MarketplaceConfig } from '../types';
import { getMlAuthUrl, exchangeMlCodeForToken } from '../services/mercadolivre';

const MarketplaceSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<MarketplaceConfig>(() => {
    const saved = localStorage.getItem('versiory_marketplace_config');
    return saved ? JSON.parse(saved) : {
      mercadolivre: { appId: '', clientSecret: '', redirectUri: window.location.origin + '/admin', status: 'disconnected' },
      shopee: { partnerId: '', partnerKey: '', shopId: '', status: 'disconnected' }
    };
  });

  // Efeito para detectar o retorno do Mercado Livre (callback OAuth2)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && config.mercadolivre?.appId && config.mercadolivre?.clientSecret) {
      handleCallback(code);
    }
  }, []);

  const handleCallback = async (code: string) => {
    setLoading(true);
    try {
      const tokens = await exchangeMlCodeForToken(code, config.mercadolivre!);
      const updatedConfig: MarketplaceConfig = {
        ...config,
        mercadolivre: {
          ...config.mercadolivre!,
          ...tokens,
          status: 'connected'
        }
      };
      setConfig(updatedConfig);
      localStorage.setItem('versiory_marketplace_config', JSON.stringify(updatedConfig));
      
      // Limpa a URL para remover o código temporário
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('✅ Conta do Mercado Livre vinculada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('❌ Erro ao vincular conta. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleMlConnect = () => {
    if (!config.mercadolivre?.appId || !config.mercadolivre?.redirectUri) {
      alert('Preencha o App ID e a Redirect URI antes de conectar.');
      return;
    }
    // Redireciona o usuário para o Mercado Livre
    window.location.href = getMlAuthUrl(config.mercadolivre.appId, config.mercadolivre.redirectUri);
  };

  const handleSaveLocal = () => {
    localStorage.setItem('versiory_marketplace_config', JSON.stringify(config));
    alert('✅ Configurações salvas localmente!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-versiory-coral rounded-2xl flex items-center justify-center text-2xl shadow-lg">🌐</div>
          <div>
            <h3 className="text-2xl font-black text-white">Configuração de Marketplaces</h3>
            <p className="text-slate-400 text-sm mt-1">Gerencie as credenciais e conexões com canais externos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mercado Livre Card */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadolibre/favicon.svg" alt="ML" className="w-8 h-8" />
                <h4 className="text-xl font-bold text-white">Mercado Livre</h4>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                config.mercadolivre?.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
              }`}>
                {config.mercadolivre?.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">App ID (Client ID)</label>
                <input
                  type="text"
                  value={config.mercadolivre?.appId}
                  onChange={e => setConfig({ ...config, mercadolivre: { ...config.mercadolivre!, appId: e.target.value }})}
                  className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-versiory-coral outline-none"
                  placeholder="Ex: 1234567890123456"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Client Secret</label>
                <input
                  type="password"
                  value={config.mercadolivre?.clientSecret}
                  onChange={e => setConfig({ ...config, mercadolivre: { ...config.mercadolivre!, clientSecret: e.target.value }})}
                  className="w-full bg-white/5 border border-white/20 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-versiory-coral outline-none"
                  placeholder="••••••••••••••••"
                />
              </div>
            </div>
            
            <button 
              onClick={handleMlConnect}
              disabled={loading}
              className={`w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-xl transition-all shadow-lg active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processando...' : 'Vincular Conta Mercado Livre'}
            </button>
          </div>

          {/* Shopee (Em breve) */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-6 opacity-60">
             {/* Conteúdo similar ao ML mas desabilitado */}
             <h4 className="text-xl font-bold text-white">Shopee (Em breve)</h4>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex justify-end gap-4">
          <button
            onClick={handleSaveLocal}
            className="bg-versiory-coral hover:bg-[#ff8368] text-white px-8 py-3 rounded-2xl font-black shadow-xl transition-all active:scale-95"
          >
            Salvar Credenciais
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSettings;