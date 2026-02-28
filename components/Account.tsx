import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Address, Order } from '../types';
import CustomerOrders from './CustomerOrders';

const Account: React.FC = () => {
  const navigate = useNavigate();

  // Data State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [editProfile, setEditProfile] = useState(false);
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrdersOverlayOpen, setIsOrdersOverlayOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    avatar: '',
  });

  const [addressForm, setAddressForm] = useState<Address>({
    id: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    type: 'shipping',
  });

  useEffect(() => {
    loadCustomerData();
  }, []);

  // Load orders from the canonical source (versiory_orders) whenever tab changes to 'orders'
  useEffect(() => {
    if (activeTab === 'orders' && customer) {
      loadOrders(customer.email);
    }
  }, [activeTab, customer]);

  const loadOrders = async (email: string) => {
    try {
      // Buscar do Firebase
      const { getOrders } = await import('../services/firebase');
      const allOrders = await getOrders();
      const myOrders = allOrders.filter(o => o.customerEmail === email);
      
      // Enriquecer com dados dos produtos
      const { getProducts } = await import('../services/firebase');
      const products = await getProducts();
      
      myOrders.forEach(order => {
        order.items.forEach(item => {
          const p = products.find(gp => gp.id === item.productId);
          if (p) {
            if (!item.image) item.image = p.image;
            if (!item.name) item.name = p.name;
            if (!item.description) item.description = p.description;
          }
        });
      });
      
      setCustomerOrders(myOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setCustomerOrders([]);
    }
  };

  const loadCustomerData = () => {
    setLoading(true);
    const userSession = localStorage.getItem('versiory_user');
    if (!userSession) {
      setLoading(false);
      return;
    }

    const { email } = JSON.parse(userSession);
    const allCustomers = localStorage.getItem('versiory_customers');
    const customersList: Customer[] = allCustomers ? JSON.parse(allCustomers) : [];

    const currentCustomer = customersList.find(c => c.email === email);
    if (currentCustomer) {
      setCustomer(currentCustomer);
      setProfileForm({
        name: currentCustomer.name,
        email: currentCustomer.email,
        phone: currentCustomer.phone,
        cpfCnpj: currentCustomer.cpfCnpj || '',
        avatar: currentCustomer.avatar || '',
      });
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for localStorage
        alert('A imagem é muito grande. Escolha uma foto com menos de 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileForm(prev => ({ ...prev, avatar: base64String }));
        if (customer) {
          const allCustomers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
          const updated = { ...customer, avatar: base64String };
          const newList = allCustomers.map((c: any) => c.email === customer.email ? updated : c);
          localStorage.setItem('versiory_customers', JSON.stringify(newList));
          setCustomer(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Você precisa estar logado para acessar o perfil.</p>
      </div>
    );
  }

  const handleProfileSave = () => {
    if (!customer) return;
    const allCustomers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
    const updated = { ...customer, ...profileForm };
    const newList = allCustomers.map((c: any) => c.email === customer.email ? updated : c);

    localStorage.setItem('versiory_customers', JSON.stringify(newList));
    // Update session info too
    localStorage.setItem('versiory_user', JSON.stringify({ email: updated.email, name: updated.name }));
    setCustomer(updated);
    setEditProfile(false);
  };

  const handleAddressSave = () => {
    if (!customer) return;
    const allCustomers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
    const updated = {
      ...customer,
      addresses: customer.addresses.map(a => a.id === editAddressId ? addressForm : a)
    };
    const newList = allCustomers.map((c: any) => c.email === customer.email ? updated : c);
    localStorage.setItem('versiory_customers', JSON.stringify(newList));
    setCustomer(updated);
    setEditAddressId(null);
  };

  const handleAddressDelete = (id: string) => {
    if (!customer) return;
    const allCustomers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
    const updated = { ...customer, addresses: customer.addresses.filter(a => a.id !== id) };
    const newList = allCustomers.map((c: any) => c.email === customer.email ? updated : c);
    localStorage.setItem('versiory_customers', JSON.stringify(newList));
    setCustomer(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-versiory-coral border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="bg-white/40 backdrop-blur-xl border border-white/20 p-12 rounded-[40px] shadow-2xl">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m4-11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h2 className="text-3xl font-black mb-4 text-slate-900">Acesso Restrito</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-md mx-auto">Você precisa estar logado para acessar sua área exclusiva.</p>
          <button onClick={() => navigate('/')} className="bg-versiory-ink text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl">
            Ir para a Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-versiory-coral/10 text-versiory-coral text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Dashboard
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-2">Minha <span className="text-transparent bg-clip-text bg-gradient-to-r from-versiory-ink to-slate-500">Conta</span></h1>
            <p className="text-slate-500 text-lg font-medium">Bem-vindo de volta, {customer.name.split(' ')[0]}!</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 bg-white border border-slate-200 px-6 py-4 rounded-3xl font-bold text-slate-700 hover:shadow-xl hover:border-versiory-coral/30 transition-all active:scale-95 animate-in fade-in slide-in-from-right duration-700"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Voltar para Loja
          </button>
        </div>

        {/* ── Tab Navigation Bar (always visible) ── */}
        <div className="flex gap-2 mb-8 bg-white/60 backdrop-blur-sm border border-slate-100 p-2 rounded-[28px] shadow-sm animate-in fade-in duration-700">
          {[
            { id: 'profile' as const, label: 'Meu Perfil', icon: '👤' },
            { id: 'addresses' as const, label: 'Endereços', icon: '📍' },
            { id: 'orders' as const, label: 'Meus Pedidos', icon: '📦' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] font-black text-sm transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-versiory-ink text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-100'
                }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-1000">

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative overflow-hidden group bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:bg-blue-100 transition-colors"></div>
                <div className="relative flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl">📦</div>
                  <div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Total de Pedidos</p>
                    <p className="text-4xl font-black text-slate-900">{customer.orderHistory.length}</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden group bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:bg-emerald-100 transition-colors"></div>
                <div className="relative flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl">💰</div>
                  <div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Investimento Total</p>
                    <p className="text-4xl font-black text-slate-900">R$ {Number(customer.totalSpent ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content Card */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 md:p-12">
                {activeTab === 'profile' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-900">Informações Pessoais</h3>
                      {!editProfile && (
                        <button
                          onClick={() => setEditProfile(true)}
                          className="bg-slate-50 hover:bg-slate-900 hover:text-white px-6 py-2 rounded-2xl font-bold transition-all text-sm"
                        >
                          Editar Perfil
                        </button>
                      )}
                    </div>

                    {!editProfile ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase mb-1">Nome Completo</p>
                            <p className="text-lg font-bold text-slate-900">{customer.name}</p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase mb-1">E-mail de Contato</p>
                            <p className="text-lg font-bold text-slate-900">{customer.email}</p>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase mb-1">Telefone / WhatsApp</p>
                            <p className="text-lg font-bold text-slate-900">{customer.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase mb-1">CPF / CNPJ</p>
                            <p className="text-lg font-bold text-slate-900">{customer.cpfCnpj || 'Não informado'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-black text-slate-500 ml-2">NOME</label>
                            <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 ring-versiory-coral/20 outline-none transition-all font-bold" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-black text-slate-500 ml-2">E-MAIL</label>
                            <input value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 ring-versiory-coral/20 outline-none transition-all font-bold" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-black text-slate-500 ml-2">TELEFONE</label>
                            <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 ring-versiory-coral/20 outline-none transition-all font-bold" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-black text-slate-500 ml-2">CPF/CNPJ</label>
                            <input value={profileForm.cpfCnpj} onChange={e => setProfileForm({ ...profileForm, cpfCnpj: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 ring-versiory-coral/20 outline-none transition-all font-bold" />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={handleProfileSave} className="bg-versiory-ink text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-lg">Salvar Alterações</button>
                          <button onClick={() => setEditProfile(false)} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-900">Meus Endereços</h3>
                      <button
                        onClick={() => setEditAddressId('new')}
                        className="bg-versiory-coral text-white px-6 py-2 rounded-2xl font-bold transition-all text-sm shadow-lg shadow-versiory-coral/20"
                      >
                        Novo Endereço
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customer.addresses.map((address: Address) => (
                        <div key={address.id} className="group p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-white hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${address.type === 'shipping' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                              {address.type === 'shipping' ? 'Entrega' : 'Cobrança'}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setAddressForm(address); setEditAddressId(address.id); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleAddressDelete(address.id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 5.385l8-8H5l8 8z" /></svg>
                              </button>
                            </div>
                          </div>
                          <p className="font-bold text-slate-900 text-lg mb-1 leading-tight">{address.street}, {address.number}</p>
                          <p className="text-slate-500 font-medium text-sm">{address.neighborhood}, {address.city} - {address.state}</p>
                          <p className="text-slate-400 font-black text-[10px] uppercase mt-4">CEP {address.zipCode}</p>
                        </div>
                      ))}
                    </div>

                    {(editAddressId === 'new' || editAddressId === addressForm.id) && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-300">
                          <h4 className="text-2xl font-black mb-6">{editAddressId === 'new' ? 'Novo Endereço' : 'Editar Endereço'}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <input placeholder="CEP" value={addressForm.zipCode} onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
                            <input placeholder="Rua" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
                            <input placeholder="Número" value={addressForm.number} onChange={e => setAddressForm({ ...addressForm, number: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
                            <input placeholder="Complemento" value={addressForm.complement} onChange={e => setAddressForm({ ...addressForm, complement: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
                            <input placeholder="Bairro" value={addressForm.neighborhood} onChange={e => setAddressForm({ ...addressForm, neighborhood: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
                            <input placeholder="Cidade" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
                          </div>
                          <div className="flex gap-4 mt-8">
                            <button
                              onClick={() => {
                                if (editAddressId === 'new') {
                                  const newAddr = { ...addressForm, id: crypto.randomUUID() };
                                  const updated = { ...customer, addresses: [...customer.addresses, newAddr] };
                                  const allCustomers = JSON.parse(localStorage.getItem('versiory_customers') || '[]');
                                  localStorage.setItem('versiory_customers', JSON.stringify(allCustomers.map((c: any) => c.email === customer.email ? updated : c)));
                                  setCustomer(updated);
                                } else {
                                  handleAddressSave();
                                }
                                setEditAddressId(null);
                                setAddressForm({ id: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', country: 'Brasil', type: 'shipping' });
                              }}
                              className="flex-1 bg-versiory-ink text-white py-4 rounded-2xl font-black"
                            >
                              Salvar Endereço
                            </button>
                            <button onClick={() => setEditAddressId(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black">Cancelar</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-900">Histórico de Pedidos</h3>
                        <button
                          onClick={() => setIsOrdersOverlayOpen(true)}
                          className="bg-slate-900 text-white px-6 py-2 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg"
                        >
                          Ver Detalhes Premium
                        </button>
                      </div>

                      {customerOrders.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                          <div className="text-4xl mb-4">🛒</div>
                          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum pedido encontrado</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {customerOrders.map((order: Order) => {
                            const statusMap: Record<string, { label: string, color: string, bg: string }> = {
                              pending: { label: 'Aguardando Pagamento', color: 'text-amber-600', bg: 'bg-amber-50' },
                              paid: { label: 'Pagamento Confirmado', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                              processing: { label: 'Processando', color: 'text-blue-600', bg: 'bg-blue-50' },
                              shipped: { label: 'Em Trânsito', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                              delivered: { label: 'Entregue', color: 'text-slate-600', bg: 'bg-slate-50' }
                            };
                            const statusInfo = statusMap[order.status] || { label: order.status, color: 'text-slate-400', bg: 'bg-slate-50' };

                            return (
                              <div key={order.id} className="group bg-slate-50 p-6 rounded-[32px] border border-transparent hover:border-white hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300">
                                <div className="flex flex-col gap-6">
                                  <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusInfo.bg} ${statusInfo.color}`}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      {new Date(order.date).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>

                                  {/* Items Preview Section - Americanas Style */}
                                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                    {order.items.map((item, idx) => {
                                      // Fallback for missing info in old orders
                                      const products = JSON.parse(localStorage.getItem('versiory_products') || '[]');
                                      const pInfo = products.find((p: any) => p.id === item.productId);
                                      const img = item.image || pInfo?.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=200&h=200&fit=crop';
                                      const name = item.name || pInfo?.name || 'Produto Versiory';

                                      return (
                                        <div key={idx} className="flex-shrink-0 flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-slate-100">
                                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-white">
                                            <img src={img} alt={name} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="max-w-[120px]">
                                            <p className="text-[10px] font-black text-slate-900 truncate">{name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Qtd: {item.quantity}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                                    <div>
                                      <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1">Total do Pedido</p>
                                      <p className="text-2xl font-black text-slate-900">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <button
                                      onClick={() => setIsOrdersOverlayOpen(true)}
                                      className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                    >
                                      Ver Detalhes
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right duration-1000">
            {/* User Card */}
            <div className="relative overflow-hidden bg-versiory-ink p-8 rounded-[40px] text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-versiory-coral/40 to-transparent rounded-full -mr-10 -mt-10 blur-2xl"></div>

              <div className="relative flex flex-col items-center py-6">
                <div className="relative group mb-6">
                  <div className="absolute inset-0 bg-versiory-coral rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <img src={customer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.email}`} alt={customer.name} className="relative w-32 h-32 rounded-full border-4 border-white/10 p-1 object-cover shadow-2xl transform group-hover:scale-105 transition-transform" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-versiory-coral rounded-full border-4 border-versiory-ink flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all cursor-pointer shadow-lg"
                    title="Mudar Foto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <h2 className="text-2xl font-black text-center mb-1">{customer.name}</h2>
                <p className="text-white/60 font-medium text-sm mb-6">{customer.email}</p>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-2 text-xs font-black uppercase tracking-widest">
                  Membro desde {new Date(customer.createdAt).getFullYear()}
                </div>
              </div>

              <div className="border-t border-white/10 pt-8 mt-4 space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${activeTab === 'profile' ? 'bg-versiory-coral text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                >
                  <span className="font-black text-sm uppercase tracking-wider">Perfil</span>
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'profile' ? 'bg-white animate-pulse' : 'bg-transparent'}`}></div>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${activeTab === 'addresses' ? 'bg-versiory-coral text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                >
                  <span className="font-black text-sm uppercase tracking-wider">Endereços</span>
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'addresses' ? 'bg-white animate-pulse' : 'bg-transparent'}`}></div>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${activeTab === 'orders' ? 'bg-versiory-coral text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                >
                  <span className="font-black text-sm uppercase tracking-wider">Histórico</span>
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'orders' ? 'bg-white animate-pulse' : 'bg-transparent'}`}></div>
                </button>
              </div>
            </div>

            {/* Logout Help */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 mb-2">Suporte Versiory</h4>
              <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">Precisa de ajuda com algum pedido ou alteração na sua conta?</p>
              <button className="w-full border-2 border-slate-100 hover:border-slate-900 py-4 rounded-2xl font-black text-slate-900 transition-all">Falar com Consultor</button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Orders Overlay Integration */}
      <CustomerOrders
        isOpen={isOrdersOverlayOpen}
        onClose={() => setIsOrdersOverlayOpen(false)}
        customerEmail={customer.email}
      />
    </div>
  );
};

export default Account;
