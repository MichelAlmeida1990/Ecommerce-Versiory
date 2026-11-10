import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where, limit, getDoc } from 'firebase/firestore';
import { PlanId } from '../config/planConfig';

// Painel do Desenvolvedor: gestão das lojas (tenants) que assinam o sistema

const COLLECTION = 'tenants';

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface Tenant {
  id: string;                      // identificador único da loja (ex: slug)
  storeName: string;
  ownerName: string;
  email: string;
  phone?: string;
  adminUid?: string;   // UID do usuário Firebase Auth responsável (admin da loja)
  planId: PlanId;
  status: TenantStatus;
  monthlyValue: number;            // valor mensal cobrado (pode diferir do preço de tabela)
  dueDay: number;                  // dia de vencimento da mensalidade
  customDomain?: string;           // domínio personalizado (ex: minhaloja.com.br)
  subdomain?: string;              // subdomínio (ex: minhaloja para *.versiory.com)
  domainVerified?: boolean;        // se o domínio personalizado foi verificado via DNS
  domainVerifiedAt?: string;       // data da verificação do domínio
  billingConfig?: {                // config de faturamento gravada no localStorage da loja
    dueDay: number;
    value: number;
    lastPaidMonth: string;
    whatsapp: string;
    pixKey: string;
    bankDetails: string;
    paymentConfirmed: boolean;
    paymentConfirmedAt: string;
  };
  accessNotes?: string;            // anotações de suporte (senhas 2FA, observações de acesso)
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

export const getTenants = async (): Promise<Tenant[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tenant));
  } catch (e) {
    console.error('Erro ao carregar tenants:', e);
    return [];
  }
};

export const getTenantByDomain = async (domain: string): Promise<Tenant | null> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('customDomain', '==', domain),
      where('status', '==', 'active'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Tenant;
  } catch (e) {
    console.error('Erro ao buscar tenant por domínio:', e);
    return null;
  }
};

export const getTenantBySubdomain = async (subdomain: string): Promise<Tenant | null> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('subdomain', '==', subdomain),
      where('status', '==', 'active'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Tenant;
  } catch (e) {
    console.error('Erro ao buscar tenant por subdomínio:', e);
    return null;
  }
};

export const saveTenant = async (tenant: Tenant): Promise<void> => {
  const now = new Date().toISOString();
  const data = { ...tenant, updatedAt: now, createdAt: tenant.createdAt || now };
  await setDoc(doc(db, COLLECTION, tenant.id), data, { merge: true });
};

export const updateTenant = async (id: string, data: Partial<Tenant>): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: new Date().toISOString() } as any);
};

export const setTenantAdminUid = async (tenantId: string, uid: string): Promise<void> => {
  await updateTenant(tenantId, { adminUid: uid });
};

export const deleteTenant = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

// Ações rápidas de suporte
export const suspendTenant = (id: string) => updateTenant(id, { status: 'suspended' });
export const activateTenant = (id: string) => updateTenant(id, { status: 'active' });

// Extender acesso: move a data de expiração N dias à frente
export const extendTenantAccess = async (tenant: Tenant, days: number): Promise<void> => {
  const base = tenant.billingConfig?.paymentConfirmedAt
    ? new Date(tenant.billingConfig.paymentConfirmedAt)
    : new Date();
  base.setDate(base.getDate() + days);
  await updateTenant(tenant.id, {
    status: 'active',
    billingConfig: {
      ...(tenant.billingConfig || {
        dueDay: tenant.dueDay, value: tenant.monthlyValue, lastPaidMonth: '',
        whatsapp: '', pixKey: '', bankDetails: '', paymentConfirmed: false, paymentConfirmedAt: ''
      }),
      paymentConfirmed: true,
      paymentConfirmedAt: base.toISOString()
    }
  });
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada'
};

/** Cria um tenant com dados iniciais. O usuário Firebase Auth + custom claims devem ser criados no Console/Admin SDK. */
export const onboardTenant = async (tenant: Tenant): Promise<Tenant> => {
  const now = new Date().toISOString();
  const data = { ...tenant, updatedAt: now, createdAt: now, status: 'trial' };
  await setDoc(doc(db, COLLECTION, tenant.id), data, { merge: true });
  // categorias iniciais
  const defaults = ['Camisetas', 'Calças', 'Vestidos', 'Acessórios'];
  await Promise.all(defaults.map((name, i) =>
    setDoc(doc(db, COLLECTION, tenant.id, 'categories', `cat-${i}`), { id: `cat-${i}`, name, tenantId: tenant.id, createdAt: now }, { merge: true })
  ));
  // Criar authorizedUser se houver adminUid
  if (tenant.adminUid) {
    await addAuthorizedUser(tenant.id, tenant.adminUid, 'admin');
  }
  return data as Tenant;
};

export const TENANT_STATUS_COLORS: Record<TenantStatus, string> = {
  trial: 'bg-blue-600',
  active: 'bg-emerald-600',
  suspended: 'bg-amber-600',
  cancelled: 'bg-red-600'
};

// ---- Solicitações de Onboarding (aprovação manual via DevPanel) ----

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';

export interface PendingOnboarding {
  id: string;                      // docId gerado pelo Firestore
  storeName: string;
  ownerName: string;
  email: string;
  phone?: string;
  subdomain: string;
  customDomain?: string;
  planId: PlanId;
  monthlyValue: number;
  dueDay: number;
  status: OnboardingStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;             // UID do admin que aprovou/rejeitou
  rejectionReason?: string;
  adminUid?: string;               // UID do Firebase Auth criado após aprovação
  tenantId?: string;               // ID do tenant criado após aprovação
}

const PENDING_COLLECTION = 'pending_onboardings';

export const createPendingOnboarding = async (data: Omit<PendingOnboarding, 'id' | 'status' | 'createdAt'>): Promise<string> => {
  const now = new Date().toISOString();
  const docRef = doc(collection(db, PENDING_COLLECTION));
  await setDoc(docRef, {
    ...data,
    status: 'pending',
    createdAt: now
  });
  return docRef.id;
};

export const getPendingOnboardings = async (): Promise<PendingOnboarding[]> => {
  try {
    const q = query(collection(db, PENDING_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingOnboarding));
  } catch (e) {
    console.error('Erro ao carregar solicitações de onboarding:', e);
    return [];
  }
};

export const approvePendingOnboarding = async (
  pendingId: string,
  adminUid: string,
  tenantId: string
): Promise<void> => {
  const now = new Date().toISOString();
  await updateDoc(doc(db, PENDING_COLLECTION, pendingId), {
    status: 'approved',
    reviewedAt: now,
    reviewedBy: adminUid,
    adminUid,
    tenantId
  });
};

export const rejectPendingOnboarding = async (
  pendingId: string,
  adminUid: string,
  reason?: string
): Promise<void> => {
  const now = new Date().toISOString();
  await updateDoc(doc(db, PENDING_COLLECTION, pendingId), {
    status: 'rejected',
    reviewedAt: now,
    reviewedBy: adminUid,
    rejectionReason: reason || ''
  });
};

// ---- Gerenciamento de Usuários Autorizados por Tenant (fonte de verdade para regras) ----

export const addAuthorizedUser = async (tenantId: string, uid: string, role: 'admin' | 'seller' | 'dev'): Promise<void> => {
  await setDoc(doc(db, COLLECTION, tenantId, 'authorizedUsers', uid), {
    uid,
    role,
    tenantId,
    createdAt: new Date().toISOString()
  }, { merge: true });
};

export const removeAuthorizedUser = async (tenantId: string, uid: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, tenantId, 'authorizedUsers', uid));
};

export const getAuthorizedUsers = async (tenantId: string): Promise<{ uid: string; role: string; tenantId: string }[]> => {
  try {
    const q = query(collection(db, COLLECTION, tenantId, 'authorizedUsers'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as { uid: string; role: string; tenantId: string }));
  } catch (e) {
    console.error('Erro ao carregar usuários autorizados:', e);
    return [];
  }
};

export const getUserRoleInTenant = async (tenantId: string, uid: string): Promise<string | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, tenantId, 'authorizedUsers', uid));
    if (!snap.exists()) return null;
    return snap.data().role || null;
  } catch (e) {
    console.error('Erro ao buscar role do usuário no tenant:', e);
    return null;
  }
};
