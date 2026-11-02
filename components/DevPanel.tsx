import React, { useEffect, useState } from 'react';
import {
  Tenant, TenantStatus, getTenants, saveTenant, updateTenant, deleteTenant,
  suspendTenant, activateTenant, extendTenantAccess,
  TENANT_STATUS_LABELS, TENANT_STATUS_COLORS
} from '../services/tenantService';
import { PlanId, PLAN_LABELS, PLAN_PRICES } from '../config/planConfig';
import { getSubscriptions, updateSubscription, deleteSubscription } from '../services/subscriptionService';
import { Subscription } from '../types';

// Painel do Desenvolvedor: gestão de assinaturas/lojas, acessos e suporte

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

const DevPanel: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const reload = async () => {
    setLoading(true);
    const [t, s] = await Promise.all([getTenants(), getSubscriptions()]);
    setTenants(t);
    setSubscriptions(s);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.storeName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.ownerName.toLowerCase().includes(q);
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

  const planBadge = (p: PlanId) => {
    const colors: Record<PlanId, string> = { start: 'bg-sky-600', go: 'bg-violet-600', max: 'bg-gold-600 bg-amber-500' };
    return <span className={`${colors[p] || 'bg-slate-600'} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{PLAN_LABELS[p] || p}</span>;
  };

  const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm">
          {toast}
        </div>
      )}

      {/* Cabeçalho + métricas */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">⚡</span> Central do Desenvolvedor
            </h2>
            <p className="text-slate-300 text-sm mt-1">Gestão de assinaturas, lojas clientes e acessos de suporte.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reload} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/20">🔄 Recarregar</button>
            <button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold">+ Nova Loja</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
            <div className="text-2xl font-black text-emerald-400">R$ {mrr.toFixed(2)}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">MRR (lojas ativas)</div>
          </div>
          <div className="bg-sky-500/10 rounded-xl p-4 border border-sky-500/30">
            <div className="text-2xl font-black text-sky-400">{byStatus('active')}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Lojas ativas</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
            <div className="text-2xl font-black text-blue-300">{byStatus('trial')}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Em trial</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
            <div className="text-2xl font-black text-amber-400">{byStatus('suspended') + pendingSubs.length}</div>
            <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Pendências ({byStatus('suspended')} susp. / {pendingSubs.length} aprovar)</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 Buscar por loja, dono ou e-mail..." className={`${inputCls} max-w-xs`} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={`${inputCls} max-w-[200px]`}>
          <option value="all">Todos os status</option>
          {(Object.keys(TENANT_STATUS_LABELS) as TenantStatus[]).map(s => (
            <option key={s} value={s}>{TENANT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <span className="text-slate-400 text-sm">{filtered.length} loja(s)</span>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={submitForm} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 space-y-4">
          <h3 className="text-lg font-black text-white">{form.id && tenants.some(t => t.id === form.id) ? 'Editar Loja' : 'Nova Loja Cliente'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Identificador (ID único) *</label>
              <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value.trim().toLowerCase() })} placeholder="ex: loja-do-joao" className={inputCls} disabled={!!form.id && tenants.some(t => t.id === form.id)} />
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
              <select value={form.planId} onChange={e => {
                const p = e.target.value as PlanId;
                setForm({ ...form, planId: p, monthlyValue: PLAN_PRICES[p] });
              }} className={inputCls}>
                {(Object.keys(PLAN_LABELS) as PlanId[]).map(p => (
                  <option key={p} value={p}>{PLAN_LABELS[p]} — R$ {PLAN_PRICES[p].toFixed(2)}/mês</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TenantStatus })} className={inputCls}>
                {(Object.keys(TENANT_STATUS_LABELS) as TenantStatus[]).map(s => (
                  <option key={s} value={s}>{TENANT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Valor mensal (R$)</label>
              <input type="number" step="0.01" value={form.monthlyValue} onChange={e => setForm({ ...form, monthlyValue: parseFloat(e.target.value) || 0 })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Dia de vencimento</label>
              <input type="number" min={1} max={28} value={form.dueDay} onChange={e => setForm({ ...form, dueDay: parseInt(e.target.value) || 15 })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Dados de acesso (senhas 2FA, contas, etc.) — use com cuidado</label>
            <textarea value={form.accessNotes} onChange={e => setForm({ ...form, accessNotes: e.target.value })} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Anotações de suporte</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/20">Cancelar</button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold">Salvar Loja</button>
          </div>
        </form>
      )}

      {/* Lista de lojas */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <h3 className="text-lg font-black text-white mb-4">Lojas Clientes</h3>
        {loading ? (
          <div className="text-center text-slate-400 py-8">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Nenhuma loja cadastrada ainda. Clique em "+ Nova Loja" para cadastrar a primeira.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-200">
              <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-3 py-2">Loja</th>
                  <th className="px-3 py-2">Contato</th>
                  <th className="px-3 py-2">Plano / Valor</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Venc.</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2">
                      <div className="font-bold text-white">{t.storeName}</div>
                      <div className="text-xs text-slate-400">{t.id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{t.ownerName || '-'}</div>
                      <div className="text-xs text-slate-400">{t.email}{t.phone ? ` • ${t.phone}` : ''}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">{planBadge(t.planId)} <span className="text-slate-300">R$ {(t.monthlyValue || 0).toFixed(2)}/mês</span></div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`${TENANT_STATUS_COLORS[t.status]} text-white text-xs font-bold px-2 py-1 rounded-full`}>{TENANT_STATUS_LABELS[t.status]}</span>
                    </td>
                    <td className="px-3 py-2">Dia {t.dueDay}</td>
                    <td className="px-3 py-2 flex gap-2 flex-wrap">
                      <button onClick={() => openEdit(t)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs border border-white/20">Editar</button>
                      {t.status !== 'active' && (
                        <button onClick={async () => { await activateTenant(t.id); await reload(); notify('Loja ativada.'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs">Ativar</button>
                      )}
                      {t.status === 'active' && (
                        <button onClick={async () => { await suspendTenant(t.id); await reload(); notify('Loja suspensa.'); }} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs">Suspender</button>
                      )}
                      <select onChange={async (e) => {
                        const days = parseInt(e.target.value); if (!days) return;
                        e.target.value = '';
                        if (!window.confirm(`Estender o acesso de "${t.storeName}" por ${days} dias?`)) return;
                        await extendTenantAccess(t, days);
                        await reload();
                        notify(`Acesso estendido em ${days} dias.`);
                      }} className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/20">
                        <option value="">+ Acesso</option>
                        <option value="7">+7 dias</option>
                        <option value="15">+15 dias</option>
                        <option value="30">+30 dias</option>
                      </select>
                      <button onClick={() => handleDelete(t)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Solicitações de assinatura (e-commerce) */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <h3 className="text-lg font-black text-white mb-4">Solicitações de Assinatura (loja virtual)</h3>
        {subscriptions.length === 0 ? (
          <div className="text-center text-slate-400 py-8">Nenhuma solicitação registrada.</div>
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
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="px-3 py-2">{s.userId}</td>
                    <td className="px-3 py-2">{planBadge(s.planId)}</td>
                    <td className="px-3 py-2">{s.status}</td>
                    <td className="px-3 py-2">R$ {(s.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{s.requestedAt ? new Date(s.requestedAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-3 py-2 flex gap-2 flex-wrap">
                      {s.status === 'pending' && (
                        <button onClick={() => renewSub(s)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs">Aprovar / Renovar</button>
                      )}
                      <button onClick={() => removeSub(s)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevPanel;
