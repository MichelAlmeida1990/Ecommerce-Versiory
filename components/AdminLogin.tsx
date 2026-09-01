
import React, { useState } from 'react';
import '../versiory-admin-login.css';
import { STORE_WHATSAPP_NUMBER } from '../services/firebase';
import { getBillingStatus, getBillingConfig, getBillingDueAmount } from '../services/billingConfig';

interface AdminLoginProps {
  onLogin: (password: string, role: 'admin' | 'seller') => void;
  error: string;
}


const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] = useState<'admin' | 'seller'>('seller');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password, role);
  };

  const billingConfig = getBillingConfig();
  const billingStatus = getBillingStatus(billingConfig);
  const dueAmount = getBillingDueAmount(billingConfig);

  const handleGenerateBoletoPix = () => {
    if (billingConfig?.pixKey) {
      window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=Olá! Gostaria de gerar o boleto/PIX para pagamento da fatura. Valor: R$ ${dueAmount.toFixed(2)}.`, '_blank');
    } else {
      window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=Olá! Gostaria de gerar o boleto/PIX para pagamento da fatura.`, '_blank');
    }
  };

  const handleSupportWhatsApp = () => {
    window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=Olá! Preciso de suporte para acessar o painel Versiory Store.`, '_blank');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-versiory-coral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-versiory-coral to-purple-600 rounded-[2.5rem] blur-xl opacity-50 animate-pulse"></div>
        
        <div className="relative bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Logo/Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-versiory-coral to-purple-600 rounded-3xl blur-lg opacity-60"></div>
              <div className="relative bg-white/20 backdrop-blur-xl rounded-3xl p-4 border border-white/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Bem-vindo</h2>
            <p className="text-white/80 font-medium text-sm">Versiory Store - Área Restrita</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Profile Selection */}
            <div>
              <label className="block text-sm font-bold text-white/90 mb-3">Selecione seu perfil</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`relative group px-4 py-4 rounded-2xl font-bold transition-all duration-300 ${
                    role === 'seller'
                      ? 'bg-gradient-to-br from-versiory-coral to-orange-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/90 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="text-sm">Vendedor</span>
                  </div>
                  {role === 'seller' && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-pulse"></div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`relative group px-4 py-4 rounded-2xl font-bold transition-all duration-300 ${
                    role === 'admin'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/90 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm">Admin</span>
                  </div>
                  {role === 'admin' && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-pulse"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-white/90 mb-3">Senha de acesso</label>
              <div className="relative group">
                <input
                  className="w-full px-5 py-4 bg-slate-800/50 backdrop-blur-xl border border-white/30 rounded-2xl text-white placeholder:text-white/60 focus:bg-slate-800/70 focus:border-white/50 focus:ring-4 focus:ring-white/20 outline-none transition-all duration-300 text-base font-medium pr-12"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors" 
                  onClick={() => setShowPassword(v => !v)} 
                  tabIndex={-1} 
                  aria-label="Mostrar senha"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-xl border border-red-300/30 text-white px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-versiory-coral to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-versiory-coral to-purple-600 hover:from-purple-600 hover:to-versiory-coral text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-xl group-hover:shadow-2xl group-hover:scale-[1.02] active:scale-[0.98]">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Entrar no Sistema
                </span>
              </div>
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-white/60 text-xs font-medium">🔒 Acesso seguro e criptografado</p>
            {/* REFCOM198: Botões para gerar boleto/PIX e suporte WhatsApp */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
              <button
                type="button"
                onClick={handleGenerateBoletoPix}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gerar Boleto/PIX
              </button>
              <button
                type="button"
                onClick={handleSupportWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                Suporte WhatsApp
              </button>
            </div>
            {billingStatus.phase !== 'normal' && (
              <p className="text-amber-200 text-[10px] font-bold mt-3">💡 Fatura pendente. Use o botão acima para gerar boleto/PIX ou regularizar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
