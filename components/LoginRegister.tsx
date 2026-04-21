import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Address } from '../types';
import { fetchAddressByCep } from '../services/cep';
import { hashPassword, verifyPassword } from '../utils/crypto';

interface LoginRegisterProps {
  onClose?: () => void;
  onLoginSuccess?: (email: string, address: string, phone?: string, cpfCnpj?: string) => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cpfCnpj: '',
  });
  const [address, setAddress] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [step, setStep] = useState<'form' | 'verification-register' | 'verification-reset' | 'forgot-password' | 'new-password'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const MAX_ATTEMPTS = 3;
  const LOCK_TIME = 60000;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCepBlur = async () => {
    const cleanCep = address.zipCode.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      setError('');
      const data = await fetchAddressByCep(address.zipCode);
      setLoadingCep(false);

      if (data) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          complement: data.complemento || prev.complement,
        }));
      } else {
        setError('CEP não encontrado.');
      }
    }
  };

  const sendVerificationCode = (forReset = false) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    console.log(`[VERSIORY] Código de verificação para ${form.email}: ${code}`);
    // Simulação de envio de e-mail (ERRCOM093)
    alert(`🔐 UM CÓDIGO DE VERIFICAÇÃO FOI ENVIADO PARA: ${form.email}\n\n(Para fins de teste, o código é: ${code})`);
    setStep(forReset ? 'verification-reset' : 'verification-register');
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode !== generatedCode) {
      setError('❌ Código incorreto. Verifique o e-mail e tente novamente.');
      return;
    }
    setError('');
    if (step === 'verification-reset') {
      setStep('new-password');
      return;
    }
    await finalizeSubmit();
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setIsVerifying(true);
    try {
      const { getCustomers, saveCustomer } = await import('../services/firebase');
      let customers: Customer[] = await getCustomers();
      const customer = customers.find(c => c.email === form.email);
      if (!customer) {
        setError('❌ Usuário não encontrado.');
        setIsVerifying(false);
        return;
      }
      customer.password = await hashPassword(form.password);
      await saveCustomer(customer);
      alert('✅ Senha alterada com sucesso! Faça login.');
      setStep('form');
      setForm({ ...form, password: '' });
      setIsRegister(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar nova senha.');
    }
    setIsVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLocked) {
      setError('🔒 Conta bloqueada. Aguarde 1 minuto antes de tentar novamente.');
      return;
    }
    
    if (!form.email || !form.password) {
      setError('⚠️ Preencha todos os campos obrigatórios.');
      return;
    }

    if (!validateEmail(form.email)) {
      setError('❌ Email inválido. Use o formato: exemplo@email.com');
      return;
    }

    if (isRegister) {
      if (!form.name || !address.zipCode || !address.street || !address.number) {
        setError('⚠️ Preencha todos os campos obrigatórios do cadastro.');
        return;
      }
      // Antes de salvar, validar e-mail
      sendVerificationCode(false);
    } else {
      await finalizeSubmit();
    }
  };

  const finalizeSubmit = async () => {
    setIsVerifying(true);
    try {
      const { getCustomers, saveCustomer, saveUserSession } = await import('../services/firebase');
      let customers: Customer[] = await getCustomers();

      if (isRegister) {
        if (customers.find(c => c.email === form.email)) {
          setError('❌ Este email já está cadastrado. Faça login ou use outro email.');
          setStep('form');
          setIsVerifying(false);
          return;
        }

        const newAddress: Address = {
          id: Date.now().toString(),
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode.replace(/\D/g, ''),
          country: 'Brasil',
          type: 'shipping',
        };

        const newCustomer: Customer = {
          id: Date.now(),
          name: form.name,
          email: form.email,
          password: await hashPassword(form.password),
          phone: form.phone,
          cpfCnpj: form.cpfCnpj,
          avatar: '',
          addresses: [newAddress],
          totalOrders: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          orderHistory: [],
        };

        await saveCustomer(newCustomer);

        const userSession = {
          email: form.email,
          name: form.name,
          phone: form.phone,
          cpfCnpj: form.cpfCnpj,
          address: `${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''} - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zipCode}`,
          loginTime: Date.now()
        };
        await saveUserSession(userSession);

        onLoginSuccess?.(userSession.email, userSession.address, userSession.phone, userSession.cpfCnpj);
        onClose?.();
        
        if (!onLoginSuccess) {
          navigate('/');
        }
      } else {
        const customer = customers.find(c => c.email === form.email);

        if (customer && customer.password) {
          let isPasswordValid = await verifyPassword(form.password, customer.password);
          
          if (!isPasswordValid && customer.password === form.password) {
            isPasswordValid = true;
            customer.password = await hashPassword(form.password);
            await saveCustomer(customer);
          }
          
          if (isPasswordValid) {
            const addr = customer.addresses[0];
            const formattedAddr = addr ? `${addr.street}, ${addr.number} - ${addr.city}/${addr.state}` : '';
            const userSession = { 
              email: customer.email, 
              name: customer.name, 
              phone: customer.phone, 
              cpfCnpj: customer.cpfCnpj, 
              address: formattedAddr,
              loginTime: Date.now()
            };

            await saveUserSession(userSession);
            onLoginSuccess?.(userSession.email, userSession.address, userSession.phone, userSession.cpfCnpj);
            onClose?.();
            setLoginAttempts(0);
            
            if (!onLoginSuccess) {
              navigate('/');
            }
          } else {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            
            if (newAttempts >= MAX_ATTEMPTS) {
              setIsLocked(true);
              setError(`🔒 Conta bloqueada temporariamente por segurança. Aguarde 1 minuto e tente novamente.`);
              setTimeout(() => {
                setIsLocked(false);
                setLoginAttempts(0);
              }, LOCK_TIME);
            } else {
              setError(`❌ Email ou senha incorretos. Tentativa ${newAttempts} de ${MAX_ATTEMPTS}. ${MAX_ATTEMPTS - newAttempts} restante(s).`);
            }
          }
        } else {
          setError('❌ Usuário não encontrado.');
        }
      }
    } catch (error) {
      console.error('Erro ao processar login/cadastro:', error);
      setError('❌ Erro ao processar sua solicitação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-8 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-[#0b1f4b] via-[#0a1b3d] to-[#08122b] rounded-3xl shadow-2xl border border-white/20 p-8 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-versiory-coral rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-coral-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">
              {step.startsWith('verification') ? 'Verifique seu E-mail' : 
               step === 'new-password' ? 'Nova Senha' :
               step === 'forgot-password' ? 'Recuperar Senha' :
               isRegister ? 'Criar Conta' : 'Bem-vindo'}
            </h2>
            <p className="text-white/60">
              {step.startsWith('verification') ? `Digite o código enviado para ${form.email}` :
               step === 'new-password' ? 'Crie uma nova senha segura' :
               step === 'forgot-password' ? 'Enviaremos um código para seu e-mail' :
               isRegister ? 'Preencha seus dados para começar' : 'Faça login para continuar'}
            </p>
          </div>

          {step.startsWith('verification') ? (
            <form onSubmit={handleVerifyAndSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-white/80 mb-3 text-center">Código de 6 Dígitos</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white text-center text-3xl tracking-[1em] font-black focus:outline-none focus:ring-2 focus:ring-versiory-coral transition-all"
                  required
                  autoFocus
                />
              </div>

              {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm animate-shake">{error}</div>}

              <button 
                type="submit" 
                disabled={isVerifying}
                className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
              >
                {isVerifying ? 'Verificando...' : 'Verificar e Confirmar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-white/40 hover:text-white/60 text-sm font-medium transition-colors"
              >
                Voltar para o formulário
              </button>
            </form>
          ) : step === 'forgot-password' ? (
            <form onSubmit={(e) => { e.preventDefault(); sendVerificationCode(true); }} className="space-y-4">
               <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Seu E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral transition-all"
                  required
                />
              </div>
              {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <button type="submit" className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-xl font-black text-lg transition-all">
                Enviar Código
              </button>
              <button type="button" onClick={() => setStep('form')} className="w-full text-white/40 hover:text-white/60 text-sm font-medium">
                Voltar ao Login
              </button>
            </form>
          ) : step === 'new-password' ? (
            <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
               <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Nova Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral transition-all"
                  required
                />
              </div>
              {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <button type="submit" disabled={isVerifying} className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-xl font-black text-lg transition-all">
                {isVerifying ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          ) : (
            <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-white/80 mb-2">Nome completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral transition-all"
                  required
                />
              </div>
              {!isRegister && (
                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={() => setStep('forgot-password')}
                    className="text-xs text-white/40 hover:text-versiory-coral transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Telefone</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={form.cpfCnpj}
                    onChange={e => setForm({ ...form, cpfCnpj: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                  />
                </div>

                <div className="border-t border-white/10 pt-4 mt-2">
                  <h3 className="font-bold text-white mb-3">Endereço de Entrega</h3>
                  <div className="relative mb-3">
                    <label className="block text-sm font-bold text-white/80 mb-2">CEP</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={address.zipCode}
                      onChange={e => setAddress({ ...address, zipCode: e.target.value })}
                      onBlur={handleCepBlur}
                      maxLength={9}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                      required
                    />
                    {loadingCep && <span className="absolute right-3 top-11 text-sm text-white/60">Buscando...</span>}
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-bold text-white/80 mb-2">Rua/Avenida</label>
                    <input
                      type="text"
                      placeholder="Nome da rua"
                      value={address.street}
                      onChange={e => setAddress({ ...address, street: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="flex gap-3 mb-3">
                    <div className="w-1/3">
                      <label className="block text-sm font-bold text-white/80 mb-2">Número</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={address.number}
                        onChange={e => setAddress({ ...address, number: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="block text-sm font-bold text-white/80 mb-2">Complemento</label>
                      <input
                        type="text"
                        placeholder="Apto, bloco..."
                        value={address.complement}
                        onChange={e => setAddress({ ...address, complement: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-bold text-white/80 mb-2">Bairro</label>
                    <input
                      type="text"
                      placeholder="Nome do bairro"
                      value={address.neighborhood}
                      onChange={e => setAddress({ ...address, neighborhood: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="w-2/3">
                      <label className="block text-sm font-bold text-white/80 mb-2">Cidade</label>
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={address.city}
                        onChange={e => setAddress({ ...address, city: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-sm font-bold text-white/80 mb-2">UF</label>
                      <input
                        type="text"
                        placeholder="SP"
                        value={address.state}
                        onChange={e => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                        maxLength={2}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-versiory-coral focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>}
            <button type="submit" className="w-full bg-versiory-coral hover:bg-[#ff8368] text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl active:scale-[0.98]">
              {isRegister ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-white/60 hover:text-white transition-colors font-medium"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister ? 'Já tem conta? Faça login' : 'Ainda não tem conta? Crie agora'}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
