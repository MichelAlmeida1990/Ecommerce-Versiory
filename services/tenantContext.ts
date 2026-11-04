// Tenant Context — resolve o tenant ativo da sessão atual.
// Ordem de resolução:
//   1. Impersonation (DevPanel — suporte operando como uma loja)
//   2. Sessão admin (custom claim tenantId salvo no login)
//   3. Subdomínio (ex: loja-abc.versiory.com → 'loja-abc')
//   4. Fallback: DEFAULT_TENANT_ID (versiory-demo)

import { DEFAULT_TENANT_ID } from './firebase';
import { getAdminSession } from './firebase';
import type { Tenant } from './tenantService';

const IMPERSONATION_KEY = 'versiory_impersonated_tenant';

/** Tenant ativo via impersonation do painel dev (se houver) */
export const getImpersonatedTenant = (): Tenant | null => {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    return raw ? (JSON.parse(raw) as Tenant) : null;
  } catch {
    return null;
  }
};

export const stopImpersonation = () => {
  localStorage.removeItem(IMPERSONATION_KEY);
};

/**
 * Retorna o tenantId ativo. Use este valor em todas as chamadas
 * de Firestore — nunca hardcode um tenantId.
 */
export const getActiveTenantId = (): string => {
  // 1. Impersonation do dev tem prioridade
  const impersonated = getImpersonatedTenant();
  if (impersonated?.id) return impersonated.id;

  // 2. Sessão admin (sincronizado — getAdminSession é async, então
  //    lemos o localStorage diretamente; mesma chave/fonte)
  try {
    const raw = localStorage.getItem('versiory_admin_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.tenantId && session.role !== 'dev') return session.tenantId;
    }
  } catch {
    // ignore — cai no fallback
  }

  // 3. Subdomínio: loja-abc.versiory.com → 'loja-abc'
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const parts = host.split('.');
    // Wildcard *.{dominio-de-2-niveis} — ignora localhost / domínio raiz
    if (parts.length > 2 && parts[0] !== 'www') return parts[0];
  }

  // 4. Fallback
  return DEFAULT_TENANT_ID;
};
