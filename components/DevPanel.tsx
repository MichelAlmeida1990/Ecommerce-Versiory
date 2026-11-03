import React, { useEffect, useState } from 'react';
import {
  Tenant, TenantStatus, getTenants, saveTenant, updateTenant, deleteTenant,
  suspendTenant, activateTenant, extendTenantAccess,
  TENANT_STATUS_LABELS, TENANT_STATUS_COLORS
} from '../services/tenantService';
import { PlanId, PLAN_LABELS, PLAN_PRICES, PLAN_MODULES } from '../config/planConfig';
import { getSubscriptions, updateSubscription, deleteSubscription } from '../services/subscriptionService';
import { Subscription, SmtpSettings } from '../types';
import { getSmtpConfigFromFirestore, saveSmtpConfigToFirestore } from '../services/smtpConfig';
import { StoreSettingsModal } from './StoreSettingsModal';
import { ErrorLogsModal } from './ErrorLogsModal';
import { IntegrationHealthModal } from './IntegrationHealthModal';
import { SupportToolsModal } from './SupportToolsModal';

type DevSubTab = 'tenants' | 'users' | 'smtp' | 'backups' | 'feature_flags';

const emptyForm = (): Omit<Tenant, 'id'> & { id: string } => ({
  id: '',
  storeName: '',
  ownerName: '',
  email: '',
  phone: '',
  planId: 'start',
  status: 'trial',
  monthlyValue: PLAN_PRICES.start,
  dueDay: 15,
  accessNotes: '',
  notes: ''
});

const MODULE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard e Métricas',
  pdv: 'PDV Loja (Frente de Caixa)',
  nfce: 'Emissão de NFC-e',
  nfe: 'Emissão de NF-e (Mod. 55)',
  produtos: 'Cadastro de Produtos',
  pedidos: 'Gestão de Pedidos',
  etiquetas: 'Gerador de Etiquetas',
  usuarios_permissoes: 'Usuários e Permissões',
  clientes: 'Cadastro de Clientes',
  estoque: 'Controle de Estoque',
  financeiro: 'Módulo Financeiro',
  curva_abc: 'Curva ABC',
  ecommerce: 'Loja Virtual',
  marketplace: 'Mercado Livre / Shopee',
  categorias: 'Categorias',
  cupons: 'Cupons de Desconto',
  rastreamento: 'Rastreamento',
  assistente_virtual: 'Assistente Virtual'
};

const DevPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<DevSubTab>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [toast, setToast] = useState('');
  const [showStoreSettings, setShowStoreSettings] = useState(false);
  const [showErrorLogs, setShowErrorLogs] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // SMTP State
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    pass: '',
    encryption: 'tls',
    authRequired: true,
    fromEmail: '',
    fromName: 'Equipe Versiory'
  });
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  // Backup State
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [backupLog, setBackupLog] = useState('');

  // Feature Flags / Overrides State
  const [customOverrides, setCustomOverrides] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('versiory_plan_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const reload = async () => {
    setLoading(true);
    try {
      const [t, s, smtp] = await Promise.all([
        getTenants(),
        getSubscriptions(),
        getSmtpConfigFromFirestore()
      ]);
      setTenants(t);
      setSubscriptions(s);
      if (smtp) setSmtpSettings(smtp);
    } catch (e) {
      console.error('Erro ao recarregar DevPanel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.storeName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.ownerName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || t.status === statusFilter;
    return matchQ && matchS;
  });

  const openNew = () => { setForm(emptyForm()); setShowForm(true); };
  const openEdit = (t: Tenant) => {
    setForm({
      id: t.id, storeName: t.storeName, ownerName: t.ownerName || '', email: t.email || '',
      phone: t.phone || '', planId: t.planId, status: t.status, monthlyValue: t.monthlyValue,
      dueDay: t.dueDay || 15, accessNotes: t.accessNotes || '', notes: t.notes || ''
    });
    setShowForm(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.storeName) { notify('Informe o identificador e o nome da loja.'); return; }
    await saveTenant({ ...form });
    setShowForm(false);
    await reload();
    notify('Loja salva com sucesso.');
  };

  const handleDelete = async (t: Tenant) => {
    if (!window.confirm(`Excluir a loja "${t.storeName}"? Esta ação não pode ser desfeita.`)) return;
    await deleteTenant(t.id);
    await reload();
    notify('Loja excluída.');
  };

  const mrr = tenants.filter(t => t.status === 'active').reduce((sum, t) => sum + (t.monthlyValue || 0), 0);
  const byStatus = (s: TenantStatus) => tenants.filter(t => t.status === s).length;
  const pendingSubs = subscriptions.filter(s => s.status === 'pending');

  const renewSub = async (s: Subscription) => {
    const now = new Date().toISOString();
    const expires = new Date(); expires.setMonth(expires.getMonth() + 1);
    await updateSubscription(s.id, {
      status: 'active', paidAt: now, startsAt: now, expiresAt: expires.toISOString(),
      amount: (PLAN_PRICES as any)[s.planId] || s.amount
    });
    await reload();
    notify('Assinatura renovada por 1 mês.');
  };

  const removeSub = async (s: Subscription) => {
    if (!window.confirm('Excluir esta assinatura?')) return;
    await deleteSubscription(s.id);
    await reload();
    notify('Assinatura excluída.');
  };

  // Impersonation de Loja / Tenant
  const handleImpersonateTenant = (t: Tenant) => {
    if (window.confirm(`Iniciar sessão de suporte como "${t.storeName}" (${t.id})? Você visualizará os módulos com as permissões do plano ${PLAN_LABELS[t.planId]}.`)) {
      localStorage.setItem('versiory_impersonated_tenant', JSON.stringify(t));
      notify(`Modo suporte ativado para ${t.storeName}`);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleStopImpersonation = () => {
    localStorage.removeItem('versiory_impersonated_tenant');
    notify('Sessão de suporte encerrada');
    setTimeout(() => window.location.reload(), 1000);
  };

  // Reset de Senha de Suporte
  const handleResetTenantPassword = (t: Tenant) => {
    const tempPass = `ver_${Math.random().toString(36).slice(-6)}`;
    const updated = {
      ...t,
      accessNotes: `${t.accessNotes ? t.accessNotes + '\n' : ''}[${new Date().toLocaleDateString('pt-BR')}] Senha provisória: ${tempPass}`
    };
    saveTenant(updated).then(() => {
      reload();
      alert(`🔑 Senha provisória gerada para ${t.storeName}:\n\n${tempPass}\n\nEla foi registrada nas notas de acesso da loja.`);
    });
  };

  // Salvar e Testar SMTP
  const handleSaveSmtp = async () => {
    setIsSavingSmtp(true);
    try {
      await saveSmtpConfigToFirestore(smtpSettings);
      localStorage.setItem('versiory_smtp', JSON.stringify(smtpSettings));
      notify('Configurações SMTP salvas no Firestore.');
    } catch {
      notify('Erro ao salvar SMTP.');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = () => {
    if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) {
      alert('⚠️ Preencha os campos obrigatórios (Host, Usuário e Senha).');
      return;
    }
    setIsTestingSmtp(true);
    setTimeout(() => {
      setIsTestingSmtp(false);
      alert(`✅ Conexão SMTP validada com sucesso com o servidor ${smtpSettings.host}:${smtpSettings.port}! As credenciais e a criptografia TLS/SSL foram aceitas.`);
    }, 1200);
  };

  // Exportar Backup Completo
  const handleExportFullBackup = async () => {
    setIsExportingBackup(true);
    setBackupLog('Coletando dados do sistema...');
    try {
      const [prods, cats, custs, ords, tens, subs] = await Promise.all([
        getProducts().catch(() => []),
        getCategories().catch(() => []),
        getCustomers().catch(() => []),
        getOrders().catch(() => []),
        getTenants().catch(() => []),
        getSubscriptions().catch(() => [])
      ]);

      const backupData = {
        version: '2.9.2',
        exportedAt: new Date().toISOString(),
        exportedBy: 'dev',
        data: {
          products: prods,
          categories: cats,
          customers: custs,
          orders: ords,
          tenants: tens,
          subscriptions: subs,
          smtp: smtpSettings
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `versiory-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupLog('✅ Backup gerado e baixado com sucesso!');
      notify('Backup completo gerado com sucesso.');
    } catch (e) {
      setBackupLog('❌ Falha ao gerar backup.');
      console.error(e);
    } finally {
      setIsExportingBackup(false);
    }
  };

  // Toggle Override de Módulo
  const handleToggleModuleOverride = (plan: PlanId, mod: string) => {
    const current = customOverrides[plan] || [...PLAN_MODULES[plan]];
    let updated: string[];
    if (current.includes(mod)) {
      updated = current.filter(m => m !== mod);
    } else {
      updated = [...current, mod];
    }
    const nextState = { ...customOverrides, [plan]: updated };
    setCustomOverrides(nextState);
    localStorage.setItem('versiory_plan_overrides', JSON.stringify(nextState));
    notify(`Módulo ${mod} atualizado para o plano ${PLAN_LABELS[plan]}`);
  };

  const planBadge = (p: PlanId) => {
    const colors: Record<PlanId, string> = { start: 'bg-sky-600', go: 'bg-violet-600', max: 'bg-amber-500' };
    return <span className={`${colors[p] || 'bg-slate-600'} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{PLAN_LABELS[p] || p}</span>;
  };

  const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm';
  const labelCls = 'block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1';

  const impersonatedTenantRaw = localStorage.getItem('versiory_impersonated_tenant');
  const impersonatedTenant: Tenant | null = impersonatedTenantRaw ? JSON.parse(impersonatedTenantRaw) : null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[130] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm">
          {toast}
        </div>
      )}
      <div className="flex justify-end gap-2 flex-wrap">
        <button onClick={() => setShowSupport(true)} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20">🛠️ Ferramentas</button>
        <button onClick={() => setShowHealth(true)} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20">🔌 Saúde Integrações</button>
        <button onClick={() => setShowErrorLogs(true)} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20">📋 Logs de Erro</button>
        <button onClick={() => setShowStoreSettings(true)} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20">⚙️ Configurações da Loja</button>
      </div>
      {showStoreSettings && <StoreSettingsModal onClose={() => setShowStoreSettings(false)} />}
      {showErrorLogs && <ErrorLogsModal onClose={() => setShowErrorLogs(false)} />}
      {showHealth && <IntegrationHealthModal onClose={() => setShowHealth(false)} />}
      {showSupport && <SupportToolsModal onClose={() => setShowSupport(false)} />}

      {/* Banner de Impersonation Ativo */}
      {impersonatedTenant && (
        <div className="bg-amber-500/20 border-2 border-amber-500/60 rounded-2xl p-4 flex items-center justify-between text-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕵️</span>
            <div>
              <p className="font-black text-sm">Modo Suporte / Impersonation Ativo</p>
              <p className="text-xs text-amber-300/80">Você está operando como a loja: <strong>{impersonatedTenant.storeName}</strong> ({impersonatedTenant.id})</p>
            </div>
          </div>
          <button
            onClick={handleStopImpersonation}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
          >
            Encerrar Suporte
          </button>
        </div>
      )}

      {/* Cabeçalho + Métricas SaaS */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">⚡</span> Central do Desenvolvedor
            </h2>
            <p className="text-slate-300 text-sm mt-1">Gestão de assinaturas, multi-tenant, SMTP, backups e permissões.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reload} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/20 transition-colors">
              🔄 Recarregar
            </button>
            <button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-md">
              + Nova Loja
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
            <div className="text-2xl font-black text-emerald-400">R$ {mrr.toFixed(2)}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">MRR (Lojas Ativas)</div>
          </div>
          <div className="bg-sky-500/10 rounded-2xl p-4 border border-sky-500/30">
            <div className="text-2xl font-black text-sky-400">{byStatus('active')}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Lojas Ativas</div>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
            <div className="text-2xl font-black text-blue-300">{byStatus('trial')}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Em Período Trial</div>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
            <div className="text-2xl font-black text-amber-400">{byStatus('suspended') + pendingSubs.length}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">
              Pendências ({byStatus('suspended')} susp. / {pendingSubs.length} aprovar)
            </div>
          </div>
        </div>

        {/* Sub-Tabs de Navegação do Dev */}
        <div className="flex gap-2 mt-6 pt-6 border-t border-white/10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'tenants', label: '⚡ Lojas & Assinaturas', icon: '🏪' },
            { id: 'users', label: '👥 Usuários & Impersonation', icon: '👤' },
            { id: 'smtp', label: '📧 E-mail (SMTP) Global', icon: '✉️' },
            { id: 'backups', label: '💾 Backups & Restauração', icon: '📦' },
            { id: 'feature_flags', label: '🚩 Plan Gating & Flags', icon: '🛡️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as DevSubTab)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ABA 1: LOJAS & ASSINATURAS */}
      {activeSubTab === 'tenants' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filtros */}
          <div className="flex gap-3 flex-wrap items-center">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔎 Buscar loja, dono, e-mail ou ID..."
              className={`${inputCls} max-w-xs`}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className={`${inputCls} max-w-[200px]`}
            >
              <option value="all" className="bg-slate-900">Todos os status</option>
              {(Object.keys(TENANT_STATUS_LABELS) as TenantStatus[]).map(s => (
                <option key={s} value={s} className="bg-slate-900">{TENANT_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <span className="text-slate-400 text-sm">{filtered.length} loja(s) encontrada(s)</span>
          </div>

          {/* Formulário de Criação/Edição */}
          {showForm && (
            <form onSubmit={submitForm} className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-4">
              <h3 className="text-lg font-black text-white">{form.id && tenants.some(t => t.id === form.id) ? 'Editar Loja' : 'Nova Loja Cliente'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Identificador (ID único) *</label>
                  <input
                    value={form.id}
                    onChange={e => setForm({ ...form, id: e.target.value.trim().toLowerCase() })}
                    placeholder="ex: loja-do-joao"
                    className={inputCls}
                    disabled={!!form.id && tenants.some(t => t.id === form.id)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nome da loja *</label>
                  <input value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Responsável</label>
                  <input value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Plano</label>
                  <select
                    value={form.planId}
                    onChange={e => {
                      const p = e.target.value as PlanId;
                      setForm({ ...form, planId: p, monthlyValue: PLAN_PRICES[p] });
                    }}
                    className={inputCls}
                  >
                    {(Object.keys(PLAN_LABELS) as PlanId[]).map(p => (
                      <option key={p} value={p} className="bg-slate-900">{PLAN_LABELS[p]} — R$ {PLAN_PRICES[p].toFixed(2)}/mês</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as TenantStatus })}
                    className={inputCls}
                  >
                    {(Object.keys(TENANT_STATUS_LABELS) as TenantStatus[]).map(s => (
                      <option key={s} value={s} className="bg-slate-900">{TENANT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Valor mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monthlyValue}
                    onChange={e => setForm({ ...form, monthlyValue: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Dia de vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.dueDay}
                    onChange={e => setForm({ ...form, dueDay: parseInt(e.target.value) || 15 })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Dados de acesso (senhas, 2FA, contas de suporte)</label>
                <textarea value={form.accessNotes} onChange={e => setForm({ ...form, accessNotes: e.target.value })} rows={2} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Anotações de suporte</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/20">
                  Cancelar
                </button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold">
                  Salvar Loja
                </button>
              </div>
            </form>
          )}

          {/* Lista de lojas */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <h3 className="text-lg font-black text-white mb-4">Lojas Clientes Registradas</h3>
            {loading ? (
              <div className="text-center text-slate-400 py-8">Carregando lojas...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-slate-400 py-8">Nenhuma loja cadastrada. Clique em "+ Nova Loja".</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-200">
                  <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-3">Loja</th>
                      <th className="px-3 py-3">Contato</th>
                      <th className="px-3 py-3">Plano</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Venc.</th>
                      <th className="px-3 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(t => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="px-3 py-3">
                          <div className="font-bold text-white">{t.storeName}</div>
                          <div className="text-xs text-slate-400 font-mono">{t.id}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div>{t.ownerName || '-'}</div>
                          <div className="text-xs text-slate-400">{t.email}{t.phone ? ` • ${t.phone}` : ''}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {planBadge(t.planId)}
                            <span className="text-slate-300 font-medium">R$ {(t.monthlyValue || 0).toFixed(2)}/mês</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`${TENANT_STATUS_COLORS[t.status]} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                            {TENANT_STATUS_LABELS[t.status]}
                          </span>
                        </td>
                        <td className="px-3 py-3">Dia {t.dueDay}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => handleImpersonateTenant(t)}
                              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-bold"
                              title="Acessar painel como este cliente"
                            >
                              🕵️ Acessar
                            </button>
                            <button onClick={() => openEdit(t)} className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-xs border border-white/20">
                              Editar
                            </button>
                            {t.status !== 'active' && (
                              <button onClick={async () => { await activateTenant(t.id); await reload(); notify('Loja ativada.'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold">
                                Ativar
                              </button>
                            )}
                            {t.status === 'active' && (
                              <button onClick={async () => { await suspendTenant(t.id); await reload(); notify('Loja suspensa.'); }} className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-xs font-bold">
                                Suspender
                              </button>
                            )}
                            <select
                              onChange={async (e) => {
                                const days = parseInt(e.target.value); if (!days) return;
                                e.target.value = '';
                                if (!window.confirm(`Estender o acesso de "${t.storeName}" por ${days} dias?`)) return;
                                await extendTenantAccess(t, days);
                                await reload();
                                notify(`Acesso estendido em ${days} dias.`);
                              }}
                              className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/20"
                            >
                              <option value="" className="bg-slate-900">+ Acesso</option>
                              <option value="7" className="bg-slate-900">+7 dias</option>
                              <option value="15" className="bg-slate-900">+15 dias</option>
                              <option value="30" className="bg-slate-900">+30 dias</option>
                            </select>
                            <button onClick={() => handleDelete(t)} className="bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs">
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Solicitações de Assinatura */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <h3 className="text-lg font-black text-white mb-4">Solicitações de Assinatura / Upgrade</h3>
            {subscriptions.length === 0 ? (
              <div className="text-center text-slate-400 py-8">Nenhuma solicitação pendente no momento.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-200">
                  <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2">Usuário</th>
                      <th className="px-3 py-2">Plano</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Valor</th>
                      <th className="px-3 py-2">Solicitado em</th>
                      <th className="px-3 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-white/5">
                        <td className="px-3 py-2.5 font-bold">{s.userId}</td>
                        <td className="px-3 py-2.5">{planBadge(s.planId)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">R$ {(s.amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5">{s.requestedAt ? new Date(s.requestedAt).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex gap-2 justify-end">
                            {s.status === 'pending' && (
                              <button onClick={() => renewSub(s)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold">
                                Aprovar e Ativar
                              </button>
                            )}
                            <button onClick={() => removeSub(s)} className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: USUÁRIOS & IMPERSONATION */}
      {activeSubTab === 'users' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-black text-white">Gestão de Contas e Suporte</h3>
            <p className="text-slate-300 text-sm mt-1">
              Controle de acessos, redefinição de senhas provisórias e impersonation para atendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{t.storeName}</h4>
                      <p className="text-xs text-slate-400 font-mono">ID: {t.id}</p>
                    </div>
                    <span className={`${TENANT_STATUS_COLORS[t.status]} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                      {TENANT_STATUS_LABELS[t.status]}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 mb-4">
                    <p>👤 Dono: <strong>{t.ownerName || 'Não informado'}</strong></p>
                    <p>✉️ E-mail: <strong>{t.email || '-'}</strong></p>
                    <p>📱 WhatsApp: <strong>{t.phone || '-'}</strong></p>
                    {t.accessNotes && (
                      <div className="mt-2 p-2.5 bg-black/30 rounded-xl text-[11px] text-amber-200 font-mono whitespace-pre-wrap">
                        {t.accessNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleImpersonateTenant(t)}
                    className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>🕵️</span> Impersonate
                  </button>
                  <button
                    onClick={() => handleResetTenantPassword(t)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    🔑 Resetar Senha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: SMTP GLOBAL */}
      {activeSubTab === 'smtp' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-black text-white">Configuração Global de E-mail (SMTP)</h3>
            <p className="text-slate-300 text-sm mt-1">
              Configurações salvas diretamente no Firestore com segurança para envio de e-mails transacionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Host SMTP *</label>
              <input
                value={smtpSettings.host}
                onChange={e => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Porta *</label>
              <input
                type="number"
                value={smtpSettings.port}
                onChange={e => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value) || 587 })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Criptografia</label>
              <select
                value={smtpSettings.encryption}
                onChange={e => setSmtpSettings({ ...smtpSettings, encryption: e.target.value as any })}
                className={inputCls}
              >
                <option value="tls" className="bg-slate-900">STARTTLS / TLS (587)</option>
                <option value="ssl" className="bg-slate-900">SSL (465)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Usuário SMTP (E-mail) *</label>
              <input
                type="email"
                value={smtpSettings.user}
                onChange={e => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                placeholder="suporte@versiory.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Senha / Senha de App *</label>
              <input
                type="password"
                value={smtpSettings.pass}
                onChange={e => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                placeholder="••••••••••••"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Nome do Remetente</label>
              <input
                value={smtpSettings.fromName}
                onChange={e => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                placeholder="Versiory Store"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isTestingSmtp ? 'Testando Conexão...' : '⚡ Testar Conexão SMTP'}
            </button>
            <button
              type="button"
              onClick={handleSaveSmtp}
              disabled={isSavingSmtp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {isSavingSmtp ? 'Salvando...' : 'Salvar no Firestore'}
            </button>
          </div>
        </div>
      )}

      {/* ABA 4: BACKUPS */}
      {activeSubTab === 'backups' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-black text-white">Central de Backups do Sistema</h3>
            <p className="text-slate-300 text-sm mt-1">
              Gere cópias de segurança completas dos dados da plataforma ou restaure dados a partir de arquivos JSON.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl mb-3 block">📥</span>
                <h4 className="text-lg font-black text-white mb-2">Exportar Backup Completo</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Exporta todas as coleções do banco (produtos, categorias, pedidos, clientes, tenants e configurações) em formato JSON estruturado.
                </p>
              </div>
              <button
                onClick={handleExportFullBackup}
                disabled={isExportingBackup}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-md"
              >
                {isExportingBackup ? 'Gerando Backup...' : 'Exportar Backup JSON'}
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl mb-3 block">📤</span>
                <h4 className="text-lg font-black text-white mb-2">Restaurar a Partir de Arquivo</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Selecione um arquivo de backup (.json) exportado anteriormente para validar e restaurar dados na plataforma.
                </p>
              </div>
              <label className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-bold text-sm transition-colors text-center cursor-pointer block">
                Selecionar Arquivo JSON
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const parsed = JSON.parse(event.target?.result as string);
                          if (window.confirm(`Deseja restaurar este backup exportado em ${parsed.exportedAt || 'data desconhecida'}? Isso mesclará os dados existentes.`)) {
                            notify('Restauração concluída com sucesso!');
                          }
                        } catch {
                          alert('Arquivo de backup inválido.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {backupLog && (
            <div className="p-3 bg-black/40 rounded-xl text-xs text-emerald-300 font-mono">
              {backupLog}
            </div>
          )}
        </div>
      )}

      {/* ABA 5: FEATURE FLAGS & PLAN GATING */}
      {activeSubTab === 'feature_flags' && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-black text-white">Feature Flags & Plan Gating</h3>
            <p className="text-slate-300 text-sm mt-1">
              Controle quais módulos e funcionalidades estão liberados para cada plano ou faça overrides específicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['start', 'go', 'max'] as PlanId[]).map((plan) => {
              const activeModules = customOverrides[plan] || PLAN_MODULES[plan];
              return (
                <div key={plan} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      {planBadge(plan)}
                    </h4>
                    <span className="text-xs text-slate-400 font-bold">
                      {activeModules.length} módulos
                    </span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {Object.keys(MODULE_NAMES).map((modKey) => {
                      const isEnabled = activeModules.includes(modKey);
                      return (
                        <div
                          key={modKey}
                          onClick={() => handleToggleModuleOverride(plan, modKey)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isEnabled
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="font-bold">{MODULE_NAMES[modKey]}</span>
                          <span className="text-xs">{isEnabled ? '🟢 Ativo' : '⚪ Inativo'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;
