// Tenant Context — resolve o tenant ativo da sessão atual.
// Ordem de resolução:
//   1. Impersonation (DevPanel — suporte operando como uma loja)
//   2. Sessão admin (custom claim tenantId salvo no login)
//   3. Subdomínio (ex: loja-abc.versiory.com → 'loja-abc')
//   4. Fallback: DEFAULT_TENANT_ID (versiory-demo)

// Tenant Context — resolve o tenant ativo da sessão atual.

const DEFAULT_TENANT_ID = 'versiory-demo';

export const DEFAULT_TENANT_ID_LOCAL = DEFAULT_TENANT_ID;

export const getActiveTenantId = (): string => {
  try {
    const raw = localStorage.getItem('versiory_impersonated_tenant');
    if (raw) {
      const t = JSON.parse(raw);
      if (t?.id) {
        console.log('[tenantContext] usando impersonação:', t.id);
        return t.id;
      }
    }
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem('versiory_admin_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.tenantId && session.role !== 'dev') {
        console.log('[tenantContext] usando sessão admin:', session.tenantId, '(role:', session.role + ')');
        return session.tenantId;
      }
      console.log('[tenantContext] sessão admin sem tenantId válido. role:', session?.role, 'tenantId:', session?.tenantId);
    }
  } catch { /* ignore */ }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Ignora IPs (ex.: 192.168.x.x) — não são subdomínios de tenant
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    const parts = host.split('.');
    if (!isIp && parts.length > 2 && parts[0] !== 'www') {
      console.log('[tenantContext] usando subdomínio:', parts[0]);
      return parts[0];
    }
  }

  console.log('[tenantContext] fallback DEFAULT:', DEFAULT_TENANT_ID);
  return DEFAULT_TENANT_ID;
};
