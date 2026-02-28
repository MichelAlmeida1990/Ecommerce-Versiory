import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Address } from '../types';
import { fetchAddressByCep } from '../services/cep';

interface LoginRegisterProps {
  onClose?: () => void;
  onLoginSuccess?: (email: string, address: string) => void;
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
  const [error, setError] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    const savedCustomers = localStorage.getItem('versiory_customers');
    let customers: Customer[] = savedCustomers ? JSON.parse(savedCustomers) : [];

    // Usuário de teste padrão
    const testUser = {
      email: 'teste@versiory.com',
      password: '123456',
      name: 'Usuário Teste',
      address: 'Rua Teste, 123 - São Paulo/SP'
    };

    if (isRegister) {
      if (!form.name || !address.zipCode || !address.street || !address.number) {
        setError('Preencha todos os campos obrigatórios.');
        return;
      }

      if (customers.find(c => c.email === form.email)) {
        setError('Este e-mail já está cadastrado.');
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
        password: form.password,
        phone: form.phone,
        cpfCnpj: form.cpfCnpj,
        avatar: '',
        addresses: [newAddress],
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        orderHistory: [],
      };

      customers.push(newCustomer);
      localStorage.setItem('versiory_customers', JSON.stringify(customers));

      // Inicia sessão
      const userSession = {
        email: form.email,
        name: form.name,
        address: `${address.street}, ${address.number}${address.complement ? ', ' + address.complement : ''} - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zipCode}`
      };
      localStorage.setItem('versiory_user', JSON.stringify(userSession));

      onLoginSuccess?.(userSession.email, userSession.address);
      onClose?.();
      
      // Redirecionar para home se não houver callback
      if (!onLoginSuccess) {
        navigate('/');
        window.location.reload();
      }
    } else {
      const customer = customers.find(c => c.email === form.email);

      // Fallback para usuário legado (versiory_user)
      const legacyAuth = localStorage.getItem('versiory_user');
      const legacyUser = legacyAuth ? JSON.parse(legacyAuth) : null;

      if (customer && customer.password === form.password) {
        const addr = customer.addresses[0];
        const formattedAddr = addr ? `${addr.street}, ${addr.number} - ${addr.city}/${addr.state}` : '';
        const userSession = { email: customer.email, name: customer.name, address: formattedAddr };

        localStorage.setItem('versiory_user', JSON.stringify(userSession));
        onLoginSuccess?.(userSession.email, userSession.address);
        onClose?.();
        
        // Redirecionar para home se não houver callback
        if (!onLoginSuccess) {
          navigate('/');
          window.location.reload();
        }
      } else if (legacyUser && legacyUser.email === form.email && legacyUser.password === form.password) {
        onLoginSuccess?.(legacyUser.email, legacyUser.address || '');
        onClose?.();
        
        if (!onLoginSuccess) {
          navigate('/');
          window.location.reload();
        }
      } else if (form.email === testUser.email && form.password === testUser.password) {
        // Login com usuário de teste
        const userSession = { email: testUser.email, name: testUser.name, address: testUser.address };
        localStorage.setItem('versiory_user', JSON.stringify(userSession));
        onLoginSuccess?.(testUser.email, testUser.address);
        onClose?.();
        
        if (!onLoginSuccess) {
          navigate('/');
          window.location.reload();
        }
      } else {
        setError('E-mail ou senha inválidos.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-white rounded-xl shadow p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <h2 className="text-2xl font-bold mb-4">{isRegister ? 'Cadastro' : 'Login'}</h2>
        {!isRegister && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-bold text-blue-900 mb-1">👤 Usuário de Teste:</p>
            <p className="text-blue-700">Email: <code className="bg-blue-100 px-2 py-0.5 rounded">teste@versiory.com</code></p>
            <p className="text-blue-700">Senha: <code className="bg-blue-100 px-2 py-0.5 rounded">123456</code></p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Nome completo"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded p-2"
              required
            />
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="border rounded p-2"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="border rounded p-2"
            required
          />
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Telefone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="CPF ou CNPJ"
                value={form.cpfCnpj}
                onChange={e => setForm({ ...form, cpfCnpj: e.target.value })}
                className="border rounded p-2"
              />

              <div className="border-t pt-4 mt-2">
                <h3 className="font-semibold mb-3 text-gray-700">Endereço de Entrega</h3>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="CEP"
                    value={address.zipCode}
                    onChange={e => setAddress({ ...address, zipCode: e.target.value })}
                    onBlur={handleCepBlur}
                    maxLength={9}
                    className="border rounded p-2 w-full"
                    required
                  />
                  {loadingCep && <span className="absolute right-3 top-3 text-sm text-gray-500">Buscando...</span>}
                </div>

                <input
                  type="text"
                  placeholder="Rua/Avenida"
                  value={address.street}
                  onChange={e => setAddress({ ...address, street: e.target.value })}
                  className="border rounded p-2 w-full mt-2"
                  required
                />

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Número"
                    value={address.number}
                    onChange={e => setAddress({ ...address, number: e.target.value })}
                    className="border rounded p-2 w-1/3"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Complemento"
                    value={address.complement}
                    onChange={e => setAddress({ ...address, complement: e.target.value })}
                    className="border rounded p-2 w-2/3"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Bairro"
                  value={address.neighborhood}
                  onChange={e => setAddress({ ...address, neighborhood: e.target.value })}
                  className="border rounded p-2 w-full mt-2"
                  required
                />

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={address.city}
                    onChange={e => setAddress({ ...address, city: e.target.value })}
                    className="border rounded p-2 w-2/3"
                    required
                  />
                  <input
                    type="text"
                    placeholder="UF"
                    value={address.state}
                    onChange={e => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="border rounded p-2 w-1/3"
                    required
                  />
                </div>
              </div>
            </>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
            {isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-indigo-600 hover:underline"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Já tem conta? Faça login' : 'Ainda não tem conta? Crie agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
