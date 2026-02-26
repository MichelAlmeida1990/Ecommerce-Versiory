
import React, { useState } from 'react';
import '../versiory-admin-login.css';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error: string;
}


const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1515168833906-d2a3b82b3029?auto=format&fit=crop&w=1200&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-sm bg-[#232846]/80 rounded-3xl shadow-2xl border border-[#776EF6]/20 p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full bg-[#776EF6]/10 p-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#776EF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6-6V9a6 6 0 10-12 0v2a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2v-5a2 2 0 00-2-2zm-8-2a4 4 0 118 0v2H8V9z" /></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-[#0f172a] versiory-pulse mb-1 tracking-tight" style={{ textShadow: '0 0 16px #776EF6, 0 0 32px #ff6b4a44' }}>Admin Login</h2>
          <span className="text-sm text-[#776EF6]/80 font-medium">Área restrita Versiory Store</span>
        </div>
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-[#776EF6] mb-2">Senha</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 border border-[#776EF6]/30 rounded-xl bg-white text-[#0f172a] placeholder:text-[#776EF6]/40 focus:ring-2 focus:ring-[#776EF6] focus:border-transparent outline-none transition-all pr-12 text-base shadow-sm"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#776EF6]" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label="Mostrar senha">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.828-2.828A10.05 10.05 0 0122 9c0 5.523-4.477 10-10 10a9.96 9.96 0 01-4.675-.938" /></svg>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50/90 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4">
              {error}
            </div>
          )}
          <button type="submit" className="w-full bg-[#776EF6] hover:bg-[#5a4fd6] text-white font-bold py-3 rounded-xl transition-all shadow-lg text-lg tracking-wide">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
