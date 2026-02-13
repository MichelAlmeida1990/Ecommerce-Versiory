import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-[#0b1f4b] flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-versiory-coral rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M36 20 H64 L50 43 L36 20 Z" fill="white" />
              <path d="M12 35 L30 18 L32 40 L12 35 Z" fill="white" opacity="0.8" />
              <path d="M88 35 L70 18 L68 40 L88 35 Z" fill="white" opacity="0.8" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Painel Admin</h1>
          <p className="text-gray-600">Versiory Store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200/80 rounded-xl bg-white/70 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-versiory-coral focus:border-transparent outline-none transition-all"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white font-black py-4 rounded-xl transition-all shadow-lg hover:-translate-y-1 active:scale-95"
          >
            Acessar Painel
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Área restrita • Versiory Store © 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
