// Tenant Context — resolve o tenant ativo da sessão atual.
// Ordem de resolução (síncrona):
//   1. Impersonation (DevPanel — suporte operando como uma loja)
//   2. Seleção manual do cliente (versiory_selected_tenant no localStorage)
//   3. URL pathname (ex: /loja/minha-loja/produto/123 → 'minha-loja')
//   4. Sessão admin (custom claim tenantId salvo no login)
//   5. Subdomínio (ex: loja-abc.versiory.com → 'loja-abc')
//   6. Fallback: DEFAULT_TENANT_ID (versiory-demo)

// Resolução assíncrona adicional (custom domain):
//   - getActiveTenantIdAsync() resolve customDomain via Firestore

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
    const raw = localStorage.getItem('versiory_selected_tenant');
    if (raw) {
      const t = JSON.parse(raw);
      if (t?.id) {
        console.log('[tenantContext] usando seleção do cliente:', t.id);
        return t.id;
      }
    }
  } catch { /* ignore */ }

  // 3. URL pathname (ex: /loja/minha-loja/produto/123 → 'minha-loja')
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/loja\/([^/]+)/);
    if (match?.[1]) {
      const slug = match[1];
      console.log('[tenantContext] usando URL pathname:', slug);
      return slug;
    }
  }

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

export const setSelectedTenant = (tenantId: string): void => {
  try {
    localStorage.setItem('versiory_selected_tenant', JSON.stringify({ id: tenantId, selectedAt: Date.now() }));
  } catch { /* ignore */ }
};

export const clearSelectedTenant = (): void => {
  try {
    localStorage.removeItem('versiory_selected_tenant');
  } catch { /* ignore */ }
};

export const getSelectedTenant = (): string | null => {
  try {
    const raw = localStorage.getItem('versiory_selected_tenant');
    if (raw) {
      const t = JSON.parse(raw);
      return t?.id || null;
    }
  } catch { /* ignore */ }
  return null;
};

// Resolve o tenant ativo considerando domínio personalizado (custom domain).
// Esta função é assíncrona porque precisa consultar o Firestore.
export const getActiveTenantIdAsync = async (): Promise<string> => {
  // 1. Impersonation (síncrono, prioridade máxima)
  try {
    const raw = localStorage.getItem('versiory_impersonated_tenant');
    if (raw) {
      const t = JSON.parse(raw);
      if (t?.id) return t.id;
    }
  } catch { /* ignore */ }

  // 2. Seleção manual do cliente (síncrono)
  try {
    const raw = localStorage.getItem('versiory_selected_tenant');
    if (raw) {
      const t = JSON.parse(raw);
      if (t?.id) return t.id;
    }
  } catch { /* ignore */ }

  // 3. URL pathname (ex: /loja/minha-loja/produto/123 → 'minha-loja')
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/loja\/([^/]+)/);
    if (match?.[1]) {
      console.log('[tenantContext] usando URL pathname:', match[1]);
      return match[1];
    }
  }

  // 5. Sessão admin (síncrono) — antes de subdomínio para consistência com getActiveTenantId
  try {
    const raw = localStorage.getItem('versiory_admin_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.tenantId && session.role !== 'dev') {
        console.log('[tenantContext] usando sessão admin:', session.tenantId);
        return session.tenantId;
      }
    }
  } catch { /* ignore */ }

  // 4. Subdomínio (ex: loja-abc.versiory.com → 'loja-abc')
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const parts = host.split('.');
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (!isIp && parts.length > 2 && parts[0] !== 'www') {
      console.log('[tenantContext] usando subdomínio:', parts[0]);
      return parts[0];
    }
  }

  // 6. Fallback
  return DEFAULT_TENANT_ID;
};
